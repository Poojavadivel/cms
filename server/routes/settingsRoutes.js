import express from 'express';
import {
  createDeleteRequest,
  exportUserData,
  getCredential,
  getLoginHistory,
  getSection,
  getSessions,
  getUserRecord,
  inferRoleByUserId,
  logoutAllSessions,
  normalizeRole,
  updateCredential,
  updateSection,
} from '../db/settingsDB.js';

const router = express.Router();

function sendError(response, status, message) {
  response.status(status).json({ message });
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (!body || typeof body[field] === 'undefined' || body[field] === null || body[field] === '') {
      return field;
    }
  }

  return null;
}

function resolveRoleOrFail(response, role) {
  const normalized = normalizeRole(role);
  if (!normalized) {
    sendError(response, 400, 'Invalid role. Allowed values: student, faculty.');
    return null;
  }

  return normalized;
}

router.get('/:role/:userId/profile', (request, response) => {
  const role = resolveRoleOrFail(response, request.params.role);
  if (!role) {
    return;
  }

  const profile = getSection(role, request.params.userId, 'profile');
  if (!profile) {
    sendError(response, 404, 'Profile not found for user.');
    return;
  }

  response.json(profile);
});

router.put('/:role/:userId/profile', (request, response) => {
  const role = resolveRoleOrFail(response, request.params.role);
  if (!role) {
    return;
  }

  const updated = updateSection(role, request.params.userId, 'profile', request.body || {});
  if (!updated) {
    sendError(response, 404, 'Profile not found for user.');
    return;
  }

  response.json({
    message: 'Profile updated successfully',
    data: updated,
  });
});

router.get('/:role/:userId/notifications', (request, response) => {
  const role = resolveRoleOrFail(response, request.params.role);
  if (!role) {
    return;
  }

  const notifications = getSection(role, request.params.userId, 'notifications');
  if (!notifications) {
    sendError(response, 404, 'Notification preferences not found for user.');
    return;
  }

  response.json(notifications);
});

router.put('/:role/:userId/notifications', (request, response) => {
  const role = resolveRoleOrFail(response, request.params.role);
  if (!role) {
    return;
  }

  const updated = updateSection(role, request.params.userId, 'notifications', request.body || {});
  if (!updated) {
    sendError(response, 404, 'Notification preferences not found for user.');
    return;
  }

  response.json({
    message: 'Notification preferences updated successfully',
    data: updated,
  });
});

router.post('/change-password', (request, response) => {
  const missing = requireFields(request.body, ['userId', 'oldPassword', 'newPassword']);
  if (missing) {
    sendError(response, 400, `${missing} is required.`);
    return;
  }

  const { userId, oldPassword, newPassword } = request.body;
  const existing = getCredential(userId);
  if (!existing) {
    sendError(response, 404, 'User account not found.');
    return;
  }

  if (existing !== oldPassword) {
    sendError(response, 400, 'Current password is incorrect.');
    return;
  }

  if (String(newPassword).length < 8) {
    sendError(response, 400, 'New password must contain at least 8 characters.');
    return;
  }

  updateCredential(userId, newPassword);
  response.json({ message: 'Password changed successfully.' });
});

router.put('/email', (request, response) => {
  const missing = requireFields(request.body, ['userId', 'email']);
  if (missing) {
    sendError(response, 400, `${missing} is required.`);
    return;
  }

  const role = normalizeRole(request.body.role) || inferRoleByUserId(request.body.userId);
  if (!role) {
    sendError(response, 404, 'User account not found for email update.');
    return;
  }

  const updated = updateSection(role, request.body.userId, 'profile', { email: request.body.email });
  if (!updated) {
    sendError(response, 404, 'Profile not found for email update.');
    return;
  }

  response.json({
    message: 'Email updated successfully.',
    data: {
      email: updated.email,
    },
  });
});

router.get('/faculty/:userId/teaching', (request, response) => {
  const teaching = getSection('faculty', request.params.userId, 'teachingPreferences');
  if (!teaching) {
    sendError(response, 404, 'Teaching preferences not found for faculty user.');
    return;
  }

  response.json(teaching);
});

router.put('/faculty/:userId/teaching', (request, response) => {
  const updated = updateSection('faculty', request.params.userId, 'teachingPreferences', request.body || {});
  if (!updated) {
    sendError(response, 404, 'Teaching preferences not found for faculty user.');
    return;
  }

  response.json({
    message: 'Teaching preferences updated successfully',
    data: updated,
  });
});

router.get('/:userId/sessions', (request, response) => {
  const role = inferRoleByUserId(request.params.userId);
  if (!role) {
    sendError(response, 404, 'User not found.');
    return;
  }

  response.json(getSessions(request.params.userId));
});

router.post('/logout-all', (request, response) => {
  const missing = requireFields(request.body, ['userId']);
  if (missing) {
    sendError(response, 400, `${missing} is required.`);
    return;
  }

  const role = inferRoleByUserId(request.body.userId);
  if (!role) {
    sendError(response, 404, 'User not found.');
    return;
  }

  const sessions = logoutAllSessions(request.body.userId);
  response.json({
    message: 'All devices logged out successfully.',
    data: sessions,
  });
});

router.get('/:userId/login-history', (request, response) => {
  const role = inferRoleByUserId(request.params.userId);
  if (!role) {
    sendError(response, 404, 'User not found.');
    return;
  }

  response.json(getLoginHistory(request.params.userId));
});

router.get('/:userId/appearance', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  response.json(user.record.appearance || {});
});

router.put('/:userId/appearance', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  const updated = updateSection(user.role, request.params.userId, 'appearance', request.body || {});
  response.json({
    message: 'Appearance settings updated successfully.',
    data: updated,
  });
});

router.get('/:userId/language', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  response.json(user.record.language || {});
});

router.put('/:userId/language', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  const updated = updateSection(user.role, request.params.userId, 'language', request.body || {});
  response.json({
    message: 'Language & region settings updated successfully.',
    data: updated,
  });
});

router.get('/:userId/privacy', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  response.json(user.record.privacy || {});
});

router.put('/:userId/privacy', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  const updated = updateSection(user.role, request.params.userId, 'privacy', request.body || {});
  response.json({
    message: 'Privacy settings updated successfully.',
    data: updated,
  });
});

router.get('/:userId/accessibility', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  response.json(user.record.accessibility || {});
});

router.put('/:userId/accessibility', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  const updated = updateSection(user.role, request.params.userId, 'accessibility', request.body || {});
  response.json({
    message: 'Accessibility settings updated successfully.',
    data: updated,
  });
});

router.get('/:userId/export-data', (request, response) => {
  const data = exportUserData(request.params.userId);
  if (!data) {
    sendError(response, 404, 'User not found.');
    return;
  }

  response.json({
    fileName: `${request.params.userId}-settings-export.json`,
    data,
  });
});

router.post('/:userId/delete-request', (request, response) => {
  const user = getUserRecord(null, request.params.userId);
  if (!user) {
    sendError(response, 404, 'User not found.');
    return;
  }

  const entry = createDeleteRequest(request.params.userId, user.role, request.body?.reason);
  response.status(201).json({
    message: 'Account deletion request submitted.',
    data: entry,
  });
});

export default router;
