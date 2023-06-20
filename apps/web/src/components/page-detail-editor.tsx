import './page-detail-editor.css';

import {
  DEFAULT_HELLO_WORLD_PAGE_ID,
  PageNotFoundError,
} from '@affine/env/constant';
import { rootCurrentEditorAtom } from '@affine/workspace/atom';
import type { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';
import { useBlockSuitePageMeta } from '@toeverything/hooks/use-block-suite-page-meta';
import { useBlockSuiteWorkspacePage } from '@toeverything/hooks/use-block-suite-workspace-page';
import { useBlockSuiteWorkspacePageTitle } from '@toeverything/hooks/use-block-suite-workspace-page-title';
import { affinePluginsAtom } from '@toeverything/plugin-infra/manager';
import type {
  AffinePlugin,
  LayoutNode,
  PluginUIAdapter,
} from '@toeverything/plugin-infra/type';
import type { PluginBlockSuiteAdapter } from '@toeverything/plugin-infra/type';
import { useAtomValue, useSetAtom } from 'jotai';
import Head from 'next/head';
import type { FC, ReactElement } from 'react';
import React, {
  memo,
  startTransition,
  Suspense,
  useCallback,
  useMemo,
} from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { pageSettingFamily } from '../atoms';
import { contentLayoutAtom } from '../atoms/layout';
import type { AffineOfficialWorkspace } from '../shared';
import { BlockSuiteEditor as Editor } from './blocksuite/block-suite-editor';

export type PageDetailEditorProps = {
  isPublic?: boolean;
  workspace: AffineOfficialWorkspace;
  pageId: string;
  onInit: (page: Page, editor: Readonly<EditorContainer>) => void;
  onLoad?: (page: Page, editor: EditorContainer) => () => void;
};

const EditorWrapper = memo(function EditorWrapper({
  workspace,
  pageId,
  onInit,
  onLoad,
  isPublic,
}: PageDetailEditorProps) {
  const affinePluginsMap = useAtomValue(affinePluginsAtom);
  const plugins = useMemo(
    () => Object.values(affinePluginsMap),
    [affinePluginsMap]
  );
  const blockSuiteWorkspace = workspace.blockSuiteWorkspace;
  const page = useBlockSuiteWorkspacePage(blockSuiteWorkspace, pageId);
  if (!page) {
    throw new PageNotFoundError(blockSuiteWorkspace, pageId);
  }
  const meta = useBlockSuitePageMeta(blockSuiteWorkspace).find(
    meta => meta.id === pageId
  );
  const pageSettingAtom = pageSettingFamily(pageId);
  const pageSetting = useAtomValue(pageSettingAtom);
  const currentMode =
    pageSetting?.mode ?? DEFAULT_HELLO_WORLD_PAGE_ID === pageId
      ? 'edgeless'
      : 'page';

  const setEditor = useSetAtom(rootCurrentEditorAtom);
  assertExists(meta);
  return (
    <Editor
      style={{
        height: 'calc(100% - 52px)',
      }}
      key={`${workspace.flavour}-${workspace.id}-${pageId}`}
      mode={isPublic ? 'page' : currentMode}
      page={page}
      onInit={useCallback(
        (page: Page, editor: Readonly<EditorContainer>) => {
          startTransition(() => {
            setEditor(editor);
          });
          onInit(page, editor);
        },
        [onInit, setEditor]
      )}
      onLoad={useCallback(
        (page: Page, editor: EditorContainer) => {
          startTransition(() => {
            setEditor(editor);
          });
          page.workspace.setPageMeta(page.id, {
            updatedDate: Date.now(),
          });
          localStorage.setItem('last_page_id', page.id);
          let dispose = () => {};
          if (onLoad) {
            dispose = onLoad(page, editor);
          }
          const uiDecorators = plugins
            .map(plugin => plugin.blockSuiteAdapter.uiDecorator)
            .filter((ui): ui is PluginBlockSuiteAdapter['uiDecorator'] =>
              Boolean(ui)
            );
          const disposes = uiDecorators.map(ui => ui(editor));
          return () => {
            disposes.map(fn => fn());
            dispose();
          };
        },
        [plugins, onLoad, setEditor]
      )}
    />
  );
});

const PluginContentAdapter = memo<{
  detailContent: PluginUIAdapter['detailContent'];
}>(function PluginContentAdapter({ detailContent }) {
  return (
    <div>
      {detailContent({
        contentLayoutAtom,
      })}
    </div>
  );
});

type LayoutPanelProps = {
  node: LayoutNode;
  editorProps: PageDetailEditorProps;
  plugins: AffinePlugin<string>[];
};

const LayoutPanel = memo(function LayoutPanel(
  props: LayoutPanelProps
): ReactElement {
  const node = props.node;
  if (typeof node === 'string') {
    if (node === 'editor') {
      return <EditorWrapper {...props.editorProps} />;
    } else {
      const plugin = props.plugins.find(
        plugin => plugin.definition.id === node
      );
      const Content = plugin?.uiAdapter.detailContent;
      assertExists(Content);
      return <PluginContentAdapter detailContent={Content} />;
    }
  } else {
    return (
      <PanelGroup direction={node.direction}>
        <Panel defaultSize={node.splitPercentage}>
          <Suspense>
            <LayoutPanel
              node={node.first}
              editorProps={props.editorProps}
              plugins={props.plugins}
            />
          </Suspense>
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={100 - node.splitPercentage}>
          <Suspense>
            <LayoutPanel
              node={node.second}
              editorProps={props.editorProps}
              plugins={props.plugins}
            />
          </Suspense>
        </Panel>
      </PanelGroup>
    );
  }
});

export const PageDetailEditor: FC<PageDetailEditorProps> = props => {
  const { workspace, pageId } = props;
  const blockSuiteWorkspace = workspace.blockSuiteWorkspace;
  const page = useBlockSuiteWorkspacePage(blockSuiteWorkspace, pageId);
  if (!page) {
    throw new PageNotFoundError(blockSuiteWorkspace, pageId);
  }
  const title = useBlockSuiteWorkspacePageTitle(blockSuiteWorkspace, pageId);

  const layout = useAtomValue(contentLayoutAtom);
  const affinePluginsMap = useAtomValue(affinePluginsAtom);
  const plugins = useMemo(
    () => Object.values(affinePluginsMap),
    [affinePluginsMap]
  );

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Suspense>
        <LayoutPanel node={layout} editorProps={props} plugins={plugins} />
      </Suspense>
    </>
  );
};
