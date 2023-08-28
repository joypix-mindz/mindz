import { resolve } from 'node:path';

import { SqliteConnection } from '@affine/native';
import { migrateToSubdoc } from '@toeverything/infra/blocksuite';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import { applyUpdate, Doc as YDoc, encodeStateAsUpdate } from 'yjs';

import { mainRPC } from '../main-rpc';

export const migrateToSubdocAndReplaceDatabase = async (path: string) => {
  const db = new SqliteConnection(path);
  await db.connect();

  const rows = await db.getAllUpdates();
  const originalDoc = new YDoc();

  // 1. apply all updates to the root doc
  rows.forEach(row => {
    applyUpdate(originalDoc, row.data);
  });

  // 2. migrate using migrateToSubdoc
  const migratedDoc = migrateToSubdoc(originalDoc);

  // 3. replace db rows with the migrated doc
  await replaceRows(db, migratedDoc, true);

  // 4. close db
  await db.close();
};

export const copyToTemp = async (path: string) => {
  const tmpDirPath = resolve(await mainRPC.getPath('sessionData'), 'tmp');
  const tmpFilePath = resolve(tmpDirPath, nanoid());
  await fs.ensureDir(tmpDirPath);
  await fs.copyFile(path, tmpFilePath);
  return tmpFilePath;
};

async function replaceRows(
  db: SqliteConnection,
  doc: YDoc,
  isRoot: boolean
): Promise<void> {
  const migratedUpdates = encodeStateAsUpdate(doc);
  const docId = isRoot ? undefined : doc.guid;
  const rows = [{ data: migratedUpdates, docId: docId }];
  await db.replaceUpdates(docId, rows);
  await Promise.all(
    [...doc.subdocs].map(async subdoc => {
      await replaceRows(db, subdoc, false);
    })
  );
}
