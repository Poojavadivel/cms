import { useEffect } from 'react';

export default function SettingsToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => onDismiss(), 2800);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className={`settings-toast settings-toast-${toast.type || 'success'}`} role="status" aria-live="polite">
      <span>{toast.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
        x
      </button>
    </div>
  );
}
