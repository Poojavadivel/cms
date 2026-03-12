/**
 * pdfGenerators/config.js
 * Configuration for PDF generators
 */

const config = {
  // Spacing system (8px grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },

  // Color palette
  colors: {
    primary: '#1a365d',
    secondary: '#2563eb',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb'
  },

  // Typography
  fontSize: {
    h1: 24,
    h2: 18,
    h3: 14,
    body: 11,
    small: 9
  },

  // Page settings
  page: {
    size: 'A4',
    margins: [50, 80, 50, 80]
  },

  // Fonts configuration
  fonts: {
    Roboto: {
      normal: 'node_modules/pdfmake/build/vfs_fonts.js',
      bold: 'node_modules/pdfmake/build/vfs_fonts.js',
      italics: 'node_modules/pdfmake/build/vfs_fonts.js',
      bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js'
    }
  }
};

module.exports = config;
