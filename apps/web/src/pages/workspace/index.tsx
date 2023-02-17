import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';

import { PageLoading } from '@/components/loading';
import useEnsureWorkspace from '@/hooks/use-ensure-workspace';
import { useGlobalState } from '@/store/app';

export const WorkspaceIndex = () => {
  const router = useRouter();
  const currentWorkspace = useGlobalState(
    useCallback(store => store.currentDataCenterWorkspace, [])
  );
  const { workspaceLoaded } = useEnsureWorkspace();

  useEffect(() => {
    if (workspaceLoaded) {
      router.push(`/workspace/${currentWorkspace?.id}`);
    }
  }, [currentWorkspace, router, workspaceLoaded]);

  return <PageLoading />;
};

export default WorkspaceIndex;
