# Database Reset Script

## ⚠️ CRITICAL WARNING

This script will **PERMANENTLY DELETE ALL DATA** from your database!

**Only these users will remain after reset:**

| Role | Email | Password |
|------|-------|----------|
| Admin | banu@karurgastro.com | Banu@123 |
| Doctor | dr.sanjit@karurgastro.com | Doctor@123 |
| Doctor | dr.sriram@karurgastro.com | Doctor@123 |
| Pharmacist | pharmacist@hms.com | 12332112 |
| Pathologist | pathologist@hms.com | 12332112 |

---

## 🗑️ What Gets Deleted

All data from these collections will be **PERMANENTLY REMOVED**:

- ✅ **Patients** (all patient records)
- ✅ **Appointments** (all appointments)
- ✅ **Intake** (all triage records)
- ✅ **Staff** (all staff members)
- ✅ **Medicines** (medicine catalog)
- ✅ **Medicine Batches** (inventory)
- ✅ **Pharmacy Records** (dispensing history)
- ✅ **Lab Reports** (all lab test results)
- ✅ **Lab Report Documents** (OCR lab reports)
- ✅ **Prescription Documents** (OCR prescriptions)
- ✅ **Medical History Documents** (medical records)
- ✅ **Patient PDFs** (all uploaded files/images)
- ✅ **Files** (general file storage)
- ✅ **Auth Sessions** (login sessions)
- ✅ **Audit Logs** (system logs)
- ✅ **Bot Conversations** (AI chat history)
- ✅ **Payroll Records** (salary records)
- ✅ **Users** (all users except the 5 listed above)

---

## 🚀 How to Run

### Option 1: Using Batch File (Recommended)

1. Double-click `RESET_DATABASE.bat`
2. Read the warning carefully
3. Press any key to continue
4. Wait for completion (30-60 seconds)

### Option 2: Using Command Line

```bash
cd Server
node reset_database_keep_users.js
```

---

## 📊 Sample Output

```
🚨 ================================
🚨 DATABASE RESET SCRIPT
🚨 ================================

⚠️  WARNING: This will DELETE ALL DATA except specified users!

⏳ Starting in 5 seconds... Press Ctrl+C to cancel

📊 Starting database cleanup...

🗑️  Deleting Patients...
   ✓ Deleted 54 patients
🗑️  Deleting Appointments...
   ✓ Deleted 250 appointments
...

✅ ================================
✅ DATABASE RESET COMPLETE
✅ ================================

📊 Summary:
   - Patients: 54 deleted
   - Appointments: 250 deleted
   - Staff: 373 deleted
   ...

👥 Active Users:
   - ADMIN: banu@karurgastro.com
   - DOCTOR: dr.sanjit@karurgastro.com
   - DOCTOR: dr.sriram@karurgastro.com
   - PHARMACIST: pharmacist@hms.com
   - PATHOLOGIST: pathologist@hms.com

🔐 Credentials:
   Admin:       banu@karurgastro.com / Banu@123
   Doctor 1:    dr.sanjit@karurgastro.com / Doctor@123
   Doctor 2:    dr.sriram@karurgastro.com / Doctor@123
   Pharmacist:  pharmacist@hms.com / 12332112
   Pathologist: pathologist@hms.com / 12332112

✅ Database is now clean and ready to use!
```

---

## 🔧 Technical Details

### Files Created

1. **`Server/reset_database_keep_users.js`** - Main reset script
2. **`RESET_DATABASE.bat`** - Windows batch file launcher
3. **`DATABASE_RESET_README.md`** - This documentation

### How It Works

1. Connects to MongoDB using `MANGODB_URL` from `.env`
2. Deletes all documents from all collections
3. Deletes all existing users
4. Creates 5 fresh users with specified credentials
5. Passwords are hashed automatically by User model pre-save hook

### Safety Features

- ⏳ **5-second countdown** before execution (Ctrl+C to cancel)
- 📊 **Detailed logging** of every deletion
- ✅ **Confirmation** of successful user creation
- 📈 **Summary report** showing exactly what was deleted

---

## ⚠️ Important Notes

1. **No Undo**: Once deleted, data cannot be recovered
2. **Backup First**: Always backup before running this script
3. **Production Warning**: NEVER run this on production database
4. **User Passwords**: All passwords will be reset to the ones listed above
5. **Session Cleanup**: All active sessions will be invalidated

---

## 🆘 Troubleshooting

### Connection Failed

If you see `MongoDB connection failed`:

1. Check MongoDB is running
2. Verify `.env` has correct `MANGODB_URL`
3. Check network connectivity

### Script Hangs

If script doesn't progress:

1. Press `Ctrl+C` to cancel
2. Check MongoDB Atlas/Server is accessible
3. Verify credentials in `.env`

### Permission Denied

If you get permission errors:

1. Ensure MongoDB user has delete permissions
2. Check database user roles
3. Verify connection string is correct

---

## 📞 Support

For issues or questions:
- Check `Server/reset_database_keep_users.js` logs
- Verify MongoDB connection in `.env`
- Ensure all npm packages are installed (`npm install`)

---

**Last Updated:** 2026-02-03  
**Version:** 1.0.0  
**Compatible with:** HMS Karur v2.0
