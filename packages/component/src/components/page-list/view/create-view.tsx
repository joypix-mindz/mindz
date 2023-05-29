import { Button, Input, Modal, ModalWrapper } from '@affine/component';
import { uuidv4 } from '@blocksuite/store';
import { useState } from 'react';

import { FilterList } from '../filter';
import type { Filter } from '../filter/vars';
import type { View } from '../use-all-page-setting';

type CreateViewProps = {
  init: Filter[];
  onConfirm: (view: View) => void;
};

const CreateView = ({
  init,
  onConfirm,
  onCancel,
}: CreateViewProps & { onCancel: () => void }) => {
  const [value, onChange] = useState<View>({
    name: '',
    filterList: init,
    id: uuidv4(),
  });

  return (
    <div>
      <h1>Save As New View</h1>
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          borderRadius: 8,
          padding: 20,
          marginTop: 20,
        }}
      >
        <FilterList
          value={value.filterList}
          onChange={list => onChange({ ...value, filterList: list })}
        ></FilterList>
      </div>
      <div style={{ marginTop: 20 }}>
        <Input
          placeholder="Untitled View"
          value={value.name}
          onChange={text => onChange({ ...value, name: text })}
        />
      </div>
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}
      >
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          style={{ marginLeft: 20 }}
          type="primary"
          onClick={() => {
            if (value.name.trim().length > 0) {
              onConfirm(value);
            }
          }}
        >
          Create
        </Button>
      </div>
    </div>
  );
};
export const SaveViewButton = ({ init, onConfirm }: CreateViewProps) => {
  const [show, changeShow] = useState(false);
  return (
    <>
      <Button onClick={() => changeShow(true)}>Save view</Button>
      <Modal open={show} onClose={() => changeShow(false)}>
        <ModalWrapper width={560} style={{ padding: '40px' }}>
          <CreateView
            init={init}
            onCancel={() => changeShow(false)}
            onConfirm={view => {
              onConfirm(view);
              changeShow(false);
            }}
          />
        </ModalWrapper>
      </Modal>
    </>
  );
};
