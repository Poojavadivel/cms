# LandingAI Scanner Migration - Complete Guide

## What Changed

The medical document scanner has been **migrated from Google Vision API + OpenAI** to **LandingAI ADE** for better accuracy and structured data extraction.

## New Implementation

### Files Created

1. **`Server/utils/landingai_scanner.js`** - Pure JavaScript LandingAI SDK wrapper
2. **`Server/routes/scanner-enterprise-new.js`** - New clean scanner routes using LandingAI
3. **`Server/scripts/landingai_scanner.py`** - Python version (optional, not used anymore)

### Files Modified

1. **`Server/routes/scanner-enterprise.js`** - Old logic commented out (kept for reference)

## Setup Instructions

### 1. Install Dependencies

```bash
cd Server
npm install form-data
```

### 2. Configure API Key

Add to your `.env` file:

```env
LANDINGAI_API_KEY=ZHpvajlwZDk3ZHI2NGhvNG51aDNtOjM5Zk5NU21GOXpxblNoOWhVVFVuQTc0d1VUNWtRY0ZL
```

### 3. Update Server.js

Replace the old scanner route with the new one:

```javascript
// OLD (comment out):
// const scannerRoutes = require('./routes/scanner-enterprise');
// app.use('/api/scanner-enterprise', scannerRoutes);

// NEW:
const scannerRoutes = require('./routes/scanner-enterprise-new');
app.use('/api/scanner-enterprise', scannerRoutes);
```

## API Endpoints

All endpoints remain the same, but now powered by LandingAI:

### 1. Scan Single Document
```
POST /api/scanner-enterprise/scan-medical
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - image: file (PDF/JPG/PNG)
  - patientId: string (optional)
  - documentType: string (optional: PRESCRIPTION, LAB_REPORT, MEDICAL_HISTORY)
```

### 2. Bulk Upload with Patient Matching
```
POST /api/scanner-enterprise/bulk-upload-with-matching
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - images: file[] (multiple PDFs/JPGs/PNGs)
```

### 3. Get PDF/Image
```
GET /api/scanner-enterprise/pdf-public/:pdfId
```

### 4. Health Check
```
GET /api/scanner-enterprise/health
Headers: Authorization: Bearer <token>
```

## How It Works

### LandingAI Two-Step Process

1. **Parse** - Converts PDF/Image to Markdown
   - Uses `dpt-2` model
   - Handles all document types
   - Returns structured markdown text

2. **Extract** - Extracts structured data using JSON schema
   - Pydantic-style schemas defined in JavaScript
   - Three schema types: Prescription, LabReport, MedicalHistory
   - Auto-detects document type if not specified

### Supported Document Types

- **PRESCRIPTION** - Medication prescriptions with doctor details
- **LAB_REPORT** - Laboratory test results (blood, urine, etc.)
- **MEDICAL_HISTORY** - Patient history, discharge summaries
- **GENERAL** - Fallback for other medical documents

## Response Format

```json
{
  "success": true,
  "intent": "PRESCRIPTION",
  "extractedData": {
    "doctor_details": {
      "name": "Dr. John Smith",
      "specialization": "Cardiology",
      "hospital": "City Hospital"
    },
    "patient_details": {
      "name": "Jane Doe",
      "firstName": "Jane",
      "lastName": "Doe",
      "age": "45",
      "gender": "Female",
      "phone": "+919876543210"
    },
    "medications": [
      {
        "name": "Aspirin",
        "dose": "75mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "instructions": "After food"
      }
    ],
    "prescription_date": "2024-01-15",
    "diagnosis": "Hypertension"
  },
  "metadata": {
    "ocrEngine": "landingai-ade",
    "ocrConfidence": 0.95,
    "processingTimeMs": 3500,
    "model": "dpt-2"
  },
  "savedToPatient": {
    "patientId": "507f1f77bcf86cd799439011",
    "pdfId": "507f1f77bcf86cd799439012",
    "reportId": "507f1f77bcf86cd799439013",
    "saved": true
  }
}
```

## Advantages Over Old System

1. **No Python dependency** - Pure JavaScript implementation
2. **Better accuracy** - LandingAI specialized for document extraction
3. **Structured output** - Pre-defined schemas ensure consistent data
4. **Handles all formats** - PDFs, images, scanned documents
5. **Simpler code** - 550 lines vs 2287 lines
6. **Better error handling** - Clear error messages and fallbacks

## Testing

### Test Single Scan
```bash
curl -X POST http://localhost:5000/api/scanner-enterprise/scan-medical \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@prescription.pdf" \
  -F "documentType=PRESCRIPTION"
```

### Test Health
```bash
curl http://localhost:5000/api/scanner-enterprise/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Issue: "Python process failed"
**Solution**: Use the new `scanner-enterprise-new.js` file (no Python needed)

### Issue: "LandingAI API error"
**Solution**: Check API key in `.env` file

### Issue: "No data extracted"
**Solution**: 
- Ensure document is clear and readable
- Try different documentType parameter
- Check file format (PDF/JPG/PNG only)

## Migration Checklist

- [x] Install form-data package
- [ ] Update Server.js to use new routes
- [ ] Add LANDINGAI_API_KEY to .env
- [ ] Test with sample documents
- [ ] Update frontend if needed
- [ ] Remove old scanner-enterprise.js after testing

## Notes

- Old scanner code is commented out in `scanner-enterprise.js` for reference
- All data structures remain compatible with existing database schemas
- API endpoints unchanged - drop-in replacement
- LandingAI API key provided in code as fallback
