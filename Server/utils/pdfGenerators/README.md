# PDF Generators Module - Enterprise Architecture

## Overview
Modular PDF generation system using pdfmake. Refactored from monolithic 1,404-line `properPdfGenerator.js` into 5 focused components.

**Location:** `utils/pdfGenerators/`

## Architecture

```
pdfGenerators/
├── config.js                  # Configuration & constants
├── styles.js                  # PDF styles definitions
├── components.js              # Reusable PDF components
├── ProperPdfGenerator.js      # Main generator class
├── index.js                   # Entry point & exports
├── README.md                  # This file
└── properPdfGenerator.js.backup  # Original file backup
```

## Module Responsibilities

### 1. **config.js** - Configuration
- Spacing system (8px grid)
- Color palette
- Typography (font sizes)
- Page settings
- Fonts configuration

### 2. **styles.js** - Styles
- Document styles
- Header, subheader, section styles
- Table styles
- Text styles (label, value, small, warning, danger, success)

### 3. **components.js** - Reusable Components
- `buildHeader` - Page header with title
- `buildFooter` - Page footer with page numbers
- `buildSectionHeader` - Section title
- `buildInfoRow` - Label-value row
- `buildTable` - Data table
- `buildDivider` - Horizontal divider line

### 4. **ProperPdfGenerator.js** - Main Class
- `generatePatientReport` - Patient medical report
- `generateDoctorReport` - Doctor performance report
- `createPdf` - Create PDF from document definition
- Private methods for building sections

### 5. **index.js** - Entry Point
- Exports singleton instance
- Exports class for custom instances
- Exports configuration and utilities

## Features

### 📄 Patient Medical Report
- Patient information section
- Vital signs
- Allergies (highlighted if present)
- Current prescriptions
- Appointment history table
- Clinical notes

### 📊 Doctor Performance Report
- Doctor information
- Performance metrics
- Completion rate calculation
- Appointments table
- Patients list

### 🎨 Design System
- Consistent 8px grid spacing
- Professional color palette
- Responsive typography
- Clean, modern layout

## Usage

### Basic Usage (Singleton)
```javascript
const pdfGen = require('./utils/pdfGenerators');

// Generate patient report
const docDef = pdfGen.generatePatientReport(patient, doctor, appointments);
const pdf = pdfGen.createPdf(docDef);

// Stream to response
pdf.pipe(res);
pdf.end();
```

### Using Custom Instance
```javascript
const { ProperPdfGenerator } = require('./utils/pdfGenerators');

const generator = new ProperPdfGenerator();
const docDef = generator.generatePatientReport(patient, doctor, appointments);
const pdf = generator.createPdf(docDef);
```

### Using Components Directly
```javascript
const { components, config } = require('./utils/pdfGenerators');

const content = [
  components.buildSectionHeader('My Section'),
  components.buildInfoRow('Label', 'Value'),
  components.buildTable(['H1', 'H2'], [['R1C1', 'R1C2']]),
  components.buildDivider()
];

const docDef = {
  pageSize: config.page.size,
  pageMargins: config.page.margins,
  content,
  header: components.buildHeader('My Report'),
  footer: components.buildFooter()
};
```

## API

### ProperPdfGenerator Class

#### Methods

**generatePatientReport(patient, doctor, appointments)**
- Generates patient medical report
- Returns: document definition object

**generateDoctorReport(doctor, appointments, patients, dateRange)**
- Generates doctor performance report
- Returns: document definition object

**createPdf(docDefinition)**
- Creates PDF from document definition
- Returns: pdfKit document stream

### Components

**buildHeader(title, patientName)**
- Creates page header
- Returns: header function

**buildFooter()**
- Creates page footer with page numbers
- Returns: footer function

**buildSectionHeader(title)**
- Creates section header
- Returns: section object

**buildInfoRow(label, value, options)**
- Creates label-value row
- Options: `{ labelWidth: number }`
- Returns: row object

**buildTable(headers, rows, options)**
- Creates formatted table
- Options: `{ widths: array }`
- Returns: table object

**buildDivider()**
- Creates horizontal divider
- Returns: divider object

## Configuration

### Spacing (8px Grid)
```javascript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
}
```

### Colors
```javascript
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
}
```

### Font Sizes
```javascript
fontSize: {
  h1: 24,
  h2: 18,
  h3: 14,
  body: 11,
  small: 9
}
```

## Styles Available

- `header` - Large bold header
- `subheader` - Medium bold subheader
- `sectionTitle` - Section title
- `label` - Bold label text
- `value` - Regular value text
- `small` - Small light text
- `warning` - Warning text (orange)
- `danger` - Danger text (red)
- `success` - Success text (green)
- `tableHeader` - Table header style

## Statistics

| Metric | Value |
|--------|-------|
| **Original File** | 1,404 lines |
| **Total Modules** | 5 files |
| **Average Module Size** | ~280 lines |
| **Largest Module** | ProperPdfGenerator.js (280 lines) |
| **Total Documentation** | This README |

## Benefits

✅ **Modular** - Separated concerns (config, styles, components, logic)  
✅ **Reusable** - Components can be used independently  
✅ **Maintainable** - Easy to update styles or add features  
✅ **Testable** - Each module can be unit tested  
✅ **Consistent** - Design system enforced through config  
✅ **Well-documented** - Clear API and examples  

## Migration from Old File

Old code:
```javascript
const pdfGen = require('./utils/properPdfGenerator');
```

New code (no changes needed):
```javascript
const pdfGen = require('./utils/pdfGenerators');
// Works exactly the same - backward compatible!
```

## Support

- **Documentation**: This README
- **Code**: Check specific module for implementation
- **Backup**: properPdfGenerator.js.backup for reference

---

**Last Updated:** 2026-03-04  
**Version:** 2.0.0 (Modularized)  
**Module Count:** 5 files
