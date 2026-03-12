/**
 * pharmacy/prescriptionController.js
 * Controller for prescription management
 */

const { requireAdminOrPharmacist } = require('./middleware');

/**
 * GET /pending-prescriptions
 * Get pending prescriptions from intake
 */
async function getPendingPrescriptions(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Intake } = require('../../Models');

    const intakes = await Intake.find({
      'meta.pharmacyItems': { $exists: true, $ne: [] },
      'meta.pharmacyId': { $exists: false }
    })
      .populate('patientId', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, intakes });
  } catch (err) {
    console.error('❌ [PENDING PRESCRIPTIONS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending prescriptions' });
  }
}

/**
 * GET /prescriptions
 * Get all prescriptions
 */
async function getPrescriptions(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Intake } = require('../../Models');

    const prescriptions = await Intake.find({
      'meta.pharmacyItems': { $exists: true, $ne: [] }
    })
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ success: true, prescriptions });
  } catch (err) {
    console.error('❌ [PRESCRIPTIONS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
}

/**
 * DELETE /prescriptions/:id
 * Delete prescription
 */
async function deletePrescription(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Intake } = require('../../Models');
    const { id } = req.params;

    const intake = await Intake.findByIdAndDelete(id);

    if (!intake) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    console.log('✅ [PRESCRIPTION DELETE] Deleted:', id);
    return res.status(200).json({ success: true, message: 'Prescription deleted' });
  } catch (err) {
    console.error('❌ [PRESCRIPTION DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete prescription' });
  }
}

module.exports = {
  getPendingPrescriptions,
  getPrescriptions,
  deletePrescription
};
