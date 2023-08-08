import { BrowserWarning } from '@affine/component/affine-banner';
import {
  appSidebarFloatingAtom,
  appSidebarOpenAtom,
} from '@affine/component/app-sidebar';
import { SidebarSwitch } from '@affine/component/app-sidebar/sidebar-header';
import { isDesktop } from '@affine/env/constant';
import { CloseIcon, MinusIcon, RoundedRectangleIcon } from '@blocksuite/icons';
import type { Page } from '@blocksuite/store';
import {
  addCleanup,
  pluginHeaderItemAtom,
} from '@toeverything/infra/__internal__/plugin';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import {
  forwardRef,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { guideDownloadClientTipAtom } from '../../../atoms/guide';
import { currentModeAtom } from '../../../atoms/mode';
import type { AffineOfficialWorkspace } from '../../../shared';
import DownloadClientTip from './download-tips';
import { EditorOptionMenu } from './header-right-items/editor-option-menu';
import * as styles from './styles.css';
import { OSWarningMessage, shouldShowWarning } from './utils';

export interface BaseHeaderProps<
  Workspace extends AffineOfficialWorkspace = AffineOfficialWorkspace,
> {
  workspace: Workspace;
  currentPage: Page | null;
  isPublic: boolean;
  leftSlot?: ReactNode;
}

export enum HeaderRightItemName {
  EditorOptionMenu = 'editorOptionMenu',
}

interface HeaderItem {
  Component: (props: BaseHeaderProps) => ReactElement;
  // todo: public workspace should be one of the flavour
  availableWhen: (
    workspace: AffineOfficialWorkspace,
    currentPage: Page | null,
    status: {
      isPublic: boolean;
    }
  ) => boolean;
}

const HeaderRightItems: Record<HeaderRightItemName, HeaderItem> = {
  [HeaderRightItemName.EditorOptionMenu]: {
    Component: EditorOptionMenu,
    availableWhen: () => {
      return false;
    },
  },
};

const WindowsAppControls = () => {
  const handleMinimizeApp = useCallback(() => {
    window.apis?.ui.handleMinimizeApp().catch(err => {
      console.error(err);
    });
  }, []);
  const handleMaximizeApp = useCallback(() => {
    window.apis?.ui.handleMaximizeApp().catch(err => {
      console.error(err);
    });
  }, []);
  const handleCloseApp = useCallback(() => {
    window.apis?.ui.handleCloseApp().catch(err => {
      console.error(err);
    });
  }, []);

  return (
    <div
      data-platform-target="win32"
      className={styles.windowAppControlsWrapper}
    >
      <button
        data-type="minimize"
        className={styles.windowAppControl}
        onClick={handleMinimizeApp}
      >
        <MinusIcon />
      </button>
      <button
        data-type="maximize"
        className={styles.windowAppControl}
        onClick={handleMaximizeApp}
      >
        <RoundedRectangleIcon />
      </button>
      <button
        data-type="close"
        className={styles.windowAppControl}
        onClick={handleCloseApp}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

const PluginHeader = () => {
  const headerItem = useAtomValue(pluginHeaderItemAtom);
  const pluginsRef = useRef<string[]>([]);

  return (
    <div
      className={styles.pluginHeaderItems}
      ref={useCallback(
        (root: HTMLDivElement | null) => {
          if (root) {
            Object.entries(headerItem).forEach(([pluginName, create]) => {
              if (pluginsRef.current.includes(pluginName)) {
                return;
              }
              pluginsRef.current.push(pluginName);
              const div = document.createElement('div');
              div.setAttribute('plugin-id', pluginName);
              startTransition(() => {
                const cleanup = create(div);
                root.appendChild(div);
                addCleanup(pluginName, () => {
                  pluginsRef.current = pluginsRef.current.filter(
                    name => name !== pluginName
                  );
                  root.removeChild(div);
                  cleanup();
                });
              });
            });
          }
        },
        [headerItem]
      )}
    />
  );
};

export interface HeaderProps
  extends BaseHeaderProps,
    HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>((props, ref) => {
  const [showWarning, setShowWarning] = useState(false);
  const [showDownloadTip, setShowDownloadTip] = useAtom(
    guideDownloadClientTipAtom
  );
  useEffect(() => {
    setShowWarning(shouldShowWarning());
  }, []);
  const open = useAtomValue(appSidebarOpenAtom);
  const appSidebarFloating = useAtomValue(appSidebarFloatingAtom);

  const mode = useAtomValue(currentModeAtom);
  const isWindowsDesktop = globalThis.platform === 'win32' && isDesktop;

  return (
    <div
      className={styles.headerContainer}
      ref={ref}
      data-has-warning={showWarning}
      data-open={open}
      data-sidebar-floating={appSidebarFloating}
    >
      {showDownloadTip ? (
        <DownloadClientTip
          show={showDownloadTip}
          onClose={() => {
            setShowDownloadTip(false);
            localStorage.setItem('affine-is-dt-hide', '1');
          }}
        />
      ) : (
        <BrowserWarning
          show={showWarning}
          message={<OSWarningMessage />}
          onClose={() => {
            setShowWarning(false);
          }}
        />
      )}
      <div
        className={styles.header}
        data-has-warning={showWarning}
        data-testid="editor-header-items"
        data-is-edgeless={mode === 'edgeless'}
        data-is-page-list={props.currentPage === null}
      >
        <div
          className={clsx(styles.headerLeftSide, {
            [styles.headerLeftSideColumn]:
              isWindowsDesktop || props.currentPage === null,
          })}
        >
          <div>{!open && <SidebarSwitch />}</div>
          <div
            className={clsx(styles.headerLeftSideItem, {
              [styles.headerLeftSideOpen]: open,
            })}
          >
            {props.leftSlot}
          </div>
        </div>

        {props.children}
        <div
          className={clsx(styles.headerRightSide, {
            [styles.headerRightSideWindow]: isWindowsDesktop,
            [styles.headerRightSideColumn]:
              isWindowsDesktop || props.currentPage === null,
          })}
        >
          <PluginHeader />
          {useMemo(() => {
            return Object.entries(HeaderRightItems).map(
              ([name, { availableWhen, Component }]) => {
                if (
                  availableWhen(props.workspace, props.currentPage, {
                    isPublic: props.isPublic,
                  })
                ) {
                  return (
                    <Component
                      workspace={props.workspace}
                      currentPage={props.currentPage}
                      isPublic={props.isPublic}
                      key={name}
                    />
                  );
                }
                return null;
              }
            );
          }, [props])}
        </div>
        {isWindowsDesktop ? <WindowsAppControls /> : null}
      </div>
    </div>
  );
});

Header.displayName = 'Header';
