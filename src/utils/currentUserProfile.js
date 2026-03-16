import { useEffect, useMemo, useRef, useState } from 'react';

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

function safeSerialize(value) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
}

function profilesEqual(current, next) {
  return safeSerialize(current) === safeSerialize(next);
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
  const fallbackSignature = useMemo(() => safeSerialize(fallbackProfile), [fallbackProfile]);
  const fallbackRef = useRef(fallbackProfile);
  fallbackRef.current = fallbackProfile;

  const [profile, setProfile] = useState(() => getCurrentUserProfile(role, userId, fallbackRef.current));

  useEffect(() => {
    const nextProfile = getCurrentUserProfile(role, userId, fallbackRef.current);
    setProfile((current) => (profilesEqual(current, nextProfile) ? current : nextProfile));
  }, [fallbackSignature, role, userId]);

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

      const nextProfile = getCurrentUserProfile(role, userId, fallbackRef.current);
      setProfile((current) => (profilesEqual(current, nextProfile) ? current : nextProfile));
    }

    window.addEventListener('storage', syncProfile);
    window.addEventListener(PROFILE_EVENT, syncProfile);

    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener(PROFILE_EVENT, syncProfile);
    };
  }, [role, userId]);

  return profile;
}
