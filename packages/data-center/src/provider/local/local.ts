import { BaseProvider } from '../base.js';
import type { ProviderConstructorParams } from '../base';
import { varStorage as storage } from 'lib0/storage';
import { Workspace as WS, WorkspaceMeta } from '../../types';
import { Workspace, uuidv4 } from '@blocksuite/store';
import { IndexedDBProvider } from '../indexeddb.js';
import assert from 'assert';
import { getDefaultHeadImgBlob } from '../../utils/index.js';

const WORKSPACE_KEY = 'workspaces';

export class LocalProvider extends BaseProvider {
  public id = 'local';
  private _idbMap: Map<string, IndexedDBProvider> = new Map();

  constructor(params: ProviderConstructorParams) {
    super(params);
    this.loadWorkspaces();
  }

  private _storeWorkspaces(workspaces: WS[]) {
    storage.setItem(WORKSPACE_KEY, JSON.stringify(workspaces));
  }

  private async _initWorkspaceDb(workspace: Workspace) {
    assert(workspace.room);
    let idb = this._idbMap.get(workspace.room);
    idb?.destroy();
    idb = new IndexedDBProvider(workspace.room, workspace.doc);
    this._idbMap.set(workspace.room, idb);
    this._logger('Local data loaded');
    return idb;
  }

  public override async warpWorkspace(
    workspace: Workspace
  ): Promise<Workspace> {
    assert(workspace.room);
    await this._initWorkspaceDb(workspace);
    return workspace;
  }

  override loadWorkspaces(): Promise<WS[]> {
    const workspaceStr = storage.getItem(WORKSPACE_KEY);
    let workspaces: WS[] = [];
    if (workspaceStr) {
      try {
        workspaces = JSON.parse(workspaceStr) as WS[];
        workspaces.forEach(workspace => {
          this._workspaces.add(workspace);
        });
      } catch (error) {
        this._logger(`Failed to parse workspaces from storage`);
      }
    }
    return Promise.resolve(workspaces);
  }

  public override async deleteWorkspace(id: string): Promise<void> {
    const workspace = this._workspaces.get(id);
    if (workspace) {
      IndexedDBProvider.delete(id);
      this._workspaces.remove(id);
      this._storeWorkspaces(this._workspaces.list());
    } else {
      this._logger(`Failed to delete workspace ${id}`);
    }
  }

  public override async updateWorkspaceMeta(
    id: string,
    meta: Partial<WorkspaceMeta>
  ) {
    this._workspaces.update(id, meta);
    this._storeWorkspaces(this._workspaces.list());
  }

  public override async createWorkspace(
    meta: WorkspaceMeta
  ): Promise<Workspace | undefined> {
    assert(meta.name, 'Workspace name is required');
    this._logger('Creating affine workspace');

    const workspaceInfo: WS = {
      name: meta.name,
      id: uuidv4(),
      isPublish: false,
      avatar: '',
      owner: undefined,
      isLocal: true,
      memberCount: 1,
      provider: 'local',
    };

    const workspace = new Workspace({ room: workspaceInfo.id });
    this._initWorkspaceDb(workspace);
    workspace.meta.setName(meta.name);
    if (!meta.avatar) {
      // set default avatar
      const blob = await getDefaultHeadImgBlob(meta.name);
      const blobStorage = await workspace.blobs;
      assert(blobStorage, 'No blob storage');
      const blobId = await blobStorage.set(blob);
      const avatar = await blobStorage.get(blobId);
      if (avatar) {
        workspace.meta.setAvatar(avatar);
        workspaceInfo.avatar = avatar;
      }
    }

    this._workspaces.add(workspaceInfo);
    this._storeWorkspaces(this._workspaces.list());

    return workspace;
  }

  public override async clear(): Promise<void> {
    const workspaces = await this.loadWorkspaces();
    workspaces.forEach(ws => IndexedDBProvider.delete(ws.id));
    this._storeWorkspaces([]);
    this._workspaces.clear();
  }
}
