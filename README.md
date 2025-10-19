# 🏥 Karur Gastro Foundation - HMS Frontend

[![Flutter](https://img.shields.io/badge/Flutter-3.6.2-02569B?logo=flutter)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.6.2-0175C2?logo=dart)](https://dart.dev/)

A comprehensive Hospital Management System (HMS) Flutter application for Karur Gastro Foundation, providing seamless healthcare management across multiple platforms including Android, iOS, Web, Windows, Linux, and macOS.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Modules](#-modules)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)

## 🌟 Overview

Karur Gastro Foundation HMS is a modern, cross-platform hospital management solution designed to streamline healthcare operations. The application supports multiple user roles (Admin, Doctor, Staff) with dedicated interfaces and features tailored to each role's requirements.

## ✨ Features

### 👨‍💼 Admin Module
- 📊 **Dashboard Analytics** - Real-time hospital metrics and statistics
- 👥 **Staff Management** - Add, edit, and manage hospital staff
- 🏥 **Patient Management** - Complete patient records and history
- 📅 **Appointment Scheduling** - Manage doctor appointments and schedules
- 💊 **Pharmacy Management** - Medicine inventory and prescription tracking
- 🧪 **Pathology** - Lab reports and test management
- 💰 **Invoice Management** - Billing and payment tracking
- ⚙️ **Settings** - System configuration and preferences
- ❓ **Help & Support** - In-app assistance

### 👨‍⚕️ Doctor Module
- 📊 **Personal Dashboard** - Doctor's daily overview
- 📅 **Appointments** - View and manage patient appointments
- 🗓️ **Schedule Management** - Set availability and working hours
- 👤 **Patient Records** - Access complete patient information
- ⚙️ **Settings** - Personal preferences and profile

### 🔐 Common Features
- 🔒 **Secure Authentication** - JWT-based login system
- 🌐 **Offline Support** - Connectivity detection and offline mode
- 📱 **Responsive Design** - Adaptive UI for all screen sizes
- 🎨 **Modern UI/UX** - Clean and intuitive interface with custom themes
- 🔄 **State Management** - Efficient app state handling with Provider & Riverpod
- 💾 **Local Storage** - Persistent data with SharedPreferences
- 📊 **Interactive Charts** - Beautiful data visualization with FL Chart
- 🔍 **Type-ahead Search** - Fast and intelligent search functionality
- 📄 **PDF Support** - Generate and view medical reports
- 📤 **File Management** - Upload and download medical documents

## 🛠️ Tech Stack

### Core Framework
- **Flutter SDK**: ^3.6.2
- **Dart**: ^3.6.2

### State Management
- **flutter_riverpod**: ^2.5.1
- **provider**: ^6.1.5

### UI Components & Design
- **cupertino_icons**: ^1.0.8
- **google_fonts**: ^6.3.0
- **iconsax**: ^0.0.8
- **flutter_svg**: ^2.0.7
- **shimmer**: ^3.0.0
- **velocity_x**: ^4.3.1

### Data & Visualization
- **data_table_2**: ^2.5.7
- **fl_chart**: ^0.68.0
- **table_calendar**: ^3.1.2
- **intl**: ^0.20.0

### Networking & API
- **http**: ^1.4.0
- **http_parser**: ^4.0.2

### Storage & Files
- **shared_preferences**: ^2.2.3
- **file_picker**: ^8.0.3
- **path_provider**: ^2.1.4
- **open_filex**: ^4.5.0

### Utilities
- **connectivity_plus**: ^6.0.3
- **flutter_typeahead**: ^5.2.0
- **path**: ^1.9.0

## 📁 Project Structure

```
lib/
├── 📱 main.dart                    # Application entry point
├── 📝 draft.dart                   # Development drafts
├── 📦 Models/                      # Data models
│   ├── Admin.dart
│   ├── Doctor.dart
│   ├── User.dart
│   ├── Patients.dart
│   ├── Staff.dart
│   ├── appointment_draft.dart
│   └── dashboardmodels.dart
├── 🎯 Modules/                     # Feature modules
│   ├── Admin/                      # Admin interface
│   │   ├── RootPage.dart
│   │   ├── DashboardPage.dart
│   │   ├── AppoimentsScreen.dart
│   │   ├── PatientsPage.dart
│   │   ├── StaffPage.dart
│   │   ├── PharmacyPage.dart
│   │   ├── PathalogyScreen.dart
│   │   ├── InvoicePage.dart
│   │   ├── SettingsPage.dart
│   │   ├── HelpPage.dart
│   │   └── widget/                 # Admin-specific widgets
│   ├── Doctor/                     # Doctor interface
│   │   ├── RootPage.dart
│   │   ├── DashboardPage.dart
│   │   ├── AppoimentsPage.dart
│   │   ├── SchedulePage.dart
│   │   ├── PatientsPage.dart
│   │   ├── SettingsPAge.dart
│   │   └── widgets/                # Doctor-specific widgets
│   └── Common/                     # Shared screens
│       ├── SplashPage.dart
│       ├── LoginPage.dart
│       └── no_internet_screen.dart
├── 🔄 Providers/                   # State management
│   └── app_providers.dart
├── 🌐 Services/                    # API & Business logic
│   ├── Authservices.dart
│   └── Constants.dart
└── 🛠️ Utils/                       # Helper functions

assets/
├── 🖼️ loginbg.png                 # Login background
├── 🤖 chatbotimg.png              # Chatbot avatar
├── 👦 boyicon.png                 # Male patient icon
├── 👧 girlicon.png                # Female patient icon
├── 👨‍⚕️ sampledoctor.png          # Doctor placeholder
└── 🏥 karurlogo.png               # Hospital logo
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- ✅ Flutter SDK (^3.6.2)
- ✅ Dart SDK (^3.6.2)
- ✅ Android Studio / VS Code with Flutter extensions
- ✅ Git

### Installation

1️⃣ **Clone the repository**
```bash
git clone <repository-url>
cd karur
```

2️⃣ **Install dependencies**
```bash
flutter pub get
```

3️⃣ **Run code generation** (if needed)
```bash
flutter pub run build_runner build
```

4️⃣ **Run the application**

For development:
```bash
flutter run
```

For specific platforms:
```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# Web
flutter run -d chrome

# Windows
flutter run -d windows

# Linux
flutter run -d linux

# macOS
flutter run -d macos
```

## ⚙️ Configuration

### Backend API Configuration

Update the API endpoint in `lib/Services/Constants.dart`:

```dart
class Constants {
  static const String baseUrl = 'http://your-backend-url:3000/api';
  // Add other configuration constants
}
```

### Environment Setup

Ensure your backend server is running before starting the frontend application. Refer to the [Backend README](./Server/README.md) for backend setup instructions.

## 🎯 Modules

### Admin Dashboard
Complete control panel for hospital administrators with analytics, management tools, and system configuration.

### Doctor Interface
Streamlined interface for doctors to manage appointments, view patient records, and set schedules.

### Patient Management
Comprehensive patient record system with medical history, appointments, and prescriptions.

### Pharmacy System
Medicine inventory management, prescription tracking, and stock monitoring.

### Appointment System
Intelligent appointment scheduling with calendar integration and notifications.

## 📸 Screenshots

> Add screenshots of your application here

## 🔧 Development

### Code Style

This project follows Flutter's official style guide. Run the linter:

```bash
flutter analyze
```

### Testing

Run tests:
```bash
flutter test
```

### Build for Production

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release

# Web
flutter build web --release

# Windows
flutter build windows --release

# Linux
flutter build linux --release

# macOS
flutter build macos --release
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for Karur Gastro Foundation.

## 📞 Support

For support and queries, please contact the development team.

---

🏥 **Built with ❤️ for Karur Gastro Foundation**
