# Deployment Guide: Update Render with New Appointment Status Enum

## Problem
The production server (hms-dev.onrender.com) has the old Appointment model that doesn't include 'Pending' and 'Confirmed' statuses, causing 500 errors when trying to update appointments to these statuses.

## What Was Changed
Updated `Server/Models/Appointment.js` line 19:

**Before:**
```javascript
status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'], default: 'Scheduled', index: true }
```

**After:**
```javascript
status: { type: String, enum: ['Scheduled', 'Confirmed', 'Pending', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'], default: 'Scheduled', index: true }
```

## Deployment Steps for Render

### Option 1: Git Push (Recommended)
1. **Commit the changes:**
   ```bash
   cd e:\HMS-DEV
   git add Server/Models/Appointment.js
   git commit -m "Add Pending and Confirmed to appointment status enum"
   git push origin main
   ```

2. **Render will auto-deploy** (if auto-deploy is enabled)
   - Go to https://dashboard.render.com
   - Check your service deployment status
   - Wait for deployment to complete (~2-3 minutes)

### Option 2: Manual Deploy
1. Go to https://dashboard.render.com
2. Select your HMS backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

### Option 3: Redeploy Current Commit
1. Go to https://dashboard.render.com
2. Select your HMS backend service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. This will rebuild from scratch with the latest code

## Verification Steps

After deployment:

1. **Check Render Logs:**
   - Go to your service on Render dashboard
   - Click "Logs" tab
   - Look for "Server is listening on port..." message

2. **Test the API:**
   ```bash
   # Test if the server is responding
   curl https://hms-dev.onrender.com/api/appointments
   ```

3. **Switch Frontend Back to Production:**
   - Edit `e:\HMS-DEV\react\hms\.env`
   - Change: `REACT_APP_API_URL=http://localhost:3000/api`
   - To: `REACT_APP_API_URL=https://hms-dev.onrender.com/api`
   - Restart the React dev server

4. **Test Status Updates:**
   - Open the appointments page
   - Click on a status badge
   - Try changing to "Pending" or "Confirmed"
   - Should work without 500 errors

## Current Temporary Setup

✅ **Local Backend Running:** `http://localhost:3000` (with updated model)
✅ **Frontend Configured:** Using local backend temporarily
✅ **Status Updates:** Should work locally now

## Next Steps

1. **Deploy to Render** using one of the options above
2. **Switch frontend back** to production API
3. **Test thoroughly** on production

## Rollback Plan (If Needed)

If something goes wrong:
1. Revert the commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Or redeploy a previous working commit from Render dashboard

## Notes

- The local backend is running on port 3000
- Make sure MongoDB connection is working on Render
- The change is backward compatible (old statuses still work)
- Existing appointments won't be affected
