import { notify } from '@affine/component';
import { AuthModal as AuthModalBase } from '@affine/component/auth-components';
import { authAtom, type AuthAtomData } from '@affine/core/components/atoms';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { AuthService } from '@affine/core/modules/cloud';
import { apis, events } from '@affine/electron-api';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useAtom } from 'jotai/react';
import type { FC } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { AfterSignInSendEmail } from './after-sign-in-send-email';
import { AfterSignUpSendEmail } from './after-sign-up-send-email';
import { SendEmail } from './send-email';
import { SignIn } from './sign-in';
import { SignInWithPassword } from './sign-in-with-password';

type AuthAtomType<T extends AuthAtomData['state']> = Extract<
  AuthAtomData,
  { state: T }
>;

// return field in B that is not in A
type Difference<
  A extends Record<string, any>,
  B extends Record<string, any>,
> = Pick<B, Exclude<keyof B, keyof A>>;

export type AuthPanelProps<State extends AuthAtomData['state']> = {
  setAuthData: <T extends AuthAtomData['state']>(
    updates: { state: T } & Difference<AuthAtomType<State>, AuthAtomType<T>>
  ) => void;
  onSkip?: () => void;
} & Extract<AuthAtomData, { state: State }>;

const config: {
  [k in AuthAtomData['state']]: FC<AuthPanelProps<k>>;
} = {
  signIn: SignIn,
  afterSignUpSendEmail: AfterSignUpSendEmail,
  afterSignInSendEmail: AfterSignInSendEmail,
  signInWithPassword: SignInWithPassword,
  sendEmail: SendEmail,
};

export function AuthModal() {
  const t = useI18n();
  const [authAtomValue, setAuthAtom] = useAtom(authAtom);
  const authService = useService(AuthService);
  const setOpen = useCallback(
    (open: boolean) => {
      setAuthAtom(prev => ({ ...prev, openModal: open }));
    },
    [setAuthAtom]
  );

  const signIn = useAsyncCallback(
    async ({
      method,
      payload,
    }: {
      method: 'magic-link' | 'oauth';
      payload: any;
    }) => {
      if (!(await apis?.ui.isActiveTab())) {
        return;
      }
      try {
        switch (method) {
          case 'magic-link': {
            const { email, token } = payload;
            await authService.signInMagicLink(email, token);
            break;
          }
          case 'oauth': {
            const { code, state, provider } = payload;
            await authService.signInOauth(code, state, provider);
            break;
          }
        }
        authService.session.revalidate();
      } catch (e) {
        notify.error({
          title: t['com.affine.auth.toast.title.failed'](),
          message: (e as any).message,
        });
      }
    },
    [authService, t]
  );

  useEffect(() => {
    return events?.ui.onAuthenticationRequest(signIn);
  }, [signIn]);

  return (
    <AuthModalBase open={authAtomValue.openModal} setOpen={setOpen}>
      <AuthPanel />
    </AuthModalBase>
  );
}

export function AuthPanel({ onSkip }: { onSkip?: () => void }) {
  const t = useI18n();
  const [authAtomValue, setAuthAtom] = useAtom(authAtom);
  const authService = useService(AuthService);
  const loginStatus = useLiveData(authService.session.status$);
  const previousLoginStatus = useRef(loginStatus);

  const setAuthData = useCallback(
    (updates: Partial<AuthAtomData>) => {
      // @ts-expect-error checked in impls
      setAuthAtom(prev => ({
        ...prev,
        ...updates,
      }));
    },
    [setAuthAtom]
  );

  useEffect(() => {
    if (
      loginStatus === 'authenticated' &&
      previousLoginStatus.current === 'unauthenticated'
    ) {
      setAuthAtom({
        openModal: false,
        state: 'signIn',
      });
      notify.success({
        title: t['com.affine.auth.toast.title.signed-in'](),
        message: t['com.affine.auth.toast.message.signed-in'](),
      });
    }
    previousLoginStatus.current = loginStatus;
  }, [loginStatus, setAuthAtom, t]);

  const CurrentPanel = config[authAtomValue.state];

  const props = {
    ...authAtomValue,
    onSkip,
    setAuthData,
  };

  // @ts-expect-error checked in impls
  return <CurrentPanel {...props} />;
}
