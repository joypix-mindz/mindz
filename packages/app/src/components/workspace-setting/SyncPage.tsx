import {
  StyledPublishContent,
  StyledPublishCopyContainer,
  StyledPublishExplanation,
} from './style';
import { DownloadIcon } from '@blocksuite/icons';
import { Button } from '@/ui/button';
import { Menu, MenuItem } from '@/ui/menu';
import { WorkspaceInfo } from '@affine/datacenter';
export const SyncPage = ({ workspace }: { workspace: WorkspaceInfo }) => {
  console.log('workspace: ', workspace);

  return (
    <div>
      <StyledPublishContent>
        {workspace?.provider === 'local' ? (
          <>
            <StyledPublishExplanation>
              {workspace.name ?? 'Affine'} is Local Workspace. All data is
              stored on the current device. You can enable AFFiNE Cloud for this
              workspace to keep data in sync with the cloud.
            </StyledPublishExplanation>

            <StyledPublishCopyContainer>
              <Button
                onClick={() => {
                  // updateWorkspaceMeta(currentWorkspace.id, {
                  //   type: 'cloud',
                  // });
                }}
                type="primary"
                shape="circle"
              >
                Enable AFFiNE Cloud
              </Button>
            </StyledPublishCopyContainer>
          </>
        ) : (
          <>
            <StyledPublishExplanation>
              <code>{workspace.name ?? 'Affine'}</code> is Cloud Workspace. All
              data will be synchronized and saved to the AFFiNE
            </StyledPublishExplanation>
            <StyledPublishCopyContainer>
              <Menu
                content={
                  <>
                    <MenuItem
                      onClick={() => {
                        // deleteMember(workspace.id, 0);
                      }}
                      icon={<DownloadIcon />}
                    >
                      Download core data to device
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        // deleteMember(workspace.id, 0);
                      }}
                      icon={<DownloadIcon />}
                    >
                      Download all data to device
                    </MenuItem>
                  </>
                }
                placement="bottom-end"
                disablePortal={true}
              >
                <Button>Download all data to device</Button>
              </Menu>
            </StyledPublishCopyContainer>
          </>
        )}
      </StyledPublishContent>
    </div>
  );
};
