import { Permission } from '@affine/graphql';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { Button } from '@toeverything/components/button';
import { useCallback, useEffect, useState } from 'react';

import { Modal, ModalCloseButton, ModalWrapper } from '../../ui/modal';
import { AuthInput } from '..//auth-components';
import { emailRegex } from '..//auth-components/utils';
import * as styles from './styles.css';

export interface InviteModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onConfirm: (params: { email: string; permission: Permission }) => void;
  isMutating: boolean;
}

export const InviteModal = ({
  open,
  setOpen,
  onConfirm,
  isMutating,
}: InviteModalProps) => {
  const t = useAFFiNEI18N();
  const [inviteEmail, setInviteEmail] = useState('');
  const [permission] = useState(Permission.Write);
  const [isValidEmail, setIsValidEmail] = useState(true);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleConfirm = useCallback(() => {
    if (!emailRegex.test(inviteEmail)) {
      setIsValidEmail(false);
      return;
    }
    setIsValidEmail(true);

    onConfirm({
      email: inviteEmail,
      permission,
    });
  }, [inviteEmail, onConfirm, permission]);

  useEffect(() => {
    if (!open) {
      setInviteEmail('');
      setIsValidEmail(true);
    }
  }, [open]);

  return (
    <Modal
      wrapperPosition={['center', 'center']}
      data-testid="invite-modal"
      open={open}
    >
      <ModalWrapper
        width={480}
        height={254}
        style={{
          padding: '20px 26px',
        }}
      >
        <ModalCloseButton top={20} right={20} onClick={handleCancel} />

        <div className={styles.inviteModalTitle}>{t['Invite Members']()}</div>
        <div className={styles.inviteModalContent}>
          {t['Invite Members Message']()}
          {/*TODO: check email & add placeholder*/}
          <AuthInput
            disabled={isMutating}
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={setInviteEmail}
            error={!isValidEmail}
            errorHint={
              isValidEmail ? '' : t['com.affine.auth.sign.email.error']()
            }
            onEnter={handleConfirm}
            style={{ marginTop: 20 }}
            size="large"
          />
        </div>
        <div className={styles.inviteModalButtonContainer}>
          <Button style={{ marginRight: 20 }} onClick={handleCancel}>
            {t['com.affine.inviteModal.button.cancel']()}
          </Button>
          <Button type="primary" onClick={handleConfirm} loading={isMutating}>
            {t['Invite']()}
          </Button>
        </div>
      </ModalWrapper>
    </Modal>
  );
};
