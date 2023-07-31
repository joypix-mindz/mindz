// fixme(himself65): refactor this file
import { FlexWrapper, IconButton, Menu, MenuItem } from '@affine/component';
import { Export, MoveToTrash } from '@affine/component/page-list';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { assertExists } from '@blocksuite/global/utils';
import {
  EdgelessIcon,
  FavoritedIcon,
  FavoriteIcon,
  MoreVerticalIcon,
  PageIcon,
} from '@blocksuite/icons';
import {
  useBlockSuitePageMeta,
  usePageMetaHelper,
} from '@toeverything/hooks/use-block-suite-page-meta';
import { currentPageIdAtom } from '@toeverything/plugin-infra/atom';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';

import { pageSettingFamily } from '../../../../atoms';
import { useBlockSuiteMetaHelper } from '../../../../hooks/affine/use-block-suite-meta-helper';
import { useCurrentWorkspace } from '../../../../hooks/current/use-current-workspace';
import { toast } from '../../../../utils';
import { MenuThemeModeSwitch } from '../header-right-items/theme-mode-switch';
import { LanguageMenu } from './language-menu';
const CommonMenu = () => {
  const content = (
    <div
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <MenuThemeModeSwitch />
      <LanguageMenu />
    </div>
  );
  return (
    <FlexWrapper alignItems="center" justifyContent="center">
      <Menu
        content={content}
        placement="bottom"
        disablePortal={true}
        trigger="click"
      >
        <IconButton data-testid="editor-option-menu">
          <MoreVerticalIcon />
        </IconButton>
      </Menu>
    </FlexWrapper>
  );
};
const PageMenu = () => {
  const t = useAFFiNEI18N();
  // fixme(himself65): remove these hooks ASAP
  const [workspace] = useCurrentWorkspace();
  const pageId = useAtomValue(currentPageIdAtom);
  assertExists(workspace);
  assertExists(pageId);
  const blockSuiteWorkspace = workspace.blockSuiteWorkspace;
  const pageMeta = useBlockSuitePageMeta(blockSuiteWorkspace).find(
    meta => meta.id === pageId
  );
  assertExists(pageMeta);
  const [setting, setSetting] = useAtom(pageSettingFamily(pageId));
  const mode = setting?.mode ?? 'page';

  const favorite = pageMeta.favorite ?? false;
  const { setPageMeta } = usePageMetaHelper(blockSuiteWorkspace);
  const [openConfirm, setOpenConfirm] = useState(false);
  const { removeToTrash } = useBlockSuiteMetaHelper(blockSuiteWorkspace);
  const handleFavorite = useCallback(() => {
    setPageMeta(pageId, { favorite: !favorite });
    toast(favorite ? t['Removed from Favorites']() : t['Added to Favorites']());
  }, [favorite, pageId, setPageMeta, t]);
  const handleSwitchMode = useCallback(() => {
    setSetting(setting => ({
      mode: setting?.mode === 'page' ? 'edgeless' : 'page',
    }));
    toast(
      mode === 'page'
        ? t['com.affine.edgelessMode']()
        : t['com.affine.pageMode']()
    );
  }, [mode, setSetting, t]);
  const handleOnConfirm = useCallback(() => {
    removeToTrash(pageMeta.id);
    toast(t['Moved to Trash']());
    setOpenConfirm(false);
  }, [pageMeta.id, removeToTrash, t]);

  const EditMenu = (
    <>
      <MenuItem
        data-testid="editor-option-menu-favorite"
        onClick={handleFavorite}
        icon={
          favorite ? (
            <FavoritedIcon style={{ color: 'var(--affine-primary-color)' }} />
          ) : (
            <FavoriteIcon />
          )
        }
      >
        {favorite ? t['Remove from favorites']() : t['Add to Favorites']()}
      </MenuItem>
      <MenuItem
        icon={mode === 'page' ? <EdgelessIcon /> : <PageIcon />}
        data-testid="editor-option-menu-edgeless"
        onClick={handleSwitchMode}
      >
        {t['Convert to ']()}
        {mode === 'page' ? t['Edgeless']() : t['Page']()}
      </MenuItem>
      <Export />
      <MoveToTrash
        data-testid="editor-option-menu-delete"
        onItemClick={() => {
          setOpenConfirm(true);
        }}
      />
    </>
  );

  return (
    <>
      <FlexWrapper alignItems="center" justifyContent="center">
        <Menu
          content={EditMenu}
          placement="bottom-end"
          disablePortal={true}
          trigger="click"
        >
          <IconButton data-testid="editor-option-menu">
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
        <MoveToTrash.ConfirmModal
          open={openConfirm}
          title={pageMeta.title}
          onConfirm={handleOnConfirm}
          onCancel={() => {
            setOpenConfirm(false);
          }}
        />
      </FlexWrapper>
    </>
  );
};
export const EditorOptionMenu = () => {
  const { pageId } = useParams();
  return pageId ? <PageMenu /> : <CommonMenu />;
};
