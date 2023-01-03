import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  StyledArrowButton,
  StyledLink,
  StyledListItem,
  // StyledListItemForWorkspace,
  StyledNewPageButton,
  StyledSliderBar,
  StyledSliderBarWrapper,
  StyledSubListItem,
} from './style';
import { Arrow } from './icons';
import Collapse from '@mui/material/Collapse';
import {
  ArrowDownIcon,
  SearchIcon,
  AllPagesIcon,
  FavouritesIcon,
  ImportIcon,
  TrashIcon,
  AddIcon,
} from '@blocksuite/icons';
import Link from 'next/link';
import { Tooltip } from '@/ui/tooltip';
import { useModal } from '@/providers/global-modal-provider';
import { useAppState } from '@/providers/app-state-provider/context';

import { IconButton } from '@/ui/button';
// import { WorkspaceSelector } from './WorkspaceSelector';
import useLocalStorage from '@/hooks/use-local-storage';
import usePageMetaList from '@/hooks/use-page-meta-list';
import { usePageHelper } from '@/hooks/use-page-helper';
import { getUaHelper } from '@/utils';

const isMac = () => {
  return getUaHelper().isMacOs;
};
const FavoriteList = ({ showList }: { showList: boolean }) => {
  const { openPage } = usePageHelper();
  const pageList = usePageMetaList();
  const router = useRouter();

  const favoriteList = pageList.filter(p => p.favorite && !p.trash);
  return (
    <Collapse in={showList}>
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
        <StyledSubListItem disable={true}>No item</StyledSubListItem>
      )}
    </Collapse>
  );
};
export const WorkSpaceSliderBar = () => {
  const { triggerQuickSearchModal, triggerImportModal } = useModal();
  const [showSubFavorite, setShowSubFavorite] = useState(true);
  const { currentWorkspaceId } = useAppState();
  const { openPage, createPage } = usePageHelper();
  const router = useRouter();

  const [showTip, setShowTip] = useState(false);
  const [show, setShow] = useLocalStorage('AFFiNE_SLIDE_BAR', false, true);

  const paths = {
    all: currentWorkspaceId ? `/workspace/${currentWorkspaceId}/all` : '',
    favorite: currentWorkspaceId
      ? `/workspace/${currentWorkspaceId}/favorite`
      : '',
    trash: currentWorkspaceId ? `/workspace/${currentWorkspaceId}/trash` : '',
  };

  return (
    <>
      <StyledSliderBar show={show}>
        <Tooltip
          content={show ? 'Collapse sidebar' : 'Expand sidebar'}
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
          {/* <StyledListItemForWorkspace>
            <WorkspaceSelector />
          </StyledListItemForWorkspace> */}
          <StyledListItem
            data-testid="sliderBar-quickSearchButton"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              triggerQuickSearchModal();
            }}
          >
            <SearchIcon />
            Quick search
          </StyledListItem>
          <Link href={{ pathname: paths.all }}>
            <StyledListItem active={router.asPath === paths.all}>
              <AllPagesIcon /> <span>All pages</span>
            </StyledListItem>
          </Link>
          <StyledListItem active={router.asPath === paths.favorite}>
            <StyledLink href={{ pathname: paths.favorite }}>
              <FavouritesIcon />
              Favourites
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

          <StyledListItem
            onClick={() => {
              triggerImportModal();
            }}
          >
            <ImportIcon /> Import
          </StyledListItem>

          <Link href={{ pathname: paths.trash }}>
            <StyledListItem active={router.asPath === paths.trash}>
              <TrashIcon /> Trash
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
            <AddIcon /> New Page
          </StyledNewPageButton>
        </StyledSliderBarWrapper>
      </StyledSliderBar>
    </>
  );
};

export default WorkSpaceSliderBar;
