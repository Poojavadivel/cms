import { demoUsers, getValidRole } from '../data/roleConfig';

const AUTH_KEYS = ['cmsRole', 'cmsUserId', 'cmsAuthenticated'];

function clearCmsStorage(storage) {
  const keysToRemove = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && key.startsWith('cms')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

export function createUserSession(role, userId) {
  const validRole = getValidRole(role);
  const normalizedUserId = userId.trim();

  localStorage.setItem('cmsRole', validRole);
  localStorage.setItem('cmsUserId', normalizedUserId);
  localStorage.setItem('cmsAuthenticated', 'true');

  sessionStorage.setItem('cmsRole', validRole);
  sessionStorage.setItem('cmsUserId', normalizedUserId);
  sessionStorage.setItem('cmsAuthenticated', 'true');
}

export function destroyUserSession() {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Clear any additional CMS auth/session attributes created in future modules.
  clearCmsStorage(localStorage);
  clearCmsStorage(sessionStorage);
}

export function getUserSession() {
  const role = localStorage.getItem('cmsRole') || sessionStorage.getItem('cmsRole');
  const userId = localStorage.getItem('cmsUserId') || sessionStorage.getItem('cmsUserId');
  const isAuthenticated =
    localStorage.getItem('cmsAuthenticated') === 'true' || sessionStorage.getItem('cmsAuthenticated') === 'true';

  if (!role || !userId || !isAuthenticated) {
    return null;
  }

  if (!Object.prototype.hasOwnProperty.call(demoUsers, role) || demoUsers[role].userId !== userId) {
    return null;
  }

  return {
    role,
    userId,
  };
}

export function hasActiveSession() {
  return Boolean(getUserSession());
}
