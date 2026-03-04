/**
 * pharmacy/patientController.js
 * Controller for patient pharmacy history
 */

const { PharmacyRecord } = require('../../Models');
const { requireAdminOrPharmacist } = require('./middleware');

/**
 * GET /patients/:id
 * Get patient pharmacy history
 */
async function getPatientPharmacyHistory(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Patient } = require('../../Models');
    const { id } = req.params;

    const patient = await Patient.findById(id).lean();
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const records = await PharmacyRecord.find({ patientId: id })
      .sort({ createdAt: -1 })
      .populate('dispensedBy', 'name email')
      .lean();

    return res.status(200).json({ 
      success: true, 
      patient: {
        id: patient._id,
        name: `${patient.firstName} ${patient.lastName || ''}`.trim(),
        phone: patient.phone
      },
      records 
    });
  } catch (err) {
    console.error('❌ [PATIENT PHARMACY HISTORY] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient history' });
  }
}

module.exports = {
  getPatientPharmacyHistory
};
