import { MuiCollapse } from '@affine/component';
import { Tooltip } from '@affine/component';
import { IconButton } from '@affine/component';
import { useTranslation } from '@affine/i18n';
import {
  ArrowDownSmallIcon,
  DeleteTemporarilyIcon,
  FavoriteIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from '@blocksuite/icons';
import { PageMeta } from '@blocksuite/store';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';

import { usePageMeta } from '../../../hooks/use-page-meta';
import { RemWorkspace } from '../../../shared';
import { Arrow } from './icons';
import {
  StyledArrowButton,
  StyledLink,
  StyledListItem,
  StyledNewPageButton,
  StyledSliderBar,
  StyledSliderBarWrapper,
  StyledSubListItem,
} from './style';
import { WorkspaceSelector } from './WorkspaceSelector';

export type FavoriteListProps = {
  currentPageId: string | null;
  openPage: (pageId: string) => void;
  showList: boolean;
  pageMeta: PageMeta[];
};

const FavoriteList: React.FC<FavoriteListProps> = ({
  pageMeta,
  openPage,
  showList,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const favoriteList = useMemo(
    () => pageMeta.filter(p => p.favorite && !p.trash),
    [pageMeta]
  );
  return (
    <MuiCollapse in={showList}>
      {favoriteList.map((pageMeta, index) => {
        const active = router.query.pageId === pageMeta.id;
        return (
          <StyledSubListItem
            data-testid={`favorite-list-item-${pageMeta.id}`}
            active={active}
            key={`${pageMeta}-${index}`}
            onClick={() => {
              if (active) {
                return;
              }
              openPage(pageMeta.id);
            }}
          >
            {pageMeta.title || 'Untitled'}
          </StyledSubListItem>
        );
      })}
      {favoriteList.length === 0 && (
        <StyledSubListItem disable={true}>{t('No item')}</StyledSubListItem>
      )}
    </MuiCollapse>
  );
};

export type WorkSpaceSliderBarProps = {
  isPublicWorkspace: boolean;
  onOpenQuickSearchModal: () => void;
  onOpenWorkspaceListModal: () => void;
  currentWorkspace: RemWorkspace | null;
  currentPageId: string | null;
  openPage: (pageId: string) => void;
  createPage: () => Promise<string>;
  show: boolean;
  setShow: (show: boolean) => void;
  currentPath: string;
  paths: {
    all: (workspaceId: string) => string;
    favorite: (workspaceId: string) => string;
    trash: (workspaceId: string) => string;
    setting: (workspaceId: string) => string;
  };
};

export const WorkSpaceSliderBar: React.FC<WorkSpaceSliderBarProps> = ({
  isPublicWorkspace,
  currentWorkspace,
  currentPageId,
  openPage,
  createPage,
  show,
  setShow,
  currentPath,
  paths,
  onOpenQuickSearchModal,
  onOpenWorkspaceListModal,
}) => {
  const currentWorkspaceId = currentWorkspace?.id || null;
  const [showSubFavorite, setShowSubFavorite] = useState(true);
  const [showTip, setShowTip] = useState(false);
  const { t } = useTranslation();
  const pageMeta = usePageMeta(currentWorkspace?.blockSuiteWorkspace ?? null);
  const onClickNewPage = useCallback(async () => {
    const pageId = await createPage();
    if (pageId) {
      openPage(pageId);
    }
  }, [createPage, openPage]);
  return (
    <>
      <StyledSliderBar show={isPublicWorkspace ? false : show}>
        <Tooltip
          content={show ? t('Collapse sidebar') : t('Expand sidebar')}
          placement="right"
          visible={showTip}
        >
          <StyledArrowButton
            data-testid="sliderBar-arrowButton"
            isShow={show}
            style={{
              visibility: isPublicWorkspace ? 'hidden' : 'visible',
            }}
            onClick={useCallback(() => {
              setShow(!show);
              setShowTip(false);
            }, [setShow, show])}
            onMouseEnter={useCallback(() => {
              setShowTip(true);
            }, [])}
            onMouseLeave={useCallback(() => {
              setShowTip(false);
            }, [])}
          >
            <Arrow />
          </StyledArrowButton>
        </Tooltip>

        <StyledSliderBarWrapper data-testid="sliderBar">
          <WorkspaceSelector
            currentWorkspace={currentWorkspace}
            onClick={onOpenWorkspaceListModal}
          />

          <StyledListItem
            data-testid="slider-bar-quick-search-button"
            style={{ cursor: 'pointer' }}
            onClick={useCallback(() => {
              onOpenQuickSearchModal();
            }, [onOpenQuickSearchModal])}
          >
            <SearchIcon />
            {t('Quick search')}
          </StyledListItem>
          <Link
            href={{
              pathname: currentWorkspaceId && paths.all(currentWorkspaceId),
            }}
          >
            <StyledListItem
              active={
                currentPath ===
                (currentWorkspaceId && paths.all(currentWorkspaceId))
              }
            >
              <FolderIcon />
              <span data-testid="all-pages">{t('All pages')}</span>
            </StyledListItem>
          </Link>
          <StyledListItem
            active={
              currentPath ===
              (currentWorkspaceId && paths.favorite(currentWorkspaceId))
            }
          >
            <StyledLink
              href={{
                pathname:
                  currentWorkspaceId && paths.favorite(currentWorkspaceId),
              }}
            >
              <FavoriteIcon />
              {t('Favorites')}
            </StyledLink>
            <IconButton
              darker={true}
              onClick={useCallback(() => {
                setShowSubFavorite(!showSubFavorite);
              }, [showSubFavorite])}
            >
              <ArrowDownSmallIcon
                style={{
                  transform: `rotate(${showSubFavorite ? '180' : '0'}deg)`,
                }}
              />
            </IconButton>
          </StyledListItem>
          <FavoriteList
            currentPageId={currentPageId}
            showList={showSubFavorite}
            openPage={openPage}
            pageMeta={pageMeta}
          />
          <StyledListItem
            active={
              currentPath ===
              (currentWorkspaceId && paths.setting(currentWorkspaceId))
            }
          >
            <StyledLink
              href={{
                pathname:
                  currentWorkspaceId && paths.setting(currentWorkspaceId),
              }}
            >
              <SettingsIcon />
              {t('Workspace Settings')}
            </StyledLink>
          </StyledListItem>

          {/* <WorkspaceSetting
            isShow={showWorkspaceSetting}
            onClose={() => {
              setShowWorkspaceSetting(false);
            }}
          /> */}
          {/* TODO: will finish the feature next version */}
          {/* <StyledListItem
            onClick={() => {
              triggerImportModal();
            }}
          >
            <ImportIcon /> {t('Import')}
          </StyledListItem> */}

          <Link
            href={{
              pathname: currentWorkspaceId && paths.trash(currentWorkspaceId),
            }}
          >
            <StyledListItem
              active={
                currentPath ===
                (currentWorkspaceId && paths.trash(currentWorkspaceId))
              }
            >
              <DeleteTemporarilyIcon /> {t('Trash')}
            </StyledListItem>
          </Link>
          <StyledNewPageButton
            data-testid="new-page-button"
            onClick={onClickNewPage}
          >
            <PlusIcon /> {t('New Page')}
          </StyledNewPageButton>
        </StyledSliderBarWrapper>
      </StyledSliderBar>
    </>
  );
};

export default WorkSpaceSliderBar;
