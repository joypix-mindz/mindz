import { AffineShapeIcon } from '@affine/component/page-list'; // TODO: import from page-list temporarily, need to defined common svg icon/images management.
import { Button } from '@affine/component/ui/button';
import { WorkspaceSubPath } from '@affine/env/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import {
  waitForCurrentWorkspaceAtom,
  workspaceManagerAtom,
} from '@affine/workspace/atom';
import { useAsyncCallback } from '@toeverything/hooks/affine-async-hooks';
import { useWorkspaceStatus } from '@toeverything/hooks/use-workspace-status';
import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { useNavigateHelper } from '../../hooks/use-navigate-helper';
import * as styles from './upgrade.css';
import { ArrowCircleIcon, HeartBreakIcon } from './upgrade-icon';

/**
 * TODO: Help info is not implemented yet.
 */
export const WorkspaceUpgrade = function WorkspaceUpgrade() {
  const [error, setError] = useState<string | null>(null);
  const currentWorkspace = useAtomValue(waitForCurrentWorkspaceAtom);
  const workspaceManager = useAtomValue(workspaceManagerAtom);
  const upgradeStatus = useWorkspaceStatus(currentWorkspace, s => s.upgrade);
  const { openPage } = useNavigateHelper();
  const t = useAFFiNEI18N();

  const onButtonClick = useAsyncCallback(async () => {
    if (upgradeStatus?.upgrading) {
      return;
    }

    try {
      const newWorkspaceId =
        await currentWorkspace.upgrade.upgrade(workspaceManager);
      if (newWorkspaceId) {
        openPage(newWorkspaceId, WorkspaceSubPath.ALL);
      } else {
        // blocksuite may enter an incorrect state, reload to reset it.
        location.reload();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '' + error);
    }
  }, [
    upgradeStatus?.upgrading,
    currentWorkspace.upgrade,
    workspaceManager,
    openPage,
  ]);

  return (
    <div className={styles.layout}>
      <div className={styles.upgradeBox}>
        <AffineShapeIcon width={180} height={180} />
        <p className={styles.upgradeTips}>
          {error ? error : t['com.affine.upgrade.tips.normal']()}
        </p>
        <Button
          data-testid="upgrade-workspace-button"
          onClick={onButtonClick}
          size="extraLarge"
          icon={
            error ? (
              <HeartBreakIcon />
            ) : (
              <ArrowCircleIcon
                className={
                  upgradeStatus?.upgrading ? styles.loadingIcon : undefined
                }
              />
            )
          }
          type={error ? 'error' : 'default'}
        >
          {error
            ? t['com.affine.upgrade.button-text.error']()
            : upgradeStatus?.upgrading
              ? t['com.affine.upgrade.button-text.upgrading']()
              : t['com.affine.upgrade.button-text.pending']()}
        </Button>
      </div>
    </div>
  );
};
