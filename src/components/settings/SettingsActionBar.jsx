export default function SettingsActionBar({
  onSave,
  onReset,
  saveLabel = 'Save Changes',
  saving = false,
  disableSave = false,
}) {
  return (
    <div className="settings-actions">
      <button type="button" className="settings-btn settings-btn-ghost" onClick={onReset}>
        Reset
      </button>
      <button type="button" className="settings-btn settings-btn-primary" onClick={onSave} disabled={saving || disableSave}>
        {saving ? 'Saving...' : saveLabel}
      </button>
    </div>
  );
}
