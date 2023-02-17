import { styled } from '@affine/component';

import { useModal } from '@/store/globalModal';

import { AffineIcon } from '../../icons/Icons';
import {
  LoginItemWrapper,
  WorkspaceItemAvatar,
  WorkspaceItemContent,
} from './styles';

export const LoginItem = () => {
  const { triggerLoginModal } = useModal();
  return (
    <LoginItemWrapper
      onClick={() => triggerLoginModal()}
      data-testid="open-login-modal"
    >
      <WorkspaceItemAvatar alt="AFFiNE" src={''}>
        <AffineIcon />
      </WorkspaceItemAvatar>
      <WorkspaceItemContent>
        <Name title="AFFiNE">AFFiNE</Name>
        <Description
          title="Log in to sync with affine"
          className="login-description"
        >
          Log in to sync with affine
        </Description>
      </WorkspaceItemContent>
    </LoginItemWrapper>
  );
};

const Name = styled('div')(({ theme }) => {
  return {
    color: theme.colors.quoteColor,
    fontSize: theme.font.base,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
});

const Description = styled('div')(({ theme }) => {
  return {
    color: theme.colors.iconColor,
    fontSize: theme.font.sm,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
});
