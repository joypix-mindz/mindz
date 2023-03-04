import { AffineTheme, ThemeProviderProps } from '@affine/component';
import {
  getDarkTheme,
  getLightTheme,
  globalThemeVariables,
  ThemeProvider as AffineThemeProvider,
} from '@affine/component';
import { GlobalStyles } from '@mui/material';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import type { PropsWithChildren } from 'react';
import React, { memo, useEffect, useMemo, useState } from 'react';

import { useCurrentPageId } from '../hooks/current/use-current-page-id';
import { useCurrentWorkspace } from '../hooks/current/use-current-workspace';
import { usePageMeta } from '../hooks/use-page-meta';

const ThemeInjector = React.memo<{
  themeStyle: AffineTheme;
}>(function ThemeInjector({ themeStyle }) {
  return (
    <GlobalStyles
      styles={{
        ':root': globalThemeVariables(themeStyle) as any,
      }}
    />
  );
});

const ThemeProviderInner = memo<React.PropsWithChildren>(
  function ThemeProviderInner({ children }) {
    const { theme } = useTheme();
    const [currentWorkspace] = useCurrentWorkspace();
    const [currentPage] = useCurrentPageId();
    const pageMeta = usePageMeta(currentWorkspace?.blockSuiteWorkspace ?? null);
    const editorMode =
      pageMeta.find(page => page.id === currentPage)?.mode ?? 'page';
    const themeStyle = useMemo(() => getLightTheme(editorMode), [editorMode]);
    const darkThemeStyle = useMemo(
      () => getDarkTheme(editorMode),
      [editorMode]
    );
    // SSR will always render the light theme, so we need to defer the theme if user selected dark mode
    const [deferTheme, setDeferTheme] = useState('light');
    useEffect(() => {
      setDeferTheme(theme === 'dark' ? 'dark' : 'light');
    }, [theme]);
    return (
      <AffineThemeProvider
        theme={deferTheme === 'dark' ? darkThemeStyle : themeStyle}
      >
        <ThemeInjector
          themeStyle={deferTheme === 'dark' ? darkThemeStyle : themeStyle}
        />
        {children}
      </AffineThemeProvider>
    );
  }
);

const themes = ['dark', 'light'];

export const ThemeProvider = ({
  children,
}: PropsWithChildren<ThemeProviderProps>) => {
  return (
    <NextThemeProvider themes={themes}>
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </NextThemeProvider>
  );
};
