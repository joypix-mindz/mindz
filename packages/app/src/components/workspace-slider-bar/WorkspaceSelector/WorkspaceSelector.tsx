import { Avatar, WorkspaceName, SelectorWrapper } from './styles';
import { useEffect, useState } from 'react';
import { AffineIcon } from '../icons/icons';
import { WorkspaceModal } from '@/components/workspace-modal';
import { getActiveWorkspace } from '@/hooks/mock-data/mock';

export const WorkspaceSelector = () => {
  const [workspaceListShow, setWorkspaceListShow] = useState(false);
  const [workspace, setWorkSpace] = useState(getActiveWorkspace());
  useEffect(() => {
    getWorkspace();
  }, [workspaceListShow]);
  const getWorkspace = () => {
    const workspace = getActiveWorkspace();
    setWorkSpace(workspace);
  };

  return (
    <>
      <SelectorWrapper
        onClick={() => {
          setWorkspaceListShow(true);
        }}
        data-testid="current-workspace"
      >
        <Avatar
          alt="Affine"
          data-testid="workspace-avatar"
          src={workspace.avatar}
        >
          <AffineIcon />
        </Avatar>
        <WorkspaceName data-testid="workspace-name">
          {workspace?.name ?? 'AFFiNE'}
        </WorkspaceName>
      </SelectorWrapper>
      <WorkspaceModal
        open={workspaceListShow}
        onClose={() => {
          setWorkspaceListShow(false);
          getWorkspace();
        }}
      ></WorkspaceModal>
    </>
  );
};
