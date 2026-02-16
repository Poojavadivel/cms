# HMS React Implementation Plan

## ✅ Completed Pages (2/7)

### 1. Appointments ✅
- Location: `src/modules/admin/appointments/Appointments.jsx`
- Status: **Complete & Active**
- Features: Table view, filters, search, actions, API integrated

### 2. Patients ✅
- Location: `src/modules/admin/patients/Patients.jsx`
- Status: **Complete & Active**
- Features: Table view, filters, search, actions, API integrated
- Design: Matches Appointments exactly

---

## 📋 Remaining Pages (5/7)

### 3. Staff 🔄 (Next Priority)
**Flutter Reference:** `lib/Modules/Staff/StaffManagement.dart`

**Features to Implement:**
- Staff list with role badges
- Department filter
- Status filter (Active/Inactive)
- Search by name, employee ID, department
- Actions: View, Edit, Delete, Download

**Columns:**
- Photo/Avatar
- Name & Employee ID
- Role/Position
- Department
- Phone/Email
- Status
- Actions

**API Endpoints:**
```
GET    /api/staff
GET    /api/staff/:id
POST   /api/staff
PUT    /api/staff/:id
DELETE /api/staff/:id
```

---

### 4. Pathology 🔄
**Flutter Reference:** `lib/Modules/Pathology/PathologyTests.dart`

**Features to Implement:**
- Test list with status
- Test type filter
- Date range filter
- Patient search
- Actions: View Report, Edit, Print, Delete

**Columns:**
- Test ID
- Patient Name
- Test Type
- Test Date
- Status (Pending/Completed/Cancelled)
- Result
- Doctor
- Actions

**API Endpoints:**
```
GET    /api/pathology/tests
GET    /api/pathology/tests/:id
POST   /api/pathology/tests
PUT    /api/pathology/tests/:id
DELETE /api/pathology/tests/:id
GET    /api/pathology/report/:id
```

---

### 5. Pharmacy 🔄
**Flutter Reference:** `lib/Modules/Pharmacy/PharmacyInventory.dart`

**Features to Implement:**
- Medicine inventory list
- Category filter
- Stock status filter (In Stock/Low Stock/Out of Stock)
- Expiry date warnings
- Search by medicine name, batch
- Actions: View, Edit, Add Stock, Delete

**Columns:**
- Medicine Name
- Category
- Batch Number
- Stock Quantity
- Expiry Date
- Price
- Status
- Actions

**API Endpoints:**
```
GET    /api/pharmacy/medicines
GET    /api/pharmacy/medicines/:id
POST   /api/pharmacy/medicines
PUT    /api/pharmacy/medicines/:id
DELETE /api/pharmacy/medicines/:id
GET    /api/pharmacy/low-stock
```

---

### 6. Invoice 🔄
**Flutter Reference:** `lib/Modules/Invoice/InvoiceManagement.dart`

**Features to Implement:**
- Invoice list
- Payment status filter (Paid/Unpaid/Partial)
- Date range filter
- Patient search
- Actions: View, Edit, Print, Send, Delete

**Columns:**
- Invoice Number
- Patient Name
- Date
- Total Amount
- Paid Amount
- Balance
- Payment Status
- Actions

**API Endpoints:**
```
GET    /api/invoices
GET    /api/invoices/:id
POST   /api/invoices
PUT    /api/invoices/:id
DELETE /api/invoices/:id
GET    /api/invoices/:id/print
POST   /api/invoices/:id/send
```

---

### 7. Payroll 🔄
**Flutter Reference:** `lib/Modules/Payroll/PayrollManagement.dart`

**Features to Implement:**
- Payroll list
- Month/Year filter
- Department filter
- Payment status filter
- Search by employee
- Actions: View, Edit, Generate, Download, Pay

**Columns:**
- Employee Name & ID
- Department
- Month/Year
- Basic Salary
- Allowances
- Deductions
- Net Salary
- Status
- Actions

**API Endpoints:**
```
GET    /api/payroll
GET    /api/payroll/:id
POST   /api/payroll/generate
PUT    /api/payroll/:id
GET    /api/payroll/:id/slip
POST   /api/payroll/:id/pay
```

---

## 🎯 Implementation Strategy

### Phase 1: Setup (Per Module)
1. Create folder structure
2. Create service file
3. Add to routes
4. Add to module exports

### Phase 2: Core Component (Per Module)
1. Copy Appointments.jsx as template
2. Rename and update imports
3. Update state variables
4. Update API calls
5. Update table columns

### Phase 3: Styling
1. Copy Appointments.css
2. Rename to match component
3. Update class names if needed
4. Keep consistent design

### Phase 4: Testing
1. Test API integration
2. Test filters and search
3. Test pagination
4. Test actions
5. Fix any warnings

### Phase 5: Documentation
1. Create README.md
2. Document features
3. Document API endpoints
4. Move docs to `/documents/react/`

---

## 📁 Folder Structure Template

For each module:
```
src/modules/admin/[module]/
├── [Module].jsx          ← Main component
├── [Module].css          ← Styles (copy from Appointments)
└── index.js              ← Exports

src/services/
└── [module]Service.js    ← API service

documents/react/[module]/
└── README.md             ← Documentation
```

---

## 🔧 Component Template Structure

### 1. Imports
```javascript
import React, { useState, useEffect } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import [module]Service from '../../../services/[module]Service';
import './[Module].css';

// Custom SVG Icons (same as Appointments)
const Icons = { ... };
```

### 2. State Management
```javascript
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [currentPage, setCurrentPage] = useState(0);
const [filter1, setFilter1] = useState('All');
const [filter2, setFilter2] = useState('All');
const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
```

### 3. API Integration
```javascript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setIsLoading(true);
    const data = await [module]Service.fetch[Items]();
    setItems(data);
    setFilteredItems(data);
  } catch (error) {
    console.error('Failed to fetch:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Filtering Logic
```javascript
useEffect(() => {
  let result = items;
  
  if (filter1 !== 'All') {
    result = result.filter(item => item.field1 === filter1);
  }
  
  if (searchQuery) {
    result = result.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  setFilteredItems(result);
  setCurrentPage(0);
}, [items, filter1, searchQuery]);
```

### 5. Actions
```javascript
const handleView = async (item) => { ... };
const handleEdit = async (item) => { ... };
const handleDelete = async (item) => { ... };
const handleDownload = async (item) => { ... };
```

### 6. JSX Structure (Same as Appointments)
```jsx
<div className="dashboard-container">
  <div className="dashboard-header">...</div>
  <div className="filter-bar-container">...</div>
  <div className="table-card">
    <div className="modern-table-wrapper">
      <table className="modern-table">...</table>
    </div>
    <div className="pagination-footer">...</div>
  </div>
</div>
```

---

## 🎨 Design Consistency Checklist

For each page, ensure:

### Layout
- ✅ Use `dashboard-container` class
- ✅ Use `dashboard-header` for title
- ✅ Use `filter-bar-container` for search/filters
- ✅ Use `table-card` for table wrapper
- ✅ Use `modern-table-wrapper` for scrolling
- ✅ Use `modern-table` for table
- ✅ Use `pagination-footer` for pagination

### Search & Filters
- ✅ Search bar with icon (left side)
- ✅ Tab-based primary filters (if applicable)
- ✅ "More Filters" button for advanced
- ✅ Expandable advanced filters panel

### Table
- ✅ Sticky header
- ✅ Hover effect on rows
- ✅ Avatar/icon column (if applicable)
- ✅ Status badges with colors
- ✅ Action buttons column (last)

### Action Buttons
- ✅ View (gray icon)
- ✅ Edit (green icon)
- ✅ Delete (red icon)
- ✅ Download/Print (amber icon)
- ✅ Custom actions as needed

### Pagination
- ✅ Circular previous button
- ✅ Page indicator (Page X of Y)
- ✅ Circular next button
- ✅ Left-aligned

---

## 🔗 Service File Template

```javascript
import apiClient from './apiClient';

const API_URL = '/api/[module]';

const [module]Service = {
  // Fetch all
  fetchAll: async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
  },

  // Fetch by ID
  fetchById: async (id) => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  },

  // Create
  create: async (data) => {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  // Update
  update: async (id, data) => {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  // Delete
  delete: async (id) => {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data;
  },
};

export default [module]Service;
```

---

## 📊 Implementation Timeline

### Week 1: Staff & Pathology
- **Day 1-2**: Staff module complete
- **Day 3-4**: Pathology module complete
- **Day 5**: Testing and fixes

### Week 2: Pharmacy & Invoice
- **Day 1-2**: Pharmacy module complete
- **Day 3-4**: Invoice module complete
- **Day 5**: Testing and fixes

### Week 3: Payroll & Polish
- **Day 1-2**: Payroll module complete
- **Day 3-4**: Final testing and bug fixes
- **Day 5**: Documentation and deployment prep

---

## ✅ Quality Checklist (Per Module)

### Code Quality
- [ ] Zero ESLint warnings
- [ ] No unused imports
- [ ] No console.logs in production
- [ ] Consistent naming
- [ ] Comments where needed

### Functionality
- [ ] API integration works
- [ ] Search works across fields
- [ ] All filters work
- [ ] Pagination works
- [ ] Actions work (view/edit/delete)
- [ ] Loading states work
- [ ] Error handling works

### Design
- [ ] Matches Appointments layout
- [ ] No-scroll layout works
- [ ] Responsive on all devices
- [ ] Icons are colored correctly
- [ ] Status badges show properly
- [ ] Hover effects work

### Documentation
- [ ] README.md created
- [ ] Features documented
- [ ] API endpoints documented
- [ ] Moved to `/documents/react/`

---

## 🚀 Priority Order

Based on complexity and importance:

1. **Staff** (Simplest - similar to Patients)
2. **Pharmacy** (Medium - inventory management)
3. **Pathology** (Medium - test management)
4. **Invoice** (Complex - financial calculations)
5. **Payroll** (Most Complex - salary calculations)

---

## 📝 Next Steps

### To start Staff module:
1. Create folder: `src/modules/admin/staff/`
2. Create service: `src/services/staffService.js`
3. Copy `Patients.jsx` as `Staff.jsx`
4. Copy `Patients.css` as `Staff.css`
5. Update component for staff data
6. Test and document

**Ready to start with Staff module?** 🚀

---

**Created**: 2025-12-11

**Status**: Planning Complete

**Estimated Total Time**: 3 weeks (with testing)

**Dependencies**: Appointments & Patients (Complete ✅)

---

Let's build all these modules following the same clean, consistent pattern! 💪
