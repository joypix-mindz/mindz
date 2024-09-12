import type { RadioItem } from '@affine/component';
import { RadioGroup, Switch } from '@affine/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@affine/component/setting-components';
import { useI18n } from '@affine/i18n';
import type { AppSetting } from '@toeverything/infra';
import { windowFrameStyleOptions } from '@toeverything/infra';
import { useTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';

import { useAppSettingHelper } from '../../../../../hooks/affine/use-app-setting-helper';
import { LanguageMenu } from '../../../language-menu';
import { Page } from '../editor/page';
import { DateFormatSetting } from './date-format-setting';
import { settingWrapper } from './style.css';
import { ThemeEditorSetting } from './theme-editor-setting';

export const getThemeOptions = (t: ReturnType<typeof useI18n>) =>
  [
    {
      value: 'system',
      label: t['com.affine.themeSettings.system'](),
      testId: 'system-theme-trigger',
    },
    {
      value: 'light',
      label: t['com.affine.themeSettings.light'](),
      testId: 'light-theme-trigger',
    },
    {
      value: 'dark',
      label: t['com.affine.themeSettings.dark'](),
      testId: 'dark-theme-trigger',
    },
  ] satisfies RadioItem[];

export const ThemeSettings = () => {
  const t = useI18n();
  const { setTheme, theme } = useTheme();

  const radioItems = useMemo<RadioItem[]>(() => getThemeOptions(t), [t]);

  return (
    <RadioGroup
      items={radioItems}
      value={theme}
      width={250}
      className={settingWrapper}
      onChange={useCallback(
        (value: string) => {
          setTheme(value);
        },
        [setTheme]
      )}
    />
  );
};

export const AppearanceSettings = () => {
  const t = useI18n();

  const { appSettings, updateSettings } = useAppSettingHelper();

  return (
    <>
      <SettingHeader
        title={t['com.affine.appearanceSettings.title']()}
        subtitle={t['com.affine.appearanceSettings.subtitle']()}
      />

      <SettingWrapper title={t['com.affine.appearanceSettings.theme.title']()}>
        <SettingRow
          name={t['com.affine.appearanceSettings.color.title']()}
          desc={t['com.affine.appearanceSettings.color.description']()}
        >
          <ThemeSettings />
        </SettingRow>
        <SettingRow
          name={t['com.affine.appearanceSettings.language.title']()}
          desc={t['com.affine.appearanceSettings.language.description']()}
        >
          <div className={settingWrapper}>
            <LanguageMenu />
          </div>
        </SettingRow>
        {environment.isElectron ? (
          <SettingRow
            name={t['com.affine.appearanceSettings.clientBorder.title']()}
            desc={t['com.affine.appearanceSettings.clientBorder.description']()}
            data-testid="client-border-style-trigger"
          >
            <Switch
              checked={appSettings.clientBorder}
              onChange={checked => updateSettings('clientBorder', checked)}
            />
          </SettingRow>
        ) : null}
        {runtimeConfig.enableNewSettingUnstableApi && environment.isElectron ? (
          <SettingRow
            name={t['com.affine.appearanceSettings.windowFrame.title']()}
            desc={t['com.affine.appearanceSettings.windowFrame.description']()}
          >
            <RadioGroup
              items={windowFrameStyleOptions.map(option => ({
                value: option,
                label:
                  t[`com.affine.appearanceSettings.windowFrame.${option}`](),
              }))}
              value={appSettings.windowFrameStyle}
              className={settingWrapper}
              width={250}
              onChange={(value: AppSetting['windowFrameStyle']) => {
                updateSettings('windowFrameStyle', value);
              }}
            />
          </SettingRow>
        ) : null}
        {runtimeConfig.enableThemeEditor ? <ThemeEditorSetting /> : null}
      </SettingWrapper>
      {/* // TODO(@JimmFly): remove Page component when stable release */}
      <Page />
      {runtimeConfig.enableNewSettingUnstableApi ? (
        <SettingWrapper title={t['com.affine.appearanceSettings.date.title']()}>
          <SettingRow
            name={t['com.affine.appearanceSettings.dateFormat.title']()}
            desc={t['com.affine.appearanceSettings.dateFormat.description']()}
          >
            <div className={settingWrapper}>
              <DateFormatSetting />
            </div>
          </SettingRow>
          <SettingRow
            name={t['com.affine.appearanceSettings.startWeek.title']()}
            desc={t['com.affine.appearanceSettings.startWeek.description']()}
          >
            <Switch
              checked={appSettings.startWeekOnMonday}
              onChange={checked => updateSettings('startWeekOnMonday', checked)}
            />
          </SettingRow>
        </SettingWrapper>
      ) : null}

      {environment.isElectron ? (
        <SettingWrapper
          title={t['com.affine.appearanceSettings.sidebar.title']()}
        >
          <SettingRow
            name={t['com.affine.appearanceSettings.noisyBackground.title']()}
            desc={t[
              'com.affine.appearanceSettings.noisyBackground.description'
            ]()}
          >
            <Switch
              checked={appSettings.enableNoisyBackground}
              onChange={checked =>
                updateSettings('enableNoisyBackground', checked)
              }
            />
          </SettingRow>
          {environment.isMacOs && (
            <SettingRow
              name={t['com.affine.appearanceSettings.translucentUI.title']()}
              desc={t[
                'com.affine.appearanceSettings.translucentUI.description'
              ]()}
            >
              <Switch
                checked={appSettings.enableBlurBackground}
                onChange={checked =>
                  updateSettings('enableBlurBackground', checked)
                }
              />
            </SettingRow>
          )}
        </SettingWrapper>
      ) : null}
    </>
  );
};
