// utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.primaryColor = '#2563eb'; // Blue
    this.secondaryColor = '#1e40af'; // Dark blue
    this.accentColor = '#3b82f6'; // Light blue
    this.textColor = '#1f2937';
    this.lightGray = '#f3f4f6';
    this.borderColor = '#e5e7eb';
  }

  // Add header with MoviLabs branding
  addHeader(doc, title) {
    // Background header bar
    doc.rect(0, 0, doc.page.width, 120).fill(this.primaryColor);

    // Company Logo/Name
    doc.fontSize(28)
       .fillColor('#ffffff')
       .text('MoviLabs', 50, 30);

    doc.fontSize(12)
       .fillColor('#ffffff')
       .text('Healthcare Management System', 50, 65);

    // Report Title
    doc.fontSize(20)
       .fillColor('#ffffff')
       .text(title, 50, 85, { align: 'left' });

    // Date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    doc.fontSize(10)
       .fillColor('#ffffff')
       .text(`Generated on: ${dateStr} at ${timeStr}`, doc.page.width - 250, 40);

    // Reset position after header
    doc.y = 140;
    doc.fillColor(this.textColor);
  }

  // Add footer with page numbers
  addFooter(doc, pageNumber, totalPages) {
    const footerY = doc.page.height - 50;
    
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text(
         `Karur Gastro Foundation | Confidential Medical Report`,
         50,
         footerY,
         { align: 'center', width: doc.page.width - 100 }
       );

    doc.fontSize(9)
       .fillColor('#6b7280')
       .text(
         `Page ${pageNumber} of ${totalPages}`,
         0,
         footerY + 15,
         { align: 'center' }
       );
  }

  // Add section header
  addSectionHeader(doc, title, icon = '') {
    const y = doc.y;
    
    // Background box
    doc.rect(50, y, doc.page.width - 100, 35)
       .fill(this.lightGray);

    // Section title
    doc.fontSize(14)
       .fillColor(this.primaryColor)
       .text(icon + ' ' + title, 60, y + 10);

    doc.y = y + 45;
    doc.fillColor(this.textColor);
  }

  // Add info row
  addInfoRow(doc, label, value, options = {}) {
    const y = doc.y;
    const labelWidth = options.labelWidth || 150;
    const valueX = options.valueX || 210;

    doc.fontSize(11)
       .fillColor('#6b7280')
       .text(label + ':', 60, y, { width: labelWidth, continued: false });

    doc.fontSize(11)
       .fillColor(this.textColor)
       .text(value || 'N/A', valueX, y, { width: doc.page.width - valueX - 60 });

    doc.y = y + 20;
  }

  // Add table
  addTable(doc, headers, rows, options = {}) {
    const startX = options.startX || 50;
    const tableWidth = options.tableWidth || (doc.page.width - 100);
    const columnWidths = options.columnWidths || headers.map(() => tableWidth / headers.length);
    const rowHeight = options.rowHeight || 30;

    // Check if we need page break for header + first few rows
    const estimatedHeight = (Math.min(rows.length, 3) + 1) * rowHeight;
    this.checkPageBreak(doc, estimatedHeight);

    const startY = doc.y;

    // Draw header
    let currentX = startX;
    doc.rect(startX, startY, tableWidth, rowHeight).fill(this.primaryColor);

    headers.forEach((header, i) => {
      doc.fontSize(11)
         .fillColor('#ffffff')
         .text(header, currentX + 5, startY + 8, {
           width: columnWidths[i] - 10,
           align: 'left'
         });
      currentX += columnWidths[i];
    });

    // Draw rows
    let currentY = startY + rowHeight;
    rows.forEach((row, rowIndex) => {
      const fillColor = rowIndex % 2 === 0 ? '#ffffff' : this.lightGray;
      doc.rect(startX, currentY, tableWidth, rowHeight).fill(fillColor);

      currentX = startX;
      row.forEach((cell, i) => {
        doc.fontSize(10)
           .fillColor(this.textColor)
           .text(cell?.toString() || '', currentX + 5, currentY + 8, {
             width: columnWidths[i] - 10,
             align: 'left'
           });
        currentX += columnWidths[i];
      });

      currentY += rowHeight;
    });

    // Draw border
    doc.rect(startX, startY, tableWidth, (rows.length + 1) * rowHeight)
       .stroke(this.borderColor);

    doc.y = currentY + 20;
  }

  // Add statistics cards
  addStatsCards(doc, stats) {
    const y = doc.y;
    const cardWidth = (doc.page.width - 140) / stats.length;
    let currentX = 50;

    stats.forEach((stat, index) => {
      // Card background
      doc.roundedRect(currentX, y, cardWidth - 10, 80, 5)
         .fill('#ffffff')
         .stroke(this.borderColor);

      // Icon/Number background
      doc.circle(currentX + cardWidth / 2 - 5, y + 25, 20)
         .fill(this.primaryColor);

      // Value
      doc.fontSize(24)
         .fillColor(this.primaryColor)
         .text(stat.value.toString(), currentX, y + 15, {
           width: cardWidth - 10,
           align: 'center'
         });

      // Label
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text(stat.label, currentX, y + 55, {
           width: cardWidth - 10,
           align: 'center'
         });

      currentX += cardWidth;
    });

    doc.y = y + 100;
  }

  // Check if we need a new page
  checkPageBreak(doc, requiredSpace = 40) {
    if (doc.y + requiredSpace > doc.page.height - 80) {
      doc.addPage();
      doc.y = 50;
      return true;
    }
    return false;
  }
  
  // Add page numbers to all pages
  finalize(doc) {
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      this.addFooter(doc, i + 1, totalPages);
    }

    doc.end();
  }
}

module.exports = new PDFGenerator();
