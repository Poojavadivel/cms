# Staff vs User - Important Separation

## Overview
This document explains the separation between **Staff records** and **User accounts** in the HMS system.

## Two Separate Systems

### 1. Staff Collection (MongoDB)
- **Purpose**: Track all hospital staff members (employees, workers, nurses, etc.)
- **Location**: `Staff` collection in MongoDB
- **API Endpoints**: `/api/staff/*`
- **Created Via**: Admin > Staff Management page

**What it stores:**
- Staff member information (name, contact, department, designation)
- Work details (shift, location, joining date)
- Employment status (active, on leave, etc.)
- Auto-generated Staff IDs (NUR-001, DOC-001, LAB-001, etc.)

**What it does NOT include:**
- ❌ Login credentials (username/password)
- ❌ Authentication tokens
- ❌ System access permissions
- ❌ Ability to log into the HMS system

### 2. User Collection (MongoDB)
- **Purpose**: System authentication and login access
- **Location**: `User` collection in MongoDB
- **API Endpoints**: `/api/auth/*`
- **Created Via**: Manual user registration or separate User management

**What it stores:**
- Login credentials (email, password hash)
- User roles (admin, doctor, pharmacist, pathologist)
- Authentication tokens
- Session information

**What it controls:**
- ✅ Who can log into the system
- ✅ What pages/features they can access
- ✅ Role-based permissions

## Current Behavior

### When Adding Staff via Staff Management Page:
```
✅ Creates entry in Staff collection
❌ Does NOT create entry in User collection
❌ Does NOT give login access
✅ Staff member is recorded in the system
❌ Staff member CANNOT log in
```

### Example:
```javascript
// Creating a Nurse through Staff Management
{
  name: "Sarah Johnson",
  designation: "Nurse",
  department: "Nursing",
  patientFacingId: "NUR-001", // Auto-generated
  contact: "+1234567890",
  email: "sarah@hospital.com"
}

Result:
✅ Staff record created with ID NUR-001
✅ Visible in Staff Management page
✅ Can be assigned to tasks/schedules
❌ Cannot log into the system
❌ No User account exists
```

## When You NEED Login Access

If a staff member needs to log into the HMS system:

### Option 1: Create User Account Separately
```javascript
POST /api/auth/register
{
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah@hospital.com",
  password: "SecurePassword123!",
  role: "nurse" // or appropriate role
}
```

### Option 2: Link Existing Staff to User
Some staff members (like doctors) might be synced from User to Staff automatically, but this is one-way and does NOT give Staff login access.

## Benefits of This Separation

### ✅ Security
- Not all staff need system access
- Reduces attack surface
- Better credential management

### ✅ Flexibility
- Can track ALL staff (including contract workers, temps, etc.)
- Don't need to create login for everyone
- Easier staff record management

### ✅ Compliance
- Clear separation of HR records vs system access
- Better audit trail
- Controlled user provisioning

## Important Notes

⚠️ **Do NOT add User creation logic to Staff endpoints**
- Staff creation should remain separate from User creation
- This is intentional design, not a bug

⚠️ **Staff IDs are auto-generated and unique**
- System ensures no duplicates
- Based on department/designation (NUR-001, DOC-001, etc.)
- Cannot be changed once created (on new staff)

⚠️ **Email field in Staff**
- Can store staff email for contact purposes
- Does NOT create login account
- Just for communication/records

## Code Locations

### Backend
- **Staff Routes**: `Server/routes/staff.js`
- **Staff Model**: `Server/Models/Staff.js`
- **User Routes**: `Server/routes/auth.js`
- **User Model**: `Server/Models/User.js`

### Frontend
- **Staff Management**: `react/hms/src/modules/admin/staff/Staff.jsx`
- **Staff Form**: `react/hms/src/modules/admin/staff/StaffFormEnterprise.jsx`
- **Staff Service**: `react/hms/src/services/staffService.js`

## Future Enhancement (Optional)

If you want to add "Create User Account" functionality later:

1. Add a checkbox in Staff form: "Grant system access"
2. If checked, create User account after Staff creation
3. Send login credentials via email
4. Link Staff ID to User ID in metadata

But for now, keep them **completely separate** as intended.

---

**Last Updated**: February 3, 2026
**Maintained By**: HMS Development Team
