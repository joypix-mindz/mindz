import {
    AsyncBlock,
    HookType,
    PluginHooks,
    Virgo,
} from '@toeverything/components/editor-core';
import { Point } from '@toeverything/utils';
import { GroupDirection } from '@toeverything/framework/virgo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DragItem } from './DragItem';
import { Line } from './Line';
import { Menu } from './Menu';

type GroupMenuProps = {
    editor?: Virgo;
    hooks: PluginHooks;
};
export const GroupMenu = function ({ editor, hooks }: GroupMenuProps) {
    const [groupBlock, setGroupBlock] = useState<AsyncBlock | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [position, setPosition] = useState<Point>(new Point(0, 0));
    const [dragOverGroup, setDragOverGroup] = useState<AsyncBlock | null>(null);
    const [direction, setDirection] = useState<GroupDirection>(
        GroupDirection.down
    );
    const dragItemRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);

    const handleRootMouseMove = useCallback(
        async (e: React.MouseEvent<HTMLDivElement>) => {
            const groupBlockNew =
                await editor.dragDropManager.getGroupBlockByPoint(
                    new Point(e.clientX, e.clientY)
                );
            groupBlockNew && setGroupBlock(groupBlockNew || null);
        },
        [editor, setGroupBlock]
    );

    const handleRootMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setShowMenu(false);
            }
        },
        []
    );

    const handleRootDragOver = useCallback(
        async (e: React.DragEvent<Element>) => {
            e.preventDefault();
            let groupBlockOnDragOver = null;
            const mousePoint = new Point(e.clientX, e.clientY);
            if (editor.dragDropManager.isDragGroup(e)) {
                groupBlockOnDragOver =
                    await editor.dragDropManager.getGroupBlockByPoint(
                        mousePoint
                    );
                if (groupBlockOnDragOver?.id === groupBlock?.id) {
                    groupBlockOnDragOver = null;
                }
            }
            setDragOverGroup(groupBlockOnDragOver || null);
            const direction =
                await editor.dragDropManager.checkDragGroupDirection(
                    groupBlock,
                    groupBlockOnDragOver,
                    mousePoint
                );
            setDirection(direction);
        },
        [editor, groupBlock]
    );

    const handleRootDrop = useCallback(
        async (e: React.DragEvent<Element>) => {
            let groupBlockOnDrop = null;
            if (editor.dragDropManager.isDragGroup(e)) {
                groupBlockOnDrop =
                    await editor.dragDropManager.getGroupBlockByPoint(
                        new Point(e.clientX, e.clientY)
                    );
                if (groupBlockOnDrop?.id === groupBlock?.id) {
                    groupBlockOnDrop = null;
                }
            }
        },
        [editor, groupBlock]
    );

    const handleRootDragEnd = (e: DragEvent) => {
        setDragOverGroup(null);
    };

    useEffect(() => {
        hooks.addHook(HookType.ON_ROOTNODE_MOUSE_MOVE, handleRootMouseMove);
        hooks.addHook(HookType.ON_ROOTNODE_MOUSE_DOWN, handleRootMouseDown);
        hooks.addHook(HookType.ON_ROOTNODE_DRAG_OVER, handleRootDragOver);
        hooks.addHook(HookType.ON_ROOTNODE_DRAG_END, handleRootDragEnd);
        return () => {
            hooks.removeHook(
                HookType.ON_ROOTNODE_MOUSE_MOVE,
                handleRootMouseMove
            );
            hooks.removeHook(
                HookType.ON_ROOTNODE_MOUSE_DOWN,
                handleRootMouseDown
            );
            hooks.removeHook(
                HookType.ON_ROOTNODE_DRAG_OVER,
                handleRootDragOver
            );
            hooks.removeHook(HookType.ON_ROOTNODE_DRAG_END, handleRootDragEnd);
        };
    }, [
        hooks,
        handleRootMouseMove,
        handleRootMouseDown,
        handleRootDragOver,
        handleRootDrop,
    ]);

    useEffect(() => {
        if (groupBlock && groupBlock.dom) {
            if (editor.container) {
                setPosition(
                    new Point(
                        groupBlock.dom.offsetLeft,
                        groupBlock.dom.offsetTop
                    )
                );
            }
        }
    }, [groupBlock, editor]);

    const handleClick = () => {
        setShowMenu(!showMenu);
    };

    const handleDragStart = async (e: React.DragEvent<HTMLDivElement>) => {
        editor.dragDropManager.isOnDrag = true;
        const dragImage = await editor.blockHelper.getBlockDragImg(
            groupBlock.id
        );
        if (dragImage) {
            editor.dragDropManager.setDragGroupInfo(e, groupBlock.id);
            dragImage.style.cursor = 'grabbing !important';
            e.dataTransfer.setDragImage(dragImage, 0, 0);
        }
        e.dataTransfer.setData('text/plain', groupBlock.id);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    useEffect(() => {
        setShowMenu(false);
    }, [groupBlock]);

    return (
        <>
            {groupBlock ? (
                <Menu
                    editor={editor}
                    groupBlock={groupBlock}
                    position={position}
                    visible={showMenu}
                    setVisible={setShowMenu}
                    setGroupBlock={setGroupBlock}
                    menuRef={menuRef}
                >
                    <DragItem
                        item={dragItemRef}
                        editor={editor}
                        isShow={!!groupBlock}
                        groupBlock={groupBlock}
                        onClick={handleClick}
                        onDragStart={handleDragStart}
                        onDragCapture={() => {
                            editor.dragDropManager.isOnDrag = true;
                        }}
                        onMouseDown={handleMouseDown}
                        draggable={true}
                    />
                </Menu>
            ) : null}
            <Line
                groupBlock={dragOverGroup}
                editor={editor}
                direction={direction}
            />
        </>
    );
};
