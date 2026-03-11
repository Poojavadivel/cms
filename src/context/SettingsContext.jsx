import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SettingsContext = createContext(null);

const INITIAL_SETTINGS = {
  profile: {},
  account: {},
  notifications: {},
  security: {},
  appearance: {},
  language: {},
  privacy: {},
  accessibility: {},
  teachingPreferences: {},
  accountManagement: {},
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [dirtySections, setDirtySections] = useState({});

  const hasUnsavedChanges = useMemo(
    () => Object.values(dirtySections).some((isDirty) => Boolean(isDirty)),
    [dirtySections]
  );

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const setSectionData = useCallback((section, value) => {
    setSettings((current) => ({
      ...current,
      [section]: value,
    }));
  }, []);

  const markSectionDirty = useCallback((section, isDirty) => {
    setDirtySections((current) => ({
      ...current,
      [section]: Boolean(isDirty),
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      settings,
      setSectionData,
      dirtySections,
      markSectionDirty,
      hasUnsavedChanges,
    }),
    [settings, setSectionData, dirtySections, markSectionDirty, hasUnsavedChanges]
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used inside SettingsProvider.');
  }

  return context;
}
