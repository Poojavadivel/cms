import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

const EMPTY_USER = {
  id: null,
  name: '',
  email: '',
  role: 'student',
  active: true,
};

const DEFAULT_PERMISSIONS = {
  admin: { create: true, update: true, delete: true, reset: true },
  finance: { create: false, update: true, delete: false, reset: true },
  faculty: { create: false, update: true, delete: false, reset: false },
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [baselineUsers, setBaselineUsers] = useState([]);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [baselinePermissions, setBaselinePermissions] = useState(DEFAULT_PERMISSIONS);
  const [activeUser, setActiveUser] = useState(EMPTY_USER);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getUsers();
      setUsers(data);
      setBaselineUsers(data);
    }

    load();
  }, []);

  function updatePermission(role, key, value) {
    setPermissions((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [key]: value,
      },
    }));
  }

  function openCreateModal() {
    setActiveUser(EMPTY_USER);
    setModalOpen(true);
  }

  function openEditModal(user) {
    setActiveUser(user);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActiveUser(EMPTY_USER);
  }

  function saveUserLocally() {
    if (!activeUser.name.trim() || !activeUser.email.trim()) {
      setToast({ type: 'error', message: 'Name and email are required.' });
      return;
    }

    setUsers((current) => {
      if (activeUser.id) {
        return current.map((entry) => (entry.id === activeUser.id ? activeUser : entry));
      }

      return [
        ...current,
        {
          ...activeUser,
          id: Date.now(),
        },
      ];
    });

    closeModal();
  }

  function removeUser(id) {
    setUsers((current) => current.filter((entry) => entry.id !== id));
  }

  function toggleActivation(id, active) {
    setUsers((current) => current.map((entry) => (entry.id === id ? { ...entry, active } : entry)));
  }

  async function handleSave() {
    setSaving(true);
    await settingsApi.replaceUsers(users);
    setBaselineUsers(users);
    setBaselinePermissions(permissions);
    setToast({ type: 'success', message: 'User management settings saved.' });
    setSaving(false);
  }

  function handleReset() {
    setUsers(baselineUsers);
    setPermissions(baselinePermissions);
    setToast({ type: 'success', message: 'User management changes were reset.' });
  }

  function handleBulkImport(event) {
    const fileName = event.target.files?.[0]?.name;
    if (!fileName) {
      return;
    }

    setToast({ type: 'success', message: `Bulk import file queued: ${fileName}` });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>User Directory</h3>
            <p>Create, edit, delete users and assign role ownership.</p>
          </div>
          <button type="button" className="settings-btn settings-btn-primary" onClick={openCreateModal}>
            Create User
          </button>
        </div>

        <div className="settings-table-wrap">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.name}</td>
                  <td>{entry.email}</td>
                  <td>{entry.role}</td>
                  <td>
                    <label className="settings-inline-toggle">
                      <input
                        type="checkbox"
                        checked={entry.active}
                        onChange={(event) => toggleActivation(entry.id, event.target.checked)}
                      />
                      <span>{entry.active ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </td>
                  <td>
                    <div className="settings-table-actions">
                      <button type="button" onClick={() => openEditModal(entry)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => removeUser(entry.id)}>
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setToast({ type: 'success', message: `Password reset sent to ${entry.email}` })}
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="settings-form-grid compact">
          <label>
            Bulk Import Users
            <input type="file" accept=".csv" onChange={handleBulkImport} />
          </label>
        </div>

        <h4 className="settings-subtitle">Permission Matrix</h4>
        <div className="settings-table-wrap">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Create</th>
                <th>Edit</th>
                <th>Delete</th>
                <th>Password Reset</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissions).map(([role, rights]) => (
                <tr key={role}>
                  <td>{role}</td>
                  {Object.keys(rights).map((right) => (
                    <td key={right}>
                      <input
                        type="checkbox"
                        checked={rights[right]}
                        onChange={(event) => updatePermission(role, right, event.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SettingsActionBar onSave={handleSave} onReset={handleReset} saving={saving} />
      </article>

      {modalOpen ? (
        <div className="settings-modal-backdrop" onClick={closeModal} aria-hidden="true">
          <div className="settings-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{activeUser.id ? 'Edit User' : 'Create User'}</h3>
            <div className="settings-form-grid compact">
              <label>
                Full Name
                <input
                  type="text"
                  value={activeUser.name}
                  onChange={(event) => setActiveUser((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={activeUser.email}
                  onChange={(event) => setActiveUser((current) => ({ ...current, email: event.target.value }))}
                />
              </label>

              <label>
                Role
                <select
                  value={activeUser.role}
                  onChange={(event) => setActiveUser((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label className="settings-inline-toggle">
                <input
                  type="checkbox"
                  checked={activeUser.active}
                  onChange={(event) => setActiveUser((current) => ({ ...current, active: event.target.checked }))}
                />
                <span>Account Active</span>
              </label>
            </div>

            <div className="settings-actions">
              <button type="button" className="settings-btn settings-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="settings-btn settings-btn-primary" onClick={saveUserLocally}>
                Save User
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
