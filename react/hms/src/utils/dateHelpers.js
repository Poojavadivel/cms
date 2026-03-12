/**
 * dateHelpers.js
 * Date and time utility functions
 * React equivalent of Flutter's date formatting methods
 */

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format date to readable format (e.g., "Dec 15, 2025")
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
export const formatDateLong = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time to HH:MM
 * @param {string} time - Time string (HH:MM or HH:MM AM/PM)
 * @returns {string} Formatted time string
 */
export const formatTimeShort = (time) => {
  if (!time) return '';
  
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // Parse time with AM/PM
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return time;
  
  let hour = parseInt(match[1]);
  const minute = match[2];
  const meridiem = match[3];
  
  if (meridiem) {
    if (meridiem.toUpperCase() === 'PM' && hour < 12) {
      hour += 12;
    } else if (meridiem.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
  }
  
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

/**
 * Format time to 12-hour format with AM/PM
 * @param {string} time - Time string (HH:MM)
 * @returns {string} Formatted time string (HH:MM AM/PM)
 */
export const formatTime12Hour = (time) => {
  if (!time) return '';
  
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;
  
  let hour = parseInt(match[1]);
  const minute = match[2];
  
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  
  return `${hour}:${minute} ${meridiem}`;
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export const getCurrentDate = () => {
  return formatDateShort(new Date());
};

/**
 * Get current time in HH:MM format
 * @returns {string} Current time
 */
export const getCurrentTime = () => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return d < today;
};

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFuture = (date) => {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return d > today;
};

/**
 * Get date difference in days
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Difference in days
 */
export const getDateDifference = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Add days to date
 * @param {Date|string} date - Date to add to
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Format date for input[type="date"]
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
export const formatForDateInput = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return formatDateShort(d);
};

/**
 * Format time for input[type="time"]
 * @param {string} time - Time to format
 * @returns {string} Formatted time (HH:MM)
 */
export const formatForTimeInput = (time) => {
  if (!time) return '';
  
  return formatTimeShort(time);
};

/**
 * Parse date from various formats
 * @param {string} dateStr - Date string
 * @returns {Date|null} Parsed date or null
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Get day name from date
 * @param {Date|string} date - Date object or string
 * @returns {string} Day name (e.g., "Monday")
 */
export const getDayName = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Get month name from date
 * @param {Date|string} date - Date object or string
 * @returns {string} Month name (e.g., "January")
 */
export const getMonthName = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-US', { month: 'long' });
};

export default {
  formatDateShort,
  formatDateLong,
  formatTimeShort,
  formatTime12Hour,
  getCurrentDate,
  getCurrentTime,
  isToday,
  isPast,
  isFuture,
  getDateDifference,
  addDays,
  formatForDateInput,
  formatForTimeInput,
  parseDate,
  getDayName,
  getMonthName
};
