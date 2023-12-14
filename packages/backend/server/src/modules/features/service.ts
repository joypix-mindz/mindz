import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma';
import { UserType } from '../users/types';
import { getFeature } from './feature';
import { FeatureKind, FeatureType } from './types';

@Injectable()
export class FeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeaturesVersion() {
    const features = await this.prisma.features.findMany({
      where: {
        type: FeatureKind.Feature,
      },
      select: {
        feature: true,
        version: true,
      },
    });
    return features.reduce(
      (acc, feature) => {
        acc[feature.feature] = feature.version;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  async getFeature(feature: FeatureType) {
    const data = await this.prisma.features.findFirst({
      where: {
        feature,
        type: FeatureKind.Feature,
      },
      select: { id: true },
      orderBy: {
        version: 'desc',
      },
    });
    if (data) {
      return getFeature(this.prisma, data.id);
    }
    return undefined;
  }

  async addUserFeature(
    userId: string,
    feature: FeatureType,
    version: number,
    reason: string,
    expiredAt?: Date | string
  ) {
    return this.prisma.$transaction(async tx => {
      const latestFlag = await tx.userFeatures.findFirst({
        where: {
          userId,
          feature: {
            feature,
            type: FeatureKind.Feature,
          },
          activated: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (latestFlag) {
        return latestFlag.id;
      } else {
        return tx.userFeatures
          .create({
            data: {
              reason,
              expiredAt,
              activated: true,
              user: {
                connect: {
                  id: userId,
                },
              },
              feature: {
                connect: {
                  feature_version: {
                    feature,
                    version,
                  },
                  type: FeatureKind.Feature,
                },
              },
            },
          })
          .then(r => r.id);
      }
    });
  }

  async removeUserFeature(userId: string, feature: FeatureType) {
    return this.prisma.userFeatures
      .updateMany({
        where: {
          userId,
          feature: {
            feature,
            type: FeatureKind.Feature,
          },
          activated: true,
        },
        data: {
          activated: false,
        },
      })
      .then(r => r.count);
  }

  async getUserFeatures(userId: string) {
    const features = await this.prisma.userFeatures.findMany({
      where: {
        user: { id: userId },
        feature: {
          type: FeatureKind.Feature,
        },
      },
      select: {
        activated: true,
        reason: true,
        createdAt: true,
        expiredAt: true,
        featureId: true,
      },
    });

    const configs = await Promise.all(
      features.map(async feature => ({
        ...feature,
        feature: await getFeature(this.prisma, feature.featureId),
      }))
    );

    return configs.filter(feature => !!feature.feature);
  }

  async listFeatureUsers(feature: FeatureType): Promise<UserType[]> {
    return this.prisma.userFeatures
      .findMany({
        where: {
          activated: true,
          feature: {
            feature: feature,
            type: FeatureKind.Feature,
          },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              email: true,
              emailVerified: true,
              createdAt: true,
            },
          },
        },
      })
      .then(users => users.map(user => user.user));
  }

  async hasFeature(userId: string, feature: FeatureType) {
    return this.prisma.userFeatures
      .count({
        where: {
          userId,
          activated: true,
          feature: {
            feature,
            type: FeatureKind.Feature,
          },
        },
      })
      .then(count => count > 0);
  }
}
