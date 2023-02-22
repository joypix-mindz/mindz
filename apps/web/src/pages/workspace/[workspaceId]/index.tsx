import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';

import { PageLoading } from '@/components/loading';
import useEnsureWorkspace from '@/hooks/use-ensure-workspace';
import usePageHelper from '@/hooks/use-page-helper';
import { useGlobalState } from '@/store/app';

const WorkspaceIndex = () => {
  const router = useRouter();
  const currentWorkspace = useGlobalState(
    useCallback(store => store.currentDataCenterWorkspace, [])
  );
  const { createPage } = usePageHelper();
  const { workspaceLoaded, activeWorkspaceId } = useEnsureWorkspace();

  useEffect(() => {
    const initPage = async () => {
      if (!workspaceLoaded) {
        return;
      }
      const savedPageId =
        currentWorkspace?.blocksuiteWorkspace?.meta.pageMetas.find(
          meta => !meta.trash
        )?.id;
      if (savedPageId) {
        router.replace(`/workspace/${activeWorkspaceId}/${savedPageId}`);
        return;
      }

      const pageId = await createPage();
      router.replace(`/workspace/${activeWorkspaceId}/${pageId}`);
    };
    initPage();
  }, [
    currentWorkspace,
    createPage,
    router,
    workspaceLoaded,
    activeWorkspaceId,
  ]);

  return <PageLoading />;
};

export default WorkspaceIndex;
