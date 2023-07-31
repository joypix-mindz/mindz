import { runCli } from '@magic-works/i18n-codegen';
import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { getRuntimeConfig } from '../../core/.webpack/runtime-config';

runCli(
  {
    config: fileURLToPath(
      new URL('../../../.i18n-codegen.json', import.meta.url)
    ),
    watch: false,
  },
  error => {
    console.error(error);
    process.exit(1);
  }
);

export default {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['../../../apps/core/public'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-storysource',
    'storybook-dark-mode',
  ],
  framework: {
    name: '@storybook/react-vite',
  },
  async viteFinal(config, _) {
    return mergeConfig(config, {
      assetsInclude: ['**/*.md'],
      plugins: [
        vanillaExtractPlugin(),
        tsconfigPaths({
          root: fileURLToPath(new URL('../../../', import.meta.url)),
        }),
      ],
      define: {
        'process.env': {},
        runtimeConfig: getRuntimeConfig({
          distribution: 'browser',
          mode: 'development',
          channel: 'canary',
          coverage: false,
        }),
      },
    });
  },
} as StorybookConfig;
