import {
  ExplorerCollections,
  ExplorerFavorites,
  ExplorerMigrationFavorites,
  ExplorerMobileContext,
  ExplorerOrganize,
} from '@affine/core/modules/explorer';
import { ExplorerTags } from '@affine/core/modules/explorer/views/sections/tags';

import { AppTabs } from '../../components';
import { HomeHeader, RecentDocs } from '../../views';

export const Component = () => {
  return (
    <ExplorerMobileContext.Provider value={true}>
      <HomeHeader />
      <RecentDocs />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          padding: '0 8px 32px 8px',
        }}
      >
        <ExplorerFavorites />
        {runtimeConfig.enableOrganize && <ExplorerOrganize />}
        <ExplorerMigrationFavorites />
        <ExplorerCollections />
        <ExplorerTags />
      </div>
      <AppTabs />
    </ExplorerMobileContext.Provider>
  );
};
