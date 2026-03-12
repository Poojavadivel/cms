export default function SecuritySettings({
  title = 'Security Settings',
  description,
  values,
  updateLabel = 'Update Password',
  resetLabel = 'Reset',
  saving = false,
  onValueChange,
  onUpdatePassword,
  onReset,
}) {
  return (
    <article className="role-settings-card">
      <div className="role-settings-card-head">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>

      <div className="role-settings-grid">
        <label>
          Change Password
          <input
            type="password"
            placeholder="Enter new password"
            value={values.newPassword}
            onChange={(event) => onValueChange('newPassword', event.target.value)}
          />
        </label>
      </div>

      <div className="role-settings-actions">
        <button
          type="button"
          className="role-settings-btn role-settings-btn-primary"
          onClick={onUpdatePassword}
          disabled={saving}
        >
          {saving ? 'Updating...' : updateLabel}
        </button>
        <button type="button" className="role-settings-btn role-settings-btn-subtle" onClick={onReset} disabled={saving}>
          {resetLabel}
        </button>
      </div>
    </article>
  );
}
