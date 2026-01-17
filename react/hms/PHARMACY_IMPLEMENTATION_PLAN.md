# Pharmacy Module Implementation Plan

## Overview
Complete implementation of the Pharmacy module in React to match the Flutter version exactly.

## Module Structure

### Pages/Components
1. **Dashboard** ✅ (COMPLETED)
   - Stats cards (Total Medicines, Low Stock, Out of Stock, Expiring)
   - Low stock alerts
   - Expiring batches
   - Quick actions
   - System status

2. **Medicines/Inventory** (IN PROGRESS)
   - Medicine list with search and filters
   - Add/Edit/Delete medicines
   - Stock management
   - Batch management
   - Pagination

3. **Prescriptions** (PENDING)
   - Prescription list
   - Search and filters
   - Dispense prescriptions
   - View prescription details
   - Print prescriptions

4. **Settings** (PENDING)
   - Profile settings
   - Notification preferences
   - System settings

## API Endpoints Required

### Pharmacy Endpoints
- GET `/api/pharmacy/medicines` - Get all medicines
- GET `/api/pharmacy/medicines/:id` - Get medicine by ID
- POST `/api/pharmacy/medicines` - Create medicine
- PUT `/api/pharmacy/medicines/:id` - Update medicine
- DELETE `/api/pharmacy/medicines/:id` - Delete medicine
- GET `/api/pharmacy/batches` - Get all batches
- POST `/api/pharmacy/batches` - Create batch
- GET `/api/pharmacy/pending-prescriptions` - Get pending prescriptions
- POST `/api/pharmacy/prescriptions/:id/dispense` - Dispense prescription

## Implementation Progress

### Completed
- ✅ Dashboard page with exact Flutter UI
- ✅ Dashboard CSS styling
- ✅ Stats calculation logic
- ✅ Low stock alerts
- ✅ Expiring batches display
- ✅ Quick actions panel
- ✅ System status panel

### In Progress
- 🔄 Medicines/Inventory page
- 🔄 Medicine add/edit dialog
- 🔄 Batch management

### Pending
- ⏳ Prescriptions page
- ⏳ Prescription dispensing
- ⏳ Settings page
- ⏳ Print functionality
- ⏳ Reports generation

## File Structure

```
react/hms/src/
├── modules/
│   └── pharmacist/
│       ├── Dashboard.jsx ✅
│       ├── Dashboard.css ✅
│       ├── Medicines.jsx (updating)
│       ├── Medicines.css (updating)
│       ├── Prescriptions.jsx (pending)
│       ├── Prescriptions.css (pending)
│       └── index.js
├── pages/
│   └── pharmacist/
│       ├── PharmacistRoot.jsx ✅
│       ├── PharmacistRoot.css ✅
│       ├── Dashboard.jsx ✅
│       ├── Inventory.jsx (redirects to Medicines)
│       └── Prescriptions.jsx (redirects to module)
├── services/
│   └── apiConstants.js (needs pharmacy endpoints)
└── routes/
    └── AppRoutes.jsx (needs pharmacy routes)
```

## Next Steps
1. Complete Medicines/Inventory page
2. Implement Prescriptions page
3. Add Settings page
4. Test all functionality
5. Add print/export features
6. Add reports generation
