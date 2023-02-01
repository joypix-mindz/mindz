import {
  StyledDeleteButtonContainer,
  // StyledSettingAvatar,
  StyledSettingAvatarContent,
  StyledSettingInputContainer,
  StyledDoneButtonContainer,
  StyledInput,
  StyledProviderInfo,
  StyleGeneral,
  StyledAvatar,
} from './style';
import { StyledSettingH2 } from '../style';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { useAppState } from '@/providers/app-state-provider';
import { WorkspaceDelete } from './delete';
import { WorkspaceLeave } from './leave';
import { DoneIcon, UsersIcon } from '@blocksuite/icons';
// import { Upload } from '@/components/file-upload';
import { WorkspaceUnitAvatar } from '@/components/workspace-avatar';
import { WorkspaceUnit } from '@affine/datacenter';
import { useWorkspaceHelper } from '@/hooks/use-workspace-helper';
import { useTranslation } from '@affine/i18n';
import { CloudIcon, LocalIcon } from '@/components/workspace-modal/icons';
import { CameraIcon } from './icons';
import { Upload } from '@/components/file-upload';
export const GeneralPage = ({ workspace }: { workspace: WorkspaceUnit }) => {
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const [showLeave, setShowLeave] = useState<boolean>(false);
  const [workspaceName, setWorkspaceName] = useState<string>(workspace.name);
  const { currentWorkspace, isOwner } = useAppState();
  const { updateWorkspace } = useWorkspaceHelper();
  const { t } = useTranslation();

  const handleChangeWorkSpaceName = (newName: string) => {
    setWorkspaceName(newName);
  };
  const handleUpdateWorkspaceName = () => {
    currentWorkspace &&
      updateWorkspace({ name: workspaceName }, currentWorkspace);
  };

  const fileChange = async (file: File) => {
    const blob = new Blob([file], { type: file.type });
    currentWorkspace &&
      (await updateWorkspace({ avatarBlob: blob }, currentWorkspace));
  };

  return workspace ? (
    <StyleGeneral>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <StyledSettingH2>{t('Workspace Avatar')}</StyledSettingH2>
        <StyledSettingAvatarContent>
          <StyledAvatar>
            <Upload
              accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
              fileChange={fileChange}
            >
              <>
                <div className="camera-icon">
                  <CameraIcon></CameraIcon>
                </div>
                <WorkspaceUnitAvatar
                  size={60}
                  name={workspace.name}
                  workspaceUnit={workspace}
                />
              </>
            </Upload>
          </StyledAvatar>
          {/* TODO: Wait for image sync to complete  */}
          {/* <Upload
          accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
          fileChange={fileChange}
        >
          <Button loading={uploading}>{t('Upload')}</Button>
        </Upload> */}
          {/* TODO: add upload logic */}
        </StyledSettingAvatarContent>
        <StyledSettingH2 marginTop={20}>{t('Workspace Name')}</StyledSettingH2>
        <StyledSettingInputContainer>
          <StyledInput
            width={284}
            height={32}
            value={workspaceName}
            placeholder={t('Workspace Name')}
            maxLength={14}
            minLength={1}
            disabled={!isOwner}
            onChange={handleChangeWorkSpaceName}
          ></StyledInput>
          {isOwner ? (
            <StyledDoneButtonContainer
              onClick={() => {
                handleUpdateWorkspaceName();
              }}
            >
              <DoneIcon />
            </StyledDoneButtonContainer>
          ) : null}
        </StyledSettingInputContainer>
        <StyledSettingH2 marginTop={20}>{t('Workspace Type')}</StyledSettingH2>
        <StyledSettingInputContainer>
          {isOwner ? (
            currentWorkspace?.provider === 'local' ? (
              <StyledProviderInfo>
                <LocalIcon />
                {t('Local Workspace')}
              </StyledProviderInfo>
            ) : (
              <StyledProviderInfo>
                <CloudIcon />
                {t('Available Offline')}
              </StyledProviderInfo>
            )
          ) : (
            <StyledProviderInfo>
              <UsersIcon fontSize={20} color={'#FF646B'} />
              {t('Joined Workspace')}
            </StyledProviderInfo>
          )}
        </StyledSettingInputContainer>
      </div>

      <StyledDeleteButtonContainer>
        {isOwner ? (
          <>
            <Button
              type="danger"
              shape="circle"
              style={{ borderRadius: '40px' }}
              onClick={() => {
                setShowDelete(true);
              }}
            >
              {t('Delete Workspace')}
            </Button>
            <WorkspaceDelete
              open={showDelete}
              onClose={() => {
                setShowDelete(false);
              }}
              workspace={workspace}
            />
          </>
        ) : (
          <>
            <Button
              type="danger"
              shape="circle"
              onClick={() => {
                setShowLeave(true);
              }}
            >
              {t('Leave Workspace')}
            </Button>
            <WorkspaceLeave
              open={showLeave}
              onClose={() => {
                setShowLeave(false);
              }}
            />
          </>
        )}
      </StyledDeleteButtonContainer>
    </StyleGeneral>
  ) : null;
};
