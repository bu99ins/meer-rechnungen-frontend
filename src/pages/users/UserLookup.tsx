import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import { getUserById } from '../../services/users';
import { describeApiError } from '../../lib/problem';
import type { LookedUpUser } from '../../types/user';

const UserLookup: React.FC = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<LookedUpUser>();
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(undefined);
    setUser(undefined);
    getUserById(userId)
      .then(setUser)
      .catch((e) => setError(describeApiError(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Loading label="Looking up user..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">User</h1>
        <p className="text-sm text-gray-600">Looked up by ID.</p>
      </div>

      {error && (
        <div className="space-y-3">
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          <Link to="/users" className="text-sm text-indigo-600 hover:text-indigo-700">
            Back to Users
          </Link>
        </div>
      )}

      {user && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-12 py-1">
            <div className="col-span-3 text-sm text-gray-500">ID</div>
            <div className="col-span-9 text-sm text-gray-900 break-all">{user.id}</div>
          </div>
          <div className="grid grid-cols-12 py-1">
            <div className="col-span-3 text-sm text-gray-500">Email</div>
            <div className="col-span-9 text-sm text-gray-900">{user.email}</div>
          </div>
          <p className="text-xs text-gray-500">
            The API does not return this user's current role, so it is not shown here.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserLookup;
