import { decodeJwtPayload } from './jwt.js';
import type { Identity, Role } from '../types/user';

const ACCESS_TOKEN_KEY = 'mvr.accessToken';
const REFRESH_TOKEN_KEY = 'mvr.refreshToken';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function isRole(value: unknown): value is Role {
  return value === 'Admin' || value === 'Manager';
}

export function getIdentity(): Identity | null {
  const token = getAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const id = payload?.userid;
  const email = payload?.sub;
  const role = payload?.role;
  if (typeof id !== 'string' || typeof email !== 'string' || !isRole(role)) return null;
  return { id, email, role };
}

export type SessionEndedReason = 'ended';

let sessionEndedReason: SessionEndedReason | null = null;

export function getSessionEndedReason(): SessionEndedReason | null {
  return sessionEndedReason;
}

export function setSession(accessToken: string, refreshToken: string): void {
  sessionEndedReason = null;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  notify();
}

export function clearSession(reason?: SessionEndedReason): void {
  sessionEndedReason = reason ?? null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notify();
}
