import { displayFlex, styled } from '@/styles';

export const StyledContent = styled('div')(({ theme }) => {
  return {
    minHeight: '220px',
    maxHeight: '55vh',
    width: '100%',
    overflow: 'auto',
    marginBottom: '10px',
    ...displayFlex('center', 'flex-start'),
    color: theme.colors.popoverColor,
    letterSpacing: '0.06em',
    '[cmdk-group-heading]': {
      margin: '5px 16px',
      fontSize: theme.font.sm,
      fontWeight: '500',
    },
    '[aria-selected="true"]': {
      transition: 'background .15s, color .15s',
      borderRadius: '5px',
      color: theme.colors.primaryColor,
      backgroundColor: theme.colors.hoverBackground,
    },
  };
});
export const StyledJumpTo = styled('div')(({ theme }) => {
  return {
    ...displayFlex('center', 'start'),
    flexDirection: 'column',
    padding: '10px 10px 10px 0',
    fontSize: theme.font.sm,
    strong: {
      fontWeight: '500',
      marginBottom: '10px',
    },
  };
});
export const StyledNotFound = styled('div')(({ theme }) => {
  return {
    width: '612px',
    ...displayFlex('center', 'center'),
    flexDirection: 'column',
    padding: '5px 16px',
    fontSize: theme.font.sm,
    span: {
      width: '100%',
      fontWeight: '500',
    },

    '>svg': {
      marginTop: '10px',
      fontSize: '150px',
    },
  };
});
export const StyledInputContent = styled('div')(({ theme }) => {
  return {
    margin: '13px 0',
    ...displayFlex('space-between', 'center'),
    input: {
      width: '492px',
      height: '22px',
      padding: '0 12px',
      fontSize: theme.font.base,
      ...displayFlex('space-between', 'center'),
      letterSpacing: '0.06em',
      color: theme.colors.popoverColor,

      '::placeholder': {
        color: theme.colors.placeHolderColor,
      },
    },
  };
});
export const StyledShortcut = styled('div')(({ theme }) => {
  return {
    color: theme.colors.placeHolderColor,
    fontSize: theme.font.sm,
    whiteSpace: 'nowrap',
  };
});

export const StyledLabel = styled('label')(({ theme }) => {
  return {
    width: '24px',
    height: '24px',
    color: theme.colors.iconColor,
  };
});

export const StyledModalHeader = styled('div')(({ theme }) => {
  return {
    height: '48px',
    margin: '12px 24px 0px 24px',
    ...displayFlex('space-between', 'center'),
    color: theme.colors.popoverColor,
  };
});
export const StyledModalDivider = styled('div')(({ theme }) => {
  return {
    width: 'auto',
    height: '0',
    margin: '6px 16px 6.5px 16px',
    position: 'relative',
    borderTop: `0.5px solid ${theme.colors.placeHolderColor}`,
  };
});

export const StyledModalFooter = styled('div')(({ theme }) => {
  return {
    fontSize: theme.font.sm,
    lineHeight: '22px',
    marginBottom: '8px',
    textAlign: 'center',
    ...displayFlex('center', 'center'),
    color: theme.colors.popoverColor,
    '[aria-selected="true"]': {
      transition: 'background .15s, color .15s',
      borderRadius: '5px',
      color: theme.colors.primaryColor,
      backgroundColor: theme.colors.hoverBackground,
    },
  };
});
export const StyledModalFooterContent = styled.button(({ theme }) => {
  return {
    width: '612px',
    height: '32px',
    fontSize: theme.font.sm,
    lineHeight: '22px',
    textAlign: 'center',
    ...displayFlex('center', 'center'),
    color: 'inherit',
    borderRadius: '5px',
    transition: 'background .15s, color .15s',
    '>svg': {
      fontSize: '20px',
      marginRight: '12px',
    },
  };
});
export const StyledListItem = styled.button(({ theme }) => {
  return {
    width: '612px',
    height: '32px',
    fontSize: theme.font.sm,
    color: 'inherit',
    paddingLeft: '12px',
    borderRadius: '5px',
    transition: 'background .15s, color .15s',
    ...displayFlex('flex-start', 'center'),
    '>svg': {
      fontSize: '20px',
      marginRight: '12px',
    },
  };
});
