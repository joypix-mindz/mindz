import { assertExists } from '@blocksuite/global/utils';
import type { Page, Workspace } from '@blocksuite/store';
import { type Atom, atom, useAtomValue } from 'jotai';

import { useBlockSuiteWorkspacePage } from './use-block-suite-workspace-page';

const weakMap = new WeakMap<Page, Atom<string[]>>();
function getPageReferences(page: Page): string[] {
  // todo: is there a way to use page indexer to get all references?
  return page
    .getBlockByFlavour('affine:paragraph')
    .flatMap(b => b.text?.toDelta())
    .map(v => v?.attributes?.reference?.pageId)
    .filter(Boolean);
}

const getPageReferencesAtom = (page: Page) => {
  if (!weakMap.has(page)) {
    const baseAtom = atom<string[]>(getPageReferences(page));
    baseAtom.onMount = set => {
      const dispose = page.slots.yUpdated.on(() => {
        set(getPageReferences(page));
      });
      return () => {
        dispose.dispose();
      };
    };
    weakMap.set(page, baseAtom);
  }
  return weakMap.get(page) as Atom<string[]>;
};

export function useBlockSuitePageReferences(
  blockSuiteWorkspace: Workspace,
  pageId: string
): string[] {
  const page = useBlockSuiteWorkspacePage(blockSuiteWorkspace, pageId);
  assertExists(page);
  return useAtomValue(getPageReferencesAtom(page));
}
