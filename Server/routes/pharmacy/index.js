// routes/pharmacy/index.js
// Main pharmacy routes aggregator
// Modularized pharmacy management system

const express = require('express');
const router = express.Router();

// Import sub-route modules
const summaryRoutes = require('./summary.routes');
const medicinesRoutes = require('./medicines.routes');
const batchesRoutes = require('./batches.routes');
const dispenseRoutes = require('./dispense.routes');
const prescriptionsRoutes = require('./prescriptions.routes');
const adminRoutes = require('./admin.routes');

/**
 * Route Mounting
 * Base URL: /api/pharmacy
 */

// Dashboard & Statistics
router.use('/summary', summaryRoutes);

// Medicine Management
router.use('/medicines', medicinesRoutes);

// Batch/Inventory Management
router.use('/batches', batchesRoutes);

// Dispensing Operations (with transactions)
router.use('/records', dispenseRoutes);

// Prescription Management
router.use('/prescriptions', prescriptionsRoutes);
router.use('/pending-prescriptions', prescriptionsRoutes); // Legacy alias

// Admin Operations
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'pharmacy',
    status: 'operational',
    routes: {
      summary: '/api/pharmacy/summary',
      medicines: '/api/pharmacy/medicines',
      batches: '/api/pharmacy/batches',
      records: '/api/pharmacy/records',
      prescriptions: '/api/pharmacy/prescriptions',
      admin: '/api/pharmacy/admin'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
