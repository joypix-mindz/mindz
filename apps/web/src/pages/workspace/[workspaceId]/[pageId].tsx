import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import {
  createTagFilter,
  useCollectionManager,
} from '@affine/component/page-list';
import { WorkspaceSubPath } from '@affine/env/workspace';
import { rootCurrentPageIdAtom } from '@affine/workspace/atom';
import type { EditorContainer } from '@blocksuite/editor';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import type React from 'react';
import { useCallback } from 'react';

import { getUIAdapter } from '../../../adapters/workspace';
import { pageSettingFamily } from '../../../atoms';
import { useCurrentWorkspace } from '../../../hooks/current/use-current-workspace';
import { useRouterHelper } from '../../../hooks/use-router-helper';
import { WorkspaceLayout } from '../../../layouts/workspace-layout';
import type { NextPageWithLayout } from '../../../shared';

const WorkspaceDetail: React.FC = () => {
  const router = useRouter();
  const { openPage, jumpToSubPath } = useRouterHelper(router);
  const currentPageId = useAtomValue(rootCurrentPageIdAtom);
  const [currentWorkspace] = useCurrentWorkspace();
  assertExists(currentWorkspace);
  assertExists(currentPageId);
  const blockSuiteWorkspace = currentWorkspace.blockSuiteWorkspace;
  const [setting, setSetting] = useAtom(pageSettingFamily(currentPageId));
  const collectionManager = useCollectionManager();
  if (!setting) {
    setSetting({
      mode: 'page',
    });
  }
  const onLoad = useCallback(
    (page: Page, editor: EditorContainer) => {
      const dispose = editor.slots.pageLinkClicked.on(({ pageId }) => {
        return openPage(blockSuiteWorkspace.id, pageId);
      });
      const disposeTagClick = editor.slots.tagClicked.on(async ({ tagId }) => {
        await jumpToSubPath(currentWorkspace.id, WorkspaceSubPath.ALL);
        collectionManager.backToAll();
        collectionManager.setTemporaryFilter([createTagFilter(tagId)]);
      });
      return () => {
        dispose.dispose();
        disposeTagClick.dispose();
      };
    },
    [
      blockSuiteWorkspace.id,
      collectionManager,
      currentWorkspace.id,
      jumpToSubPath,
      openPage,
    ]
  );

  const { PageDetail, Header } = getUIAdapter(currentWorkspace.flavour);
  return (
    <>
      <Header
        currentWorkspaceId={currentWorkspace.id}
        currentEntry={{
          pageId: currentPageId,
        }}
      />
      <PageDetail
        currentWorkspaceId={currentWorkspace.id}
        currentPageId={currentPageId}
        onLoadEditor={onLoad}
      />
    </>
  );
};

const WorkspaceDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [currentWorkspace] = useCurrentWorkspace();
  const currentPageId = useAtomValue(rootCurrentPageIdAtom);
  const page = currentPageId
    ? currentWorkspace.blockSuiteWorkspace.getPage(currentPageId)
    : null;
  if (!router.isReady) {
    return <PageDetailSkeleton key="router-not-ready" />;
  } else if (!currentPageId || !page) {
    return <PageDetailSkeleton key="current-page-is-null" />;
  }
  return <WorkspaceDetail />;
};

export default WorkspaceDetailPage;

WorkspaceDetailPage.getLayout = page => {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};
