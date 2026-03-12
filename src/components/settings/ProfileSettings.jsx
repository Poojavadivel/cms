export default function ProfileSettings({
  title = 'Profile Settings',
  description,
  profile,
  extraFieldKey,
  extraFieldLabel,
  phoneLabel = 'Phone Number',
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  saving = false,
  onProfileChange,
  onPhotoChange,
  onSave,
  onCancel,
}) {
  return (
    <article className="role-settings-card">
      <div className="role-settings-card-head">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>

      <div className="role-settings-grid">
        <label>
          Full Name
          <input
            type="text"
            value={profile.name}
            onChange={(event) => onProfileChange('name', event.target.value)}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={profile.email}
            onChange={(event) => onProfileChange('email', event.target.value)}
          />
        </label>

        <label>
          {phoneLabel}
          <input
            type="tel"
            value={profile.phone}
            onChange={(event) => onProfileChange('phone', event.target.value)}
          />
        </label>

        <label>
          {extraFieldLabel}
          <input
            type="text"
            value={profile[extraFieldKey] || ''}
            onChange={(event) => onProfileChange(extraFieldKey, event.target.value)}
          />
        </label>

        <label className="role-settings-span-2">
          Profile Photo Upload
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onPhotoChange(event.target.files?.[0] || null)}
          />
          <small>{profile.profilePhotoName || 'No file selected.'}</small>
        </label>
      </div>

      <div className="role-settings-actions">
        <button type="button" className="role-settings-btn role-settings-btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : saveLabel}
        </button>
        <button type="button" className="role-settings-btn role-settings-btn-subtle" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </article>
  );
}
