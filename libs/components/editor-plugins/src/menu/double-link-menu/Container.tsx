import {
    CommonList,
    commonListContainer,
    CommonListItem,
} from '@toeverything/components/common';
import { styled } from '@toeverything/components/ui';
import { HookType, PluginHooks, Virgo } from '@toeverything/framework/virgo';
import { domToRect } from '@toeverything/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export type DoubleLinkMenuContainerProps = {
    editor: Virgo;
    hooks: PluginHooks;
    style?: React.CSSProperties;
    blockId: string;
    onSelected?: (item: string) => void;
    onClose?: () => void;
    types?: Array<string>;
    items?: CommonListItem[];
};

export const DoubleLinkMenuContainer = ({
    hooks,
    onSelected,
    onClose,
    types,
    style,
    items,
}: DoubleLinkMenuContainerProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [currentItem, setCurrentItem] = useState<string | undefined>();
    const [needCheckIntoView, setNeedCheckIntoView] = useState<boolean>(false);

    useEffect(() => {
        if (needCheckIntoView) {
            if (currentItem && menuRef.current) {
                const itemEle =
                    menuRef.current.querySelector<HTMLButtonElement>(
                        `.item-${currentItem}`
                    );
                const scrollEle =
                    menuRef.current.querySelector<HTMLButtonElement>(
                        `.${commonListContainer}`
                    );
                if (itemEle) {
                    const itemRect = domToRect(itemEle);
                    const scrollRect = domToRect(scrollEle);
                    if (
                        itemRect.top < scrollRect.top ||
                        itemRect.bottom > scrollRect.bottom
                    ) {
                        // IMP: may be do it with self function
                        itemEle.scrollIntoView({
                            block: 'nearest',
                        });
                    }
                }
            }
            setNeedCheckIntoView(false);
        }
    }, [needCheckIntoView, currentItem]);

    useEffect(() => {
        if (types && !currentItem) {
            setCurrentItem(types[0]);
        }
    }, [currentItem, onClose, types]);

    useEffect(() => {
        if (types) {
            if (!types.includes(currentItem)) {
                setNeedCheckIntoView(true);
                if (types.length) {
                    setCurrentItem(types[0]);
                } else {
                    setCurrentItem(undefined);
                }
            }
        }
    }, [types, currentItem]);

    const handleClickUp = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (types && event.code === 'ArrowUp') {
                event.preventDefault();
                if (!currentItem && types.length) {
                    setCurrentItem(types[types.length - 1]);
                }
                if (currentItem) {
                    const idx = types.indexOf(currentItem);
                    if (idx > 0) {
                        setNeedCheckIntoView(true);
                        setCurrentItem(types[idx - 1]);
                    }
                }
            }
        },
        [types, currentItem]
    );

    const handleClickDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (types && event.code === 'ArrowDown') {
                event.preventDefault();
                if (!currentItem && types.length) {
                    setCurrentItem(types[0]);
                }
                if (currentItem) {
                    const idx = types.indexOf(currentItem);
                    if (idx < types.length - 1) {
                        setNeedCheckIntoView(true);
                        setCurrentItem(types[idx + 1]);
                    }
                }
            }
        },
        [types, currentItem]
    );

    const handleClickEnter = useCallback(
        async (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.code === 'Enter' && currentItem) {
                event.preventDefault();
                onSelected && onSelected(currentItem);
            }
        },
        [currentItem, onSelected]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            handleClickUp(event);
            handleClickDown(event);
            handleClickEnter(event);
        },
        [handleClickUp, handleClickDown, handleClickEnter]
    );

    useEffect(() => {
        const sub = hooks
            .get(HookType.ON_ROOT_NODE_KEYDOWN_CAPTURE)
            .subscribe(handleKeyDown);

        return () => {
            sub.unsubscribe();
        };
    }, [hooks, handleKeyDown]);

    return (
        <RootContainer
            ref={menuRef}
            onKeyDownCapture={handleKeyDown}
            style={style}
        >
            <ContentContainer>
                <CommonList
                    items={items}
                    onSelected={type => onSelected?.(type)}
                    currentItem={currentItem}
                    setCurrentItem={setCurrentItem}
                />
            </ContentContainer>
        </RootContainer>
    );
};

const RootContainer = styled('div')(({ theme }) => ({
    zIndex: 1,
    maxHeight: '525px',
    borderRadius: '10px',
    boxShadow: theme.affine.shadows.shadow1,
    backgroundColor: '#fff',
    padding: '8px 4px',
}));

const ContentContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    overflow: 'hidden',
    maxHeight: '493px',
}));
