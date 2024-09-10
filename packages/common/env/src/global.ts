/// <reference types="@blocksuite/global" />
import { assertEquals } from '@blocksuite/global/utils';
import { z } from 'zod';

import { isElectron } from './constant.js';
import { UaHelper } from './ua-helper.js';

export const runtimeFlagsSchema = z.object({
  // this is for the electron app
  serverUrlPrefix: z.string(),
  appVersion: z.string(),
  editorVersion: z.string(),
  distribution: z.enum(['web', 'desktop', 'admin', 'mobile']),
  appBuildType: z.union([
    z.literal('stable'),
    z.literal('beta'),
    z.literal('internal'),
    z.literal('canary'),
  ]),
  isSelfHosted: z.boolean().optional(),
  githubUrl: z.string(),
  changelogUrl: z.string(),
  downloadUrl: z.string(),
  // see: tools/workers
  imageProxyUrl: z.string(),
  linkPreviewUrl: z.string(),
  allowLocalWorkspace: z.boolean(),
  enablePreloading: z.boolean(),
  enableNewSettingUnstableApi: z.boolean(),
  enableEnhanceShareMode: z.boolean(),
  enableExperimentalFeature: z.boolean(),
  enableInfoModal: z.boolean(),
  enableOrganize: z.boolean(),
  enableThemeEditor: z.boolean(),
});

export type RuntimeConfig = z.infer<typeof runtimeFlagsSchema>;

export type Environment = {
  isDebug: boolean;

  // Edition
  isDesktopEdition: boolean;
  isMobileEdition: boolean;

  // Platform/Entry
  isElectron: boolean;
  isDesktopWeb: boolean;
  isMobileWeb: boolean;

  // Device
  isLinux: boolean;
  isMacOs: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isWindows: boolean;
  isFireFox: boolean;
  isMobile: boolean;
  isChrome: boolean;
  chromeVersion?: number;
};

function setupRuntimeConfig() {
  if (!process.env.RUNTIME_CONFIG) {
    return;
  }

  // registered by [webpack.DefinePlugin]
  const runtimeConfig = JSON.parse(process.env.RUNTIME_CONFIG ?? '');
  runtimeFlagsSchema.parse(runtimeConfig);
  globalThis.runtimeConfig = runtimeConfig;
}

export function setupGlobal() {
  if (globalThis.$AFFINE_SETUP) {
    return;
  }

  setupRuntimeConfig();

  let environment: Environment;
  const isDebug = process.env.NODE_ENV === 'development';

  if (!globalThis.navigator) {
    environment = {
      isDesktopEdition: false,
      isMobileEdition: false,
      isElectron: false,
      isDesktopWeb: false,
      isMobileWeb: false,
      isMobile: false,
      isDebug,
      isLinux: false,
      isMacOs: false,
      isSafari: false,
      isWindows: false,
      isFireFox: false,
      isChrome: false,
      isIOS: false,
    };
  } else {
    const uaHelper = new UaHelper(globalThis.navigator);

    environment = {
      isDesktopEdition: runtimeConfig.distribution !== 'mobile',
      isMobileEdition: runtimeConfig.distribution === 'mobile',
      isDesktopWeb: runtimeConfig.distribution === 'web',
      isMobileWeb: runtimeConfig.distribution === 'mobile',
      isElectron,
      isDebug,
      isMobile: uaHelper.isMobile,
      isLinux: uaHelper.isLinux,
      isMacOs: uaHelper.isMacOs,
      isSafari: uaHelper.isSafari,
      isWindows: uaHelper.isWindows,
      isFireFox: uaHelper.isFireFox,
      isChrome: uaHelper.isChrome,
      isIOS: uaHelper.isIOS,
    };
    // Chrome on iOS is still Safari
    if (environment.isChrome && !environment.isIOS) {
      assertEquals(environment.isSafari, false);
      assertEquals(environment.isFireFox, false);
      environment = {
        ...environment,
        isSafari: false,
        isFireFox: false,
        isChrome: true,
        chromeVersion: uaHelper.getChromeVersion(),
      };
    }
  }

  globalThis.environment = environment;

  globalThis.$AFFINE_SETUP = true;
}
