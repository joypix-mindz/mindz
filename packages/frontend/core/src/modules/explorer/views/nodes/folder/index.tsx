import {
  AnimatedFolderIcon,
  type DropTargetDropEvent,
  type DropTargetOptions,
  IconButton,
  MenuIcon,
  MenuItem,
  MenuSeparator,
} from '@affine/component';
import {
  type FolderNode,
  OrganizeService,
} from '@affine/core/modules/organize';
import { WorkbenchService } from '@affine/core/modules/workbench';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { Unreachable } from '@affine/env/constant';
import { useI18n } from '@affine/i18n';
import {
  DeleteIcon,
  FolderIcon,
  PlusIcon,
  RemoveFolderIcon,
} from '@blocksuite/icons/rc';
import { DocsService, useLiveData, useServices } from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import { ExplorerTreeNode, type ExplorerTreeNodeDropEffect } from '../../tree';
import type { NodeOperation } from '../../tree/types';
import { ExplorerCollectionNode } from '../collection';
import { ExplorerDocNode } from '../doc';
import { ExplorerTagNode } from '../tag';
import type { GenericExplorerNode } from '../types';
import { FolderEmpty } from './empty';

export const ExplorerFolderNode = ({
  nodeId,
  onDrop,
  defaultRenaming,
  operations,
  location,
  dropEffect,
  canDrop,
  reorderable,
}: {
  defaultRenaming?: boolean;
  nodeId: string;
  onDrop?: (data: DropTargetDropEvent<AffineDNDData>, node: FolderNode) => void;
  operations?:
    | NodeOperation[]
    | ((type: string, node: FolderNode) => NodeOperation[]);
} & Omit<GenericExplorerNode, 'operations'>) => {
  const { organizeService } = useServices({ OrganizeService });
  const node = useLiveData(organizeService.folderTree.folderNode$(nodeId));
  const type = useLiveData(node?.type$);
  const data = useLiveData(node?.data$);
  const handleDrop = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>) => {
      if (!node) {
        return;
      }
      onDrop?.(data, node);
    },
    [node, onDrop]
  );
  const additionalOperations = useMemo(() => {
    if (!type || !node) {
      return;
    }
    if (typeof operations === 'function') {
      return operations(type, node);
    }
    return operations;
  }, [node, operations, type]);

  if (!node) {
    return;
  }

  if (type === 'folder') {
    return (
      <ExplorerFolderNodeFolder
        node={node}
        onDrop={handleDrop}
        defaultRenaming={defaultRenaming}
        operations={additionalOperations}
        dropEffect={dropEffect}
        reorderable={reorderable}
        canDrop={canDrop}
      />
    );
  } else if (type === 'doc') {
    return (
      data && (
        <ExplorerDocNode
          docId={data}
          location={location}
          onDrop={handleDrop}
          reorderable={reorderable}
          canDrop={canDrop}
          dropEffect={dropEffect}
          operations={additionalOperations}
        />
      )
    );
  } else if (type === 'collection') {
    return (
      data && (
        <ExplorerCollectionNode
          collectionId={data}
          location={location}
          onDrop={handleDrop}
          canDrop={canDrop}
          reorderable={reorderable}
          dropEffect={dropEffect}
          operations={additionalOperations}
        />
      )
    );
  } else if (type === 'tag') {
    return (
      data && (
        <ExplorerTagNode
          tagId={data}
          location={location}
          onDrop={handleDrop}
          canDrop={canDrop}
          reorderable
          dropEffect={dropEffect}
          operations={additionalOperations}
        />
      )
    );
  }

  return;
};

export const ExplorerFolderNodeFolder = ({
  node,
  onDrop,
  defaultRenaming,
  location,
  operations: additionalOperations,
  canDrop,
  dropEffect,
  reorderable,
}: {
  defaultRenaming?: boolean;
  node: FolderNode;
} & GenericExplorerNode) => {
  const t = useI18n();
  const { docsService, workbenchService } = useServices({
    DocsService,
    WorkbenchService,
  });
  const name = useLiveData(node.name$);
  const [collapsed, setCollapsed] = useState(true);
  const [newFolderId, setNewFolderId] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    node.delete();
  }, [node]);

  const children = useLiveData(node.sortedChildren$);

  const dndData = useMemo(() => {
    if (!node.id) {
      throw new Unreachable();
    }
    return {
      draggable: {
        entity: {
          type: 'folder',
          id: node.id,
        },
        from: location,
      },
      dropTarget: {
        at: 'explorer:organize:folder',
      },
    } satisfies AffineDNDData;
  }, [location, node.id]);

  const handleRename = useCallback(
    (newName: string) => {
      node.rename(newName);
    },
    [node]
  );

  const handleDropOnFolder = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>) => {
      if (data.treeInstruction?.type === 'make-child') {
        if (data.source.data.entity?.type === 'folder') {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          node.moveHere(data.source.data.entity.id, node.indexAt('before'));
        } else if (
          data.source.data.from?.at === 'explorer:organize:folder-node'
        ) {
          node.moveHere(data.source.data.from.nodeId, node.indexAt('before'));
        } else if (
          data.source.data.entity?.type === 'collection' ||
          data.source.data.entity?.type === 'doc' ||
          data.source.data.entity?.type === 'tag'
        ) {
          node.createLink(
            data.source.data.entity?.type,
            data.source.data.entity.id,
            node.indexAt('before')
          );
        }
      } else {
        onDrop?.(data);
      }
    },
    [node, onDrop]
  );

  const handleDropEffect = useCallback<ExplorerTreeNodeDropEffect>(
    data => {
      if (data.treeInstruction?.type === 'make-child') {
        if (data.source.data.entity?.type === 'folder') {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          return 'move';
        } else if (
          data.source.data.from?.at === 'explorer:organize:folder-node'
        ) {
          return 'move';
        } else if (
          data.source.data.entity?.type === 'collection' ||
          data.source.data.entity?.type === 'doc' ||
          data.source.data.entity?.type === 'tag'
        ) {
          return 'link';
        }
      } else {
        return dropEffect?.(data);
      }
      return;
    },
    [dropEffect, node]
  );

  const handleDropOnPlaceholder = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>) => {
      if (data.source.data.entity?.type === 'folder') {
        if (
          node.id === data.source.data.entity.id ||
          node.beChildOf(data.source.data.entity.id)
        ) {
          return;
        }
        node.moveHere(data.source.data.entity.id, node.indexAt('before'));
      } else if (
        data.source.data.from?.at === 'explorer:organize:folder-node'
      ) {
        node.moveHere(data.source.data.from.nodeId, node.indexAt('before'));
      } else if (
        data.source.data.entity?.type === 'collection' ||
        data.source.data.entity?.type === 'doc' ||
        data.source.data.entity?.type === 'tag'
      ) {
        node.createLink(
          data.source.data.entity?.type,
          data.source.data.entity.id,
          node.indexAt('before')
        );
      }
    },
    [node]
  );

  const handleDropOnChildren = useCallback(
    (data: DropTargetDropEvent<AffineDNDData>, dropAtNode?: FolderNode) => {
      if (!dropAtNode || !dropAtNode.id) {
        return;
      }
      if (
        data.treeInstruction?.type === 'reorder-above' ||
        data.treeInstruction?.type === 'reorder-below'
      ) {
        const at =
          data.treeInstruction?.type === 'reorder-below' ? 'after' : 'before';
        if (data.source.data.entity?.type === 'folder') {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          node.moveHere(
            data.source.data.entity.id,
            node.indexAt(at, dropAtNode.id)
          );
        } else if (
          data.source.data.from?.at === 'explorer:organize:folder-node'
        ) {
          node.moveHere(
            data.source.data.from.nodeId,
            node.indexAt(at, dropAtNode.id)
          );
        } else if (
          data.source.data.entity?.type === 'collection' ||
          data.source.data.entity?.type === 'doc' ||
          data.source.data.entity?.type === 'tag'
        ) {
          node.createLink(
            data.source.data.entity?.type,
            data.source.data.entity.id,
            node.indexAt(at, dropAtNode.id)
          );
        }
      } else if (data.treeInstruction?.type === 'reparent') {
        const currentLevel = data.treeInstruction.currentLevel;
        const desiredLevel = data.treeInstruction.desiredLevel;
        if (currentLevel === desiredLevel + 1) {
          onDrop?.({
            ...data,
            treeInstruction: {
              type: 'reorder-below',
              currentLevel,
              indentPerLevel: data.treeInstruction.indentPerLevel,
            },
          });
          return;
        } else {
          onDrop?.({
            ...data,
            treeInstruction: {
              ...data.treeInstruction,
              currentLevel: currentLevel - 1,
            },
          });
        }
      }
    },
    [node, onDrop]
  );

  const handleDropEffectOnChildren = useCallback<ExplorerTreeNodeDropEffect>(
    data => {
      if (
        data.treeInstruction?.type === 'reorder-above' ||
        data.treeInstruction?.type === 'reorder-below'
      ) {
        if (data.source.data.entity?.type === 'folder') {
          if (
            node.id === data.source.data.entity.id ||
            node.beChildOf(data.source.data.entity.id)
          ) {
            return;
          }
          return 'move';
        } else if (
          data.source.data.from?.at === 'explorer:organize:folder-node'
        ) {
          return 'move';
        } else if (
          data.source.data.entity?.type === 'collection' ||
          data.source.data.entity?.type === 'doc' ||
          data.source.data.entity?.type === 'tag'
        ) {
          return 'link';
        }
      } else if (data.treeInstruction?.type === 'reparent') {
        const currentLevel = data.treeInstruction.currentLevel;
        const desiredLevel = data.treeInstruction.desiredLevel;
        if (currentLevel === desiredLevel + 1) {
          dropEffect?.({
            ...data,
            treeInstruction: {
              type: 'reorder-below',
              currentLevel,
              indentPerLevel: data.treeInstruction.indentPerLevel,
            },
          });
          return;
        } else {
          dropEffect?.({
            ...data,
            treeInstruction: {
              ...data.treeInstruction,
              currentLevel: currentLevel - 1,
            },
          });
        }
      }
      return;
    },
    [dropEffect, node]
  );

  const handleCanDrop = useMemo<DropTargetOptions<AffineDNDData>['canDrop']>(
    () => args => {
      const entityType = args.source.data.entity?.type;
      if (args.treeInstruction && args.treeInstruction?.type !== 'make-child') {
        return (
          (typeof canDrop === 'function' ? canDrop(args) : canDrop) ?? true
        );
      }

      if (args.source.data.entity?.type === 'folder') {
        if (
          node.id === args.source.data.entity.id ||
          node.beChildOf(args.source.data.entity.id)
        ) {
          return false;
        }
        return true;
      } else if (
        args.source.data.from?.at === 'explorer:organize:folder-node'
      ) {
        return true;
      } else if (
        entityType === 'collection' ||
        entityType === 'doc' ||
        entityType === 'tag'
      ) {
        return true;
      }
      return false;
    },
    [canDrop, node]
  );

  const handleChildrenCanDrop = useMemo<
    DropTargetOptions<AffineDNDData>['canDrop']
  >(
    () => args => {
      const entityType = args.source.data.entity?.type;

      if (args.source.data.entity?.type === 'folder') {
        if (
          node.id === args.source.data.entity.id ||
          node.beChildOf(args.source.data.entity.id)
        ) {
          return false;
        }
        return true;
      } else if (
        args.source.data.from?.at === 'explorer:organize:folder-node'
      ) {
        return true;
      } else if (
        entityType === 'collection' ||
        entityType === 'doc' ||
        entityType === 'tag'
      ) {
        return true;
      }
      return false;
    },
    [node]
  );

  const handleNewDoc = useCallback(() => {
    const newDoc = docsService.createDoc();
    node.createLink('doc', newDoc.id, node.indexAt('before'));
    workbenchService.workbench.openDoc(newDoc.id);
    setCollapsed(false);
  }, [docsService, node, workbenchService.workbench]);

  const handleCreateSubfolder = useCallback(() => {
    const newFolderId = node.createFolder(
      t['com.affine.rootAppSidebar.organize.new-folders'](),
      node.indexAt('before')
    );
    setCollapsed(false);
    setNewFolderId(newFolderId);
  }, [node, t]);

  const folderOperations = useMemo(() => {
    return [
      {
        index: 0,
        inline: true,
        view: (
          <IconButton size="small" type="plain" onClick={handleNewDoc}>
            <PlusIcon />
          </IconButton>
        ),
      },
      {
        index: 100,
        view: (
          <MenuItem
            preFix={
              <MenuIcon>
                <FolderIcon />
              </MenuIcon>
            }
            onClick={handleCreateSubfolder}
          >
            {t['com.affine.rootAppSidebar.organize.folder.create-subfolder']()}
          </MenuItem>
        ),
      },
      {
        index: 9999,
        view: <MenuSeparator key="menu-separator" />,
      },
      {
        index: 10000,
        view: (
          <MenuItem
            type={'danger'}
            preFix={
              <MenuIcon>
                <DeleteIcon />
              </MenuIcon>
            }
            onClick={handleDelete}
          >
            {t['com.affine.rootAppSidebar.organize.delete']()}
          </MenuItem>
        ),
      },
    ];
  }, [handleCreateSubfolder, handleDelete, handleNewDoc, t]);

  const finalOperations = useMemo(() => {
    if (additionalOperations) {
      return [...additionalOperations, ...folderOperations];
    }
    return folderOperations;
  }, [additionalOperations, folderOperations]);

  const handleDeleteChildren = useCallback((node: FolderNode) => {
    node.delete();
  }, []);

  const childrenOperations = useCallback(
    // eslint-disable-next-line @typescript-eslint/ban-types
    (type: string, node: FolderNode) => {
      if (type === 'doc' || type === 'collection' || type === 'tag') {
        return [
          {
            index: 999,
            view: (
              <MenuItem
                type={'danger'}
                preFix={
                  <MenuIcon>
                    <RemoveFolderIcon />
                  </MenuIcon>
                }
                onClick={() => handleDeleteChildren(node)}
              >
                {t['com.affine.rootAppSidebar.organize.delete-from-folder']()}
              </MenuItem>
            ),
          },
        ] satisfies NodeOperation[];
      }
      return [];
    },
    [handleDeleteChildren, t]
  );

  return (
    <ExplorerTreeNode
      icon={({ draggedOver, className, treeInstruction }) => (
        <AnimatedFolderIcon
          className={className}
          closed={!!draggedOver && treeInstruction?.type === 'make-child'}
        />
      )}
      name={name}
      dndData={dndData}
      onDrop={handleDropOnFolder}
      defaultRenaming={defaultRenaming}
      renameable
      reorderable={reorderable}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      onRename={handleRename}
      operations={finalOperations}
      canDrop={handleCanDrop}
      childrenPlaceholder={
        <FolderEmpty canDrop={handleCanDrop} onDrop={handleDropOnPlaceholder} />
      }
      dropEffect={handleDropEffect}
      data-testid={`explorer-folder-${node.id}`}
    >
      {children.map(child => (
        <ExplorerFolderNode
          key={child.id}
          nodeId={child.id as string}
          defaultRenaming={child.id === newFolderId}
          onDrop={handleDropOnChildren}
          operations={childrenOperations}
          dropEffect={handleDropEffectOnChildren}
          canDrop={handleChildrenCanDrop}
          location={{
            at: 'explorer:organize:folder-node',
            nodeId: child.id as string,
          }}
        />
      ))}
    </ExplorerTreeNode>
  );
};
