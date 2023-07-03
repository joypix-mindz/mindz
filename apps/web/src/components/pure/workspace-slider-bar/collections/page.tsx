import { Menu } from '@affine/component';
import { MenuItem } from '@affine/component/app-sidebar';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import {
  DeleteIcon,
  EdgelessIcon,
  FilterMinusIcon,
  FilterUndoIcon,
  MoreHorizontalIcon,
  PageIcon,
} from '@blocksuite/icons';
import type { PageMeta, Workspace } from '@blocksuite/store';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useBlockSuitePageReferences } from '@toeverything/hooks/use-block-suite-page-references';
import { useAtomValue } from 'jotai/index';
import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo } from 'react';

import { pageSettingFamily } from '../../../../atoms';
import { useBlockSuiteMetaHelper } from '../../../../hooks/affine/use-block-suite-meta-helper';
import type { AllWorkspace } from '../../../../shared';
import { ReferencePage } from '../components/reference-page';
import * as styles from './styles.css';

export const PageOperations = ({
  page,
  inAllowList,
  addToExcludeList,
  removeFromAllowList,
  inExcludeList,
  workspace,
}: {
  workspace: Workspace;
  page: PageMeta;
  inAllowList: boolean;
  removeFromAllowList: (id: string) => void;
  inExcludeList: boolean;
  addToExcludeList: (id: string) => void;
}) => {
  const { removeToTrash } = useBlockSuiteMetaHelper(workspace);
  const actions = useMemo<
    Array<
      | {
          icon: ReactElement;
          name: string;
          click: () => void;
          className?: string;
          element?: undefined;
        }
      | {
          element: ReactElement;
        }
    >
  >(
    () => [
      ...(inAllowList
        ? [
            {
              icon: <FilterMinusIcon />,
              name: 'Remove special filter',
              click: () => removeFromAllowList(page.id),
            },
          ]
        : []),
      ...(!inExcludeList
        ? [
            {
              icon: <FilterUndoIcon />,
              name: 'Exclude from filter',
              click: () => addToExcludeList(page.id),
            },
          ]
        : []),
      {
        element: <div key="divider" className={styles.menuDividerStyle}></div>,
      },
      {
        icon: <DeleteIcon style={{ color: 'var(--affine-warning-color)' }} />,
        name: 'Delete',
        click: () => {
          removeToTrash(page.id);
        },
        className: styles.deleteFolder,
      },
    ],
    [
      inAllowList,
      inExcludeList,
      page.id,
      removeFromAllowList,
      addToExcludeList,
      removeToTrash,
    ]
  );
  return (
    <>
      {actions.map(action => {
        if (action.element) {
          return action.element;
        }
        return (
          <MenuItem
            data-testid="collection-page-option"
            key={action.name}
            className={action.className}
            icon={action.icon}
            onClick={action.click}
          >
            {action.name}
          </MenuItem>
        );
      })}
    </>
  );
};
export const Page = ({
  page,
  workspace,
  allPageMeta,
  inAllowList,
  inExcludeList,
  removeFromAllowList,
  addToExcludeList,
}: {
  page: PageMeta;
  inAllowList: boolean;
  removeFromAllowList: (id: string) => void;
  inExcludeList: boolean;
  addToExcludeList: (id: string) => void;
  workspace: AllWorkspace;
  allPageMeta: Record<string, PageMeta>;
}) => {
  const [collapsed, setCollapsed] = React.useState(true);
  const router = useRouter();
  const t = useAFFiNEI18N();
  const pageId = page.id;
  const active = router.query.pageId === pageId;
  const setting = useAtomValue(pageSettingFamily(pageId));
  const icon = setting?.mode === 'edgeless' ? <EdgelessIcon /> : <PageIcon />;
  const references = useBlockSuitePageReferences(
    workspace.blockSuiteWorkspace,
    pageId
  );
  const clickPage = useCallback(() => {
    return router.push(`/workspace/${workspace.id}/${page.id}`);
  }, [page.id, router, workspace.id]);
  const referencesToRender = references.filter(id => !allPageMeta[id]?.trash);
  return (
    <Collapsible.Root open={!collapsed}>
      <MenuItem
        data-testid="collection-page"
        icon={icon}
        onClick={clickPage}
        className={styles.title}
        active={active}
        collapsed={referencesToRender.length > 0 ? collapsed : undefined}
        onCollapsedChange={setCollapsed}
        postfix={
          <Menu
            trigger="click"
            placement="bottom-start"
            content={
              <div style={{ width: 220 }}>
                <PageOperations
                  inAllowList={inAllowList}
                  removeFromAllowList={removeFromAllowList}
                  inExcludeList={inExcludeList}
                  addToExcludeList={addToExcludeList}
                  page={page}
                  workspace={workspace.blockSuiteWorkspace}
                />
              </div>
            }
          >
            <div data-testid="collection-page-options" className={styles.more}>
              <MoreHorizontalIcon></MoreHorizontalIcon>
            </div>
          </Menu>
        }
      >
        {page.title || t['Untitled']()}
      </MenuItem>
      <Collapsible.Content>
        <div style={{ marginLeft: 8 }}>
          {referencesToRender.map(id => {
            return (
              <ReferencePage
                key={id}
                workspace={workspace.blockSuiteWorkspace}
                pageId={id}
                metaMapping={allPageMeta}
                parentIds={new Set([pageId])}
              />
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
