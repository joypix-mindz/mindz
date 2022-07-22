import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { atom, useAtom } from 'jotai';
import type {
    DragEndEvent,
    DragMoveEvent,
    DragOverEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { services } from '@toeverything/datasource/db-service';
import type { DndTreeProps } from './DndTree';
import type { FlattenedItem, TreeItem, TreeItems } from './types';
import {
    buildTree,
    flattenTree,
    getProjection,
    removeChildrenOf,
    removeItem,
    setProperty,
} from './utils';

const page_tree_atom = atom<TreeItems | undefined>([]);

export const usePageTree = ({ indentationWidth = 16 }: DndTreeProps = {}) => {
    const { workspace_id, page_id } = useParams();
    const navigate = useNavigate();
    const [items] = useAtom(page_tree_atom);
    const [activeId, setActiveId] = useState<string | undefined>(undefined);
    const [overId, setOverId] = useState<string | undefined>(undefined);
    const [offsetLeft, setOffsetLeft] = useState<number>(0);

    const flattenedItems = useMemo(() => {
        const flattenedTree = flattenTree(items);
        const collapsedItems = flattenedTree.reduce<string[]>(
            (acc, { children, collapsed, id }) =>
                collapsed && children.length ? [...acc, id] : acc,
            []
        );
        return removeChildrenOf(
            flattenedTree,
            activeId ? [activeId, ...collapsedItems] : collapsedItems
        );
    }, [activeId, items]);

    const projected = useMemo(
        () =>
            activeId && overId
                ? getProjection(
                      flattenedItems,
                      activeId,
                      overId,
                      offsetLeft,
                      indentationWidth
                  )
                : null,
        [activeId, flattenedItems, indentationWidth, offsetLeft, overId]
    );

    const savePageTreeData = useCallback(
        async (treeData?: TreeItem[]) => {
            await services.api.pageTree.setPageTree<TreeItem>(
                workspace_id,
                treeData || []
            );
        },
        [workspace_id]
    );

    const resetState = useCallback(() => {
        setOverId(undefined);
        setActiveId(undefined);
        setOffsetLeft(0);

        document.body.style.setProperty('cursor', '');
    }, []);

    const handleDragStart = useCallback(({ active: { id: activeId } }) => {
        setActiveId(activeId);
        setOverId(activeId);

        document.body.style.setProperty('cursor', 'grabbing');
    }, []);

    const handleDragMove = useCallback(({ delta }: DragMoveEvent) => {
        setOffsetLeft(delta.x);
    }, []);

    const handleDragOver = useCallback(({ over }) => {
        setOverId(over?.id ?? null);
    }, []);

    const handleDragEnd = useCallback(
        async ({ active, over }: DragEndEvent) => {
            resetState();

            if (projected && over) {
                const { depth, parentId } = projected;
                const clonedItems: FlattenedItem[] = JSON.parse(
                    JSON.stringify(flattenTree(items))
                );
                const overIndex = clonedItems.findIndex(
                    ({ id }) => id === over.id
                );
                const activeIndex = clonedItems.findIndex(
                    ({ id }) => id === active.id
                );
                const activeTreeItem = clonedItems[activeIndex];

                clonedItems[activeIndex] = {
                    ...activeTreeItem,
                    depth,
                    parentId,
                };

                const sortedItems = arrayMove(
                    clonedItems,
                    activeIndex,
                    overIndex
                );
                const newItems = buildTree(sortedItems);

                await savePageTreeData(newItems);
            }
        },
        [items, projected, resetState, savePageTreeData]
    );

    const handleDragCancel = useCallback(() => {
        resetState();
    }, [resetState]);

    const handleRemove = useCallback(
        async (id: string) => {
            await savePageTreeData(removeItem(items, id));
            await services.api.userConfig.removePage(workspace_id, id);
            //remove page from jwst
            await services.api.pageTree.removePage(workspace_id, id);
            if (id === page_id) {
                navigate(`/${workspace_id}`);
            }
        },
        [items, savePageTreeData, workspace_id]
    );

    const handleAddPage = useCallback(
        async (page_id?: string) => {
            await savePageTreeData([{ id: page_id, children: [] }, ...items]);
        },
        [items, savePageTreeData]
    );

    const handleCollapse = useCallback(
        async (id: string) => {
            await savePageTreeData(
                setProperty(items, id, 'collapsed', value => {
                    return !value;
                })
            );
        },
        [items, savePageTreeData]
    );

    return {
        items,
        activeId,
        overId,
        offsetLeft,
        flattenedItems,
        projected,
        handleAddPage,
        handleDragStart,
        handleDragMove,
        handleDragOver,
        handleDragEnd,
        handleDragCancel,
        handleRemove,
        handleCollapse,
    };
};

export const useDndTreeAutoUpdate = () => {
    const [, set_items] = useAtom(page_tree_atom);
    const { workspace_id, page_id } = useParams();

    const fetch_page_tree_data = useCallback(async () => {
        const pages = await services.api.pageTree.getPageTree<TreeItem>(
            workspace_id
        );
        set_items(pages);
    }, [set_items, workspace_id]);

    useEffect(() => {
        fetch_page_tree_data();
    }, [fetch_page_tree_data]);

    useEffect(() => {
        if (!page_id) return () => {};
        let unobserve: () => void;
        const auto_update_page_tree = async () => {
            unobserve = await services.api.pageTree.observe(
                { workspace: workspace_id, page: page_id },
                () => {
                    fetch_page_tree_data();
                }
            );
        };
        auto_update_page_tree();

        return () => {
            unobserve?.();
        };
    }, [fetch_page_tree_data, page_id, workspace_id]);
};
