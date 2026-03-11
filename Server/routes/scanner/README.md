# Scanner Module - Enterprise Architecture

## Overview
Enterprise-grade document scanning system for medical documents. Refactored from monolithic 1,458-line `scanner-enterprise.js` into 13 modular components.

**Note:** This module is directly imported in Server.js. All code resides within this scanner/ folder.

## Server.js Integration

```javascript
// In Server.js
app.use('/api/scanner-enterprise', require('./routes/scanner/routes'));
```

## Architecture

```
scanner/
├── config.js                    # Configuration & environment variables
├── uploadMiddleware.js          # Multer file upload configuration
├── utils.js                     # Utility functions
├── dataConverter.js             # Data conversion for verification
├── patientMatcher.js            # Patient matching logic
├── scannerService.js            # LandingAI scanner service
├── scanController.js            # Main scan endpoint controller
├── bulkController.js            # Bulk upload controller
├── verificationController.js    # Verification workflow controllers
├── documentController.js        # Document retrieval controllers
├── routes.js                    # API route definitions (MAIN ENTRY)
├── index.js                     # Centralized exports
├── README.md                    # This file
└── scanner-enterprise.js.backup # Original 1,458-line file
```

## Module Responsibilities

### 1. **config.js** - Configuration Management
- File upload limits (50MB, 10 files max)
- Directory paths for temp uploads
- LandingAI API key management
- Allowed file types (PDF, JPEG, PNG)
- Document type constants

### 2. **uploadMiddleware.js** - File Upload Handling
- Multer configuration for multipart/form-data
- Storage configuration with unique filenames
- File type validation
- Size limits enforcement

### 3. **utils.js** - Utility Functions
- Logging helpers (`logh`)
- Temp file cleanup
- Batch ID generation
- File type validation
- File size formatting

### 4. **dataConverter.js** - Data Conversion (342 lines)
- Converts extracted OCR data to verification rows
- Handles 3 document types:
  - **Prescription**: summary, date, hospital, doctor, notes
  - **Lab Report**: test type, results array, interpretation
  - **Medical History**: type, summary, dates, hospital, doctor
- Field mapping and validation
- Confidence scoring

### 5. **patientMatcher.js** - Patient Matching
- Match patients by name or phone
- Create new patients if no match
- Update existing patient information
- Handle duplicate detection

### 6. **scannerService.js** - Scanner Core Service
- LandingAI API integration
- Document scanning orchestration
- PDF storage in MongoDB
- Verification session creation
- Processing time tracking

### 7. **scanController.js** - Main Scan Endpoint
- POST /scan-medical handler
- Request validation
- Response formatting
- Error handling
- Temp file cleanup

### 8. **bulkController.js** - Bulk Operations
- POST /bulk-upload-with-matching handler
- Process multiple files in batch
- Auto patient matching per document
- Success/failure tracking
- Batch result aggregation

### 9. **verificationController.js** - Verification Workflow
- Get verification details
- Get patient verifications
- Update verification rows
- Delete verification rows
- Confirm and save to final collection
- Reject verification with reason

### 10. **documentController.js** - Document Retrieval
- Get patient prescriptions
- Get patient lab reports
- Get patient medical history
- Get PDF documents (public access)

### 11. **routes.js** - API Routes (MAIN ENTRY)
- All 13 endpoint definitions
- Authentication middleware
- Route-to-controller mapping
- Health check endpoint

### 12. **index.js** - Centralized Exports
- Export all functions and services
- Single import point for the module

## API Endpoints

### Scanning
```
POST   /scan-medical                      - Scan single document
POST   /bulk-upload-with-matching         - Bulk upload with auto-matching
```

### Verification Workflow
```
GET    /verification/:verificationId                    - Get verification
GET    /verification/patient/:patientId                 - Get patient verifications
PUT    /verification/:verificationId/row/:rowIndex      - Update row
DELETE /verification/:verificationId/row/:rowIndex      - Delete row
POST   /verification/:verificationId/confirm            - Confirm verification
POST   /verification/:verificationId/reject             - Reject verification
```

### Document Retrieval
```
GET    /prescriptions/:patientId          - Get prescriptions
GET    /lab-reports/:patientId            - Get lab reports
GET    /medical-history/:patientId        - Get medical history
GET    /pdf-public/:pdfId                 - Get PDF document
```

### Health
```
GET    /health                            - Health check
```

## Data Flow

```
Upload Document
    ↓
Multer Middleware (uploadMiddleware.js)
    ↓
scanController.js
    ↓
scannerService.js (LandingAI API)
    ↓
dataConverter.js (Extract fields)
    ↓
Save to ScannedDataVerification
    ↓
Verification UI (edit/confirm/reject)
    ↓
verificationController.js
    ↓
Save to Final Collection (Prescription/LabReport/MedicalHistory)
```

## Document Types Supported

### 1. Prescription
- Prescription summary
- Date and time
- Hospital name
- Doctor name
- Medical notes

### 2. Lab Report
- Test type and category
- Lab name
- Report date
- Doctor name
- Results array (multiple tests)
- Interpretation
- Notes

### 3. Medical History
- Medical type
- Medical summary
- Date and time
- Hospital name
- Doctor name
- Department, services, observations

## Configuration

Environment variables:
```env
LANDINGAI_API_KEY=your_api_key_here
```

## Usage Examples

### Import Router
```javascript
// In Server.js
const scannerRouter = require('./routes/scanner/routes');
app.use('/api/scanner-enterprise', scannerRouter);
```

### Import Specific Functions
```javascript
const { processDocumentScan, matchOrCreatePatient } = require('./routes/scanner');
```

### Scan a Document
```javascript
POST /api/scanner-enterprise/scan-medical
Content-Type: multipart/form-data

{
  image: <file>,
  patientId: "patient_id_here",
  documentType: "PRESCRIPTION" // optional
}
```

## Error Handling

- File type validation (PDF, JPEG, PNG only)
- File size limits (50MB max)
- LandingAI API error handling
- Patient matching fallbacks
- Verification workflow validation

## Security

- ✅ Authentication required (auth middleware)
- ✅ File type validation
- ✅ Size limits enforced
- ✅ Temp file cleanup
- ✅ PDF storage in MongoDB (not filesystem)

## Performance

- Async/await throughout
- Temp file cleanup
- Batch processing support
- Efficient MongoDB queries
- Verification caching

## Statistics

| Metric | Value |
|--------|-------|
| **Original File** | 1,458 lines |
| **New Routes Entry** | 154 lines |
| **Total Modules** | 13 files |
| **Average Module Size** | 112 lines |
| **Largest Module** | dataConverter.js (342 lines) |
| **Total Documentation** | This README |

## Benefits

✅ **Modular** - Each file has single responsibility  
✅ **Testable** - Independent unit testing  
✅ **Maintainable** - Easy to locate code  
✅ **Scalable** - Simple to add features  
✅ **Documented** - Comprehensive guide  
✅ **Self-contained** - Everything in scanner/ folder  

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Scanner not ready | Check LANDINGAI_API_KEY in .env |
| File upload fails | Check file type (PDF/JPEG/PNG) and size (<50MB) |
| Verification not found | Check verificationId is valid |
| Patient not matched | Check patient name/phone format |

## Support

- **Documentation**: This README
- **Code**: Check specific module for implementation
- **Backup**: scanner-enterprise.js.backup for reference

---

**Last Updated:** 2026-03-04  
**Version:** 2.0.0 (Modularized)  
**Module Count:** 13 files
