const NETWORK_DELAY_MS = 280;

// Dummy backend variables requested for current API simulation.
export const generalSettings = {
  portalName: 'MIT Connect',
  language: 'English',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  theme: 'Ocean Blue',
  logoFileName: 'mit-logo.png',
  faviconFileName: 'mit-favicon.ico',
};

export const users = [
  { id: 1, name: 'John', role: 'student', email: 'john@student.mitconnect.edu', active: true },
  { id: 2, name: 'Sara', role: 'faculty', email: 'sara@mitconnect.edu', active: true },
  { id: 3, name: 'Admin', role: 'admin', email: 'admin@mitconnect.edu', active: true },
];

export const departments = [
  { id: 1, name: 'Computer Science', hod: 'Dr Kumar', code: 'CSE', mappedStaff: 48 },
  { id: 2, name: 'Mechanical', hod: 'Dr Raj', code: 'MEC', mappedStaff: 34 },
];

export const academicConfig = {
  currentYear: '2025-2026',
  semesters: 2,
  creditSystem: 'CBCS',
  attendanceRule: 'Minimum 75% attendance is mandatory.',
  gradeRule: 'A+ >= 90, A >= 80, B >= 70, C >= 60',
};

export const financeSettings = {
  tuitionFee: 50000,
  lateFeePercent: 5,
  scholarshipEnabled: true,
  paymentPlan: 'Semester Split',
  scholarshipRule: 'Merit based scholarship for top 10% students.',
  payrollCycle: 'Monthly',
  salaryComponents: 'Basic, HRA, DA, Performance Allowance',
  invoiceTemplate: 'MIT Standard Invoice v2',
  paymentGateway: 'Razorpay',
};

export const notificationSettings = {
  emailTemplate: 'Dear {{name}}, your portal update is available.',
  smsTemplate: 'MIT Connect alert: {{event}}',
  pushEnabled: true,
  announcementRule: 'Send urgent announcements to all users instantly.',
};

export const securitySettings = {
  minPasswordLength: 8,
  requireUppercase: true,
  mfaEnabled: false,
  maxLoginAttempts: 5,
  sessionTimeout: 30,
  ipRestrictions: 'Allow campus network + VPN',
};

export const integrationSettings = {
  smtpHost: 'smtp.mitconnect.edu',
  smtpPort: 587,
  smtpUser: 'no-reply@mitconnect.edu',
  paymentGatewayProvider: 'Razorpay',
  webhookUrl: 'https://mitconnect.edu/hooks/events',
  externalApiBaseUrl: 'https://api.university-services.edu',
  externalApiToken: 'demo-token-123',
};

export const dataManagementSettings = {
  retentionDays: 365,
  autoBackupEnabled: true,
  exportFormat: 'CSV',
  lastBackupId: 'BKP-2026-0311-001',
};

export const monitoring = {
  activeUsers: 342,
  failedLogins: 5,
  uptime: '99.9%',
  errorLogs: 2,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSeedDatabase() {
  return {
    generalSettings: clone(generalSettings),
    users: clone(users),
    departments: clone(departments),
    academicConfig: clone(academicConfig),
    financeSettings: clone(financeSettings),
    notificationSettings: clone(notificationSettings),
    securitySettings: clone(securitySettings),
    integrationSettings: clone(integrationSettings),
    dataManagementSettings: clone(dataManagementSettings),
    monitoring: clone(monitoring),
  };
}

let db = createSeedDatabase();
let userIdCounter = Math.max(...db.users.map((entry) => entry.id));
let departmentIdCounter = Math.max(...db.departments.map((entry) => entry.id));

function resolveWithDelay(payload) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(payload)), NETWORK_DELAY_MS);
  });
}

function rejectWithDelay(message, status = 400) {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject({ message, status }), NETWORK_DELAY_MS);
  });
}

function readId(endpoint, pattern) {
  const match = endpoint.match(pattern);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

export function apiGet(endpoint) {
  switch (endpoint) {
    case '/api/settings/general':
      return resolveWithDelay(db.generalSettings);
    case '/api/users':
      return resolveWithDelay(db.users);
    case '/api/departments':
      return resolveWithDelay(db.departments);
    case '/api/settings/academic':
      return resolveWithDelay(db.academicConfig);
    case '/api/settings/finance':
      return resolveWithDelay(db.financeSettings);
    case '/api/settings/notifications':
      return resolveWithDelay(db.notificationSettings);
    case '/api/settings/security':
      return resolveWithDelay(db.securitySettings);
    case '/api/settings/integrations':
      return resolveWithDelay(db.integrationSettings);
    case '/api/settings/data-management':
      return resolveWithDelay(db.dataManagementSettings);
    case '/api/system/export':
      return resolveWithDelay({
        fileName: `mit-connect-export-${Date.now()}.csv`,
        url: '/downloads/mit-connect-export.csv',
      });
    case '/api/system/monitoring':
      return resolveWithDelay({
        ...db.monitoring,
        activeUsers: db.monitoring.activeUsers + Math.floor(Math.random() * 3),
        failedLogins: db.monitoring.failedLogins + Math.floor(Math.random() * 2),
        polledAt: new Date().toISOString(),
      });
    default:
      return rejectWithDelay(`Unknown GET endpoint: ${endpoint}`, 404);
  }
}

export function apiPost(endpoint, payload = {}) {
  if (endpoint === '/api/users') {
    userIdCounter += 1;
    const created = {
      id: userIdCounter,
      name: payload.name || 'New User',
      role: payload.role || 'student',
      email: payload.email || `user${userIdCounter}@mitconnect.edu`,
      active: payload.active ?? true,
    };
    db.users.push(created);
    return resolveWithDelay(created);
  }

  if (endpoint === '/api/departments') {
    departmentIdCounter += 1;
    const created = {
      id: departmentIdCounter,
      name: payload.name || 'New Department',
      hod: payload.hod || 'TBD',
      code: payload.code || `DEP-${departmentIdCounter}`,
      mappedStaff: payload.mappedStaff ?? 0,
    };
    db.departments.push(created);
    return resolveWithDelay(created);
  }

  if (endpoint === '/api/system/backup') {
    const backupId = `BKP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`;
    db.dataManagementSettings.lastBackupId = backupId;
    return resolveWithDelay({ success: true, backupId });
  }

  if (endpoint === '/api/system/restore') {
    return resolveWithDelay({
      success: true,
      restoredFrom: payload.backupId || db.dataManagementSettings.lastBackupId,
    });
  }

  return rejectWithDelay(`Unknown POST endpoint: ${endpoint}`, 404);
}

export function apiPut(endpoint, payload) {
  if (endpoint === '/api/settings/general') {
    db.generalSettings = { ...db.generalSettings, ...payload };
    return resolveWithDelay(db.generalSettings);
  }

  if (endpoint === '/api/users') {
    db.users = clone(payload);
    return resolveWithDelay(db.users);
  }

  const userId = readId(endpoint, /^\/api\/users\/(\d+)$/);
  if (userId !== null) {
    const index = db.users.findIndex((entry) => entry.id === userId);
    if (index === -1) {
      return rejectWithDelay('User not found', 404);
    }
    db.users[index] = { ...db.users[index], ...payload };
    return resolveWithDelay(db.users[index]);
  }

  if (endpoint === '/api/departments') {
    db.departments = clone(payload);
    return resolveWithDelay(db.departments);
  }

  const departmentId = readId(endpoint, /^\/api\/departments\/(\d+)$/);
  if (departmentId !== null) {
    const index = db.departments.findIndex((entry) => entry.id === departmentId);
    if (index === -1) {
      return rejectWithDelay('Department not found', 404);
    }
    db.departments[index] = { ...db.departments[index], ...payload };
    return resolveWithDelay(db.departments[index]);
  }

  if (endpoint === '/api/settings/academic') {
    db.academicConfig = { ...db.academicConfig, ...payload };
    return resolveWithDelay(db.academicConfig);
  }

  if (endpoint === '/api/settings/finance') {
    db.financeSettings = { ...db.financeSettings, ...payload };
    return resolveWithDelay(db.financeSettings);
  }

  if (endpoint === '/api/settings/notifications') {
    db.notificationSettings = { ...db.notificationSettings, ...payload };
    return resolveWithDelay(db.notificationSettings);
  }

  if (endpoint === '/api/settings/security') {
    db.securitySettings = { ...db.securitySettings, ...payload };
    return resolveWithDelay(db.securitySettings);
  }

  if (endpoint === '/api/settings/integrations') {
    db.integrationSettings = { ...db.integrationSettings, ...payload };
    return resolveWithDelay(db.integrationSettings);
  }

  if (endpoint === '/api/settings/data-management') {
    db.dataManagementSettings = { ...db.dataManagementSettings, ...payload };
    return resolveWithDelay(db.dataManagementSettings);
  }

  return rejectWithDelay(`Unknown PUT endpoint: ${endpoint}`, 404);
}

export function apiDelete(endpoint) {
  const userId = readId(endpoint, /^\/api\/users\/(\d+)$/);
  if (userId !== null) {
    const currentLength = db.users.length;
    db.users = db.users.filter((entry) => entry.id !== userId);
    if (db.users.length === currentLength) {
      return rejectWithDelay('User not found', 404);
    }
    return resolveWithDelay({ success: true });
  }

  return rejectWithDelay(`Unknown DELETE endpoint: ${endpoint}`, 404);
}

export function resetMockDatabase() {
  db = createSeedDatabase();
  userIdCounter = Math.max(...db.users.map((entry) => entry.id));
  departmentIdCounter = Math.max(...db.departments.map((entry) => entry.id));
}
