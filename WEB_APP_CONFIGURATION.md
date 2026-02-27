# Web App Configuration Update

## Summary
Successfully configured the server to serve the **React HMS Web App** instead of the Flutter web build.

## Changes Made

### 1. Server.js Configuration
**File**: `D:\MOVICLOULD\Hms\karur\Server\Server.js`

**Changed Line 28:**
```javascript
// Before:
const webAppPath = path.join(__dirname, 'web');

// After:
const webAppPath = path.join(__dirname, '..', 'react', 'hms', 'build');
```

## Web App Details

### Access Point
```
http://localhost:5000
```

### Technology Stack
- **Framework**: React.js
- **Build Tool**: Create React App / Vite
- **Location**: `D:\MOVICLOULD\Hms\karur\react\hms\build`
- **Server Port**: 5000 (configurable via PORT environment variable)

### Directory Structure
```
react/hms/build/
├── assets/              # Static assets
├── static/             # Static files (CSS, JS)
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── favicon.ico         # Favicon
├── boyicon.png         # Custom icon
├── girlicon.png        # Custom icon
└── robots.txt          # SEO robots file
```

## How It Works

1. **Static File Serving**: Express serves all static files from the build directory
2. **SPA Routing**: All non-API routes (`/*`) return `index.html` for client-side routing
3. **API Routes**: All `/api/*` routes continue to function normally

## Server Behavior

### Static Routes
- `/` → Serves `index.html` (React App)
- `/static/*` → Serves bundled JS/CSS
- `/assets/*` → Serves images/fonts

### API Routes (Preserved)
- `/api/auth` - Authentication
- `/api/appointments` - Appointments
- `/api/staff` - Staff management
- `/api/patients` - Patient records
- `/api/doctors` - Doctor operations
- `/api/pharmacy` - Pharmacy management
- `/api/pathology` - Lab tests
- `/api/bot` - Chatbot services
- `/api/intake` - Patient intake
- `/api/scanner-enterprise` - Document scanning
- `/api/card` - Card management
- `/api/payroll` - Payroll system
- `/api/reports` - Reports
- `/api/telegram` - Telegram bot

## Starting the Server

```bash
cd D:\MOVICLOULD\Hms\karur\Server
node Server.js
```

### Expected Output
```
[scanner-landingai] ✅ LandingAI ADE initialized
✅ Telegram Bot initialized successfully
✅ Telegram Bot activated and running...
✅ Mongoose: Connected to MongoDB successfully
Admin user already exists.
Doctor user already exists.
Pharmacist user already exists.
Pathologist user already exists.
� Initial admin user check completed.
� Server is listening on port 5000
```

## Mobile App Note

The mobile app (`D:\MOVICLOULD\Hms\karur\mobile`) is a **React Native Expo** application designed for native mobile platforms:
- **iOS**: Via Expo Go or standalone build
- **Android**: Via Expo Go or standalone build
- **Web**: Requires `expo export --platform web` (currently has build issues)

For web deployment, the **React HMS app** is the recommended solution as it's already production-ready.

## Rebuilding React App

If you need to rebuild the React app:

```bash
cd D:\MOVICLOULD\Hms\karur\react\hms
npm run build
```

This will regenerate the `build` directory that the server serves.

## Environment Variables

Server uses these key environment variables (`.env` in Server directory):
- `PORT` - Server port (default: 5000)
- `MANGODB_URL` - MongoDB connection string
- `JWT_SECRET` - JWT authentication secret
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - Initial admin credentials
- `LANDINGAI_API_KEY` - Document scanning API key
- `AZURE_OPENAI_API_KEY` - AI chatbot API key
- `Telegram_API` - Telegram bot token

## Verification Completed ✅

- ✅ Server.js updated to point to React build
- ✅ React build directory exists and contains valid files
- ✅ Server starts successfully on port 5000
- ✅ Static file serving configured
- ✅ SPA routing configured
- ✅ API routes preserved and functional

## Next Steps

1. **Start the server**: `node Server.js` in the Server directory
2. **Access the app**: Open browser to `http://localhost:5000`
3. **Login**: Use credentials from `.env` file
   - Admin: admin@hms.com / 12332112
   - Doctor: doctor@hms.com / doctor123
   - Pharmacist: pharmacist@hms.com / 12332112
   - Pathologist: pathologist@hms.com / 12332112
