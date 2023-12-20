import { DynamicModule, Type } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SERVER_FLAVOR } from '../config';
import { GqlModule } from '../graphql.module';
import { ServerConfigModule } from './config';
import { DocModule } from './doc';
import { PaymentModule } from './payment';
import { QuotaModule } from './quota';
import { SelfHostedModule } from './self-hosted';
import { SyncModule } from './sync';
import { UsersModule } from './users';
import { WorkspaceModule } from './workspaces';

const BusinessModules: (Type | DynamicModule)[] = [];

switch (SERVER_FLAVOR) {
  case 'sync':
    BusinessModules.push(SyncModule, DocModule);
    break;
  case 'selfhosted':
    BusinessModules.push(
      ServerConfigModule,
      SelfHostedModule,
      ScheduleModule.forRoot(),
      GqlModule,
      WorkspaceModule,
      UsersModule,
      SyncModule,
      DocModule
    );
    break;
  case 'graphql':
    BusinessModules.push(
      ServerConfigModule,
      ScheduleModule.forRoot(),
      GqlModule,
      WorkspaceModule,
      UsersModule,
      DocModule,
      PaymentModule,
      QuotaModule
    );
    break;
  case 'allinone':
  default:
    BusinessModules.push(
      ServerConfigModule,
      ScheduleModule.forRoot(),
      GqlModule,
      WorkspaceModule,
      UsersModule,
      QuotaModule,
      SyncModule,
      DocModule,
      PaymentModule
    );
    break;
}

export { BusinessModules, SERVER_FLAVOR };
