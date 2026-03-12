/**
 * pdfGenerators/styles.js
 * PDF document styles
 */

const config = require('./config');

function getStyles() {
  return {
    header: {
      fontSize: config.fontSize.h1,
      bold: true,
      color: config.colors.primary,
      margin: [0, 0, 0, config.spacing.md]
    },
    subheader: {
      fontSize: config.fontSize.h2,
      bold: true,
      color: config.colors.secondary,
      margin: [0, config.spacing.lg, 0, config.spacing.sm]
    },
    sectionTitle: {
      fontSize: config.fontSize.h3,
      bold: true,
      color: config.colors.primary,
      margin: [0, config.spacing.md, 0, config.spacing.sm]
    },
    label: {
      fontSize: config.fontSize.body,
      bold: true,
      color: config.colors.text
    },
    value: {
      fontSize: config.fontSize.body,
      color: config.colors.text
    },
    small: {
      fontSize: config.fontSize.small,
      color: config.colors.textLight
    },
    warning: {
      fontSize: config.fontSize.body,
      color: config.colors.warning,
      bold: true
    },
    danger: {
      fontSize: config.fontSize.body,
      color: config.colors.danger,
      bold: true
    },
    success: {
      fontSize: config.fontSize.body,
      color: config.colors.success,
      bold: true
    },
    tableHeader: {
      bold: true,
      fontSize: config.fontSize.body,
      color: 'white',
      fillColor: config.colors.primary,
      alignment: 'left'
    }
  };
}

module.exports = { getStyles };
