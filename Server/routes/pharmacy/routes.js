/**
 * pharmacy/routes.js
 * Express routes for pharmacy module
 */

const express = require('express');
const router = express.Router();
const auth = require('../../Middleware/Auth');

// Controllers
const { getSummary } = require('./summaryController');
const { 
  createMedicine, 
  getMedicines, 
  getMedicineById, 
  updateMedicine, 
  deleteMedicine 
} = require('./medicineController');
const { 
  createBatch, 
  getBatches, 
  updateBatch, 
  deleteBatch 
} = require('./batchController');
const { 
  createDispenseRecord, 
  getRecords, 
  getRecordById 
} = require('./recordController');
const { 
  getPendingPrescriptions, 
  getPrescriptions, 
  deletePrescription 
} = require('./prescriptionController');
const {
  getAnalytics,
  getLowStock,
  getExpiringBatches,
  bulkImport,
  getInventoryReport
} = require('./adminController');

// Import specialized controllers for complex operations
const intakeDispenseController = require('./intakeDispenseController');
const patientController = require('./patientController');

// ===== SUMMARY =====
router.get('/summary', auth, getSummary);

// ===== MEDICINES =====
router.post('/medicines', auth, createMedicine);
router.get('/medicines', auth, getMedicines);
router.get('/medicines/:id', auth, getMedicineById);
router.put('/medicines/:id', auth, updateMedicine);
router.delete('/medicines/:id', auth, deleteMedicine);

// ===== BATCHES =====
router.post('/batches', auth, createBatch);
router.get('/batches', auth, getBatches);
router.put('/batches/:id', auth, updateBatch);
router.delete('/batches/:id', auth, deleteBatch);

// ===== RECORDS =====
router.post('/records/dispense', auth, createDispenseRecord);
router.get('/records', auth, getRecords);
router.get('/records/:id', auth, getRecordById);

// ===== PRESCRIPTIONS =====
router.get('/pending-prescriptions', auth, getPendingPrescriptions);
router.get('/prescriptions', auth, getPrescriptions);
router.delete('/prescriptions/:id', auth, deletePrescription);
router.post('/prescriptions/create-from-intake', auth, intakeDispenseController.createFromIntake);
router.post('/prescriptions/:intakeId/dispense', auth, intakeDispenseController.dispenseFromIntake);
router.get('/prescriptions/:intakeId/pdf', auth, intakeDispenseController.getPrescriptionPdf);

// ===== ADMIN =====
router.get('/admin/analytics', auth, getAnalytics);
router.get('/admin/low-stock', auth, getLowStock);
router.get('/admin/expiring-batches', auth, getExpiringBatches);
router.post('/admin/bulk-import', auth, bulkImport);
router.get('/admin/inventory-report', auth, getInventoryReport);

// ===== PATIENTS =====
router.get('/patients/:id', auth, patientController.getPatientPharmacyHistory);

module.exports = router;
