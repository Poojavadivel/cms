function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function studentSeed(overrides = {}) {
  return {
    profile: {
      name: 'Arun Kumar',
      email: 'arun@student.edu',
      phone: '9876543210',
      bio: 'Computer Science Student',
      address: 'Chennai',
    },
    notifications: {
      email: true,
      sms: false,
      examReminder: true,
      feeReminder: true,
    },
    appearance: {
      theme: 'dark',
      fontSize: 'medium',
      accentColor: 'blue',
      layoutDensity: 'comfortable',
    },
    language: {
      language: 'English',
      region: 'India',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
    },
    privacy: {
      profileVisible: true,
      searchable: true,
      allowDirectMessages: true,
    },
    accessibility: {
      highContrast: false,
      reduceMotion: false,
      textToSpeech: false,
      largeClickTargets: false,
    },
    ...overrides,
  };
}

function facultySeed(overrides = {}) {
  return {
    profile: {
      name: 'Dr. Ravi',
      email: 'ravi@faculty.edu',
      department: 'Computer Science',
      phone: '9123456789',
      bio: 'Associate Professor - Distributed Systems',
    },
    notifications: {
      assignmentAlerts: true,
      studentMessages: true,
      email: true,
      sms: false,
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      accentColor: 'teal',
      layoutDensity: 'comfortable',
    },
    language: {
      language: 'English',
      region: 'India',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
    },
    privacy: {
      profileVisible: true,
      searchable: true,
      allowDirectMessages: true,
    },
    accessibility: {
      highContrast: false,
      reduceMotion: false,
      textToSpeech: false,
      largeClickTargets: false,
    },
    teachingPreferences: {
      preferredMode: 'Hybrid',
      officeHours: '10 AM - 12 PM',
      autoPublishGrades: false,
    },
    ...overrides,
  };
}

const now = new Date().toISOString();

export const settingsDB = {
  students: {
    stu_101: studentSeed(),
    'STU-2024-1547': studentSeed({
      profile: {
        name: 'John Anderson',
        email: 'john@student.edu',
        phone: '9876543211',
        bio: 'Final Year CSE Student',
        address: 'Coimbatore',
      },
    }),
  },
  faculty: {
    fac_201: facultySeed(),
    'FAC-204': facultySeed({
      profile: {
        name: 'Dr. Rajesh Iyer',
        email: 'rajesh@faculty.edu',
        department: 'School of Engineering',
        phone: '9123456790',
        bio: 'Faculty Coordinator - Software Engineering',
      },
      teachingPreferences: {
        preferredMode: 'Offline',
        officeHours: '2 PM - 4 PM',
        autoPublishGrades: true,
      },
    }),
  },
  credentials: {
    stu_101: 'student123',
    'STU-2024-1547': 'student123',
    fac_201: 'faculty123',
    'FAC-204': 'faculty123',
  },
  sessions: {
    stu_101: [
      { id: 'sess-stu-1', device: 'Chrome on Windows', location: 'Chennai', active: true, lastSeen: now },
      { id: 'sess-stu-2', device: 'Android App', location: 'Chennai', active: false, lastSeen: '2026-03-09T08:00:00Z' },
    ],
    'STU-2024-1547': [
      { id: 'sess-stu-3', device: 'Edge on Windows', location: 'Coimbatore', active: true, lastSeen: now },
    ],
    fac_201: [{ id: 'sess-fac-1', device: 'Safari on Mac', location: 'Bengaluru', active: true, lastSeen: now }],
    'FAC-204': [
      { id: 'sess-fac-2', device: 'Chrome on Windows', location: 'Chennai', active: true, lastSeen: now },
    ],
  },
  loginHistory: {
    stu_101: [
      { timestamp: now, status: 'success', ip: '10.10.2.45' },
      { timestamp: '2026-03-10T17:22:00Z', status: 'success', ip: '10.10.2.45' },
      { timestamp: '2026-03-08T12:10:00Z', status: 'failed', ip: '10.10.2.45' },
    ],
    'STU-2024-1547': [
      { timestamp: now, status: 'success', ip: '10.10.3.76' },
      { timestamp: '2026-03-09T09:15:00Z', status: 'success', ip: '10.10.3.76' },
    ],
    fac_201: [
      { timestamp: now, status: 'success', ip: '10.10.6.25' },
      { timestamp: '2026-03-10T08:52:00Z', status: 'success', ip: '10.10.6.25' },
    ],
    'FAC-204': [
      { timestamp: now, status: 'success', ip: '10.10.5.89' },
      { timestamp: '2026-03-09T07:40:00Z', status: 'failed', ip: '10.10.5.89' },
    ],
  },
  deleteRequests: [],
};

export function normalizeRole(role) {
  if (!role) {
    return null;
  }

  const value = role.toLowerCase();
  if (value === 'student' || value === 'students') {
    return 'student';
  }

  if (value === 'faculty') {
    return 'faculty';
  }

  return null;
}

export function roleBucket(role) {
  return normalizeRole(role) === 'faculty' ? 'faculty' : 'students';
}

export function inferRoleByUserId(userId) {
  if (settingsDB.students[userId]) {
    return 'student';
  }

  if (settingsDB.faculty[userId]) {
    return 'faculty';
  }

  return null;
}

export function getUserRecord(role, userId) {
  const resolvedRole = normalizeRole(role) || inferRoleByUserId(userId);
  if (!resolvedRole) {
    return null;
  }

  const collection = resolvedRole === 'faculty' ? settingsDB.faculty : settingsDB.students;
  const record = collection[userId];

  if (!record) {
    return null;
  }

  return {
    role: resolvedRole,
    record,
  };
}

export function getSection(role, userId, section) {
  const user = getUserRecord(role, userId);
  if (!user || !user.record[section]) {
    return null;
  }

  return clone(user.record[section]);
}

export function updateSection(role, userId, section, payload) {
  const user = getUserRecord(role, userId);
  if (!user) {
    return null;
  }

  const currentSection = user.record[section] || {};
  user.record[section] = {
    ...currentSection,
    ...payload,
  };

  return clone(user.record[section]);
}

export function updateCredential(userId, password) {
  settingsDB.credentials[userId] = password;
}

export function getCredential(userId) {
  return settingsDB.credentials[userId] || null;
}

export function getSessions(userId) {
  return clone(settingsDB.sessions[userId] || []);
}

export function logoutAllSessions(userId) {
  const sessions = settingsDB.sessions[userId] || [];
  settingsDB.sessions[userId] = sessions.map((entry) => ({
    ...entry,
    active: false,
    lastSeen: new Date().toISOString(),
  }));

  return clone(settingsDB.sessions[userId]);
}

export function getLoginHistory(userId) {
  return clone(settingsDB.loginHistory[userId] || []);
}

export function createDeleteRequest(userId, role, reason = 'User requested account deletion') {
  const entry = {
    id: `DEL-${Date.now()}`,
    userId,
    role,
    reason,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  settingsDB.deleteRequests.push(entry);
  return clone(entry);
}

export function exportUserData(userId) {
  const role = inferRoleByUserId(userId);
  if (!role) {
    return null;
  }

  const user = getUserRecord(role, userId);
  return {
    userId,
    role,
    exportedAt: new Date().toISOString(),
    settings: clone(user.record),
    sessions: getSessions(userId),
    loginHistory: getLoginHistory(userId),
  };
}
