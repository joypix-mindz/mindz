import { initEmptyPage } from '@affine/env/blocksuite';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { getOrCreateWorkspace } from '@affine/workspace/manager';
import type { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import { useCallback } from 'react';

import { BlockSuiteEditor } from '../../blocksuite/block-suite-editor';

const blockSuiteWorkspace = getOrCreateWorkspace(
  'test',
  WorkspaceFlavour.LOCAL
);

const page = blockSuiteWorkspace.createPage({ id: 'page0' });

const Editor = () => {
  const onLoad = useCallback((page: Page, editor: EditorContainer) => {
    // @ts-expect-error
    globalThis.page = page;
    // @ts-expect-error
    globalThis.editor = editor;
    return () => void 0;
  }, []);

  if (!page) {
    return <>loading...</>;
  }
  return (
    <BlockSuiteEditor
      page={page}
      mode="page"
      onInit={initEmptyPage}
      onLoad={onLoad}
    />
  );
};

export default Editor;
