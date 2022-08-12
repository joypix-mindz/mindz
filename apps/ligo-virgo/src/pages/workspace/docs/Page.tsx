/* eslint-disable filename-rules/match */
import { useEffect, useRef, type UIEvent, useState } from 'react';
import { useParams } from 'react-router';

import { AffineEditor } from '@toeverything/components/affine-editor';
import {
    CalendarHeatmap,
    PageTree,
    Activities,
} from '@toeverything/components/layout';
import { CollapsibleTitle } from '@toeverything/components/common';
import {
    useShowSpaceSidebar,
    usePageClientWidth,
} from '@toeverything/datasource/state';
import {
    MuiBox as Box,
    MuiCircularProgress as CircularProgress,
    styled,
} from '@toeverything/components/ui';

import { WorkspaceName } from './workspace-name';
import { CollapsiblePageTree } from './collapsible-page-tree';
import { useFlag } from '@toeverything/datasource/feature-flags';
import { type BlockEditor } from '@toeverything/components/editor-core';
import { Tabs } from './components/tabs';
type PageProps = {
    workspace: string;
};

export function Page(props: PageProps) {
    const { page_id } = useParams();
    const { showSpaceSidebar, fixedDisplay, setSpaceSidebarVisible } =
        useShowSpaceSidebar();
    const dailyNotesFlag = useFlag('BooleanDailyNotes', false);

    return (
        <LigoApp>
            <LigoLeftContainer style={{ width: fixedDisplay ? '300px' : 0 }}>
                <WorkspaceSidebar
                    style={{
                        opacity: !showSpaceSidebar && !fixedDisplay ? 0 : 1,
                        transform:
                            !showSpaceSidebar && !fixedDisplay
                                ? 'translateX(-270px)'
                                : 'translateX(0px)',
                        transition: '0.8s',
                    }}
                    onMouseEnter={() => setSpaceSidebarVisible(true)}
                    onMouseLeave={() => setSpaceSidebarVisible(false)}
                >
                    <WorkspaceName />

                    <Tabs />

                    <WorkspaceSidebarContent>
                        <div>
                            {dailyNotesFlag && (
                                <div>
                                    <CollapsibleTitle title="Daily Notes">
                                        <CalendarHeatmap />
                                    </CollapsibleTitle>
                                </div>
                            )}
                            <div>
                                <CollapsibleTitle
                                    title="ACTIVITIES"
                                    initialOpen={false}
                                >
                                    <Activities />
                                </CollapsibleTitle>
                            </div>
                            <div>
                                <CollapsiblePageTree title="PAGES">
                                    {page_id ? <PageTree /> : null}
                                </CollapsiblePageTree>
                            </div>
                        </div>
                    </WorkspaceSidebarContent>
                </WorkspaceSidebar>
            </LigoLeftContainer>
            <EditorContainer workspace={props.workspace} pageId={page_id} />
        </LigoApp>
    );
}

const EditorContainer = ({
    pageId,
    workspace,
}: {
    pageId: string;
    workspace: string;
}) => {
    const [lockScroll, setLockScroll] = useState(false);
    const [scrollContainer, setScrollContainer] = useState<HTMLElement>();
    const editorRef = useRef<BlockEditor>();

    const onScroll = (event: UIEvent) => {
        editorRef.current.getHooks().onRootNodeScroll(event);
        editorRef.current.scrollManager.emitScrollEvent(event);
    };

    const { setPageClientWidth } = usePageClientWidth();
    useEffect(() => {
        if (scrollContainer) {
            const obv = new ResizeObserver(e => {
                setPageClientWidth(e[0].contentRect.width);
            });
            obv.observe(scrollContainer);
            return () => obv.disconnect();
        }
    }, [setPageClientWidth, scrollContainer]);

    return (
        <StyledEditorContainer
            lockScroll={lockScroll}
            ref={ref => setScrollContainer(ref)}
            onScroll={onScroll}
        >
            {pageId ? (
                <AffineEditor
                    workspace={workspace}
                    rootBlockId={pageId}
                    ref={editorRef}
                    scrollContainer={scrollContainer}
                    scrollController={{
                        lockScroll: () => setLockScroll(true),
                        unLockScroll: () => setLockScroll(false),
                    }}
                />
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
        </StyledEditorContainer>
    );
};

const StyledEditorContainer = styled('div')<{ lockScroll: boolean }>(
    ({ lockScroll }) => {
        return {
            width: '100%',
            overflowY: lockScroll ? 'hidden' : 'auto',
            flex: 'auto',
        };
    }
);

const LigoApp = styled('div')({
    width: '100vw',
    display: 'flex',
    flex: '1 1 0%',
    backgroundColor: 'white',
});

const LigoLeftContainer = styled('div')({
    flex: '0 0 auto',
    position: 'relative',
});

const WorkspaceSidebar = styled('div')(({ theme }) => ({
    position: 'absolute',
    bottom: '48px',
    top: '12px',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: 300,
    minWidth: 300,
    borderRadius: '0px 10px 10px 0px',
    boxShadow: theme.affine.shadows.shadow1,
    backgroundColor: '#FFFFFF',
    transitionProperty: 'left',
    transitionDuration: '0.35s',
    transitionTimingFunction: 'ease',
    padding: '16px 12px',
}));

const WorkspaceSidebarContent = styled('div')({
    flex: 'auto',
    overflow: 'hidden auto',
    marginTop: '18px',
});
