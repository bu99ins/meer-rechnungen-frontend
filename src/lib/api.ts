import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { clearSession, getAccessToken, getRefreshToken, setSession } from './session';
import { decideAfterRefresh, decideOnUnauthorized } from './refreshDecision.js';
import type { RefreshOutcome } from './refreshDecision';
import type { LoginResponse } from '../types/user';

let api: AxiosInstance;
let refreshPromise: Promise<RefreshOutcome> | null = null;

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean; _isAuthCall?: boolean };

export const AUTH_CALL_CONFIG: AxiosRequestConfig & { _isAuthCall: true } = { _isAuthCall: true };

async function refreshSession(): Promise<RefreshOutcome> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) return 'rejected';
  try {
    const { data } = await getApi().post<LoginResponse>(
      '/api/users/refresh',
      { token: accessToken, refreshToken },
      AUTH_CALL_CONFIG
    );
    setSession(data.token, data.refreshToken);
    return 'refreshed';
  } catch (e) {
    return isAxiosError(e) && e.response ? 'rejected' : 'unreachable';
  }
}

export function getApi(): AxiosInstance {
  if (!api) {
    api = axios.create({
      baseURL: axios.defaults.baseURL || '',
      headers: { 'Content-Type': 'application/json' },
    });

    api.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    });

    api.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!isAxiosError(error) || error.response?.status !== 401) {
          return Promise.reject(error);
        }

        const originalRequest = error.config as RetriableConfig | undefined;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        const currentToken = getAccessToken();
        const sentToken = originalRequest.headers.get('Authorization') as string | null;
        const action = decideOnUnauthorized({
          isAuthCall: !!originalRequest._isAuthCall,
          alreadyRetried: !!originalRequest._retried,
          hasSession: !!currentToken,
          sentToken,
          currentToken: currentToken ? `Bearer ${currentToken}` : null,
        });

        if (action === 'ignore') {
          return Promise.reject(error);
        }
        if (action === 'end-session') {
          clearSession('ended');
          return Promise.reject(error);
        }

        originalRequest._retried = true;

        if (action === 'replay') {
          return api(originalRequest);
        }

        if (!refreshPromise) {
          refreshPromise = refreshSession().finally(() => {
            refreshPromise = null;
          });
        }
        const outcome = await refreshPromise;

        switch (decideAfterRefresh(outcome)) {
          case 'replay':
            return api(originalRequest);
          case 'end-session':
            clearSession('ended');
            return Promise.reject(error);
          default:
            return Promise.reject(error);
        }
      }
    );
  }
  return api;
}
