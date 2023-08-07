import type { BuildFlags } from '@affine/cli/config';

export function computeCacheKey(buildFlags: BuildFlags) {
  return [
    '1',
    'node' + process.version,
    buildFlags.mode,
    buildFlags.distribution,
    buildFlags.channel,
    ...(process.env.LOCAL_BLOCK_SUITE ? [process.env.LOCAL_BLOCK_SUITE] : []),
  ].join('-');
}
