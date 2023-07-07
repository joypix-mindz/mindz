import { Button, displayFlex, styled } from '@affine/component';
import { WorkspaceSubPath } from '@affine/env/workspace';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import Head from 'next/head';
import Image from 'next/legacy/image';
import { useRouter } from 'next/router';
import React from 'react';

import { useRouterHelper } from '../hooks/use-router-helper';

export const StyledContainer = styled('div')(() => {
  return {
    ...displayFlex('center', 'center'),
    flexDirection: 'column',
    height: '100vh',

    img: {
      width: '360px',
      height: '270px',
    },
    p: {
      fontSize: '22px',
      fontWeight: 600,
      margin: '24px 0',
    },
  };
});

export const NotfoundPage = () => {
  const t = useAFFiNEI18N();
  const router = useRouter();
  const { jumpToSubPath } = useRouterHelper(router);
  return (
    <StyledContainer data-testid="notFound">
      <Image alt="404" src="/imgs/invite-error.svg" width={360} height={270} />

      <p>{t['404 - Page Not Found']()}</p>
      <Button
        shape="round"
        onClick={() => {
          const id = localStorage.getItem('last_workspace_id');
          if (id) {
            jumpToSubPath(id, WorkspaceSubPath.ALL).catch(console.error);
          } else {
            router.push('/').catch(err => console.error(err));
          }
        }}
      >
        {t['Back Home']()}
      </Button>
    </StyledContainer>
  );
};

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - AFFiNE</title>
      </Head>
      <NotfoundPage></NotfoundPage>
    </>
  );
}
