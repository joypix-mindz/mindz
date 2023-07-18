import { Menu, MenuItem, MenuTrigger } from '@affine/component';
import dayjs from 'dayjs';
import { type FC, useCallback } from 'react';

import {
  dateFormatOptions,
  type DateFormats,
  useAppSetting,
} from '../../../../../atoms/settings';

const DateFormatMenuContent: FC<{
  currentOption: DateFormats;
  onSelect: (option: DateFormats) => void;
}> = ({ onSelect, currentOption }) => {
  return (
    <>
      {dateFormatOptions.map(option => {
        return (
          <MenuItem
            key={option}
            active={currentOption === option}
            onClick={() => {
              onSelect(option);
            }}
          >
            {dayjs(new Date()).format(option)}
          </MenuItem>
        );
      })}
    </>
  );
};
export const DateFormatSetting = () => {
  const [appearanceSettings, setAppSettings] = useAppSetting();
  const handleSelect = useCallback(
    (option: DateFormats) => {
      setAppSettings({ dateFormat: option });
    },
    [setAppSettings]
  );
  return (
    <Menu
      content={
        <DateFormatMenuContent
          onSelect={handleSelect}
          currentOption={appearanceSettings.dateFormat}
        />
      }
      placement="bottom-end"
      trigger="click"
      disablePortal={true}
    >
      <MenuTrigger data-testid="date-format-menu-trigger">
        {dayjs(new Date()).format(appearanceSettings.dateFormat)}
      </MenuTrigger>
    </Menu>
  );
};
