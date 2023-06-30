import { ok } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
// @ts-expect-error graphql-upload is not typed
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import request from 'supertest';

import { AppModule } from '../app';
import type { TokenType } from '../modules/auth';
import type { UserType } from '../modules/users';
import type { WorkspaceType } from '../modules/workspaces';

const gql = '/graphql';

describe('Workspace Module', () => {
  let app: INestApplication;

  // cleanup database before each test
  beforeEach(async () => {
    const client = new PrismaClient();
    await client.$connect();
    await client.user.deleteMany({});
    await client.$disconnect();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.use(
      graphqlUploadExpress({
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 5,
      })
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function registerUser(
    name: string,
    email: string,
    password: string
  ): Promise<UserType & { token: TokenType }> {
    const res = await request(app.getHttpServer())
      .post(gql)
      .send({
        query: `
          mutation {
            register(name: "${name}", email: "${email}", password: "${password}") {
              id, name, email, token { token }
            }
          }
        `,
      })
      .expect(200);
    return res.body.data.register;
  }

  async function createWorkspace(token: string): Promise<WorkspaceType> {
    const res = await request(app.getHttpServer())
      .post(gql)
      .auth(token, { type: 'bearer' })
      .field(
        'operations',
        JSON.stringify({
          name: 'createWorkspace',
          query: `mutation createWorkspace($init: Upload!) {
            createWorkspace(init: $init) {
              id
            }
          }`,
          variables: { init: null },
        })
      )
      .field('map', JSON.stringify({ '0': ['variables.init'] }))
      .attach('0', Buffer.from([0, 0]), 'init.data')
      .expect(200);
    return res.body.data.createWorkspace;
  }

  async function inviteUser(
    token: string,
    workspaceId: string,
    email: string,
    permission: string
  ): Promise<boolean> {
    const res = await request(app.getHttpServer())
      .post(gql)
      .auth(token, { type: 'bearer' })
      .send({
        query: `
          mutation {
            invite(workspaceId: "${workspaceId}", email: "${email}", permission: ${permission})
          }
        `,
      })
      .expect(200);
    return res.body.data.invite;
  }

  async function acceptInvite(
    token: string,
    workspaceId: string
  ): Promise<boolean> {
    const res = await request(app.getHttpServer())
      .post(gql)
      .auth(token, { type: 'bearer' })
      .send({
        query: `
          mutation {
            acceptInvite(workspaceId: "${workspaceId}")
          }
        `,
      })
      .expect(200);
    return res.body.data.acceptInvite;
  }

  async function leaveWorkspace(
    token: string,
    workspaceId: string
  ): Promise<boolean> {
    const res = await request(app.getHttpServer())
      .post(gql)
      .auth(token, { type: 'bearer' })
      .send({
        query: `
          mutation {
            leaveWorkspace(workspaceId: "${workspaceId}")
          }
        `,
      })
      .expect(200);
    return res.body.data.leaveWorkspace;
  }

  async function revokeUser(
    token: string,
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    const res = await request(app.getHttpServer())
      .post(gql)
      .auth(token, { type: 'bearer' })
      .send({
        query: `
          mutation {
            revoke(workspaceId: "${workspaceId}", userId: "${userId}")
          }
        `,
      })
      .expect(200);
    return res.body.data.revoke;
  }

  it('should register a user', async () => {
    const user = await registerUser('u1', 'u1@affine.pro', '123456');
    ok(typeof user.id === 'string', 'user.id is not a string');
    ok(user.name === 'u1', 'user.name is not valid');
    ok(user.email === 'u1@affine.pro', 'user.email is not valid');
  });

  it('should create a workspace', async () => {
    const user = await registerUser('u1', 'u1@affine.pro', '1');

    const workspace = await createWorkspace(user.token.token);
    ok(typeof workspace.id === 'string', 'workspace.id is not a string');
  });

  it('should invite a user', async () => {
    const u1 = await registerUser('u1', 'u1@affine.pro', '1');
    const u2 = await registerUser('u2', 'u2@affine.pro', '1');

    const workspace = await createWorkspace(u1.token.token);

    const invite = await inviteUser(
      u1.token.token,
      workspace.id,
      u2.email,
      'Admin'
    );
    ok(invite === true, 'failed to invite user');
  });

  it('should accept an invite', async () => {
    const u1 = await registerUser('u1', 'u1@affine.pro', '1');
    const u2 = await registerUser('u2', 'u2@affine.pro', '1');

    const workspace = await createWorkspace(u1.token.token);
    await inviteUser(u1.token.token, workspace.id, u2.email, 'Admin');

    const accept = await acceptInvite(u2.token.token, workspace.id);
    ok(accept === true, 'failed to accept invite');
  });

  it('should leave a workspace', async () => {
    const u1 = await registerUser('u1', 'u1@affine.pro', '1');
    const u2 = await registerUser('u2', 'u2@affine.pro', '1');

    const workspace = await createWorkspace(u1.token.token);
    await inviteUser(u1.token.token, workspace.id, u2.email, 'Admin');
    await acceptInvite(u2.token.token, workspace.id);

    const leave = await leaveWorkspace(u2.token.token, workspace.id);
    ok(leave === true, 'failed to leave workspace');
  });

  it('should revoke a user', async () => {
    const u1 = await registerUser('u1', 'u1@affine.pro', '1');
    const u2 = await registerUser('u2', 'u2@affine.pro', '1');

    const workspace = await createWorkspace(u1.token.token);
    await inviteUser(u1.token.token, workspace.id, u2.email, 'Admin');

    const revoke = await revokeUser(u1.token.token, workspace.id, u2.id);
    ok(revoke === true, 'failed to revoke user');
  });
});
