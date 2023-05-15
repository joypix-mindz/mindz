import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '4px',
  width: '100%',
  minHeight: '30px',
  userSelect: 'none',
  cursor: 'pointer',
  padding: '0 12px',
  fontSize: 'var(--affine-font-sm)',
  selectors: {
    '&:hover': {
      background: 'var(--affine-hover-color)',
    },
    '&[data-active="true"]': {
      background: 'var(--affine-hover-color)',
    },
    '&[data-disabled="true"]': {
      cursor: 'default',
      color: 'var(--affine-text-secondary-color)',
      pointerEvents: 'none',
    },
  },
});

export const content = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const icon = style({
  marginRight: '14px',
  color: 'var(--affine-icon-color)',
  fontSize: '18px',
});

export const spacer = style({
  flex: 1,
});

export const linkItemRoot = style({
  color: 'inherit',
  display: 'contents',
});
