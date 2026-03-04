/**
 * reports/utils.js
 * Utility functions for report generation
 */

/**
 * Format patient full name
 * @param {Object} patient - Patient object
 * @returns {string} Full name
 */
function formatPatientName(patient) {
  return `${patient.firstName} ${patient.lastName || ''}`.trim();
}

/**
 * Format filename for PDF download
 * @param {string} baseName - Base filename
 * @param {string} suffix - Optional suffix
 * @returns {string} Formatted filename
 */
function formatFilename(baseName, suffix = 'Report') {
  const sanitized = baseName.replace(/\s+/g, '_');
  return `${sanitized}_${suffix}_${Date.now()}.pdf`;
}

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format date to locale string
 * @param {Date} date - Date to format
 * @param {string} locale - Locale (default: 'en-IN')
 * @returns {string} Formatted date
 */
function formatDate(date, locale = 'en-IN') {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString(locale);
}

/**
 * Calculate completion rate percentage
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {string} Percentage string
 */
function calculateCompletionRate(completed, total) {
  if (total === 0) return '0';
  return Math.round((completed / total) * 100).toString();
}

/**
 * Get week start and end dates
 * @param {Date} date - Reference date
 * @returns {Object} Start and end dates
 */
function getWeekDates(date = new Date()) {
  const current = new Date(date);
  const dayOfWeek = current.getDay();
  const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  const startDate = new Date(current.setDate(diff));
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

module.exports = {
  formatPatientName,
  formatFilename,
  calculateAge,
  formatDate,
  calculateCompletionRate,
  getWeekDates
};
