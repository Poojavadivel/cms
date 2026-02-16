# Hospital Management System - React Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd D:\MOVICLOULD\Hms\karur\react\hms
npm install
```

### 2. Configure Backend URL

The backend URL is already configured in `.env`:

```env
REACT_APP_API_URL=https://hms-dev.onrender.com/api
```

### 3. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

---

## 📋 Backend API Configuration

### Backend URL
- **Production**: `https://hms-dev.onrender.com`
- **API Base**: `https://hms-dev.onrender.com/api`

### Available Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/validate-token` - Validate JWT token
- `POST /auth/logout` - User logout

#### User Management
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Patient Management
- `GET /patients` - Get all patients
- `GET /patients/:id` - Get patient by ID
- `POST /patients` - Create patient
- `PUT /patients/:id` - Update patient

#### Appointments
- `GET /appointments` - Get all appointments
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment

#### Prescriptions
- `GET /prescriptions` - Get all prescriptions
- `POST /prescriptions` - Create prescription

#### Pharmacy
- `GET /medicines` - Get all medicines
- `POST /medicines` - Add medicine
- `PUT /medicines/:id` - Update medicine

#### Pathology
- `GET /tests` - Get all tests
- `POST /tests` - Create test
- `GET /reports` - Get all reports

---

## 🧪 Testing the Login

### Test Credentials

Based on your backend, you should have test users. Try these patterns:

#### Admin Account
```
Email: admin@karurgastro.com
Password: [your admin password]
```

#### Doctor Account
```
Email: doctor@karurgastro.com
Password: [your doctor password]
```

#### Pharmacist Account
```
Email: pharmacist@karurgastro.com
Password: [your pharmacist password]
```

#### Pathologist Account
```
Email: pathologist@karurgastro.com
Password: [your pathologist password]
```

### Login Flow

1. Navigate to `http://localhost:3000`
2. SplashScreen will check if you're logged in
3. If not logged in, redirect to `/login`
4. Enter credentials
5. Enter CAPTCHA code (displayed on screen)
6. Click "Sign In to Dashboard"
7. If successful, redirect to role-based dashboard

---

## 🔍 Debugging

### Check Backend Connection

```bash
# Test if backend is accessible
curl https://hms-dev.onrender.com/api

# Test login endpoint
curl -X POST https://hms-dev.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Look for API request logs
4. Check for errors in red

### Common Issues

#### Issue: "Network Error"
**Solution**: 
- Backend might be sleeping (Render free tier)
- Wait 30-60 seconds for backend to wake up
- Refresh the page

#### Issue: "Invalid credentials"
**Solution**:
- Check email/password are correct
- Ensure backend has test users
- Check backend logs

#### Issue: "CORS Error"
**Solution**:
- Backend must allow origin: `http://localhost:3000`
- Check backend CORS configuration

#### Issue: "Invalid captcha"
**Solution**:
- Captcha is case-insensitive
- Refresh captcha if unclear
- Enter exact characters shown

---

## 📁 Project Structure

```
react/hms/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── ErrorBoundary.jsx
│   │       ├── NetworkStatus.jsx
│   │       └── LoadingFallback.jsx
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Doctor.js
│   │   ├── Pharmacist.js
│   │   └── Pathologist.js
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx ⭐
│   │   │   ├── LoginPage.css
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── admin/
│   │   │   └── Dashboard.jsx
│   │   ├── doctor/
│   │   │   └── Dashboard.jsx
│   │   ├── pharmacist/
│   │   │   └── Dashboard.jsx
│   │   ├── pathologist/
│   │   │   └── Dashboard.jsx
│   │   └── common/
│   │       ├── UnauthorizedPage.jsx
│   │       ├── NotFoundPage.jsx
│   │       ├── ProfilePage.jsx
│   │       └── SettingsPage.jsx
│   ├── provider/
│   │   ├── AppProvider.jsx
│   │   ├── NotificationProvider.jsx
│   │   └── index.js
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleBasedRoute.jsx
│   │   └── index.js
│   ├── services/
│   │   ├── authService.js ⭐
│   │   ├── apiConstants.js
│   │   ├── apiHelpers.js
│   │   ├── SplashScreen.jsx
│   │   └── index.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env ⭐
├── .env.example
├── package.json
└── README.md
```

---

## 🔐 Authentication Flow

```
1. User visits http://localhost:3000
   ↓
2. SplashScreen Component
   ↓
3. authService.getUserData()
   ↓ (checks localStorage for token)
   ↓
4a. Token exists → Validate with backend
    ↓
    POST https://hms-dev.onrender.com/api/auth/validate-token
    ↓
    Token valid → Parse user role → Navigate to dashboard
    
4b. No token → Navigate to /login
    ↓
5. LoginPage Component
   ↓
6. User submits form
   ↓
7. authService.signIn(email, password)
   ↓
   POST https://hms-dev.onrender.com/api/auth/login
   ↓
8. Backend returns { user, token }
   ↓
9. Save to localStorage
   ↓
10. setUser(user, token) in context
    ↓
11. Navigate based on role:
    - admin/superadmin → /admin
    - doctor → /doctor
    - pharmacist → /pharmacist
    - pathologist → /pathologist
```

---

## 🎨 Customization

### Change Colors

Edit `src/pages/auth/LoginPage.css`:

```css
/* Hero gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Primary color */
--primary: #667eea;

/* Button gradient */
background: linear-gradient(to right, #5568d3 0%, #667eea 100%);
```

### Change Logo

Replace emoji icons with your logo:

```jsx
// In LoginPage.jsx
<div className="brand-icon">
  <img src="/path/to/logo.png" alt="Logo" />
</div>
```

### Change Text

```jsx
// In LoginPage.jsx
<h1 className="hero-heading">
  Your Hospital Name<br />Management System
</h1>
```

---

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `build/` folder.

### Deploy to Hosting

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Manual Deployment
1. Upload `build/` folder to your web server
2. Configure server to serve `index.html` for all routes
3. Set environment variables on hosting platform

---

## 📊 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (one-way, careful!)
npm run eject
```

---

## 🐛 Troubleshooting

### Backend is Sleeping (Render Free Tier)

Render free tier puts apps to sleep after inactivity. First request might take 30-60 seconds.

**Solution**:
1. Wait for backend to wake up
2. Consider upgrading to paid tier
3. Or use a ping service to keep it awake

### CORS Issues

If you see CORS errors:

**Backend needs to allow**:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend.com'],
  credentials: true
}));
```

### Token Expiry

Tokens expire after a set time (usually 24 hours).

**Solution**:
- Implement refresh tokens
- Or re-login when token expires

### API Changes

If backend API changes:

1. Update `src/services/apiConstants.js`
2. Update `src/services/authService.js` if needed
3. Update models in `src/models/` if needed

---

## 📚 Additional Resources

### React Documentation
- [React Official Docs](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [React Context](https://react.dev/reference/react/useContext)

### API Testing
- [Postman](https://www.postman.com/)
- [Thunder Client (VS Code)](https://www.thunderclient.com/)
- [Insomnia](https://insomnia.rest/)

### Debugging Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

---

## ✅ Checklist

Before going to production:

- [ ] Update `.env` with production backend URL
- [ ] Test all user roles (admin, doctor, pharmacist, pathologist)
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Enable HTTPS
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Optimize images and assets
- [ ] Configure CSP headers
- [ ] Set up CI/CD pipeline
- [ ] Create backup strategy
- [ ] Document API endpoints
- [ ] Write user documentation
- [ ] Set up monitoring alerts

---

## 🤝 Support

If you encounter issues:

1. Check browser console for errors
2. Check network tab for API requests
3. Verify backend is running
4. Check backend logs
5. Review this guide

---

## 📝 License

© 2024 Karur Gastro Foundation

---

**Last Updated**: December 2024
**Version**: 1.0.0
