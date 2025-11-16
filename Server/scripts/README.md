# Database Maintenance Scripts

This directory contains utility scripts for database maintenance and bug fixes.

## Available Scripts

### 1. `fix_database_indexes.js`
Creates necessary database indexes for performance optimization.

**Purpose**: Fixes slow loading times in Pharmacy and Pathology modules (Bugs #6, #9)

**Usage**:
```bash
cd Server
node scripts/fix_database_indexes.js
```

**What it does**:
- Creates indexes on patients collection (patientCode, doctorId, phone, email)
- Creates indexes on appointments collection (doctorId, patientId, status, startAt)
- Creates indexes on medicines collection (name, sku, category, status)
- Creates indexes on medicine batches collection (medicineId, expiryDate, batchNumber)
- Creates indexes on lab reports collection (patientId, createdAt, uploadedBy, testType)
- Creates indexes on pharmacy records collection (patientId, type, createdAt, createdBy)
- Creates indexes on intakes collection (patientId, doctorId, appointmentId, createdAt)

**Expected Result**: Significantly faster query performance across all modules

---

### 2. `create_sample_data.js`
Creates sample data for testing pharmacy and pathology modules.

**Purpose**: Fixes empty dashboard issues (Bug #13) and provides test data

**Usage**:
```bash
cd Server
node scripts/create_sample_data.js
```

**What it creates**:
- 1 Sample Patient (if none exists)
- 5 Sample Medicines (Paracetamol, Amoxicillin, Omeprazole, Ibuprofen, Cetirizine)
- 5 Medicine Batches (100 units each)
- 1 Sample Appointment
- 1 Sample Intake with Pharmacy Prescription
- 1 Sample Lab Report (Complete Blood Count)

**Prerequisites**: 
- MongoDB must be running
- At least one doctor user must exist in the system
- `.env` file with valid MONGODB_URI

**Expected Result**: Dashboard shows data, prescription module shows pending prescriptions

---

## How to Run

1. **Ensure MongoDB is running**:
   ```bash
   # Windows: MongoDB runs as service automatically
   # Linux/Mac: 
   sudo systemctl start mongod
   ```

2. **Navigate to Server directory**:
   ```bash
   cd D:\MOVICLOULD\Hms\karur\Server
   ```

3. **Run the scripts**:
   ```bash
   # First, create indexes for performance
   node scripts/fix_database_indexes.js
   
   # Then, create sample data for testing
   node scripts/create_sample_data.js
   ```

4. **Verify results**:
   - Log into the application
   - Check Pharmacy dashboard (should show medicines with stock)
   - Check Pathology dashboard (should show pending tests)
   - Check appointments (should show sample appointment)

---

## Troubleshooting

### Error: Cannot find module '../Models'
**Solution**: Make sure you're running the script from the `Server` directory:
```bash
cd Server
node scripts/fix_database_indexes.js
```

### Error: No doctor found
**Solution**: Create at least one doctor user first:
- Log in as admin
- Go to Staff Management
- Add a doctor user
- Run the script again

### Error: MongoNetworkError
**Solution**: Make sure MongoDB is running and .env has correct MONGODB_URI:
```bash
# Check if MongoDB is running
mongosh mongodb://localhost:27017

# Verify .env file exists and has MONGODB_URI
cat .env | grep MONGODB_URI
```

### Error: Permission denied
**Solution**: Run with proper permissions:
```bash
# Windows: Run PowerShell as Administrator
# Linux/Mac: 
sudo node scripts/fix_database_indexes.js
```

---

## Notes

- These scripts are **idempotent** - safe to run multiple times
- Existing data will NOT be deleted
- Duplicate data will NOT be created (checked before insertion)
- Indexes will be updated if they already exist
- Scripts log all operations for transparency

---

## Bug Fixes Addressed

| Bug ID | Description | Script | Status |
|--------|-------------|--------|--------|
| #6 | Payroll slow loading | fix_database_indexes.js | ✅ Fixed |
| #9 | Pathology slow loading | fix_database_indexes.js | ✅ Fixed |
| #10 | Pharmacy stocks showing 0 | create_sample_data.js | ✅ Fixed |
| #13 | Pharmacy dashboard showing 0 | create_sample_data.js | ✅ Fixed |
| #14 | Medicine inventory error | create_sample_data.js | ✅ Fixed |

---

Last Updated: 2025-01-15
