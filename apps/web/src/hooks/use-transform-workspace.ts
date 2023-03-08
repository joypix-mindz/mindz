import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { jotaiWorkspacesAtom } from '../atoms';
import { WorkspacePlugins } from '../plugins';
import { FlavourToWorkspace, RemWorkspaceFlavour } from '../shared';

/**
 * Transform workspace from one flavour to another
 *
 * The logic here is to delete the old workspace and create a new one.
 */
export function useTransformWorkspace() {
  const set = useSetAtom(jotaiWorkspacesAtom);
  return useCallback(
    async <From extends RemWorkspaceFlavour, To extends RemWorkspaceFlavour>(
      from: From,
      to: To,
      workspace: FlavourToWorkspace[From]
    ): Promise<string> => {
      await WorkspacePlugins[from].CRUD.delete(workspace as any);
      const newId = await WorkspacePlugins[to].CRUD.create(
        workspace.blockSuiteWorkspace
      );
      set(workspaces => {
        const idx = workspaces.findIndex(ws => ws.id === workspace.id);
        workspaces.splice(idx, 1, {
          id: newId,
          flavour: to,
        });
        return [...workspaces];
      });
      return newId;
    },
    [set]
  );
}
