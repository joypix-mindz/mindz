import { BaseProvider } from '../base.js';
import type { ProviderConstructorParams } from '../base';
import { varStorage as storage } from 'lib0/storage';
import { WorkspaceInfo, WorkspaceMeta } from '../../types';
import { Workspace as BlocksuiteWorkspace, uuidv4 } from '@blocksuite/store';
import { IndexedDBProvider } from './indexeddb.js';
import assert from 'assert';
import { setDefaultAvatar } from '../utils.js';

const WORKSPACE_KEY = 'workspaces';

export class LocalProvider extends BaseProvider {
  public id = 'local';
  private _idbMap: Map<string, IndexedDBProvider> = new Map();

  constructor(params: ProviderConstructorParams) {
    super(params);
    this.loadWorkspaces();
  }

  private _storeWorkspaces(workspaces: WorkspaceInfo[]) {
    storage.setItem(WORKSPACE_KEY, JSON.stringify(workspaces));
  }

  public override async linkLocal(workspace: BlocksuiteWorkspace) {
    assert(workspace.room);
    let idb = this._idbMap.get(workspace.room);
    idb?.destroy();
    idb = new IndexedDBProvider(workspace.room, workspace.doc);
    this._idbMap.set(workspace.room, idb);
    this._logger('Local data loaded');
    return workspace;
  }

  public override async warpWorkspace(
    workspace: BlocksuiteWorkspace
  ): Promise<BlocksuiteWorkspace> {
    assert(workspace.room);
    await this.linkLocal(workspace);
    return workspace;
  }

  override loadWorkspaces(): Promise<WorkspaceInfo[]> {
    const workspaceStr = storage.getItem(WORKSPACE_KEY);
    let workspaces: WorkspaceInfo[] = [];
    if (workspaceStr) {
      try {
        workspaces = JSON.parse(workspaceStr) as WorkspaceInfo[];
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
    blocksuiteWorkspace: BlocksuiteWorkspace,
    meta: WorkspaceMeta
  ): Promise<BlocksuiteWorkspace | undefined> {
    assert(meta.name, 'Workspace name is required');
    this._logger('Creating affine workspace');

    const workspaceInfo: WorkspaceInfo = {
      name: meta.name,
      id: uuidv4(),
      isPublish: false,
      avatar: '',
      owner: undefined,
      isLocal: true,
      memberCount: 1,
      provider: 'local',
    };

    this.linkLocal(blocksuiteWorkspace);
    blocksuiteWorkspace.meta.setName(meta.name);

    if (!meta.avatar) {
      await setDefaultAvatar(blocksuiteWorkspace);
      workspaceInfo.avatar = blocksuiteWorkspace.meta.avatar;
    }

    this._workspaces.add(workspaceInfo);
    this._storeWorkspaces(this._workspaces.list());

    return blocksuiteWorkspace;
  }

  public override async clear(): Promise<void> {
    const workspaces = await this.loadWorkspaces();
    workspaces.forEach(ws => IndexedDBProvider.delete(ws.id));
    this._storeWorkspaces([]);
    this._workspaces.clear();
  }
}
