import { join } from 'node:path';

import { DocStorage as NativeDocStorage } from '@affine/native';

import {
  type DocRecord,
  DocStorageAdapter,
  type DocStorageOptions,
  type DocUpdate,
} from '../../storage';

interface SqliteDocStorageOptions extends DocStorageOptions {
  workspaceDbFolder: string;
}

export class SqliteDocStorageAdapter extends DocStorageAdapter {
  private readonly dbPath: string;
  private readonly native: NativeDocStorage;

  constructor(
    public override readonly spaceId: string,
    options: SqliteDocStorageOptions
  ) {
    super(options);
    this.dbPath = join(options.workspaceDbFolder, `${spaceId}.db`);
    this.native = new NativeDocStorage(this.dbPath);
  }

  override async connect(): Promise<void> {
    await this.native.connect();
  }

  override async disconnect(): Promise<void> {
    await this.native.close();
  }

  override pushDocUpdates(
    docId: string,
    updates: Uint8Array[]
  ): Promise<number> {
    return this.native.pushUpdates(docId, updates);
  }

  override deleteDoc(docId: string): Promise<void> {
    return this.native.deleteDoc(docId);
  }

  override async deleteSpace(): Promise<void> {
    await this.disconnect();
    // rm this.dbPath
  }

  override async getSpaceDocTimestamps(
    after?: number
  ): Promise<Record<string, number> | null> {
    const clocks = await this.native.getDocClocks(after);

    return clocks.reduce(
      (ret, cur) => {
        ret[cur.docId] = cur.timestamp.getTime();
        return ret;
      },
      {} as Record<string, number>
    );
  }

  protected override async getDocSnapshot(
    docId: string
  ): Promise<DocRecord | null> {
    const snapshot = await this.native.getDocSnapshot(docId);

    if (!snapshot) {
      return null;
    }

    return {
      spaceId: this.spaceId,
      docId,
      bin: snapshot.data,
      timestamp: snapshot.timestamp.getTime(),
    };
  }

  protected override setDocSnapshot(snapshot: DocRecord): Promise<boolean> {
    return this.native.setDocSnapshot({
      docId: snapshot.docId,
      data: Buffer.from(snapshot.bin),
      timestamp: new Date(snapshot.timestamp),
    });
  }

  protected override async getDocUpdates(docId: string): Promise<DocUpdate[]> {
    return this.native.getDocUpdates(docId).then(updates =>
      updates.map(update => ({
        bin: update.data,
        timestamp: update.createdAt.getTime(),
      }))
    );
  }

  protected override markUpdatesMerged(
    docId: string,
    updates: DocUpdate[]
  ): Promise<number> {
    return this.native.markUpdatesMerged(
      docId,
      updates.map(update => new Date(update.timestamp))
    );
  }

  override async listDocHistories() {
    return [];
  }
  override async getDocHistory() {
    return null;
  }

  protected override async createDocHistory(): Promise<boolean> {
    return false;
  }
}
