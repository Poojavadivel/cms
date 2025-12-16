# HMS - Hospital Management System (React Frontend)

A modern, responsive Hospital Management System built with React, designed for seamless patient care management, appointment scheduling, staff management, and more.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

**Login Credentials:**
- Email: `banu@karurgastro.com`
- Backend: `https://hms-dev.onrender.com/api`

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

- [📖 Documentation Index](docs/README.md) - Complete documentation guide
- [🚀 Deployment Guide](docs/README.md#deployment-guide) - Deploy to Render.com
- [🔧 API Configuration](docs/API_FIX_COMPLETE.md) - Backend integration
- [🐛 Troubleshooting](docs/STAFF_DEBUG_GUIDE.md) - Debug guides
- [📝 File Organization](docs/FILE_CLEANUP_ANALYSIS.md) - Project structure

## 🏗️ Project Structure

```
hms/
├── src/                  # Source code
│   ├── components/       # Reusable components
│   ├── modules/          # Feature modules
│   ├── services/         # API services
│   ├── models/           # Data models
│   ├── routes/           # Routing configuration
│   └── provider/         # Context providers
├── public/               # Static assets
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── build/                # Production build (generated)
└── node_modules/         # Dependencies
```

## 🛠️ Utility Scripts

Located in the `scripts/` folder:

```bash
# Clear React cache
scripts\CLEAR_CACHE.bat

# Start app with pre-flight checks
scripts\START_FIXED_APP.bat

# Verify API configuration
scripts\VERIFY_API_CONFIG.bat

# Test backend connectivity
node scripts/test-backend.js
```

## 📦 Features

- ✅ Patient Management
- ✅ Appointment Scheduling
- ✅ Staff Management with Active/Inactive Filters
- ✅ Pharmacy & Medicine Management
- ✅ Pathology Lab Reports
- ✅ Invoice & Billing System
- ✅ Doctor Dashboard
- ✅ Real-time Updates
- ✅ Responsive Design
- ✅ Role-based Access Control

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=https://hms-dev.onrender.com/api
REACT_APP_NAME=HMS - Hospital Management System
REACT_APP_VERSION=1.0.0
```

See [`.env.example`](.env.example) for all available variables.

## 🚢 Deployment

### Deploy to Render.com

This project includes a [`render.yaml`](render.yaml) configuration for automated deployment:

1. Push code to GitHub
2. Connect repository to Render
3. Render auto-detects configuration and deploys

For manual deployment instructions, see [Deployment Guide](docs/README.md#deployment-guide).

---

## 🧰 Available Scripts (Create React App)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
