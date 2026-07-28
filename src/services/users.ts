import { getApi } from '../lib/api';
import type { LoginResponse } from '../types/user';

const base = '/api/users';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const api = getApi();
  const { data } = await api.post(`${base}/login`, { email, password });
  return data as LoginResponse;
}
