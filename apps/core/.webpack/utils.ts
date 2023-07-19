import type { BuildFlags } from '@affine/cli/config';

export function computeCacheKey(buildFlags: BuildFlags) {
  return [
    '1',
    'node' + process.version,
    buildFlags.mode,
    buildFlags.distribution,
  ].join('-');
}
