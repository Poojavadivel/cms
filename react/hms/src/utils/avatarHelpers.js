/**
 * avatarHelpers.js
 * Avatar utility functions
 * React equivalent of Flutter's gender-based avatar mapping
 */

/**
 * Get avatar asset based on gender
 * @param {string} gender - Gender string (Male, Female, M, F, etc.)
 * @returns {string} Avatar image path
 */
export const getGenderAvatar = (gender) => {
  if (!gender) return '/boyicon.png'; // Default to male icon
  
  const g = gender.toLowerCase().trim();
  
  // Check for female variations
  if (g.includes('female') || g.startsWith('f') || g === 'woman' || g === 'girl') {
    return '/girlicon.png';
  }
  
  // Default to male icon
  return '/boyicon.png';
};

/**
 * Get avatar color based on gender
 * @param {string} gender - Gender string
 * @returns {string} Color hex code
 */
export const getGenderColor = (gender) => {
  if (!gender) return '#3b82f6'; // Default blue
  
  const g = gender.toLowerCase().trim();
  
  // Female - Pink
  if (g.includes('female') || g.startsWith('f')) {
    return '#ec4899';
  }
  
  // Male - Blue
  return '#3b82f6';
};

/**
 * Get avatar initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (up to 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '??';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Get avatar background color from name (consistent color for same name)
 * @param {string} name - Name string
 * @returns {string} Color hex code
 */
export const getAvatarColorFromName = (name) => {
  if (!name) return '#64748b'; // Default gray
  
  const colors = [
    '#ef4444', // red
    '#f59e0b', // orange
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  
  // Generate consistent hash from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Check if avatar URL is valid
 * @param {string} url - Avatar URL
 * @returns {boolean} True if valid
 */
export const isValidAvatarUrl = (url) => {
  if (!url) return false;
  
  // Check if it's a valid URL or path
  return url.startsWith('http') || url.startsWith('/') || url.startsWith('data:');
};

/**
 * Get avatar fallback based on priority
 * Priority: avatarUrl > genderAvatar > initials
 * @param {Object} options - Avatar options
 * @param {string} options.avatarUrl - Avatar URL
 * @param {string} options.gender - Gender
 * @param {string} options.name - Name
 * @returns {Object} Avatar config { type, value }
 */
export const getAvatarConfig = ({ avatarUrl, gender, name }) => {
  // Priority 1: Custom avatar URL
  if (isValidAvatarUrl(avatarUrl)) {
    return {
      type: 'image',
      value: avatarUrl
    };
  }
  
  // Priority 2: Gender-based avatar
  if (gender) {
    return {
      type: 'image',
      value: getGenderAvatar(gender)
    };
  }
  
  // Priority 3: Initials
  if (name) {
    return {
      type: 'initials',
      value: getInitials(name),
      color: getAvatarColorFromName(name)
    };
  }
  
  // Fallback: Default avatar
  return {
    type: 'image',
    value: '/boyicon.png'
  };
};

const helpers = {
  getGenderAvatar,
  getGenderColor,
  getInitials,
  getAvatarColorFromName,
  isValidAvatarUrl,
  getAvatarConfig
};

export default helpers;
