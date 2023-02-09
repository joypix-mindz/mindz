import { useEffect, useRef } from 'react';
import type { Page, Workspace } from '@blocksuite/store';
import '@blocksuite/blocks';
import { EditorContainer } from '@blocksuite/editor';
import exampleMarkdown from '@/templates/Welcome-to-AFFiNE-Alpha-Downhills.md';
import { styled } from '@affine/component';

const StyledEditorContainer = styled('div')(() => {
  return {
    height: 'calc(100vh - 60px)',
    padding: '0 32px',
  };
});

type Props = {
  page: Page;
  workspace: Workspace;
  setEditor: (editor: EditorContainer) => void;
};

export const Editor = ({ page, workspace, setEditor }: Props) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  // const { currentWorkspace, currentPage, setEditor } = useAppState();
  useEffect(() => {
    const ret = () => {
      const node = editorContainer.current;
      while (node?.firstChild) {
        node.removeChild(node.firstChild);
      }
    };

    const editor = new EditorContainer();
    editor.page = page;
    editorContainer.current?.appendChild(editor);
    if (page.isEmpty) {
      const isFirstPage = workspace?.meta.pageMetas.length === 1;
      // Can not use useCurrentPageMeta to get new title, cause meta title will trigger rerender, but the second time can not remove title
      const { title: metaTitle } = page.meta;
      const title = metaTitle
        ? metaTitle
        : isFirstPage
        ? 'Welcome to AFFiNE Alpha "Downhills"'
        : '';
      workspace?.setPageMeta(page.id, { title });
      const pageBlockId = page.addBlockByFlavour('affine:page', { title });
      page.addBlockByFlavour('affine:surface', {}, null);
      // Add frame block inside page block
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      // Add paragraph block inside frame block
      // If this is a first page in workspace, init an introduction markdown
      if (isFirstPage) {
        editor.clipboard.importMarkdown(exampleMarkdown, frameId);
        workspace.setPageMeta(page.id, { title });
        page.resetHistory();
      } else {
        page.addBlockByFlavour('affine:paragraph', {}, frameId);
      }
      page.resetHistory();
    }

    setEditor(editor);
    return ret;
  }, [workspace, page, setEditor]);

  return <StyledEditorContainer ref={editorContainer} />;
};

export default Editor;
