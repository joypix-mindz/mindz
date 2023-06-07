import { Empty } from '@affine/component';
import type { ListData, TrashListData } from '@affine/component/page-list';
import {
  filterByFilterList,
  PageList,
  PageListTrashView,
} from '@affine/component/page-list';
import type { View } from '@affine/env/filter';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { EdgelessIcon, PageIcon } from '@blocksuite/icons';
import type { PageMeta } from '@blocksuite/store';
import { useBlockSuitePageMeta } from '@toeverything/hooks/use-block-suite-page-meta';
import { getPagePreviewText } from '@toeverything/hooks/use-block-suite-page-preview';
import { useAtom } from 'jotai';
import type React from 'react';
import { useMemo } from 'react';

import { pageModeSelectAtom } from '../../../atoms';
import { useBlockSuiteMetaHelper } from '../../../hooks/affine/use-block-suite-meta-helper';
import type { BlockSuiteWorkspace } from '../../../shared';
import { toast } from '../../../utils';
import { pageListEmptyStyle } from './index.css';
import { usePageHelper } from './utils';

export type BlockSuitePageListProps = {
  blockSuiteWorkspace: BlockSuiteWorkspace;
  listType: 'all' | 'trash' | 'shared' | 'public';
  isPublic?: true;
  onOpenPage: (pageId: string, newTab?: boolean) => void;
  view?: View;
};

const filter = {
  all: (pageMeta: PageMeta) => !pageMeta.trash,
  public: (pageMeta: PageMeta) => !pageMeta.trash,
  trash: (pageMeta: PageMeta, allMetas: PageMeta[]) => {
    const parentMeta = allMetas.find(m => m.subpageIds?.includes(pageMeta.id));
    return !parentMeta?.trash && pageMeta.trash;
  },
  shared: (pageMeta: PageMeta) => pageMeta.isPublic && !pageMeta.trash,
};

const PageListEmpty = (props: {
  listType: BlockSuitePageListProps['listType'];
}) => {
  const { listType } = props;
  const t = useAFFiNEI18N();

  const getEmptyDescription = () => {
    if (listType === 'all') {
      return t['emptyAllPages']();
    }
    if (listType === 'trash') {
      return t['emptyTrash']();
    }
    if (listType === 'shared') {
      return t['emptySharedPages']();
    }
  };

  return (
    <div className={pageListEmptyStyle}>
      <Empty description={getEmptyDescription()} />
    </div>
  );
};

export const BlockSuitePageList: React.FC<BlockSuitePageListProps> = ({
  blockSuiteWorkspace,
  onOpenPage,
  listType,
  isPublic = false,
  view,
}) => {
  const pageMetas = useBlockSuitePageMeta(blockSuiteWorkspace);
  const {
    toggleFavorite,
    removeToTrash,
    restoreFromTrash,
    permanentlyDeletePage,
    cancelPublicPage,
  } = useBlockSuiteMetaHelper(blockSuiteWorkspace);
  const [filterMode] = useAtom(pageModeSelectAtom);
  const { createPage, createEdgeless, importFile, isPreferredEdgeless } =
    usePageHelper(blockSuiteWorkspace);
  const t = useAFFiNEI18N();
  const list = useMemo(
    () =>
      pageMetas
        .filter(pageMeta => {
          if (filterMode === 'all') {
            return true;
          }
          if (filterMode === 'edgeless') {
            return isPreferredEdgeless(pageMeta.id);
          }
          if (filterMode === 'page') {
            return !isPreferredEdgeless(pageMeta.id);
          }
          console.error('unknown filter mode', pageMeta, filterMode);
          return true;
        })
        .filter(pageMeta => {
          if (!filter[listType](pageMeta, pageMetas)) {
            return false;
          }
          if (!view) {
            return true;
          }
          return filterByFilterList(view.filterList, {
            'Is Favourited': !!pageMeta.favorite,
            Created: pageMeta.createDate,
            Updated: pageMeta.updatedDate ?? pageMeta.createDate,
          });
        }),
    [pageMetas, filterMode, isPreferredEdgeless, listType, view]
  );

  if (listType === 'trash') {
    const pageList: TrashListData[] = list.map(pageMeta => {
      const page = blockSuiteWorkspace.getPage(pageMeta.id);
      const preview = page ? getPagePreviewText(page) : undefined;
      return {
        icon: isPreferredEdgeless(pageMeta.id) ? (
          <EdgelessIcon />
        ) : (
          <PageIcon />
        ),
        pageId: pageMeta.id,
        title: pageMeta.title,
        preview,
        createDate: new Date(pageMeta.createDate),
        trashDate: pageMeta.trashDate
          ? new Date(pageMeta.trashDate)
          : undefined,
        onClickPage: () => onOpenPage(pageMeta.id),
        onClickRestore: () => {
          restoreFromTrash(pageMeta.id);
        },
        onRestorePage: () => {
          restoreFromTrash(pageMeta.id);
          toast(t['restored']({ title: pageMeta.title || 'Untitled' }));
        },
        onPermanentlyDeletePage: () => {
          permanentlyDeletePage(pageMeta.id);
          toast(t['Permanently deleted']());
        },
      };
    });
    return (
      <PageListTrashView
        list={pageList}
        fallback={<PageListEmpty listType={listType} />}
      />
    );
  }

  const pageList: ListData[] = list.map(pageMeta => {
    const page = blockSuiteWorkspace.getPage(pageMeta.id);
    const preview = page ? getPagePreviewText(page) : undefined;
    return {
      icon: isPreferredEdgeless(pageMeta.id) ? <EdgelessIcon /> : <PageIcon />,
      pageId: pageMeta.id,
      title: pageMeta.title,
      preview,
      favorite: !!pageMeta.favorite,
      isPublicPage: !!pageMeta.isPublic,
      createDate: new Date(pageMeta.createDate),
      updatedDate: new Date(pageMeta.updatedDate ?? pageMeta.createDate),
      onClickPage: () => onOpenPage(pageMeta.id),
      onOpenPageInNewTab: () => onOpenPage(pageMeta.id, true),
      onClickRestore: () => {
        restoreFromTrash(pageMeta.id);
      },
      removeToTrash: () => {
        removeToTrash(pageMeta.id);
        toast(t['Successfully deleted']());
      },
      onRestorePage: () => {
        restoreFromTrash(pageMeta.id);
        toast(t['restored']({ title: pageMeta.title || 'Untitled' }));
      },
      bookmarkPage: () => {
        toggleFavorite(pageMeta.id);
        toast(
          pageMeta.favorite
            ? t['Removed from Favorites']()
            : t['Added to Favorites']()
        );
      },
      onDisablePublicSharing: () => {
        cancelPublicPage(pageMeta.id);
        toast('Successfully disabled', {
          portal: document.body,
        });
      },
    };
  });

  return (
    <PageList
      onCreateNewPage={createPage}
      onCreateNewEdgeless={createEdgeless}
      onImportFile={importFile}
      isPublicWorkspace={isPublic}
      list={pageList}
      fallback={<PageListEmpty listType={listType} />}
    />
  );
};
