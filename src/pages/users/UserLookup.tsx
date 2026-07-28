import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SelectInput, TextInput } from '../../components/Form';
import { deleteUser, getUserById, setUserRole, updateUserEmail } from '../../services/users';
import { describeApiError } from '../../lib/problem';
import { useAuthStore } from '../../store/authStore';
import { ROLES, isRole } from '../../types/user';
import type { LookedUpUser, Role } from '../../types/user';

const UserLookup: React.FC = () => {
  const { userId } = useParams();
  const currentIdentity = useAuthStore((s) => s.identity);

  const [user, setUser] = useState<LookedUpUser>();
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string>();
  const [deleted, setDeleted] = useState(false);

  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [emailSaved, setEmailSaved] = useState(false);

  const [role, setRole] = useState<Role | ''>('');
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string>();
  const [roleSaved, setRoleSaved] = useState<Role>();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(undefined);
    setUser(undefined);
    setDeleted(false);
    setEmailError(undefined);
    setEmailSaved(false);
    setRole('');
    setRoleError(undefined);
    setRoleSaved(undefined);
    setDeleteError(undefined);
    getUserById(userId)
      .then((u) => {
        setUser(u);
        setEmail(u.email);
      })
      .catch((e) => setError(describeApiError(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Loading label="Looking up user..." />;

  const isSelf = !currentIdentity || (!!user && user.id === currentIdentity.id);

  const onSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email || email === user.email) return;
    setSavingEmail(true);
    setEmailError(undefined);
    setEmailSaved(false);
    try {
      const updated = await updateUserEmail(user.id, email);
      setUser(updated);
      setEmail(updated.email);
      setEmailSaved(true);
    } catch (err) {
      setEmailError(describeApiError(err));
    } finally {
      setSavingEmail(false);
    }
  };

  const onSetRole = async () => {
    if (!user || !isRole(role)) return;
    setSavingRole(true);
    setRoleError(undefined);
    setRoleSaved(undefined);
    try {
      await setUserRole(user.id, role);
      setRoleSaved(role);
    } catch (err) {
      setRoleError(describeApiError(err));
    } finally {
      setSavingRole(false);
    }
  };

  const onDelete = async () => {
    if (!user || deleting) return;
    setConfirmingDelete(false);
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteUser(user.id);
      setDeleted(true);
    } catch (err) {
      setDeleteError(describeApiError(err));
    } finally {
      setDeleting(false);
    }
  };

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

      {deleted && (
        <div className="space-y-3">
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700">
            User deleted.
          </div>
          <Link to="/users" className="text-sm text-indigo-600 hover:text-indigo-700">
            Back to Users
          </Link>
        </div>
      )}

      {user && !deleted && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-12 py-1">
              <div className="col-span-3 text-sm text-gray-500">ID</div>
              <div className="col-span-9 text-sm text-gray-900 break-all">{user.id}</div>
            </div>
            <p className="text-xs text-gray-500">
              The API does not return this user's current role, so it is not shown here.
            </p>
          </div>

          <form onSubmit={onSaveEmail} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium text-gray-900">Email</h2>
            <div className="flex items-end gap-3">
              <TextInput
                id="email"
                label="Email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailSaved(false);
                  setEmailError(undefined);
                }}
                className="flex-1"
                required
              />
              <button
                type="submit"
                disabled={savingEmail || !email || email === user.email}
                className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingEmail ? 'Saving...' : 'Save Email'}
              </button>
            </div>
            {isSelf && (
              <p className="text-xs text-gray-500">
                This is your own account: the header will keep showing your old email until you sign
                in again.
              </p>
            )}
            {emailSaved && <p className="text-sm text-green-600">Email updated.</p>}
            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          </form>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium text-gray-900">Role</h2>
            {isSelf ? (
              <p className="text-sm text-gray-600">
                This is your own account. Changing your own role could lock you out, so it can't be
                done from here.
              </p>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <SelectInput
                    id="role"
                    label="Role"
                    value={role}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRole(isRole(value) ? value : '');
                      setRoleSaved(undefined);
                      setRoleError(undefined);
                    }}
                  >
                    <option value="">Choose a role...</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </SelectInput>
                  <button
                    type="button"
                    onClick={onSetRole}
                    disabled={savingRole || !role}
                    className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingRole ? 'Saving...' : 'Set Role'}
                  </button>
                </div>
                {roleSaved && <p className="text-sm text-green-600">Role updated to {roleSaved}.</p>}
                {roleError && <p className="text-sm text-red-600">{roleError}</p>}
              </>
            )}
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium text-gray-900">Delete account</h2>
            {isSelf ? (
              <p className="text-sm text-gray-600">
                This is your own account. Deleting it would lock you out, so it can't be done from
                here.
              </p>
            ) : (
              <>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="px-3 py-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50 text-sm"
                >
                  Delete User
                </button>
                {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this user?"
        description="This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={onDelete}
      />
    </div>
  );
};

export default UserLookup;
