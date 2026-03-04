/**
 * pdfGenerators/components.js
 * Reusable PDF components (header, footer, sections)
 */

const config = require('./config');

/**
 * Build header
 */
function buildHeader(title, patientName = null) {
  return function (currentPage, pageCount) {
    return {
      columns: [
        {
          text: 'Movi Innovations',
          style: 'header',
          margin: [50, 30, 0, 0]
        },
        {
          stack: [
            { text: title, style: 'subheader', alignment: 'right' },
            patientName ? { text: patientName, style: 'value', alignment: 'right' } : {}
          ],
          margin: [0, 30, 50, 0]
        }
      ]
    };
  };
}

/**
 * Build footer
 */
function buildFooter() {
  return function (currentPage, pageCount) {
    return {
      columns: [
        {
          text: 'Confidential Medical Document',
          style: 'small',
          margin: [50, 0, 0, 0]
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'right',
          style: 'small',
          margin: [0, 0, 50, 0]
        }
      ],
      margin: [0, 0, 0, 30]
    };
  };
}

/**
 * Build section header
 */
function buildSectionHeader(title) {
  return {
    text: title,
    style: 'sectionTitle'
  };
}

/**
 * Build info row
 */
function buildInfoRow(label, value, options = {}) {
  return {
    columns: [
      { text: label, style: 'label', width: options.labelWidth || 150 },
      { text: value || 'N/A', style: 'value' }
    ],
    margin: [0, 0, 0, config.spacing.xs]
  };
}

/**
 * Build table
 */
function buildTable(headers, rows, options = {}) {
  return {
    table: {
      headerRows: 1,
      widths: options.widths || Array(headers.length).fill('*'),
      body: [
        headers.map(h => ({ text: h, style: 'tableHeader' })),
        ...rows
      ]
    },
    layout: {
      fillColor: function (rowIndex) {
        return rowIndex === 0 ? config.colors.primary : (rowIndex % 2 === 0 ? '#f9fafb' : null);
      },
      hLineWidth: function () { return 1; },
      vLineWidth: function () { return 0; },
      hLineColor: function () { return config.colors.border; }
    },
    margin: [0, 0, 0, config.spacing.md]
  };
}

/**
 * Build divider
 */
function buildDivider() {
  return {
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 1,
        lineColor: config.colors.border
      }
    ],
    margin: [0, config.spacing.md, 0, config.spacing.md]
  };
}

module.exports = {
  buildHeader,
  buildFooter,
  buildSectionHeader,
  buildInfoRow,
  buildTable,
  buildDivider
};
