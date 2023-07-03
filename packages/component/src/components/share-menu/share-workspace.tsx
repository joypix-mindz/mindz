import type {
  AffineCloudWorkspace,
  LocalWorkspace,
} from '@affine/env/workspace';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { FC } from 'react';

import { descriptionStyle, menuItemStyle } from './index.css';
import type { ShareMenuProps } from './share-menu';
import { StyledButton } from './styles';

const ShareLocalWorkspace: FC<ShareMenuProps<LocalWorkspace>> = props => {
  const t = useAFFiNEI18N();
  return (
    <div className={menuItemStyle}>
      <div className={descriptionStyle}>
        {t['Share Menu Public Workspace Description1']()}
      </div>
      <StyledButton
        data-testid="share-menu-enable-affine-cloud-button"
        onClick={() => {
          props.onOpenWorkspaceSettings(props.workspace);
        }}
      >
        {t['Open Workspace Settings']()}
      </StyledButton>
    </div>
  );
};

const ShareAffineWorkspace: FC<
  ShareMenuProps<AffineCloudWorkspace>
> = props => {
  // fixme: regression
  const isPublicWorkspace = false;
  const t = useAFFiNEI18N();
  return (
    <div className={menuItemStyle}>
      <div className={descriptionStyle}>
        {isPublicWorkspace
          ? t['Share Menu Public Workspace Description2']()
          : t['Share Menu Public Workspace Description1']()}
      </div>
      <StyledButton
        data-testid="share-menu-publish-to-web-button"
        onClick={() => {
          props.onOpenWorkspaceSettings(props.workspace);
        }}
      >
        {t['Open Workspace Settings']()}
      </StyledButton>
    </div>
  );
};

export const ShareWorkspace: FC<ShareMenuProps> = props => {
  if (props.workspace.flavour === WorkspaceFlavour.LOCAL) {
    return (
      <ShareLocalWorkspace {...(props as ShareMenuProps<LocalWorkspace>)} />
    );
  } else if (props.workspace.flavour === WorkspaceFlavour.AFFINE_CLOUD) {
    return (
      <ShareAffineWorkspace
        {...(props as ShareMenuProps<AffineCloudWorkspace>)}
      />
    );
  }
  throw new Error('Unreachable');
};
