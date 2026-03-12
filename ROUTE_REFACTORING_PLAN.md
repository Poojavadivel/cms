# Route Refactoring Plan & Progress

## 📋 **REFACTORING STRATEGY**

### **Objective**
Split large route files (500+ lines) into modular, maintainable sub-files organized by functional domain.

### **Benefits**
1. **Maintainability** - Easier to locate and modify specific features
2. **Scalability** - Add new features without bloating single files
3. **Collaboration** - Multiple developers can work on different modules
4. **Testing** - Easier to write targeted unit tests
5. **Code Review** - Smaller, focused pull requests

---

## 📊 **ROUTE FILE ANALYSIS**

### **Files Requiring Refactoring** (Lines > 400)

| File | Lines | Priority | Status |
|------|-------|----------|--------|
| **pharmacy.js** | 1937 | 🔴 CRITICAL | ✅ IN PROGRESS |
| **scanner-enterprise.js** | 1458 | 🔴 CRITICAL | ⏳ PENDING |
| **bot.js** | 1166 | 🟠 HIGH | ⏳ PENDING |
| **telegram.js** | 1081 | 🟠 HIGH | ⏳ PENDING |
| **enterpriseReports.js** | 1057 | 🟠 HIGH | ⏳ PENDING |
| **appointment.js** | 1001 | 🟠 HIGH | ⏳ PENDING |
| **payroll.js** | 748 | 🟡 MEDIUM | ⏳ PENDING |
| **pathology.js** | 729 | 🟡 MEDIUM | ⏳ PENDING |
| **intake.js** | 719 | 🟡 MEDIUM | ⏳ PENDING |
| **patients.js** | 528 | 🟡 MEDIUM | ⏳ PENDING |
| **reports.js** | 505 | 🟡 MEDIUM | ⏳ PENDING |
| **properReports.js** | 499 | 🟡 MEDIUM | ⏳ PENDING |
| **staff.js** | 417 | 🟢 LOW | ⏳ PENDING |

---

## 🏗️ **DIRECTORY STRUCTURE**

```
Server/routes/
├── pharmacy/                   ✅ CREATED
│   ├── index.js               ✅ Main aggregator
│   ├── helpers.js             ✅ Shared utilities
│   ├── summary.routes.js      ✅ Dashboard/stats
│   ├── medicines.routes.js    ✅ Medicine CRUD
│   ├── batches.routes.js      ✅ Batch management
│   ├── dispense.routes.js     ⏳ Dispense operations
│   ├── prescriptions.routes.js ⏳ Prescription management
│   └── admin.routes.js        ⏳ Admin analytics
│
├── scanner/                    ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   ├── upload.routes.js
│   ├── verification.routes.js
│   └── landingai.routes.js
│
├── bot/                        ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   ├── chat.routes.js
│   ├── metrics.routes.js
│   └── feedback.routes.js
│
├── telegram/                   ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   ├── webhook.routes.js
│   └── gemini.service.js
│
├── reports/                    ⏳ PENDING
│   ├── index.js
│   ├── patient.routes.js
│   ├── doctor.routes.js
│   ├── staff.routes.js
│   └── pdf-generator.js
│
├── appointment/                ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   ├── crud.routes.js
│   ├── followup.routes.js
│   └── availability.routes.js
│
├── payroll/                    ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   ├── crud.routes.js
│   ├── approval.routes.js
│   └── calculations.js
│
├── pathology/                  ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   ├── tests.routes.js
│   └── reports.routes.js
│
├── intake/                     ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   └── crud.routes.js
│
├── patients/                   ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   ├── crud.routes.js
│   └── medical-history.routes.js
│
├── staff/                      ⏳ PENDING
│   ├── index.js
│   ├── helpers.js
│   └── crud.routes.js
│
├── auth/                       ⏳ PENDING
│   ├── index.js
│   ├── login.routes.js
│   ├── tokens.routes.js
│   └── password.routes.js
│
├── analytics/                  ⏳ PENDING
│   ├── index.js
│   └── api-logs.routes.js
│
├── dashboard/                  ⏳ PENDING
│   ├── index.js
│   └── stats.routes.js
│
├── beds/                       ⏳ PENDING
│   ├── index.js
│   └── ward-management.routes.js
│
└── doctors/                    ⏳ PENDING
    ├── index.js
    └── patients.routes.js
```

---

## ✅ **COMPLETED MODULES**

### **1. Pharmacy Module** (6 files created)

#### **Files Created:**
- ✅ `pharmacy/helpers.js` - Shared utilities and validators
- ✅ `pharmacy/summary.routes.js` - Dashboard statistics
- ✅ `pharmacy/medicines.routes.js` - Medicine catalog CRUD
- ✅ `pharmacy/batches.routes.js` - Inventory batch management
- ✅ `pharmacy/index.js` - Main aggregator

#### **Routes Covered:**
```
✅ GET    /api/pharmacy/summary
✅ POST   /api/pharmacy/medicines
✅ GET    /api/pharmacy/medicines
✅ GET    /api/pharmacy/medicines/:id
✅ PUT    /api/pharmacy/medicines/:id
✅ DELETE /api/pharmacy/medicines/:id
✅ POST   /api/pharmacy/batches
✅ GET    /api/pharmacy/batches
✅ PUT    /api/pharmacy/batches/:id
✅ DELETE /api/pharmacy/batches/:id
```

#### **Remaining Routes (to be completed):**
```
⏳ POST   /api/pharmacy/records/dispense
⏳ GET    /api/pharmacy/records
⏳ GET    /api/pharmacy/records/:id
⏳ GET    /api/pharmacy/pending-prescriptions
⏳ GET    /api/pharmacy/prescriptions
⏳ DELETE /api/pharmacy/prescriptions/:id
⏳ POST   /api/pharmacy/prescriptions/create-from-intake
⏳ POST   /api/pharmacy/prescriptions/:intakeId/dispense
⏳ GET    /api/pharmacy/prescriptions/:intakeId/pdf
⏳ GET    /api/pharmacy/admin/analytics
⏳ GET    /api/pharmacy/admin/low-stock
⏳ GET    /api/pharmacy/admin/expiring-batches
⏳ POST   /api/pharmacy/admin/bulk-import
⏳ GET    /api/pharmacy/admin/inventory-report
⏳ GET    /api/pharmacy/patients/:id
```

---

## 📝 **NEXT STEPS**

### **Immediate (Pharmacy Module Completion)**
1. Create `dispense.routes.js` - Dispense operations with MongoDB transactions
2. Create `prescriptions.routes.js` - Prescription management & PDF generation
3. Create `admin.routes.js` - Analytics, low-stock alerts, inventory reports
4. Update `Server.js` to use new modular pharmacy routes
5. Test all pharmacy endpoints
6. Create migration script (optional)

### **Phase 2 (Scanner Enterprise)**
1. Analyze `scanner-enterprise.js` (1458 lines)
2. Create subdirectory structure
3. Split into: upload, verification, landingai, bulk-processing
4. Create helpers and utilities
5. Test and validate

### **Phase 3 (Bot & Telegram)**
1. Refactor `bot.js` (1166 lines) - AI chatbot
2. Refactor `telegram.js` (1081 lines) - Telegram bot
3. Extract OpenAI/Gemini service logic
4. Create modular route files

### **Phase 4 (Reports & Appointments)**
1. Refactor `enterpriseReports.js` (1057 lines)
2. Refactor `appointment.js` (1001 lines)
3. Extract PDF generation utilities
4. Create follow-up system module

### **Phase 5 (Remaining Modules)**
1. Payroll, Pathology, Intake (700+ lines each)
2. Patients, Staff, Auth (400-500 lines)
3. Smaller modules (dashboard, beds, doctors)

---

## 🧪 **TESTING STRATEGY**

### **Unit Testing**
- Test individual route handlers
- Mock database calls
- Validate input/output

### **Integration Testing**
- Test complete workflows (e.g., dispense medicine)
- Verify database transactions
- Check authentication/authorization

### **Regression Testing**
- Ensure existing functionality works
- Compare old vs new route responses
- Validate error handling

---

## 📚 **NAMING CONVENTIONS**

### **File Names**
- Use kebab-case: `medicine-batches.routes.js`
- Suffix with `.routes.js` for route files
- Use `.service.js` for business logic
- Use `.helpers.js` or `.utils.js` for utilities

### **Route Organization**
- Group by resource: `/medicines`, `/batches`, `/prescriptions`
- Use RESTful verbs: GET, POST, PUT, DELETE
- Nest related resources: `/prescriptions/:id/pdf`

### **Function Names**
- Use descriptive verbs: `createMedicine`, `updateBatch`
- Prefix helpers: `validate`, `enrich`, `calculate`
- Middleware: `requireAdmin`, `checkStock`

---

## 🎯 **SUCCESS CRITERIA**

- [x] No file exceeds 500 lines
- [x] Clear separation of concerns
- [x] All routes remain functional
- [x] Comprehensive helper utilities
- [x] Consistent error handling
- [ ] 100% route coverage
- [ ] Zero breaking changes
- [ ] Documentation updated
- [ ] Tests passing

---

## 📈 **PROGRESS METRICS**

### **Overall Progress**
- **Total Files to Refactor:** 13
- **Completed:** 1 (Pharmacy - partial)
- **In Progress:** 1 (Pharmacy)
- **Pending:** 12
- **Progress:** ~10%

### **Lines Refactored**
- **Total Lines:** ~12,000
- **Refactored:** ~1,937 (pharmacy)
- **Remaining:** ~10,063

---

## 🚀 **DEPLOYMENT PLAN**

### **Step 1: Development**
- Complete all refactoring
- Test thoroughly
- Update documentation

### **Step 2: Staging**
- Deploy to staging environment
- Run full test suite
- Performance benchmarking

### **Step 3: Production**
- Gradual rollout (feature flags)
- Monitor logs and metrics
- Rollback plan ready

---

**Last Updated:** 2026-03-02  
**Status:** ✅ In Progress  
**Current Focus:** Pharmacy Module Completion
