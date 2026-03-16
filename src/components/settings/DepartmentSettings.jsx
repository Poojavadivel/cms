import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';

const EMPTY_DEPARTMENT = {
  id: null,
  name: '',
  hod: '',
  code: '',
  mappedStaff: 0,
};

export default function DepartmentSettings() {
  const [departments, setDepartments] = useState([]);
  const [baseline, setBaseline] = useState([]);
  const [activeDepartment, setActiveDepartment] = useState(EMPTY_DEPARTMENT);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await settingsApi.getDepartments();
      setDepartments(data);
      setBaseline(data);
    }

    load();
  }, []);

  function openModal(department = EMPTY_DEPARTMENT) {
    setActiveDepartment(department);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActiveDepartment(EMPTY_DEPARTMENT);
  }

  function saveDepartmentLocally() {
    if (!activeDepartment.name.trim()) {
      setToast({ type: 'error', message: 'Department name is required.' });
      return;
    }

    setDepartments((current) => {
      if (activeDepartment.id) {
        return current.map((entry) => (entry.id === activeDepartment.id ? activeDepartment : entry));
      }

      return [
        ...current,
        {
          ...activeDepartment,
          id: Date.now(),
        },
      ];
    });

    closeModal();
  }

  async function handleSave() {
    setSaving(true);
    await settingsApi.replaceDepartments(departments);
    setBaseline(departments);
    setToast({ type: 'success', message: 'Department settings saved.' });
    setSaving(false);
  }

  function handleReset() {
    setDepartments(baseline);
    setToast({ type: 'success', message: 'Department settings reset to last saved state.' });
  }

  return (
    <section className="settings-card-grid">
      <article className="settings-card">
        <div className="settings-card-head">
          <div>
            <h3>Department Management</h3>
            <p>Create departments, assign HODs, and manage staff mapping.</p>
          </div>
          <button type="button" className="settings-btn settings-btn-primary" onClick={() => openModal()}>
            Add Department
          </button>
        </div>

        <div className="settings-table-wrap">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department</th>
                <th>HOD</th>
                <th>Mapped Staff</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.code}</td>
                  <td>{entry.name}</td>
                  <td>{entry.hod}</td>
                  <td>{entry.mappedStaff}</td>
                  <td>
                    <div className="settings-table-actions">
                      <button type="button" onClick={() => openModal(entry)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setToast({ type: 'success', message: `Staff mapping updated for ${entry.code}.` })
                        }
                      >
                        Staff Mapping
                      </button>
                    </div>
                  </td>
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
            <h3>{activeDepartment.id ? 'Edit Department' : 'Create Department'}</h3>
            <div className="settings-form-grid compact">
              <label>
                Department Code
                <input
                  type="text"
                  value={activeDepartment.code}
                  onChange={(event) =>
                    setActiveDepartment((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                  }
                />
              </label>

              <label>
                Department Name
                <input
                  type="text"
                  value={activeDepartment.name}
                  onChange={(event) => setActiveDepartment((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label>
                Head Of Department
                <input
                  type="text"
                  value={activeDepartment.hod}
                  onChange={(event) => setActiveDepartment((current) => ({ ...current, hod: event.target.value }))}
                />
              </label>

              <label>
                Staff Mapped
                <input
                  type="number"
                  min="0"
                  value={activeDepartment.mappedStaff}
                  onChange={(event) =>
                    setActiveDepartment((current) => ({ ...current, mappedStaff: Number(event.target.value) || 0 }))
                  }
                />
              </label>
            </div>

            <div className="settings-actions">
              <button type="button" className="settings-btn settings-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="settings-btn settings-btn-primary" onClick={saveDepartmentLocally}>
                Save Department
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
