# Staff Name Display Fix - Invoice & Payroll Pages

## Issue Summary
After recent changes to the Payroll model that removed denormalized staff fields (staffName, staffCode, department, designation), the React Invoice page was unable to display staff names for the 3 doctors (or any staff members) because it was trying to access fields that no longer existed in the data.

## Root Cause
1. **Server-side change**: The Payroll model was updated to use only `staffId` reference and remove denormalized staff fields for data integrity
2. **Client-side issue**: The `invoiceService.js` was still trying to access the old denormalized fields (`payroll.staffName`, `payroll.staffCode`, `payroll.department`)
3. **Route already fixed**: The payroll route was already populating the `staffId` with staff data, but the client wasn't extracting it correctly

## Files Changed

### 1. `react/hms/src/services/invoiceService.js`
**Location**: Lines 70-91

**What Changed**: Updated the mapping logic to extract staff details from the populated `staffId` or `staff` object instead of trying to access denormalized fields.

**Before**:
```javascript
staffName: payroll.staffName || 'Unknown',
staffCode: payroll.staffCode || '',
department: payroll.department || '',
```

**After**:
```javascript
const staff = payroll.staffId || payroll.staff || {};
const staffName = typeof staff === 'object' ? (staff.name || '') : '';
const department = typeof staff === 'object' ? (staff.department || '') : '';
const staffCode = typeof staff === 'object' ? (staff.patientFacingId || staff.metadata?.staffCode || '') : '';
```

### 2. `Server/routes/payroll.js`
**Location**: Lines 225-240

**What Changed**: Added a projection to ensure staff data is available as both `staff` and `staffId` fields for React client compatibility when using aggregation pipeline.

**Added**:
```javascript
pipeline.push({
  $addFields: {
    staffId: '$staff' // Duplicate staff data to staffId field for client compatibility
  }
});
```

## How It Works Now

1. **Server Side**:
   - Payroll route populates `staffId` reference with actual Staff document data
   - When using aggregation (for search/filters), it uses `$lookup` to join with Staff collection
   - The staff data is now returned as a nested object in the `staffId` field

2. **Client Side**:
   - Invoice service extracts staff details from the populated `staffId` object
   - Handles both `staffId` and `staff` field names for compatibility
   - Safely checks if the field is an object before accessing nested properties
   - Falls back to empty strings if data is missing

## Data Flow

```
Payroll Collection (MongoDB)
  └─ staffId: "abc123" (reference)
        ↓ (populate)
  └─ staffId: { 
       _id: "abc123",
       name: "Dr. John Smith",
       department: "Cardiology",
       patientFacingId: "DOC001"
     }
        ↓ (API response)
React invoiceService.js
  └─ Extracts: staffName, department, staffCode
        ↓
Invoice.jsx & Payroll.jsx
  └─ Displays: Staff names correctly
```

## Testing

✅ React build completes successfully with no syntax errors
✅ Invoice service now correctly extracts staff data from populated objects
✅ Both aggregation and regular queries return staff data in compatible format

## Benefits

1. **Data Integrity**: Single source of truth for staff data (Staff collection)
2. **Consistency**: Staff name changes automatically reflect in all payroll records
3. **Maintainability**: No need to sync denormalized fields
4. **Flexibility**: Easy to add more staff fields without schema changes

## Notes

- The Invoice.jsx component is actually displaying Payroll data (it's labeled "Payroll Management")
- The Payroll.jsx component also uses the same pattern and was already working correctly
- Both components now get staff data the same way from populated references
