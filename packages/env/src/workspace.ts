import type { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import type {
  ActiveDocProvider,
  PassiveDocProvider,
  Workspace as BlockSuiteWorkspace,
} from '@blocksuite/store';
import type { FC, PropsWithChildren } from 'react';

import type { View } from './filter';
import type { Workspace as RemoteWorkspace } from './workspace/legacy-cloud';

export enum WorkspaceVersion {
  SubDoc = 2,
}

export enum WorkspaceSubPath {
  ALL = 'all',
  SETTING = 'setting',
  TRASH = 'trash',
  SHARED = 'shared',
}

export interface AffineDownloadProvider extends PassiveDocProvider {
  flavour: 'affine-download';
}

/**
 * Download the first binary from local indexeddb
 */
export interface BroadCastChannelProvider extends PassiveDocProvider {
  flavour: 'broadcast-channel';
}

/**
 * Long polling provider with local indexeddb
 */
export interface LocalIndexedDBBackgroundProvider extends PassiveDocProvider {
  flavour: 'local-indexeddb-background';
}

export interface LocalIndexedDBDownloadProvider extends ActiveDocProvider {
  flavour: 'local-indexeddb';
}

export interface SQLiteProvider extends PassiveDocProvider {
  flavour: 'sqlite';
}

export interface SQLiteDBDownloadProvider extends ActiveDocProvider {
  flavour: 'sqlite-download';
}

export interface AffineWebSocketProvider extends PassiveDocProvider {
  flavour: 'affine-websocket';
}

export interface AffineLegacyCloudWorkspace extends RemoteWorkspace {
  flavour: WorkspaceFlavour.AFFINE;
  // empty
  blockSuiteWorkspace: BlockSuiteWorkspace;
}

// todo: update type with nest.js
export type AffineCloudWorkspace = LocalWorkspace;

export interface LocalWorkspace {
  flavour: WorkspaceFlavour.LOCAL;
  id: string;
  blockSuiteWorkspace: BlockSuiteWorkspace;
}

export interface AffinePublicWorkspace {
  flavour: WorkspaceFlavour.PUBLIC;
  id: string;
  blockSuiteWorkspace: BlockSuiteWorkspace;
}

export enum ReleaseType {
  // if workspace is not released yet, we will not show it in the workspace list
  UNRELEASED = 'unreleased',
  STABLE = 'stable',
}

export enum LoadPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

export enum WorkspaceFlavour {
  /**
   * AFFiNE Workspace is the workspace
   * that hosted on the Legacy AFFiNE Cloud Server.
   *
   * @deprecated
   *  We no longer maintain this kind of workspace, please use AFFiNE-Cloud instead.
   */
  AFFINE = 'affine',
  /**
   * New AFFiNE Cloud Workspace using Nest.js Server.
   */
  AFFINE_CLOUD = 'affine-cloud',
  LOCAL = 'local',
  PUBLIC = 'affine-public',
}

export const settingPanel = {
  General: 'general',
  Collaboration: 'collaboration',
  Publish: 'publish',
  Export: 'export',
  Sync: 'sync',
} as const;
export const settingPanelValues = [...Object.values(settingPanel)] as const;
export type SettingPanel = (typeof settingPanel)[keyof typeof settingPanel];

// built-in workspaces
export interface WorkspaceRegistry {
  [WorkspaceFlavour.AFFINE]: AffineLegacyCloudWorkspace;
  [WorkspaceFlavour.LOCAL]: LocalWorkspace;
  [WorkspaceFlavour.PUBLIC]: AffinePublicWorkspace;
  // todo: update workspace type to new
  [WorkspaceFlavour.AFFINE_CLOUD]: AffineCloudWorkspace;
}

export interface WorkspaceCRUD<Flavour extends keyof WorkspaceRegistry> {
  create: (blockSuiteWorkspace: BlockSuiteWorkspace) => Promise<string>;
  delete: (workspace: WorkspaceRegistry[Flavour]) => Promise<void>;
  get: (workspaceId: string) => Promise<WorkspaceRegistry[Flavour] | null>;
  // not supported yet
  // update: (workspace: FlavourToWorkspace[Flavour]) => Promise<void>;
  list: () => Promise<WorkspaceRegistry[Flavour][]>;
}

type UIBaseProps<Flavour extends keyof WorkspaceRegistry> = {
  currentWorkspace: WorkspaceRegistry[Flavour];
};

export type WorkspaceHeaderProps<Flavour extends keyof WorkspaceRegistry> =
  UIBaseProps<Flavour> & {
    currentEntry:
      | {
          subPath: WorkspaceSubPath;
        }
      | {
          pageId: string;
        };
  };

type SettingProps<Flavour extends keyof WorkspaceRegistry> =
  UIBaseProps<Flavour> & {
    currentTab: SettingPanel;
    onChangeTab: (tab: SettingPanel) => void;
    onDeleteWorkspace: () => Promise<void>;
    onTransformWorkspace: <
      From extends keyof WorkspaceRegistry,
      To extends keyof WorkspaceRegistry
    >(
      from: From,
      to: To,
      workspace: WorkspaceRegistry[From]
    ) => void;
  };

type NewSettingProps<Flavour extends keyof WorkspaceRegistry> =
  UIBaseProps<Flavour> & {
    onDeleteWorkspace: () => Promise<void>;
    onTransformWorkspace: <
      From extends keyof WorkspaceRegistry,
      To extends keyof WorkspaceRegistry
    >(
      from: From,
      to: To,
      workspace: WorkspaceRegistry[From]
    ) => void;
  };

type PageDetailProps<Flavour extends keyof WorkspaceRegistry> =
  UIBaseProps<Flavour> & {
    currentPageId: string;
    onLoadEditor: (page: Page, editor: EditorContainer) => () => void;
  };

type PageListProps<_Flavour extends keyof WorkspaceRegistry> = {
  blockSuiteWorkspace: BlockSuiteWorkspace;
  onOpenPage: (pageId: string, newTab?: boolean) => void;
  view: View;
};

export interface WorkspaceUISchema<Flavour extends keyof WorkspaceRegistry> {
  Header: FC<WorkspaceHeaderProps<Flavour>>;
  PageDetail: FC<PageDetailProps<Flavour>>;
  PageList: FC<PageListProps<Flavour>>;
  SettingsDetail: FC<SettingProps<Flavour>>;
  NewSettingsDetail: FC<NewSettingProps<Flavour>>;
  Provider: FC<PropsWithChildren>;
}

export interface AppEvents {
  // event there is no workspace
  // usually used to initialize workspace plugin
  'app:init': () => string[];
  // request to gain access to workspace plugin
  'workspace:access': () => Promise<void>;
  // request to revoke access to workspace plugin
  'workspace:revoke': () => Promise<void>;
}
