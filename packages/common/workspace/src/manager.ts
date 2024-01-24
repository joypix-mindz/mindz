import { DebugLogger } from '@affine/debug';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { assertEquals } from '@blocksuite/global/utils';
import type { Workspace as BlockSuiteWorkspace } from '@blocksuite/store';
import { fixWorkspaceVersion } from '@toeverything/infra/blocksuite';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';

import type { WorkspaceFactory } from './factory';
import type { BlobStorage } from './index';
import type { WorkspaceList } from './list';
import type { WorkspaceMetadata } from './metadata';
import { WorkspacePool } from './pool';
import type { Workspace } from './workspace';

const logger = new DebugLogger('affine:workspace-manager');

/**
 * # `WorkspaceManager`
 *
 * This class acts as the central hub for managing various aspects of workspaces.
 * It is structured as follows:
 *
 * ```
 *                ┌───────────┐
 *                │ Workspace │
 *                │  Manager  │
 *                └─────┬─────┘
 *        ┌─────────────┼─────────────┐
 *    ┌───┴───┐     ┌───┴───┐   ┌─────┴─────┐
 *    │ List  │     │ Pool  │   │ Factories │
 *    └───────┘     └───────┘   └───────────┘
 * ```
 *
 * Manage every about workspace
 *
 * # List
 *
 * The `WorkspaceList` component stores metadata for all workspaces, also include workspace avatar and custom name.
 *
 * # Factories
 *
 * This class contains a collection of `WorkspaceFactory`,
 * We utilize `metadata.flavour` to identify the appropriate factory for opening a workspace.
 * Once opened, workspaces are stored in the `WorkspacePool`.
 *
 * # Pool
 *
 * The `WorkspacePool` use reference counting to manage active workspaces.
 * Calling `use()` to create a reference to the workspace. Calling `release()` to release the reference.
 * When the reference count is 0, it will close the workspace.
 *
 */
export class WorkspaceManager {
  pool: WorkspacePool = new WorkspacePool();

  constructor(
    public list: WorkspaceList,
    public factories: WorkspaceFactory[]
  ) {}

  /**
   * get workspace reference by metadata.
   *
   * You basically don't need to call this function directly, use the react hook `useWorkspace(metadata)` instead.
   *
   * @returns the workspace reference and a release function, don't forget to call release function when you don't
   * need the workspace anymore.
   */
  use(metadata: WorkspaceMetadata): {
    workspace: Workspace;
    release: () => void;
  } {
    const exist = this.pool.get(metadata.id);
    if (exist) {
      return exist;
    }

    const workspace = this.open(metadata);
    const ref = this.pool.put(workspace);

    return ref;
  }

  createWorkspace(
    flavour: WorkspaceFlavour,
    initial: (
      workspace: BlockSuiteWorkspace,
      blobStorage: BlobStorage
    ) => Promise<void>
  ): Promise<string> {
    logger.info(`create workspace [${flavour}]`);
    return this.list.create(flavour, initial);
  }

  /**
   * delete workspace by metadata, same as `WorkspaceList.deleteWorkspace`
   */
  async deleteWorkspace(metadata: WorkspaceMetadata) {
    await this.list.delete(metadata);
  }

  /**
   * helper function to transform local workspace to cloud workspace
   */
  async transformLocalToCloud(local: Workspace): Promise<WorkspaceMetadata> {
    assertEquals(local.flavour, WorkspaceFlavour.LOCAL);

    await local.engine.sync.waitForSynced();

    const newId = await this.list.create(
      WorkspaceFlavour.AFFINE_CLOUD,
      async (ws, bs) => {
        applyUpdate(ws.doc, encodeStateAsUpdate(local.blockSuiteWorkspace.doc));

        for (const subdoc of local.blockSuiteWorkspace.doc.getSubdocs()) {
          for (const newSubdoc of ws.doc.getSubdocs()) {
            if (newSubdoc.guid === subdoc.guid) {
              applyUpdate(newSubdoc, encodeStateAsUpdate(subdoc));
            }
          }
        }

        const blobList = await local.engine.blob.list();

        for (const blobKey of blobList) {
          const blob = await local.engine.blob.get(blobKey);
          if (blob) {
            await bs.set(blobKey, blob);
          }
        }
      }
    );

    await this.list.delete(local.meta);

    return {
      id: newId,
      flavour: WorkspaceFlavour.AFFINE_CLOUD,
    };
  }

  /**
   * helper function to get blob without open workspace, its be used for download workspace avatars.
   */
  getWorkspaceBlob(metadata: WorkspaceMetadata, blobKey: string) {
    const factory = this.factories.find(x => x.name === metadata.flavour);
    if (!factory) {
      throw new Error(`Unknown workspace flavour: ${metadata.flavour}`);
    }
    return factory.getWorkspaceBlob(metadata.id, blobKey);
  }

  private open(metadata: WorkspaceMetadata) {
    logger.info(`open workspace [${metadata.flavour}] ${metadata.id} `);
    const factory = this.factories.find(x => x.name === metadata.flavour);
    if (!factory) {
      throw new Error(`Unknown workspace flavour: ${metadata.flavour}`);
    }
    const workspace = factory.openWorkspace(metadata);

    // sync information with workspace list, when workspace's avatar and name changed, information will be updated
    this.list.getInformation(metadata).syncWithWorkspace(workspace);

    // apply compatibility fix
    fixWorkspaceVersion(workspace.blockSuiteWorkspace.doc);

    return workspace;
  }
}
