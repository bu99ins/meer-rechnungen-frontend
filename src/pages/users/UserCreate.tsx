import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SelectInput, TextInput } from '../../components/Form';
import { register } from '../../services/users';
import { describeApiError } from '../../lib/problem';
import { ROLES, isRole } from '../../types/user';
import type { Role } from '../../types/user';

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Manager');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [createdId, setCreatedId] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const canSave = !!email && !!password;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(undefined);
    try {
      const created = await register(email, password, role);
      setCreatedId(created.id);
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const onCopy = async () => {
    if (!createdId) return;
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(createdId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  if (createdId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">User created</h1>
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm text-gray-600">New user ID:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm break-all">
              {createdId}
            </code>
            <button
              onClick={onCopy}
              className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {copyError && (
            <p className="text-xs text-red-600">Couldn't copy automatically — select the ID above and copy it manually.</p>
          )}
          <button
            onClick={() => navigate('/users')}
            className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">New User</h1>
          <p className="text-sm text-gray-600">Create an account for a new user.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!canSave || saving}
            type="submit"
            className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          id="email"
          label="Email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <SelectInput
          id="role"
          label="Role"
          value={role}
          onChange={(e) => {
            if (isRole(e.target.value)) setRole(e.target.value);
          }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectInput>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
    </form>
  );
};

export default UserCreate;
