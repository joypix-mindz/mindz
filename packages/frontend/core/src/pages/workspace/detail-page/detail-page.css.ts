import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
  width: '100%',
});

export const mainContainer = style({
  display: 'flex',
  flex: 1,
  height: '100%',
  position: 'relative',
  flexDirection: 'column',
  minWidth: 0,
  overflow: 'hidden',
  selectors: {
    [`${root}[data-client-border=true] &`]: {
      borderRadius: '4px',
    },
  },
});

export const editorContainer = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
  zIndex: 0,
});

export const sidebarContainer = style({
  display: 'flex',
  flexShrink: 0,
  height: '100%',
  selectors: {
    [`${root}[data-client-border=true] &`]: {
      paddingLeft: 9,
    },
    [`${root}[data-client-border=false] &`]: {
      borderLeft: '1px solid var(--affine-border-color)',
    },
  },
});

export const sidebarContainerInner = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  selectors: {
    [`${root}[data-client-border=true] &`]: {
      borderRadius: '4px',
    },
  },
});
