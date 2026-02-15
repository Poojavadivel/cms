# ✅ BUG FIXED: API Route Not Found

## The Problem
The medicine dropdown was calling:
```
https://hms-dev.onrender.com/api/api/pharmacy/medicines
                                 ^^^^
                          Double /api prefix!
```

This resulted in "API route not found" error.

## The Root Cause
1. **baseURL** was set to: `https://hms-dev.onrender.com/api`
2. **Request URL** was: `/api/pharmacy/medicines`
3. **Final URL** became: `https://hms-dev.onrender.com/api/api/pharmacy/medicines` ❌

## The Fix
Changed all request URLs in `medicinesService.js` to remove the `/api` prefix:

**Before:**
```javascript
const url = `/api/pharmacy/medicines?${params.toString()}`;
```

**After:**
```javascript
const url = `/pharmacy/medicines?${params.toString()}`;
```

Also updated the default baseURL to use localhost:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## What Changed
✅ Fixed 4 endpoints in medicinesService.js:
1. `searchMedicines` - `/pharmacy/medicines`
2. `fetchMedicines` - `/pharmacy/medicines`
3. `fetchMedicineById` - `/pharmacy/medicines/:id`
4. `checkStock` - `/pharmacy/medicines/:id/stock`

## Test It
1. **Refresh your browser** (Ctrl+F5)
2. **Open the intake form**
3. **Expand Pharmacy section**
4. **The dropdown should now show 2 medicines!**

Expected to see:
- Paracetamol (500mg) - ₹5 (Stock: 100)
- Amoxicillin (250mg) - ₹15 (Stock: 75)
