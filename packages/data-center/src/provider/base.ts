import { BlobStorage, Workspace } from '@blocksuite/store';
import { Logger, User, Workspace as WS, WorkspaceMeta } from '../types';
import type { WorkspacesScope } from '../workspaces';

export class BaseProvider {
  public readonly id: string = 'base';
  protected _workspaces!: WorkspacesScope;
  protected _logger!: Logger;
  protected _blobs!: BlobStorage;

  public inject({
    logger,
    workspaces,
  }: {
    logger: Logger;
    workspaces: WorkspacesScope;
  }) {
    this._logger = logger;
    this._workspaces = workspaces;
  }

  /**
   * hook after provider registered
   */
  public async init() {
    return;
  }

  /**
   * auth provider
   */
  public async auth() {
    return;
  }

  /**
   * logout provider
   */
  public async logout() {
    return;
  }

  /**
   * warp workspace with provider functions
   * @param workspace
   * @returns
   */
  public async warpWorkspace(workspace: Workspace): Promise<Workspace> {
    return workspace;
  }

  /**
   * load workspaces
   **/
  public async loadWorkspaces(): Promise<WS[]> {
    throw new Error(`provider: ${this.id} loadWorkSpace Not implemented`);
  }

  /**
   * get auth user info
   * @returns
   */
  public async getUserInfo(): Promise<User | undefined> {
    return;
  }

  async getBlob(id: string): Promise<string | null> {
    return await this._blobs.get(id);
  }

  async setBlob(blob: Blob): Promise<string> {
    return await this._blobs.set(blob);
  }

  /**
   * clear all local data in provider
   */
  async clear() {
    this._blobs.clear();
  }

  /**
   * delete workspace include all data
   * @param id workspace id
   */
  public async deleteWorkspace(id: string): Promise<void> {
    id;
    return;
  }

  /**
   * leave workspace by workspace id
   * @param id workspace id
   */
  public async leaveWorkspace(id: string): Promise<void> {
    id;
    return;
  }

  /**
   * close db link and websocket connection and other resources
   * @param id workspace id
   */
  public async closeWorkspace(id: string) {
    id;
    return;
  }

  /**
   * invite workspace member
   * @param id workspace id
   */
  public async invite(id: string, email: string): Promise<void> {
    id;
    email;
    return;
  }

  /**
   * remove workspace member by permission id
   * @param permissionId
   */
  public async removeMember(permissionId: number): Promise<void> {
    permissionId;
    return;
  }

  public async publish(id: string, isPublish: boolean): Promise<void> {
    id;
    isPublish;
    return;
  }

  /**
   * change workspace meta by workspace id , work for cached list in different provider
   * @param id
   * @param meta
   * @returns
   */
  public async updateWorkspaceMeta(
    id: string,
    meta: Partial<WorkspaceMeta>
  ): Promise<void> {
    id;
    meta;
    return;
  }

  public async createWorkspace(
    meta: WorkspaceMeta
  ): Promise<Workspace | undefined> {
    meta;
    return;
  }
}
