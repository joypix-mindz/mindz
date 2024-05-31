import * as Dialog from '@radix-ui/react-dialog';
import { cssVar } from '@toeverything/theme';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import useTransition from 'react-transition-state';

import * as styles from './modal-container.css';

const animationTimeout = 200;

const contentOptions: Dialog.DialogContentProps = {
  ['data-testid' as string]: 'peek-view-modal',
  onPointerDownOutside: e => {
    const el = e.target as HTMLElement;
    if (el.closest('[data-peek-view-wrapper]')) {
      e.preventDefault();
    }
  },
  style: {
    padding: 0,
    backgroundColor: cssVar('backgroundPrimaryColor'),
    overflow: 'hidden',
  },
};

// a dummy context to let elements know they are inside a peek view
export const PeekViewContext = createContext<Record<string, never> | null>(
  null
);

const emptyContext = {};

export const useInsidePeekView = () => {
  const context = useContext(PeekViewContext);
  return !!context;
};

function getElementScreenPositionCenter(target: HTMLElement) {
  const rect = target.getBoundingClientRect();

  if (rect.top === 0 || rect.left === 0) {
    return null;
  }

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  return {
    x: rect.x + scrollLeft + rect.width / 2,
    y: rect.y + scrollTop + rect.height / 2,
  };
}

export const PeekViewModalContainer = ({
  onOpenChange,
  open,
  target,
  controls,
  children,
  onAnimateEnd,
}: PropsWithChildren<{
  open: boolean;
  target?: HTMLElement;
  onOpenChange: (open: boolean) => void;
  controls: React.ReactNode;
  onAnimateEnd?: () => void;
}>) => {
  const [{ status }, toggle] = useTransition({
    timeout: animationTimeout * 2,
    onStateChange(event) {
      if (event.current.status === 'exited' && onAnimateEnd) {
        onAnimateEnd();
      }
    },
  });
  const [transformOrigin, setTransformOrigin] = useState<string | null>(null);
  useEffect(() => {
    toggle(open);
    const bondingBox = target ? getElementScreenPositionCenter(target) : null;
    setTransformOrigin(
      bondingBox ? `${bondingBox.x}px ${bondingBox.y}px` : null
    );
  }, [open, target]);
  return (
    <PeekViewContext.Provider value={emptyContext}>
      <Dialog.Root modal open={status !== 'exited'} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={styles.modalOverlay}
            data-state={status}
            style={assignInlineVars({
              [styles.transformOrigin]: transformOrigin,
              [styles.animationTimeout]: `${animationTimeout}ms`,
            })}
          />
          <div
            data-peek-view-wrapper
            className={styles.modalContentWrapper}
            style={assignInlineVars({
              [styles.transformOrigin]: transformOrigin,
              [styles.animationTimeout]: `${animationTimeout}ms`,
            })}
          >
            <div className={styles.modalContentContainer}>
              <Dialog.Content
                {...contentOptions}
                className={styles.modalContent}
                data-state={status}
              >
                {children}
              </Dialog.Content>
              <div data-state={status} className={styles.modalControls}>
                {controls}
              </div>
            </div>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </PeekViewContext.Provider>
  );
};
