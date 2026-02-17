# 📚 Documentation Index

## 📂 Main Branch (Root) - General Documentation

### In Root Folder:
- **README.md** - Main project documentation with:
  - Project overview
  - Installation instructions
  - Features list
  - Basic contributing guidelines
  - Branch workflow overview

### In documents/ Folder:
- **BRANCH_STRUCTURE.md** - Complete branch structure and rules
- **GIT_WORKFLOW_QUICK_REFERENCE.md** - Quick reference for daily work
- **All other .md and .txt files** - Project documentation (86 files)

---

## 🌿 Feature Branches - Module-Specific Documentation

Each feature branch contains its own module-specific contributing guide:

### feature/admin-module
- **CONTRIBUTING_ADMIN.md** - Admin module workflow
  - Admin module structure
  - API endpoints for admin
  - State management patterns
  - UI/UX guidelines
  - Testing checklist
  - Module-specific best practices
  - How to merge admin module to main

### feature/doctor-module
- **CONTRIBUTING_DOCTOR.md** - Doctor module workflow
  - Doctor module structure
  - API endpoints for doctors
  - Prescription patterns
  - Medical data guidelines
  - Patient safety rules
  - How to merge doctor module to main

### feature/pathologist-module
- **CONTRIBUTING_PATHOLOGIST.md** - Pathologist module workflow
  - Pathology module structure
  - Lab test API endpoints
  - Result entry patterns
  - Laboratory data guidelines
  - Quality control rules
  - How to merge pathologist module to main

### feature/pharmacist-module
- **CONTRIBUTING_PHARMACIST.md** - Pharmacist module workflow
  - Pharmacy module structure
  - Inventory API endpoints
  - Stock management patterns
  - Pharmacy data guidelines
  - Expiry management
  - How to merge pharmacist module to main

### feature/common-module
- **CONTRIBUTING_COMMON.md** - Common module workflow
  - Common module structure
  - Shared components
  - Utility functions
  - API services
  - Impact analysis process
  - How to merge common module to main

---

## 🎯 Quick Navigation Guide

### "I need to know how to start working"
1. Read **README.md** (root)
2. Read **documents/GIT_WORKFLOW_QUICK_REFERENCE.md**
3. Checkout your feature branch
4. Read **CONTRIBUTING_[MODULE].md** in that branch

### "I need branch and git rules"
- **documents/BRANCH_STRUCTURE.md** - All branch rules
- **documents/GIT_WORKFLOW_QUICK_REFERENCE.md** - Quick reference

### "I need to know how to merge to main"
- **documents/GIT_WORKFLOW_QUICK_REFERENCE.md** - Section: "Merge to Main Process"
- **documents/BRANCH_STRUCTURE.md** - Section: "Merging Feature Branch to Main"
- **CONTRIBUTING_[MODULE].md** in feature branch - Section: "Merging to Main"

### "I need module-specific info"
1. Checkout the feature branch: `git checkout feature/[module-name]`
2. Read **CONTRIBUTING_[MODULE].md** in that branch

---

## 📍 Where is What?

| Documentation | Location | Access |
|--------------|----------|--------|
| Main README | Root folder | Always in main branch |
| Branch Structure | documents/ folder | Main branch |
| Git Quick Reference | documents/ folder | Main branch |
| Admin Guide | Root of feature/admin-module | Checkout admin branch |
| Doctor Guide | Root of feature/doctor-module | Checkout doctor branch |
| Pathologist Guide | Root of feature/pathologist-module | Checkout pathologist branch |
| Pharmacist Guide | Root of feature/pharmacist-module | Checkout pharmacist branch |
| Common Guide | Root of feature/common-module | Checkout common branch |

---

## 🔍 How to Access Feature Branch Documentation

### Option 1: Checkout the Branch
```bash
# Checkout feature branch
git checkout feature/admin-module

# The CONTRIBUTING_ADMIN.md is now in root
cat CONTRIBUTING_ADMIN.md
```

### Option 2: View on GitHub
1. Go to: https://github.com/movicloudlabs-ai-testenv/HMS-DEV
2. Switch branch dropdown → Select feature branch
3. View CONTRIBUTING_[MODULE].md file

### Option 3: View Directly from Main
```bash
# View without checkout
git show feature/admin-module:CONTRIBUTING_ADMIN.md
```

---

## 📋 Complete File List

### Main Branch Root:
- ✅ README.md

### Main Branch documents/:
- ✅ BRANCH_STRUCTURE.md
- ✅ GIT_WORKFLOW_QUICK_REFERENCE.md
- ✅ DOCUMENTATION_INDEX.md (this file)
- ✅ 83+ other documentation files

### Feature Branches Root:
- ✅ feature/admin-module → CONTRIBUTING_ADMIN.md
- ✅ feature/doctor-module → CONTRIBUTING_DOCTOR.md
- ✅ feature/pathologist-module → CONTRIBUTING_PATHOLOGIST.md
- ✅ feature/pharmacist-module → CONTRIBUTING_PHARMACIST.md
- ✅ feature/common-module → CONTRIBUTING_COMMON.md

---

## 🚀 Typical Workflow

### For New Developer:

1. **Read general docs** (main branch):
   ```bash
   git checkout main
   cat README.md
   cat documents/GIT_WORKFLOW_QUICK_REFERENCE.md
   ```

2. **Checkout your module**:
   ```bash
   git checkout feature/admin-module
   ```

3. **Read module-specific guide**:
   ```bash
   cat CONTRIBUTING_ADMIN.md
   ```

4. **Start working**:
   ```bash
   git checkout -b feature/admin-module-my-feature
   # Make changes
   git add .
   git commit -m "feat(admin): my feature"
   git push origin feature/admin-module-my-feature
   ```

---

## 📞 Questions?

- **General Git workflow**: See documents/GIT_WORKFLOW_QUICK_REFERENCE.md
- **Branch structure**: See documents/BRANCH_STRUCTURE.md
- **Module-specific**: See CONTRIBUTING_[MODULE].md in feature branch
- **Project overview**: See README.md in root

---

**Last Updated**: December 5, 2025  
**Repository**: Karur Gastro Foundation HMS  
**Test Environment**: https://github.com/movicloudlabs-ai-testenv/HMS-DEV  
**Production**: https://github.com/movi-innovations/Karur-Gastro-Foundation
