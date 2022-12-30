import { CSSProperties } from 'react';
import { styled } from '@/styles';

export const ModalWrapper = styled.div<{
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  minHeight?: CSSProperties['minHeight'];
}>(({ theme, width, height, minHeight }) => {
  return {
    width,
    height,
    minHeight,
    backgroundColor: theme.colors.popoverBackground,
    borderRadius: '12px',
    position: 'relative',
  };
});

export default ModalWrapper;
