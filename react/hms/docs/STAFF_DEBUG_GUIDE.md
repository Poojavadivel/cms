# 🔧 Staff Module - Debug Guide

## Quick Check: Is Staff Working?

### 1. **Check API Configuration**
```bash
# Verify .env has correct URL
cat .env | grep REACT_APP_API_URL
# Should show: REACT_APP_API_URL=https://hms-dev.onrender.com/api
```

### 2. **Check Authentication**
Open browser DevTools (F12) → Console:
```javascript
// Check if token exists
localStorage.getItem('x-auth-token') || localStorage.getItem('authToken')
// Should return a JWT token string
```

### 3. **Test Staff API Directly**
In browser console after login:
```javascript
// Quick API test
const token = localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
fetch('https://hms-dev.onrender.com/api/staff', {
  headers: { 'x-auth-token': token }
})
.then(r => r.json())
.then(d => console.log('Staff data:', d))
.catch(e => console.error('Error:', e));
```

---

## Common Issues & Solutions

### Issue 1: "Cannot read properties of undefined"
**Symptom:** React app crashes when loading staff page
**Cause:** Staff data structure mismatch between backend and frontend
**Solution:**
1. Check backend response format in Network tab
2. Verify Staff model's `fromJSON` method handles all fields
3. Add defensive checks in component

### Issue 2: "404 Not Found" on /staff endpoint
**Symptom:** Network tab shows 404 for staff requests
**Cause:** Incorrect base URL or missing token
**Solution:**
```javascript
// Check in staffService.js line 13:
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  // Should include /api suffix ✅
});

// Check token retrieval line 10:
const getAuthToken = () => localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
// Should check both keys ✅
```

### Issue 3: Empty staff list
**Symptom:** Page loads but shows no staff
**Cause:** Backend returns empty array or data parsing fails
**Solution:**
1. Check if backend has staff data:
   ```bash
   curl -H "x-auth-token: YOUR_TOKEN" https://hms-dev.onrender.com/api/staff
   ```
2. Check console for parsing errors
3. Verify `Staff.fromJSON()` matches backend structure

### Issue 4: Token not sent with request
**Symptom:** 401 Unauthorized errors
**Cause:** Token header not configured
**Solution:**
```javascript
// In staffService.js line 17-21:
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers['x-auth-token'] = token; // ✅ Should be x-auth-token
  return config;
});
```

---

## Verification Checklist

- [ ] `.env` file has `/api` suffix
- [ ] `staffService.js` uses correct base URL
- [ ] Token retrieval checks both `x-auth-token` and `authToken`
- [ ] Auth header is `x-auth-token` (not `Authorization: Bearer`)
- [ ] Backend `/api/staff` endpoint is accessible
- [ ] Staff model `fromJSON()` handles backend response structure
- [ ] React component imports `staffService` correctly

---

## File Structure

```
src/
├── models/
│   └── Staff.js              ✅ Model definition (matches Flutter)
├── services/
│   └── staffService.js       ✅ API service (recently fixed)
└── modules/
    └── admin/
        └── staff/
            ├── Staff.jsx            ✅ Main list component
            ├── StaffForm.jsx        ✅ Create/Edit form
            ├── StaffDetail.jsx      ✅ Detail view
            └── Staff.css            ✅ Styles
```

---

## Expected API Responses

### GET /api/staff
**Success (200):**
```json
[
  {
    "_id": "abc123",
    "name": "Dr. Smith",
    "designation": "Doctor",
    "department": "Cardiology",
    "contact": "9876543210",
    "email": "smith@hospital.com",
    "status": "Available"
  }
]
```

**Or wrapped:**
```json
{
  "staff": [
    { "_id": "abc123", "name": "Dr. Smith", ... }
  ]
}
```

### POST /api/staff
**Success (201):**
```json
{
  "staff": {
    "_id": "abc123",
    "name": "Dr. Smith",
    ...
  }
}
```

---

## Comparison with Flutter

| Feature | Flutter (Working) | React (Fixed) |
|---------|-------------------|---------------|
| **Base URL** | `https://hms-dev.onrender.com` | `https://hms-dev.onrender.com/api` |
| **Endpoint** | `/api/staff` | `/staff` (baseURL has /api) |
| **Full URL** | `https://hms-dev.onrender.com/api/staff` | `https://hms-dev.onrender.com/api/staff` ✅ |
| **Auth Header** | `x-auth-token` | `x-auth-token` ✅ |
| **Model** | `Staff.fromMap()` | `Staff.fromJSON()` ✅ |
| **Caching** | Yes (`_staffList`) | Yes (`staffCache`) ✅ |

---

## Debug Commands

### 1. Test from Terminal
```bash
# With curl (replace YOUR_TOKEN)
curl -H "x-auth-token: YOUR_TOKEN" https://hms-dev.onrender.com/api/staff

# With PowerShell
$token = "YOUR_TOKEN"
$headers = @{ "x-auth-token" = $token }
Invoke-RestMethod -Uri "https://hms-dev.onrender.com/api/staff" -Headers $headers
```

### 2. Test in Browser Console
```javascript
// Copy TEST_STAFF_API.js and paste in console
// Or run quick test:
const staffService = require('./services/staffService').default;
staffService.fetchStaffs(true).then(console.log).catch(console.error);
```

### 3. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Navigate to Staff page
4. Look for request to `/staff`
5. Check:
   - ✅ Status: 200 OK
   - ✅ Request URL: includes `/api/staff`
   - ✅ Request Header: has `x-auth-token`
   - ✅ Response: has staff data

---

## Recent Fixes Applied

### ✅ Fixed: Token Retrieval
**File:** `staffService.js` line 10
**Before:**
```javascript
const getAuthToken = () => localStorage.getItem('authToken');
```
**After:**
```javascript
const getAuthToken = () => localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
```

### ✅ Already Correct: Base URL
**File:** `staffService.js` line 13
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
  // ✅ Includes /api suffix
});
```

### ✅ Already Correct: Auth Header
**File:** `staffService.js` line 19
```javascript
if (token) config.headers['x-auth-token'] = token; // ✅ Correct header
```

---

## Next Steps

1. **Restart React dev server** (changes to service files require restart)
   ```bash
   npm start
   ```

2. **Clear browser cache**
   - F12 → Application → Clear storage
   - Hard refresh: Ctrl+Shift+R

3. **Test staff page**
   - Navigate to Staff section
   - Check Network tab for API calls
   - Verify data loads correctly

4. **If still issues:**
   - Run TEST_STAFF_API.js in console
   - Check browser console for errors
   - Verify backend is returning data
   - Compare with working Flutter app

---

## Support

If issues persist:
1. Check `API_FIX_COMPLETE.md` for general API issues
2. Run `VERIFY_API_CONFIG.bat` to check configuration
3. Compare response structure with Flutter app
4. Check backend logs for server-side errors

**Status:** ✅ **STAFF API CONFIGURATION FIXED**
