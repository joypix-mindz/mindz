import { DebugLogger } from '@affine/debug';
import { setUpLanguage, useTranslation } from '@affine/i18n';
import { assertExists, nanoid } from '@blocksuite/store';
import { NoSsr } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type React from 'react';
import { Suspense, useCallback, useEffect } from 'react';

import {
  currentWorkspaceIdAtom,
  jotaiWorkspacesAtom,
  openQuickSearchModalAtom,
  openWorkspacesModalAtom,
  workspaceLockAtom,
} from '../atoms';
import { HelpIsland } from '../components/pure/help-island';
import { PageLoading } from '../components/pure/loading';
import WorkSpaceSliderBar from '../components/pure/workspace-slider-bar';
import { useAffineRefreshAuthToken } from '../hooks/affine/use-affine-refresh-auth-token';
import { useCurrentPageId } from '../hooks/current/use-current-page-id';
import { useCurrentWorkspace } from '../hooks/current/use-current-workspace';
import { useBlockSuiteWorkspaceHelper } from '../hooks/use-blocksuite-workspace-helper';
import { useCreateFirstWorkspace } from '../hooks/use-create-first-workspace';
import { useRouterHelper } from '../hooks/use-router-helper';
import { useRouterTitle } from '../hooks/use-router-title';
import { useWorkspaces } from '../hooks/use-workspaces';
import { WorkspacePlugins } from '../plugins';
import { ModalProvider } from '../providers/ModalProvider';
import type { RemWorkspace } from '../shared';
import { pathGenerator, publicPathGenerator } from '../shared';
import { StyledPage, StyledToolWrapper, StyledWrapper } from './styles';

declare global {
  // eslint-disable-next-line no-var
  var currentWorkspace: RemWorkspace;
}

const QuickSearchModal = dynamic(
  () => import('../components/pure/quick-search-modal')
);

const logger = new DebugLogger('workspace-layout');
export const WorkspaceLayout: React.FC<React.PropsWithChildren> =
  function WorkspacesSuspense({ children }) {
    const { i18n } = useTranslation();
    useEffect(() => {
      document.documentElement.lang = i18n.language;
      // todo(himself65): this is a hack, we should use a better way to set the language
      setUpLanguage(i18n);
    }, [i18n]);
    useCreateFirstWorkspace();
    const set = useSetAtom(jotaiWorkspacesAtom);
    useEffect(() => {
      logger.info('mount');
      const controller = new AbortController();
      const lists = Object.values(WorkspacePlugins)
        .sort((a, b) => a.loadPriority - b.loadPriority)
        .map(({ CRUD }) => CRUD.list);
      async function fetch() {
        const items = [];
        for (const list of lists) {
          try {
            const item = await list();
            items.push(...item.map(x => ({ id: x.id, flavour: x.flavour })));
          } catch (e) {
            logger.error('list data error:', e);
          }
        }
        if (controller.signal.aborted) {
          return;
        }
        set([...items]);
        logger.info('mount first data:', items);
      }
      fetch();
      return () => {
        controller.abort();
        logger.info('unmount');
      };
    }, [set]);
    const currentWorkspaceId = useAtomValue(currentWorkspaceIdAtom);
    return (
      <NoSsr>
        {/* fixme(himself65): don't re-render whole modals */}
        <ModalProvider key={currentWorkspaceId} />
        <Suspense fallback={<PageLoading />}>
          <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
        </Suspense>
      </NoSsr>
    );
  };

function AffineWorkspaceEffect() {
  useAffineRefreshAuthToken();
  return null;
}

export const WorkspaceLayoutInner: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [currentWorkspace] = useCurrentWorkspace();
  const [currentPageId] = useCurrentPageId();
  const workspaces = useWorkspaces();

  useEffect(() => {
    logger.info('workspaces: ', workspaces);
  }, [workspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      globalThis.currentWorkspace = currentWorkspace;
    }
  }, [currentWorkspace]);

  useEffect(() => {
    const providers = workspaces.flatMap(workspace =>
      workspace.providers.filter(provider => provider.background)
    );
    providers.forEach(provider => {
      provider.connect();
    });
    return () => {
      providers.forEach(provider => {
        provider.disconnect();
      });
    };
  }, [workspaces]);
  useEffect(() => {
    if (currentWorkspace) {
      currentWorkspace.providers.forEach(provider => {
        if (provider.background) {
          return;
        }
        provider.connect();
      });
      return () => {
        currentWorkspace.providers.forEach(provider => {
          if (provider.background) {
            return;
          }
          provider.disconnect();
        });
      };
    }
  }, [currentWorkspace]);
  const router = useRouter();
  const { jumpToPage, jumpToPublicWorkspacePage } = useRouterHelper(router);
  const [, setOpenWorkspacesModal] = useAtom(openWorkspacesModalAtom);
  const helper = useBlockSuiteWorkspaceHelper(
    currentWorkspace?.blockSuiteWorkspace ?? null
  );
  const isPublicWorkspace =
    router.pathname.split('/')[1] === 'public-workspace';
  const title = useRouterTitle(router);
  const handleOpenPage = useCallback(
    (pageId: string) => {
      assertExists(currentWorkspace);
      if (isPublicWorkspace) {
        jumpToPublicWorkspacePage(currentWorkspace.id, pageId);
      } else {
        jumpToPage(currentWorkspace.id, pageId);
      }
    },
    [currentWorkspace, isPublicWorkspace, jumpToPage, jumpToPublicWorkspacePage]
  );
  const handleCreatePage = useCallback(() => {
    return helper.createPage(nanoid());
  }, [helper]);
  const handleOpenWorkspaceListModal = useCallback(() => {
    setOpenWorkspacesModal(true);
  }, [setOpenWorkspacesModal]);

  const [openQuickSearchModal, setOpenQuickSearchModalAtom] = useAtom(
    openQuickSearchModalAtom
  );
  const handleOpenQuickSearchModal = useCallback(() => {
    setOpenQuickSearchModalAtom(true);
  }, [setOpenQuickSearchModalAtom]);
  const lock = useAtomValue(workspaceLockAtom);
  if (lock) {
    return <PageLoading />;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <StyledPage>
        <WorkSpaceSliderBar
          isPublicWorkspace={isPublicWorkspace}
          onOpenQuickSearchModal={handleOpenQuickSearchModal}
          currentWorkspace={currentWorkspace}
          currentPageId={currentPageId}
          onOpenWorkspaceListModal={handleOpenWorkspaceListModal}
          openPage={handleOpenPage}
          createPage={handleCreatePage}
          currentPath={router.asPath.split('?')[0]}
          paths={isPublicWorkspace ? publicPathGenerator : pathGenerator}
        />
        <StyledWrapper className="main-container">
          <AffineWorkspaceEffect />
          {children}
          <StyledToolWrapper>
            {/* fixme(himself65): remove this */}
            <div id="toolWrapper" style={{ marginBottom: '12px' }}>
              {/* Slot for block hub */}
            </div>
            {!isPublicWorkspace && (
              <HelpIsland
                showList={router.query.pageId ? undefined : ['contact']}
              />
            )}
          </StyledToolWrapper>
        </StyledWrapper>
      </StyledPage>
      {currentWorkspace?.blockSuiteWorkspace && (
        <QuickSearchModal
          blockSuiteWorkspace={currentWorkspace?.blockSuiteWorkspace}
          open={openQuickSearchModal}
          setOpen={setOpenQuickSearchModalAtom}
          router={router}
        />
      )}
    </>
  );
};
