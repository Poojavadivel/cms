const SETTINGS_SECTIONS = [
  {
    id: 'general',
    label: 'General',
    roles: ['admin'],
    children: [
      { id: 'portal-preferences', label: 'Portal Preferences' },
      { id: 'branding-assets', label: 'Branding Assets' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    roles: ['admin'],
    children: [
      { id: 'user-directory', label: 'User Directory' },
      { id: 'roles-permissions', label: 'Roles & Permissions' },
      { id: 'bulk-import', label: 'Bulk Import' },
    ],
  },
  {
    id: 'departments',
    label: 'Departments',
    roles: ['admin'],
    children: [
      { id: 'department-catalog', label: 'Department Catalog' },
      { id: 'staff-mapping', label: 'Staff Mapping' },
    ],
  },
  {
    id: 'academic',
    label: 'Academic Configuration',
    roles: ['admin'],
    children: [
      { id: 'academic-year', label: 'Academic Year' },
      { id: 'semester-rules', label: 'Semester Rules' },
      { id: 'grading-rules', label: 'Grading Rules' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    roles: ['admin', 'finance'],
    children: [
      { id: 'fee-structure', label: 'Fee Structure' },
      { id: 'payment-plans', label: 'Payment Plans' },
      { id: 'scholarship-rules', label: 'Scholarship Rules' },
      { id: 'late-fee-policies', label: 'Late Fee Policies' },
      { id: 'payroll-configuration', label: 'Payroll Configuration' },
      { id: 'salary-components', label: 'Salary Components' },
      { id: 'invoice-templates', label: 'Invoice Templates' },
      { id: 'payment-gateway-settings', label: 'Payment Gateway Settings' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    roles: ['admin'],
    children: [
      { id: 'email-templates', label: 'Email Templates' },
      { id: 'sms-templates', label: 'SMS Templates' },
      { id: 'push-notifications', label: 'Push Notifications' },
      { id: 'announcement-rules', label: 'Announcement Rules' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    roles: ['admin'],
    children: [
      { id: 'password-policy', label: 'Password Policy' },
      { id: 'mfa-controls', label: 'MFA Controls' },
      { id: 'session-limits', label: 'Session Limits' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    roles: ['admin'],
    children: [
      { id: 'smtp-email', label: 'SMTP Email' },
      { id: 'payment-services', label: 'Payment Services' },
      { id: 'webhooks', label: 'Webhooks' },
      { id: 'external-apis', label: 'External APIs' },
    ],
  },
  {
    id: 'data-management',
    label: 'Data Management',
    roles: ['admin'],
    children: [
      { id: 'backup-restore', label: 'Backup & Restore' },
      { id: 'data-export', label: 'Data Export' },
      { id: 'retention-policies', label: 'Retention Policies' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    roles: ['admin'],
    children: [
      { id: 'system-health', label: 'System Health' },
      { id: 'auth-events', label: 'Auth Events' },
      { id: 'error-traces', label: 'Error Traces' },
    ],
  },
];

function normalizeSection(section) {
  return {
    ...section,
    children: section.children.map((child) => ({ ...child })),
  };
}

export function getSettingsSectionsByRole(role) {
  return SETTINGS_SECTIONS.filter((section) => section.roles.includes(role)).map(normalizeSection);
}

export function getDefaultSettingsItemId(sections) {
  return sections[0]?.children[0]?.id || '';
}

export function findSettingsSelection(sections, itemId) {
  for (const section of sections) {
    for (const child of section.children) {
      if (child.id === itemId) {
        return {
          section,
          child,
        };
      }
    }
  }

  return null;
}
