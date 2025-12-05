# Karur Gastro Foundation - Hospital Management System

## ≡ƒÅÑ Overview
Enterprise-grade Hospital Management System built with **Flutter** (Frontend) and **Node.js** (Backend). Designed for modern healthcare facilities with comprehensive modules for patient management, pharmacy, pathology, appointments, and payroll.

## ≡ƒÜÇ Quick Start

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

## ≡ƒôª Key Modules

### ≡ƒæ¿ΓÇì≡ƒÆ╝ Admin
- Dashboard with real-time analytics
- Patient management (CRUD operations)
- Doctor assignment and tracking
- Appointment scheduling
- Pharmacy inventory management
- Pathology test management  
- Payroll system
- Staff management

### ≡ƒæ¿ΓÇìΓÜò∩╕Å Doctor
- Patient queue management
- Medical records access
- Prescription writing with live stock check
- Pathology test orders
- Appointment management
- Patient history review

### ≡ƒÆè Pharmacist
- Medicine inventory (Add/Edit/Delete/View)
- Stock level monitoring (In Stock/Low Stock/Out of Stock)
- Prescription fulfillment
- Sales tracking
- Analytics dashboard

### ≡ƒº¬ Pathologist
- Test result entry
- Report generation
- Patient test history
- Custom test management

## ≡ƒùä∩╕Å Tech Stack

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

## ≡ƒôü Project Structure

```
karur/
Γö£ΓöÇΓöÇ lib/
Γöé   Γö£ΓöÇΓöÇ Models/          # Data models
Γöé   Γö£ΓöÇΓöÇ Services/        # API services
Γöé   Γö£ΓöÇΓöÇ Modules/         # Feature modules
Γöé   Γöé   Γö£ΓöÇΓöÇ Admin/
Γöé   Γöé   Γö£ΓöÇΓöÇ Doctor/
Γöé   Γöé   Γö£ΓöÇΓöÇ Pharmacist/
Γöé   Γöé   ΓööΓöÇΓöÇ Pathologist/
Γöé   Γö£ΓöÇΓöÇ Utils/           # Helper functions
Γöé   ΓööΓöÇΓöÇ Widgets/         # Reusable widgets
Γö£ΓöÇΓöÇ Server/
Γöé   Γö£ΓöÇΓöÇ Models/          # MongoDB schemas
Γöé   Γö£ΓöÇΓöÇ routes/          # API endpoints
Γöé   Γö£ΓöÇΓöÇ Middleware/      # Auth middleware
Γöé   Γö£ΓöÇΓöÇ Config/          # Configuration
Γöé   ΓööΓöÇΓöÇ web/             # Flutter web build
ΓööΓöÇΓöÇ assets/              # Images & fonts
```

## ≡ƒöº Configuration

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

## ≡ƒôè Features

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

## ≡ƒöÆ Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin, Doctor, Pharmacist, Pathologist)
- Secure API endpoints
- Input validation

## ≡ƒîÉ Deployment

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

## ≡ƒô¥ API Endpoints

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

## ≡ƒÉ¢ Recent Fixes
- Γ£à Doctor assignment in patient update
- Γ£à Appointment reason display from multiple data sources
- Γ£à Patient condition extraction from medical history
- Γ£à Production-level appointment UI with animations
- Γ£à Live stock check in prescription module
- Γ£à Pathology custom test management

## ≡ƒô₧ Support
- **Organization:** movi-innovations
- **Repository:** [Karur-Gastro-Foundation](https://github.com/movi-innovations/Karur-Gastro-Foundation)
- **Test Environment:** [HMS-DEV](https://github.com/movicloudlabs-ai-testenv/HMS-DEV)

## ≡ƒôä License
Proprietary - All rights reserved by Karur Gastro Foundation

## ≡ƒñ¥ Contributing & Branch Workflow

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
2. Click "Pull Requests" ΓåÆ "New Pull Request"
3. Base: `feature/[module-name]` ΓåÉ Compare: `feature/[module-name]-your-feature`
4. Fill in PR template with description and testing notes
5. Request review from team lead

#### 7. Merge to Main Branch (After Approval)

**Option A: Via Pull Request (Recommended)**
```bash
# After feature branch is complete and tested
# Create PR from feature branch to main
# Base: main ΓåÉ Compare: feature/admin-module
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

**Last Updated:** December 5, 2025  
**Version:** 2.0.0  
**Build:** Production Ready
