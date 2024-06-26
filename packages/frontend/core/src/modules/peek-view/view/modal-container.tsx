import * as Dialog from '@radix-ui/react-dialog';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {
  createContext,
  forwardRef,
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
    backgroundColor: 'transparent',
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

export type PeekViewModalContainerProps = PropsWithChildren<{
  onOpenChange: (open: boolean) => void;
  open: boolean;
  target?: HTMLElement;
  controls?: React.ReactNode;
  hideOnEntering?: boolean;
  onAnimationStart?: () => void;
  onAnimateEnd?: () => void;
  padding?: boolean;
  animation?: 'fade' | 'zoom';
  testId?: string;
}>;

export const PeekViewModalContainer = forwardRef<
  HTMLDivElement,
  PeekViewModalContainerProps
>(function PeekViewModalContainer(
  {
    onOpenChange,
    open,
    target,
    controls,
    children,
    hideOnEntering,
    onAnimationStart,
    onAnimateEnd,
    animation = 'zoom',
    padding = true,
    testId,
  },
  ref
) {
  const [{ status }, toggle] = useTransition({
    timeout: animationTimeout,
  });
  const [transformOrigin, setTransformOrigin] = useState<string | null>(null);
  useEffect(() => {
    toggle(open);
    const bondingBox = target ? getElementScreenPositionCenter(target) : null;
    const offsetLeft =
      (window.innerWidth - Math.min(window.innerWidth * 0.9, 1200)) / 2;
    const modalHeight = window.innerHeight * 0.05;
    setTransformOrigin(
      bondingBox
        ? `${bondingBox.x - offsetLeft}px ${bondingBox.y - modalHeight}px`
        : null
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
            onAnimationStart={onAnimationStart}
            onAnimationEnd={onAnimateEnd}
          />
          <div
            ref={ref}
            data-testid={testId}
            data-peek-view-wrapper
            className={styles.modalContentWrapper}
            style={assignInlineVars({
              [styles.transformOrigin]: transformOrigin,
              [styles.animationTimeout]: `${animationTimeout}ms`,
            })}
          >
            <div
              className={clsx(
                styles.modalContentContainer,
                padding && styles.containerPadding,
                animation === 'fade'
                  ? styles.modalContentContainerWithFade
                  : styles.modalContentContainerWithZoom
              )}
              data-testid="peek-view-modal-animation-container"
              data-state={status}
            >
              <Dialog.Content
                {...contentOptions}
                data-no-interaction={status !== 'entered'}
                className={styles.modalContent}
              >
                {hideOnEntering && status === 'entering' ? null : children}
              </Dialog.Content>
              {controls ? (
                <div data-state={status} className={styles.modalControls}>
                  {controls}
                </div>
              ) : null}
            </div>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </PeekViewContext.Provider>
  );
});
