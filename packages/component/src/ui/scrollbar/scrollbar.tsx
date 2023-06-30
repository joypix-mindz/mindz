import * as ScrollArea from '@radix-ui/react-scroll-area';
import clsx from 'clsx';
import { type PropsWithChildren } from 'react';

import { useHasScrollTop } from '../../components/app-sidebar/sidebar-containers/use-has-scroll-top';
import * as styles from './index.css';

export type ScrollableContainerProps = {
  showScrollTopBorder?: boolean;
  inTableView?: boolean;
  className?: string;
  viewPortClassName?: string;
};

export const ScrollableContainer = ({
  children,
  showScrollTopBorder = false,
  inTableView = false,
  className,
  viewPortClassName,
}: PropsWithChildren<ScrollableContainerProps>) => {
  const [hasScrollTop, ref] = useHasScrollTop();
  return (
    <ScrollArea.Root
      className={clsx(styles.scrollableContainerRoot, className)}
    >
      <div
        data-has-scroll-top={hasScrollTop}
        className={clsx({ [styles.scrollTopBorder]: showScrollTopBorder })}
      />
      <ScrollArea.Viewport
        className={clsx([styles.scrollableViewport, viewPortClassName])}
        ref={ref}
      >
        <div className={styles.scrollableContainer}>{children}</div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className={clsx(styles.scrollbar, {
          [styles.TableScrollbar]: inTableView,
        })}
      >
        <ScrollArea.Thumb className={styles.scrollbarThumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
};
