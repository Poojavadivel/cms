import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import SettingsActionBar from './SettingsActionBar';
import SettingsToast from './SettingsToast';
import Modal from '../Modal';

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

  const inputClasses = "w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/10 focus:border-[#1162d4] outline-none transition-all text-sm text-slate-700";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5";

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

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={activeDepartment.id ? 'Edit Department' : 'Create Department'}
        icon="corporate_fare"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              onClick={closeModal}
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={saveDepartmentLocally}
              className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
            >
              Save Department
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className={labelClasses}>Department Code *</label>
            <input
              type="text"
              value={activeDepartment.code}
              onChange={(event) =>
                setActiveDepartment((current) => ({ ...current, code: event.target.value.toUpperCase() }))
              }
              placeholder="e.g. CS"
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>Department Name *</label>
            <input
              type="text"
              value={activeDepartment.name}
              onChange={(event) => setActiveDepartment((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Computer Science"
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>Head Of Department</label>
            <input
              type="text"
              value={activeDepartment.hod}
              onChange={(event) => setActiveDepartment((current) => ({ ...current, hod: event.target.value }))}
              placeholder="e.g. Dr. Robert Wilson"
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>Staff Mapped</label>
            <input
              type="number"
              min="0"
              value={activeDepartment.mappedStaff}
              onChange={(event) =>
                setActiveDepartment((current) => ({ ...current, mappedStaff: Number(event.target.value) || 0 }))
              }
              className={inputClasses}
            />
          </div>
        </div>
      </Modal>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
