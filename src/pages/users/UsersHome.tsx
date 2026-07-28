import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextInput } from '../../components/Form';

const UsersHome: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');

  const onLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim();
    if (id) navigate(`/users/${encodeURIComponent(id)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-600">Create a user, or look one up by ID.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Create a user</h2>
        <Link
          to="/users/new"
          className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          New User
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Look up a user</h2>
        <form onSubmit={onLookup} className="flex items-end gap-3">
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
            className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            Look up
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsersHome;
