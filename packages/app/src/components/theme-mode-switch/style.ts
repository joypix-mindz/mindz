import { keyframes, styled } from '@/styles';
import { CSSProperties } from 'react';
// @ts-ignore
import spring, { toString } from 'css-spring';

const ANIMATE_DURATION = 400;

export const StyledThemeModeSwitch = styled('div')({
  width: '32px',
  height: '32px',
  borderRadius: '5px',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  position: 'relative',
});
export const StyledSwitchItem = styled('div')<{
  active: boolean;
  isHover: boolean;
  firstTrigger: boolean;
}>(({ active, isHover, firstTrigger, theme }) => {
  const activeRaiseAnimate = keyframes`${toString(
    spring({ top: '0' }, { top: '-100%' }, { preset: 'gentle' })
  )}`;
  const raiseAnimate = keyframes`${toString(
    spring({ top: '100%' }, { top: '0' }, { preset: 'gentle' })
  )}`;
  const activeDeclineAnimate = keyframes`${toString(
    spring({ top: '-100%' }, { top: '0' }, { preset: 'gentle' })
  )}`;
  const declineAnimate = keyframes`${toString(
    spring({ top: '0' }, { top: '100%' }, { preset: 'gentle' })
  )}`;
  const activeStyle = active
    ? {
        color: theme.colors.disabled,
        top: '0',
        animation: firstTrigger
          ? `${
              isHover ? activeRaiseAnimate : activeDeclineAnimate
            } ${ANIMATE_DURATION}ms forwards`
          : 'unset',
        animationDirection: isHover ? 'normal' : 'alternate',
      }
    : ({
        top: '100%',
        color: theme.colors.highlight,
        backgroundColor: theme.colors.hoverBackground,
        animation: firstTrigger
          ? `${
              isHover ? raiseAnimate : declineAnimate
            } ${ANIMATE_DURATION}ms forwards`
          : 'unset',
        animationDirection: isHover ? 'normal' : 'alternate',
      } as CSSProperties);

  return {
    width: '32px',
    height: '32px',
    display: 'flex',
    position: 'absolute',
    left: '0',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    ...activeStyle,
  };
});
