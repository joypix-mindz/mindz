import { EmailIcon } from '@blocksuite/icons';
import { styled } from '@/styles';
import { Modal, ModalWrapper, ModalCloseButton } from '@/ui/modal';
import { Button } from '@/ui/button';
import Input from '@/ui/input';
import { useState } from 'react';
import { Avatar } from '@mui/material';
import useMembers from '@/hooks/use-members';
import { User } from '@affine/datacenter';
import { useTranslation } from '@affine/i18n';
interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onInviteSuccess: () => void;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any) => any>(
  fn: T,
  time?: number,
  immediate?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ((...args: any) => any) => {
  let timeoutId: null | number;
  let defaultImmediate = immediate || false;
  const delay = time || 300;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    if (defaultImmediate) {
      fn.apply(this, args);
      defaultImmediate = false;
      return;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
};

const gmailReg = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/;
export const InviteMemberModal = ({
  open,
  onClose,
  onInviteSuccess,
}: LoginModalProps) => {
  const [email, setEmail] = useState<string>('');
  const [showMember, setShowMember] = useState<boolean>(false);
  const [showTip, setShowTip] = useState<boolean>(false);
  const [userData, setUserData] = useState<User | null>(null);
  const { inviteMember, getUserByEmail } = useMembers();
  const { t } = useTranslation();
  const inputChange = (value: string) => {
    setShowMember(true);
    if (gmailReg.test(value)) {
      setEmail(value);
      setShowTip(false);
      getUserByEmail(value).then(data => {
        if (data?.name) {
          setUserData(data);
          setShowTip(false);
        }
      });
    } else {
      setShowTip(true);
    }
  };
  return (
    <div>
      <Modal open={open} onClose={onClose}>
        <ModalWrapper width={460} height={236}>
          <Header>
            <ModalCloseButton
              top={6}
              right={6}
              onClick={() => {
                onClose();
              }}
            />
          </Header>
          <Content>
            <ContentTitle>{t('Invite Members')}</ContentTitle>
            <InviteBox>
              <Input
                width={360}
                value={email}
                onChange={inputChange}
                onBlur={() => {
                  setShowMember(false);
                }}
                placeholder={t('Invite placeholder')}
              ></Input>
              {showMember ? (
                <Members>
                  {showTip ? (
                    <NoFind>{t('Non-Gmail')}</NoFind>
                  ) : (
                    <Member>
                      {userData?.avatar ? (
                        <Avatar src={userData?.avatar}></Avatar>
                      ) : (
                        <MemberIcon>
                          <EmailIcon></EmailIcon>
                        </MemberIcon>
                      )}
                      <Email>{email}</Email>
                      {/* <div>invited</div> */}
                    </Member>
                  )}
                </Members>
              ) : (
                <></>
              )}
            </InviteBox>
          </Content>
          <Footer>
            <Button
              shape="circle"
              type="primary"
              onClick={async () => {
                await inviteMember(email);
                onInviteSuccess();
              }}
            >
              {t('Invite')}
            </Button>
          </Footer>
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

const ContentTitle = styled('h1')({
  fontSize: '20px',
  lineHeight: '28px',
  fontWeight: 600,
  textAlign: 'center',
  paddingBottom: '16px',
});

const Footer = styled('div')({
  height: '70px',
  paddingLeft: '24px',
  marginTop: '32px',
  textAlign: 'center',
});

const InviteBox = styled('div')({
  position: 'relative',
});

const Members = styled('div')(({ theme }) => {
  return {
    position: 'absolute',
    width: '100%',
    background: theme.colors.pageBackground,
    textAlign: 'left',
    zIndex: 1,
    borderRadius: '0px 10px 10px 10px',
    height: '56px',
    padding: '8px 12px',
    input: {
      '&::placeholder': {
        color: theme.colors.placeHolderColor,
      },
    },
  };
});

const NoFind = styled('div')(({ theme }) => {
  return {
    color: theme.colors.iconColor,
    fontSize: theme.font.sm,
    lineHeight: '40px',
    userSelect: 'none',
    width: '100%',
  };
});

const Member = styled('div')(({ theme }) => {
  return {
    color: theme.colors.iconColor,
    fontSize: theme.font.sm,
    lineHeight: '40px',
    userSelect: 'none',
    display: 'flex',
  };
});

const MemberIcon = styled('div')(({ theme }) => {
  return {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    color: theme.colors.primaryColor,
    background: '#F5F5F5',
    marginRight: '8px',
    textAlign: 'center',
    lineHeight: '45px',
    // icon size
    fontSize: '20px',
    overflow: 'hidden',
    img: {
      width: '100%',
      height: '100%',
    },
  };
});

const Email = styled('div')(({ theme }) => {
  return {
    flex: '1',
    color: theme.colors.popoverColor,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
});
