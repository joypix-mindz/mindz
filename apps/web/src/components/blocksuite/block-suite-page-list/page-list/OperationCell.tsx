import {
  Confirm,
  FlexWrapper,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@affine/component';
import { useTranslation } from '@affine/i18n';
import {
  DeletePermanentlyIcon,
  DeleteTemporarilyIcon,
  FavoritedIcon,
  FavoriteIcon,
  MoreVerticalIcon,
  OpenInNewIcon,
  ResetIcon,
} from '@blocksuite/icons';
import type { PageMeta } from '@blocksuite/store';
import type React from 'react';
import { useState } from 'react';

import type { BlockSuiteWorkspace } from '../../../../shared';
import { toast } from '../../../../utils';
import { MoveTo } from '../../../affine/operation-menu-items';

export type OperationCellProps = {
  pageMeta: PageMeta;
  metas: PageMeta[];
  blockSuiteWorkspace: BlockSuiteWorkspace;
  onOpenPageInNewTab: (pageId: string) => void;
  onToggleFavoritePage: (pageId: string) => void;
  onToggleTrashPage: (pageId: string) => void;
};

export const OperationCell: React.FC<OperationCellProps> = ({
  pageMeta,
  metas,
  blockSuiteWorkspace,
  onOpenPageInNewTab,
  onToggleFavoritePage,
  onToggleTrashPage,
}) => {
  const { id, favorite } = pageMeta;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const OperationMenu = (
    <>
      <MenuItem
        onClick={() => {
          onToggleFavoritePage(id);
          toast(
            favorite ? t('Removed from Favorites') : t('Added to Favorites')
          );
        }}
        icon={favorite ? <FavoritedIcon /> : <FavoriteIcon />}
      >
        {favorite ? t('Remove from favorites') : t('Add to Favorites')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onOpenPageInNewTab(id);
        }}
        icon={<OpenInNewIcon />}
      >
        {t('Open in new tab')}
      </MenuItem>
      {!pageMeta.isRootPinboard && (
        <MoveTo
          metas={metas}
          currentMeta={pageMeta}
          blockSuiteWorkspace={blockSuiteWorkspace}
        />
      )}
      {!pageMeta.isRootPinboard && (
        <MenuItem
          data-testid="move-to-trash"
          onClick={() => {
            setOpen(true);
          }}
          icon={<DeleteTemporarilyIcon />}
        >
          {t('Move to Trash')}
        </MenuItem>
      )}
    </>
  );
  return (
    <>
      <FlexWrapper alignItems="center" justifyContent="center">
        <Menu
          content={OperationMenu}
          placement="bottom-end"
          disablePortal={true}
          trigger="click"
        >
          <IconButton data-testid="page-list-operation-button">
            <MoreVerticalIcon />
          </IconButton>
        </Menu>
      </FlexWrapper>
      <Confirm
        open={open}
        title={t('Delete page?')}
        content={t('will be moved to Trash', {
          title: pageMeta.title || 'Untitled',
        })}
        confirmText={t('Delete')}
        confirmType="danger"
        onConfirm={() => {
          onToggleTrashPage(id);
          toast(t('Deleted'));
          setOpen(false);
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

export type TrashOperationCellProps = {
  pageMeta: PageMeta;
  onPermanentlyDeletePage: (pageId: string) => void;
  onRestorePage: (pageId: string) => void;
  onOpenPage: (pageId: string) => void;
};

export const TrashOperationCell: React.FC<TrashOperationCellProps> = ({
  pageMeta,
  onPermanentlyDeletePage,
  onRestorePage,
}) => {
  const { id, title } = pageMeta;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <FlexWrapper>
      <Tooltip content={t('Restore it')} placement="top-start">
        <IconButton
          style={{ marginRight: '12px' }}
          onClick={() => {
            onRestorePage(id);
            toast(t('restored', { title: title || 'Untitled' }));
          }}
        >
          <ResetIcon />
        </IconButton>
      </Tooltip>
      <Tooltip content={t('Delete permanently')} placement="top-start">
        <IconButton
          onClick={() => {
            setOpen(true);
          }}
        >
          <DeletePermanentlyIcon />
        </IconButton>
      </Tooltip>
      <Confirm
        title={t('Delete permanently?')}
        content={t("Once deleted, you can't undo this action.")}
        confirmText={t('Delete')}
        confirmType="danger"
        open={open}
        onConfirm={() => {
          onPermanentlyDeletePage(id);
          toast(t('Permanently deleted'));
          setOpen(false);
        }}
        onClose={() => {
          setOpen(false);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </FlexWrapper>
  );
};
