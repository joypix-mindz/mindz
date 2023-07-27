import { IconButton } from '@affine/component';
import {
  EditCollectionModel,
  useCollectionManager,
} from '@affine/component/page-list';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { PlusIcon } from '@blocksuite/icons';
import type { Workspace } from '@blocksuite/store';
import { uuidv4 } from '@blocksuite/store';
import { useState } from 'react';

import { useGetPageInfoById } from '../../../../hooks/use-get-page-info';

type AddCollectionButtonProps = {
  workspace: Workspace;
};

export const AddCollectionButton = ({
  workspace,
}: AddCollectionButtonProps) => {
  const getPageInfo = useGetPageInfoById(workspace);
  const setting = useCollectionManager(workspace.id);
  const t = useAFFiNEI18N();
  const [show, showUpdateCollection] = useState(false);
  const defaultCollection = {
    id: uuidv4(),
    name: '',
    pinned: true,
    filterList: [],
    workspaceId: workspace.id,
  };
  return (
    <>
      <IconButton
        data-testid="slider-bar-add-collection-button"
        onClick={() => showUpdateCollection(true)}
        size="small"
      >
        <PlusIcon />
      </IconButton>

      <EditCollectionModel
        propertiesMeta={workspace.meta.properties}
        getPageInfo={getPageInfo}
        onConfirm={setting.saveCollection}
        open={show}
        onClose={() => showUpdateCollection(false)}
        title={t['Save As New Collection']()}
        init={defaultCollection}
      />
    </>
  );
};
