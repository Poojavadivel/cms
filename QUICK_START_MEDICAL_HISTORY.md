# Quick Start: Medical History Feature

## 🚀 How to Use

### For Admins (Uploading Medical History)

1. **Navigate to Patient Form**
   - Go to Admin → Patients → Add/Edit Patient
   - Or create a new patient

2. **Go to Medical History Step**
   - Click through the form steps to "Medical History"
   - You'll see the upload section

3. **Upload Document**
   - Click "Choose from Gallery" or "Take Photo"
   - Select medical history document (PDF, JPG, PNG)
   - Wait for AI processing (5-10 seconds)

4. **Verify Extraction**
   - AI will extract medical history, allergies, diagnosis
   - Fields will auto-populate
   - Review and save patient

### For Doctors (Viewing Medical History)

1. **Open Appointment**
   - Go to Doctor → Appointments
   - Click on any patient row

2. **View Medical History Tab**
   - In the appointment preview dialog
   - Click "Medical History" tab (2nd tab)

3. **Browse Records**
   - See all uploaded medical history documents
   - Use search box to filter
   - Use category dropdown to filter by type
   - Navigate pages if needed

4. **View Document**
   - Click "View" button in Document column
   - Zoom and pan the image/PDF
   - Close when done

## 🔧 Backend Setup (One-time)

No setup needed! The new collection `medicalhistorydocuments` will be created automatically when the first document is uploaded.

## 📊 Database Verification

Check if data is being saved:

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use karur_db

# Check medical history documents
db.medicalhistorydocuments.find().pretty()

# Count by patient
db.medicalhistorydocuments.aggregate([
  { $group: { _id: "$patientId", count: { $sum: 1 } } }
])
```

## 🐛 Troubleshooting

### Frontend Issues

**Problem:** Medical History tab shows "No records found"
- **Check:** Backend is running
- **Check:** Patient has uploaded documents
- **Check:** Network console for API errors

**Problem:** Upload not working in patient form
- **Check:** File type is PDF/JPG/PNG
- **Check:** Backend scanner endpoint is accessible
- **Check:** Gemini API key is configured

### Backend Issues

**Problem:** 500 error on /medical-history/:patientId
- **Check:** Model is exported in Models/index.js
- **Check:** MongoDB connection is active
- **Check:** Patient ID is valid

**Problem:** Documents not saving during upload
- **Check:** Intent detection is working (check logs)
- **Check:** PatientPDF collection is accessible
- **Check:** File upload middleware is working

## 📝 Testing Checklist

- [ ] Backend starts without errors
- [ ] Can upload medical history in patient form
- [ ] AI extraction populates fields
- [ ] Medical History tab shows uploaded documents
- [ ] Search functionality works
- [ ] Filter dropdown works
- [ ] Pagination works (if >10 records)
- [ ] View document opens dialog
- [ ] Image viewer zoom/pan works
- [ ] Empty state displays correctly
- [ ] Error states display correctly

## 🎯 Key Files Reference

**Frontend:**
- API: `lib/Services/api_constants.dart`
- Service: `lib/Services/Authservices.dart`
- UI: `lib/Modules/Doctor/widgets/doctor_appointment_preview.dart`

**Backend:**
- Model: `Server/Models/MedicalHistoryDocument.js`
- Routes: `Server/routes/scanner-enterprise.js`

## 💡 Tips

1. **Intent Detection:** Backend automatically detects if uploaded document is medical history based on AI analysis

2. **Category Auto-assignment:** Currently defaults to "General" but can be manually categorized later

3. **Discharge Summaries:** Hospital discharge papers are also saved as medical history

4. **Search Tips:** Search works across title, notes, category, and date fields

5. **Performance:** First load might take a few seconds as images are fetched from MongoDB

## 🔗 Related Features

- **Prescriptions Tab:** Similar interface for pharmacy documents
- **Lab Results Tab:** Similar interface for pathology reports
- **Scanner API:** Unified scanning for all document types

## 📞 Support

Check documentation:
- `MEDICAL_HISTORY_SCAN_FEATURE.md` - Comprehensive implementation guide
- `Server/BACKEND_MEDICAL_HISTORY_IMPLEMENTATION.md` - Backend details

Console logs to watch:
- Frontend: `📋 [MEDICAL HISTORY]`
- Backend: `[MEDICAL HISTORY]`, `📋 Created MedicalHistoryDocument`
