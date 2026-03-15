const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';
const CACHE_KEY = 'cms_students_cache';

function getCachedStudents() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedStudents(students) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(students));
  } catch {
    // localStorage full or unavailable
  }
}

export async function fetchStudents() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    if (data.length > 0) {
      setCachedStudents(data);
      return data;
    }
  } catch {
    // Backend unavailable, fall through to cache
  }

  // Fallback: return cached data or import static data
  const cached = getCachedStudents();
  if (cached && cached.length > 0) return cached;

  const { students } = await import('../data/studentData.js');
  setCachedStudents(students);
  return students;
}

export async function fetchStudentById(id) {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Not found');
    return await res.json();
  } catch {
    // Fallback to cache
    const cached = getCachedStudents();
    if (cached) {
      const found = cached.find(s => s.id === id);
      if (found) return found;
    }
    const { getStudentById } = await import('../data/studentData.js');
    return getStudentById(id);
  }
}

export async function createStudent(studentData) {
  try {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    if (!res.ok) throw new Error('Failed to create');
    const created = await res.json();
    // Update cache
    const cached = getCachedStudents() || [];
    setCachedStudents([created, ...cached]);
    return created;
  } catch {
    // Backend unavailable — save to localStorage only
    const cached = getCachedStudents() || [];
    setCachedStudents([studentData, ...cached]);
    return studentData;
  }
}
