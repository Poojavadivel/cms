export function getSettingsMenu(role) {
  const baseItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'language', label: 'Language & Region' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'accessibility', label: 'Accessibility' },
  ];

  if (role === 'faculty') {
    baseItems.push({ id: 'teaching-preferences', label: 'Teaching Preferences' });
  }

  baseItems.push({ id: 'account-management', label: 'Account Management' });
  baseItems.push({ id: 'dashboard', label: 'Dashboard' });

  return baseItems;
}
