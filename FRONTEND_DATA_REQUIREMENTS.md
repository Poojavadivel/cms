# Frontend Data Requirements - Payroll & Invoice Pages

## 📊 Data Fields Required in Frontend

### **1. Invoice/Payroll Table Display** (Invoice.jsx)

#### Primary Display Fields:
| Field | Source | Display Location | Required | Format |
|-------|--------|------------------|----------|---------|
| **staffName** | `staff.name` | Employee column (primary) | ✅ Yes | Text |
| **staffCode** | `staff.patientFacingId` | Employee column (secondary) | ✅ Yes | Text (e.g., "DOC001") |
| **department** | `staff.department` | Employee column (secondary) | ✅ Yes | Text |
| **contact** | `staff.contact` | Not displayed in table | ⚠️ Recommended | Phone number |
| **periodDisplay** | Calculated from month/year | Pay Month column | ✅ Yes | "Feb 2026" |
| **date** | `payroll.paymentDate` | Date column | ✅ Yes | DD/MM/YY |
| **amount** | `payroll.grossSalary` | Gross Pay column | ✅ Yes | Currency (₹) |
| **paidAmount** | `payroll.netSalary` | Net Pay column | ✅ Yes | Currency (₹) |
| **status** | `payroll.status` | Status column | ✅ Yes | Badge |

---

### **2. Payroll Table Display** (Payroll.jsx)

#### Column Structure:
| Column | Field | Source | Required | Display |
|--------|-------|--------|----------|---------|
| **STAFF NAME** | `staffName` | `staff.name` | ✅ Yes | "Sanjit Doctor" |
| **DEPT** | `department` | `staff.department` | ✅ Yes | "Medical" |
| **PERIOD** | `period` | Calculated | ✅ Yes | "Feb 2026" |
| **GROSS** | `grossSalary` | `payroll.grossSalary` | ✅ Yes | "₹128,000" |
| **DEDUCTIONS** | `deductions` | `payroll.totalDeductions` | ✅ Yes | "₹4,000" |
| **NET SALARY** | `netSalary` | `payroll.netSalary` | ✅ Yes | "₹124,000" |
| **STATUS** | `status` | `payroll.status` | ✅ Yes | Badge |

---

### **3. Staff Table Display** (Staff.jsx)

#### Column Structure:
| Column | Field | Source | Required | Display |
|--------|-------|--------|----------|---------|
| **Staff Code** | `staffCode` | `staff.patientFacingId` | ✅ Yes | "DOC001" (with avatar) |
| **Staff Name** | `name` | `staff.name` | ✅ Yes | "Sanjit Doctor" |
| **Designation** | `designation` | `staff.designation` | ✅ Yes | "Doctor" |
| **Department** | `department` | `staff.department` | ✅ Yes | "Medical" |
| **Contact** | `contact` | `staff.contact` | ✅ Yes | "+91 98765 43210" |
| **Status** | `status` | `staff.status` | ✅ Yes | Badge |

---

## 🔑 Critical Requirements

### **1. Staff Code (patientFacingId)**
- **MUST BE UNIQUE** ✅
- **MUST BE NON-EMPTY** ✅
- **Format**: Alphanumeric (e.g., "DOC001", "NURSE05", "STF-123")
- **Use**: Primary identifier visible to users
- **Database Field**: `staff.patientFacingId`

### **2. Staff Contact**
- **MUST BE PRESENT** ✅
- **Format**: Phone number
- **Validation**: Phone number format (Indian: +91 XXXXX XXXXX)
- **Database Field**: `staff.contact`

### **3. Staff Name**
- **MUST BE NON-EMPTY** ✅
- **Database Field**: `staff.name`

### **4. Department**
- **MUST BE NON-EMPTY** ✅
- **Database Field**: `staff.department`

---

## 🔧 Current Issues to Fix

### **Issue 1: Staff Code Not Always Unique**
**Problem**: `patientFacingId` can be empty or duplicate  
**Impact**: Cannot uniquely identify staff  
**Solution**: Add unique index and validation

### **Issue 2: Contact Details Missing**
**Problem**: Many staff records have empty `contact` field  
**Impact**: Cannot reach staff members  
**Solution**: Make contact required during staff creation

### **Issue 3: staffId Not Populated**
**Problem**: Server returns `staffId: "string"` instead of populated object  
**Impact**: Staff names and departments show as empty  
**Solution**: Server must populate staffId when fetching payroll

---

## 📋 Complete Staff Data Model (Required Fields)

```javascript
{
  _id: "uuid",                    // ✅ Auto-generated
  name: "Dr. Sanjit Kumar",       // ✅ REQUIRED
  patientFacingId: "DOC001",      // ✅ REQUIRED + UNIQUE
  designation: "Doctor",           // ✅ REQUIRED
  department: "Cardiology",        // ✅ REQUIRED
  contact: "+91 98765 43210",     // ✅ REQUIRED (NEW)
  email: "sanjit@example.com",    // ⚠️ Optional but recommended
  status: "Available",             // ✅ REQUIRED
  gender: "Male",                  // ⚠️ Optional
  avatarUrl: "",                   // ⚠️ Optional
  roles: ["doctor"],               // ⚠️ Optional
  qualifications: [],              // ⚠️ Optional
  metadata: {},                    // ⚠️ Optional
}
```

---

## 🎯 Action Items

### **1. Update Staff Model** ✅
- Add unique index on `patientFacingId`
- Make `patientFacingId` required
- Make `contact` required
- Add validation for phone format

### **2. Update Payroll Route** ✅
- Ensure `.populate('staffId')` is called
- Return populated staff object, not just ID

### **3. Update Frontend Services** ✅
- Extract staff data from populated object
- Handle missing staff data gracefully
- Display contact info where needed

### **4. Data Migration**
- Ensure all existing staff have unique staff codes
- Ensure all existing staff have contact numbers
- Update any empty fields

---

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Staff Collection                          │
│  {                                                           │
│    _id: "abc123",                                           │
│    name: "Dr. Sanjit Kumar",              ← Used in UI     │
│    patientFacingId: "DOC001",             ← Staff Code      │
│    department: "Cardiology",              ← Used in UI     │
│    contact: "+91 98765 43210",            ← Contact Info   │
│    designation: "Doctor"                                    │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Referenced by)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Payroll Collection                         │
│  {                                                           │
│    _id: "pay001",                                           │
│    staffId: "abc123",  ← Reference to Staff                │
│    grossSalary: 128000,                                     │
│    netSalary: 124000,                                       │
│    payPeriodMonth: 2,                                       │
│    payPeriodYear: 2026                                      │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (.populate('staffId'))
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Response (Populated)                   │
│  {                                                           │
│    _id: "pay001",                                           │
│    staffId: {                   ← Populated Object!         │
│      _id: "abc123",                                         │
│      name: "Dr. Sanjit Kumar",                              │
│      patientFacingId: "DOC001",                             │
│      department: "Cardiology",                              │
│      contact: "+91 98765 43210"                             │
│    },                                                        │
│    grossSalary: 128000,                                     │
│    netSalary: 124000                                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Extracted in Frontend)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Display in UI                              │
│                                                              │
│  Staff Name:    Dr. Sanjit Kumar                            │
│  Staff Code:    DOC001                                      │
│  Department:    Cardiology                                  │
│  Contact:       +91 98765 43210                             │
│  Gross Salary:  ₹128,000                                    │
│  Net Salary:    ₹124,000                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

When everything is fixed, the UI should show:

### **Payroll Table**
```
╔══════════════════╦══════════╦════════════╦═══════════╦════════════╗
║ STAFF NAME       ║ DEPT     ║ PERIOD     ║ GROSS     ║ NET SALARY ║
╠══════════════════╬══════════╬════════════╬═══════════╬════════════╣
║ Dr. Sanjit Kumar ║ Cardio   ║ Feb 2026   ║ ₹128,000  ║ ₹124,000   ║
║ Dr. Sriram K     ║ Medicine ║ Feb 2026   ║ ₹128,000  ║ ₹124,000   ║
║ Doctor User      ║ Medical  ║ Feb 2026   ║ ₹128,000  ║ ₹124,000   ║
╚══════════════════╩══════════╩════════════╩═══════════╩════════════╝
```

### **Staff Table**
```
╔════════════╦══════════════════╦══════════════╦══════════╦═════════════════╗
║ STAFF CODE ║ STAFF NAME       ║ DESIGNATION  ║ DEPT     ║ CONTACT         ║
╠════════════╬══════════════════╬══════════════╬══════════╬═════════════════╣
║ DOC001     ║ Dr. Sanjit Kumar ║ Doctor       ║ Cardio   ║ +91 98765 43210 ║
║ DOC002     ║ Dr. Sriram K     ║ Doctor       ║ Medicine ║ +91 98765 43211 ║
║ DOC003     ║ Doctor User      ║ Doctor       ║ Medical  ║ +91 98765 43212 ║
╚════════════╩══════════════════╩══════════════╩══════════╩═════════════════╝
```

---

**All fields must be populated and visible!**
