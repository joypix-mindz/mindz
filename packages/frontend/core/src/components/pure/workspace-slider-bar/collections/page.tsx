import { MenuItem as CollectionItem } from '@affine/component/app-sidebar';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { EdgelessIcon, PageIcon } from '@blocksuite/icons';
import type { PageMeta, Workspace } from '@blocksuite/store';
import { useDraggable } from '@dnd-kit/core';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useBlockSuitePageReferences } from '@toeverything/hooks/use-block-suite-page-references';
import { useAtomValue } from 'jotai/index';
import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { pageSettingFamily } from '../../../../atoms';
import { getDragItemId } from '../../../../hooks/affine/use-sidebar-drag';
import { useNavigateHelper } from '../../../../hooks/use-navigate-helper';
import { DragMenuItemOverlay } from '../components/drag-menu-item-overlay';
import { PostfixItem } from '../components/postfix-item';
import { ReferencePage } from '../components/reference-page';
import * as styles from './styles.css';

export const Page = ({
  page,
  workspace,
  allPageMeta,
  inAllowList,
  removeFromAllowList,
}: {
  page: PageMeta;
  inAllowList: boolean;
  removeFromAllowList: (id: string) => void;
  workspace: Workspace;
  allPageMeta: Record<string, PageMeta>;
}) => {
  const [collapsed, setCollapsed] = React.useState(true);
  const params = useParams();

  const t = useAFFiNEI18N();

  const pageId = page.id;
  const active = params.pageId === pageId;
  const setting = useAtomValue(pageSettingFamily(pageId));
  const dragItemId = getDragItemId('collectionPage', pageId);

  const icon = useMemo(() => {
    return setting?.mode === 'edgeless' ? <EdgelessIcon /> : <PageIcon />;
  }, [setting?.mode]);

  const { jumpToPage } = useNavigateHelper();
  const clickPage = useCallback(() => {
    jumpToPage(workspace.id, page.id);
  }, [jumpToPage, page.id, workspace.id]);

  const references = useBlockSuitePageReferences(workspace, pageId);
  const referencesToRender = references.filter(
    id => allPageMeta[id] && !allPageMeta[id]?.trash
  );

  const pageTitle = page.title || t['Untitled']();
  const pageTitleElement = useMemo(() => {
    return <DragMenuItemOverlay icon={icon} pageTitle={pageTitle} />;
  }, [icon, pageTitle]);

  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: dragItemId,
    data: {
      pageId,
      pageTitle: pageTitleElement,
      removeFromCollection: () => removeFromAllowList(pageId),
    },
  });

  return (
    <Collapsible.Root
      open={!collapsed}
      data-draggable={true}
      data-dragging={isDragging}
    >
      <CollectionItem
        data-testid="collection-page"
        data-type="collection-list-item"
        icon={icon}
        onClick={clickPage}
        className={styles.title}
        active={active}
        collapsed={referencesToRender.length > 0 ? collapsed : undefined}
        onCollapsedChange={setCollapsed}
        postfix={
          <PostfixItem
            workspace={workspace}
            pageId={pageId}
            pageTitle={pageTitle}
            removeFromAllowList={removeFromAllowList}
            inAllowList={inAllowList}
          />
        }
        ref={setNodeRef}
        {...attributes}
        {...listeners}
      >
        {page.title || t['Untitled']()}
      </CollectionItem>
      <Collapsible.Content className={styles.collapsibleContent}>
        {referencesToRender.map(id => {
          return (
            <ReferencePage
              key={id}
              workspace={workspace}
              pageId={id}
              metaMapping={allPageMeta}
              parentIds={new Set([pageId])}
            />
          );
        })}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
