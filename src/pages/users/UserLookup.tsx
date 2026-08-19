import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import ConfirmDialog from '../../components/ConfirmDialog';
import { RequiredLegend, SelectInput, TextInput } from '../../components/Form';
import { deleteUser, getUserById, resetPassword, setUserRole, updateUserEmail } from '../../services/users';
import { describeApiError } from '../../lib/problem';
import { useAuthStore } from '../../store/authStore';
import { ROLES, isRole } from '../../types/user';
import type { LookedUpUser, Role } from '../../types/user';

const PASSWORD_RULES =
  'At least 8 characters, with an uppercase letter, a lowercase letter, a digit, and a non-alphanumeric character.';

const UserLookup: React.FC = () => {
  const { userId } = useParams();
  const currentIdentity = useAuthStore((s) => s.identity);
  const logout = useAuthStore((s) => s.logout);

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

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();
  const [passwordSaved, setPasswordSaved] = useState(false);

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
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(undefined);
    setPasswordSaved(false);
    getUserById(userId)
      .then((u) => {
        setUser(u);
        setEmail(u.email);
        setRole(u.role ?? '');
      })
      .catch((e) => setError(describeApiError(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Loading label="Looking up user..." />;

  const identityUnknown = !currentIdentity;
  const isSelf = !!currentIdentity && !!user && user.id === currentIdentity.id;
  const hideSelfActions = identityUnknown || isSelf;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const onSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email || email === user.email) return;
    setSavingEmail(true);
    setEmailError(undefined);
    setEmailSaved(false);
    try {
      const updated = await updateUserEmail(user.id, email);
      setUser((prev) => (prev ? { ...prev, email: updated.email } : prev));
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
      setUser((prev) => (prev ? { ...prev, role } : prev));
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

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !passwordsMatch) return;
    setSavingPassword(true);
    setPasswordError(undefined);
    setPasswordSaved(false);
    try {
      await resetPassword(user.id, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      if (isSelf) {
        // Resetting your own password revokes your own refresh token server-side, so the
        // current session is already half-dead: sign out now rather than let it fail later
        // as a confusing "session ended" surprise.
        logout('password-changed');
      }
    } catch (err) {
      setPasswordError(describeApiError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">User</h1>
        <p className="text-sm text-brand-gray">Looked up by ID or email.</p>
      </div>

      {error && (
        <div className="space-y-3">
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          <Link to="/users" className="text-sm text-brand-deep hover:text-brand-deep-dark">
            Back to Users
          </Link>
        </div>
      )}

      {deleted && (
        <div className="space-y-3">
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700">
            User deleted.
          </div>
          <Link to="/users" className="text-sm text-brand-deep hover:text-brand-deep-dark">
            Back to Users
          </Link>
        </div>
      )}

      {user && !deleted && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-12 py-1">
              <div className="col-span-3 text-sm text-brand-gray">ID</div>
              <div className="col-span-9 text-sm text-gray-900 break-all">{user.id}</div>
            </div>
            <div className="grid grid-cols-12 py-1">
              <div className="col-span-3 text-sm text-brand-gray">Role</div>
              <div className="col-span-9 text-sm text-gray-900">{user.role ?? '(none assigned)'}</div>
            </div>
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
                className="px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark disabled:opacity-50"
              >
                {savingEmail ? 'Saving...' : 'Save Email'}
              </button>
            </div>
            <RequiredLegend />
            {hideSelfActions && (
              <p className="text-xs text-brand-gray">
                This is your own account: the header will keep showing your old email until you sign
                in again.
              </p>
            )}
            {emailSaved && <p className="text-sm text-green-600">Email updated.</p>}
            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          </form>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium text-gray-900">Role</h2>
            {hideSelfActions ? (
              <p className="text-sm text-brand-gray">
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
                    className="px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark disabled:opacity-50"
                  >
                    {savingRole ? 'Saving...' : 'Set Role'}
                  </button>
                </div>
                {roleSaved && <p className="text-sm text-green-600">Role updated to {roleSaved}.</p>}
                {roleError && <p className="text-sm text-red-600">{roleError}</p>}
              </>
            )}
          </div>

          <form onSubmit={onSetPassword} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium text-gray-900">Password</h2>
            <p className="text-xs text-brand-gray">{PASSWORD_RULES}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                id="newPassword"
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordSaved(false);
                  setPasswordError(undefined);
                }}
              />
              <TextInput
                id="confirmPassword"
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordSaved(false);
                  setPasswordError(undefined);
                }}
                error={passwordMismatch ? "Passwords don't match." : undefined}
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword || !passwordsMatch}
              className="px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark disabled:opacity-50"
            >
              {savingPassword ? 'Saving...' : 'Set Password'}
            </button>
            {hideSelfActions && (
              <p className="text-xs text-brand-gray">
                This is your own account: setting a new password signs you out immediately, since it
                ends your current session too.
              </p>
            )}
            {passwordSaved && <p className="text-sm text-green-600">Password updated.</p>}
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          </form>

          <div className="bg-white border border-red-200 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-medium text-gray-900">Delete account</h2>
            {hideSelfActions ? (
              <p className="text-sm text-brand-gray">
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
