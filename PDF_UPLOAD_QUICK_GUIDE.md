# PDF Upload - Quick Visual Guide

## 🎯 New Feature: PDF Upload Button

### What's New?

A dedicated **"Choose PDF"** button has been added to the medical history upload section in the patient registration form.

### Button Layout

#### Desktop/Mobile:
```
┌──────────────────────────────────────────────────────────┐
│  Medical History Upload Section                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Upload medical history documents:                      │
│  (Images: JPG, PNG | Documents: PDF)                    │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │  📷 Choose     │  │  📄 Choose     │  │  📸 Take  │ │
│  │     Image      │  │     PDF        │  │     Photo │ │
│  └────────────────┘  └────────────────┘  └───────────┘ │
│   (Images/Photos)    (PDF Documents)     (Camera)      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Web:
```
┌──────────────────────────────────────────────────────────┐
│  Medical History Upload Section                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Upload medical history documents:                      │
│  (Images: JPG, PNG | Documents: PDF)                    │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐                │
│  │  📷 Choose     │  │  📄 Choose     │                │
│  │     Image      │  │     PDF        │                │
│  └────────────────┘  └────────────────┘                │
│   (Images/Photos)    (PDF Documents)                    │
│                                                          │
│  Note: Camera not available on web                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 🚀 How to Use

### Step 1: Navigate to Patient Form
```
Admin → Patients → Add Patient (or Edit Patient)
```

### Step 2: Go to Medical History Step
```
Personal Info → Contact → [Medical History] ← Click here
```

### Step 3: Upload PDF
```
1. Click "Choose PDF" button (orange button)
2. File picker opens showing only PDF files
3. Select your medical history PDF
4. Wait for processing (5-30 seconds)
5. See extracted data auto-fill fields
6. Review and save
```

## 📋 Supported File Types

### Images (Choose Image Button):
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)

### Documents (Choose PDF Button):
- ✅ PDF (.pdf)
  - With text layer (faster)
  - Scanned/Image-based (slower, uses OCR)
  - Multi-page PDFs (all pages processed)

## 💡 Tips

### For Best Results:

1. **Use Text PDFs When Possible**
   - PDFs with selectable text process faster
   - Better extraction accuracy

2. **Scanned PDFs Work Too**
   - Takes longer (uses OCR)
   - Ensure good scan quality
   - 300 DPI or higher recommended

3. **File Size**
   - Maximum: 50MB
   - Recommended: Under 10MB
   - Compress large files if needed

4. **Multi-page PDFs**
   - All pages are processed
   - Data from all pages combined
   - May take longer for many pages

## 🔍 What Gets Extracted

### From Medical History PDFs:
- ✅ Patient medical history
- ✅ Allergies
- ✅ Chronic conditions
- ✅ Surgical history
- ✅ Current medications
- ✅ Diagnoses
- ✅ Doctor/hospital information

### Auto-filled Fields:
```
Medical History: [Extracted text appears here]
Allergies: [Extracted allergies appear here]
```

You can review and edit these fields before saving.

## ⚡ Processing Time

| PDF Type           | Typical Time | Notes                    |
|--------------------|--------------|--------------------------|
| Text PDF (1 page)  | 2-5 seconds  | Fastest                  |
| Text PDF (5 pages) | 5-10 seconds | Linear increase          |
| Scanned PDF        | 10-30 seconds| Uses OCR (slower)        |
| Large scanned PDF  | 30-60 seconds| Depends on size/quality  |

## ✅ Success Indicators

### You'll see:
1. ✅ Green success notification: "PDF scanned and processed successfully!"
2. ✅ Auto-filled fields with extracted data
3. ✅ Scanned data preview card (if data extracted)

### Console shows:
```
📄 PDF picked: medical_history.pdf, size: 123456 bytes
✅ PDF text extracted: 1234 chars, 3 pages
🧠 AI extraction completed
💾 Saved to patient record
```

## ❌ Error Handling

### Common Issues:

**"Failed to process PDF"**
- File may be corrupted
- Try re-scanning or different PDF
- Check file size < 50MB

**"No text extracted"**
- Scanned PDF without text layer
- Backend will use OCR (takes longer)
- Wait for processing to complete

**"Upload failed"**
- Check internet connection
- Ensure backend is running
- Check browser console for details

## 🎨 Button Colors

For easy identification:

| Button       | Color       | Purpose              |
|--------------|-------------|----------------------|
| Choose Image | Red         | Select images        |
| Choose PDF   | Deep Orange | Select PDF documents |
| Take Photo   | Green       | Use camera           |

## 📱 Platform Differences

### Web:
- ✅ Choose Image
- ✅ Choose PDF
- ❌ Take Photo (not available)

### Mobile:
- ✅ Choose Image
- ✅ Choose PDF
- ✅ Take Photo

### Desktop:
- ✅ Choose Image
- ✅ Choose PDF
- ⚠️ Take Photo (if webcam available)

## 🔐 Security

- ✅ File type validated
- ✅ Size limits enforced
- ✅ Authentication required
- ✅ Stored securely in MongoDB
- ✅ Encrypted in transit

## 📊 Where to View Uploaded PDFs

After saving patient:

```
Doctor → Appointments → Click Patient → Medical History Tab
```

You'll see:
- List of all uploaded documents
- Can view/download PDFs
- See extracted data
- Search and filter

## 🆘 Quick Troubleshooting

### PDF Won't Upload?
1. Check file size < 50MB
2. Verify it's a valid PDF
3. Try different PDF
4. Check browser console

### No Data Extracted?
1. PDF may be scanned (takes longer)
2. Wait for OCR processing
3. Check PDF has readable text
4. Try better quality scan

### Button Not Working?
1. Check if processing another file
2. Wait for previous upload to complete
3. Refresh page and try again
4. Check browser compatibility

## 📞 Need Help?

Check documentation:
- `PDF_UPLOAD_SUPPORT.md` - Technical details
- `MEDICAL_HISTORY_SCAN_FEATURE.md` - Feature overview
- `QUICK_START_MEDICAL_HISTORY.md` - Testing guide

Console logs:
- Frontend: Look for `📄 PDF` messages
- Backend: Look for `[MEDICAL HISTORY]` messages

---

**Happy Uploading! 📄✨**
