// utils/enterprisePdfGenerator.js
// Enterprise-grade PDF generator for Karur Gastro Foundation HMS
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class EnterprisePdfGenerator {
  constructor() {
    // Professional color scheme
    this.colors = {
      primary: '#1a365d',
      secondary: '#2563eb',
      accent: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      text: {
        primary: '#1f2937',
        secondary: '#6b7280',
        light: '#d1d5db',
        white: '#ffffff'
      },
      background: {
        primary: '#f9fafb',
        secondary: '#f3f4f6',
        accent: '#eff6ff',
        white: '#ffffff'
      },
      borders: {
        light: '#e5e7eb',
        medium: '#d1d5db',
        dark: '#9ca3af'
      }
    };

    // Typography settings (sizes)
    this.fonts = {
      title: 24,
      heading1: 20,
      heading2: 16,
      heading3: 14,
      body: 11,
      small: 9,
      tiny: 8
    };

    // Layout settings
    this.margins = {
      page: { top: 60, bottom: 80, left: 50, right: 50 },
      section: 15,
      item: 8
    };

    // Logo path (if available)
    this.logoPath = path.join(__dirname, '../../assets/karurlogo.png');
  }

  /**
   * Create a new enterprise PDF document
   * (Adds page-dirty tracking and wraps addPage/switchToPage)
   */
  createDocument(title, author = 'Karur Gastro Foundation') {
    const doc = new PDFDocument({
      size: 'A4',
      margins: this.margins.page,
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: title,
        Author: author,
        Subject: 'Medical Report',
        Creator: 'Karur Gastro Foundation HMS',
        Producer: 'MoviLabs Healthcare Management System',
        CreationDate: new Date()
      }
    });

    // --- Page dirty tracking ----------
    doc._enterprisePageHasContent = {};
    doc._enterpriseCurrentPageIndex = 0;
    doc._enterprisePageHasContent[0] = false;

    // Wrap addPage so we track new pages
    const originalAddPage = doc.addPage.bind(doc);
    doc.addPage = (opts) => {
      originalAddPage(opts);
      doc._enterpriseCurrentPageIndex += 1;
      doc._enterprisePageHasContent[doc._enterpriseCurrentPageIndex] = false;
      return doc;
    };

    // Wrap switchToPage to keep index in sync
    const originalSwitchToPage = doc.switchToPage.bind(doc);
    doc.switchToPage = (i) => {
      originalSwitchToPage(i);
      doc._enterpriseCurrentPageIndex = i;
      if (doc._enterprisePageHasContent[i] === undefined) doc._enterprisePageHasContent[i] = false;
    };
    // -----------------------------------

    return doc;
  }

  /**
   * Internal: mark the current page as having content
   */
  _markPageDirty(doc) {
    if (!doc || typeof doc._enterpriseCurrentPageIndex !== 'number') return;
    doc._enterprisePageHasContent[doc._enterpriseCurrentPageIndex] = true;
  }

  /**
   * Add professional header with logo and branding
   * Returns generated reference number for record-keeping
   */
  addHeader(doc, options = {}) {
    const {
      title = 'Medical Report',
      subtitle = 'Karur Gastro Foundation',
      reportType = 'Confidential Medical Document',
      showLogo = true
    } = options;

    const pageWidth = doc.page.width;
    const left = this.margins.page.left;
    const right = this.margins.page.right;
    const headerHeight = 100;
    const effectiveWidth = pageWidth - left - right;

    doc.save();

    // Header background (two-toned)
    doc.rect(0, 0, pageWidth, headerHeight).fill(this.colors.primary);
    doc.rect(0, headerHeight - 22, pageWidth, 22).fill(this.colors.secondary);

    // Logo (if exists)
    const logoX = left;
    const logoY = 18;
    const logoSize = 60;
    let logoUsedWidth = 0;
    if (showLogo && fs.existsSync(this.logoPath)) {
      try {
        doc.image(this.logoPath, logoX, logoY, { width: logoSize, height: logoSize });
        logoUsedWidth = logoSize + 10;
      } catch (err) {
        logoUsedWidth = 0;
      }
    }

    // Title & subtitle block (left)
    doc.fillColor(this.colors.text.white);
    const leftTextX = left + logoUsedWidth;
    const leftTextWidth = effectiveWidth * 0.55 - logoUsedWidth;

    doc.font('Helvetica-Bold')
       .fontSize(18)
       .text(subtitle, leftTextX, 22, { width: leftTextWidth, align: 'left' });

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(this.colors.text.light)
       .text('Healthcare Management System', leftTextX, 46, { width: leftTextWidth, align: 'left' });

    // Right-side report title & meta
    const rightBlockWidth = effectiveWidth * 0.45;
    const rightX = pageWidth - right - rightBlockWidth;

    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor(this.colors.text.white)
       .text(title, rightX, 20, { width: rightBlockWidth, align: 'right' });

    doc.font('Helvetica')
       .fontSize(9)
       .fillColor(this.colors.text.light)
       .text(reportType, rightX, 44, { width: rightBlockWidth, align: 'right' });

    // Generation date/time & reference number (small, bottom of header)
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    });

    doc.font('Helvetica')
       .fontSize(8)
       .fillColor(this.colors.text.light)
       .text(`Generated: ${dateStr} at ${timeStr}`, left, headerHeight - 18, { width: effectiveWidth * 0.5, align: 'left' });

    const refNumber = `HMS-${Date.now().toString(36).toUpperCase()}`;
    doc.text(`Ref: ${refNumber}`, rightX, headerHeight - 18, { width: rightBlockWidth, align: 'right' });

    doc.restore();

    // Position content start below header
    doc.y = headerHeight + 10;
    doc.fillColor(this.colors.text.primary);

    // Mark page dirty because header draws on page
    this._markPageDirty(doc);

    return refNumber;
  }

  /**
   * Add professional footer with page numbers and branding
   */
  addFooter(doc, pageNumber, totalPages) {
    const pageWidth = doc.page.width;
    const left = this.margins.page.left;
    const right = this.margins.page.right;
    const footerY = doc.page.height - this.margins.page.bottom + 10;

    doc.save();

    // Thin divider line
    doc.strokeColor(this.colors.borders.light)
       .lineWidth(0.5)
       .moveTo(left, footerY)
       .lineTo(pageWidth - right, footerY)
       .stroke();

    // Left block: hospital name + small
    doc.font('Helvetica-Bold').fontSize(this.fonts.small)
       .fillColor(this.colors.text.secondary)
       .text('Karur Gastro Foundation', left, footerY + 6);

    doc.font('Helvetica').fontSize(this.fonts.tiny)
       .fillColor(this.colors.text.light)
       .text('Hospital & Diagnostic Center', left, footerY + 20);

    // Center: confidentiality notice
    const centerWidth = pageWidth - left - right;
    doc.font('Helvetica').fontSize(this.fonts.tiny)
       .fillColor(this.colors.text.light)
       .text('CONFIDENTIAL MEDICAL DOCUMENT - For Authorized Personnel Only', left, footerY + 36, {
         width: centerWidth,
         align: 'center'
       });

    // Right: page number + website
    const rightBlockX = pageWidth - right - 120;
    doc.font('Helvetica').fontSize(this.fonts.small)
       .fillColor(this.colors.text.secondary)
       .text(`Page ${pageNumber} of ${totalPages}`, rightBlockX, footerY + 6, { width: 120, align: 'right' });

    doc.font('Helvetica').fontSize(this.fonts.tiny)
       .fillColor(this.colors.text.light)
       .text('www.karurgastro.com', rightBlockX, footerY + 22, { width: 120, align: 'right' });

    doc.restore();

    // Mark page dirty (footer drawing counts as content, but we generally will only call addFooter for dirty pages)
    this._markPageDirty(doc);
  }

  /**
   * Add section header with background bar and proper margin math
   */
  addSectionHeader(doc, title, icon = '', options = {}) {
    const {
      color = this.colors.primary,
      fontSize = this.fonts.heading2,
      marginTop = 12,
      marginBottom = 8
    } = options;

    const barHeight = 24;
    this.checkPageBreak(doc, barHeight + marginTop + marginBottom);

    doc.y += marginTop;
    const startY = doc.y;

    const barX = this.margins.page.left;
    const barWidth = doc.page.width - this.margins.page.left - this.margins.page.right;

    // Background and text aligned properly
    doc.save();
    if (typeof doc.roundedRect === 'function') {
      doc.roundedRect(barX, startY, barWidth, barHeight, 3).fill(this.colors.background.accent);
    } else {
      doc.rect(barX, startY, barWidth, barHeight).fill(this.colors.background.accent);
    }
    doc.restore();

    // Text vertically centered in bar
    const textY = startY + (barHeight - fontSize) / 2;
    doc.font('Helvetica-Bold')
       .fontSize(fontSize)
       .fillColor(color)
       .text(title.toUpperCase(), barX + 6, textY, {
         width: barWidth - 12,
         align: 'left'
       });

    doc.font('Helvetica')
       .fontSize(this.fonts.body)
       .fillColor(this.colors.text.primary);

    doc.y = startY + barHeight + marginBottom;

    this._markPageDirty(doc);
  }

  /**
   * Add key-value information row with professional styling
   */
  addInfoRow(doc, label, value, options = {}) {
    const {
      labelWidth = 150,
      valueColor = this.colors.text.primary,
      labelColor = this.colors.text.secondary,
      fontSize = this.fonts.body,
      marginBottom = 4
    } = options;

    const startX = this.margins.page.left;
    const valueX = startX + labelWidth;
    const valueWidth = doc.page.width - this.margins.page.right - valueX;
    
    // Calculate actual height needed
    const valueHeight = doc.heightOfString(value || 'N/A', { 
      width: valueWidth, 
      fontSize,
      lineGap: 0
    });
    const rowHeight = Math.max(fontSize + 2, valueHeight);
    
    this.checkPageBreak(doc, rowHeight + marginBottom);

    const startY = doc.y;

    // Label (always single line, top-aligned)
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(labelColor)
       .text(label + ':', startX, startY, { 
         width: labelWidth - 4, 
         align: 'left',
         lineBreak: false 
       });

    // Value (can be multi-line)
    doc.font('Helvetica').fontSize(fontSize).fillColor(valueColor)
       .text(value || 'N/A', valueX, startY, {
         width: valueWidth,
         lineGap: 0,
         align: 'left'
       });

    doc.y = startY + rowHeight + marginBottom;

    this._markPageDirty(doc);
  }

  /**
   * Add professional table with alternating rows
   * Smart about page breaks and column widths
   */
  addTable(doc, headers, rows, options = {}) {
    const {
      headerBg = this.colors.primary,
      headerText = this.colors.text.white,
      rowHeight = 24,
      fontSize = this.fonts.small,
      columnWidths = null
    } = options;

    // Compute table geometry
    const tableLeft = this.margins.page.left;
    const tableRight = this.margins.page.right;
    const tableWidth = doc.page.width - tableLeft - tableRight;
    const colWidths = columnWidths || headers.map(() => tableWidth / headers.length);

    // Estimate height - header + rows
    const estimatedHeight = rowHeight * (rows.length + 1) + 24;
    // If doesn't fit, add page (checkPageBreak will add only when necessary)
    this.checkPageBreak(doc, estimatedHeight);

    let y = doc.y;

    // Draw header background & text
    doc.save();
    doc.rect(tableLeft, y, tableWidth, rowHeight).fill(headerBg);
    doc.fillColor(headerText);

    let x = tableLeft;
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(fontSize)
         .text(h, x + 6, y + 6, { width: colWidths[i] - 12, align: 'left' });
      x += colWidths[i];
    });
    doc.restore();

    y += rowHeight;

    // Draw rows
    rows.forEach((row, rowIndex) => {
      // If next row would exceed page bottom, add page and re-render header
      if (y + rowHeight + this.margins.page.bottom > doc.page.height) {
        doc.addPage();
        doc.y = this.margins.page.top;
        y = doc.y;
        // Re-draw header on new page
        doc.save();
        doc.rect(tableLeft, y, tableWidth, rowHeight).fill(headerBg);
        doc.fillColor(headerText);
        x = tableLeft;
        headers.forEach((h, i) => {
          doc.font('Helvetica-Bold').fontSize(fontSize)
             .text(h, x + 6, y + 6, { width: colWidths[i] - 12, align: 'left' });
          x += colWidths[i];
        });
        doc.restore();
        y += rowHeight;
      }

      // Alternating background
      if (rowIndex % 2 === 0) {
        doc.rect(tableLeft, y, tableWidth, rowHeight).fill(this.colors.background.primary);
      }

      // row borders (stroke)
      doc.save();
      doc.lineWidth(0.4).strokeColor(this.colors.borders.light)
         .rect(tableLeft, y, tableWidth, rowHeight).stroke();
      doc.restore();

      // cells
      x = tableLeft;
      row.forEach((cell, i) => {
        doc.font('Helvetica').fontSize(fontSize).fillColor(this.colors.text.primary);
        const cellText = (cell === null || cell === undefined) ? '-' : String(cell);
        doc.text(cellText, x + 6, y + 6, {
          width: colWidths[i] - 12,
          align: 'left',
          ellipsis: true
        });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    // Set doc.y to after table and add small spacing
    doc.y = y + 12;

    // Mark page dirty
    this._markPageDirty(doc);
  }

  /**
   * Add statistics cards (like dashboard cards)
   */
  addStatsCards(doc, stats, options = {}) {
    const {
      cardsPerRow = 4,
      cardHeight = 68,
      marginBottom = 12,
      cardSpacing = 8
    } = options;

    const availableWidth = doc.page.width - this.margins.page.left - this.margins.page.right;
    const cardWidth = (availableWidth - (cardsPerRow - 1) * cardSpacing) / cardsPerRow;
    
    const rows = Math.ceil(stats.length / cardsPerRow);
    const totalHeight = rows * cardHeight + (rows - 1) * cardSpacing;
    
    this.checkPageBreak(doc, totalHeight + marginBottom);

    const startY = doc.y;

    stats.forEach((stat, index) => {
      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);

      const x = this.margins.page.left + col * (cardWidth + cardSpacing);
      const y = startY + row * (cardHeight + cardSpacing);

      // Card background & border
      doc.save();
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(x, y, cardWidth, cardHeight, 6).fill(this.colors.background.white);
      } else {
        doc.rect(x, y, cardWidth, cardHeight).fill(this.colors.background.white);
      }
      doc.lineWidth(0.8).strokeColor(this.colors.borders.medium).rect(x, y, cardWidth, cardHeight).stroke();
      doc.restore();

      // Colored top bar
      const color = stat.color || this.colors.secondary;
      doc.rect(x, y, cardWidth, 3).fill(color);

      // Value
      const valueSize = this.fonts.heading1;
      doc.font('Helvetica-Bold').fontSize(valueSize).fillColor(this.colors.text.primary)
         .text(String(stat.value), x + 8, y + 14, { width: cardWidth - 16, align: 'center' });

      // Label
      doc.font('Helvetica').fontSize(this.fonts.small).fillColor(this.colors.text.secondary)
         .text(stat.label, x + 8, y + 42, { width: cardWidth - 16, align: 'center' });
    });

    doc.y = startY + totalHeight + marginBottom;

    this._markPageDirty(doc);
  }

  /**
   * Add alert box (for important information like allergies)
   */
  addAlertBox(doc, text, options = {}) {
    const {
      type = 'warning', // 'info', 'warning', 'danger', 'success'
      marginTop = 12,
      marginBottom = 12
    } = options;

    const themes = {
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
      warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
      danger: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      success: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' }
    };
    const theme = themes[type] || themes.warning;

    // Ensure space
    this.checkPageBreak(doc, 80);

    const startY = doc.y + marginTop;
    const boxLeft = this.margins.page.left;
    const boxWidth = doc.page.width - this.margins.page.left - this.margins.page.right;
    const padding = 12;

    // Calculate text height to determine box height dynamically
    const textWidth = boxWidth - padding * 2 - 6; // leave space for left border
    const textHeight = doc.heightOfString(text, { width: textWidth, fontSize: this.fonts.body, lineGap: 2 });
    const boxHeight = Math.max(44, textHeight + padding * 2);

    // Background and left border
    doc.save();
    if (typeof doc.roundedRect === 'function') {
      doc.roundedRect(boxLeft, startY, boxWidth, boxHeight, 6).fill(theme.bg);
    } else {
      doc.rect(boxLeft, startY, boxWidth, boxHeight).fill(theme.bg);
    }
    doc.rect(boxLeft, startY, 6, boxHeight).fill(theme.border);
    doc.restore();

    // Text content
    const textX = boxLeft + 10 + 6;
    const textY = startY + padding;
    doc.font('Helvetica-Bold').fontSize(this.fonts.body).fillColor(theme.text)
       .text('IMPORTANT: ', textX, textY, { continued: true });
    doc.font('Helvetica').fillColor(this.colors.text.primary)
       .text(text, { width: textWidth, continued: false });

    doc.y = startY + boxHeight + marginBottom;

    // Mark page dirty
    this._markPageDirty(doc);
  }

  /**
   * Add divider line
   */
  addDivider(doc, options = {}) {
    const {
      marginTop = 12,
      marginBottom = 12,
      color = this.colors.borders.light
    } = options;

    doc.y += marginTop;
    doc.moveTo(this.margins.page.left, doc.y)
       .lineTo(doc.page.width - this.margins.page.right, doc.y)
       .strokeColor(color)
       .lineWidth(0.8)
       .stroke();
    doc.y += marginBottom;

    // Mark page dirty
    this._markPageDirty(doc);
  }

  /**
   * Smart page break - only adds page when content actually won't fit
   */
  checkPageBreak(doc, requiredSpace = 100) {
    const remainingSpace = doc.page.height - this.margins.page.bottom - doc.y;
    if (remainingSpace < requiredSpace + 20) {
      doc.addPage();
      doc.y = this.margins.page.top;
      return true;
    }
    return false;
  }

  /**
   * Smarter check for text content - measures actual height needed
   */
  checkTextPageBreak(doc, text, options = {}) {
    const { width = doc.page.width - this.margins.page.left - this.margins.page.right, fontSize = this.fonts.body, lineGap = 2 } = options;
    const heightNeeded = doc.heightOfString(text, { width, fontSize, lineGap }) + 10;
    return this.checkPageBreak(doc, heightNeeded);
  }

  /**
   * Finalize document with page numbers
   * Adds footers only to pages that had content, and logs debug info when DEBUG_PDF env variable is set
   */
  finalize(doc) {
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    if (process.env.DEBUG_PDF) {
      console.log('Total buffered pages:', totalPages);
      console.log('Page content map:', doc._enterprisePageHasContent);
    }

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      const hasContent = !!(doc._enterprisePageHasContent && doc._enterprisePageHasContent[i]);
      if (hasContent) {
        this.addFooter(doc, i + 1, totalPages);
      } else {
        // skip footers on truly blank pages to avoid confusion
        if (process.env.DEBUG_PDF) {
          console.log(`Skipping footer for blank page ${i}`);
        }
      }
    }

    doc.end();
  }
}

module.exports = new EnterprisePdfGenerator();
