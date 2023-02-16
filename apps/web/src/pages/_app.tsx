import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '../../public/globals.css';
import '../../public/variable.css';
import './temporary.css';
import { Logger } from '@toeverything/pathfinder-logger';
import '@fontsource/space-mono';
import '@fontsource/poppins';
import '../utils/print-build-info';
import ProviderComposer from '@/components/provider-composer';
import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import { AppStateProvider } from '@/providers/app-state-provider';
import ConfirmProvider from '@/providers/ConfirmProvider';
import { ModalProvider } from '@/store/globalModal';
// import AppStateProvider2 from '@/providers/app-state-provider2/provider';

import { useRouter } from 'next/router';
import { Suspense, useEffect } from 'react';
import { PageLoading } from '@/components/loading';
import Head from 'next/head';
import '@affine/i18n';
import { useTranslation } from '@affine/i18n';
import React from 'react';
import { GlobalAppProvider } from '@/store/app';
import { DataCenterLoader } from '@/store/app/datacenter';

const ThemeProvider = dynamic(() => import('@/providers/ThemeProvider'), {
  ssr: false,
});

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<
  P,
  IP
> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Page list which do not rely on app state
const NoNeedAppStatePageList = [
  '/404',
  '/public-workspace/[workspaceId]',
  '/public-workspace/[workspaceId]/[pageId]',
];
const App = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout || (page => page);
  const { i18n } = useTranslation();
  const router = useRouter();

  React.useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <>
      <Head>
        <meta name="theme-color" content="#fafafa" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        <title>AFFiNE</title>
      </Head>
      <Logger />
      <GlobalAppProvider key="BlockSuiteProvider">
        <ProviderComposer
          contexts={[
            <ThemeProvider key="ThemeProvider" />,
            <AppStateProvider key="appStateProvider" />,
            <ModalProvider key="ModalProvider" />,
            <ConfirmProvider key="ConfirmProvider" />,
          ]}
        >
          {NoNeedAppStatePageList.includes(router.route) ? (
            getLayout(<Component {...pageProps} />)
          ) : (
            <Suspense fallback={<PageLoading />}>
              {/* we should put this before every component in case of they read a null value */}
              <DataCenterLoader />
              <AppDefender>
                {getLayout(<Component {...pageProps} />)}
              </AppDefender>
            </Suspense>
          )}
        </ProviderComposer>
      </GlobalAppProvider>
    </>
  );
};

const AppDefender = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  useEffect(() => {
    if (['/index.html', '/'].includes(router.asPath)) {
      router.replace('/workspace');
    }
  }, [router]);

  return <>{children}</>;
};

export default App;
