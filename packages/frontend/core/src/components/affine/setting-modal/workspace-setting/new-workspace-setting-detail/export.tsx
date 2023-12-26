import { pushNotificationAtom } from '@affine/component/notification-center';
import { SettingRow } from '@affine/component/setting-components';
import { Button } from '@affine/component/ui/button';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { Workspace, WorkspaceMetadata } from '@affine/workspace';
import { useAsyncCallback } from '@toeverything/hooks/affine-async-hooks';
import type { SaveDBFileResult } from '@toeverything/infra/type';
import { useSetAtom } from 'jotai';
import { useState } from 'react';

interface ExportPanelProps {
  workspaceMetadata: WorkspaceMetadata;
  workspace: Workspace | null;
}

export const ExportPanel = ({
  workspaceMetadata,
  workspace,
}: ExportPanelProps) => {
  const workspaceId = workspaceMetadata.id;
  const t = useAFFiNEI18N();
  const [saving, setSaving] = useState(false);

  const pushNotification = useSetAtom(pushNotificationAtom);
  const onExport = useAsyncCallback(async () => {
    if (saving || !workspace) {
      return;
    }
    setSaving(true);
    try {
      await workspace.engine.sync.waitForSynced();
      await workspace.engine.blob.sync();
      const result: SaveDBFileResult =
        await window.apis?.dialog.saveDBFileAs(workspaceId);
      if (result?.error) {
        throw new Error(result.error);
      } else if (!result?.canceled) {
        pushNotification({
          type: 'success',
          title: t['Export success'](),
        });
      }
    } catch (e: any) {
      pushNotification({
        type: 'error',
        title: t['Export failed'](),
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }, [pushNotification, saving, t, workspace, workspaceId]);

  return (
    <SettingRow name={t['Export']()} desc={t['Export Description']()}>
      <Button
        data-testid="export-affine-backup"
        onClick={onExport}
        disabled={saving}
      >
        {t['Export']()}
      </Button>
    </SettingRow>
  );
};
