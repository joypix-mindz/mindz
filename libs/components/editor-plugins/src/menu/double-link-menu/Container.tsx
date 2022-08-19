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

export const DoubleLinkMenuContainer = (
    props: DoubleLinkMenuContainerProps
) => {
    const { hooks, onSelected, onClose, types, style, items } = props;
    const menuRef = useRef<HTMLDivElement>(null);
    const [currentItem, setCurrentItem] = useState<string | undefined>();
    const [needCheckIntoView, setNeedCheckIntoView] = useState<boolean>(false);

    useEffect(() => {
        if (needCheckIntoView) {
            if (currentItem && menuRef.current) {
                const itemElement =
                    menuRef.current.querySelector<HTMLButtonElement>(
                        `.item-${currentItem}`
                    );
                const scrollElement =
                    menuRef.current.querySelector<HTMLButtonElement>(
                        `.${commonListContainer}`
                    );
                if (itemElement) {
                    const itemRect = domToRect(itemElement);
                    const scrollRect = domToRect(scrollElement);
                    if (
                        itemRect.top < scrollRect.top ||
                        itemRect.bottom > scrollRect.bottom
                    ) {
                        itemElement.scrollIntoView({
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

    const handleUpDownKey = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (types && ['ArrowUp', 'ArrowDown'].includes(event.code)) {
                event.preventDefault();
                const isUpkey = event.code === 'ArrowUp';
                const indexBound = isUpkey ? types.length - 1 : 0;
                if (!currentItem && types.length) {
                    setCurrentItem(types[indexBound]);
                }
                if (currentItem) {
                    const idx = types.indexOf(currentItem);
                    const needChange = isUpkey
                        ? idx > indexBound
                        : idx < indexBound;
                    if (needChange) {
                        setNeedCheckIntoView(true);
                        setCurrentItem(types[isUpkey ? idx - 1 : idx + 1]);
                    }
                }
            }
        },
        [currentItem, types]
    );
    const handleClickUp = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            handleUpDownKey(event);
        },
        [handleUpDownKey]
    );

    const handleClickDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            handleUpDownKey(event);
        },
        [handleUpDownKey]
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
    borderRadius: '10px',
    boxShadow: theme.affine.shadows.shadow1,
    backgroundColor: '#fff',
    padding: '8px 4px',
}));

const ContentContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    overflow: 'hidden',
    maxHeight: '300px',
}));
