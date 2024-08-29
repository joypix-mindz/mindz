import type { Backlink, Link } from '@affine/core/modules/doc-link';
import { useContext } from 'react';

import { AffinePageReference } from '../../reference-link';
import { managerContext } from '../common';
import * as styles from './links-row.css';

export const LinksRow = ({
  references,
  label,
  className,
  onClick,
}: {
  references: Backlink[] | Link[];
  label: string;
  className?: string;
  onClick?: () => void;
}) => {
  const manager = useContext(managerContext);
  return (
    <div className={className}>
      <div className={styles.title}>
        {label} · {references.length}
      </div>
      {references.map(link => (
        <AffinePageReference
          key={link.docId}
          pageId={link.docId}
          wrapper={props => (
            <div className={styles.wrapper} onClick={onClick} {...props} />
          )}
          docCollection={manager.workspace.docCollection}
        />
      ))}
    </div>
  );
};
