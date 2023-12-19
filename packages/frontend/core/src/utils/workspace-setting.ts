import type {
  Collection,
  DeleteCollectionInfo,
  DeletedCollection,
} from '@affine/env/filter';
import type { Workspace } from '@blocksuite/store';
import { Array as YArray } from 'yjs';

import { updateFirstOfYArray } from './yjs-utils';

const COLLECTIONS_KEY = 'collections';
const COLLECTIONS_TRASH_KEY = 'collections_trash';
const SETTING_KEY = 'setting';

export class WorkspaceSetting {
  constructor(private readonly workspace: Workspace) {}

  get doc() {
    return this.workspace.doc;
  }

  get setting() {
    return this.workspace.doc.getMap(SETTING_KEY);
  }

  get collectionsYArray(): YArray<Collection> | undefined {
    return this.setting.get(COLLECTIONS_KEY) as YArray<Collection>;
  }

  get collectionsTrashYArray(): YArray<DeletedCollection> | undefined {
    return this.setting.get(COLLECTIONS_TRASH_KEY) as YArray<DeletedCollection>;
  }

  get collections(): Collection[] {
    return this.collectionsYArray?.toArray() ?? [];
  }

  get collectionsTrash(): DeletedCollection[] {
    return this.collectionsTrashYArray?.toArray() ?? [];
  }

  updateCollection(id: string, updater: (value: Collection) => Collection) {
    if (this.collectionsYArray) {
      updateFirstOfYArray(
        this.collectionsYArray,
        v => v.id === id,
        v => {
          return updater(v);
        }
      );
    }
  }

  addCollection(...collections: Collection[]) {
    if (!this.setting.has(COLLECTIONS_KEY)) {
      this.setting.set(COLLECTIONS_KEY, new YArray());
    }
    this.doc.transact(() => {
      this.collectionsYArray?.insert(0, collections);
    });
  }

  deleteCollection(info: DeleteCollectionInfo, ...ids: string[]) {
    const collectionsYArray = this.collectionsYArray;
    if (!collectionsYArray) {
      return;
    }
    const set = new Set(ids);
    this.workspace.doc.transact(() => {
      const indexList: number[] = [];
      const list: Collection[] = [];
      collectionsYArray.forEach((collection, i) => {
        if (set.has(collection.id)) {
          set.delete(collection.id);
          indexList.unshift(i);
          list.push(JSON.parse(JSON.stringify(collection)));
        }
      });
      indexList.forEach(i => {
        collectionsYArray.delete(i);
      });
      if (!this.collectionsTrashYArray) {
        this.setting.set(COLLECTIONS_TRASH_KEY, new YArray());
      }
      const collectionsTrashYArray = this.collectionsTrashYArray;
      if (!collectionsTrashYArray) {
        return;
      }
      collectionsTrashYArray.insert(
        0,
        list.map(collection => ({
          userId: info?.userId,
          userName: info ? info.userName : 'Local User',
          collection,
        }))
      );
      if (collectionsTrashYArray.length > 10) {
        collectionsTrashYArray.delete(10, collectionsTrashYArray.length - 10);
      }
    });
  }

  deletePagesFromCollection(collection: Collection, idSet: Set<string>) {
    const newAllowList = collection.allowList.filter(id => !idSet.has(id));
    if (newAllowList.length !== collection.allowList.length) {
      this.updateCollection(collection.id, old => {
        return {
          ...old,
          allowList: newAllowList,
        };
      });
    }
  }

  deletePages(ids: string[]) {
    const idSet = new Set(ids);
    this.workspace.doc.transact(() => {
      this.collections.forEach(collection => {
        this.deletePagesFromCollection(collection, idSet);
      });
    });
  }
}

export const getWorkspaceSetting = (workspace: Workspace) => {
  return new WorkspaceSetting(workspace);
};
