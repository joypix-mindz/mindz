import React, { useEffect, useState, useCallback, useRef } from 'react';
import style9 from 'style9';

import { Virgo, PluginHooks, HookType } from '@toeverything/framework/virgo';
import {
    CommonList,
    CommonListItem,
    commonListContainer,
} from '@toeverything/components/common';
import { domToRect } from '@toeverything/utils';

import { QueryResult } from '../../search';

export type ReferenceMenuContainerProps = {
    editor: Virgo;
    hooks: PluginHooks;
    style?: React.CSSProperties;
    isShow?: boolean;
    blockId: string;
    onSelected?: (item: string) => void;
    onClose?: () => void;
    searchBlocks?: QueryResult;
    types?: Array<string>;
};

export const ReferenceMenuContainer = ({
    hooks,
    isShow = false,
    onSelected,
    onClose,
    types,
    searchBlocks,
    style,
}: ReferenceMenuContainerProps) => {
    const menu_ref = useRef<HTMLDivElement>(null);
    const [current_item, set_current_item] = useState<string | undefined>();
    const [need_check_into_view, set_need_check_into_view] =
        useState<boolean>(false);

    useEffect(() => {
        if (need_check_into_view) {
            if (current_item && menu_ref.current) {
                const item_ele =
                    menu_ref.current.querySelector<HTMLButtonElement>(
                        `.item-${current_item}`
                    );
                const scroll_ele =
                    menu_ref.current.querySelector<HTMLButtonElement>(
                        `.${commonListContainer}`
                    );
                if (item_ele) {
                    const itemRect = domToRect(item_ele);
                    const scrollRect = domToRect(scroll_ele);
                    if (
                        itemRect.top < scrollRect.top ||
                        itemRect.bottom > scrollRect.bottom
                    ) {
                        // IMP: may be do it with self function
                        item_ele.scrollIntoView({
                            block: 'nearest',
                        });
                    }
                }
            }
            set_need_check_into_view(false);
        }
    }, [need_check_into_view, current_item]);

    useEffect(() => {
        if (isShow && types && !current_item) set_current_item(types[0]);
        if (!isShow) onClose?.();
    }, [current_item, isShow, onClose, types]);

    useEffect(() => {
        if (isShow && types) {
            if (!types.includes(current_item)) {
                set_need_check_into_view(true);
                if (types.length) {
                    set_current_item(types[0]);
                } else {
                    set_current_item(undefined);
                }
            }
        }
    }, [isShow, types, current_item]);

    const handle_click_up = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (isShow && types && event.code === 'ArrowUp') {
                event.preventDefault();
                if (!current_item && types.length) {
                    set_current_item(types[types.length - 1]);
                }
                if (current_item) {
                    const idx = types.indexOf(current_item);
                    if (idx > 0) {
                        set_need_check_into_view(true);
                        set_current_item(types[idx - 1]);
                    }
                }
            }
        },
        [isShow, types, current_item]
    );

    const handle_click_down = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (isShow && types && event.code === 'ArrowDown') {
                event.preventDefault();
                if (!current_item && types.length) {
                    set_current_item(types[0]);
                }
                if (current_item) {
                    const idx = types.indexOf(current_item);
                    if (idx < types.length - 1) {
                        set_need_check_into_view(true);
                        set_current_item(types[idx + 1]);
                    }
                }
            }
        },
        [isShow, types, current_item]
    );

    const handle_click_enter = useCallback(
        async (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (isShow && event.code === 'Enter' && current_item) {
                event.preventDefault();
                onSelected && onSelected(current_item);
            }
        },
        [isShow, current_item, onSelected]
    );

    const handle_key_down = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            handle_click_up(event);
            handle_click_down(event);
            handle_click_enter(event);
        },
        [handle_click_up, handle_click_down, handle_click_enter]
    );

    useEffect(() => {
        const sub = hooks
            .get(HookType.ON_ROOT_NODE_KEYDOWN_CAPTURE)
            .subscribe(handle_key_down);

        return () => {
            sub.unsubscribe();
        };
    }, [hooks, handle_key_down]);

    return isShow ? (
        <div
            ref={menu_ref}
            className={styles('rootContainer')}
            onKeyDownCapture={handle_key_down}
            style={style}
        >
            <div className={styles('contentContainer')}>
                <CommonList
                    items={
                        searchBlocks?.map(
                            block => ({ block } as CommonListItem)
                        ) || []
                    }
                    onSelected={type => onSelected?.(type)}
                    currentItem={current_item}
                    setCurrentItem={set_current_item}
                />
            </div>
        </div>
    ) : null;
};

const styles = style9.create({
    rootContainer: {
        position: 'fixed',
        zIndex: 1,
        maxHeight: 525,
        borderRadius: '10px',
        boxShadow: '0px 1px 10px rgba(152, 172, 189, 0.6)',
        backgroundColor: '#fff',
        padding: '8px 4px',
    },
    contentContainer: {
        display: 'flex',
        overflow: 'hidden',
        maxHeight: 493,
    },
});
