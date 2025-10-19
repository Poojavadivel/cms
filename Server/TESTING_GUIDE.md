# 🧪 Testing Guide - New Gemini Extraction

## Quick Test

### 1. Start the Server
```bash
cd Server
node Server.js
```

### 2. Test Upload Endpoint

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/scanner/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/lab-report.pdf"
```

**Using Postman:**
1. POST to `http://localhost:3000/api/scanner/upload`
2. Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
3. Body: form-data, key="files", type=File, select PDF/image
4. Send request

### 3. Expected Response

**Success with Gemini:**
```json
{
  "ok": true,
  "batchId": "abc12345",
  "results": [
    {
      "file": "report.pdf",
      "action": "created",
      "extractionMethod": "gemini-high",
      "patient": {
        "id": "patient-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "matchedBy": "name",
        "updated": true
      },
      "labReport": {
        "id": "lab-uuid",
        "testType": "Complete Blood Count",
        "resultsCount": 8,
        "testDate": "2024-01-15T10:30:00Z",
        "labName": "City Diagnostic Center",
        "quality": "high",
        "qualityScore": 85
      },
      "processing": {
        "timeMs": 2500,
        "extractionTimeMs": 1200
      }
    }
  ],
  "processed": 1,
  "failed": 0,
  "totalTimeMs": 2500
}
```

### 4. Check Logs

Look for:
```
[scanner abc12345] → /scanner/upload files=1
[scanner abc12345] file START: report.pdf (type=application/pdf, size=123456)
[scanner abc12345] OCR done: engine=pdf-parse, conf=null, t=200ms
[scanner abc12345] 🚀 Attempting Gemini structured extraction...
[scanner abc12345] 🤖 Calling Gemini for structured extraction (5000 chars)...
[scanner abc12345] ✅ Gemini response received (1200ms)
[scanner abc12345] 📊 Extraction quality: 85% (high)
[scanner abc12345] 📋 Extracted: John Doe, 8 test results
[scanner abc12345] 📝 Patient data prepared: {...}
[scanner abc12345] ✅ LabReport created id=lab-uuid
```

### 5. Verify Database

**Check Patient:**
```javascript
db.patients.findOne({ firstName: "John" })
// Should have:
// - gender field populated
// - address if extracted
// - email if extracted
```

**Check LabReport:**
```javascript
db.labreports.findOne({ patientId: "patient-uuid" })
// Should have:
// - results as ARRAY (not object)
// - metadata with quality scores
// - testType, testDate, labName populated
```

---

## Test Scenarios

### Scenario 1: Perfect Extraction
**Input**: High-quality PDF with all fields  
**Expected**: `gemini-high`, quality score 80-100%  
**Verify**: All fields populated correctly

### Scenario 2: Medium Quality
**Input**: Scanned image with some blur  
**Expected**: `gemini-medium`, quality score 40-60%  
**Verify**: Critical fields extracted, some optional missing

### Scenario 3: Fallback to Regex
**Input**: Very poor OCR or Gemini API down  
**Expected**: `regex-with-enhancement` or `regex-basic`  
**Verify**: Basic info extracted, results in converted format

### Scenario 4: Duplicate Patient
**Input**: Upload 2 reports for same patient  
**Expected**: Same patient ID for both  
**Verify**: Only 1 patient record, 2 lab reports

---

## Debugging

### Enable Detailed Logging
Set in Server/.env:
```env
LOG_LEVEL=debug
```

### Check Gemini Response
If extraction fails, check logs for raw Gemini response:
```
[scanner abc12345] Raw response: {"patient":{...
```

### Test Gemini Directly
```javascript
// In Node REPL or test file
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  });
  
  const prompt = "Extract patient name from: 'Patient Name: John Doe'";
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

test();
```

---

## Performance Monitoring

### Track Metrics
- Extraction method distribution (Gemini vs fallback)
- Average quality scores
- Processing times
- API costs

### Sample Query
```javascript
// Get extraction stats for last 24 hours
db.labreports.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    }
  },
  {
    $group: {
      _id: "$metadata.extractionMethod",
      count: { $sum: 1 },
      avgScore: { $avg: "$metadata.extractionScore" },
      avgTime: { $avg: "$metadata.extractionTimeMs" }
    }
  }
])
```

---

## Rollback Plan

If issues arise, temporary rollback:

1. **Disable Gemini extraction**:
```javascript
// In scanner.js, line ~1515
// Comment out Gemini extraction attempt
/*
try {
  structuredData = await extractStructuredDataWithGemini(text, batchId);
  ...
} catch (e) { ... }
*/
structuredData = null; // Force fallback
```

2. **Restart server** - Will use regex parser only

3. **Fix issue** and re-enable

---

## Success Criteria

✅ **Extraction Quality**
- ≥80% of uploads use Gemini (not fallback)
- ≥70% achieve "high" quality score
- <5% complete failures

✅ **Data Accuracy**
- Patient names: 95%+ correct
- Test values: 90%+ correct
- Dates: 85%+ correct

✅ **Performance**
- Average processing: <3 seconds per file
- Gemini response: <2 seconds
- No memory leaks

✅ **Reliability**
- API errors handled gracefully
- Fallback always works
- No data loss

---

**Ready to Test!** 🚀
