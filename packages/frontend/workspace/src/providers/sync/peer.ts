import { DebugLogger } from '@affine/debug';
import { Slot } from '@blocksuite/global/utils';
import { isEqual } from '@blocksuite/global/utils';
import type { Doc } from 'yjs';
import { applyUpdate, encodeStateAsUpdate, encodeStateVector } from 'yjs';

import type { Storage } from '../storage';
import { AsyncQueue } from '../utils/async-queue';
import { throwIfAborted } from '../utils/throw-if-aborted';
import { MANUALLY_STOP } from './engine';

export enum SyncPeerStep {
  Stopped = 0,
  Retrying = 1,
  LoadingRootDoc = 2,
  LoadingSubDoc = 3,
  Loaded = 4.5,
  Syncing = 5,
  Synced = 6,
}

export interface SyncPeerStatus {
  step: SyncPeerStep;
  totalDocs: number;
  loadedDocs: number;
  pendingPullUpdates: number;
  pendingPushUpdates: number;
}

/**
 * # SyncPeer
 * A SyncPeer is responsible for syncing one Storage with one Y.Doc and its subdocs.
 *
 * ```
 *                    ┌─────┐
 *                    │Start│
 *                    └──┬──┘
 *                       │
 *    ┌──────┐     ┌─────▼──────┐        ┌────┐
 *    │listen◄─────┤pull rootdoc│        │peer│
 *    └──┬───┘     └─────┬──────┘        └──┬─┘
 *       │               │ onLoad()         │
 *    ┌──▼───┐     ┌─────▼──────┐      ┌────▼────┐
 *    │listen◄─────┤pull subdocs│      │subscribe│
 *    └──┬───┘     └─────┬──────┘      └────┬────┘
 *       │               │ onReady()        │
 *    ┌──▼──┐      ┌─────▼───────┐       ┌──▼──┐
 *    │queue├──────►apply updates◄───────┤queue│
 *    └─────┘      └─────────────┘       └─────┘
 * ```
 *
 * listen: listen for updates from ydoc, typically from user modifications.
 * subscribe: listen for updates from storage, typically from other users.
 *
 */
export class SyncPeer {
  private _status: SyncPeerStatus = {
    step: SyncPeerStep.LoadingRootDoc,
    totalDocs: 1,
    loadedDocs: 0,
    pendingPullUpdates: 0,
    pendingPushUpdates: 0,
  };
  onStatusChange = new Slot<SyncPeerStatus>();
  abort = new AbortController();
  get name() {
    return this.storage.name;
  }
  logger = new DebugLogger('affine:sync-peer:' + this.name);

  constructor(
    private rootDoc: Doc,
    private storage: Storage
  ) {
    this.logger.debug('peer start');

    this.syncRetryLoop(this.abort.signal).catch(err => {
      // should not reach here
      console.error(err);
    });
  }

  private set status(s: SyncPeerStatus) {
    if (!isEqual(s, this._status)) {
      this.logger.debug('status change', s);
      this._status = s;
      this.onStatusChange.emit(s);
    }
  }

  get status() {
    return this._status;
  }

  /**
   * stop sync
   *
   * SyncPeer is one-time use, this peer should be discarded after call stop().
   */
  stop() {
    this.logger.debug('peer stop');
    this.abort.abort(MANUALLY_STOP);
  }

  /**
   * auto retry after 5 seconds if sync failed
   */
  async syncRetryLoop(abort: AbortSignal) {
    while (abort.aborted === false) {
      try {
        await this.sync(abort);
      } catch (err) {
        if (err === MANUALLY_STOP) {
          return;
        }

        this.logger.error('sync error', err);
      }
      try {
        this.logger.error('retry after 5 seconds');
        this.status = {
          step: SyncPeerStep.Retrying,
          totalDocs: 1,
          loadedDocs: 0,
          pendingPullUpdates: 0,
          pendingPushUpdates: 0,
        };
        await Promise.race([
          new Promise<void>(resolve => {
            setTimeout(resolve, 5 * 1000);
          }),
          new Promise((_, reject) => {
            // exit if manually stopped
            if (abort.aborted) {
              reject(abort.reason);
            }
            abort.addEventListener('abort', () => {
              reject(abort.reason);
            });
          }),
        ]);
      } catch (err) {
        if (err === MANUALLY_STOP) {
          return;
        }

        // should never reach here
        throw err;
      }
    }
  }

  private state: {
    connectedDocs: Map<string, Doc>;
    pushUpdatesQueue: AsyncQueue<{
      docId: string;
      data: Uint8Array;
    }>;
    pushingUpdate: boolean;
    pullUpdatesQueue: AsyncQueue<{
      docId: string;
      data: Uint8Array;
    }>;
    subdocLoading: boolean;
    subdocsLoadQueue: AsyncQueue<Doc>;
  } = {
    connectedDocs: new Map(),
    pushUpdatesQueue: new AsyncQueue(),
    pushingUpdate: false,
    pullUpdatesQueue: new AsyncQueue(),
    subdocLoading: false,
    subdocsLoadQueue: new AsyncQueue(),
  };

  initState() {
    this.state.connectedDocs.clear();
    this.state.pushUpdatesQueue.clear();
    this.state.pullUpdatesQueue.clear();
    this.state.subdocsLoadQueue.clear();
    this.state.pushingUpdate = false;
    this.state.subdocLoading = false;
  }

  /**
   * main synchronization logic
   */
  async sync(abortOuter: AbortSignal) {
    this.initState();
    const abortInner = new AbortController();

    abortOuter.addEventListener('abort', reason => {
      abortInner.abort(reason);
    });

    let dispose: (() => void) | null = null;
    try {
      this.reportSyncStatus();

      // start listen storage updates
      dispose = await this.storage.subscribe(
        this.handleStorageUpdates,
        reason => {
          // abort if storage disconnect, should trigger retry loop
          abortInner.abort('subscribe disconnect:' + reason);
        }
      );
      throwIfAborted(abortInner.signal);

      // Step 1: load root doc
      await this.connectDoc(this.rootDoc, abortInner.signal);

      // Step 2: load subdocs
      this.state.subdocsLoadQueue.push(
        ...Array.from(this.rootDoc.getSubdocs())
      );
      this.reportSyncStatus();

      this.rootDoc.on('subdocs', this.handleSubdocsUpdate);

      // Finally: start sync
      await Promise.all([
        // load subdocs
        (async () => {
          while (throwIfAborted(abortInner.signal)) {
            const subdoc = await this.state.subdocsLoadQueue.next(
              abortInner.signal
            );
            this.state.subdocLoading = true;
            this.reportSyncStatus();
            await this.connectDoc(subdoc, abortInner.signal);
            this.state.subdocLoading = false;
            this.reportSyncStatus();
          }
        })(),
        // pull updates
        (async () => {
          while (throwIfAborted(abortInner.signal)) {
            const { docId, data } = await this.state.pullUpdatesQueue.next(
              abortInner.signal
            );
            // don't apply empty data or Uint8Array([0, 0])
            if (
              !(
                data.byteLength === 0 ||
                (data.byteLength === 2 && data[0] === 0 && data[1] === 0)
              )
            ) {
              const subdoc = this.state.connectedDocs.get(docId);
              if (subdoc) {
                applyUpdate(subdoc, data, this.name);
              }
            }
            this.reportSyncStatus();
          }
        })(),
        // push updates
        (async () => {
          while (throwIfAborted(abortInner.signal)) {
            const { docId, data } = await this.state.pushUpdatesQueue.next(
              abortInner.signal
            );
            this.state.pushingUpdate = true;
            this.reportSyncStatus();

            // don't push empty data or Uint8Array([0, 0])
            if (
              !(
                data.byteLength === 0 ||
                (data.byteLength === 2 && data[0] === 0 && data[1] === 0)
              )
            ) {
              await this.storage.push(docId, data);
            }

            this.state.pushingUpdate = false;
            this.reportSyncStatus();
          }
        })(),
      ]);
    } finally {
      dispose?.();
      for (const docs of this.state.connectedDocs.values()) {
        this.disconnectDoc(docs);
      }
      this.rootDoc.off('subdocs', this.handleSubdocsUpdate);
    }
  }

  async connectDoc(doc: Doc, abort: AbortSignal) {
    const { data: docData, state: inStorageState } =
      (await this.storage.pull(doc.guid, encodeStateVector(doc))) ?? {};
    throwIfAborted(abort);

    if (docData) {
      applyUpdate(doc, docData, 'load');
    }

    // diff root doc and in-storage, save updates to pendingUpdates
    this.state.pushUpdatesQueue.push({
      docId: doc.guid,
      data: encodeStateAsUpdate(doc, inStorageState),
    });

    this.state.connectedDocs.set(doc.guid, doc);

    // start listen root doc changes
    doc.on('update', this.handleYDocUpdates);

    // mark rootDoc as loaded
    doc.emit('sync', [true]);

    this.reportSyncStatus();
  }

  disconnectDoc(doc: Doc) {
    doc.off('update', this.handleYDocUpdates);
    this.state.connectedDocs.delete(doc.guid);
    this.reportSyncStatus();
  }

  // handle updates from ydoc
  handleYDocUpdates = (update: Uint8Array, origin: string, doc: Doc) => {
    // don't push updates from storage
    if (origin === this.name) {
      return;
    }
    this.state.pushUpdatesQueue.push({
      docId: doc.guid,
      data: update,
    });
    this.reportSyncStatus();
  };

  // handle subdocs changes, append new subdocs to queue, remove subdocs from queue
  handleSubdocsUpdate = ({
    added,
    removed,
  }: {
    added: Set<Doc>;
    removed: Set<Doc>;
  }) => {
    for (const subdoc of added) {
      this.state.subdocsLoadQueue.push(subdoc);
    }

    for (const subdoc of removed) {
      this.disconnectDoc(subdoc);
      this.state.subdocsLoadQueue.remove(doc => doc === subdoc);
    }
    this.reportSyncStatus();
  };

  // handle updates from storage
  handleStorageUpdates = (docId: string, data: Uint8Array) => {
    this.state.pullUpdatesQueue.push({
      docId,
      data,
    });
    this.reportSyncStatus();
  };

  reportSyncStatus() {
    let step;
    if (this.state.connectedDocs.size === 0) {
      step = SyncPeerStep.LoadingRootDoc;
    } else if (this.state.subdocsLoadQueue.length || this.state.subdocLoading) {
      step = SyncPeerStep.LoadingSubDoc;
    } else if (
      this.state.pullUpdatesQueue.length ||
      this.state.pushUpdatesQueue.length ||
      this.state.pushingUpdate
    ) {
      step = SyncPeerStep.Syncing;
    } else {
      step = SyncPeerStep.Synced;
    }

    this.status = {
      step: step,
      totalDocs:
        this.state.connectedDocs.size + this.state.subdocsLoadQueue.length,
      loadedDocs: this.state.connectedDocs.size,
      pendingPullUpdates:
        this.state.pullUpdatesQueue.length + (this.state.subdocLoading ? 1 : 0),
      pendingPushUpdates:
        this.state.pushUpdatesQueue.length + (this.state.pushingUpdate ? 1 : 0),
    };
  }

  async waitForSynced(abort?: AbortSignal) {
    if (this.status.step >= SyncPeerStep.Synced) {
      return;
    } else {
      return Promise.race([
        new Promise<void>(resolve => {
          this.onStatusChange.on(status => {
            if (status.step >= SyncPeerStep.Synced) {
              resolve();
            }
          });
        }),
        new Promise((_, reject) => {
          if (abort?.aborted) {
            reject(abort?.reason);
          }
          abort?.addEventListener('abort', () => {
            reject(abort.reason);
          });
        }),
      ]);
    }
  }

  async waitForLoaded(abort?: AbortSignal) {
    if (this.status.step > SyncPeerStep.Loaded) {
      return;
    } else {
      return Promise.race([
        new Promise<void>(resolve => {
          this.onStatusChange.on(status => {
            if (status.step > SyncPeerStep.Loaded) {
              resolve();
            }
          });
        }),
        new Promise((_, reject) => {
          if (abort?.aborted) {
            reject(abort?.reason);
          }
          abort?.addEventListener('abort', () => {
            reject(abort.reason);
          });
        }),
      ]);
    }
  }
}
