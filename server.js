/**
 * MIT Connect — Settings API Server
 * Single-file Express backend running on port 5000.
 * Serves all /api/settings/* endpoints for student and faculty roles.
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

dotenv.config({ path: './backend/.env' });

// ── MongoDB Connection ─────────────────────────────────────────────────────────

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// ── Notification Model ─────────────────────────────────────────────────────────

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  senderRole: { type: String, required: true },
  receiverRole: { type: String, required: true },
  module: { type: String, required: true },
  priority: { type: String, required: true },
  status: { type: String, default: 'unread' },
  actionId: String,
  relatedData: { type: mongoose.Schema.Types.Mixed, default: {} },
  department: String,
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

// ── Exam Model ──────────────────────────────────────────────────────────────

const examSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  room: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, default: 'Upcoming' },
  duration: { type: String, required: true },
  maxMarks: { type: String, required: true },
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);

// ─── Helpers ────────────────────────────────────────────────────────────────

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ─── Dummy Database ──────────────────────────────────────────────────────────

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

const db = {
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

// ─── DB Helpers ───────────────────────────────────────────────────────────────

function normalizeRole(role) {
  if (!role) return null;
  const v = role.toLowerCase();
  if (v === 'student' || v === 'students') return 'student';
  if (v === 'faculty') return 'faculty';
  return null;
}

function inferRoleByUserId(userId) {
  if (db.students[userId]) return 'student';
  if (db.faculty[userId]) return 'faculty';
  return null;
}

function getUserRecord(role, userId) {
  const resolvedRole = normalizeRole(role) || inferRoleByUserId(userId);
  if (!resolvedRole) return null;
  const collection = resolvedRole === 'faculty' ? db.faculty : db.students;
  const record = collection[userId];
  if (!record) return null;
  return { role: resolvedRole, record };
}

function getSection(role, userId, section) {
  const user = getUserRecord(role, userId);
  if (!user || !user.record[section]) return null;
  return clone(user.record[section]);
}

function updateSection(role, userId, section, payload) {
  const user = getUserRecord(role, userId);
  if (!user) return null;
  user.record[section] = { ...(user.record[section] || {}), ...payload };
  return clone(user.record[section]);
}

function getCredential(userId) {
  return db.credentials[userId] || null;
}

function updateCredential(userId, password) {
  db.credentials[userId] = password;
}

function getSessions(userId) {
  return clone(db.sessions[userId] || []);
}

function logoutAllSessions(userId) {
  const sessions = db.sessions[userId] || [];
  db.sessions[userId] = sessions.map((s) => ({
    ...s,
    active: false,
    lastSeen: new Date().toISOString(),
  }));
  return clone(db.sessions[userId]);
}

function getLoginHistory(userId) {
  return clone(db.loginHistory[userId] || []);
}

function createDeleteRequest(userId, role, reason = 'User requested account deletion') {
  const entry = {
    id: `DEL-${Date.now()}`,
    userId,
    role,
    reason,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };
  db.deleteRequests.push(entry);
  return clone(entry);
}

function exportUserData(userId) {
  const role = inferRoleByUserId(userId);
  if (!role) return null;
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

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Utility ────────────────────────────────────────────────────────────────────

function sendError(res, status, message) {
  res.status(status).json({ message });
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (!body || body[field] === undefined || body[field] === null || body[field] === '') {
      return field;
    }
  }
  return null;
}

function resolveRole(res, role) {
  const r = normalizeRole(role);
  if (!r) sendError(res, 400, 'Invalid role. Allowed values: student, faculty.');
  return r;
}

function resolveRoleAndUser(res, role, userId) {
  const resolvedRole = resolveRole(res, role);
  if (!resolvedRole) {
    return null;
  }

  const user = getUserRecord(resolvedRole, userId);
  if (!user) {
    sendError(res, 404, 'User not found for selected role.');
    return null;
  }

  return {
    role: resolvedRole,
    user,
  };
}

// ── Health ─────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ service: 'MIT Connect Settings API', status: 'ok', timestamp: new Date().toISOString() });
});

// ── Profile ────────────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/profile', (req, res) => {
  const role = resolveRole(res, req.params.role);
  if (!role) return;
  const data = getSection(role, req.params.userId, 'profile');
  if (!data) return sendError(res, 404, 'Profile not found for user.');
  res.json(data);
});

app.put('/api/settings/:role/:userId/profile', (req, res) => {
  const role = resolveRole(res, req.params.role);
  if (!role) return;
  const updated = updateSection(role, req.params.userId, 'profile', req.body || {});
  if (!updated) return sendError(res, 404, 'Profile not found for user.');
  res.json({ message: 'Profile updated successfully', data: updated });
});

// ── Notifications ──────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/notifications', (req, res) => {
  const role = resolveRole(res, req.params.role);
  if (!role) return;
  const data = getSection(role, req.params.userId, 'notifications');
  if (!data) return sendError(res, 404, 'Notification preferences not found for user.');
  res.json(data);
});

app.put('/api/settings/:role/:userId/notifications', (req, res) => {
  const role = resolveRole(res, req.params.role);
  if (!role) return;
  const updated = updateSection(role, req.params.userId, 'notifications', req.body || {});
  if (!updated) return sendError(res, 404, 'Notification preferences not found for user.');
  res.json({ message: 'Notification preferences updated successfully', data: updated });
});

// ── Password ───────────────────────────────────────────────────────────────────

app.post('/api/settings/change-password', (req, res) => {
  const missing = requireFields(req.body, ['userId', 'oldPassword', 'newPassword']);
  if (missing) return sendError(res, 400, `${missing} is required.`);

  const { userId, oldPassword, newPassword } = req.body;
  const existing = getCredential(userId);
  if (!existing) return sendError(res, 404, 'User account not found.');
  if (existing !== oldPassword) return sendError(res, 400, 'Current password is incorrect.');
  if (String(newPassword).length < 8) return sendError(res, 400, 'New password must contain at least 8 characters.');

  updateCredential(userId, newPassword);
  res.json({ message: 'Password changed successfully.' });
});

// ── Email ──────────────────────────────────────────────────────────────────────

app.put('/api/settings/email', (req, res) => {
  const missing = requireFields(req.body, ['userId', 'email']);
  if (missing) return sendError(res, 400, `${missing} is required.`);

  const role = normalizeRole(req.body.role) || inferRoleByUserId(req.body.userId);
  if (!role) return sendError(res, 404, 'User account not found for email update.');

  const updated = updateSection(role, req.body.userId, 'profile', { email: req.body.email });
  if (!updated) return sendError(res, 404, 'Profile not found for email update.');
  res.json({ message: 'Email updated successfully.', data: { email: updated.email } });
});

// ── Teaching Preferences (Faculty only) ────────────────────────────────────────

app.get('/api/settings/faculty/:userId/teaching', (req, res) => {
  const data = getSection('faculty', req.params.userId, 'teachingPreferences');
  if (!data) return sendError(res, 404, 'Teaching preferences not found for faculty user.');
  res.json(data);
});

app.put('/api/settings/faculty/:userId/teaching', (req, res) => {
  const updated = updateSection('faculty', req.params.userId, 'teachingPreferences', req.body || {});
  if (!updated) return sendError(res, 404, 'Teaching preferences not found for faculty user.');
  res.json({ message: 'Teaching preferences updated successfully', data: updated });
});

// ── Sessions ───────────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/sessions', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  res.json(getSessions(req.params.userId));
});

app.get('/api/settings/:userId/sessions', (req, res) => {
  const role = inferRoleByUserId(req.params.userId);
  if (!role) return sendError(res, 404, 'User not found.');
  res.json(getSessions(req.params.userId));
});

app.post('/api/settings/logout-all', (req, res) => {
  const missing = requireFields(req.body, ['userId']);
  if (missing) return sendError(res, 400, `${missing} is required.`);

  if (req.body.role) {
    const scoped = resolveRoleAndUser(res, req.body.role, req.body.userId);
    if (!scoped) return;
  } else {
    const role = inferRoleByUserId(req.body.userId);
    if (!role) return sendError(res, 404, 'User not found.');
  }

  const sessions = logoutAllSessions(req.body.userId);
  res.json({ message: 'All devices logged out successfully.', data: sessions });
});

// ── Login History ──────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/login-history', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  res.json(getLoginHistory(req.params.userId));
});

app.get('/api/settings/:userId/login-history', (req, res) => {
  const role = inferRoleByUserId(req.params.userId);
  if (!role) return sendError(res, 404, 'User not found.');
  res.json(getLoginHistory(req.params.userId));
});

// ── Appearance ─────────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/appearance', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  res.json(scoped.user.record.appearance || {});
});

app.put('/api/settings/:role/:userId/appearance', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  const updated = updateSection(scoped.role, req.params.userId, 'appearance', req.body || {});
  res.json({ message: 'Appearance settings updated successfully.', data: updated });
});

app.get('/api/settings/:userId/appearance', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  res.json(user.record.appearance || {});
});

app.put('/api/settings/:userId/appearance', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  const updated = updateSection(user.role, req.params.userId, 'appearance', req.body || {});
  res.json({ message: 'Appearance settings updated successfully.', data: updated });
});

// ── Language ───────────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/language', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  res.json(scoped.user.record.language || {});
});

app.put('/api/settings/:role/:userId/language', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  const updated = updateSection(scoped.role, req.params.userId, 'language', req.body || {});
  res.json({ message: 'Language & region settings updated successfully.', data: updated });
});

app.get('/api/settings/:userId/language', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  res.json(user.record.language || {});
});

app.put('/api/settings/:userId/language', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  const updated = updateSection(user.role, req.params.userId, 'language', req.body || {});
  res.json({ message: 'Language & region settings updated successfully.', data: updated });
});

// ── Privacy ────────────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/privacy', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  res.json(scoped.user.record.privacy || {});
});

app.put('/api/settings/:role/:userId/privacy', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  const updated = updateSection(scoped.role, req.params.userId, 'privacy', req.body || {});
  res.json({ message: 'Privacy settings updated successfully.', data: updated });
});

app.get('/api/settings/:userId/privacy', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  res.json(user.record.privacy || {});
});

app.put('/api/settings/:userId/privacy', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  const updated = updateSection(user.role, req.params.userId, 'privacy', req.body || {});
  res.json({ message: 'Privacy settings updated successfully.', data: updated });
});

// ── Accessibility ──────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/accessibility', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  res.json(scoped.user.record.accessibility || {});
});

app.put('/api/settings/:role/:userId/accessibility', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;
  const updated = updateSection(scoped.role, req.params.userId, 'accessibility', req.body || {});
  res.json({ message: 'Accessibility settings updated successfully.', data: updated });
});

app.get('/api/settings/:userId/accessibility', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  res.json(user.record.accessibility || {});
});

app.put('/api/settings/:userId/accessibility', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  const updated = updateSection(user.role, req.params.userId, 'accessibility', req.body || {});
  res.json({ message: 'Accessibility settings updated successfully.', data: updated });
});

// ── Export Data ────────────────────────────────────────────────────────────────

app.get('/api/settings/:role/:userId/export-data', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;

  const data = exportUserData(req.params.userId);
  if (!data) return sendError(res, 404, 'User not found.');
  res.json({ fileName: `${req.params.userId}-settings-export.json`, data });
});

app.get('/api/settings/:userId/export-data', (req, res) => {
  const data = exportUserData(req.params.userId);
  if (!data) return sendError(res, 404, 'User not found.');
  res.json({ fileName: `${req.params.userId}-settings-export.json`, data });
});

// ── Delete Request ─────────────────────────────────────────────────────────────

app.post('/api/settings/:role/:userId/delete-request', (req, res) => {
  const scoped = resolveRoleAndUser(res, req.params.role, req.params.userId);
  if (!scoped) return;

  const entry = createDeleteRequest(req.params.userId, scoped.role, req.body?.reason);
  res.status(201).json({ message: 'Account deletion request submitted.', data: entry });
});

app.post('/api/settings/:userId/delete-request', (req, res) => {
  const user = getUserRecord(null, req.params.userId);
  if (!user) return sendError(res, 404, 'User not found.');
  const entry = createDeleteRequest(req.params.userId, user.role, req.body?.reason);
  res.status(201).json({ message: 'Account deletion request submitted.', data: entry });
});

// ── Notifications API (MongoDB-backed) ─────────────────────────────────────────

// Seed default notifications if collection is empty
async function seedNotifications() {
  const count = await Notification.countDocuments();
  if (count > 0) return;

  const seeds = [
    { title: 'Assignment Posted', message: 'Assignment 3: Data Structures uploaded for CS201', senderRole: 'faculty', receiverRole: 'student', module: 'Academic', priority: 'Medium', status: 'unread', actionId: 'assignment_posted_1' },
    { title: 'Fee Payment Reminder', message: 'Your spring semester fees of ₹85,000 are due by 2026-03-25.', senderRole: 'finance', receiverRole: 'student', module: 'Finance', priority: 'High', status: 'unread', actionId: 'fee_reminder_1' },
    { title: 'Class Cancellation', message: 'CS201 class scheduled for today is cancelled due to faculty emergency.', senderRole: 'faculty', receiverRole: 'student', module: 'Academic', priority: 'High', status: 'read', actionId: 'class_cancelled_1' },
    { title: 'Internal Marks Released', message: 'Internal exam marks for CS201 have been released.', senderRole: 'faculty', receiverRole: 'student', module: 'Academic', priority: 'Medium', status: 'read', actionId: 'marks_released_1' },
    { title: 'Semester Registration Open', message: 'Spring 2026 semester registration is now open.', senderRole: 'admin', receiverRole: 'student', module: 'Administrative', priority: 'High', status: 'unread', actionId: 'sem_registration_open_1' },
    { title: 'Placement Campaign Alert', message: 'Tech Corp is recruiting! Register before 2026-03-18 for campus interview.', senderRole: 'admin', receiverRole: 'student', module: 'Administrative', priority: 'High', status: 'unread', actionId: 'placement_alert_1' },
    { title: 'Scholarship Approval', message: 'Congratulations! Your merit scholarship of ₹10,000 has been approved.', senderRole: 'finance', receiverRole: 'student', module: 'Finance', priority: 'Medium', status: 'read', actionId: 'scholarship_approval_1' },
    { title: 'Faculty Meeting Scheduled', message: 'Department meeting scheduled for 2026-03-15 at 2:00 PM. Attendance mandatory.', senderRole: 'admin', receiverRole: 'faculty', module: 'Administrative', priority: 'High', status: 'unread', actionId: 'faculty_meeting_1' },
    { title: 'Salary Credited', message: 'Your March 2026 salary of ₹75,000 has been credited to your account.', senderRole: 'finance', receiverRole: 'faculty', module: 'Finance', priority: 'Medium', status: 'read', actionId: 'salary_credited_1' },
    { title: 'Department Spending Alert', message: 'CS department has exceeded budget by 15%.', senderRole: 'finance', receiverRole: 'admin', module: 'Finance', priority: 'Critical', status: 'unread', actionId: 'spending_alert_1' },
    { title: 'Emergency Announcement', message: 'Campus will remain closed on 2026-03-13 due to severe weather.', senderRole: 'admin', receiverRole: 'ALL', module: 'Alerts', priority: 'Critical', status: 'unread', actionId: 'emergency_announce_1' },
    { title: 'System Maintenance Alert', message: 'Scheduled system maintenance on 2026-03-14 from 11:00 PM to 1:00 AM.', senderRole: 'admin', receiverRole: 'ALL', module: 'System', priority: 'Medium', status: 'unread', actionId: 'maintenance_alert_1' },
  ];

  await Notification.insertMany(seeds);
  console.log(`Seeded ${seeds.length} default notifications`);
}

mongoose.connection.once('open', () => seedNotifications().catch(console.error));

// Get notifications for a role
app.get('/api/notifications/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { category, priority, status, search } = req.query;

    const filter = {
      $or: [
        { receiverRole: role },
        { receiverRole: 'ALL' },
        { senderRole: role }
      ]
    };
    if (category) filter.module = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (search) {
      filter.$and = [{
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ]
      }];
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      $or: [{ receiverRole: role }, { receiverRole: 'ALL' }, { senderRole: role }],
      status: 'unread'
    });

    res.json({ success: true, role, data: notifications, count: notifications.length, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread count
app.get('/api/notifications/:role/unread', async (req, res) => {
  try {
    const { role } = req.params;
    const unreadCount = await Notification.countDocuments({
      $or: [{ receiverRole: role }, { receiverRole: 'ALL' }, { senderRole: role }],
      status: 'unread'
    });
    res.json({ success: true, role, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { title, message, senderRole, receiverRole, module, priority, actionId, relatedData, department } = req.body;

    if (!title || !message || !senderRole || !receiverRole || !module || !priority) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const notification = await Notification.create({
      title, message, senderRole, receiverRole, module, priority,
      actionId: actionId || null,
      relatedData: relatedData || {},
      department: department || null,
    });

    res.status(201).json({ success: true, message: 'Notification created', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read for a role
app.put('/api/notifications/:role/read-all', async (req, res) => {
  try {
    const { role } = req.params;
    const result = await Notification.updateMany(
      { $or: [{ receiverRole: role }, { receiverRole: 'ALL' }], status: 'unread' },
      { status: 'read' }
    );
    res.json({ success: true, message: 'All notifications marked as read', count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all notifications for a role
app.post('/api/notifications/:role/clear-all', async (req, res) => {
  try {
    const { role } = req.params;
    const result = await Notification.deleteMany({
      $or: [{ receiverRole: role }, { receiverRole: 'ALL' }]
    });
    res.json({ success: true, message: 'All notifications cleared', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Exam Routes ────────────────────────────────────────────────────────────────

// Seed default exams if collection is empty
async function seedExams() {
  const count = await Exam.countDocuments();
  if (count === 0) {
    await Exam.insertMany([
      { code: 'CS401', name: 'Data Structures',      date: '2023-12-10', time: '10:00', room: 'Hall A',    type: 'Mid-Sem',  status: 'Upcoming', duration: '120', maxMarks: '100' },
      { code: 'MA405', name: 'Discrete Mathematics', date: '2023-12-12', time: '09:00', room: 'Hall B',    type: 'Mid-Sem',  status: 'Upcoming', duration: '120', maxMarks: '100' },
      { code: 'CS403', name: 'Database Systems',     date: '2023-11-28', time: '11:00', room: 'Lab 2',     type: 'Practical',status: 'Completed', duration: '180', maxMarks: '50' },
      { code: 'HU102', name: 'Tech Writing',         date: '2023-12-15', time: '14:00', room: 'Room 101',  type: 'Internal', status: 'Upcoming', duration: '90', maxMarks: '50' },
      { code: 'CS406', name: 'Operating Systems',    date: '2023-11-20', time: '10:00', room: 'Room 304',  type: 'Quiz',     status: 'Completed', duration: '60', maxMarks: '25' },
    ]);
    console.log('Seeded 5 default exams');
  }
}

mongoose.connection.once('open', () => seedExams().catch(console.error));

// Get all exams
app.get('/api/exams', async (req, res) => {
  try {
    const exams = await Exam.find().sort({ date: 1, time: 1 });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create exam + auto-notify students
app.post('/api/exams', async (req, res) => {
  try {
    const { code, name, date, time, room, type, status, duration, maxMarks, senderRole } = req.body;
    if (!code || !name || !date || !time || !room || !type || !duration || !maxMarks) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const exam = await Exam.create({ code, name, date, time, room, type, status: status || 'Upcoming', duration, maxMarks });

    // Auto-create notification for students
    const examDate = new Date(date);
    const formattedDate = examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    await Notification.create({
      title: `New Exam Scheduled: ${code} — ${name}`,
      message: `A ${type} exam for ${code} (${name}) has been scheduled on ${formattedDate} at ${time} in ${room}. Duration: ${duration} min, Max Marks: ${maxMarks}.`,
      senderRole: senderRole || 'faculty',
      receiverRole: 'student',
      module: 'Exams',
      priority: 'high',
      relatedData: { examId: exam._id.toString(), code, name, date, time, room },
    });

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update exam + auto-notify students
app.put('/api/exams/:id', async (req, res) => {
  try {
    const { code, name, date, time, room, type, status, duration, maxMarks, senderRole } = req.body;
    const exam = await Exam.findByIdAndUpdate(req.params.id, { code, name, date, time, room, type, status, duration, maxMarks }, { new: true });
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    // Auto-create notification for students about the update
    const examDate = new Date(date);
    const formattedDate = examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    await Notification.create({
      title: `Exam Updated: ${code} — ${name}`,
      message: `The ${type} exam for ${code} (${name}) has been updated. Date: ${formattedDate}, Time: ${time}, Room: ${room}. Duration: ${duration} min, Max Marks: ${maxMarks}.`,
      senderRole: senderRole || 'faculty',
      receiverRole: 'student',
      module: 'Exams',
      priority: 'medium',
      relatedData: { examId: exam._id.toString(), code, name, date, time, room },
    });

    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete exam + notify students
app.delete('/api/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });

    // Notify students about cancellation
    await Notification.create({
      title: `Exam Cancelled: ${exam.code} — ${exam.name}`,
      message: `The ${exam.type} exam for ${exam.code} (${exam.name}) has been cancelled.`,
      senderRole: 'admin',
      receiverRole: 'student',
      module: 'Exams',
      priority: 'high',
      relatedData: { code: exam.code, name: exam.name },
    });

    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── 404 Fallback ───────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Start ──────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`MIT Connect API running on http://localhost:${PORT}`);
});
