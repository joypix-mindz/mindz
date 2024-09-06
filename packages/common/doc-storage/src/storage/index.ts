// TODO(@forehalo): share with backend
import type { BlobStorageAdapter } from './blob';
import { Connection } from './connection';
import type { DocStorage } from './doc';

export class SpaceStorage extends Connection {
  constructor(
    public readonly doc: DocStorage,
    public readonly blob: BlobStorageAdapter
  ) {
    super();
  }

  override async connect() {
    await this.doc.connect();
    await this.blob.connect();
  }

  override async disconnect() {
    await this.doc.disconnect();
    await this.blob.disconnect();
  }
}

export { BlobStorageAdapter, type BlobStorageOptions } from './blob';
export {
  type DocRecord,
  DocStorage,
  type DocStorageOptions,
  type DocUpdate,
  type Editor,
  HistoricalDocStorage,
  type HistoryFilter,
} from './doc';
