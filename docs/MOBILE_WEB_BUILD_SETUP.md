# Mobile App Web Build Setup

## Overview
The HMS mobile app (Expo React Native) has been configured to build for web and be served from the Node.js backend server.

## Configuration Changes

### 1. Mobile App Package.json
**Location:** `mobile/package.json`

Added build script:
```json
"scripts": {
  "build:web": "expo export --platform web --output-dir dist"
}
```

### 2. Mobile App Config (app.json)
**Location:** `mobile/app.json`

Updated web configuration:
```json
"web": {
  "bundler": "metro"
}
```

### 3. Server Configuration
**Location:** `Server/Server.js` (Line 29)

Changed from React app to Mobile app:
```javascript
// Updated to serve Mobile HMS app build (Expo web export)
const webAppPath = path.join(__dirname, '..', 'mobile', 'dist');
```

## Build Process

### To Build the Mobile App for Web:
```bash
cd mobile
npm run build:web
```

This will:
- Bundle the Expo React Native app for web using Metro bundler
- Export static HTML, JS, and assets to `mobile/dist/` folder
- Include all vector icons fonts and assets
- Create an optimized production build

### Build Output:
```
mobile/dist/
├── index.html          # Main HTML entry point
├── metadata.json       # Build metadata
├── assets/             # Static assets (images, etc.)
└── _expo/
    └── static/
        └── js/
            └── web/
                └── AppEntry-[hash].js  # Main bundled JavaScript
```

## How It Works

1. **Expo Web Support**: Expo apps can run on web using `react-native-web`
2. **Metro Bundler**: Bundles the React Native code for web compatibility
3. **Static Export**: Generates static HTML/JS files that can be served by any web server
4. **Backend Serving**: Node.js Express server serves the static files from `mobile/dist/`

## Server Routing

The server is configured to:
- Serve API routes under `/api/*`
- Serve static assets (JS, CSS, fonts, images)
- Return `index.html` for all other routes (SPA routing support)

```javascript
// Serve static assets
app.use(express.static(webAppPath));

// Catch-all for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.resolve(webAppPath, 'index.html'));
});
```

## Starting the Server

```bash
cd Server
node Server.js
```

The server will start on port 5000 (or PORT from .env) and serve:
- Backend API endpoints
- Mobile app web interface

## Accessing the App

Once the server is running:
- **Web Browser**: http://localhost:5000
- **Mobile View**: Use browser dev tools responsive mode

## Development vs Production

### Development Mode:
```bash
cd mobile
npm run web
```
Runs Expo dev server with hot reload on port 8081

### Production Mode (Current Setup):
```bash
cd mobile
npm run build:web
cd ../Server
node Server.js
```
Serves optimized production build from backend server

## Benefits of This Approach

1. **Single Server**: One backend serves both API and frontend
2. **Production Ready**: Optimized, minified build
3. **Cross-Platform**: Same codebase runs on iOS, Android, and Web
4. **Unified Development**: Mobile and web from single Expo project

## Rebuilding After Changes

Whenever you make changes to the mobile app:

```bash
cd mobile
npm run build:web
```

Then restart the server:
```bash
cd ../Server
node Server.js
```

## Notes

- Build output is ~3.5MB (includes all icon fonts and assets)
- The build includes React Native Web components
- All Expo and React Navigation features work on web
- Calendar, charts, and other mobile components are web-compatible
