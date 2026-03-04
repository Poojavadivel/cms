# Reports Module - Enterprise Architecture

## Overview
Enterprise-grade PDF report generation system for hospital management. Refactored from monolithic 1,057-line `enterpriseReports.js` into 8 modular components.

**Note:** This module is directly imported in Server.js. All code resides within this reports/ folder.

## Server.js Integration

```javascript
// In Server.js
app.use('/api/reports', require('./routes/reports/routes'));
```

## Architecture

```
reports/
├── config.js                      # Configuration & constants
├── utils.js                       # Utility functions
├── dataService.js                 # Data fetching service
├── patientReportGenerator.js      # Patient report PDF sections
├── patientReportController.js     # Patient report controller
├── doctorReportController.js      # Doctor report controller
├── routes.js                      # API routes (MAIN ENTRY)
├── index.js                       # Centralized exports
├── README.md                      # This file
└── enterpriseReports.js.backup    # Original 1,057-line file
```

## Module Responsibilities

### 1. **config.js** - Configuration
- Report limits (max appointments, patients)
- Date format settings
- Performance thresholds
- Report type constants

### 2. **utils.js** - Utility Functions
- Format patient names
- Format filenames for download
- Calculate age from date of birth
- Format dates to locale strings
- Calculate completion rates
- Get week start/end dates

### 3. **dataService.js** - Data Fetching
- Fetch patient data with appointments and doctor
- Fetch doctor data with appointments and patients
- Query optimization
- Data aggregation

### 4. **patientReportGenerator.js** - PDF Sections
- Patient information section
- Contact & address section
- Emergency contact section
- Medical information section
- Reusable PDF section generators

### 5. **patientReportController.js** - Patient Reports
- Generate complete patient medical report
- Appointment history table
- Recent appointment details
- Clinical notes
- PDF response handling

### 6. **doctorReportController.js** - Doctor Reports
- Generate doctor performance report
- Weekly metrics calculation
- Appointments table
- Patients table
- Performance summary

### 7. **routes.js** - API Routes
- GET /patient/:patientId - Patient medical report
- GET /doctor/:doctorId - Doctor performance report

### 8. **index.js** - Centralized Exports
- Export all services and controllers
- Single import point for the module

## Features

### 📄 Patient Medical Report
- **Patient Information**: Full demographics, contact details
- **Medical History**: Allergies, current medications
- **Emergency Contact**: Emergency contact details
- **Appointment History**: Complete appointment table
- **Recent Details**: Last 3 appointments with notes
- **Clinical Notes**: Doctor's observations

### 📊 Doctor Performance Report
- **Doctor Information**: Profile and credentials
- **Weekly Metrics**: Appointments, completion rate
- **Performance Stats**: Average patients per day
- **Appointments Table**: This week's schedule
- **Patients Table**: Top 10 patients with visit history
- **Summary**: Performance analysis

## API Endpoints

### Patient Report
```
GET /patient/:patientId
Authorization: Required (auth middleware)
Response: application/pdf
```

### Doctor Report
```
GET /doctor/:doctorId
Authorization: Required (auth middleware)
Response: application/pdf
```

## PDF Features

- **Professional Layout**: Enterprise-grade design
- **Header/Footer**: Branded with logo
- **Tables**: Clean, formatted tables
- **Sections**: Color-coded sections
- **Typography**: Readable fonts and spacing
- **Confidential**: Watermarked as confidential

## Data Included

### Patient Report
- Patient ID, name, demographics
- Contact information
- Full address breakdown
- Emergency contact
- Medical history & allergies
- Current medications
- Assigned doctor
- Up to 25 recent appointments
- Detailed notes for last 3 appointments
- Clinical observations

### Doctor Report
- Doctor ID, name, contact
- Report week period
- Total appointments this week
- Completed appointments count
- Completion rate percentage
- Total registered patients
- Average patients per day
- Weekly appointments table (15 max)
- Top 10 patients with visit count
- Performance summary narrative

## Configuration

Report limits (configurable in config.js):
```javascript
MAX_APPOINTMENTS_IN_REPORT: 25
MAX_DETAILED_APPOINTMENTS: 3
MAX_PATIENTS_IN_DOCTOR_REPORT: 10
EXCELLENT_COMPLETION_RATE: 80
```

## Usage Examples

### Import Router
```javascript
// In Server.js
const reportsRouter = require('./routes/reports/routes');
app.use('/api/reports', reportsRouter);
```

### Generate Patient Report
```javascript
GET /api/reports/patient/60d5ec49f1b2c8b1f8e4e1a1
Response: PDF file stream
```

### Generate Doctor Report
```javascript
GET /api/reports/doctor/60d5ec49f1b2c8b1f8e4e1a2
Response: PDF file stream
```

## Error Handling

- Patient/Doctor not found (404)
- Data fetching errors (500)
- PDF generation errors (500)
- Authorization errors (401)
- Validation errors (400)

## Security

- ✅ Authentication required (auth middleware)
- ✅ Confidential watermarking
- ✅ Secure data queries
- ✅ Input validation
- ✅ Error message sanitization

## Performance

- Optimized database queries
- Lean queries (select only needed fields)
- Limited data sets (configurable limits)
- Efficient PDF generation
- Streamed response (no buffering)

## Statistics

| Metric | Value |
|--------|-------|
| **Original File** | 1,057 lines |
| **New Routes Entry** | 33 lines |
| **Total Modules** | 8 files |
| **Average Module Size** | 132 lines |
| **Largest Module** | doctorReportController.js (173 lines) |
| **Total Documentation** | This README |

## Benefits

✅ **Modular** - Each file has single responsibility  
✅ **Testable** - Independent unit testing  
✅ **Maintainable** - Easy to locate code  
✅ **Scalable** - Simple to add new report types  
✅ **Documented** - Comprehensive guide  
✅ **Self-contained** - Everything in reports/ folder  
✅ **Professional** - Enterprise-grade PDF output  

## Adding New Report Types

1. Create new controller in `reports/` folder
2. Add data fetching logic to `dataService.js`
3. Create PDF sections in new generator file
4. Add route to `routes.js`
5. Export from `index.js`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| PDF not generating | Check pdfGen utils are available |
| No data in report | Verify patient/doctor ID is valid |
| Empty sections | Check database has data |
| Download fails | Check response headers |

## Support

- **Documentation**: This README
- **Code**: Check specific module for implementation
- **Backup**: enterpriseReports.js.backup for reference

---

**Last Updated:** 2026-03-04  
**Version:** 2.0.0 (Modularized)  
**Module Count:** 8 files
