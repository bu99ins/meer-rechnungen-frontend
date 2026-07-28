import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Identity } from '../types/user';
import { clearSession, getIdentity, setSession, subscribe } from '../lib/session';
import { login as loginRequest } from '../services/users';
import { describeApiError } from '../lib/problem';

type State = {
  identity: Identity | null;
  loading: boolean;
  error?: string;
};

type Actions = {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

export const useAuthStore = create<State & Actions>()(
  devtools((set) => ({
    identity: getIdentity(),
    loading: false,
    error: undefined,

    clearError: () => set({ error: undefined }),

    login: async (email: string, password: string) => {
      set({ loading: true, error: undefined });
      try {
        const { token, refreshToken } = await loginRequest(email, password);
        setSession(token, refreshToken);
      } catch (e: unknown) {
        set({ error: describeApiError(e) });
      } finally {
        set({ loading: false });
      }
    },

    logout: () => {
      clearSession();
    },
  }))
);

subscribe(() => useAuthStore.setState({ identity: getIdentity() }, false, 'session/changed'));
