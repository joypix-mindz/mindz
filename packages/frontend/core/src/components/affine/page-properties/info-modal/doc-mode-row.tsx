import { notify, RadioGroup, type RadioItem } from '@affine/component';
import { useI18n } from '@affine/i18n';
import type { DocMode } from '@blocksuite/affine/blocks';
import { FileIcon } from '@blocksuite/icons/rc';
import { DocsService, useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';

import * as styles from './doc-mode-row.css';

export const DocModeRow = ({
  docId,
  className,
}: {
  docId: string;
  className?: string;
}) => {
  const t = useI18n();
  const docList = useService(DocsService).list;
  const primaryMode = useLiveData(docList.primaryMode$(docId));

  const DocModeItems = useMemo<RadioItem[]>(
    () => [
      {
        value: 'page' as DocMode,
        label: t['Page'](),
      },
      {
        value: 'edgeless' as DocMode,
        label: t['Edgeless'](),
      },
    ],
    [t]
  );

  const handleChange = useCallback(
    (e: DocMode) => {
      docList.setPrimaryMode(docId, e);
      notify.success({
        title:
          e === 'page'
            ? t['com.affine.toastMessage.defaultMode.page.title']()
            : t['com.affine.toastMessage.defaultMode.edgeless.title'](),
        message:
          e === 'page'
            ? t['com.affine.toastMessage.defaultMode.page.message']()
            : t['com.affine.toastMessage.defaultMode.edgeless.message'](),
      });
    },
    [docList, docId, t]
  );
  return (
    <div
      className={clsx(styles.rowCell, className)}
      data-testid="info-modal-doc-mode-row"
    >
      <div className={styles.rowNameContainer}>
        <div className={styles.icon}>
          <FileIcon />
        </div>
        <div className={styles.rowName}>
          {t['com.affine.page-properties.property.docMode']()}
        </div>
      </div>
      <RadioGroup
        width={194}
        value={primaryMode}
        onChange={handleChange}
        items={DocModeItems}
      />
    </div>
  );
};
