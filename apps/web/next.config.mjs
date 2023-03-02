import path from 'node:path';
import debugLocal from 'next-debug-local';
import preset from './preset.config.mjs';
import { createRequire } from 'node:module';
import { getCommitHash, getGitVersion } from './scripts/gitInfo.mjs';

const require = createRequire(import.meta.url);

console.info('Runtime Preset', preset);

const enableDebugLocal = path.isAbsolute(process.env.LOCAL_BLOCK_SUITE ?? '');

const profileTarget = {
  ac: '100.85.73.88:12001',
  dev: '100.84.105.99:11001',
  test: '100.84.105.99:11001',
  stage: '',
  pro: 'http://pathfinder.affine.pro',
  local: '127.0.0.1:3000',
  rem: 'stage.affine.pro',
};

const getRedirectConfig = profile => {
  const target = profileTarget[profile || 'dev'] || profileTarget['dev'];

  return [
    [
      { source: '/api/:path*', destination: `http://${target}/api/:path*` },
      {
        source: '/collaboration/:path*',
        destination: `http://${target}/collaboration/:path*`,
      },
    ],
    target,
    profile || 'dev',
  ];
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  compiler: {
    removeConsole: {
      exclude: ['error', 'log', 'warn', 'info'],
    },
    emotion: {
      sourceMap: true,
    },
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    swcPlugins: [
      ['@swc-jotai/debug-label', {}],
      // ['@swc-jotai/react-refresh', {}],
    ],
  },
  reactStrictMode: true,
  transpilePackages: [
    '@affine/component',
    '@affine/datacenter',
    '@affine/i18n',
    '@affine/env',
  ],
  publicRuntimeConfig: {
    PROJECT_NAME: process.env.npm_package_name,
    BUILD_DATE: new Date().toISOString(),
    gitVersion: getGitVersion(),
    hash: getCommitHash(),
    serverAPI:
      profileTarget[process.env.NODE_API_SERVER || 'dev'] ?? profileTarget.dev,
    editorVersion: require('./package.json').dependencies['@blocksuite/editor'],
    ...preset,
  },
  webpack: config => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    config.module.rules.push({
      test: /\.md$/i,
      loader: 'raw-loader',
    });

    return config;
  },
  rewrites: async () => {
    const [profile, target, desc] = getRedirectConfig(
      process.env.NODE_API_SERVER
    );
    console.info(`API request proxy to [${desc} Server]: ` + target);
    return profile;
  },
  basePath: process.env.NEXT_BASE_PATH,
};

const baseDir = process.env.LOCAL_BLOCK_SUITE ?? '/';
const withDebugLocal = debugLocal(
  {
    '@blocksuite/editor': path.resolve(baseDir, 'packages', 'editor'),
    '@blocksuite/blocks/models': path.resolve(
      baseDir,
      'packages',
      'blocks',
      'src',
      'models'
    ),
    '@blocksuite/blocks/std': path.resolve(
      baseDir,
      'packages',
      'blocks',
      'src',
      'std'
    ),
    '@blocksuite/blocks': path.resolve(baseDir, 'packages', 'blocks'),
    '@blocksuite/store': path.resolve(baseDir, 'packages', 'store'),
  },
  {
    enable: enableDebugLocal,
  }
);

const detectFirebaseConfig = () => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn('NEXT_PUBLIC_FIREBASE_API_KEY not found, please check it');
  } else {
    console.info('NEXT_PUBLIC_FIREBASE_API_KEY found');
  }
};
detectFirebaseConfig();

export default withDebugLocal(nextConfig);
