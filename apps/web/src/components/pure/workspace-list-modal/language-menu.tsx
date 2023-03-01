import { Button, Menu, MenuItem, styled } from '@affine/component';
import { LOCALES } from '@affine/i18n';
import { useTranslation } from '@affine/i18n';
import { ArrowDownSmallIcon } from '@blocksuite/icons';
import React, { useCallback } from 'react';

const LanguageMenuContent: React.FC = () => {
  const { i18n } = useTranslation();
  const changeLanguage = useCallback(
    (event: string) => {
      i18n.changeLanguage(event);
    },
    [i18n]
  );
  return (
    <>
      {LOCALES.map(option => {
        return (
          <ListItem
            key={option.name}
            title={option.name}
            onClick={() => {
              changeLanguage(option.tag);
            }}
          >
            {option.originalName}
          </ListItem>
        );
      })}
    </>
  );
};
export const LanguageMenu: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLanguage = LOCALES.find(item => item.tag === i18n.language);

  return (
    <Menu
      content={<LanguageMenuContent />}
      placement="bottom"
      trigger="click"
      disablePortal={true}
    >
      <Button
        icon={<ArrowDownSmallIcon />}
        iconPosition="end"
        noBorder={true}
        style={{ textTransform: 'capitalize' }}
        data-testid="language-menu-button"
      >
        {currentLanguage?.originalName}
      </Button>
    </Menu>
  );
};

const ListItem = styled(MenuItem)(({ theme }) => ({
  height: '38px',
  color: theme.colors.popoverColor,
  fontSize: theme.font.base,
  textTransform: 'capitalize',
  padding: '0 24px',
}));
