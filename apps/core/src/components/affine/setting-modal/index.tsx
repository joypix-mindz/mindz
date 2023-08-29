import {
  SettingModal as SettingModalBase,
  type SettingModalProps as SettingModalBaseProps,
  WorkspaceDetailSkeleton,
} from '@affine/component/setting-components';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { ContactWithUsIcon } from '@blocksuite/icons';
import { Suspense, useCallback } from 'react';

import { useCurrentLoginStatus } from '../../../hooks/affine/use-current-login-status';
import { AccountSetting } from './account-setting';
import {
  GeneralSetting,
  type GeneralSettingKeys,
  useGeneralSettingList,
} from './general-setting';
import { SettingSidebar } from './setting-sidebar';
import { footerIconWrapper, settingContent } from './style.css';
import { WorkspaceSetting } from './workspace-setting';

type ActiveTab = GeneralSettingKeys | 'workspace' | 'account';

export interface SettingProps {
  activeTab: ActiveTab;
  workspaceId: string | null;
  onSettingClick: (params: {
    activeTab: ActiveTab;
    workspaceId: string | null;
  }) => void;
}

type SettingModalProps = SettingModalBaseProps & SettingProps;

export const SettingModal = ({
  open,
  setOpen,
  activeTab = 'appearance',
  workspaceId = null,
  onSettingClick,
}: SettingModalProps) => {
  const t = useAFFiNEI18N();
  const loginStatus = useCurrentLoginStatus();

  const generalSettingList = useGeneralSettingList();

  const onGeneralSettingClick = useCallback(
    (key: GeneralSettingKeys) => {
      onSettingClick({
        activeTab: key,
        workspaceId: null,
      });
    },
    [onSettingClick]
  );
  const onWorkspaceSettingClick = useCallback(
    (workspaceId: string) => {
      onSettingClick({
        activeTab: 'workspace',
        workspaceId,
      });
    },
    [onSettingClick]
  );
  const onAccountSettingClick = useCallback(() => {
    onSettingClick({ activeTab: 'account', workspaceId: null });
  }, [onSettingClick]);

  return (
    <SettingModalBase open={open} setOpen={setOpen}>
      <SettingSidebar
        generalSettingList={generalSettingList}
        onGeneralSettingClick={onGeneralSettingClick}
        onWorkspaceSettingClick={onWorkspaceSettingClick}
        selectedGeneralKey={activeTab}
        selectedWorkspaceId={workspaceId}
        onAccountSettingClick={onAccountSettingClick}
      />

      <div data-testid="setting-modal-content" className={settingContent}>
        <div className="wrapper">
          <div className="content">
            {activeTab === 'workspace' && workspaceId ? (
              <Suspense fallback={<WorkspaceDetailSkeleton />}>
                <WorkspaceSetting key={workspaceId} workspaceId={workspaceId} />
              </Suspense>
            ) : null}
            {generalSettingList.find(v => v.key === activeTab) ? (
              <GeneralSetting generalKey={activeTab as GeneralSettingKeys} />
            ) : null}
            {activeTab === 'account' && loginStatus === 'authenticated' ? (
              <AccountSetting />
            ) : null}
          </div>
          <div className="footer">
            <div className={footerIconWrapper}>
              <ContactWithUsIcon />
            </div>
            <a
              href="https://community.affine.pro/home"
              target="_blank"
              rel="noreferrer"
            >
              {t['com.affine.settings.suggestion']()}
            </a>
          </div>
        </div>
      </div>
    </SettingModalBase>
  );
};
