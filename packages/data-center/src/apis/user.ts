import { client } from './request.js';

export interface GetUserByEmailParams {
  email: string;
  workspace_id: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  create_at: string;
}

export async function getUserByEmail(
  params: GetUserByEmailParams
): Promise<User | null> {
  const searchParams = new URLSearchParams({ ...params });
  return client.get('api/user', { searchParams }).json<User | null>();
}
