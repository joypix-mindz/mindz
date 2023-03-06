import { createJSONStorage } from 'jotai/utils';
import React from 'react';
import { preload } from 'swr';
import { z } from 'zod';

import { createAffineProviders } from '../../blocksuite';
import { PageNotFoundError } from '../../components/affine/affine-error-eoundary';
import { WorkspaceSettingDetail } from '../../components/affine/workspace-setting-detail';
import { BlockSuitePageList } from '../../components/blocksuite/block-suite-page-list';
import { PageDetailEditor } from '../../components/page-detail-editor';
import {
  AffineWorkspace,
  BlockSuiteWorkspace,
  LoadPriority,
  RemWorkspaceFlavour,
} from '../../shared';
import { apis } from '../../shared/apis';
import { createEmptyBlockSuiteWorkspace } from '../../utils';
import { WorkspacePlugin } from '..';
import { fetcher, QueryKey } from './fetcher';

const storage = createJSONStorage(() => localStorage);
const kAffineLocal = 'affine-local-storage-v2';
const schema = z.object({
  id: z.string(),
  type: z.number(),
  public: z.boolean(),
  permission: z.number(),
});

const getPersistenceAllWorkspace = () => {
  const items = storage.getItem(kAffineLocal);
  const allWorkspaces: AffineWorkspace[] = [];
  if (
    Array.isArray(items) &&
    items.every(item => schema.safeParse(item).success)
  ) {
    allWorkspaces.push(
      ...items.map((item: z.infer<typeof schema>) => {
        const blockSuiteWorkspace = createEmptyBlockSuiteWorkspace(
          item.id,
          (k: string) =>
            // fixme: token could be expired
            ({ api: '/api/workspace', token: apis.auth.token }[k])
        );
        const affineWorkspace: AffineWorkspace = {
          ...item,
          flavour: RemWorkspaceFlavour.AFFINE,
          blockSuiteWorkspace,
          providers: [...createAffineProviders(blockSuiteWorkspace)],
        };
        return affineWorkspace;
      })
    );
  }
  return allWorkspaces;
};

export const AffinePlugin: WorkspacePlugin<RemWorkspaceFlavour.AFFINE> = {
  flavour: RemWorkspaceFlavour.AFFINE,
  loadPriority: LoadPriority.HIGH,
  CRUD: {
    create: async blockSuiteWorkspace => {
      const binary = BlockSuiteWorkspace.Y.encodeStateAsUpdate(
        blockSuiteWorkspace.doc
      );
      const { id } = await apis.createWorkspace(new Blob([binary.buffer]));
      // refresh the local storage
      await AffinePlugin.CRUD.list();
      return id;
    },
    delete: async workspace => {
      const items = storage.getItem(kAffineLocal);
      if (
        Array.isArray(items) &&
        items.every(item => schema.safeParse(item).success)
      ) {
        storage.setItem(
          kAffineLocal,
          items.filter(item => item.id !== workspace.id)
        );
      }
      await apis.deleteWorkspace({
        id: workspace.id,
      });
    },
    get: async workspaceId => {
      try {
        if (!apis.auth.isLogin) {
          const workspaces = getPersistenceAllWorkspace();
          return (
            workspaces.find(workspace => workspace.id === workspaceId) ?? null
          );
        }
        const workspaces: AffineWorkspace[] = await preload(
          QueryKey.getWorkspaces,
          fetcher
        );
        return (
          workspaces.find(workspace => workspace.id === workspaceId) ?? null
        );
      } catch (e) {
        const workspaces = getPersistenceAllWorkspace();
        return (
          workspaces.find(workspace => workspace.id === workspaceId) ?? null
        );
      }
    },
    list: async () => {
      const allWorkspaces = getPersistenceAllWorkspace();
      try {
        if (apis.auth.isLogin) {
          const workspaces = await apis.getWorkspaces().then(workspaces => {
            return workspaces.map(workspace => {
              const blockSuiteWorkspace = createEmptyBlockSuiteWorkspace(
                workspace.id,
                (k: string) =>
                  // fixme: token could be expired
                  ({ api: '/api/workspace', token: apis.auth.token }[k])
              );
              const dump = workspaces.map(workspace => {
                return {
                  id: workspace.id,
                  type: workspace.type,
                  public: workspace.public,
                  permission: workspace.permission,
                } satisfies z.infer<typeof schema>;
              });
              const old = storage.getItem(kAffineLocal);
              if (
                Array.isArray(old) &&
                old.every(item => schema.safeParse(item).success)
              ) {
                const data = [...dump];
                old.forEach((item: z.infer<typeof schema>) => {
                  const has = dump.find(dump => dump.id === item.id);
                  if (!has) {
                    data.push(item);
                  }
                });
                storage.setItem(kAffineLocal, [...data]);
              }

              const affineWorkspace: AffineWorkspace = {
                ...workspace,
                flavour: RemWorkspaceFlavour.AFFINE,
                blockSuiteWorkspace,
                providers: [...createAffineProviders(blockSuiteWorkspace)],
              };
              return affineWorkspace;
            });
          });
          workspaces.forEach(workspace => {
            const idx = allWorkspaces.findIndex(
              ({ id }) => id === workspace.id
            );
            if (idx !== -1) {
              allWorkspaces.splice(idx, 1, workspace);
            } else {
              allWorkspaces.push(workspace);
            }
          });

          // only save data when login in
          const dump = allWorkspaces.map(workspace => {
            return {
              id: workspace.id,
              type: workspace.type,
              public: workspace.public,
              permission: workspace.permission,
            } satisfies z.infer<typeof schema>;
          });
          storage.setItem(kAffineLocal, [...dump]);
        }
      } catch (e) {
        console.error('fetch affine workspaces failed', e);
      }
      return [...allWorkspaces];
    },
  },
  UI: {
    PageDetail: ({ currentWorkspace, currentPageId }) => {
      const page = currentWorkspace.blockSuiteWorkspace.getPage(currentPageId);
      if (!page) {
        throw new PageNotFoundError(
          currentWorkspace.blockSuiteWorkspace,
          currentPageId
        );
      }
      return (
        <>
          <PageDetailEditor
            pageId={currentPageId}
            blockSuiteWorkspace={currentWorkspace.blockSuiteWorkspace}
          />
        </>
      );
    },
    PageList: ({ blockSuiteWorkspace, onOpenPage }) => {
      return (
        <BlockSuitePageList
          onOpenPage={onOpenPage}
          blockSuiteWorkspace={blockSuiteWorkspace}
        />
      );
    },
    SettingsDetail: ({
      currentWorkspace,
      onChangeTab,
      currentTab,
      onDeleteWorkspace,
      onTransformWorkspace,
    }) => {
      return (
        <WorkspaceSettingDetail
          onDeleteWorkspace={onDeleteWorkspace}
          onChangeTab={onChangeTab}
          currentTab={currentTab}
          workspace={currentWorkspace}
          onTransferWorkspace={onTransformWorkspace}
        />
      );
    },
  },
};
