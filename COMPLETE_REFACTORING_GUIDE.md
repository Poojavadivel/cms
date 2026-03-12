# 🤖 Automated Route Refactoring Guide

## 🎯 **Objective**
Complete refactoring of 18 route files (~10,000 lines) into modular, maintainable structure.

---

## 📊 **Remaining Files Priority Matrix**

### **🔴 CRITICAL Priority (5 files - 5,763 lines)**

| File | Lines | Complexity | Modules | Est. Time |
|------|-------|------------|---------|-----------|
| scanner-enterprise.js | 1,458 | HIGH | 4-5 | 2-3 hrs |
| bot.js | 1,166 | HIGH | 4 | 2 hrs |
| telegram.js | 1,081 | HIGH | 3-4 | 2 hrs |
| enterpriseReports.js | 1,057 | HIGH | 4 | 2 hrs |
| appointment.js | 1,001 | MEDIUM | 4-5 | 2 hrs |

### **🟠 HIGH Priority (3 files - 2,196 lines)**

| File | Lines | Complexity | Modules | Est. Time |
|------|-------|------------|---------|-----------|
| payroll.js | 748 | MEDIUM | 3-4 | 1.5 hrs |
| pathology.js | 729 | MEDIUM | 3 | 1.5 hrs |
| intake.js | 719 | MEDIUM | 2-3 | 1 hr |

### **🟡 MEDIUM Priority (4 files - 1,949 lines)**

| File | Lines | Complexity | Modules | Est. Time |
|------|-------|------------|---------|-----------|
| patients.js | 528 | LOW | 2-3 | 1 hr |
| reports.js | 505 | LOW | 2 | 45 min |
| properReports.js | 499 | LOW | 2 | 45 min |
| staff.js | 417 | LOW | 2 | 45 min |

### **🟢 LOW Priority (6 files - 1,397 lines)**

| File | Lines | Complexity | Modules | Est. Time |
|------|-------|------------|---------|-----------|
| auth.js | 366 | LOW | 2-3 | 45 min |
| apiAnalytics.js | 334 | LOW | 2 | 30 min |
| dashboard.js | 257 | LOW | 2 | 30 min |
| beds.js | 175 | LOW | 1-2 | 20 min |
| doctors.js | 145 | LOW | 1 | 15 min |
| card.js | 120 | LOW | 1 | 15 min |

**Total: 18 files, ~11,305 lines, Est. 20-25 hours**

---

## 🏗️ **Module Structure Template**

### **For Each Route File:**

```
routes/{module}/
├── index.js              # Route aggregator
├── helpers.js            # Shared utilities
├── {feature1}.routes.js  # Feature 1
├── {feature2}.routes.js  # Feature 2
├── {feature3}.routes.js  # Feature 3
└── {service}.service.js  # Business logic (if needed)
```

---

## 📋 **Detailed Refactoring Plans**

### **1. Scanner-Enterprise Module** (1,458 lines)

**Current Issues:**
- Massive file with document upload, OCR, verification
- Multiple external API integrations (LandingAI, Google Vision)
- Complex file handling logic

**Proposed Structure:**
```
routes/scanner/
├── index.js               # Main aggregator
├── helpers.js             # File upload utilities
├── upload.routes.js       # Document upload endpoints
├── verification.routes.js # ID/document verification
├── landingai.routes.js    # LandingAI OCR integration
├── vision.routes.js       # Google Vision API
├── bulk.routes.js         # Bulk processing
└── ocr.service.js         # OCR business logic
```

**Endpoints to split:**
- `POST /upload` → upload.routes.js
- `POST /verify` → verification.routes.js
- `POST /landingai/*` → landingai.routes.js
- `POST /vision/*` → vision.routes.js
- `POST /bulk-process` → bulk.routes.js

---

### **2. Bot Module** (1,166 lines)

**Current Issues:**
- OpenAI integration scattered throughout
- Chat history management complex
- Metrics and feedback mixed with chat logic

**Proposed Structure:**
```
routes/bot/
├── index.js              # Main aggregator
├── helpers.js            # Chat utilities
├── chat.routes.js        # Chat endpoints
├── metrics.routes.js     # Usage metrics
├── feedback.routes.js    # User feedback
├── history.routes.js     # Chat history
├── openai.service.js     # OpenAI integration
└── prompts.config.js     # System prompts
```

**Endpoints to split:**
- `POST /chat` → chat.routes.js
- `GET /metrics` → metrics.routes.js
- `POST /feedback` → feedback.routes.js
- `GET /history` → history.routes.js

---

### **3. Telegram Module** (1,081 lines)

**Current Issues:**
- Webhook handling complex
- Gemini AI integration
- Multiple command handlers

**Proposed Structure:**
```
routes/telegram/
├── index.js              # Main aggregator
├── helpers.js            # Telegram utilities
├── webhook.routes.js     # Webhook handling
├── commands.routes.js    # Bot commands
├── messages.routes.js    # Message handling
├── gemini.service.js     # Gemini AI integration
└── bot.config.js         # Bot configuration
```

**Endpoints to split:**
- `POST /webhook` → webhook.routes.js
- `POST /command/*` → commands.routes.js
- Message handlers → messages.routes.js

---

### **4. Enterprise Reports Module** (1,057 lines)

**Current Issues:**
- Multiple PDF generation endpoints
- Patient, doctor, staff reports mixed
- Large PDF generation logic

**Proposed Structure:**
```
routes/reports/
├── index.js              # Main aggregator
├── helpers.js            # Report utilities
├── patient.routes.js     # Patient reports
├── doctor.routes.js      # Doctor reports
├── staff.routes.js       # Staff reports
├── financial.routes.js   # Financial reports
├── pdf-generator.js      # PDF utilities
└── templates/            # PDF templates
    ├── patient.template.js
    ├── doctor.template.js
    └── staff.template.js
```

**Endpoints to split:**
- `GET /patient/:id/pdf` → patient.routes.js
- `GET /doctor/:id/pdf` → doctor.routes.js
- `GET /staff/:id/pdf` → staff.routes.js
- `GET /financial/*` → financial.routes.js

---

### **5. Appointment Module** (1,001 lines)

**Current Issues:**
- CRUD operations mixed with business logic
- Follow-up system complex
- Calendar/availability logic scattered

**Proposed Structure:**
```
routes/appointment/
├── index.js              # Main aggregator
├── helpers.js            # Appointment utilities
├── crud.routes.js        # Create/Read/Update/Delete
├── followup.routes.js    # Follow-up management
├── availability.routes.js # Doctor availability
├── calendar.routes.js    # Calendar view
├── reminders.routes.js   # Appointment reminders
└── scheduling.service.js # Scheduling logic
```

**Endpoints to split:**
- `POST /appointments` → crud.routes.js
- `GET /appointments` → crud.routes.js
- `POST /followup` → followup.routes.js
- `GET /availability` → availability.routes.js
- `GET /calendar` → calendar.routes.js

---

## 🔧 **Refactoring Workflow (Per Module)**

### **Step 1: Analysis (10 min)**
```bash
# Count routes in file
grep -c "router\." routes/{filename}.js

# Identify route groups
grep "router\." routes/{filename}.js | sort
```

### **Step 2: Create Structure (5 min)**
```bash
mkdir -p routes/{module}
touch routes/{module}/index.js
touch routes/{module}/helpers.js
```

### **Step 3: Extract Routes (30-60 min)**
- Copy related routes to new files
- Update imports
- Test each file independently

### **Step 4: Create Aggregator (10 min)**
```javascript
// routes/{module}/index.js
const express = require('express');
const router = express.Router();

const feature1Routes = require('./feature1.routes');
const feature2Routes = require('./feature2.routes');

router.use('/feature1', feature1Routes);
router.use('/feature2', feature2Routes);

module.exports = router;
```

### **Step 5: Test & Validate (15 min)**
- Start server
- Test all endpoints
- Check error handling
- Verify logs

---

## 🤖 **Automation Script Template**

```javascript
// scripts/refactor-module.js
const fs = require('fs');
const path = require('path');

function refactorModule(moduleName, routes) {
  const moduleDir = path.join(__dirname, '../routes', moduleName);
  
  // Create directory
  if (!fs.existsSync(moduleDir)) {
    fs.mkdirSync(moduleDir, { recursive: true });
  }
  
  // Create files
  createIndexFile(moduleDir, routes);
  createHelpersFile(moduleDir);
  
  routes.forEach(route => {
    createRouteFile(moduleDir, route);
  });
  
  console.log(`✅ Module ${moduleName} refactored successfully!`);
}

function createIndexFile(dir, routes) {
  const imports = routes.map(r => 
    `const ${r.name}Routes = require('./${r.file}');`
  ).join('\n');
  
  const uses = routes.map(r => 
    `router.use('/${r.path}', ${r.name}Routes);`
  ).join('\n');
  
  const content = `
const express = require('express');
const router = express.Router();

${imports}

${uses}

module.exports = router;
  `.trim();
  
  fs.writeFileSync(path.join(dir, 'index.js'), content);
}

// Usage:
refactorModule('scanner', [
  { name: 'upload', file: 'upload.routes.js', path: 'upload' },
  { name: 'verify', file: 'verification.routes.js', path: 'verify' },
  { name: 'landingai', file: 'landingai.routes.js', path: 'landingai' }
]);
```

---

## 📊 **Progress Tracking**

### **Checklist Template:**

```markdown
## Module: {MODULE_NAME}

- [ ] Analysis complete
- [ ] Directory structure created
- [ ] Helpers extracted
- [ ] Route 1: {name} created
- [ ] Route 2: {name} created
- [ ] Route 3: {name} created
- [ ] Index aggregator created
- [ ] All endpoints tested
- [ ] Error handling verified
- [ ] Documentation updated
- [ ] Server.js updated
- [ ] Committed to git
```

---

## 🎯 **Quick Win Strategy**

### **Day 1: Critical Modules (8 hrs)**
1. ✅ Pharmacy (DONE)
2. ⏳ Scanner-enterprise (2-3 hrs)
3. ⏳ Bot (2 hrs)
4. ⏳ Telegram (2 hrs)

### **Day 2: High Priority (6 hrs)**
5. ⏳ Enterprise Reports (2 hrs)
6. ⏳ Appointment (2 hrs)
7. ⏳ Payroll (1.5 hrs)

### **Day 3: Medium Priority (4 hrs)**
8. ⏳ Pathology (1.5 hrs)
9. ⏳ Intake (1 hr)
10. ⏳ Patients (1 hr)

### **Day 4: Remaining (4 hrs)**
11-18. ⏳ All remaining modules

---

## 🚀 **Batch Processing Command**

```bash
# Refactor all critical modules
for module in scanner bot telegram reports appointment; do
  echo "Refactoring $module..."
  node scripts/refactor-module.js $module
done
```

---

## 📝 **Code Quality Checklist**

For each refactored module ensure:

- [ ] No file exceeds 500 lines
- [ ] All functions have JSDoc comments
- [ ] Consistent error handling
- [ ] Proper logging (with emojis)
- [ ] Input validation
- [ ] Authorization checks
- [ ] No code duplication
- [ ] Pagination on list endpoints
- [ ] Proper HTTP status codes
- [ ] Error codes documented

---

## 🎓 **Best Practices Reminder**

1. **Single Responsibility**: Each file should do ONE thing
2. **DRY Principle**: Extract common logic to helpers
3. **Consistent Naming**: Use verb-noun pattern (e.g., `getPatients`, `createAppointment`)
4. **Error First**: Always handle errors properly
5. **Logging**: Log important operations
6. **Comments**: Explain WHY, not WHAT
7. **Testing**: Test each module independently

---

## 📚 **Reference Files**

Use these as templates:
- `routes/pharmacy/helpers.js` - Helper utilities pattern
- `routes/pharmacy/medicines.routes.js` - CRUD operations pattern
- `routes/pharmacy/dispense.routes.js` - Transaction pattern
- `routes/pharmacy/admin.routes.js` - Analytics pattern
- `routes/pharmacy/index.js` - Aggregator pattern

---

## 🎯 **Success Metrics**

- **Code Quality**: All files < 500 lines ✅
- **Maintainability**: Easy to find and modify code ✅
- **Test Coverage**: 80%+ target
- **Performance**: No regression
- **Documentation**: 100% coverage
- **Team Velocity**: 2x faster development

---

**Status:** 1/19 modules complete (Pharmacy ✅)  
**Next:** Scanner-enterprise module  
**Timeline:** 4-5 days for complete refactoring

---

*Follow this guide systematically for consistent, high-quality refactoring.* 🚀
