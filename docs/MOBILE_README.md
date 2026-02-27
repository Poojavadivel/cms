# HMS Mobile Application - Developer Guide

This React Native application is a port of the HMS Web System, built with Expo and React Native.

## Project Structure

```
HMSMobile/
├── src/
│   ├── models/           # Data models (Admin, Doctor, etc.)
│   ├── modules/          # Screen modules by role
│   │   ├── admin/
│   │   ├── doctor/
│   │   ├── pharmacist/
│   │   └── pathologist/
│   ├── navigation/       # Navigation configuration
│   │   ├── AppNavigator.js       # Root navigator
│   │   └── [Role]Navigator.js    # Role-based drawers
│   ├── pages/            # Shared/Auth screens (Login, Splash)
│   ├── provider/         # Context Providers (Auth, Theme, etc.)
│   └── services/         # API services (authService, apiConstants)
├── App.js                # Application Entry Point
├── app.json              # Expo Configuration
└── package.json          # Dependencies
```

## Features Implemented

1.  **Authentication**:
    *   JWT-based login with role detection.
    *   Secure storage using `AsyncStorage`.
    *   Auto-login (Remember Me) functionality.
    *   SVG-based CAPTCHA implementation.

2.  **Navigation**:
    *   Role-based routing (Admin, Doctor, Pharmacist, Pathologist).
    *   Custom Drawer navigation mirroring the web sidebar.
    *   Protected routes based on authentication state.

3.  **Modules**:
    *   **Admin**: Dashboard, Patients, Appointments, Staff, Pharmacy, Pathology, Payroll, Settings.
    *   **Doctor**: Dashboard, Appointments, My Patients, Schedule, Settings.
    *   **Pharmacist**: Dashboard, Medicines, Prescriptions, Settings.
    *   **Pathologist**: Dashboard, Test Reports, Patients, Settings.

4.  **UI/UX**:
    *   Pixel-perfect port of the web design.
    *   Pull-to-refresh on all list screens.
    *   Loading states and error handling.
    *   Toast notifications (via NotificationContext).

## How to Run

1.  **Navigate to Project Directory**:
    ```bash
    cd HMS-DEV-main/HMSMobile
    # If on Windows and the above doesn't work, try:
    # cd HMS-DEV-main
    # cd HMSMobile
    ```

2.  **Install Dependencies** (if not done):
    ```bash
    npm install
    ```

3.  **Start the Development Server**:
    ```bash
    npx expo start
    ```

3.  **Run on Device/Emulator**:
    *   **Android**: Press `a` in the terminal (requires Android Studio/Emulator).
    *   **iOS**: Press `i` in the terminal (requires Xcode/Simulator - Mac only).
    *   **Physical Device**: Download **Expo Go** app and scan the QR code.

## Configuration

*   **API URL**: Configured in `src/services/apiConstants.js`. Currently pointing to `https://hms-dev.onrender.com/api`.

## Troubleshooting

*   **Network Errors**: Ensure your device has internet access to reach the backend.
*   **Clear Cache**: If you see weird issues, run `npx expo start -c` to clear the bundler cache.
