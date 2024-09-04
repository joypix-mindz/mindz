import {
  createReactComponentFromLit,
  useConfirmModal,
  useLitPortalFactory,
} from '@affine/component';
import { useJournalInfoHelper } from '@affine/core/hooks/use-journal';
import { EditorSettingService } from '@affine/core/modules/editor-settting';
import { PeekViewService } from '@affine/core/modules/peek-view';
import type { DocMode } from '@blocksuite/blocks';
import { DocTitle, EdgelessEditor, PageEditor } from '@blocksuite/presets';
import type { Doc } from '@blocksuite/store';
import {
  DocService,
  DocsService,
  useFramework,
  useLiveData,
  useService,
} from '@toeverything/infra';
import React, {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { PagePropertiesTable } from '../../affine/page-properties';
import { AffinePageReference } from '../../affine/reference-link';
import { BiDirectionalLinkPanel } from './bi-directional-link-panel';
import { BlocksuiteEditorJournalDocTitle } from './journal-doc-title';
import {
  patchDocModeService,
  patchEdgelessClipboard,
  patchForSharedPage,
  patchNotificationService,
  patchPeekViewService,
  patchQuickSearchService,
  patchReferenceRenderer,
  type ReferenceReactRenderer,
} from './specs/custom/spec-patchers';
import { createEdgelessModeSpecs } from './specs/edgeless';
import { createPageModeSpecs } from './specs/page';
import * as styles from './styles.css';

const adapted = {
  DocEditor: createReactComponentFromLit({
    react: React,
    elementClass: PageEditor,
  }),
  DocTitle: createReactComponentFromLit({
    react: React,
    elementClass: DocTitle,
  }),
  EdgelessEditor: createReactComponentFromLit({
    react: React,
    elementClass: EdgelessEditor,
  }),
};

interface BlocksuiteEditorProps {
  page: Doc;
  shared?: boolean;
}

const usePatchSpecs = (page: Doc, shared: boolean, mode: DocMode) => {
  const [reactToLit, portals] = useLitPortalFactory();
  const peekViewService = useService(PeekViewService);
  const docService = useService(DocService);
  const docsService = useService(DocsService);
  const framework = useFramework();
  const referenceRenderer: ReferenceReactRenderer = useMemo(() => {
    return function customReference(reference) {
      const data = reference.delta.attributes?.reference;
      if (!data) return <span />;

      const pageId = data.pageId;
      if (!pageId) return <span />;

      return (
        <AffinePageReference
          docCollection={page.collection}
          pageId={pageId}
          mode={mode}
          params={data.params}
        />
      );
    };
  }, [mode, page.collection]);

  const specs = useMemo(() => {
    return mode === 'edgeless'
      ? createEdgelessModeSpecs(framework)
      : createPageModeSpecs(framework);
  }, [mode, framework]);

  const confirmModal = useConfirmModal();
  const patchedSpecs = useMemo(() => {
    let patched = specs.concat(
      patchReferenceRenderer(reactToLit, referenceRenderer)
    );
    patched = patched.concat(patchNotificationService(confirmModal));
    patched = patched.concat(patchPeekViewService(peekViewService));
    patched = patched.concat(patchEdgelessClipboard());
    if (!page.readonly) {
      patched = patched.concat(patchQuickSearchService(framework));
    }
    if (shared) {
      patched = patched.concat(patchForSharedPage());
    }
    patched = patched.concat(patchDocModeService(docService, docsService));
    return patched;
  }, [
    confirmModal,
    docService,
    docsService,
    framework,
    page.readonly,
    peekViewService,
    reactToLit,
    referenceRenderer,
    shared,
    specs,
  ]);

  return [
    patchedSpecs,
    useMemo(
      () => (
        <>
          {portals.map(p => (
            <Fragment key={p.id}>{p.portal}</Fragment>
          ))}
        </>
      ),
      [portals]
    ),
  ] as const;
};

export const BlocksuiteDocEditor = forwardRef<
  PageEditor,
  BlocksuiteEditorProps & {
    onClickBlank?: () => void;
    titleRef?: React.Ref<DocTitle>;
  }
>(function BlocksuiteDocEditor(
  { page, shared, onClickBlank, titleRef: externalTitleRef },
  ref
) {
  const titleRef = useRef<DocTitle | null>(null);
  const docRef = useRef<PageEditor | null>(null);
  const { isJournal } = useJournalInfoHelper(page.collection, page.id);

  const editorSettingService = useService(EditorSettingService);

  const onDocRef = useCallback(
    (el: PageEditor) => {
      docRef.current = el;
      if (ref) {
        if (typeof ref === 'function') {
          ref(el);
        } else {
          ref.current = el;
        }
      }
    },
    [ref]
  );

  const onTitleRef = useCallback(
    (el: DocTitle) => {
      titleRef.current = el;
      if (externalTitleRef) {
        if (typeof externalTitleRef === 'function') {
          externalTitleRef(el);
        } else {
          (externalTitleRef as any).current = el;
        }
      }
    },
    [externalTitleRef]
  );

  const [specs, portals] = usePatchSpecs(page, !!shared, 'page');

  const settings = useLiveData(editorSettingService.editorSetting.settings$);

  return (
    <>
      <div className={styles.affineDocViewport} style={{ height: '100%' }}>
        {!isJournal ? (
          <adapted.DocTitle doc={page} ref={onTitleRef} />
        ) : (
          <BlocksuiteEditorJournalDocTitle page={page} />
        )}
        {!shared ? <PagePropertiesTable docId={page.id} /> : null}
        <adapted.DocEditor
          className={styles.docContainer}
          ref={onDocRef}
          doc={page}
          specs={specs}
          hasViewport={false}
        />
        <div className={styles.docEditorGap} onClick={onClickBlank}></div>
        {!shared && settings.displayBiDirectionalLink ? (
          <BiDirectionalLinkPanel />
        ) : null}
      </div>
      {portals}
    </>
  );
});
export const BlocksuiteEdgelessEditor = forwardRef<
  EdgelessEditor,
  BlocksuiteEditorProps
>(function BlocksuiteEdgelessEditor({ page, shared }, ref) {
  const [specs, portals] = usePatchSpecs(page, !!shared, 'edgeless');
  const editorRef = useRef<EdgelessEditor | null>(null);

  const onDocRef = useCallback(
    (el: EdgelessEditor) => {
      editorRef.current = el;
      if (ref) {
        if (typeof ref === 'function') {
          ref(el);
        } else {
          ref.current = el;
        }
      }
    },
    [ref]
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateComplete
        .then(() => {
          // make sure editor can get keyboard events on showing up
          editorRef.current?.querySelector('affine-edgeless-root')?.click();
        })
        .catch(console.error);
    }
  }, []);

  return (
    <>
      <adapted.EdgelessEditor ref={onDocRef} doc={page} specs={specs} />
      {portals}
    </>
  );
});
