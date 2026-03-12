# Pharmacy Module - Enterprise Architecture

## Overview
Enterprise-grade pharmacy management system for hospital operations. Refactored from monolithic 1,675-line `pharmacy.js` into 12 modular components.

**Note:** This module is directly imported in Server.js. All code resides within this pharmacy/ folder.

## Server.js Integration

```javascript
// In Server.js
app.use('/api/pharmacy', require('./routes/pharmacy/routes'));
```

## Architecture

```
pharmacy/
├── config.js                      # Configuration & constants
├── middleware.js                  # Auth & validation middleware
├── utils.js                       # Utility functions
├── summaryController.js           # Summary & statistics
├── medicineController.js          # Medicine CRUD
├── batchController.js             # Batch management
├── recordController.js            # Pharmacy records
├── prescriptionController.js      # Prescription management
├── intakeDispenseController.js    # Intake-based dispensing
├── adminController.js             # Admin analytics
├── patientController.js           # Patient history
├── routes.js                      # API routes (MAIN ENTRY)
├── index.js                       # Centralized exports
├── README.md                      # This file
└── pharmacy.js.backup             # Original 1,675-line file
```

## Module Responsibilities

### 1. **config.js** - Configuration
- Authorized roles (admin, pharmacist, superadmin)
- Stock thresholds (low stock, expiry warnings)
- Pagination defaults
- Record types
- Error codes

### 2. **middleware.js** - Middleware
- `requireAdminOrPharmacist` - Role-based access control
- `ensureModel` - Model availability checker

### 3. **utils.js** - Utilities
- Type conversion (toNumberOrNull, maybeNull)
- Stock value calculation
- Earnings calculation
- Medicine search query builder

### 4. **summaryController.js** - Summary
- GET /summary - Dashboard statistics

### 5. **medicineController.js** - Medicines
- POST /medicines - Create medicine
- GET /medicines - List medicines (with search)
- GET /medicines/:id - Get medicine
- PUT /medicines/:id - Update medicine
- DELETE /medicines/:id - Delete medicine

### 6. **batchController.js** - Batches
- POST /batches - Create batch
- GET /batches - List batches
- PUT /batches/:id - Update batch
- DELETE /batches/:id - Delete batch

### 7. **recordController.js** - Records
- POST /records/dispense - Create dispense record
- GET /records - List records
- GET /records/:id - Get record

### 8. **prescriptionController.js** - Prescriptions
- GET /pending-prescriptions - Get pending
- GET /prescriptions - List all
- DELETE /prescriptions/:id - Delete prescription

### 9. **intakeDispenseController.js** - Intake Dispensing
- POST /prescriptions/create-from-intake - Create from intake
- POST /prescriptions/:intakeId/dispense - Dispense
- GET /prescriptions/:intakeId/pdf - Get PDF

### 10. **adminController.js** - Admin
- GET /admin/analytics - Analytics dashboard
- GET /admin/low-stock - Low stock alerts
- GET /admin/expiring-batches - Expiry warnings
- POST /admin/bulk-import - Bulk import medicines
- GET /admin/inventory-report - Inventory report

### 11. **patientController.js** - Patients
- GET /patients/:id - Patient pharmacy history

### 12. **routes.js** - Routes
- 25 API endpoints organized by feature

## Features

### 📊 Dashboard & Analytics
- Total stock value calculation
- Total earnings tracking
- Pending/completed prescription counts
- Real-time analytics

### 💊 Medicine Management
- Complete CRUD operations
- Search by name, generic name, manufacturer
- Categorization support
- Dosage form & strength tracking

### 📦 Batch Management
- Batch-level inventory control
- Expiry date tracking
- Unit price & sale price management
- Supplier information

### 📝 Prescription & Dispensing
- Pending prescription queue
- Intake-based dispensing
- Automatic stock deduction
- Payment tracking

### 📈 Admin Tools
- Low stock alerts (configurable threshold)
- Expiring batch warnings (90-day default)
- Bulk medicine import
- Comprehensive inventory reports

### 👥 Patient History
- Complete pharmacy transaction history
- Dispensing records
- Payment history

## API Endpoints (25 total)

### Summary (1)
```
GET /summary - Dashboard statistics
```

### Medicines (5)
```
POST   /medicines        - Create medicine
GET    /medicines        - List medicines (search: query param)
GET    /medicines/:id    - Get medicine
PUT    /medicines/:id    - Update medicine
DELETE /medicines/:id    - Delete medicine
```

### Batches (4)
```
POST   /batches       - Create batch
GET    /batches       - List batches (medicineId: query param)
PUT    /batches/:id   - Update batch
DELETE /batches/:id   - Delete batch
```

### Records (3)
```
POST /records/dispense  - Create dispense record
GET  /records           - List records (type, patientId: query params)
GET  /records/:id       - Get record details
```

### Prescriptions (6)
```
GET    /pending-prescriptions                  - Get pending
GET    /prescriptions                          - List all
DELETE /prescriptions/:id                      - Delete
POST   /prescriptions/create-from-intake       - Create from intake
POST   /prescriptions/:intakeId/dispense       - Dispense from intake
GET    /prescriptions/:intakeId/pdf            - Get prescription PDF
```

### Admin (5)
```
GET  /admin/analytics          - Analytics dashboard
GET  /admin/low-stock          - Low stock alerts
GET  /admin/expiring-batches   - Expiry warnings
POST /admin/bulk-import        - Bulk import
GET  /admin/inventory-report   - Inventory report
```

### Patients (1)
```
GET /patients/:id - Patient pharmacy history
```

## Configuration

Configurable settings (config.js):
```javascript
AUTHORIZED_ROLES: ['admin', 'pharmacist', 'superadmin']
LOW_STOCK_THRESHOLD: 10
EXPIRY_WARNING_DAYS: 90
DEFAULT_PAGE_SIZE: 50
MAX_PAGE_SIZE: 100
```

## Security

- ✅ Role-based access control (admin/pharmacist only)
- ✅ Authentication required (auth middleware)
- ✅ Input validation
- ✅ Error code standardization
- ✅ Model existence checks

## Data Models

### Medicine
- name, genericName, category
- manufacturer, dosageForm, strength
- description

### MedicineBatch
- medicineId (ref), batchNumber
- quantity, unitPrice, salePrice
- expiryDate, supplier

### PharmacyRecord
- type (Dispense/Restock/Adjustment)
- patientId (ref), items[]
- total, paymentMethod
- dispensedBy (ref), intakeId (ref)

## Statistics

| Metric | Value |
|--------|-------|
| **Original File** | 1,675 lines |
| **New Routes Entry** | ~100 lines |
| **Total Modules** | 12 files |
| **Average Module Size** | ~140 lines |
| **Total Endpoints** | 25 routes |
| **Total Documentation** | This README |

## Benefits

✅ **Modular** - 12 focused, single-responsibility files  
✅ **Testable** - Independent unit testing  
✅ **Maintainable** - Easy to locate and update  
✅ **Scalable** - Simple to add new features  
✅ **Documented** - Comprehensive guide  
✅ **Self-contained** - Everything in pharmacy/ folder  
✅ **Enterprise-grade** - Production-ready patterns  

## Usage Examples

### Import Router
```javascript
// In Server.js
const pharmacyRouter = require('./routes/pharmacy/routes');
app.use('/api/pharmacy', pharmacyRouter);
```

### Create Medicine
```javascript
POST /api/pharmacy/medicines
Body: {
  name: "Paracetamol",
  genericName: "Acetaminophen",
  category: "Analgesic",
  manufacturer: "XYZ Pharma",
  dosageForm: "Tablet",
  strength: "500mg"
}
```

### Create Batch
```javascript
POST /api/pharmacy/batches
Body: {
  medicineId: "60d5ec49...",
  batchNumber: "BATCH-2026-001",
  quantity: 1000,
  unitPrice: 2.50,
  salePrice: 5.00,
  expiryDate: "2027-12-31",
  supplier: "ABC Distributors"
}
```

### Dispense Medicine
```javascript
POST /api/pharmacy/records/dispense
Body: {
  patientId: "60d5ec49...",
  items: [
    { batchId: "...", quantity: 10, unitPrice: 5.00 }
  ],
  paymentMethod: "Cash"
}
```

## Error Handling

- Model missing errors (500, code 7001)
- Auth errors (403, code 6002)
- Validation errors (400, code 6003)
- Not found errors (404, code 6004)

## Support

- **Documentation**: This README
- **Code**: Check specific module for implementation
- **Backup**: pharmacy.js.backup for reference

---

**Last Updated:** 2026-03-04  
**Version:** 2.0.0 (Modularized)  
**Module Count:** 12 files
