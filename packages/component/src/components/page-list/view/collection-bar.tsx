import { EditCollectionModel } from '@affine/component/page-list';
import type { PropertiesMeta } from '@affine/env/filter';
import type { GetPageInfoById } from '@affine/env/page-info';
import {
  DeleteIcon,
  FilterIcon,
  PinedIcon,
  PinIcon,
  UnpinIcon,
  ViewLayersIcon,
} from '@blocksuite/icons';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '../../../ui/button/button';
import { useCollectionManager } from '../use-collection-manager';
import * as styles from './collection-bar.css';

export const CollectionBar = ({
  getPageInfo,
  propertiesMeta,
  columnsCount,
}: {
  getPageInfo: GetPageInfoById;
  propertiesMeta: PropertiesMeta;
  columnsCount: number;
}) => {
  const setting = useCollectionManager();
  const collection = setting.currentCollection;
  const [open, setOpen] = useState(false);
  const actions: {
    icon: ReactNode;
    click: () => void;
    className?: string;
    name: string;
  }[] = useMemo(
    () => [
      {
        icon: (
          <>
            {collection.pinned ? (
              <PinedIcon className={styles.pinedIcon}></PinedIcon>
            ) : (
              <PinIcon className={styles.pinedIcon}></PinIcon>
            )}
            {collection.pinned ? (
              <UnpinIcon className={styles.pinIcon}></UnpinIcon>
            ) : (
              <PinIcon className={styles.pinIcon}></PinIcon>
            )}
          </>
        ),
        name: 'pin',
        className: styles.pin,
        click: () => {
          return setting.updateCollection({
            ...collection,
            pinned: !collection.pinned,
          });
        },
      },
      {
        icon: <FilterIcon />,
        name: 'edit',
        click: () => {
          setOpen(true);
        },
      },
      {
        icon: <DeleteIcon style={{ color: 'red' }} />,
        name: 'delete',
        click: () => {
          setting.deleteCollection(collection.id).catch(err => {
            console.error(err);
          });
        },
      },
    ],
    [setting, collection]
  );
  const onClose = useCallback(() => setOpen(false), []);
  return !setting.isDefault ? (
    <tr style={{ userSelect: 'none' }}>
      <td>
        <div className={styles.view}>
          <EditCollectionModel
            propertiesMeta={propertiesMeta}
            getPageInfo={getPageInfo}
            init={collection}
            open={open}
            onClose={onClose}
            onConfirm={setting.updateCollection}
          ></EditCollectionModel>
          <ViewLayersIcon
            style={{
              height: 20,
              width: 20,
            }}
          />
          <div style={{ marginRight: 10 }}>
            {setting.currentCollection.name}
          </div>
          {actions.map(action => {
            return (
              <div
                key={action.name}
                data-testid={`collection-bar-option-${action.name}`}
                onClick={action.click}
                className={clsx(styles.option, action.className)}
              >
                {action.icon}
              </div>
            );
          })}
        </div>
      </td>
      {Array.from({ length: columnsCount - 2 }).map((_, i) => (
        <td key={i}></td>
      ))}
      <td
        style={{
          display: 'flex',
          justifyContent: 'end',
        }}
      >
        <Button style={{ border: 'none' }} onClick={() => setting.backToAll()}>
          Back to all
        </Button>
      </td>
    </tr>
  ) : null;
};
