# HMS React Frontend - Documentation Index

This folder contains all project documentation files organized for easy reference.

## 📚 Documentation Structure

### Deployment & Configuration
- [Deployment Guide](#deployment-guide-below)
- [Environment Variables](#environment-variables)
- [Render.com Configuration](../render.yaml)

### API & Backend Integration
- [API_FIX_COMPLETE.md](API_FIX_COMPLETE.md) - Complete API configuration fix documentation
- [API_FIX_SUMMARY.txt](API_FIX_SUMMARY.txt) - Summary of all API-related changes
- [SERVICES_README.md](SERVICES_README.md) - Services architecture and usage

### Features & Modules
- [DASHBOARD_IMPLEMENTATION.md](DASHBOARD_IMPLEMENTATION.md) - Dashboard module implementation
- [DASHBOARD_README.md](DASHBOARD_README.md) - Dashboard usage guide
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Overall implementation summary
- [MODULE_STRUCTURE.md](MODULE_STRUCTURE.md) - Module organization structure

### Debugging & Troubleshooting
- [DEBUG_DATA_MAPPING.md](DEBUG_DATA_MAPPING.md) - Data mapping debug guide
- [STAFF_DEBUG_GUIDE.md](STAFF_DEBUG_GUIDE.md) - Staff module debugging
- [STAFF_FILTER_FIX.md](STAFF_FILTER_FIX.md) - Staff filter issue resolution

### Quick Start Guides
- [QUICK_START_GUIDE.txt](QUICK_START_GUIDE.txt) - Quick start for developers
- [QUICK_GUIDE_APPOINTMENT_PREVIEW.md](QUICK_GUIDE_APPOINTMENT_PREVIEW.md) - Appointment preview feature

### Architecture & Patterns
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration guide for updates
- [PROVIDER_README.md](PROVIDER_README.md) - Context providers documentation
- [ROUTES_README.md](ROUTES_README.md) - Routing structure and configuration
- [STATUS.md](STATUS.md) - Status management system

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18.17.0 or higher
- npm or yarn package manager
- Render.com account (for production deployment)

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Edit .env with your local settings
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   Application will run on http://localhost:3000

### Production Build

1. **Build for Production**
   ```bash
   npm run build
   ```
   This creates an optimized production build in the `build/` folder.

2. **Test Production Build Locally**
   ```bash
   npm install -g serve
   serve -s build -l 4173
   ```
   Test at http://localhost:4173

### Deploy to Render.com

#### Option 1: Using render.yaml (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml` configuration

3. **Deploy**
   - Render will automatically build and deploy
   - Your app will be live at: `https://your-app-name.onrender.com`

#### Option 2: Manual Configuration

1. **Create New Static Site on Render**
   - Service Type: Static Site
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

2. **Environment Variables**
   ```
   NODE_VERSION=18.17.0
   REACT_APP_API_URL=https://hms-dev.onrender.com/api
   ```

3. **Custom Headers** (in render.yaml)
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block

### Environment Variables

#### Development (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENABLE_DEBUG=true
```

#### Production (.env.production)
```env
REACT_APP_API_URL=https://hms-dev.onrender.com/api
REACT_APP_ENABLE_DEBUG=false
GENERATE_SOURCEMAP=false
```

### Build Optimization

The production build is optimized with:
- ✅ Code splitting and lazy loading
- ✅ Minification and compression
- ✅ Tree shaking to remove unused code
- ✅ Asset optimization (images, fonts)
- ✅ Service worker for offline support
- ✅ Cache busting with content hashes

### Troubleshooting Deployment

#### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Runtime Errors
1. Check browser console (F12)
2. Verify API_URL in environment variables
3. Check CORS settings on backend
4. Verify x-auth-token authentication

#### White Screen on Load
1. Check build/index.html was created
2. Verify routes configuration
3. Check for JavaScript errors in console
4. Ensure all assets loaded correctly

---

## 🔧 Configuration Files

### render.yaml
Complete Render.com deployment configuration with:
- Static site setup
- Build commands
- Environment variables
- Security headers
- URL rewrite rules for SPA

### package.json
Project dependencies and scripts:
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run prod-build` - Build with production API URL

### .env Files
- `.env` - Local development
- `.env.example` - Template with all variables
- `.env.production` - Production build configuration

---

## 📝 Recent Updates

### 2025-12-16
- ✅ Fixed all React ESLint warnings
- ✅ Fixed staff Active/Inactive filter functionality
- ✅ Added intelligent status categorization
- ✅ Added status counts to filter tabs
- ✅ Added debug logging for filter operations
- ✅ Organized documentation into docs/ folder
- ✅ Created deployment configuration for Render.com

### 2025-12-15
- ✅ Fixed API URL configuration (/api suffix)
- ✅ Standardized authentication headers (x-auth-token)
- ✅ Fixed all service files for backend compatibility
- ✅ Updated token storage handling

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update relevant documentation
5. Submit pull request

---

## 📞 Support

For issues or questions:
1. Check documentation in this folder
2. Review troubleshooting sections
3. Check browser console for errors
4. Verify backend connectivity

---

**Last Updated:** December 16, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
