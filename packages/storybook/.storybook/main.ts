import { runCli } from '@magic-works/i18n-codegen';
import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

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
  staticDirs: ['../../../apps/web/public'],
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
  async viteFinal(config, { configType }) {
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
      },
      resolve: {
        alias: {
          'dotenv/config': fileURLToPath(
            new URL('../../../scripts/vitest/dotenv-config.ts', import.meta.url)
          ),
          'next/config': fileURLToPath(
            new URL(
              '../../../scripts/vitest/next-config-mock.ts',
              import.meta.url
            )
          ),
        },
      },
    });
  },
} as StorybookConfig;
