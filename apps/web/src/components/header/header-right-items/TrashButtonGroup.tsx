import { Button } from '@affine/component';
import { usePageHelper } from '@/hooks/use-page-helper';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useRouter } from 'next/router';
import useCurrentPageMeta from '@/hooks/use-current-page-meta';
import { useTranslation } from '@affine/i18n';
import { useGlobalState } from '@/store/app';
import { useCallback } from 'react';

export const TrashButtonGroup = () => {
  const { permanentlyDeletePage } = usePageHelper();
  const currentWorkspace = useGlobalState(
    useCallback(store => store.currentDataCenterWorkspace, [])
  );
  const { toggleDeletePage } = usePageHelper();
  const confirm = useConfirm(store => store.confirm);
  const router = useRouter();
  const { id = '' } = useCurrentPageMeta() || {};
  const { t } = useTranslation();
  return (
    <>
      <Button
        bold={true}
        shape="round"
        style={{ marginRight: '24px' }}
        onClick={() => {
          toggleDeletePage(id);
        }}
      >
        {t('Restore it')}
      </Button>
      <Button
        bold={true}
        shape="round"
        type="danger"
        onClick={() => {
          confirm({
            title: t('TrashButtonGroupTitle'),
            content: t('TrashButtonGroupDescription'),
            confirmText: t('Delete'),
            confirmType: 'danger',
          }).then(confirm => {
            if (confirm) {
              router.push(`/workspace/${currentWorkspace?.id}/all`);
              permanentlyDeletePage(id);
            }
          });
        }}
      >
        {t('Delete permanently')}
      </Button>
    </>
  );
};

export default TrashButtonGroup;
