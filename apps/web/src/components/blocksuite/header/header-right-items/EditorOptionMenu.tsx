// fixme(himself65): refactor this file
import { Confirm, FlexWrapper, Menu, MenuItem } from '@affine/component';
import { IconButton } from '@affine/component';
import { toast } from '@affine/component';
import { useTranslation } from '@affine/i18n';
import {
  DeleteTemporarilyIcon,
  ExportIcon,
  ExportToHtmlIcon,
  ExportToMarkdownIcon,
  FavoritedIcon,
  FavoriteIcon,
  MoreVerticalIcon,
} from '@blocksuite/icons';
import { assertExists } from '@blocksuite/store';
import { useTheme } from '@mui/material';
import { useState } from 'react';

import { useCurrentPageId } from '../../../../hooks/current/use-current-page-id';
import { useCurrentWorkspace } from '../../../../hooks/current/use-current-workspace';
import {
  usePageMeta,
  usePageMetaHelper,
} from '../../../../hooks/use-page-meta';
import { EdgelessIcon, PaperIcon } from '../editor-mode-switch/Icons';

export const EditorOptionMenu = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  // fixme(himself65): remove these hooks ASAP
  const [workspace] = useCurrentWorkspace();
  const [pageId] = useCurrentPageId();
  assertExists(workspace);
  assertExists(pageId);
  const blockSuiteWorkspace = workspace.blockSuiteWorkspace;
  const pageMeta = usePageMeta(blockSuiteWorkspace).find(
    meta => meta.id === pageId
  );
  assertExists(pageMeta);
  const { mode = 'page', favorite, trash } = pageMeta;
  const { setPageMeta } = usePageMetaHelper(blockSuiteWorkspace);
  const [open, setOpen] = useState(false);

  const EditMenu = (
    <>
      <MenuItem
        data-testid="editor-option-menu-favorite"
        onClick={() => {
          setPageMeta(pageId, { favorite: !favorite });
          toast(
            favorite ? t('Removed from Favorites') : t('Added to Favorites')
          );
        }}
        icon={
          favorite ? (
            <FavoritedIcon style={{ color: theme.colors.primaryColor }} />
          ) : (
            <FavoriteIcon />
          )
        }
      >
        {favorite ? t('Remove from favorites') : t('Add to Favorites')}
      </MenuItem>
      <MenuItem
        icon={mode === 'page' ? <EdgelessIcon /> : <PaperIcon />}
        data-testid="editor-option-menu-edgeless"
        onClick={() => {
          setPageMeta(pageId, {
            mode: mode === 'page' ? 'edgeless' : 'page',
          });
        }}
      >
        {t('Convert to ')}
        {mode === 'page' ? t('Edgeless') : t('Page')}
      </MenuItem>
      <Menu
        placement="left-start"
        content={
          <>
            <MenuItem
              onClick={() => {
                // @ts-expect-error
                globalThis.editor.contentParser.onExportHtml();
              }}
              icon={<ExportToHtmlIcon />}
            >
              {t('Export to HTML')}
            </MenuItem>
            <MenuItem
              onClick={() => {
                // @ts-expect-error
                globalThis.editor.contentParser.onExportMarkdown();
              }}
              icon={<ExportToMarkdownIcon />}
            >
              {t('Export to Markdown')}
            </MenuItem>
          </>
        }
      >
        <MenuItem icon={<ExportIcon />} isDir={true}>
          {t('Export')}
        </MenuItem>
      </Menu>
      <MenuItem
        data-testid="editor-option-menu-delete"
        onClick={() => {
          setOpen(true);
        }}
        icon={<DeleteTemporarilyIcon />}
      >
        {t('Delete')}
      </MenuItem>
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
          <IconButton data-testid="editor-option-menu" iconSize={[20, 20]}>
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
      </FlexWrapper>
      <Confirm
        title={t('Delete page?')}
        content={t('will be moved to Trash', {
          title: pageMeta.title || 'Untitled',
        })}
        confirmText={t('Delete')}
        confirmType="danger"
        open={open}
        onConfirm={() => {
          toast(t('Moved to Trash'));
          setOpen(false);
          setPageMeta(pageId, { trash: !trash, trashDate: +new Date() });
        }}
        onClose={() => {
          setOpen(false);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </>
  );
};
