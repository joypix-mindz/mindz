import { atomWithSyncStorage } from '@affine/jotai';
import { jotaiWorkspacesAtom } from '@affine/workspace/atom';
import type { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';
import { atom } from 'jotai';

import { WorkspacePlugins } from '../plugins';
import type { AllWorkspace } from '../shared';
// workspace necessary atoms
export const currentWorkspaceIdAtom = atom<string | null>(null);
export const currentPageIdAtom = atom<string | null>(null);
export const currentEditorAtom = atom<Readonly<EditorContainer> | null>(null);

// modal atoms
export const openWorkspacesModalAtom = atom(false);
export const openCreateWorkspaceModalAtom = atom(false);
export const openQuickSearchModalAtom = atom(false);

export const workspacesAtom = atom<Promise<AllWorkspace[]>>(async get => {
  const flavours: string[] = Object.values(WorkspacePlugins).map(
    plugin => plugin.flavour
  );
  const jotaiWorkspaces = get(jotaiWorkspacesAtom).filter(workspace =>
    flavours.includes(workspace.flavour)
  );
  const workspaces = await Promise.all(
    jotaiWorkspaces.map(workspace => {
      const plugin =
        WorkspacePlugins[workspace.flavour as keyof typeof WorkspacePlugins];
      assertExists(plugin);
      const { CRUD } = plugin;
      return CRUD.get(workspace.id);
    })
  );
  return workspaces.filter(workspace => workspace !== null) as AllWorkspace[];
});

type View = { id: string; mode: 'page' | 'edgeless' };

export type WorkspaceRecentViews = Record<string, View[]>;

export const workspaceRecentViewsAtom =
  atomWithSyncStorage<WorkspaceRecentViews>('recentViews', {});

export type PreferredModeRecord = Record<Page['id'], 'page' | 'edgeless'>;
export const workspacePreferredModeAtom =
  atomWithSyncStorage<PreferredModeRecord>('preferredMode', {});

export const workspaceRecentViresWriteAtom = atom<null, [string, View], View[]>(
  null,
  (get, set, id, value) => {
    const record = get(workspaceRecentViewsAtom);
    if (Array.isArray(record[id])) {
      const idx = record[id].findIndex(view => view.id === value.id);
      if (idx !== -1) {
        record[id].splice(idx, 1);
      }
      record[id] = [value, ...record[id]];
    } else {
      record[id] = [value];
    }

    record[id] = record[id].slice(0, 3);
    set(workspaceRecentViewsAtom, { ...record });
    return record[id];
  }
);
