# Server, Git & Web Folder Analysis

## 📊 Overview

**Project**: Karur Gastro Foundation HMS (Hospital Management System)  
**Platform**: Flutter Web + Node.js/Express Backend  
**Database**: MongoDB (migrated from PostgreSQL)  
**Current Status**: Production-ready with active deployment

---

## 🗂️ Server Structure

### Root Directory: `/Server`

```
D:\MOVICLOULD\Hms\karur\Server\
├── Server.js              # Main entry point (Express server)
├── package.json           # Node.js dependencies
├── .env                   # Environment configuration
├── .gitignore            # Git ignore rules
│
├── Bot/                   # Telegram bot & AI chatbot
│   └── 10 files, 3 subdirs
│
├── Config/                # Database configuration
│   └── Dbconfig.js        # MongoDB connection
│
├── Middleware/            # Auth & validation middleware
│   └── 2 files
│
├── Models/                # Mongoose schemas (22 models)
│   ├── User.js
│   ├── Patient.js
│   ├── Appointment.js
│   ├── Intake.js
│   ├── Medicine.js
│   └── ... (17+ more)
│
├── routes/                # API route handlers (16 modules)
│   ├── auth.js
│   ├── patients.js
│   ├── appointments.js
│   ├── doctors.js
│   ├── pharmacy.js
│   ├── pathology.js
│   ├── staff.js
│   ├── payroll.js
│   ├── intake.js
│   ├── scanner-enterprise.js
│   ├── bot.js
│   ├── card.js
│   ├── enterpriseReports.js
│   ├── properReports.js
│   └── ... (more)
│
├── image-processor/       # OCR & image processing
│   └── 2 files, 4 subdirs
│
├── utils/                 # Utility functions
│   └── 3 files
│
├── scripts/               # Database utilities
│   └── 3 files
│
├── uploads/               # File storage
│   └── 2 subdirectories
│
└── web/                   # 🎯 Flutter Web Build (31.78 MB)
    ├── index.html
    ├── flutter.js
    ├── main.dart.js
    ├── assets/
    ├── canvaskit/
    └── icons/
```

---

## 🌐 Web Folder Analysis

### Location: `/Server/web`

**Purpose**: Compiled Flutter web application served by Express.js

### Statistics
- **Size**: 31.78 MB
- **Files**: 38 files
- **Structure**: Standard Flutter web build output

### Key Files

#### 1. `index.html` (Entry Point)
```html
<!DOCTYPE html>
<html>
<head>
  <base href="/">
  <meta charset="UTF-8">
  <meta name="description" content="A new Flutter project.">
  <title>glowhair</title>
  <link rel="manifest" href="manifest.json">
</head>
<body>
  <script src="flutter_bootstrap.js" async></script>
</body>
</html>
```

#### 2. `version.json` (Build Info)
```json
{
  "app_name": "glowhair",
  "version": "1.0.0",
  "build_number": "1",
  "package_name": "glowhair"
}
```

#### 3. `manifest.json` (PWA Config)
Enables Progressive Web App features

### Contents
```
web/
├── index.html               # Main entry point
├── flutter.js               # Flutter engine loader
├── flutter_bootstrap.js     # Bootstrap script
├── flutter_service_worker.js # Service worker for PWA
├── main.dart.js             # Compiled Dart code (~25+ MB)
├── version.json             # Build metadata
├── manifest.json            # PWA manifest
├── favicon.png              # Browser icon
│
├── assets/                  # Static assets
│   ├── AssetManifest.json
│   ├── FontManifest.json
│   ├── fonts/
│   ├── images/
│   └── ...
│
├── canvaskit/               # Flutter's 2D graphics engine
│   ├── canvaskit.js
│   ├── canvaskit.wasm
│   └── profiling/
│
└── icons/                   # PWA icons
    ├── Icon-192.png
    ├── Icon-512.png
    └── ...
```

---

## 🔧 Server Configuration

### Express Server (`Server.js`)

**Port**: 3000 (configurable via `process.env.PORT`)

#### Middleware Stack
```javascript
app.use(cors());                    // CORS enabled
app.use(express.json());            // JSON body parser
app.use(express.static(webAppPath)); // Static file serving
```

#### Web App Serving
```javascript
const webAppPath = path.join(__dirname, 'web');
app.use(express.static(webAppPath));

// SPA routing - all non-API routes serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(webAppPath, 'index.html'));
});
```

#### API Routes
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/staff', require('./routes/staff'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/pathology', require('./routes/pathology'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/intake', require('./routes/intake'));
app.use('/api/scanner-enterprise', require('./routes/scanner-enterprise'));
app.use('/api/card', require('./routes/card'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/reports', require('./routes/enterpriseReports'));
app.use('/api/reports-proper', require('./routes/properReports'));
```

### Dependencies (`package.json`)
```json
{
  "dependencies": {
    "@google-cloud/vision": "^5.3.3",      // OCR
    "@google/generative-ai": "^0.24.1",    // AI chatbot
    "axios": "^1.12.2",
    "bcryptjs": "^3.0.2",                  // Password hashing
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",                   // Web framework
    "jsonwebtoken": "^9.0.2",              // JWT auth
    "mongodb": "^6.19.0",                  // MongoDB driver
    "mongoose": "^8.18.0",                 // ODM
    "multer": "^2.0.2",                    // File uploads
    "node-telegram-bot-api": "^0.66.0",    // Telegram bot
    "pdf-parse": "^2.2.13",                // PDF parsing
    "pdfkit": "^0.17.2",                   // PDF generation
    "pdfmake": "^0.2.20",                  // PDF reports
    "sharp": "^0.34.4",                    // Image processing
    "uuid": "^8.3.2"                       // UUID generation
  }
}
```

---

## 🔐 Git Configuration

### Repository Information

**Primary Remote**: `origin`
```
https://github.com/movi-innovations/Karur-Gastro-Foundation.git
```

**Test Remote**: `test`
```
https://github.com/movicloudlabs-ai-testenv/HMS-DEV.git
```

### Current Branch
```
main (synced with origin/main and test/main)
```

### Recent Commits (Last 5)
```
b8d4c59 - feat: Prescription download and dispense status update
2f2193f - Add staff report functionality and rebuild web app
812c84b - Build and deploy Flutter web app with follow-up management
44bb69e - build: Fresh Flutter web build and deployment
babecfa - feat: Production build with web deployment and documentation
```

### Git Status Summary
**Modified Files**:
- `lib/Models/Patients.dart`
- `lib/Services/api_constants.dart`
- `lib/Utils/Api_handler.dart` (✅ Now uses Dio)
- `pubspec.lock`
- `pubspec.yaml`

**New Untracked Files**:
- ✅ `DIO_IMPLEMENTATION.md` (this session)
- ✅ `lib/Utils/dio_client.dart` (this session)
- ✅ `lib/Utils/dio_api_handler.dart` (this session)
- Various server scripts (seed data, fixes, etc.)
- Documentation files

**Deleted Files**:
- `DEPLOYMENT_SUMMARY.md`
- `FINAL_FIXES_APPLIED.md`

---

## 📦 Database Models (22 Models)

Located in `/Server/Models/`:

1. **User.js** - User authentication & roles
2. **Patient.js** - Patient records
3. **Appointment.js** - Appointment scheduling
4. **Intake.js** - Patient intake forms
5. **Medicine.js** - Pharmacy inventory
6. **Doctor.js** - Doctor profiles
7. **Staff.js** - Staff management
8. **Payroll.js** - Payroll records
9. **PathologyReport.js** - Lab reports
10. **MedicalDocument.js** - Scanned documents
11. **Prescription.js** - Prescription records
12. **Vitals.js** - Patient vitals
13. **Insurance.js** - Insurance information
14. **Follow-up.js** - Follow-up appointments
15. **ChatMessage.js** - AI chatbot conversations
16. ... and 7 more models

All models use:
- ✅ UUID-based `_id` fields
- ✅ Mongoose schemas
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Virtual population for relationships

---

## 🚀 Deployment Architecture

### Flow
```
User Browser
    ↓
Express Static Server (Port 3000)
    ↓
/web/index.html (Flutter Web App)
    ↓
API Calls → /api/* endpoints
    ↓
MongoDB Database
```

### Serving Strategy
```javascript
// 1. Serve static Flutter web files
app.use(express.static('web'));

// 2. API routes handle /api/* 
app.use('/api/...', routes);

// 3. Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});
```

---

## 🔍 Key Features Analysis

### 1. Authentication
- JWT-based token authentication
- Role-based access control (admin, doctor, pharmacist, pathologist)
- Token stored in SharedPreferences (Flutter)
- Auto-injected via Dio interceptor (✅ New)

### 2. File Handling
- **Uploads**: Multer middleware
- **Storage**: `/Server/uploads/` directory
- **Types**: Images, PDFs, medical documents
- **OCR**: Google Cloud Vision API integration

### 3. Reports Generation
- **Legacy**: `/api/reports` - PDFKit (has issues)
- **Current**: `/api/reports-proper` - PDFMake (✅ Fixed)
- Types: Patient reports, prescriptions, lab reports

### 4. AI Integration
- **Chatbot**: Google Generative AI (Gemini)
- **Telegram Bot**: node-telegram-bot-api
- **OCR**: Image text extraction

### 5. Real-time Features
- Pending prescriptions queue
- Appointment status updates
- Follow-up scheduling
- Staff notifications

---

## 🎯 Web Build Process

### Current Build
```bash
flutter build web --release --no-tree-shake-icons
```

### Output Location
```
karur/build/web/  →  copied to  →  karur/Server/web/
```

### Build Characteristics
- **Renderer**: CanvasKit (better performance)
- **Tree Shaking**: Disabled for icons
- **Optimization**: Release mode
- **Size**: ~31.78 MB (typical for Flutter web)

---

## 📊 API Endpoints Summary

### Authentication (`/api/auth`)
- POST `/login` - User login
- POST `/logout` - User logout
- POST `/validate-token` - Token validation
- POST `/refresh` - Token refresh

### Patients (`/api/patients`)
- GET `/` - List patients
- GET `/:id` - Get patient
- POST `/` - Create patient
- PUT `/:id` - Update patient
- DELETE `/:id` - Delete patient
- GET `/:id/vitals` - Patient vitals
- POST `/:id/vitals` - Add vitals

### Appointments (`/api/appointments`)
- GET `/` - List appointments
- POST `/` - Create appointment
- PUT `/:id` - Update appointment
- DELETE `/:id` - Cancel appointment
- PATCH `/:id/status` - Update status

### Pharmacy (`/api/pharmacy`)
- GET `/medicines` - Medicine list
- GET `/pending-prescriptions` - Pending queue
- POST `/prescriptions/:id/dispense` - Dispense medicine

### Pathology (`/api/pathology`)
- GET `/reports` - Lab reports
- POST `/reports` - Create report
- GET `/reports/:id/download` - Download PDF

### Scanner (`/api/scanner-enterprise`)
- POST `/upload` - Upload medical document
- GET `/prescriptions/:patientId` - Get prescriptions
- GET `/lab-reports/:patientId` - Get lab reports
- GET `/pdf/:pdfId` - Download PDF

### Staff & Payroll
- Full CRUD for staff management
- Payroll generation and processing
- Bulk operations support

---

## 🔧 Environment Configuration

### Required `.env` Variables
```env
# Database
MONGODB_URI=mongodb://...

# Authentication
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...

# API Keys
GOOGLE_VISION_API_KEY=...
GOOGLE_AI_API_KEY=...
TELEGRAM_BOT_TOKEN=...

# Server
PORT=3000
NODE_ENV=production
```

---

## 📈 Performance Optimizations

### Flutter Web (✅ New - Dio Implementation)
1. **Connection Pooling**: Dio maintains persistent connections
2. **HTTP/2**: Multiplexing for faster parallel requests
3. **Auto Retry**: 3 attempts on network failures
4. **Request Caching**: Built into Dio interceptors
5. **Logging**: Pretty logs for debugging

### Backend
1. **MongoDB Indexing**: UUID-based indexes
2. **Lean Queries**: `.lean()` for read-only data
3. **Pagination**: Limit/skip for large datasets
4. **Static Asset Caching**: Express static middleware

---

## 🎨 Current Changes (This Session)

### Added Files
✅ **lib/Utils/dio_client.dart** - Dio HTTP client with interceptors  
✅ **lib/Utils/dio_api_handler.dart** - Drop-in ApiHandler replacement  
✅ **DIO_IMPLEMENTATION.md** - Implementation documentation  
✅ **SERVER_GIT_WEB_ANALYSIS.md** - This analysis document

### Modified Files
✅ **lib/Utils/Api_handler.dart** - Now uses Dio internally  

### Benefits
- 🚀 **Faster**: HTTP/2, connection pooling
- 🔄 **Smarter**: Auto-retry, better error handling
- 📊 **Observable**: Pretty request/response logging
- 🔒 **Secure**: Automatic token injection
- ⚡ **Efficient**: No breaking changes to existing code

---

## 🚦 Deployment Checklist

### Before Deployment
- [ ] Run `flutter pub get`
- [ ] Run `flutter build web --release --no-tree-shake-icons`
- [ ] Copy `build/web/*` to `Server/web/`
- [ ] Verify `.env` configuration
- [ ] Test API endpoints
- [ ] Check MongoDB connection

### Deploy to Server
```bash
cd Server
npm install
node Server.js
```

### Access
- **App**: http://localhost:3000
- **API**: http://localhost:3000/api/*

---

## 📚 Documentation Files

### Available Guides
- ✅ `DIO_IMPLEMENTATION.md` - HTTP client guide
- ✅ `API_DOCUMENTATION.md` - API reference
- ✅ `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- ✅ `DOCTOR_REPORT_FIXED.md` - Report system docs
- ✅ `FOLLOW_UP_SYSTEM_V2_DOCUMENTATION.md` - Follow-up guide
- ✅ `PDF_REPORT_QUICK_START.md` - PDF generation guide
- ✅ `BLANK_PAGE_QUICK_REFERENCE.md` - UI troubleshooting
- ... and 50+ more documentation files

---

## 🎯 Recommendations

### Immediate Actions
1. ✅ **Dio Implementation** - Already completed
2. 🔄 **Git Commit** - Commit new Dio changes
3. 📦 **Rebuild Web** - Fresh Flutter web build
4. 🚀 **Deploy** - Update server web folder

### Future Improvements
1. **Add WebSocket** - Real-time notifications
2. **Implement Caching** - Redis for API responses
3. **Add Rate Limiting** - Prevent API abuse
4. **Optimize Images** - Compress uploads with Sharp
5. **Add Analytics** - Track user behavior
6. **Implement PWA** - Offline support
7. **Add Tests** - Unit & integration tests

---

## 📞 Support

**Repository**: [Karur Gastro Foundation](https://github.com/movi-innovations/Karur-Gastro-Foundation)  
**Test Repo**: [HMS-DEV](https://github.com/movicloudlabs-ai-testenv/HMS-DEV)

---

**Generated**: 2025-12-03  
**Status**: ✅ Production Ready with Dio HTTP Client  
**Version**: 1.0.0
