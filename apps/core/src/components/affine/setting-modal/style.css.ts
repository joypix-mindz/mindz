import { globalStyle, style } from '@vanilla-extract/css';

export const settingContent = style({
  flexGrow: '1',
  height: '100%',
  padding: '40px 15px 20px',
  overflow: 'auto',
});

globalStyle(`${settingContent} .wrapper`, {
  width: '66%',
  minWidth: '450px',
  height: '100%',
  maxWidth: '560px',
  margin: '0 auto',
});

globalStyle(`${settingContent} .wrapper::-webkit-scrollbar`, {
  display: 'none',
});
globalStyle(`${settingContent} .content`, {
  minHeight: '100%',
  paddingBottom: '80px',
});
globalStyle(`${settingContent} .footer`, {
  cursor: 'pointer',
  paddingTop: '40px',
  marginTop: '-80px',
  fontSize: 'var(--affine-font-sm)',
  display: 'flex',
  minHeight: '100px',
});

globalStyle(`${settingContent} .footer a`, {
  color: 'var(--affine-text-primary-color)',
  lineHeight: 'normal',
});
export const footerIconWrapper = style({
  fontSize: 'var(--affine-font-base)',
  color: 'var(--affine-icon-color)',
  marginRight: '12px',
  height: '19px',
  display: 'flex',
  alignItems: 'center',
});
