import { useEffect, useState } from 'react';

const PROFILE_EVENT = 'cms-profile-updated';

function getProfileStorageKey(role, userId) {
  return `cmsProfile:${role}:${userId}`;
}

function mergeProfile(fallbackProfile, storedProfile) {
  if (!storedProfile) {
    return fallbackProfile;
  }

  return {
    ...fallbackProfile,
    ...storedProfile,
  };
}

export function getCurrentUserProfile(role, userId, fallbackProfile = {}) {
  if (!role || !userId || typeof window === 'undefined') {
    return fallbackProfile;
  }

  try {
    const rawProfile = window.localStorage.getItem(getProfileStorageKey(role, userId));
    if (!rawProfile) {
      return fallbackProfile;
    }

    const parsedProfile = JSON.parse(rawProfile);
    return mergeProfile(fallbackProfile, parsedProfile);
  } catch {
    return fallbackProfile;
  }
}

export function saveCurrentUserProfile(role, userId, profile) {
  if (!role || !userId || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getProfileStorageKey(role, userId), JSON.stringify(profile));
  window.dispatchEvent(
    new window.CustomEvent(PROFILE_EVENT, {
      detail: { role, userId, profile },
    })
  );
}

export function useCurrentUserProfile(role, userId, fallbackProfile = {}) {
  const [profile, setProfile] = useState(() => getCurrentUserProfile(role, userId, fallbackProfile));

  useEffect(() => {
    setProfile(getCurrentUserProfile(role, userId, fallbackProfile));
  }, [fallbackProfile, role, userId]);

  useEffect(() => {
    function syncProfile(event) {
      if (event?.type === 'storage') {
        const expectedKey = getProfileStorageKey(role, userId);
        if (event.key && event.key !== expectedKey) {
          return;
        }
      }

      if (event?.type === PROFILE_EVENT) {
        const detail = event.detail || {};
        if (detail.role !== role || detail.userId !== userId) {
          return;
        }
      }

      setProfile(getCurrentUserProfile(role, userId, fallbackProfile));
    }

    window.addEventListener('storage', syncProfile);
    window.addEventListener(PROFILE_EVENT, syncProfile);

    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener(PROFILE_EVENT, syncProfile);
    };
  }, [fallbackProfile, role, userId]);

  return profile;
}