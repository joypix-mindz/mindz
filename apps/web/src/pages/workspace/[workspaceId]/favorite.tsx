import { PageListHeader } from '@/components/header';
import { PageList } from '@/components/page-list';
import { FavouritesIcon } from '@blocksuite/icons';
import { ReactElement } from 'react';
import WorkspaceLayout from '@/components/workspace-layout';
import { useTranslation } from '@affine/i18n';
import { useAppState } from '@/providers/app-state-provider';
import Head from 'next/head';
export const Favorite = () => {
  const { pageList } = useAppState();
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>{t('Favorites')} - AFFiNE</title>
      </Head>
      <PageListHeader icon={<FavouritesIcon />}>
        {t('Favorites')}
      </PageListHeader>
      <PageList
        pageList={pageList.filter(p => p.favorite && !p.trash)}
        showFavoriteTag={true}
        listType="favorite"
      />
    </>
  );
};
Favorite.getLayout = function getLayout(page: ReactElement) {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};
export default Favorite;
