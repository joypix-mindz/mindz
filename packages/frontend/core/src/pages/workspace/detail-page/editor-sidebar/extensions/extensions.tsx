import { IconButton } from '@affine/component';
import { useJournalInfoHelper } from '@affine/core/hooks/use-journal';
import { useWorkspaceEnabledFeatures } from '@affine/core/hooks/use-workspace-features';
import { FeatureType } from '@affine/graphql';
import type { Doc } from '@blocksuite/store';
import type { Workspace } from '@toeverything/infra';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import {
  editorExtensionsAtom,
  editorSidebarActiveExtensionAtom,
} from '../atoms';
import * as styles from './extensions.css';

export interface ExtensionTabsProps {
  workspace: Workspace;
  page: Doc;
}

// provide a switcher for active extensions
// will be used in global top header (MacOS) or sidebar (Windows)
export const ExtensionTabs = ({ page, workspace }: ExtensionTabsProps) => {
  // todo: filter in editorExtensionsAtom instead?
  const copilotEnabled = useWorkspaceEnabledFeatures(workspace.meta).includes(
    FeatureType.Copilot
  );

  const { isJournal } = useJournalInfoHelper(page.workspace, page.id);

  const exts = useAtomValue(editorExtensionsAtom).filter(ext => {
    if (ext.name === 'copilot' && !copilotEnabled) return false;
    return true;
  });
  const [selected, setSelected] = useAtom(editorSidebarActiveExtensionAtom);

  // if journal is active, set selected to journal
  useEffect(() => {
    isJournal && setSelected('journal');
  }, [isJournal, setSelected]);

  const vars = assignInlineVars({
    [styles.activeIdx]: String(
      exts.findIndex(ext => ext.name === selected?.name) ?? 0
    ),
  });
  useEffect(() => {
    if (!selected || !exts.some(e => selected.name === e.name)) {
      setSelected(exts[0].name);
    }
  }, [exts, selected, setSelected]);
  return (
    <div className={styles.switchRoot} style={vars}>
      {exts.map(extension => {
        return (
          <IconButton
            onClick={() => setSelected(extension.name)}
            key={extension.name}
            data-active={selected?.name === extension.name}
            className={styles.button}
          >
            {extension.icon}
          </IconButton>
        );
      })}
    </div>
  );
};
