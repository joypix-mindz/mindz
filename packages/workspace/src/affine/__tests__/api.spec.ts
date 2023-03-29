/**
 * @vitest-environment happy-dom
 */
import 'fake-indexeddb/auto';

import { readFile } from 'node:fs/promises';

import { MessageCode } from '@affine/env/constant';
import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';
import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  createWorkspaceApis,
  createWorkspaceResponseSchema,
  RequestError,
} from '../api';
import {
  createAffineAuth,
  getLoginStorage,
  loginResponseSchema,
  setLoginStorage,
} from '../login';

let workspaceApis: ReturnType<typeof createWorkspaceApis>;
let affineAuth: ReturnType<typeof createAffineAuth>;

const mockUser = {
  name: faker.name.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
};

beforeEach(() => {
  // create a new user for each test, so that each test can be run independently
  mockUser.name = faker.name.fullName();
  mockUser.email = faker.internet.email();
  mockUser.password = faker.internet.password();
});

beforeEach(() => {
  affineAuth = createAffineAuth('http://localhost:3000/');
  workspaceApis = createWorkspaceApis('http://localhost:3000/');
});

beforeEach(async () => {
  const data = await fetch('http://localhost:3000/api/user/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'DebugCreateUser',
      ...mockUser,
    }),
  }).then(r => r.json());
  setLoginStorage(data);
  loginResponseSchema.parse(data);
});

declare global {
  interface DocumentEventMap {
    'affine-error': CustomEvent<{
      code: MessageCode;
    }>;
  }
}

async function createWorkspace(
  workspaceApi: typeof workspaceApis
): Promise<string> {
  const workspace = new Workspace({
    id: faker.datatype.uuid(),
  });
  const binary = Workspace.Y.encodeStateAsUpdate(workspace.doc);
  const data = await workspaceApi.createWorkspace(new Blob([binary]));
  createWorkspaceResponseSchema.parse(data);
  return data.id;
}

describe('api', () => {
  test('failed', async () => {
    workspaceApis = createWorkspaceApis('http://localhost:10086/404/');
    const listener = vi.fn(
      (
        e: CustomEvent<{
          code: MessageCode;
        }>
      ) => {
        expect(e.detail.code).toBe(MessageCode.loadListFailed);
      }
    );

    document.addEventListener('affine-error', listener);
    expect(listener).toBeCalledTimes(0);
    await workspaceApis.getWorkspaces().catch(e => {
      expect(e).toBeInstanceOf(RequestError);
    });
    expect(listener).toBeCalledTimes(1);
    document.removeEventListener('affine-error', listener);
  });

  test('blob too large', async () => {
    let called = false;
    try {
      await workspaceApis.uploadBlob(
        'test',
        new ArrayBuffer(1024 * 1024 * 1024 + 1),
        'image/png'
      );
    } catch (e) {
      called = true;
      expect(e).toBeInstanceOf(RequestError);
    }
    expect(called, 'throw error').toBe(true);
  });

  test('refresh token', async () => {
    const storage = getLoginStorage();
    assertExists(storage);
    loginResponseSchema.parse(await affineAuth.refreshToken(storage));
  });

  test(
    'create workspace',
    async () => {
      const id = await createWorkspace(workspaceApis);
      expect(id).toBeTypeOf('string');
    },
    {
      timeout: 30000,
    }
  );

  test(
    'delete workspace',
    async () => {
      const id = await createWorkspace(workspaceApis);
      const response = await workspaceApis.deleteWorkspace({
        id,
      });
      expect(response).toBe(true);
    },
    {
      timeout: 30000,
    }
  );

  test('get workspaces', async () => {
    const id = await createWorkspace(workspaceApis);
    const response = await workspaceApis.getWorkspaces();
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1);
    expect(response[0].id).toBe(id);
  });

  test(
    'blob',
    async () => {
      const workspace = new Workspace({
        id: 'test',
      });
      const path = require.resolve('@affine-test/fixtures/smile.png');
      const imageBuffer = await readFile(path);
      const binary = Workspace.Y.encodeStateAsUpdate(workspace.doc);
      const data = await workspaceApis.createWorkspace(new Blob([binary]));
      createWorkspaceResponseSchema.parse(data);
      const blobId = await workspaceApis.uploadBlob(
        data.id,
        imageBuffer,
        'image/png'
      );
      expect(blobId).toBeTypeOf('string');
      const arrayBuffer = await workspaceApis.getBlob(blobId);
      expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
      expect(arrayBuffer.byteLength).toEqual(imageBuffer.byteLength);
      expect(Buffer.from(arrayBuffer)).toEqual(imageBuffer);
    },
    {
      timeout: 30000,
    }
  );

  test(
    'workspace binary',
    async () => {
      const id = await createWorkspace(workspaceApis);
      await workspaceApis.updateWorkspace({
        id,
        public: true,
      });
      const binary = await workspaceApis.downloadWorkspace(id, false);
      const publicBinary = await workspaceApis.downloadWorkspace(id, true);
      expect(binary).toBeInstanceOf(ArrayBuffer);
      expect(publicBinary).toBeInstanceOf(ArrayBuffer);
      expect(binary.byteLength).toEqual(publicBinary.byteLength);
    },
    {
      timeout: 30000,
    }
  );
});
