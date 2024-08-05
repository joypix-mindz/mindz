import {
  type DropTargetDropEvent,
  type DropTargetOptions,
  IconButton,
  Loading,
  useDraggable,
  useDropTarget,
} from '@affine/component';
import {
  appSidebarFloatingAtom,
  appSidebarOpenAtom,
  appSidebarResizingAtom,
} from '@affine/core/components/app-sidebar';
import { appSidebarWidthAtom } from '@affine/core/components/app-sidebar/index.jotai';
import { WindowsAppControls } from '@affine/core/components/pure/header/windows-app-controls';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { apis, events } from '@affine/electron-api';
import { useI18n } from '@affine/i18n';
import { CloseIcon, PlusIcon, RightSidebarIcon } from '@blocksuite/icons/rc';
import {
  useLiveData,
  useService,
  useServiceOptional,
} from '@toeverything/infra';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { partition } from 'lodash-es';
import {
  Fragment,
  type MouseEventHandler,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import { iconNameToIcon } from '../../workbench/constants';
import { DesktopStateSynchronizer } from '../../workbench/services/desktop-state-synchronizer';
import {
  AppTabsHeaderService,
  type TabStatus,
} from '../services/app-tabs-header-service';
import * as styles from './styles.css';

const TabSupportType = ['collection', 'tag', 'doc'];

const tabCanDrop =
  (tab?: TabStatus): NonNullable<DropTargetOptions<AffineDNDData>['canDrop']> =>
  ctx => {
    if (
      ctx.source.data.from?.at === 'app-header:tabs' &&
      ctx.source.data.from.tabId !== tab?.id
    ) {
      return true;
    }

    if (
      ctx.source.data.entity?.type &&
      TabSupportType.includes(ctx.source.data.entity?.type)
    ) {
      return true;
    }

    return false;
  };

const WorkbenchTab = ({
  workbench,
  active: tabActive,
  tabsLength,
  dnd,
  onDrop,
}: {
  workbench: TabStatus;
  active: boolean;
  tabsLength: number;
  dnd?: boolean;
  onDrop?: (data: DropTargetDropEvent<AffineDNDData>) => void;
}) => {
  useServiceOptional(DesktopStateSynchronizer);
  const tabsHeaderService = useService(AppTabsHeaderService);
  const activeViewIndex = workbench.activeViewIndex ?? 0;
  const onContextMenu = useAsyncCallback(
    async (viewIdx: number) => {
      await tabsHeaderService.showContextMenu?.(workbench.id, viewIdx);
    },
    [tabsHeaderService, workbench.id]
  );
  const onActivateView = useAsyncCallback(
    async (viewIdx: number) => {
      await tabsHeaderService.activateView?.(workbench.id, viewIdx);
    },
    [tabsHeaderService, workbench.id]
  );
  const onCloseTab: MouseEventHandler = useAsyncCallback(
    async e => {
      e.stopPropagation();

      await tabsHeaderService.closeTab?.(workbench.id);
    },
    [tabsHeaderService, workbench.id]
  );

  const { dropTargetRef, closestEdge } = useDropTarget<AffineDNDData>(
    () => ({
      closestEdge: {
        allowedEdges: ['left', 'right'],
      },
      onDrop,
      dropEffect: 'move',
      canDrop: tabCanDrop(workbench),
      isSticky: true,
    }),
    [onDrop, workbench]
  );

  const { dragRef } = useDraggable<AffineDNDData>(
    () => ({
      canDrag: dnd,
      data: {
        from: {
          at: 'app-header:tabs',
          tabId: workbench.id,
        },
      },
      dragPreviewPosition: 'pointer-outside',
    }),
    [dnd, workbench.id]
  );

  return (
    <div
      className={styles.tabWrapper}
      ref={node => {
        dropTargetRef.current = node;
        dragRef.current = node;
      }}
    >
      <div
        key={workbench.id}
        data-testid="workbench-tab"
        data-active={tabActive}
        data-pinned={workbench.pinned}
        className={styles.tab}
      >
        {workbench.views.map((view, viewIdx) => {
          return (
            <Fragment key={view.id}>
              <button
                key={view.id}
                data-testid="split-view-label"
                className={styles.splitViewLabel}
                data-active={activeViewIndex === viewIdx && tabActive}
                onContextMenu={() => {
                  onContextMenu(viewIdx);
                }}
                onClick={e => {
                  e.stopPropagation();
                  onActivateView(viewIdx);
                }}
              >
                <div className={styles.labelIcon}>
                  {workbench.ready || !workbench.loaded ? (
                    iconNameToIcon[view.iconName ?? 'allDocs']
                  ) : (
                    <Loading />
                  )}
                </div>
                {workbench.pinned || !view.title ? null : (
                  <div title={view.title} className={styles.splitViewLabelText}>
                    {view.title}
                  </div>
                )}
              </button>

              {viewIdx !== workbench.views.length - 1 ? (
                <div className={styles.splitViewSeparator} />
              ) : null}
            </Fragment>
          );
        })}
        {!workbench.pinned ? (
          <div className={styles.tabCloseButtonWrapper}>
            {tabsLength > 1 ? (
              <button
                data-testid="close-tab-button"
                className={styles.tabCloseButton}
                onClick={onCloseTab}
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={styles.dropIndicator} data-edge={closestEdge} />
    </div>
  );
};

const useIsFullScreen = () => {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    apis?.ui
      .isFullScreen()
      .then(setFullScreen)
      .then(() => {
        events?.ui.onFullScreen(setFullScreen);
      })
      .catch(console.error);
  }, []);
  return fullScreen;
};

export const AppTabsHeader = ({
  style,
  mode = 'app',
  className,
  left,
}: {
  style?: React.CSSProperties;
  mode?: 'app' | 'shell';
  className?: string;
  left?: ReactNode;
}) => {
  const t = useI18n();
  const sidebarWidth = useAtomValue(appSidebarWidthAtom);
  const sidebarOpen = useAtomValue(appSidebarOpenAtom);
  const sidebarFloating = useAtomValue(appSidebarFloatingAtom);
  const sidebarResizing = useAtomValue(appSidebarResizingAtom);
  const isMacosDesktop = environment.isDesktop && environment.isMacOs;
  const fullScreen = useIsFullScreen();

  const tabsHeaderService = useService(AppTabsHeaderService);
  const tabs = useLiveData(tabsHeaderService.tabsStatus$);

  const [pinned, unpinned] = partition(tabs, tab => tab.pinned);

  const onAddTab = useAsyncCallback(async () => {
    await tabsHeaderService.onAddTab?.();
  }, [tabsHeaderService]);

  const onToggleRightSidebar = useAsyncCallback(async () => {
    await tabsHeaderService.onToggleRightSidebar?.();
  }, [tabsHeaderService]);

  useEffect(() => {
    if (mode === 'app') {
      apis?.ui.pingAppLayoutReady().catch(console.error);
    }
  }, [mode]);

  const onDrop = useAsyncCallback(
    async (data: DropTargetDropEvent<AffineDNDData>, targetId?: string) => {
      const edge = data.closestEdge ?? 'right';
      targetId = targetId ?? tabs.at(-1)?.id;

      if (!targetId || edge === 'top' || edge === 'bottom') {
        return;
      }

      if (data.source.data.from?.at === 'app-header:tabs') {
        if (targetId === data.source.data.from.tabId) {
          return;
        }
        return await tabsHeaderService.moveTab?.(
          data.source.data.from.tabId,
          targetId,
          edge
        );
      }

      if (data.source.data.entity?.type === 'doc') {
        return await tabsHeaderService.onAddDocTab?.(
          data.source.data.entity.id,
          targetId,
          edge
        );
      }

      if (data.source.data.entity?.type === 'tag') {
        return await tabsHeaderService.onAddTagTab?.(
          data.source.data.entity.id,
          targetId,
          edge
        );
      }

      if (data.source.data.entity?.type === 'collection') {
        return await tabsHeaderService.onAddCollectionTab?.(
          data.source.data.entity.id,
          targetId,
          edge
        );
      }
    },
    [tabs, tabsHeaderService]
  );

  const { dropTargetRef: spacerDropTargetRef, draggedOver } =
    useDropTarget<AffineDNDData>(
      () => ({
        onDrop,
        dropEffect: 'move',
        canDrop: tabCanDrop(),
      }),
      [onDrop]
    );

  return (
    <div
      className={clsx(styles.root, className)}
      style={style}
      data-mode={mode}
      data-is-windows={environment.isDesktop && environment.isWindows}
    >
      <div
        style={{
          transition: sidebarResizing ? 'none' : undefined,
          paddingLeft:
            isMacosDesktop && sidebarOpen && !sidebarFloating && !fullScreen
              ? 90
              : 16,
          width: sidebarOpen && !sidebarFloating ? sidebarWidth : 130,
          // minus 16 to account for the padding on the right side of the header (for box shadow)
          marginRight: sidebarOpen && !sidebarFloating ? -16 : 0,
        }}
        className={styles.headerLeft}
      >
        {left}
      </div>
      <div className={styles.tabs}>
        {pinned.map(tab => {
          return (
            <WorkbenchTab
              dnd={mode === 'app'}
              tabsLength={pinned.length}
              key={tab.id}
              workbench={tab}
              onDrop={data => onDrop(data, tab.id)}
              active={tab.active}
            />
          );
        })}
        {pinned.length > 0 && unpinned.length > 0 && (
          <div className={styles.pinSeparator} />
        )}
        {unpinned.map(tab => {
          return (
            <WorkbenchTab
              dnd={mode === 'app'}
              tabsLength={tabs.length}
              key={tab.id}
              workbench={tab}
              onDrop={data => onDrop(data, tab.id)}
              active={tab.active}
            />
          );
        })}
      </div>
      <div
        className={styles.spacer}
        ref={spacerDropTargetRef}
        data-dragged-over={draggedOver}
      >
        <IconButton
          size={22.86}
          onClick={onAddTab}
          tooltip={t['com.affine.multi-tab.new-tab']()}
          tooltipShortcut={['$mod', 'T']}
          data-testid="add-tab-view-button"
          style={{ width: 32, height: 32 }}
          icon={<PlusIcon />}
        />
      </div>
      <IconButton size="24" onClick={onToggleRightSidebar}>
        <RightSidebarIcon />
      </IconButton>
      {environment.isDesktop && environment.isWindows ? (
        <WindowsAppControls />
      ) : null}
    </div>
  );
};
