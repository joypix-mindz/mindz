import type { Environment, Platform, RuntimeConfig } from '@affine/env/global';
import type {
  DBHandlerManager,
  DebugHandlerManager,
  DialogHandlerManager,
  ExportHandlerManager,
  UIHandlerManager,
  UnwrapManagerHandlerToClientSide,
  UpdaterHandlerManager,
  WorkspaceHandlerManager,
} from '@toeverything/infra';

declare global {
  interface Window {
    appInfo: {
      electron: boolean;
    };
    apis: {
      db: UnwrapManagerHandlerToClientSide<DBHandlerManager>;
      debug: UnwrapManagerHandlerToClientSide<DebugHandlerManager>;
      dialog: UnwrapManagerHandlerToClientSide<DialogHandlerManager>;
      export: UnwrapManagerHandlerToClientSide<ExportHandlerManager>;
      ui: UnwrapManagerHandlerToClientSide<UIHandlerManager>;
      updater: UnwrapManagerHandlerToClientSide<UpdaterHandlerManager>;
      workspace: UnwrapManagerHandlerToClientSide<WorkspaceHandlerManager>;
    };
    events: any;
  }

  interface WindowEventMap {
    'migration-done': CustomEvent;
  }

  // eslint-disable-next-line no-var
  var process: {
    env: Record<string, string>;
  };
  // eslint-disable-next-line no-var
  var $migrationDone: boolean;
  // eslint-disable-next-line no-var
  var platform: Platform | undefined;
  // eslint-disable-next-line no-var
  var environment: Environment;
  // eslint-disable-next-line no-var
  var runtimeConfig: RuntimeConfig;
  // eslint-disable-next-line no-var
  var $AFFINE_SETUP: boolean | undefined;
  // eslint-disable-next-line no-var
  var editorVersion: string | undefined;
  // eslint-disable-next-line no-var
  var prefixUrl: string;
  // eslint-disable-next-line no-var
  var websocketPrefixUrl: string;
}
