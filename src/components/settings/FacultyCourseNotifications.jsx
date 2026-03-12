export default function FacultyCourseNotifications({
  title = 'Course Notifications',
  description,
  values,
  saveLabel = 'Save Settings',
  resetLabel = 'Reset',
  saving = false,
  onToggle,
  onSave,
  onReset,
}) {
  return (
    <article className="role-settings-card">
      <div className="role-settings-card-head">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>

      <div className="role-settings-toggle-list">
        <label className="role-settings-toggle">
          <span className="role-settings-toggle-copy">
            <strong>Assignment Submissions</strong>
            <small>Receive alerts when students submit assignment work.</small>
          </span>
          <span className="role-settings-toggle-control">
            <input
              type="checkbox"
              checked={Boolean(values.assignmentSubmission)}
              onChange={(event) => onToggle('assignmentSubmission', event.target.checked)}
            />
            <span className="role-settings-toggle-track" />
          </span>
        </label>

        <label className="role-settings-toggle">
          <span className="role-settings-toggle-copy">
            <strong>Student Doubt Requests</strong>
            <small>Get notified when students request academic clarification.</small>
          </span>
          <span className="role-settings-toggle-control">
            <input
              type="checkbox"
              checked={Boolean(values.studentDoubtRequests)}
              onChange={(event) => onToggle('studentDoubtRequests', event.target.checked)}
            />
            <span className="role-settings-toggle-track" />
          </span>
        </label>
      </div>

      <div className="role-settings-actions">
        <button type="button" className="role-settings-btn role-settings-btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : saveLabel}
        </button>
        <button type="button" className="role-settings-btn role-settings-btn-subtle" onClick={onReset} disabled={saving}>
          {resetLabel}
        </button>
      </div>
    </article>
  );
}
