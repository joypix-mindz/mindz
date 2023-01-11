import { BaseProvider } from '../base.js';
import type {
  ProviderConstructorParams,
  CreateWorkspaceInfoParams,
  WorkspaceMeta0,
} from '../base';
import type { User } from '../../types';
import { Workspace as BlocksuiteWorkspace } from '@blocksuite/store';
import { BlockSchema } from '@blocksuite/blocks/models';
import { storage } from './storage.js';
import assert from 'assert';
import { WebsocketProvider } from './sync.js';
// import { IndexedDBProvider } from '../local/indexeddb';
import { getApis, Workspace } from './apis/index.js';
import type { Apis, WorkspaceDetail, Callback } from './apis';
import { setDefaultAvatar } from '../utils.js';
import { MessageCode } from '../../message';
import { token } from './apis/token.js';
import { WebsocketClient } from './channel';
import { SyncMode } from '../../workspace-unit';

export interface AffineProviderConstructorParams
  extends ProviderConstructorParams {
  apis?: Apis;
}

const {
  Y: { applyUpdate, encodeStateAsUpdate },
} = BlocksuiteWorkspace;

export class AffineProvider extends BaseProvider {
  public id = 'affine';
  private _workspacesCache: Map<string, BlocksuiteWorkspace> = new Map();
  private _onTokenRefresh?: Callback = undefined;
  private _wsMap: Map<string, WebsocketProvider> = new Map();
  private _apis: Apis;
  private _channel?: WebsocketClient;
  // private _idbMap: Map<string, IndexedDBProvider> = new Map();

  constructor({ apis, ...params }: AffineProviderConstructorParams) {
    super(params);
    this._apis = apis || getApis();
  }

  override async init() {
    this._onTokenRefresh = () => {
      if (this._apis.token.refresh) {
        storage.setItem('token', this._apis.token.refresh);
      }
    };

    this._apis.token.onChange(this._onTokenRefresh);

    // initial login token
    if (this._apis.token.isExpired) {
      try {
        const refreshToken = storage.getItem('token');
        await this._apis.token.refreshToken(refreshToken);

        if (this._apis.token.refresh) {
          storage.set('token', this._apis.token.refresh);
        }

        assert(this._apis.token.isLogin);
      } catch (_) {
        // this._logger('Authorization failed, fallback to local mode');
      }
    } else {
      storage.setItem('token', this._apis.token.refresh);
    }

    if (token.isLogin) {
      this._connectChannel();
    }
  }

  private _connectChannel() {
    if (!this._channel) {
      this._channel = new WebsocketClient(
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${
          window.location.host
        }/api/global/sync/`,
        this._logger,
        {
          params: {
            token: this._apis.token.refresh,
          },
        }
      );
    }
    this._channel.on('message', this.handlerAffineListMessage);
  }

  private handlerAffineListMessage({
    ws_details,
    metadata,
  }: {
    ws_list: Workspace[];
    ws_details: Record<string, WorkspaceDetail>;
    metadata: Record<string, { avatar: string; name: string }>;
  }) {
    Object.entries(ws_details).forEach(([id, detail]) => {
      const { name, avatar } = metadata[id];
      assert(name);
      const workspace = {
        name: name,
        avatar,
        owner: {
          name: detail.owner.name,
          id: detail.owner.id,
          email: detail.owner.email,
          avatar: detail.owner.avatar_url,
        },
        published: detail.public,
        memberCount: detail.member_count,
        provider: 'affine',
        syncMode: 'core' as SyncMode,
      };
      if (this._workspaces.get(id)) {
        this._workspaces.update(id, workspace);
      } else {
        this._workspaces.add({ id, ...workspace });
      }
    });
  }

  private _getWebsocketProvider(workspace: BlocksuiteWorkspace) {
    const { doc, room } = workspace;
    assert(room);
    assert(doc);
    let ws = this._wsMap.get(room);
    if (!ws) {
      const wsUrl = `${
        window.location.protocol === 'https:' ? 'wss' : 'ws'
      }://${window.location.host}/api/sync/`;
      ws = new WebsocketProvider(wsUrl, room, doc, {
        params: { token: this._apis.token.refresh },
      });
      this._wsMap.set(room, ws);
    }
    return ws;
  }

  private async _applyCloudUpdates(
    blocksuiteWorkspace: BlocksuiteWorkspace,
    published = false
  ) {
    const { doc, room: workspaceId } = blocksuiteWorkspace;
    assert(workspaceId, 'Blocksuite Workspace without room(workspaceId).');
    const updates = await this._apis.downloadWorkspace(workspaceId, published);
    if (updates && updates.byteLength) {
      await new Promise(resolve => {
        doc.once('update', resolve);
        BlocksuiteWorkspace.Y.applyUpdate(doc, new Uint8Array(updates));
      });
    }
  }

  override async loadPublicWorkspace(blocksuiteWorkspace: BlocksuiteWorkspace) {
    await this._applyCloudUpdates(blocksuiteWorkspace, true);
    return blocksuiteWorkspace;
  }

  override async warpWorkspace(workspace: BlocksuiteWorkspace) {
    await this._applyCloudUpdates(workspace);
    const { room } = workspace;
    assert(room);
    this.linkLocal(workspace);
    const ws = this._getWebsocketProvider(workspace);
    // close all websocket links
    Array.from(this._wsMap.entries()).forEach(([id, ws]) => {
      if (id !== room) {
        ws.disconnect();
      }
    });
    ws.connect();
    await new Promise<void>((resolve, reject) => {
      // TODO: synced will also be triggered on reconnection after losing sync
      // There needs to be an event mechanism to emit the synchronization state to the upper layer
      assert(ws);
      ws.once('synced', () => resolve());
      ws.once('lost-connection', () => resolve());
      ws.once('connection-error', () => reject());
    });
    return workspace;
  }

  override async loadWorkspaces() {
    if (!this._apis.token.isLogin) {
      return [];
    }
    const workspacesList = await this._apis.getWorkspaces();
    const workspaces: WorkspaceMeta0[] = workspacesList.map(w => {
      return {
        ...w,
        memberCount: 0,
        name: '',
        provider: 'affine',
        syncMode: 'core',
      };
    });
    const workspaceInstances = workspaces.map(({ id }) => {
      const workspace =
        this._workspacesCache.get(id) ||
        new BlocksuiteWorkspace({
          room: id,
        }).register(BlockSchema);
      this._workspacesCache.set(id, workspace);
      if (workspace) {
        return new Promise<BlocksuiteWorkspace>(resolve => {
          this._apis.downloadWorkspace(id).then(data => {
            applyUpdate(workspace.doc, new Uint8Array(data));
            resolve(workspace);
          });
        });
      } else {
        return Promise.resolve(null);
      }
    });

    (await Promise.all(workspaceInstances)).forEach((workspace, i) => {
      if (workspace) {
        workspaces[i] = {
          ...workspaces[i],
          name: workspace.meta.name,
          avatar: workspace.meta.avatar,
        };
      }
    });
    const getDetailList = workspacesList.map(w => {
      const { id } = w;
      return new Promise<{ id: string; detail: WorkspaceDetail | null }>(
        resolve => {
          this._apis.getWorkspaceDetail({ id }).then(data => {
            resolve({ id, detail: data || null });
          });
        }
      );
    });
    const ownerList = await Promise.all(getDetailList);
    (await Promise.all(ownerList)).forEach(detail => {
      if (detail) {
        const { id, detail: workspaceDetail } = detail;
        if (workspaceDetail) {
          const { owner, member_count } = workspaceDetail;
          const currentWorkspace = workspaces.find(w => w.id === id);
          if (currentWorkspace) {
            currentWorkspace.owner = {
              id: owner.id,
              name: owner.name,
              avatar: owner.avatar_url,
              email: owner.email,
            };
            currentWorkspace.memberCount = member_count;
          }
        }
      }
    });

    workspaces.forEach(workspace => {
      this._workspaces.add(workspace);
    });

    return workspaces;
  }

  override async auth() {
    const refreshToken = await storage.getItem('token');
    if (refreshToken) {
      await this._apis.token.refreshToken(refreshToken);
      if (this._apis.token.isLogin && !this._apis.token.isExpired) {
        // login success
        return;
      }
    }
    const user = await this._apis.signInWithGoogle?.();
    if (!this._channel?.connected) {
      this._connectChannel();
    }
    if (!user) {
      this._messageCenter.send(MessageCode.loginError);
    }
  }

  public override async getUserInfo(): Promise<User | undefined> {
    const user = this._apis.token.user;
    await this.init;
    return user
      ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar_url,
          email: user.email,
        }
      : undefined;
  }

  public override async deleteWorkspace(id: string): Promise<void> {
    await this.closeWorkspace(id);
    // IndexedDBProvider.delete(id);
    await this._apis.deleteWorkspace({ id });
    this._workspaces.remove(id);
  }

  public override async clear(): Promise<void> {
    for (const w of this._workspacesCache.values()) {
      if (w.room) {
        try {
          await this.deleteWorkspace(w.room);
          this._workspaces.remove(w.room);
        } catch (e) {
          this._logger('has a problem of delete workspace ', e);
        }
      }
    }
    this._workspacesCache.clear();
  }

  public override async closeWorkspace(id: string) {
    // const idb = this._idbMap.get(id);
    // idb?.destroy();
    const ws = this._wsMap.get(id);
    ws?.disconnect();
  }

  public override async leaveWorkspace(id: string): Promise<void> {
    await this._apis.leaveWorkspace({ id });
  }

  public override async invite(id: string, email: string): Promise<void> {
    return await this._apis.inviteMember({ id, email });
  }

  public override async removeMember(permissionId: number): Promise<void> {
    return await this._apis.removeMember({ permissionId });
  }

  public override async linkLocal(workspace: BlocksuiteWorkspace) {
    return workspace;
    // assert(workspace.room);
    // let idb = this._idbMap.get(workspace.room);
    // idb?.destroy();
    // idb = new IndexedDBProvider(workspace.room, workspace.doc);
    // this._idbMap.set(workspace.room, idb);
    // await idb.whenSynced;
    // this._logger('Local data loaded');
    // return workspace;
  }

  public override async createWorkspaceInfo(
    meta: CreateWorkspaceInfoParams
  ): Promise<WorkspaceMeta0> {
    const { id } = await this._apis.createWorkspace(meta);

    const workspaceInfo: WorkspaceMeta0 = {
      name: meta.name,
      id: id,
      published: false,
      avatar: '',
      owner: await this.getUserInfo(),
      syncMode: 'core',
      memberCount: 1,
      provider: 'affine',
    };
    return workspaceInfo;
  }

  public override async createWorkspace(
    blocksuiteWorkspace: BlocksuiteWorkspace,
    meta: WorkspaceMeta0
  ): Promise<BlocksuiteWorkspace | undefined> {
    const workspaceId = blocksuiteWorkspace.room;
    assert(workspaceId, 'Blocksuite Workspace without room(workspaceId).');
    this._logger('Creating affine workspace');

    this._applyCloudUpdates(blocksuiteWorkspace);
    this.linkLocal(blocksuiteWorkspace);

    const workspaceInfo: WorkspaceMeta0 = {
      name: meta.name,
      id: workspaceId,
      published: false,
      avatar: '',
      owner: undefined,
      syncMode: 'core',
      memberCount: 1,
      provider: 'affine',
    };

    if (!blocksuiteWorkspace.meta.avatar) {
      await setDefaultAvatar(blocksuiteWorkspace);
      workspaceInfo.avatar = blocksuiteWorkspace.meta.avatar;
    }
    this._workspaces.add(workspaceInfo);
    return blocksuiteWorkspace;
  }

  public override async publish(id: string, isPublish: boolean): Promise<void> {
    await this._apis.updateWorkspace({ id, public: isPublish });
  }

  public override async getUserByEmail(
    workspace_id: string,
    email: string
  ): Promise<User | null> {
    const user = await this._apis.getUserByEmail({ workspace_id, email });
    return user
      ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar_url,
          email: user.email,
        }
      : null;
  }

  public override async assign(
    to: BlocksuiteWorkspace,
    from: BlocksuiteWorkspace
  ): Promise<BlocksuiteWorkspace> {
    assert(to.room, 'Blocksuite Workspace without room(workspaceId).');
    const ws = this._getWebsocketProvider(to);
    applyUpdate(to.doc, encodeStateAsUpdate(from.doc));
    // TODO: upload blobs and make sure doc is synced
    await new Promise<void>((resolve, reject) => {
      ws.once('synced', () => {
        setTimeout(() => resolve(), 1000);
      });
      ws.once('lost-connection', () => reject());
      ws.once('connection-error', () => reject());
    });
    return to;
  }

  public override async logout(): Promise<void> {
    token.clear();
    this._channel?.disconnect();
    this._wsMap.forEach(ws => ws.disconnect());
    storage.removeItem('token');
  }

  public override async getWorkspaceMembers(id: string) {
    return this._apis.getWorkspaceMembers({ id });
  }
}
