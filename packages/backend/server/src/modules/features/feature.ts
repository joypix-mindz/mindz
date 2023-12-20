import { PrismaService } from '../../prisma';
import { Feature, FeatureSchema, FeatureType } from './types';

class FeatureConfig {
  readonly config: Feature;

  constructor(data: any) {
    const config = FeatureSchema.safeParse(data);
    if (config.success) {
      this.config = config.data;
    } else {
      throw new Error(`Invalid quota config: ${config.error.message}`);
    }
  }

  /// feature name of quota
  get name() {
    return this.config.feature;
  }
}

export class EarlyAccessFeatureConfig extends FeatureConfig {
  constructor(data: any) {
    super(data);

    if (this.config.feature !== FeatureType.EarlyAccess) {
      throw new Error('Invalid feature config: type is not EarlyAccess');
    }
  }

  checkWhiteList(email: string) {
    for (const domain in this.config.configs.whitelist) {
      if (email.endsWith(domain)) {
        return true;
      }
    }
    return false;
  }
}

const FeatureConfigMap = {
  [FeatureType.EarlyAccess]: EarlyAccessFeatureConfig,
};

const FeatureCache = new Map<
  number,
  InstanceType<(typeof FeatureConfigMap)[FeatureType]>
>();

export async function getFeature(prisma: PrismaService, featureId: number) {
  const cachedQuota = FeatureCache.get(featureId);

  if (cachedQuota) {
    return cachedQuota;
  }

  const feature = await prisma.features.findFirst({
    where: {
      id: featureId,
    },
  });
  if (!feature) {
    // this should unreachable
    throw new Error(`Quota config ${featureId} not found`);
  }
  const ConfigClass = FeatureConfigMap[feature.feature as FeatureType];

  if (!ConfigClass) {
    throw new Error(`Feature config ${featureId} not found`);
  }

  const config = new ConfigClass(feature);
  // we always edit quota config as a new quota config
  // so we can cache it by featureId
  FeatureCache.set(featureId, config);

  return config;
}
