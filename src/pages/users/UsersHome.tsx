import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextInput } from '../../components/Form';
import { getUserIdByEmail } from '../../services/users';
import { describeApiError } from '../../lib/problem';

const UsersHome: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');

  const [emailQuery, setEmailQuery] = useState('');
  const [lookingUpByEmail, setLookingUpByEmail] = useState(false);
  const [emailLookupError, setEmailLookupError] = useState<string>();

  const onLookupById = (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim();
    if (id) navigate(`/users/${encodeURIComponent(id)}`);
  };

  const onLookupByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailQuery.trim();
    if (!email) return;
    setLookingUpByEmail(true);
    setEmailLookupError(undefined);
    try {
      const id = await getUserIdByEmail(email);
      navigate(`/users/${encodeURIComponent(id)}`);
    } catch (err) {
      setEmailLookupError(describeApiError(err));
    } finally {
      setLookingUpByEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-brand-gray">Create a user, or look one up by ID or email.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Create a user</h2>
        <Link
          to="/users/new"
          className="inline-flex items-center px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark"
        >
          New User
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Look up a user by ID</h2>
        <form onSubmit={onLookupById} className="flex items-end gap-3">
          <TextInput
            id="userId"
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!userId.trim()}
            className="px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark disabled:opacity-50"
          >
            Look up
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Look up a user by email</h2>
        <form onSubmit={onLookupByEmail} className="flex items-end gap-3">
          <TextInput
            id="emailQuery"
            label="Email"
            type="email"
            value={emailQuery}
            onChange={(e) => {
              setEmailQuery(e.target.value);
              setEmailLookupError(undefined);
            }}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!emailQuery.trim() || lookingUpByEmail}
            className="px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark disabled:opacity-50"
          >
            {lookingUpByEmail ? 'Looking up...' : 'Look up'}
          </button>
        </form>
        {emailLookupError && <p className="text-sm text-red-600">{emailLookupError}</p>}
      </div>
    </div>
  );
};

export default UsersHome;
