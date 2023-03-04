import { css, displayFlex, keyframes, styled } from '@affine/component';
// @ts-ignore
import spring, { toString } from 'css-spring';

const ANIMATE_DURATION = 400;

export const StyledThemeModeSwitch = styled('div')({
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  position: 'relative',
});
export const StyledSwitchItem = styled('div')<{
  active: boolean;
  isHover: boolean;
  firstTrigger: boolean;
}>(({ active, isHover, firstTrigger, theme }) => {
  const activeRaiseAnimate = toString(
    spring({ top: '0' }, { top: '-100%' }, { preset: 'gentle' })
  );
  const raiseAnimate = toString(
    spring({ top: '100%' }, { top: '0' }, { preset: 'gentle' })
  );
  const activeDeclineAnimate = toString(
    spring({ top: '-100%' }, { top: '0' }, { preset: 'gentle' })
  );
  const declineAnimate = toString(
    spring({ top: '0' }, { top: '100%' }, { preset: 'gentle' })
  );

  const activeStyle = active
    ? {
        color: theme.colors.iconColor,
        top: '0',
        animation: firstTrigger
          ? css`
              ${keyframes`${
                isHover ? activeRaiseAnimate : activeDeclineAnimate
              }`} ${ANIMATE_DURATION}ms forwards
            `
          : 'unset',
        animationDirection: isHover ? 'normal' : 'alternate',
      }
    : {
        top: '100%',
        color: theme.colors.primaryColor,
        backgroundColor: theme.colors.hoverBackground,
        animation: firstTrigger
          ? css`
              ${keyframes`${
                isHover ? raiseAnimate : declineAnimate
              }`} ${ANIMATE_DURATION}ms forwards
            `
          : 'unset',
        animationDirection: isHover ? 'normal' : 'alternate',
      };
  return css`
    ${css(displayFlex('center', 'center'))}
    width: 32px;
    height: 32px;
    position: absolute;
    left: 0;
    cursor: pointer;
    color: ${activeStyle.color}
    top: ${activeStyle.top};
    background-color: ${activeStyle.backgroundColor};
    animation: ${activeStyle.animation};
    animation-direction: ${activeStyle.animationDirection};
    svg {
      width: 24px;
      height: 24px;
    },
  `;
});
