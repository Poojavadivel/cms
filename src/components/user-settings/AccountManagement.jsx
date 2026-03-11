import { useEffect, useState } from 'react';
import { userSettingsApi } from '../../api/userSettingsApi';
import { useSettingsContext } from '../../context/SettingsContext';
import { SaveToast, SectionError } from './SettingsCommon';

export default function AccountManagement({ role, userId }) {
  const { markSectionDirty } = useSettingsContext();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [runningAction, setRunningAction] = useState('');

  useEffect(() => {
    markSectionDirty('account-management', false);
  }, [markSectionDirty]);

  async function handleExport() {
    setRunningAction('export');
    setError('');

    try {
      const response = await userSettingsApi.exportUserData(role, userId);
      setToast(`Export ready: ${response.fileName}`);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setRunningAction('');
    }
  }

  async function handleDeleteRequest() {
    if (!deleteReason.trim()) {
      setError('Please provide a reason before requesting account deletion.');
      return;
    }

    setRunningAction('delete');
    setError('');

    try {
      await userSettingsApi.requestAccountDeletion(role, userId, deleteReason);
      setDeleteReason('');
      setToast('Account deletion request submitted to admin.');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setRunningAction('');
    }
  }

  return (
    <section className="user-settings-section">
      <header>
        <h3>Account Management</h3>
        <p>Export personal data and submit account management requests.</p>
      </header>

      <SectionError message={error} />

      <article className="user-settings-panel">
        <h4>Data Export</h4>
        <p>Download your settings and account-related data in JSON format.</p>
        <button
          type="button"
          className="user-settings-btn user-settings-btn-primary"
          onClick={handleExport}
          disabled={runningAction === 'export'}
        >
          {runningAction === 'export' ? 'Preparing Export...' : 'Download My Data'}
        </button>
      </article>

      <article className="user-settings-panel user-settings-danger-panel">
        <h4>Request Account Deletion</h4>
        <p>
          Deletion requests are reviewed by {role === 'faculty' ? 'administration and HR' : 'administration'} before
          processing.
        </p>
        <label>
          Reason for deletion request
          <textarea rows="3" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} />
        </label>
        <button
          type="button"
          className="user-settings-btn user-settings-btn-danger"
          onClick={handleDeleteRequest}
          disabled={runningAction === 'delete'}
        >
          {runningAction === 'delete' ? 'Submitting Request...' : 'Submit Delete Request'}
        </button>
      </article>

      <SaveToast message={toast} onClear={() => setToast('')} />
    </section>
  );
}
