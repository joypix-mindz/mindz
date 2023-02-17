import { MuiCollapse } from '@affine/component';
import { Tooltip } from '@affine/component';
import { IconButton } from '@affine/component';
import { useTranslation } from '@affine/i18n';
import {
  AllPagesIcon,
  ArrowDownIcon,
  FavouritesIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
} from '@blocksuite/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useState } from 'react';

import useLocalStorage from '@/hooks/use-local-storage';
import { usePageHelper } from '@/hooks/use-page-helper';
import { useGlobalState } from '@/store/app';
import { useModal } from '@/store/globalModal';

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
import { WorkspaceSelector } from './WorkspaceSelector/WorkspaceSelector';

const FavoriteList = ({ showList }: { showList: boolean }) => {
  const { openPage } = usePageHelper();
  const pageList = useGlobalState(store => store.dataCenterPageList);
  const router = useRouter();
  const { t } = useTranslation();
  const favoriteList = pageList.filter(p => p.favorite && !p.trash);
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
export const WorkSpaceSliderBar = () => {
  const { triggerQuickSearchModal } = useModal();
  const [showSubFavorite, setShowSubFavorite] = useState(true);
  const currentWorkspace = useGlobalState(
    useCallback(store => store.currentDataCenterWorkspace, [])
  );
  const { openPage, createPage } = usePageHelper();
  const router = useRouter();
  const { t } = useTranslation();
  const [showTip, setShowTip] = useState(false);
  const [show, setShow] = useLocalStorage('AFFiNE_SLIDE_BAR', false, true);
  const currentWorkspaceId = currentWorkspace?.id;
  const paths = {
    all: currentWorkspaceId ? `/workspace/${currentWorkspaceId}/all` : '',
    favorite: currentWorkspaceId
      ? `/workspace/${currentWorkspaceId}/favorite`
      : '',
    trash: currentWorkspaceId ? `/workspace/${currentWorkspaceId}/trash` : '',
    setting: currentWorkspaceId
      ? `/workspace/${currentWorkspaceId}/setting`
      : '',
  };
  return (
    <>
      <StyledSliderBar show={show}>
        <Tooltip
          content={show ? t('Collapse sidebar') : t('Expand sidebar')}
          placement="right"
          visible={showTip}
        >
          <StyledArrowButton
            data-testid="sliderBar-arrowButton"
            isShow={show}
            onClick={() => {
              setShow(!show);
              setShowTip(false);
            }}
            onMouseEnter={() => {
              setShowTip(true);
            }}
            onMouseLeave={() => {
              setShowTip(false);
            }}
          >
            <Arrow />
          </StyledArrowButton>
        </Tooltip>

        <StyledSliderBarWrapper data-testid="sliderBar">
          <WorkspaceSelector />

          <StyledListItem
            data-testid="sliderBar-quickSearchButton"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              triggerQuickSearchModal();
            }}
          >
            <SearchIcon />
            {t('Quick search')}
          </StyledListItem>
          <Link href={{ pathname: paths.all }}>
            <StyledListItem active={router.asPath === paths.all}>
              <AllPagesIcon />
              <span data-testid="all-pages">{t('All pages')}</span>
            </StyledListItem>
          </Link>
          <StyledListItem active={router.asPath === paths.favorite}>
            <StyledLink href={{ pathname: paths.favorite }}>
              <FavouritesIcon />
              {t('Favorites')}
            </StyledLink>
            <IconButton
              darker={true}
              onClick={() => {
                setShowSubFavorite(!showSubFavorite);
              }}
            >
              <ArrowDownIcon
                style={{
                  transform: `rotate(${showSubFavorite ? '180' : '0'}deg)`,
                }}
              />
            </IconButton>
          </StyledListItem>
          <FavoriteList showList={showSubFavorite} />
          <StyledListItem active={router.asPath === paths.setting}>
            <StyledLink href={{ pathname: paths.setting }}>
              <SettingsIcon />
              {t('Settings')}
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

          <Link href={{ pathname: paths.trash }}>
            <StyledListItem active={router.asPath === paths.trash}>
              <TrashIcon /> {t('Trash')}
            </StyledListItem>
          </Link>
          <StyledNewPageButton
            onClick={async () => {
              const pageId = await createPage();
              if (pageId) {
                openPage(pageId);
              }
            }}
          >
            <PlusIcon /> {t('New Page')}
          </StyledNewPageButton>
        </StyledSliderBarWrapper>
      </StyledSliderBar>
    </>
  );
};

export default WorkSpaceSliderBar;
