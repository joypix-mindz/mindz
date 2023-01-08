import { BlobStorage, Workspace } from '@blocksuite/store';
import { Logger, User, Workspace as WS, WorkspaceMeta } from 'src/types';
import { Workspaces } from 'src/workspaces';

export class BaseProvider {
  public readonly id: string = 'base';
  protected _workspaces!: Workspaces;
  protected _logger!: Logger;
  protected _blobs!: BlobStorage;

  public inject({
    logger,
    workspaces,
  }: {
    logger: Logger;
    workspaces: Workspaces;
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
    return this._blobs.get(id);
  }

  async setBlob(blob: Blob): Promise<string> {
    return this._blobs.set(blob);
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
  public async delete(id: string): Promise<void> {
    id;
    return;
  }

  /**
   * leave workspace by workspace id
   * @param id workspace id
   */
  public async leave(id: string): Promise<void> {
    id;
    return;
  }

  /**
   * close db link and websocket connection and other resources
   * @param id workspace id
   */
  public async close(id: string) {
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

  public async createWorkspace(
    meta: WorkspaceMeta
  ): Promise<Workspace | undefined> {
    meta;
    return;
  }
}
