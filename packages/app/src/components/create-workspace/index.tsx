import { styled } from '@/styles';
import { Modal, ModalWrapper, ModalCloseButton } from '@/ui/modal';
import { Button } from '@/ui/button';
import { useState } from 'react';
import Input from '@/ui/input';
import { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspaceHelper } from '@/hooks/use-workspace-helper';
import { useRouter } from 'next/router';

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal = ({ open, onClose }: ModalProps) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const { createWorkspace } = useWorkspaceHelper();
  const router = useRouter();
  const handleCreateWorkspace = async () => {
    const workspace = await createWorkspace(workspaceName);
    if (workspace && workspace.room) {
      router.replace(`/workspace/${workspace.room}`);
      onClose();
    } else {
      console.log('create error');
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // 👇 Get input value
      handleCreateWorkspace();
    }
  };
  const { t } = useTranslation();
  return (
    <div>
      <Modal open={open} onClose={onClose}>
        <ModalWrapper width={620} height={334} style={{ padding: '10px' }}>
          <Header>
            <ContentTitle>{t('New Workspace')}</ContentTitle>
            <ModalCloseButton
              top={6}
              right={6}
              onClick={() => {
                onClose();
              }}
            />
          </Header>
          <Content>
            <p>{t('Workspace description')}</p>
            <Input
              onKeyDown={handleKeyDown}
              onChange={value => {
                setWorkspaceName(value);
              }}
            ></Input>
            <Button
              onClick={() => {
                handleCreateWorkspace();
              }}
            >
              {t('Create')}
            </Button>
          </Content>
        </ModalWrapper>
      </Modal>
    </div>
  );
};

const Header = styled('div')({
  position: 'relative',
  height: '44px',
});

const Content = styled('div')({
  display: 'flex',
  padding: '0 48px',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
});

const ContentTitle = styled('span')({
  fontSize: '20px',
  lineHeight: '28px',
  fontWeight: 600,
  textAlign: 'left',
  paddingBottom: '16px',
});

// const Footer = styled('div')({
//   height: '70px',
//   paddingLeft: '24px',
//   marginTop: '32px',
//   textAlign: 'center',
// });
