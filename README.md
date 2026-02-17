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

## 🤝 Contributing & Branch Workflow

This project follows industry-standard Git workflow practices with feature branches for each module.

### Development Branches

We maintain separate feature branches for modular development:

- `feature/admin-module` - Admin dashboard and management features
- `feature/doctor-module` - Doctor-specific functionality
- `feature/pathologist-module` - Pathology lab features
- `feature/pharmacist-module` - Pharmacy management
- `feature/common-module` - Shared components and utilities

### How to Clone and Work with Feature Branches

#### 1. Clone the Repository
```bash
# Clone from test environment
git clone https://github.com/movicloudlabs-ai-testenv/HMS-DEV.git
cd HMS-DEV
```

#### 2. Checkout a Feature Branch
```bash
# List all branches
git branch -a

# Checkout specific feature branch
git checkout feature/admin-module
# OR
git checkout feature/doctor-module
# OR
git checkout feature/pathologist-module
# OR
git checkout feature/pharmacist-module
# OR
git checkout feature/common-module
```

#### 3. Create Your Working Branch
```bash
# Create a new branch from feature branch
git checkout -b feature/admin-module-your-feature-name

# Example:
git checkout -b feature/admin-module-add-analytics
git checkout -b feature/doctor-module-prescription-fix
```

#### 4. Make Changes and Commit
```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat(admin): add real-time analytics dashboard"

# Commit message format:
# feat(module): description - New feature
# fix(module): description - Bug fix
# docs(module): description - Documentation
# refactor(module): description - Code refactoring
# test(module): description - Adding tests
```

#### 5. Push Your Changes
```bash
# Push to test environment
git push origin feature/admin-module-your-feature-name
```

#### 6. Create Pull Request
1. Go to: https://github.com/movicloudlabs-ai-testenv/HMS-DEV
2. Click "Pull Requests" → "New Pull Request"
3. Base: `feature/[module-name]` ← Compare: `feature/[module-name]-your-feature`
4. Fill in PR template with description and testing notes
5. Request review from team lead

#### 7. Merge to Main Branch (After Approval)

**Option A: Via Pull Request (Recommended)**
```bash
# After feature branch is complete and tested
# Create PR from feature branch to main
# Base: main ← Compare: feature/admin-module
```

**Option B: Manual Merge (Team Lead Only)**
```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/admin-module --no-ff

# Push to main
git push origin main

# Push to production remote
git push test main
```

### Best Practices

1. **Never commit directly to main** - Always use feature branches
2. **Keep branches updated** - Regularly sync with main
   ```bash
   git checkout feature/admin-module
   git pull origin main
   ```
3. **Write meaningful commits** - Use conventional commit format
4. **Test before pushing** - Run tests and build locally
5. **Small, focused PRs** - Keep changes manageable and reviewable
6. **Code review required** - All PRs need approval before merge
7. **Delete merged branches** - Clean up after successful merge
   ```bash
   git branch -d feature/admin-module-your-feature
   git push origin --delete feature/admin-module-your-feature
   ```

### Branch Protection Rules

- **main branch**: Protected, requires PR and review
- **feature branches**: Open for team development
- **CI/CD**: Automated tests run on all PRs

### Getting Help

- Check branch-specific CONTRIBUTING.md in each feature branch
- Contact module lead for branch-specific questions
- Review closed PRs for examples

---

## 📚 Detailed Documentation (New - Dec 15, 2024)

### Staff Management Module Documentation

Comprehensive documentation for the recently implemented Staff Management module:

#### 🎯 Quick Access

| Document | Purpose | For | Read Time |
|----------|---------|-----|-----------|
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Project status & overview | Managers, Stakeholders | 20 min |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Developer quick-start | Developers | 15 min |
| [STAFF_IMPLEMENTATION_COMPLETE.md](./STAFF_IMPLEMENTATION_COMPLETE.md) | Complete technical docs | Developers, Architects | 30 min |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Testing procedures | QA, Testers | 25 min |
| [CHANGES_SUMMARY_2024-12-15.md](./CHANGES_SUMMARY_2024-12-15.md) | Recent changes log | All | 15 min |

#### 📖 Documentation by Role

**For Project Managers / Stakeholders:**
- Start with [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- Review deployment readiness and success metrics

**For Developers:**
- Quick start: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- Deep dive: [STAFF_IMPLEMENTATION_COMPLETE.md](./STAFF_IMPLEMENTATION_COMPLETE.md)
- Recent changes: [CHANGES_SUMMARY_2024-12-15.md](./CHANGES_SUMMARY_2024-12-15.md)

**For QA/Testers:**
- Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing
- Use bug report template included in guide

#### 🎉 Recent Achievements (Dec 15, 2024)

**Staff Module v1.0.0 - Production Ready:**
- ✅ All CRUD operations implemented
- ✅ Exact Flutter feature parity
- ✅ API 404 errors fixed
- ✅ UI/UX optimizations complete
- ✅ Comprehensive documentation
- ✅ Ready for deployment

**Key Metrics:**
- Zero known bugs
- 100% feature completion
- <2s page load time
- Cross-browser compatible
- Fully responsive
- Production-grade code quality

---

**Last Updated:** December 15, 2024  
**Version:** 2.1.0  
**Build:** Production Ready  
**Status:** ✅ Staff Module Complete
