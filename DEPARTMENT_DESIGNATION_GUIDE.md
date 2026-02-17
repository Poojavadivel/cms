# Department vs Designation - Clear Guide

## Understanding the Difference

### 🏥 **Department** = WHERE they work
The functional area or division of the hospital

### 👤 **Designation** = WHAT they do
The job role or position title

---

## Hospital Departments (WHERE)

| Department | Description | Staff Who Work Here |
|------------|-------------|---------------------|
| **Nursing Department** | Patient care and nursing services | Nurses, Nursing Assistants |
| **Medical Department** | Doctors and medical staff | Doctors, Medical Officers |
| **Laboratory & Pathology** | Lab tests and diagnostics | Lab Technicians, Lab Assistants |
| **Pharmacy** | Medicine dispensing and management | Pharmacists, Pharmacy Assistants |
| **Administration** | Office and management work | Admins, Accountants, HR Staff |
| **Housekeeping & Maintenance** | Cleaning and facility maintenance | Cleaners, Electricians, Plumbers |
| **Security** | Hospital security and safety | Security Guards, Supervisors |
| **Reception & Front Desk** | Patient intake and front office | Receptionists, Front Desk Officers |
| **Support Services** | General support and assistance | Drivers, Peons, Ward Boys |

---

## Staff Designations (WHAT)

### Nursing Staff
- Staff Nurse
- Head Nurse
- Nursing Assistant

### Laboratory Staff
- Lab Technician
- Lab Assistant

### Pharmacy Staff
- Pharmacist
- Pharmacy Assistant

### Administrative Staff
- Administrative Officer
- Office Assistant
- Accountant
- HR Staff

### Reception Staff
- Receptionist
- Front Desk Officer

### Housekeeping & Maintenance
- Cleaner
- Housekeeping Staff
- Maintenance Technician
- Electrician
- Plumber

### Security Staff
- Security Guard
- Security Supervisor

### Support Staff
- Driver
- Peon
- Ward Boy

---

## Examples (Correct Combinations)

| Name | Department | Designation | Staff ID |
|------|-----------|-------------|----------|
| Sarah Johnson | **Nursing Department** | **Staff Nurse** | NUR-001 |
| John Smith | **Laboratory & Pathology** | **Lab Technician** | LAB-001 |
| Mary Williams | **Pharmacy** | **Pharmacist** | PHR-001 |
| Robert Brown | **Administration** | **Accountant** | ADM-001 |
| Lisa Davis | **Reception & Front Desk** | **Receptionist** | ADM-002 |
| James Wilson | **Security** | **Security Guard** | SEC-001 |
| Emma Garcia | **Housekeeping & Maintenance** | **Cleaner** | MNT-001 |
| Michael Lee | **Support Services** | **Driver** | SUP-001 |

---

## Staff ID Prefixes by Department/Designation

| Prefix | For | Examples |
|--------|-----|----------|
| **NUR** | Nursing staff | NUR-001, NUR-002 |
| **DOC** | Medical/Doctors | DOC-001, DOC-002 |
| **LAB** | Laboratory staff | LAB-001, LAB-002 |
| **PHR** | Pharmacy staff | PHR-001, PHR-002 |
| **ADM** | Admin/Reception/HR/Accounts | ADM-001, ADM-002 |
| **SEC** | Security staff | SEC-001, SEC-002 |
| **MNT** | Maintenance/Housekeeping | MNT-001, MNT-002 |
| **SUP** | Support services | SUP-001, SUP-002 |
| **STF** | Other general staff | STF-001, STF-002 |

---

## Auto-Generation Logic

When you select:
- **Department**: Nursing Department
- **Designation**: Staff Nurse

The system automatically generates:
- **Staff ID**: NUR-001 (or next available number)

The prefix is determined by BOTH department and designation keywords.

---

## Common Mistakes to Avoid

❌ **Wrong**: Department = "Nurse", Designation = "Nursing"  
✅ **Correct**: Department = "Nursing Department", Designation = "Staff Nurse"

❌ **Wrong**: Department = "Lab", Designation = "Laboratory"  
✅ **Correct**: Department = "Laboratory & Pathology", Designation = "Lab Technician"

❌ **Wrong**: Department = "Security Guard", Designation = "Security"  
✅ **Correct**: Department = "Security", Designation = "Security Guard"

---

## Adding New Options

If you need to add new departments or designations:

1. **Frontend**: Edit `StaffFormEnterprise.jsx`
   - Update `departments` array for new departments
   - Update `designations` array for new job roles

2. **Backend**: Edit `staff.js` (if new prefix needed)
   - Update `generatePatientFacingId()` function
   - Add new prefix mapping if required

---

**Last Updated**: February 3, 2026
