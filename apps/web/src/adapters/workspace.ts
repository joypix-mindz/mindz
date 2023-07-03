import { Unreachable } from '@affine/env/constant';
import type {
  AppEvents,
  WorkspaceAdapter,
  WorkspaceUISchema,
} from '@affine/env/workspace';
import {
  LoadPriority,
  ReleaseType,
  WorkspaceFlavour,
} from '@affine/env/workspace';

import { LocalAdapter } from './local';

const unimplemented = () => {
  throw new Error('Not implemented');
};

const bypassList = async () => {
  return [];
};

export const WorkspaceAdapters = {
  [WorkspaceFlavour.LOCAL]: LocalAdapter,
  [WorkspaceFlavour.AFFINE_CLOUD]: {
    releaseType: ReleaseType.UNRELEASED,
    flavour: WorkspaceFlavour.AFFINE_CLOUD,
    loadPriority: LoadPriority.HIGH,
    Events: {} as Partial<AppEvents>,
    // todo: implement this
    CRUD: {
      get: unimplemented,
      list: bypassList,
      delete: unimplemented,
      create: unimplemented,
    },
    // todo: implement this
    UI: {
      Provider: unimplemented,
      Header: unimplemented,
      PageDetail: unimplemented,
      PageList: unimplemented,
      NewSettingsDetail: unimplemented,
    },
  },
  [WorkspaceFlavour.PUBLIC]: {
    releaseType: ReleaseType.UNRELEASED,
    flavour: WorkspaceFlavour.PUBLIC,
    loadPriority: LoadPriority.LOW,
    Events: {} as Partial<AppEvents>,
    // todo: implement this
    CRUD: {
      get: unimplemented,
      list: bypassList,
      delete: unimplemented,
      create: unimplemented,
    },
    // todo: implement this
    UI: {
      Provider: unimplemented,
      Header: unimplemented,
      PageDetail: unimplemented,
      PageList: unimplemented,
      NewSettingsDetail: unimplemented,
    },
  },
} satisfies {
  [Key in WorkspaceFlavour]: WorkspaceAdapter<Key>;
};

export function getUIAdapter<Flavour extends WorkspaceFlavour>(
  flavour: Flavour
): WorkspaceUISchema<Flavour> {
  const ui = WorkspaceAdapters[flavour].UI as WorkspaceUISchema<Flavour>;
  if (!ui) {
    throw new Unreachable();
  }
  return ui;
}
