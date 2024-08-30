import './page-detail-editor.css';

import { useDocCollectionPage } from '@affine/core/hooks/use-block-suite-workspace-page';
import type { DocMode } from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { AffineEditorContainer } from '@blocksuite/presets';
import type { Doc as BlockSuiteDoc, DocCollection } from '@blocksuite/store';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { memo, Suspense, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { EditorService } from '../modules/editor';
import {
  EditorSettingService,
  fontStyleOptions,
} from '../modules/editor-settting';
import { BlockSuiteEditor as Editor } from './blocksuite/block-suite-editor';
import * as styles from './page-detail-editor.css';

declare global {
  // eslint-disable-next-line no-var
  var currentEditor: AffineEditorContainer | undefined;
}

export type OnLoadEditor = (
  page: BlockSuiteDoc,
  editor: AffineEditorContainer
) => () => void;

export interface PageDetailEditorProps {
  isPublic?: boolean;
  publishMode?: DocMode;
  docCollection: DocCollection;
  pageId: string;
  onLoad?: OnLoadEditor;
}

function useRouterHash() {
  return useLocation().hash.substring(1);
}

const PageDetailEditorMain = memo(function PageDetailEditorMain({
  page,
  onLoad,
}: PageDetailEditorProps & { page: BlockSuiteDoc }) {
  const editor = useService(EditorService).editor;
  const mode = useLiveData(editor.mode$);

  const isSharedMode = editor.isSharedMode;
  const editorSetting = useService(EditorSettingService).editorSetting;
  const settings = useLiveData(editorSetting.settings$);

  const value = useMemo(() => {
    const fontStyle = fontStyleOptions.find(
      option => option.key === settings.fontFamily
    );
    if (!fontStyle) {
      return cssVar('fontSansFamily');
    }
    const customFontFamily = settings.customFontFamily;

    return customFontFamily && fontStyle.key === 'Custom'
      ? `${customFontFamily}, ${fontStyle.value}`
      : fontStyle.value;
  }, [settings.customFontFamily, settings.fontFamily]);

  const blockId = useRouterHash();

  const onLoadEditor = useCallback(
    (editor: AffineEditorContainer) => {
      // debug current detail editor
      globalThis.currentEditor = editor;
      const disposableGroup = new DisposableGroup();
      localStorage.setItem('last_page_id', page.id);

      if (onLoad) {
        // Invoke onLoad once the editor has been mounted to the DOM.
        editor.updateComplete
          .then(() => editor.host?.updateComplete)
          .then(() => {
            disposableGroup.add(onLoad(page, editor));
          })
          .catch(console.error);
      }

      return () => {
        disposableGroup.dispose();
      };
    },
    [onLoad, page]
  );

  return (
    <Editor
      className={clsx(styles.editor, {
        'full-screen': !isSharedMode && settings.fullWidthLayout,
        'is-public': isSharedMode,
      })}
      style={
        {
          '--affine-font-family': value,
        } as CSSProperties
      }
      mode={mode}
      page={page}
      shared={isSharedMode}
      defaultSelectedBlockId={blockId}
      onLoadEditor={onLoadEditor}
    />
  );
});

export const PageDetailEditor = (props: PageDetailEditorProps) => {
  const { docCollection, pageId } = props;
  const page = useDocCollectionPage(docCollection, pageId);
  if (!page) {
    return null;
  }
  return (
    <Suspense>
      <PageDetailEditorMain {...props} page={page} />
    </Suspense>
  );
};
