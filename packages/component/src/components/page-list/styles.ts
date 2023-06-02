import { TableRow } from '../..';
import { Content, displayFlex, styled } from '../../';

export const StyledTableContainer = styled('div')(({ theme }) => {
  return {
    height: 'calc(100vh - 52px)',
    padding: '52px 32px',
    maxWidth: '100%',
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      padding: '52px 0px',
      'tr > td:first-of-type': {
        borderTopLeftRadius: '0px',
        borderBottomLeftRadius: '0px',
      },
      'tr > td:last-of-type': {
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
      },
    },
  };
});

/**
 * @deprecated
 */
export const StyledTitleWrapper = styled('div')(() => {
  return {
    ...displayFlex('flex-start', 'center'),
    a: {
      color: 'inherit',
    },
    'a:visited': {
      color: 'unset',
    },
    'a:hover': {
      color: 'var(--affine-primary-color)',
    },
  };
});
export const StyledTitleLink = styled('div')(() => {
  return {
    ...displayFlex('flex-start', 'center'),
    color: 'var(--affine-text-primary-color)',
    '>svg': {
      fontSize: '24px',
      marginRight: '12px',
      color: 'var(--affine-icon-color)',
    },
  };
});

export const StyledTitleContentWrapper = styled('div')(() => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    overflow: 'hidden',
  };
});

export const StyledTitlePreview = styled(Content)(() => {
  return {
    fontWeight: 400,
    fontSize: 'var(--affine-font-xs)',
    maxWidth: '100%',
  };
});

export const StyledTableRow = styled(TableRow)(() => {
  return {
    cursor: 'pointer',
    '.favorite-button': {
      visibility: 'hidden',
    },
    '&:hover': {
      '.favorite-button': {
        visibility: 'visible',
      },
    },
  };
});
