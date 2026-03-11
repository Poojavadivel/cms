import { useEffect } from 'react';

export function SectionLoader({ label = 'Loading settings...' }) {
  return (
    <div className="user-settings-loader" role="status" aria-live="polite">
      <span className="user-settings-spinner" />
      <span>{label}</span>
    </div>
  );
}

export function SectionError({ message }) {
  if (!message) {
    return null;
  }

  return <div className="user-settings-error">{message}</div>;
}

export function SaveToast({ message, onClear }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => onClear(), 2600);
    return () => window.clearTimeout(timer);
  }, [message, onClear]);

  if (!message) {
    return null;
  }

  return <div className="user-settings-toast">{message}</div>;
}

export function SectionActions({ onSave, onReset, saving = false, disableSave = false }) {
  return (
    <div className="user-settings-actions">
      <button type="button" className="user-settings-btn user-settings-btn-muted" onClick={onReset}>
        Reset
      </button>
      <button
        type="button"
        className="user-settings-btn user-settings-btn-primary"
        onClick={onSave}
        disabled={saving || disableSave}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

export function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <label className="user-settings-toggle">
      <span className="user-settings-toggle-copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="user-settings-toggle-control">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="user-settings-toggle-slider" />
      </span>
    </label>
  );
}

export function isDirty(current, baseline) {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
