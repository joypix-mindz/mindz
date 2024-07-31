import { join } from 'node:path';

import {
  app,
  type CookiesSetDetails,
  globalShortcut,
  Menu,
  type View,
  type WebContents,
  WebContentsView,
} from 'electron';
import { partition } from 'lodash-es';
import { nanoid } from 'nanoid';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  firstValueFrom,
  map,
  shareReplay,
  startWith,
  Subject,
  type Unsubscribable,
} from 'rxjs';

import { isMacOS } from '../../shared/utils';
import { isDev } from '../config';
import { mainWindowOrigin, shellViewUrl } from '../constants';
import { ensureHelperProcess } from '../helper-process';
import { logger } from '../logger';
import { globalStateStorage } from '../shared-storage/storage';
import { parseCookie } from '../utils';
import { getMainWindow, MainWindowManager } from './main-window';
import {
  TabViewsMetaKey,
  type TabViewsMetaSchema,
  tabViewsMetaSchema,
  type WorkbenchMeta,
  type WorkbenchViewMeta,
} from './tab-views-meta-schema';

async function getAdditionalArguments() {
  const { getExposedMeta } = await import('../exposed');
  const mainExposedMeta = getExposedMeta();
  const helperProcessManager = await ensureHelperProcess();
  const helperExposedMeta = await helperProcessManager.rpc?.getMeta();
  return [
    `--main-exposed-meta=` + JSON.stringify(mainExposedMeta),
    `--helper-exposed-meta=` + JSON.stringify(helperExposedMeta),
    `--window-name=main`,
  ];
}

const TabViewsMetaState = {
  $: globalStateStorage.watch<TabViewsMetaSchema>(TabViewsMetaKey).pipe(
    map(v => tabViewsMetaSchema.parse(v ?? {})),
    shareReplay(1)
  ),

  set value(value: TabViewsMetaSchema) {
    globalStateStorage.set(TabViewsMetaKey, value);
  },

  get value() {
    return tabViewsMetaSchema.parse(
      globalStateStorage.get(TabViewsMetaKey) ?? {}
    );
  },

  // shallow merge
  patch(patch: Partial<TabViewsMetaSchema>) {
    this.value = {
      ...this.value,
      ...patch,
    };
  },
};

type AddTabAction = {
  type: 'add-tab';
  payload: WorkbenchMeta;
};

type CloseTabAction = {
  type: 'close-tab';
  payload?: string;
};

type PinTabAction = {
  type: 'pin-tab';
  payload: { key: string; shouldPin: boolean };
};

type ActivateViewAction = {
  type: 'activate-view';
  payload: { tabId: string; viewIndex: number };
};

type SeparateViewAction = {
  type: 'separate-view';
  payload: { tabId: string; viewIndex: number };
};

type OpenInSplitViewAction = {
  type: 'open-in-split-view';
  payload: { tabId: string };
};

type TabAction =
  | AddTabAction
  | CloseTabAction
  | PinTabAction
  | ActivateViewAction
  | SeparateViewAction
  | OpenInSplitViewAction;

type AddTabOption = {
  basename: string;
  view?: Omit<WorkbenchViewMeta, 'id'> | Array<Omit<WorkbenchViewMeta, 'id'>>;
};

export class WebContentViewsManager {
  static readonly instance = new WebContentViewsManager(
    MainWindowManager.instance
  );

  private constructor(public mainWindowManager: MainWindowManager) {
    this.setup();
  }

  readonly tabViewsMeta$ = TabViewsMetaState.$;
  readonly appTabsUIReady$ = new BehaviorSubject(new Set<string>());

  // all web views
  readonly webViewsMap$ = new BehaviorSubject(
    new Map<string, WebContentsView>()
  );

  readonly tabsStatus$ = combineLatest([
    this.tabViewsMeta$.pipe(startWith(TabViewsMetaState.value)),
    this.webViewsMap$,
    this.appTabsUIReady$,
  ]).pipe(
    map(([viewsMeta, views, ready]) => {
      return viewsMeta.workbenches.map(w => {
        return {
          id: w.id,
          pinned: !!w.pinned,
          active: viewsMeta.activeWorkbenchId === w.id,
          loaded: views.has(w.id),
          ready: ready.has(w.id),
          activeViewIndex: w.activeViewIndex,
          views: w.views,
        };
      });
    }),
    shareReplay(1)
  );

  // all app views (excluding shell view)
  readonly workbenchViewsMap$ = this.webViewsMap$.pipe(
    map(
      views => new Map([...views.entries()].filter(([key]) => key !== 'shell'))
    )
  );

  // a stack of closed workbenches (for undo close tab)
  readonly closedWorkbenches: WorkbenchMeta[] = [];

  /**
   * Emits whenever a tab action is triggered.
   */
  readonly tabAction$ = new Subject<TabAction>();

  readonly activeWorkbenchId$ = this.tabViewsMeta$.pipe(
    map(m => m?.activeWorkbenchId ?? m?.workbenches[0].id)
  );
  readonly activeWorkbench$ = combineLatest([
    this.activeWorkbenchId$,
    this.workbenchViewsMap$,
  ]).pipe(map(([key, views]) => (key ? views.get(key) : undefined)));

  readonly shellView$ = this.webViewsMap$.pipe(
    map(views => views.get('shell'))
  );

  readonly webViewKeys$ = this.webViewsMap$.pipe(
    map(views => Array.from(views.keys()))
  );

  get tabViewsMeta() {
    return TabViewsMetaState.value;
  }

  private set tabViewsMeta(meta: TabViewsMetaSchema) {
    TabViewsMetaState.value = meta;
  }

  readonly patchTabViewsMeta = (patch: Partial<TabViewsMetaSchema>) => {
    TabViewsMetaState.patch(patch);
  };

  get shellView() {
    return this.webViewsMap$.value.get('shell');
  }

  set activeWorkbenchId(id: string | undefined) {
    this.patchTabViewsMeta({
      activeWorkbenchId: id,
    });
  }

  get activeWorkbenchId() {
    return (
      this.tabViewsMeta.activeWorkbenchId ??
      this.tabViewsMeta.workbenches.at(0)?.id
    );
  }

  get activeWorkbenchView() {
    return this.activeWorkbenchId
      ? this.webViewsMap$.value.get(this.activeWorkbenchId)
      : undefined;
  }

  get activeWorkbenchMeta() {
    return this.tabViewsMeta.workbenches.find(
      w => w.id === this.activeWorkbenchId
    );
  }

  get mainWindow() {
    return this.mainWindowManager.mainWindow;
  }

  get tabViewsMap() {
    return this.webViewsMap$.value;
  }

  get allViews() {
    return Array.from(this.tabViewsMap.values());
  }

  setTabUIReady = (tabId: string) => {
    this.appTabsUIReady$.next(new Set([...this.appTabsUIReady$.value, tabId]));
    this.reorderViews();
  };

  getViewIdFromWebContentsId = (id: number) => {
    return Array.from(this.tabViewsMap.entries()).find(
      ([, view]) => view.webContents.id === id
    )?.[0];
  };

  updateWorkbenchMeta = (id: string, patch: Partial<WorkbenchMeta>) => {
    const workbenches = this.tabViewsMeta.workbenches;
    const index = workbenches.findIndex(w => w.id === id);
    if (index === -1) {
      return;
    }
    const newWorkbenches = workbenches.toSpliced(index, 1, {
      ...workbenches[index],
      ...patch,
    });
    this.patchTabViewsMeta({
      workbenches: newWorkbenches,
    });
  };

  isActiveTab = (id: string) => {
    return this.activeWorkbenchId === id;
  };

  closeTab = async (id?: string) => {
    if (!id) {
      id = this.activeWorkbenchId;
    }

    if (!id) {
      return;
    }

    const index = this.tabViewsMeta.workbenches.findIndex(w => w.id === id);
    if (index === -1 || this.tabViewsMeta.workbenches.length === 1) {
      return;
    }
    const targetWorkbench = this.tabViewsMeta.workbenches[index];

    if (targetWorkbench.pinned) {
      return;
    }

    const workbenches = this.tabViewsMeta.workbenches.toSpliced(index, 1);
    // if the active view is closed, switch to the next view (index unchanged)
    // if the new index is out of bound, switch to the last view
    let activeWorkbenchKey = this.activeWorkbenchId;

    if (id === activeWorkbenchKey) {
      activeWorkbenchKey = workbenches[index]?.id ?? workbenches.at(-1)?.id;
    }

    if (!activeWorkbenchKey) {
      return;
    }

    this.showTab(activeWorkbenchKey).catch(logger.error);

    this.patchTabViewsMeta({
      workbenches,
      activeWorkbenchId: activeWorkbenchKey,
    });

    this.tabAction$.next({
      type: 'close-tab',
      payload: id,
    });

    this.closedWorkbenches.push(targetWorkbench);

    setTimeout(() => {
      const view = this.tabViewsMap.get(id);
      this.tabViewsMap.delete(id);

      if (this.mainWindow && view) {
        this.mainWindow.contentView.removeChildView(view);
        view?.webContents.close();
      }
    }, 500); // delay a bit to get rid of the flicker
  };

  undoCloseTab = async () => {
    if (this.closedWorkbenches.length === 0) {
      return;
    }

    const workbench = this.closedWorkbenches.pop();

    if (workbench) {
      await this.addTab({
        basename: workbench.basename,
        view: workbench.views,
      });
    }
  };

  addTab = async (option?: AddTabOption) => {
    if (!option) {
      option = {
        basename: '/',
        view: {
          title: 'New Tab',
        },
      };
    }
    const workbenches = this.tabViewsMeta.workbenches;
    const newKey = this.generateViewId('app');
    const views = (
      Array.isArray(option.view) ? option.view : [option.view]
    ).map(v => {
      return {
        ...v,
        id: nanoid(),
      };
    });
    const workbench: WorkbenchMeta = {
      basename: option.basename,
      activeViewIndex: 0,
      views: views,
      id: newKey,
      pinned: false,
    };

    this.patchTabViewsMeta({
      activeWorkbenchId: newKey,
      workbenches: [...workbenches, workbench],
    });
    await this.showTab(newKey);
    this.tabAction$.next({
      type: 'add-tab',
      payload: workbench,
    });
    return {
      ...option,
      key: newKey,
    };
  };

  loadTab = async (id: string): Promise<WebContentsView | undefined> => {
    if (!this.tabViewsMeta.workbenches.some(w => w.id === id)) {
      return;
    }

    let view = this.tabViewsMap.get(id);
    if (!view) {
      view = await this.createAndAddView('app', id);
      const workbench = this.tabViewsMeta.workbenches.find(w => w.id === id);
      const viewMeta = workbench?.views[workbench.activeViewIndex];
      if (workbench && viewMeta) {
        const url = new URL(
          workbench.basename + (viewMeta.path?.pathname ?? ''),
          mainWindowOrigin
        );
        url.hash = viewMeta.path?.hash ?? '';
        url.search = viewMeta.path?.search ?? '';
        logger.info(`loading tab ${id} at ${url.href}`);
        view.webContents.loadURL(url.href).catch(logger.error);
      }
    }
    return view;
  };

  showTab = async (id: string): Promise<WebContentsView | undefined> => {
    if (this.activeWorkbenchId !== id) {
      // todo: this will cause the shell view to be on top and flickers the screen
      // this.appTabsUIReady$.next(
      //   new Set([...this.appTabsUIReady$.value].filter(key => key !== id))
      // );
      this.patchTabViewsMeta({
        activeWorkbenchId: id,
      });
    }
    this.reorderViews();
    let view = this.tabViewsMap.get(id);
    if (!view) {
      view = await this.loadTab(id);
    }
    this.reorderViews();
    if (view) {
      this.resizeView(view);
    }
    return view;
  };

  pinTab = (key: string, shouldPin: boolean) => {
    // move the pinned tab to the last index of the pinned tabs
    const [pinned, unPinned] = partition(
      this.tabViewsMeta.workbenches,
      w => w.pinned
    );

    const workbench = this.tabViewsMeta.workbenches.find(w => w.id === key);
    if (!workbench) {
      return;
    }

    this.tabAction$.next({
      type: 'pin-tab',
      payload: { key, shouldPin },
    });

    if (workbench.pinned && !shouldPin) {
      this.patchTabViewsMeta({
        workbenches: [
          ...pinned.filter(w => w.id !== key),
          { ...workbench, pinned: false },
          ...unPinned,
        ],
      });
    } else if (!workbench.pinned && shouldPin) {
      this.patchTabViewsMeta({
        workbenches: [
          ...pinned,
          { ...workbench, pinned: true },
          ...unPinned.filter(w => w.id !== key),
        ],
      });
    }
  };

  activateView = async (tabId: string, viewIndex: number) => {
    this.tabAction$.next({
      type: 'activate-view',
      payload: { tabId, viewIndex },
    });
    this.updateWorkbenchMeta(tabId, {
      activeViewIndex: viewIndex,
    });
    await this.showTab(tabId);
  };

  separateView = (tabId: string, viewIndex: number) => {
    const tabMeta = this.tabViewsMeta.workbenches.find(w => w.id === tabId);
    if (!tabMeta) {
      return;
    }
    this.tabAction$.next({
      type: 'separate-view',
      payload: { tabId, viewIndex },
    });
    const newTabMeta: WorkbenchMeta = {
      ...tabMeta,
      activeViewIndex: 0,
      views: [tabMeta.views[viewIndex]],
    };
    this.updateWorkbenchMeta(tabId, {
      views: tabMeta.views.toSpliced(viewIndex, 1),
    });
    addTab(newTabMeta).catch(logger.error);
  };

  openInSplitView = (tabId: string) => {
    const tabMeta = this.tabViewsMeta.workbenches.find(w => w.id === tabId);
    if (!tabMeta) {
      return;
    }
    this.tabAction$.next({
      type: 'open-in-split-view',
      payload: { tabId },
    });
  };

  reorderViews = () => {
    if (this.mainWindow) {
      // if tab ui of the current active view is not ready,
      // make sure shell view is on top
      const activeView = this.activeWorkbenchView;
      const ready = this.activeWorkbenchId
        ? this.appTabsUIReady$.value.has(this.activeWorkbenchId)
        : false;

      // inactive < active view (not ready) < shell < active view (ready)
      const getScore = (view: View) => {
        if (view === this.shellView) {
          return 2;
        }
        if (view === activeView) {
          return ready ? 3 : 1;
        }
        return 0;
      };

      [...this.tabViewsMap.values()]
        .toSorted((a, b) => getScore(a) - getScore(b))
        .forEach((view, index) => {
          this.mainWindow?.contentView.addChildView(view, index);
        });
    }
  };

  setup = () => {
    const windowReadyToShow$ = this.mainWindowManager.mainWindow$.pipe(
      filter(w => !!w)
    );

    const disposables: Unsubscribable[] = [];
    disposables.push(
      windowReadyToShow$.subscribe(w => {
        handleWebContentsResize().catch(logger.error);

        const screenSizeChangeEvents = ['resize', 'maximize', 'unmaximize'];
        const onResize = () => {
          if (this.activeWorkbenchView) {
            this.resizeView(this.activeWorkbenchView);
          }
          if (this.shellView) {
            this.resizeView(this.shellView);
          }
        };
        screenSizeChangeEvents.forEach(event => {
          w.on(event as any, onResize);
        });

        // add shell view
        this.createAndAddView('shell').catch(logger.error);
        (async () => {
          if (this.tabViewsMeta.workbenches.length === 0) {
            // create a default view (e.g., on first launch)
            await this.addTab();
          } else {
            const defaultTabId = this.activeWorkbenchId;
            if (defaultTabId) await this.showTab(defaultTabId);
          }
        })().catch(logger.error);
      })
    );

    app.on('ready', () => {
      // bind CMD/CTRL+1~8 to switch tabs
      // bind CMD/CTRL+9 to switch to the last tab
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(n => {
        const shortcut = `CommandOrControl+${n}`;
        const listener = () => {
          if (!this.mainWindow?.isFocused()) {
            return;
          }
          const item = this.tabViewsMeta.workbenches.at(n === 9 ? -1 : n - 1);
          if (item) {
            this.showTab(item.id).catch(logger.error);
          }
        };
        globalShortcut.register(shortcut, listener);
        disposables.push({
          unsubscribe: () => globalShortcut.unregister(shortcut),
        });
      });
    });

    app.on('before-quit', () => {
      disposables.forEach(d => d.unsubscribe());
    });
  };

  setCookie = async (cookie: CookiesSetDetails) => {
    const views = this.allViews;
    if (!views) {
      return;
    }
    logger.info('setting cookie to main window view(s)', cookie);
    for (const view of views) {
      await view.webContents.session.cookies.set(cookie);
    }
  };

  removeCookie = async (url: string, name: string) => {
    const views = this.allViews;
    if (!views) {
      return;
    }
    logger.info('removing cookie from main window view(s)', { url, name });
    for (const view of views) {
      await view.webContents.session.cookies.remove(url, name);
    }
  };

  getCookie = (url?: string, name?: string) => {
    // all webviews share the same session
    const view = this.allViews?.at(0);
    if (!view) {
      return;
    }
    return view.webContents.session.cookies.get({
      url,
      name,
    });
  };

  getViewById = (id: string) => {
    if (id === 'shell') {
      return this.shellView;
    } else {
      return this.tabViewsMap.get(id);
    }
  };

  resizeView = (view: View) => {
    // app view will take full w/h of the main window
    view.setBounds({
      x: 0,
      y: 0,
      width: this.mainWindow?.getContentBounds().width ?? 0,
      height: this.mainWindow?.getContentBounds().height ?? 0,
    });
  };

  private readonly generateViewId = (type: 'app' | 'shell') => {
    return type === 'shell' ? 'shell' : `app-${nanoid()}`;
  };

  private readonly createAndAddView = async (
    type: 'app' | 'shell',
    viewId = this.generateViewId(type)
  ) => {
    if (this.shellView && type === 'shell') {
      logger.error('shell view is already created');
    }

    const start = performance.now();

    const additionalArguments = await getAdditionalArguments();
    const helperProcessManager = await ensureHelperProcess();
    // will be added to appInfo
    additionalArguments.push(`--view-id=${viewId}`);

    const view = new WebContentsView({
      webPreferences: {
        webgl: true,
        transparent: true,
        contextIsolation: true,
        sandbox: false,
        spellcheck: false, // TODO(@pengx17): enable?
        preload: join(__dirname, './preload.js'), // this points to the bundled preload module
        // serialize exposed meta that to be used in preload
        additionalArguments: additionalArguments,
      },
    });

    this.webViewsMap$.next(this.tabViewsMap.set(viewId, view));
    let unsub = () => {};

    // shell process do not need to connect to helper process
    if (type !== 'shell') {
      view.webContents.on('did-finish-load', () => {
        unsub = helperProcessManager.connectRenderer(view.webContents);
      });
      view.webContents.on('will-navigate', () => {
        // means the view is reloaded
        this.appTabsUIReady$.next(
          new Set([...this.appTabsUIReady$.value].filter(key => key !== viewId))
        );
      });
    } else {
      view.webContents.on('focus', () => {
        globalThis.setTimeout(() => {
          // when shell is focused, focus the active app view instead (to make sure global keybindings work)
          this.activeWorkbenchView?.webContents.focus();
        });
      });

      view.webContents.loadURL(shellViewUrl).catch(logger.error);
      if (isDev) {
        view.webContents.openDevTools();
      }
    }

    view.webContents.on('destroyed', () => {
      unsub();
      this.webViewsMap$.next(
        new Map(
          [...this.tabViewsMap.entries()].filter(([key]) => key !== viewId)
        )
      );
      // if all views are destroyed, close the app
      // should only happen in tests
      if (this.tabViewsMap.size === 0) {
        app.quit();
      }
    });

    this.resizeView(view);

    view.webContents.on('did-finish-load', () => {
      this.resizeView(view);
    });

    // reorder will add to main window when loaded
    this.reorderViews();

    logger.info(`view ${viewId} created in ${performance.now() - start}ms`);
    return view;
  };
}

export async function setCookie(cookie: CookiesSetDetails): Promise<void>;
export async function setCookie(origin: string, cookie: string): Promise<void>;

export async function setCookie(
  arg0: CookiesSetDetails | string,
  arg1?: string
) {
  const details =
    typeof arg1 === 'string' && typeof arg0 === 'string'
      ? parseCookie(arg0, arg1)
      : arg0;

  logger.info('setting cookie to main window', details);

  if (typeof details !== 'object') {
    throw new Error('invalid cookie details');
  }
  return WebContentViewsManager.instance.setCookie(details);
}

export async function removeCookie(url: string, name: string): Promise<void> {
  return WebContentViewsManager.instance.removeCookie(url, name);
}

export async function getCookie(url?: string, name?: string) {
  return WebContentViewsManager.instance.getCookie(url, name);
}

// there is no proper way to listen to webContents resize event
// we will rely on window.resize event in renderer instead
export async function handleWebContentsResize() {
  // right now when window is resized, we will relocate the traffic light positions
  if (isMacOS()) {
    const window = await getMainWindow();
    const factor = window?.webContents.getZoomFactor() || 1;
    window?.setWindowButtonPosition({ x: 20 * factor, y: 24 * factor - 6 });
  }
}

export function onTabViewsMetaChanged(
  fn: (appViewMeta: TabViewsMetaSchema) => void
) {
  const sub = WebContentViewsManager.instance.tabViewsMeta$.subscribe(meta => {
    fn(meta);
  });
  return () => {
    sub.unsubscribe();
  };
}

export const onTabShellViewActiveChange = (fn: (active: boolean) => void) => {
  const sub = combineLatest([
    WebContentViewsManager.instance.appTabsUIReady$,
    WebContentViewsManager.instance.activeWorkbenchId$,
  ]).subscribe(([ready, active]) => {
    fn(!ready.has(active));
  });

  return () => {
    sub.unsubscribe();
  };
};

export const getTabsStatus = () => {
  return firstValueFrom(WebContentViewsManager.instance.tabsStatus$);
};

export const onTabsStatusChange = (
  fn: (
    tabs: {
      id: string;
      active: boolean;
      loaded: boolean;
      ready: boolean;
      pinned: boolean;
      activeViewIndex: number;
      views: WorkbenchViewMeta[];
    }[]
  ) => void
) => {
  const sub = WebContentViewsManager.instance.tabsStatus$.subscribe(tabs => {
    fn(tabs);
  });

  return () => {
    sub.unsubscribe();
  };
};

export const updateWorkbenchMeta = (
  id: string,
  meta: Partial<Omit<WorkbenchMeta, 'id'>>
) => {
  WebContentViewsManager.instance.updateWorkbenchMeta(id, meta);
};
export const getWorkbenchMeta = (id: string) => {
  return TabViewsMetaState.value.workbenches.find(w => w.id === id);
};
export const getTabViewsMeta = () => TabViewsMetaState.value;
export const isActiveTab = (wc: WebContents) => {
  return (
    wc.id ===
    WebContentViewsManager.instance.activeWorkbenchView?.webContents.id
  );
};
export const addTab = WebContentViewsManager.instance.addTab;
export const showTab = WebContentViewsManager.instance.showTab;
export const closeTab = WebContentViewsManager.instance.closeTab;
export const undoCloseTab = WebContentViewsManager.instance.undoCloseTab;
export const activateView = WebContentViewsManager.instance.activateView;

export const onTabAction = (fn: (event: TabAction) => void) => {
  const { unsubscribe } =
    WebContentViewsManager.instance.tabAction$.subscribe(fn);

  return unsubscribe;
};

export const onActiveTabChanged = (fn: (tabId: string) => void) => {
  const sub = WebContentViewsManager.instance.activeWorkbenchId$.subscribe(fn);
  return () => {
    sub.unsubscribe();
  };
};

export const showDevTools = (id?: string) => {
  const view = id
    ? WebContentViewsManager.instance.getViewById(id)
    : WebContentViewsManager.instance.activeWorkbenchView;
  if (view) {
    view.webContents.openDevTools();
  }
};

export const pingAppLayoutReady = (wc: WebContents) => {
  const viewId = WebContentViewsManager.instance.getViewIdFromWebContentsId(
    wc.id
  );
  if (viewId) {
    WebContentViewsManager.instance.setTabUIReady(viewId);
  }
};

export const showTabContextMenu = async (tabId: string, viewIndex: number) => {
  const workbenches = WebContentViewsManager.instance.tabViewsMeta.workbenches;
  const unpinned = workbenches.filter(w => !w.pinned);
  const tabMeta = workbenches.find(w => w.id === tabId);
  if (!tabMeta) {
    return;
  }

  const template: Parameters<typeof Menu.buildFromTemplate>[0] = [
    tabMeta.pinned
      ? {
          label: 'Unpin tab',
          click: () => {
            WebContentViewsManager.instance.pinTab(tabId, false);
          },
        }
      : {
          label: 'Pin tab',
          click: () => {
            WebContentViewsManager.instance.pinTab(tabId, true);
          },
        },
    {
      label: 'Refresh tab',
      click: () => {
        WebContentViewsManager.instance
          .getViewById(tabId)
          ?.webContents.reload();
      },
    },
    {
      label: 'Duplicate tab',
      click: () => {
        addTab(tabMeta).catch(logger.error);
      },
    },

    { type: 'separator' },

    tabMeta.views.length > 1
      ? {
          label: 'Separate tabs',
          click: () => {
            WebContentViewsManager.instance.separateView(tabId, viewIndex);
          },
        }
      : {
          label: 'Open in split view',
          click: () => {
            WebContentViewsManager.instance.openInSplitView(tabId);
          },
        },

    ...(unpinned.length > 0
      ? ([
          { type: 'separator' },
          {
            label: 'Close tab',
            click: () => {
              closeTab(tabId).catch(logger.error);
            },
          },
          {
            label: 'Close other tabs',
            click: () => {
              const tabsToRetain =
                WebContentViewsManager.instance.tabViewsMeta.workbenches.filter(
                  w => w.id === tabId || w.pinned
                );

              WebContentViewsManager.instance.patchTabViewsMeta({
                workbenches: tabsToRetain,
              });
            },
          },
        ] as const)
      : []),
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup();
};
