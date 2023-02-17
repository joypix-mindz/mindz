import { Empty } from '@affine/component';
import { useTranslation } from '@affine/i18n';
import React from 'react';
export const PageListEmpty = (props: { listType?: string }) => {
  const { listType } = props;
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: 'center' }}>
      <Empty
        width={800}
        height={300}
        sx={{ marginTop: '100px', marginBottom: '30px' }}
      />
      {listType === 'all' && <p>{t('emptyAllPages')}</p>}
      {listType === 'favorite' && <p>{t('emptyFavorite')}</p>}
      {listType === 'trash' && <p>{t('emptyTrash')}</p>}
    </div>
  );
};

export default PageListEmpty;
