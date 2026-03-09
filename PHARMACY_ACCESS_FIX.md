# Pharmacy Access Fix for Doctors ✅

## Issue Fixed
Doctors were getting "Forbidden: admin/pharmacist role required" when accessing pharmacy/intake data.

## Solution
Added 'doctor' to authorized roles in pharmacy configuration.

## File Changed
**`Server/routes/pharmacy/config.js`** - Line 8

### Before:
```javascript
AUTHORIZED_ROLES: ['admin', 'pharmacist', 'superadmin']
```

### After:
```javascript
AUTHORIZED_ROLES: ['admin', 'pharmacist', 'superadmin', 'doctor']
```

---

## What This Fixes

✅ Doctors can now:
- View pharmacy inventory
- See patient intake/prescription history  
- Check dispensed medicines
- Access pharmacy data in patient records

---

## Restart Required

```bash
cd Server
npm start
```

**The fix is applied. Just restart your backend server!** 🎉

---

**Status:** ✅ COMPLETE  
**Action:** Restart backend  
**Test:** Login as doctor → Access pharmacy/intake
