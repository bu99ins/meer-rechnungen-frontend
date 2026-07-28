import { AUTH_CALL_CONFIG, getApi } from '../lib/api';
import type { LoginResponse, LookedUpUser, Role } from '../types/user';

const base = '/api/users';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const api = getApi();
  const { data } = await api.post(`${base}/login`, { email, password }, AUTH_CALL_CONFIG);
  return data as LoginResponse;
}

export async function register(email: string, password: string, role: Role): Promise<LookedUpUser> {
  const api = getApi();
  const { data } = await api.post(`${base}/register`, { email, password, role });
  return data as LookedUpUser;
}

export async function getUserById(userId: string): Promise<LookedUpUser> {
  const api = getApi();
  const { data } = await api.get(`${base}/${encodeURIComponent(userId)}`);
  return data as LookedUpUser;
}

export async function updateUserEmail(userId: string, email: string): Promise<LookedUpUser> {
  const api = getApi();
  const { data } = await api.put(`${base}/${encodeURIComponent(userId)}`, { email });
  return data as LookedUpUser;
}

export async function setUserRole(userId: string, role: Role): Promise<void> {
  const api = getApi();
  await api.post(`${base}/${encodeURIComponent(userId)}/role`, { newRole: role });
}

export async function deleteUser(userId: string): Promise<void> {
  const api = getApi();
  await api.delete(`${base}/${encodeURIComponent(userId)}`);
}
