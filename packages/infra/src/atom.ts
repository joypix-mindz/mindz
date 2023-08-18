import type { ExpectedLayout } from '@affine/sdk/entry';
import { assertExists } from '@blocksuite/global/utils';
import type { Page, Workspace } from '@blocksuite/store';
import { atom, createStore } from 'jotai/vanilla';

import { getWorkspace, waitForWorkspace } from './__internal__/workspace.js';

// global store
let rootStore = createStore();

export function getCurrentStore() {
  return rootStore;
}

/**
 * @internal do not use this function unless you know what you are doing
 */
export function _setCurrentStore(store: ReturnType<typeof createStore>) {
  rootStore = store;
}

export const loadedPluginNameAtom = atom<string[]>([]);

export const currentWorkspaceIdAtom = atom<string | null>(null);
export const currentPageIdAtom = atom<string | null>(null);
export const currentWorkspaceAtom = atom<Promise<Workspace>>(async get => {
  const currentWorkspaceId = get(currentWorkspaceIdAtom);
  assertExists(currentWorkspaceId, 'current workspace id');
  const workspace = getWorkspace(currentWorkspaceId);
  await waitForWorkspace(workspace);
  return workspace;
});
export const currentPageAtom = atom<Promise<Page>>(async get => {
  const currentWorkspaceId = get(currentWorkspaceIdAtom);
  assertExists(currentWorkspaceId, 'current workspace id');
  const currentPageId = get(currentPageIdAtom);
  assertExists(currentPageId, 'current page id');
  const workspace = getWorkspace(currentWorkspaceId);
  await waitForWorkspace(workspace);
  const page = workspace.getPage(currentPageId);
  assertExists(page);
  if (!page.loaded) {
    await page.waitForLoaded();
  }
  return page;
});

const contentLayoutBaseAtom = atom<ExpectedLayout>('editor');

type SetStateAction<Value> = Value | ((prev: Value) => Value);
export const contentLayoutAtom = atom<
  ExpectedLayout,
  [SetStateAction<ExpectedLayout>],
  void
>(
  get => get(contentLayoutBaseAtom),
  (_, set, layout) => {
    set(contentLayoutBaseAtom, prev => {
      let setV: (prev: ExpectedLayout) => ExpectedLayout;
      if (typeof layout !== 'function') {
        setV = () => layout;
      } else {
        setV = layout;
      }
      const nextValue = setV(prev);
      if (nextValue === 'editor') {
        return nextValue;
      }
      if (nextValue.first !== 'editor') {
        throw new Error('The first element of the layout should be editor.');
      }
      if (nextValue.splitPercentage && nextValue.splitPercentage < 70) {
        throw new Error('The split percentage should be greater than 70.');
      }
      return nextValue;
    });
  }
);
