# Karur Gastro Foundation - Hospital Management System

## 🏥 Overview
Enterprise-grade Hospital Management System built with **Flutter** (Frontend) and **Node.js** (Backend). Designed for modern healthcare facilities with comprehensive modules for patient management, pharmacy, pathology, appointments, and payroll.

## 🚀 Quick Start

### Prerequisites
- Flutter SDK (3.0+)
- Node.js (16+) & npm
- MongoDB (4.4+)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/movi-innovations/Karur-Gastro-Foundation.git
cd karur

# Install Flutter dependencies
flutter pub get

# Install server dependencies
cd Server
npm install
```

### Running the Application

**Backend Server:**
```bash
cd Server
node Server.js
# Server runs on http://localhost:3000
```

**Flutter App:**
```bash
# Desktop
flutter run -d windows

# Web
flutter run -d chrome

# Mobile
flutter run
```

## 📦 Key Modules

### 👨‍💼 Admin
- Dashboard with real-time analytics
- Patient management (CRUD operations)
- Doctor assignment and tracking
- Appointment scheduling
- Pharmacy inventory management
- Pathology test management  
- Payroll system
- Staff management

### 👨‍⚕️ Doctor
- Patient queue management
- Medical records access
- Prescription writing with live stock check
- Pathology test orders
- Appointment management
- Patient history review

### 💊 Pharmacist
- Medicine inventory (Add/Edit/Delete/View)
- Stock level monitoring (In Stock/Low Stock/Out of Stock)
- Prescription fulfillment
- Sales tracking
- Analytics dashboard

### 🧪 Pathologist
- Test result entry
- Report generation
- Patient test history
- Custom test management

## 🗄️ Tech Stack

**Frontend:**
- Flutter/Dart
- Provider (State Management)
- Google Fonts
- FL Chart (Analytics)
- File Picker
- Image Picker

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt (Password hashing)
- Multer (File uploads)
- Google Generative AI integration

## 📁 Project Structure

```
karur/
├── lib/
│   ├── Models/          # Data models
│   ├── Services/        # API services
│   ├── Modules/         # Feature modules
│   │   ├── Admin/
│   │   ├── Doctor/
│   │   ├── Pharmacist/
│   │   └── Pathologist/
│   ├── Utils/           # Helper functions
│   └── Widgets/         # Reusable widgets
├── Server/
│   ├── Models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── Middleware/      # Auth middleware
│   ├── Config/          # Configuration
│   └── web/             # Flutter web build
└── assets/              # Images & fonts
```

## 🔧 Configuration

### Environment Variables
Create `.env` file in `Server/` directory:

```env
MONGO_URI=mongodb://localhost:27017/karur_hms
JWT_SECRET=your_secret_key
PORT=3000
```

### API Base URL
Update in `lib/Services/api_constants.dart`:

```dart
static const String baseUrl = 'http://localhost:3000';
```

## 📊 Features

### Patient Management
- Complete patient profiles with medical history
- Doctor assignment
- Appointment scheduling
- Vitals tracking (BP, pulse, SpO2, temp, BMI)
- Document uploads
- Search and filter capabilities

### Pharmacy System
- Real-time inventory management
- Stock level alerts
- Medicine search with autocomplete
- Batch tracking
- Expiry date monitoring
- Live stock check during prescription

### Pathology Module
- Standard and custom test management
- Result entry with reference ranges
- Report generation
- Test categorization
- Patient test history

### Appointment System
- Production-level UI with animations
- Patient selection with search
- Date/time picker
- Reason/complaint tracking
- Doctor assignment
- Status management (Scheduled/Completed/Cancelled)

## 🔒 Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin, Doctor, Pharmacist, Pathologist)
- Secure API endpoints
- Input validation

## 🌐 Deployment

### Web Deployment
```bash
# Build web app
flutter build web --release

# Copy to Server folder
cp -r build/web Server/web

# Server will serve the web app at root URL
```

### Server Deployment
```bash
cd Server
npm start
# or use PM2 for production
pm2 start Server.js --name karur-hms
```

## 📝 API Endpoints

**Authentication:**
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user

**Patients:**
- GET `/api/patients` - List patients
- POST `/api/patients` - Create patient
- PUT `/api/patients/:id` - Update patient
- DELETE `/api/patients/:id` - Delete patient

**Pharmacy:**
- GET `/api/pharmacy/medicines` - List medicines
- POST `/api/pharmacy/medicines` - Add medicine
- PUT `/api/pharmacy/medicines/:id` - Update medicine
- DELETE `/api/pharmacy/medicines/:id` - Delete medicine

**Appointments:**
- GET `/api/appointments` - List appointments
- POST `/api/appointments` - Create appointment
- PUT `/api/appointments/:id` - Update appointment
- DELETE `/api/appointments/:id` - Delete appointment

## 🐛 Recent Fixes
- ✅ Doctor assignment in patient update
- ✅ Appointment reason display from multiple data sources
- ✅ Patient condition extraction from medical history
- ✅ Production-level appointment UI with animations
- ✅ Live stock check in prescription module
- ✅ Pathology custom test management

## 📞 Support
- **Organization:** movi-innovations
- **Repository:** [Karur-Gastro-Foundation](https://github.com/movi-innovations/Karur-Gastro-Foundation)
- **Test Environment:** [HMS-DEV](https://github.com/movicloudlabs-ai-testenv/HMS-DEV)

## 📄 License
Proprietary - All rights reserved by Karur Gastro Foundation

## 🤝 Contributing
This is a private repository. Contact the administrator for access.

---

**Last Updated:** November 17, 2025  
**Version:** 2.0.0  
**Build:** Production Ready
