import type { LocalWorkspace } from '@affine/env/workspace';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { Trans } from '@affine/i18n';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { useBlockSuiteWorkspacePageIsPublic } from '@toeverything/hooks/use-block-suite-workspace-page-is-public';
import { useState } from 'react';
import { useCallback, useMemo } from 'react';

import { Button, toast } from '../..';
import { PublicLinkDisableModal } from './disable-public-link';
import {
  descriptionStyle,
  inputButtonRowStyle,
  menuItemStyle,
} from './index.css';
import type { ShareMenuProps } from './share-menu';
import { StyledDisableButton, StyledInput, StyledLinkSpan } from './styles';

export const LocalSharePage = (props: ShareMenuProps) => {
  const t = useAFFiNEI18N();
  return (
    <div className={menuItemStyle}>
      <div className={descriptionStyle}>{t['Shared Pages Description']()}</div>
      <Button
        type="primary"
        data-testid="share-menu-enable-affine-cloud-button"
        onClick={() => {
          props.onEnableAffineCloud(props.workspace as LocalWorkspace);
        }}
      >
        {t['Enable AFFiNE Cloud']()}
      </Button>
    </div>
  );
};

export const AffineSharePage = (props: ShareMenuProps) => {
  const [isPublic, setIsPublic] = useBlockSuiteWorkspacePageIsPublic(
    props.currentPage
  );
  const [showDisable, setShowDisable] = useState(false);
  const t = useAFFiNEI18N();
  const sharingUrl = useMemo(() => {
    return `${prefixUrl}public-workspace/${props.workspace.id}/${props.currentPage.id}`;
  }, [props.workspace.id, props.currentPage.id]);
  const onClickCreateLink = useCallback(() => {
    setIsPublic(true);
  }, [setIsPublic]);
  const onClickCopyLink = useCallback(() => {
    navigator.clipboard
      .writeText(sharingUrl)
      .then(() => {
        toast(t['Copied link to clipboard']());
      })
      .catch(err => {
        console.error(err);
      });
  }, [sharingUrl, t]);
  const onDisablePublic = useCallback(() => {
    setIsPublic(false);
    toast('Successfully disabled', {
      portal: document.body,
    });
  }, [setIsPublic]);

  return (
    <div className={menuItemStyle}>
      <div className={descriptionStyle}>
        {t['Create Shared Link Description']()}
      </div>
      <div className={inputButtonRowStyle}>
        <StyledInput
          type="text"
          readOnly
          value={isPublic ? sharingUrl : 'https://app.affine.pro/xxxx'}
        />
        {!isPublic && (
          <Button
            data-testid="affine-share-create-link"
            onClick={onClickCreateLink}
          >
            {t['Create']()}
          </Button>
        )}
        {isPublic && (
          <Button
            data-testid="affine-share-copy-link"
            onClick={onClickCopyLink}
          >
            {t['Copy Link']()}
          </Button>
        )}
      </div>
      <div className={descriptionStyle}>
        <Trans i18nKey="Shared Pages In Public Workspace Description">
          The entire Workspace is published on the web and can be edited via
          <StyledLinkSpan
            onClick={() => {
              props.onOpenWorkspaceSettings(props.workspace);
            }}
          >
            Workspace Settings
          </StyledLinkSpan>
          .
        </Trans>
      </div>
      {isPublic && (
        <>
          <StyledDisableButton onClick={() => setShowDisable(true)}>
            {t['Disable Public Link']()}
          </StyledDisableButton>
          <PublicLinkDisableModal
            open={showDisable}
            onConfirmDisable={onDisablePublic}
            onClose={() => {
              setShowDisable(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export const SharePage = (props: ShareMenuProps) => {
  if (props.workspace.flavour === WorkspaceFlavour.LOCAL) {
    return <LocalSharePage {...props} />;
  } else if (props.workspace.flavour === WorkspaceFlavour.AFFINE_CLOUD) {
    return <AffineSharePage {...props} />;
  }
  throw new Error('Unreachable');
};
