import { IconButton, Modal, ModalWrapper } from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { CloseIcon } from '@blocksuite/icons';
import type React from 'react';

import { Content, ContentTitle, Header, StyleButton, StyleTips } from './style';

interface EnableAffineCloudModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const EnableAffineCloudModal: React.FC<EnableAffineCloudModalProps> = ({
  onConfirm,
  open,
  onClose,
}) => {
  const t = useAFFiNEI18N();

  return (
    <Modal open={open} onClose={onClose} data-testid="logout-modal">
      <ModalWrapper width={560} height={292}>
        <Header>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Header>
        <Content>
          <ContentTitle>{t['Enable AFFiNE Cloud']()}?</ContentTitle>
          <StyleTips>{t['Enable AFFiNE Cloud Description']()}</StyleTips>
          {/* <StyleTips>{t('Retain cached cloud data')}</StyleTips> */}
          <div>
            <StyleButton
              data-testid="confirm-enable-affine-cloud-button"
              shape="round"
              type="primary"
              onClick={onConfirm}
            >
              {t['Sign in and Enable']()}
            </StyleButton>
            <StyleButton shape="round" onClick={onClose}>
              {t['Not now']()}
            </StyleButton>
          </div>
        </Content>
      </ModalWrapper>
    </Modal>
  );
};
