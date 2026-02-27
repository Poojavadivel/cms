# 🏥 Hospital Management System (HMS) - Karur

A comprehensive, multi-platform Hospital Management System built with Flutter, React, Node.js, and MongoDB. This system provides complete hospital operations management including patient intake, appointments, pharmacy, pathology, payroll, and AI-powered document scanning.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Installation & Setup](#installation--setup)
- [Available Scripts](#available-scripts)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## 🌟 Overview

The Hospital Management System (HMS) is a full-stack application designed to streamline hospital operations. It consists of three main applications:

1. **Flutter Mobile/Desktop App** - Cross-platform native application
2. **React Web App** - Modern web-based interface
3. **Mobile React Native/Expo App** - Mobile-optimized web application
4. **Node.js Backend** - RESTful API server with MongoDB

---

## 🛠 Technology Stack

### Frontend Applications

#### Flutter Application
- **Framework**: Flutter 3.6.2+
- **State Management**: Provider, Riverpod
- **UI Libraries**: 
  - Material Design & Cupertino
  - Google Fonts
  - Iconsax Icons
  - FL Chart (Analytics)
  - Table Calendar
- **Utilities**: 
  - HTTP & Dio (API calls)
  - File Picker & Image Picker
  - PDF Generation
  - Shared Preferences

#### React Web Application
- **Framework**: React 19.2.1
- **Router**: React Router DOM 7.10.1
- **Styling**: TailwindCSS 3.4.19
- **UI/UX**: 
  - Framer Motion (Animations)
  - React Icons
  - React Calendar
- **Charts**: Recharts 3.5.1
- **PDF**: jsPDF, html2canvas
- **Build**: Create React App

#### Mobile Expo Application
- **Framework**: Expo
- **Build**: Metro bundler
- **Export**: Web-optimized static build

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 4.22.1
- **Database**: MongoDB 6.19.0 with Mongoose 8.18.0
- **Authentication**: JWT (jsonwebtoken 9.0.2), bcryptjs 3.0.2
- **File Upload**: Multer 2.0.2
- **AI Integration**: 
  - Google Generative AI 0.24.1
  - Google Cloud Vision 5.3.3
- **PDF Processing**: 
  - PDFKit 0.17.2
  - PDFMake 0.2.20
  - pdf-parse 2.2.13
- **Image Processing**: Sharp 0.34.4
- **Bot Integration**: Node Telegram Bot API 0.66.0
- **Utilities**: 
  - Axios, CORS, dotenv
  - UUID 8.3.2
  - Form-data

---

## 📁 Project Structure

```
karur/
│
├── 📱 FLUTTER APPLICATION
│   ├── lib/                          # Flutter source code
│   │   ├── main.dart                 # Application entry point
│   │   ├── Models/                   # Data models
│   │   ├── Modules/                  # Feature modules
│   │   ├── Providers/                # State management
│   │   ├── Services/                 # API services
│   │   ├── Utils/                    # Utility functions
│   │   └── Widgets/                  # Reusable UI components
│   ├── assets/                       # Images and static assets
│   ├── android/                      # Android platform code
│   ├── ios/                          # iOS platform code
│   ├── web/                          # Web platform code
│   ├── windows/                      # Windows platform code
│   ├── linux/                        # Linux platform code
│   ├── macos/                        # macOS platform code
│   ├── test/                         # Unit tests
│   ├── pubspec.yaml                  # Flutter dependencies
│   └── analysis_options.yaml         # Flutter linting rules
│
├── 🌐 REACT WEB APPLICATION
│   └── react/hms/
│       ├── src/                      # React source code
│       │   ├── App.js                # Main app component
│       │   ├── index.js              # Entry point
│       │   ├── components/           # Reusable components
│       │   ├── modules/              # Feature modules
│       │   ├── pages/                # Page components
│       │   ├── routes/               # Route definitions
│       │   ├── services/             # API services
│       │   ├── provider/             # Context providers
│       │   ├── utils/                # Utilities
│       │   ├── models/               # TypeScript/JS models
│       │   ├── widgets/              # UI widgets
│       │   ├── assets/               # Static assets
│       │   ├── styles/               # CSS/SCSS files
│       │   └── constants/            # App constants
│       ├── public/                   # Public assets
│       ├── build/                    # Production build
│       ├── scripts/                  # Build scripts
│       ├── package.json              # NPM dependencies
│       ├── tailwind.config.js        # TailwindCSS config
│       ├── postcss.config.js         # PostCSS config
│       ├── server.js                 # Production server
│       └── .env                      # Environment variables
│
├── 📱 MOBILE EXPO APPLICATION
│   └── mobile/
│       ├── src/                      # Mobile app source
│       ├── App.js                    # Main app component
│       ├── assets/                   # Mobile assets
│       ├── dist/                     # Web export build
│       ├── app.json                  # Expo configuration
│       ├── babel.config.js           # Babel config
│       ├── metro.config.js           # Metro bundler config
│       ├── package.json              # Dependencies
│       └── README.md                 # Mobile app docs
│
├── 🖥️ BACKEND SERVER
│   └── Server/
│       ├── Server.js                 # Main server entry point
│       ├── Config/                   # Database & app config
│       ├── Models/                   # MongoDB models
│       ├── routes/                   # API routes
│       │   ├── auth.js               # Authentication
│       │   ├── appointment.js        # Appointments
│       │   ├── patients.js           # Patient management
│       │   ├── doctors.js            # Doctor management
│       │   ├── staff.js              # Staff management
│       │   ├── pharmacy.js           # Pharmacy operations
│       │   ├── pathology.js          # Lab/Pathology
│       │   ├── intake.js             # Patient intake
│       │   ├── scanner-enterprise.js # AI document scanning
│       │   ├── payroll.js            # Payroll system
│       │   ├── bot.js                # Chatbot integration
│       │   ├── card.js               # Card management
│       │   ├── enterpriseReports.js  # Enterprise reports
│       │   └── properReports.js      # Standard reports
│       ├── Middleware/               # Express middleware
│       ├── Bot/                      # Telegram bot logic
│       ├── utils/                    # Utility functions
│       ├── image-processor/          # Image processing
│       ├── uploads/                  # File uploads storage
│       ├── web/                      # Serves mobile web build
│       ├── scripts/                  # Database scripts
│       │   ├── seed_*.js             # Data seeding scripts
│       │   ├── reset_*.js            # Database reset scripts
│       │   ├── check_*.js            # Verification scripts
│       │   └── test_*.js             # API test scripts
│       ├── package.json              # Node.js dependencies
│       ├── .env                      # Environment config
│       └── n8n.json                  # Workflow automation
│
├── 📚 DOCUMENTATION
│   └── docs/                         # Comprehensive documentation
│       ├── README.md                 # Documentation index
│       ├── DEVELOPER_GUIDE.md        # Developer setup guide
│       ├── DEPLOYMENT_CHECKLIST.md   # Deployment guide
│       ├── INTEGRATION_GUIDE.md      # Integration guide
│       ├── MOBILE_README.md          # Mobile app docs
│       ├── LANDINGAI_README.md       # AI scanning docs
│       ├── API_*.md                  # API documentation
│       ├── BUG_*.md                  # Bug fix reports
│       └── [50+ documentation files]
│
├── 🤖 CHATBOT
│   └── chatbot/                      # Chatbot implementation
│
├── 📄 HELPER FILES
│   ├── error/                        # Error logs
│   ├── document/                     # Document templates
│   ├── debug_db.js                   # Database debugging
│   ├── inspect_db.js                 # Database inspection
│   ├── test_medicine_api.html        # Medicine API tester
│   └── test_prescription_api.html    # Prescription API tester
│
├── 🔧 UTILITY SCRIPTS (Batch Files)
│   ├── REBUILD_APP.bat               # Rebuild Flutter app
│   ├── RESET_DATABASE.bat            # Reset MongoDB database
│   ├── RESTART_REACT_LOCALHOST.bat   # Restart React dev server
│   ├── RESTART_SERVER.bat            # Restart Node.js server
│   └── START_PAYROLL_SYSTEM.bat      # Start payroll system
│
├── 📝 ROOT DOCUMENTATION
│   ├── FRONTEND_FIX_MEDICAL_HISTORY.md
│   ├── MEDICAL_HISTORY_DEBUG_GUIDE.md
│   └── UPLOAD_PAGE_INFO_BUTTON_FIX.md
│
└── 📋 CONFIGURATION
    ├── pubspec.yaml                  # Flutter config
    ├── analysis_options.yaml         # Flutter analysis
    ├── devtools_options.yaml         # Flutter DevTools
    ├── glowhair.iml                  # IntelliJ config
    ├── package-lock.json             # NPM lock file
    └── .gitignore                    # Git ignore rules
```

---

## ✨ Key Features

### 👥 User Management
- Multi-role authentication (Admin, Doctor, Staff, Pharmacy, Pathology)
- JWT-based secure authentication
- User profile management
- Staff and doctor management

### 📅 Appointment System
- Schedule and manage appointments
- Doctor availability tracking
- Appointment status management
- Calendar integration

### 🏥 Patient Management
- Patient registration and intake
- Medical history tracking
- Patient demographics
- Insurance and emergency contact management
- Vital signs recording

### 💊 Pharmacy Module
- Medicine inventory management
- Prescription processing
- Stock tracking and alerts
- Billing and collections
- Bulk medicine upload

### 🔬 Pathology/Lab Module
- Test ordering and management
- Pending test tracking
- Lab report generation
- Result management
- Sample tracking

### 🤖 AI-Powered Features
- **LandingAI Integration**: Automated document scanning
- **Google Vision API**: OCR and image processing
- **Google Generative AI**: Medical document parsing
- Medical history extraction from scanned documents
- Lab report parsing and extraction

### 💳 Billing & Reports
- Patient billing
- Pharmacy collections tracking
- Pathology billing
- Enterprise-level reporting
- Custom report generation

### 💰 Payroll System
- Staff payroll management
- Salary calculation
- Payroll reports
- Employee records

### 💬 Communication
- Telegram bot integration
- In-app messaging
- Notifications system

### 📄 Document Management
- Document upload and storage
- Document type categorization
- Medical history documents
- Lab reports storage
- Prescription management

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js**: v16+ 
- **Flutter SDK**: 3.6.2+
- **MongoDB**: 6.0+
- **npm** or **yarn**
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd karur
```

### 2. Backend Setup

```bash
cd Server
npm install

# Create .env file with required variables
# See Server/.env.example for reference

# Start the server
npm start

# OR for development with auto-reload
npm run dev
```

**Required Environment Variables:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hms
JWT_SECRET=your_jwt_secret
LANDINGAI_API_KEY=your_landingai_key
GOOGLE_CLOUD_VISION_KEY=your_google_vision_key
```

### 3. React Web App Setup

```bash
cd react/hms
npm install

# Create .env file
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start

# Build for production
npm run build
```

### 4. Flutter App Setup

```bash
# From project root
flutter pub get

# Run on desired platform
flutter run -d chrome          # Web
flutter run -d windows         # Windows
flutter run                    # Default device
```

### 5. Mobile Expo App Setup

```bash
cd mobile
npm install

# Start Expo development
npm start

# Build for web
npx expo export:web
```

### 6. Database Seeding

```bash
cd Server

# Seed complete data
node seed_complete_data.js

# Seed specific data
node seed_100_medicines.js
node seed_sample_medicines.js
node seed_enterprise_data.js
node create_sample_payroll.js
```

---

## 📜 Available Scripts

### Backend (Server/)

```bash
npm start              # Start production server
npm run dev            # Start with nodemon (auto-reload)
node debug_db.js       # Debug database connection
node inspect_db.js     # Inspect database contents
node reset_database_keep_users.js  # Reset DB keeping users
```

### React Web (react/hms/)

```bash
npm start              # Start development server (port 3000)
npm run build          # Production build
npm test               # Run tests
npm run prod-build     # Production build with API URL
npm run serve          # Serve production build
```

### Flutter

```bash
flutter run            # Run on connected device
flutter build web      # Build for web
flutter build windows  # Build for Windows
flutter test           # Run tests
flutter clean          # Clean build files
```

### Mobile (mobile/)

```bash
npm start              # Start Expo dev server
npx expo export:web    # Export to web
```

### Batch Scripts (Windows)

```cmd
RESTART_SERVER.bat              # Restart Node.js backend
RESTART_REACT_LOCALHOST.bat     # Restart React dev server
REBUILD_APP.bat                 # Clean and rebuild Flutter
RESET_DATABASE.bat              # Reset MongoDB database
START_PAYROLL_SYSTEM.bat        # Start payroll module
```

---

## 📖 Documentation

Comprehensive documentation is available in the `docs/` folder. Key documents:

### Getting Started
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Integration Guide](docs/INTEGRATION_GUIDE.md)

### Features
- [LandingAI Integration](docs/LANDINGAI_README.md)
- [Medical History System](docs/MEDICAL_HISTORY_DATA_FLOW.md)
- [Document Upload System](docs/DOCUMENT_UPLOAD_SYSTEM_COMPLETE.md)
- [Bulk Upload Logic](docs/BULK_UPLOAD_LOGIC_EXPLAINED.md)

### API & Backend
- [API Documentation](docs/API_LOGGING_DOCUMENTATION.md)
- [Database Seeding](docs/SEEDING_COMPLETE.md)
- [Testing Guide](docs/TESTING_GUIDE_VERIFICATION.md)

### Mobile & Web
- [Mobile App Guide](docs/MOBILE_README.md)
- [React Integration](docs/REACT_LANDINGAI_INTEGRATION.md)
- [Web Configuration](docs/WEB_APP_CONFIGURATION.md)

**📚 Total: 50+ Documentation Files**

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
├──────────────┬──────────────┬──────────────┬────────────┤
│   Flutter    │  React Web   │  Mobile Expo │  Telegram  │
│   Desktop    │  Application │  Application │    Bot     │
└──────┬───────┴──────┬───────┴──────┬───────┴─────┬──────┘
       │              │              │             │
       └──────────────┴──────────────┴─────────────┘
                          │
                   ┌──────▼──────┐
                   │   CORS      │
                   │  Middleware │
                   └──────┬──────┘
                          │
       ┌──────────────────▼──────────────────────┐
       │      Express.js REST API Server         │
       │         (Node.js Backend)               │
       ├─────────────────────────────────────────┤
       │  Routes: Auth, Appointments, Patients,  │
       │  Doctors, Staff, Pharmacy, Pathology,   │
       │  Intake, Scanner, Payroll, Reports      │
       └──────────────┬──────────────────────────┘
                      │
       ┌──────────────┼──────────────┐
       │              │              │
   ┌───▼───┐    ┌────▼────┐    ┌───▼────┐
   │MongoDB│    │ LandingAI│    │ Google │
   │Database│    │   API   │    │Cloud AI│
   └───────┘    └─────────┘    └────────┘
```

### Database Schema (MongoDB)

- **Users**: System users (Admin, Doctors, Staff)
- **Patients**: Patient records and demographics
- **Appointments**: Appointment scheduling
- **Medicines**: Pharmacy inventory
- **Prescriptions**: Medical prescriptions
- **PathologyTests**: Lab tests and results
- **MedicalHistory**: Patient medical history
- **Documents**: Uploaded documents
- **Staff**: Hospital staff records
- **Payroll**: Payroll and salary data
- **Cards**: Patient/Staff card management

### Data Flow

1. **User Authentication**: JWT-based authentication
2. **API Requests**: RESTful API endpoints
3. **Data Processing**: Business logic in routes
4. **Database Operations**: Mongoose ORM
5. **AI Processing**: LandingAI/Google AI for documents
6. **File Storage**: Local file system (uploads/)
7. **Response**: JSON responses to clients

---

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Input validation and sanitization
- Secure file upload handling
- Environment variable configuration
- Role-based access control

---

## 🧪 Testing

### Backend API Testing

```bash
# Run test scripts
cd Server
node test_api_connection.js
node test_appointment_availability.js
node test_landingai_api.js
node test_pharmacy_admin.js
```

### Frontend Testing

```bash
# React tests
cd react/hms
npm test

# Flutter tests
flutter test
```

### HTML API Testers

Open in browser:
- `test_medicine_api.html` - Test medicine APIs
- `test_prescription_api.html` - Test prescription APIs

---

## 🛠 Development Workflow

1. **Backend Development**: Modify `Server/` files, test with scripts
2. **React Development**: Edit `react/hms/src/`, hot reload at localhost:3000
3. **Flutter Development**: Edit `lib/` files, hot reload in Flutter
4. **Mobile Development**: Edit `mobile/src/`, use Expo dev tools
5. **Database Changes**: Update models in `Server/Models/`
6. **API Changes**: Update routes in `Server/routes/`

---

## 🐛 Debugging

### Database Debugging
```bash
node Server/debug_db.js        # Check connections
node Server/inspect_db.js      # Inspect data
```

### Check Data
```bash
node Server/check_patient_count.js
node Server/check_medicines.js
node Server/check_appointments_count.js
node Server/check_stock.js
```

### Logs
- Backend logs: Console output
- React logs: Browser console
- Flutter logs: Flutter DevTools
- Error logs: `error/` folder

---

## 📦 Deployment

### Production Deployment

1. **Backend**: Deploy to cloud (Render, AWS, Heroku)
   - Set environment variables
   - Configure MongoDB Atlas
   - Deploy Node.js server

2. **React Web**: Build and deploy
   ```bash
   cd react/hms
   npm run prod-build
   # Deploy build/ folder to hosting
   ```

3. **Flutter**: Build for target platform
   ```bash
   flutter build web
   flutter build windows
   # Deploy build outputs
   ```

See [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for complete guide.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is proprietary software for Karur Hospital Management.

---

## 👥 Team

- **Project**: Hospital Management System (HMS)
- **Location**: Karur
- **Type**: Multi-platform Healthcare Solution

---

## 📞 Support

For technical support or questions:
- Check documentation in `docs/` folder
- Review error logs in `error/` folder
- Run debug scripts in `Server/`
- Consult specific guides: MEDICAL_HISTORY_DEBUG_GUIDE.md, FRONTEND_FIX_MEDICAL_HISTORY.md

---

## 🎯 Key Highlights

✅ **3 Frontend Applications**: Flutter, React, Mobile  
✅ **Comprehensive Backend**: Node.js + Express + MongoDB  
✅ **AI Integration**: LandingAI + Google Cloud AI  
✅ **50+ Documentation Files**  
✅ **Complete Hospital Operations**: Appointments, Pharmacy, Lab, Payroll  
✅ **Advanced Features**: Document Scanning, Bot Integration, Real-time Updates  
✅ **Production Ready**: Deployment scripts, testing, and monitoring  

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Active Development
