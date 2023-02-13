import { ReactElement, useEffect, useMemo, useState } from 'react';
import type { NextPageWithLayout } from '../..//_app';
import { displayFlex, styled } from '@affine/component';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { PageLoading } from '@/components/loading';
import { Breadcrumbs } from '@affine/component';
import { IconButton } from '@affine/component';
import NextLink from 'next/link';
import { PaperIcon, SearchIcon } from '@blocksuite/icons';
import { WorkspaceUnitAvatar } from '@/components/workspace-avatar';
import { useModal } from '@/store/globalModal';
import { usePublicWorkspace } from '@/hooks/use-public-workspace';
import { useTranslation } from '@affine/i18n';

const DynamicBlocksuite = dynamic(() => import('@/components/editor'), {
  ssr: false,
});

const Page: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceId, pageId } = router.query as Record<string, string>;
  const workspaceUnit = usePublicWorkspace(workspaceId);
  const [loaded, setLoaded] = useState(false);
  const { triggerQuickSearchModal } = useModal();
  const { t } = useTranslation();

  const page = useMemo(() => {
    if (workspaceUnit?.blocksuiteWorkspace) {
      return workspaceUnit.blocksuiteWorkspace.getPage(pageId);
    }
    return null;
  }, [workspaceUnit, pageId]);

  const workspace = workspaceUnit?.blocksuiteWorkspace;
  const pageTitle = page?.meta.title;
  const workspaceName = workspace?.meta.name;

  useEffect(() => {
    const pageNotFound = workspace?.meta.pageMetas.every(p => p.id !== pageId);
    if (workspace && pageNotFound) {
      router.push('/404');
    }
  }, [workspace, router, pageId]);

  return (
    <>
      {!loaded && <PageLoading />}
      <PageContainer>
        <NavContainer>
          <Breadcrumbs>
            <StyledBreadcrumbs href={`/public-workspace/${workspaceId}`}>
              <WorkspaceUnitAvatar
                size={24}
                name={workspaceName}
                workspaceUnit={workspaceUnit}
              />
              <span>{workspaceName}</span>
            </StyledBreadcrumbs>
            <StyledBreadcrumbs
              href={`/public-workspace/${workspaceId}/${pageId}`}
            >
              <PaperIcon fontSize={24} />
              <span>{pageTitle ? pageTitle : t('Untitled')}</span>
            </StyledBreadcrumbs>
          </Breadcrumbs>
          <SearchButton
            onClick={() => {
              triggerQuickSearchModal();
            }}
          >
            <SearchIcon />
          </SearchButton>
        </NavContainer>

        {workspace && page && (
          <DynamicBlocksuite
            page={page}
            workspace={workspace}
            setEditor={editor => {
              editor.readonly = true;
              setLoaded(true);
            }}
          />
        )}
      </PageContainer>
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <div>{page}</div>;
};

export default Page;

export const PageContainer = styled.div(({ theme }) => {
  return {
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: theme.colors.pageBackground,
  };
});
export const NavContainer = styled.div(({ theme }) => {
  return {
    width: '100vw',
    padding: '0 12px',
    height: '60px',
    ...displayFlex('start', 'center'),
    backgroundColor: theme.colors.pageBackground,
  };
});
export const StyledBreadcrumbs = styled(NextLink)(({ theme }) => {
  return {
    flex: 1,
    ...displayFlex('center', 'center'),
    paddingLeft: '12px',
    span: {
      padding: '0 12px',
      fontSize: theme.font.base,
      lineHeight: theme.font.lineHeight,
    },
    ':hover': { color: theme.colors.primaryColor },
    transition: 'all .15s',
    ':visited': {
      color: theme.colors.popoverColor,
      ':hover': { color: theme.colors.primaryColor },
    },
  };
});
export const SearchButton = styled(IconButton)(({ theme }) => {
  return {
    color: theme.colors.iconColor,
    fontSize: '24px',
    marginLeft: 'auto',
    padding: '0 24px',
  };
});
