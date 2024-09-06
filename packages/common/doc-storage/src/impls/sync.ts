import type {
  DocRecord,
  DocStorageOptions,
  DocUpdate,
  Editor,
} from '../storage';
import { DocStorage } from '../storage';

export interface AutoSynchronizerDocStorageOptions extends DocStorageOptions {
  main: DocStorage;
  followers: DocStorage[];
}

export class AutoSynchronizerDocStorage extends DocStorage<AutoSynchronizerDocStorageOptions> {
  disposes = [] as (() => void)[];

  get main() {
    return this.options.main;
  }

  get followers() {
    return this.options.followers;
  }

  constructor(options: AutoSynchronizerDocStorageOptions) {
    super(options);
  }

  override async connect(): Promise<void> {
    await this.main.connect();
    this.iterateFollowers(async follower => {
      await follower.connect();
    });

    this.startSync();
  }

  override async disconnect(): Promise<void> {
    this.disposes.forEach(dispose => dispose());
    this.disposes = [];

    await this.main.disconnect();
    this.iterateFollowers(async follower => {
      await follower.disconnect();
    });
  }

  private startSync() {
    this.iterateFollowers(async follower => {
      this.disposes.push(
        follower.onReceiveDocUpdates((docId, updates, timestamp) => {
          this.main.pushDocUpdates(docId, updates).catch(console.error);
          this.dispatchDocUpdatesListeners(docId, updates, timestamp);
        })
      );

      await this.sync(follower);
    });
  }

  async sync(_follower: DocStorage) {
    // 1. get stored follower oldest clock
    // const lastSeen = this.main.peerClocks(_follower.name)
    // 2. get peer clocks
    // const clocks = _follower.getSpaceDocTimestamps(after)
    // 3. fetch outdated diffs
    // _follower.getDocDiff()
    // 4. push pending updates
    // _follower.pushDocUpdates()
  }

  async pushDocUpdates(docId: string, updates: Uint8Array[]): Promise<number> {
    const cnt = await this.main.pushDocUpdates(docId, updates);

    this.iterateFollowers(async follower => {
      await follower.pushDocUpdates(docId, updates);
    });

    return cnt;
  }

  protected override dispatchDocUpdatesListeners(
    docId: string,
    updates: Uint8Array[],
    timestamp: number
  ): void {
    this.updatesListeners.forEach(cb => {
      cb(docId, updates, timestamp);
    });
  }

  async deleteDoc(docId: string): Promise<void> {
    await this.main.deleteDoc(docId);
    this.iterateFollowers(async follower => {
      await follower.deleteDoc(docId);
    });
  }

  async deleteSpace(): Promise<void> {
    await this.main.deleteSpace();
    this.iterateFollowers(async follower => {
      await follower.deleteSpace();
    });
  }

  getSpaceDocTimestamps(
    after?: number
  ): Promise<Record<string, number> | null> {
    return this.main.getSpaceDocTimestamps(after);
  }

  listDocHistories(
    docId: string,
    query: { skip?: number; limit?: number }
  ): Promise<{ timestamp: number; editor: Editor | null }[]> {
    return this.main.listDocHistories(docId, query);
  }

  getDocHistory(docId: string, timestamp: number): Promise<DocRecord | null> {
    return this.main.getDocHistory(docId, timestamp);
  }

  protected getDocSnapshot(): Promise<DocRecord | null> {
    return Promise.resolve(null);
  }
  protected setDocSnapshot(): Promise<boolean> {
    return Promise.resolve(false);
  }
  protected getDocUpdates(): Promise<DocUpdate[]> {
    return Promise.resolve([]);
  }
  protected markUpdatesMerged(): Promise<number> {
    return Promise.resolve(0);
  }
  protected createDocHistory(): Promise<boolean> {
    return Promise.resolve(false);
  }

  iterateFollowers(cb: (follower: DocStorage) => Promise<void>) {
    const iterate = async () => {
      const result = await Promise.allSettled(this.followers.map(cb));

      for (const res of result) {
        // error handling
        if (res.status === 'rejected') {
          console.error(res.reason);
        }
      }
    };

    iterate().catch(() => {
      /* never throw */
    });
  }
}
