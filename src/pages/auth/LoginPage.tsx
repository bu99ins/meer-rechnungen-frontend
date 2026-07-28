import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { TextInput } from '../../components/Form';
import { useAuthStore } from '../../store/authStore';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const identity = useAuthStore((s) => s.identity);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const sessionEndedReason = useAuthStore((s) => s.sessionEndedReason);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/invoices';

  if (identity) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const message = error ?? (sessionEndedReason === 'ended' ? 'Your session ended. Please sign in again.' : undefined);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Meer von Rechnungen</h1>
          <p className="text-sm text-gray-600">Sign in to continue.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput
            id="email"
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextInput
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {message && <p className="text-sm text-red-600">{message}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
