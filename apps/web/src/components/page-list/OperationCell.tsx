import { useConfirm } from '@/providers/ConfirmProvider';
import { PageMeta } from '@/providers/app-state-provider';
import { Menu, MenuItem } from '@affine/component';
import { FlexWrapper } from '@affine/component';
import { IconButton } from '@affine/component';
import {
  MoreVerticalIcon,
  RestoreIcon,
  FavouritesIcon,
  FavouritedIcon,
  OpenInNewIcon,
  DeleteForeverIcon,
  TrashIcon,
} from '@blocksuite/icons';
import { toast } from '@affine/component';
import { usePageHelper } from '@/hooks/use-page-helper';
import { useTranslation } from '@affine/i18n';
export const OperationCell = ({ pageMeta }: { pageMeta: PageMeta }) => {
  const { id, favorite } = pageMeta;
  const { openPage } = usePageHelper();
  const { toggleFavoritePage, toggleDeletePage } = usePageHelper();
  const confirm = useConfirm(store => store.confirm);
  const { t } = useTranslation();
  const OperationMenu = (
    <>
      <MenuItem
        onClick={() => {
          toggleFavoritePage(id);
          toast(
            favorite ? t('Removed from Favorites') : t('Added to Favorites')
          );
        }}
        icon={favorite ? <FavouritedIcon /> : <FavouritesIcon />}
      >
        {favorite ? t('Remove from favorites') : t('Add to favorites')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          openPage(id, {}, true);
        }}
        icon={<OpenInNewIcon />}
      >
        {t('Open in new tab')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          confirm({
            title: t('Delete page?'),
            content: t('will be moved to Trash', {
              title: pageMeta.title || 'Untitled',
            }),
            confirmText: t('Delete'),
            confirmType: 'danger',
          }).then(confirm => {
            confirm && toggleDeletePage(id);
            confirm && toast(t('Moved to Trash'));
          });
        }}
        icon={<TrashIcon />}
      >
        {t('Delete')}
      </MenuItem>
    </>
  );
  return (
    <FlexWrapper alignItems="center" justifyContent="center">
      <Menu content={OperationMenu} placement="bottom-end" disablePortal={true}>
        <IconButton darker={true}>
          <MoreVerticalIcon />
        </IconButton>
      </Menu>
    </FlexWrapper>
  );
};

export const TrashOperationCell = ({ pageMeta }: { pageMeta: PageMeta }) => {
  const { id } = pageMeta;
  const { openPage, getPageMeta } = usePageHelper();
  const { toggleDeletePage, permanentlyDeletePage } = usePageHelper();
  const confirm = useConfirm(store => store.confirm);
  const { t } = useTranslation();
  return (
    <FlexWrapper>
      <IconButton
        darker={true}
        style={{ marginRight: '12px' }}
        onClick={() => {
          toggleDeletePage(id);
          toast(t('restored', { title: getPageMeta(id)?.title || 'Untitled' }));
          openPage(id);
        }}
      >
        <RestoreIcon />
      </IconButton>
      <IconButton
        darker={true}
        onClick={() => {
          confirm({
            title: t('Delete permanently?'),
            content: t("Once deleted, you can't undo this action."),
            confirmText: t('Delete'),
            confirmType: 'danger',
          }).then(confirm => {
            confirm && permanentlyDeletePage(id);
            toast(t('Permanently deleted'));
          });
        }}
      >
        <DeleteForeverIcon />
      </IconButton>
    </FlexWrapper>
  );
};
