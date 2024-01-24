import { Button } from '@affine/component/ui/button';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import type { SurfaceService } from '@blocksuite/blocks';
import { PresentationIcon } from '@blocksuite/icons';
import { useCallback, useEffect, useState } from 'react';

import * as styles from './styles.css';

export const PresentButton = () => {
  const t = useAFFiNEI18N();
  const [isPresent, setIsPresent] = useState(false);

  const handlePresent = useCallback(() => {
    // TODO: use editor Atom
    const editorRoot = document.querySelector('editor-host');
    if (!editorRoot || isPresent) return;

    // TODO: use surfaceService subAtom
    const surfaceService = editorRoot?.spec.getService(
      'affine:surface'
    ) as SurfaceService;

    surfaceService?.setNavigatorMode(true);
    setIsPresent(true);
  }, [isPresent]);

  useEffect(() => {
    if (!isPresent) return;

    // TODO: use editor Atom
    const editorRoot = document.querySelector('editor-host');
    if (!editorRoot) return;

    const edgelessPage = editorRoot?.querySelector('affine-edgeless-page');
    if (!edgelessPage) return;

    edgelessPage.slots.edgelessToolUpdated.on(() => {
      setIsPresent(edgelessPage.edgelessTool.type === 'frameNavigator');
    });

    return () => {
      edgelessPage.slots.edgelessToolUpdated.dispose();
    };
  }, [isPresent]);

  return (
    <Button
      type="primary"
      icon={<PresentationIcon />}
      className={styles.presentButton}
      onClick={handlePresent}
      disabled={isPresent}
    >
      {t['com.affine.share-page.header.present']()}
    </Button>
  );
};
