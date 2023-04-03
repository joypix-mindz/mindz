import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';

export default {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['../../../apps/web/public'],
  addons: [
    '@storybook/addon-links',
    'storybook-dark-mode',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
  },
  async viteFinal(config, { configType }) {
    return mergeConfig(config, {
      define: {
        'process.env': {},
      },
      resolve: {
        alias: {
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
