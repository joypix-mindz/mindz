import '@affine/component/theme/global.css';
import '@affine/component/theme/theme.css';
// bootstrap code before everything
import '../bootstrap';

import { AffineContext } from '@affine/component/context';
import { WorkspaceFallback } from '@affine/component/workspace';
import { createI18n, I18nextProvider } from '@affine/i18n';
import type { EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { PropsWithChildren, ReactElement } from 'react';
import React, { lazy, Suspense } from 'react';

import { AffineErrorBoundary } from '../components/affine/affine-error-eoundary';
import { MessageCenter } from '../components/pure/message-center';
import type { NextPageWithLayout } from '../shared';
import createEmotionCache from '../utils/create-emotion-cache';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const EmptyLayout = (page: ReactElement) => page;

const clientSideEmotionCache = createEmotionCache();

const DevTools = lazy(() =>
  import('jotai-devtools').then(m => ({ default: m.DevTools }))
);

const DebugProvider = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <>
      <Suspense>{process.env.DEBUG_JOTAI === 'true' && <DevTools />}</Suspense>
      {children}
    </>
  );
};

const i18n = createI18n();

const App = function App({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}: AppPropsWithLayout & {
  emotionCache?: EmotionCache;
}) {
  const getLayout = Component.getLayout || EmptyLayout;

  return (
    <CacheProvider value={emotionCache}>
      <I18nextProvider i18n={i18n}>
        <MessageCenter />
        <AffineErrorBoundary router={useRouter()}>
          <Suspense fallback={<WorkspaceFallback key="RootPageLoading" />}>
            <AffineContext>
              <Head>
                <title>AFFiNE</title>
                <meta
                  name="viewport"
                  content="initial-scale=1, width=device-width"
                />
              </Head>
              <DebugProvider>
                {getLayout(<Component {...pageProps} />)}
              </DebugProvider>
            </AffineContext>
          </Suspense>
        </AffineErrorBoundary>
      </I18nextProvider>
    </CacheProvider>
  );
};

export default App;
