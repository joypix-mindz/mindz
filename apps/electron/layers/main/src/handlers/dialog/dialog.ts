import path from 'node:path';

import { dialog, shell } from 'electron';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';

import { appContext } from '../../context';
import { logger } from '../../logger';
import { ensureSQLiteDB, isRemoveOrMoveEvent } from '../db/ensure-db';
import type { WorkspaceSQLiteDB } from '../db/sqlite';
import { getWorkspaceDBPath, isValidDBFile } from '../db/sqlite';
import { listWorkspaces } from '../workspace/workspace';

// NOTE:
// we are using native dialogs because HTML dialogs do not give full file paths

export async function revealDBFile(workspaceId: string) {
  const workspaceDB = await ensureSQLiteDB(workspaceId);
  shell.showItemInFolder(await fs.realpath(workspaceDB.path));
}

// provide a backdoor to set dialog path for testing in playwright
interface FakeDialogResult {
  canceled?: boolean;
  filePath?: string;
  filePaths?: string[];
}

// result will be used in the next call to showOpenDialog
// if it is being read once, it will be reset to undefined
let fakeDialogResult: FakeDialogResult | undefined = undefined;

function getFakedResult() {
  const result = fakeDialogResult;
  fakeDialogResult = undefined;
  return result;
}

export function setFakeDialogResult(result: FakeDialogResult | undefined) {
  fakeDialogResult = result;
  // for convenience, we will fill filePaths with filePath if it is not set
  if (result?.filePaths === undefined && result?.filePath !== undefined) {
    result.filePaths = [result.filePath];
  }
}

const ErrorMessages = [
  'DB_FILE_ALREADY_LOADED',
  'DB_FILE_PATH_INVALID',
  'DB_FILE_INVALID',
  'FILE_ALREADY_EXISTS',
  'UNKNOWN_ERROR',
] as const;

type ErrorMessage = (typeof ErrorMessages)[number];

interface SaveDBFileResult {
  filePath?: string;
  canceled?: boolean;
  error?: ErrorMessage;
}

/**
 * This function is called when the user clicks the "Save" button in the "Save Workspace" dialog.
 *
 * It will just copy the file to the given path
 */
export async function saveDBFileAs(
  workspaceId: string
): Promise<SaveDBFileResult> {
  try {
    const db = await ensureSQLiteDB(workspaceId);
    const ret =
      getFakedResult() ??
      (await dialog.showSaveDialog({
        properties: ['showOverwriteConfirmation'],
        title: 'Save Workspace',
        showsTagField: false,
        buttonLabel: 'Save',
        defaultPath: `${db.getWorkspaceName()}_${workspaceId}.db`,
        message: 'Save Workspace as a SQLite Database file',
      }));
    const filePath = ret.filePath;
    if (ret.canceled || !filePath) {
      return {
        canceled: true,
      };
    }

    await fs.copyFile(db.path, filePath);
    logger.log('saved', filePath);
    shell.showItemInFolder(filePath);
    return { filePath };
  } catch (err) {
    logger.error('saveDBFileAs', err);
    return {
      error: 'UNKNOWN_ERROR',
    };
  }
}

interface SelectDBFileLocationResult {
  filePath?: string;
  error?: ErrorMessage;
  canceled?: boolean;
}

export async function selectDBFileLocation(): Promise<SelectDBFileLocationResult> {
  try {
    const ret =
      getFakedResult() ??
      (await dialog.showSaveDialog({
        properties: ['showOverwriteConfirmation'],
        title: 'Set database location',
        showsTagField: false,
        buttonLabel: 'Select',
        defaultPath: `workspace-storage.db`,
        message: "Select a location to store the workspace's database file",
      }));
    const filePath = ret.filePath;
    if (ret.canceled || !filePath) {
      return {
        canceled: true,
      };
    }
    // the same db file cannot be loaded twice
    if (await dbFileAlreadyLoaded(filePath)) {
      return {
        error: 'DB_FILE_ALREADY_LOADED',
      };
    }
    return { filePath };
  } catch (err) {
    logger.error('selectDBFileLocation', err);
    return {
      error: (err as any).message,
    };
  }
}

interface LoadDBFileResult {
  workspaceId?: string;
  error?: ErrorMessage;
  canceled?: boolean;
}

/**
 * This function is called when the user clicks the "Load" button in the "Load Workspace" dialog.
 *
 * It will
 * - symlink the source db file to a new workspace id to app-data
 * - return the new workspace id
 *
 * eg, it will create a new folder in app-data:
 * <app-data>/<app-name>/workspaces/<workspace-id>/storage.db
 *
 * On the renderer side, after the UI got a new workspace id, it will
 * update the local workspace id list and then connect to it.
 *
 */
export async function loadDBFile(): Promise<LoadDBFileResult> {
  try {
    const ret =
      getFakedResult() ??
      (await dialog.showOpenDialog({
        properties: ['openFile'],
        title: 'Load Workspace',
        buttonLabel: 'Load',
        filters: [
          {
            name: 'SQLite Database',
            // do we want to support other file format?
            extensions: ['db'],
          },
        ],
        message: 'Load Workspace from a SQLite Database file',
      }));
    const filePath = ret.filePaths?.[0];
    if (ret.canceled || !filePath) {
      logger.info('loadDBFile canceled');
      return { canceled: true };
    }

    // the imported file should not be in app data dir
    if (filePath.startsWith(path.join(appContext.appDataPath, 'workspaces'))) {
      logger.warn('loadDBFile: db file in app data dir');
      return { error: 'DB_FILE_PATH_INVALID' };
    }

    if (await dbFileAlreadyLoaded(filePath)) {
      logger.warn('loadDBFile: db file already loaded');
      return { error: 'DB_FILE_ALREADY_LOADED' };
    }

    if (!isValidDBFile(filePath)) {
      // TODO: report invalid db file error?
      return { error: 'DB_FILE_INVALID' }; // invalid db file
    }

    // symlink the db file to a new workspace id
    const workspaceId = nanoid(10);
    const linkedFilePath = await getWorkspaceDBPath(appContext, workspaceId);

    await fs.ensureDir(path.join(appContext.appDataPath, 'workspaces'));

    await fs.symlink(filePath, linkedFilePath, 'file');
    logger.info(`loadDBFile, symlink: ${filePath} -> ${linkedFilePath}`);

    return { workspaceId };
  } catch (err) {
    logger.error('loadDBFile', err);
    return {
      error: 'UNKNOWN_ERROR',
    };
  }
}

interface MoveDBFileResult {
  filePath?: string;
  error?: ErrorMessage;
  canceled?: boolean;
}

/**
 * This function is called when the user clicks the "Move" button in the "Move Workspace Storage" setting.
 *
 * It will
 * - move the source db file to a new location
 * - symlink the new location to the old db file
 * - return the new file path
 */
export async function moveDBFile(
  workspaceId: string,
  dbFileLocation?: string
): Promise<MoveDBFileResult> {
  let db: WorkspaceSQLiteDB | null = null;
  try {
    const { moveFile, FsWatcher } = await import('@affine/native');
    db = await ensureSQLiteDB(workspaceId);
    // get the real file path of db
    const realpath = await fs.realpath(db.path);
    const isLink = realpath !== db.path;
    const watcher = FsWatcher.watch(realpath, { recursive: false });
    const waitForRemove = new Promise<void>(resolve => {
      const subscription = watcher.subscribe(event => {
        if (isRemoveOrMoveEvent(event)) {
          subscription.unsubscribe();
          // resolve after FSWatcher in `database$` is fired
          setImmediate(() => {
            resolve();
          });
        }
      });
    });
    const newFilePath =
      dbFileLocation ??
      (
        getFakedResult() ??
        (await dialog.showSaveDialog({
          properties: ['showOverwriteConfirmation'],
          title: 'Move Workspace Storage',
          showsTagField: false,
          buttonLabel: 'Save',
          defaultPath: realpath,
          message: 'Move Workspace storage file',
        }))
      ).filePath;

    // skips if
    // - user canceled the dialog
    // - user selected the same file
    // - user selected the same file in the link file in app data dir
    if (!newFilePath || newFilePath === realpath || db.path === newFilePath) {
      return {
        canceled: true,
      };
    }

    db.db.close();

    if (await fs.pathExists(newFilePath)) {
      return {
        error: 'FILE_ALREADY_EXISTS',
      };
    }

    if (isLink) {
      // remove the old link to unblock new link
      await fs.unlink(db.path);
    }

    logger.info(`[moveDBFile] move ${realpath} -> ${newFilePath}`);

    await moveFile(realpath, newFilePath);

    await fs.ensureSymlink(newFilePath, db.path, 'file');
    logger.info(`[moveDBFile] symlink: ${realpath} -> ${newFilePath}`);
    // wait for the file move event emits to the FileWatcher in database$ in ensure-db.ts
    // so that the db will be destroyed and we can call the `ensureSQLiteDB` in the next step
    // or the FileWatcher will continue listen on the `realpath` and emit file change events
    // then the database will reload while receiving these events; and the moved database file will be recreated while reloading database
    await waitForRemove;
    logger.info(`removed`);
    await ensureSQLiteDB(workspaceId);

    return {
      filePath: newFilePath,
    };
  } catch (err) {
    db?.destroy();
    logger.error('[moveDBFile]', err);
    return {
      error: 'UNKNOWN_ERROR',
    };
  }
}

async function dbFileAlreadyLoaded(path: string) {
  const meta = await listWorkspaces(appContext);
  const realpath = await fs.realpath(path);
  const paths = meta.map(m => m[1].realpath);
  return paths.includes(realpath);
}
