/**
 * pharmacy/intakeDispenseController.js
 * Controller for intake-based prescription and dispensing
 */

const { PharmacyRecord, MedicineBatch } = require('../../Models');
const { requireAdminOrPharmacist } = require('./middleware');

/**
 * POST /prescriptions/create-from-intake
 * Create prescription from intake data
 */
async function createFromIntake(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Intake } = require('../../Models');
    const { intakeId, items } = req.body;

    const intake = await Intake.findById(intakeId);
    if (!intake) {
      return res.status(404).json({ success: false, message: 'Intake not found' });
    }

    intake.meta.pharmacyItems = items;
    await intake.save();

    console.log('✅ [PRESCRIPTION CREATE] Created from intake:', intakeId);
    return res.status(200).json({ success: true, intake });
  } catch (err) {
    console.error('❌ [PRESCRIPTION CREATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create prescription' });
  }
}

/**
 * POST /prescriptions/:intakeId/dispense
 * Dispense medicines from intake prescription
 */
async function dispenseFromIntake(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Intake } = require('../../Models');
    const { intakeId } = req.params;
    const { items, paymentMethod } = req.body;

    const intake = await Intake.findById(intakeId);
    if (!intake) {
      return res.status(404).json({ success: false, message: 'Intake not found' });
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.unitPrice || item.price || 0);
      return sum + (qty * price);
    }, 0);

    // Create pharmacy record
    const record = new PharmacyRecord({
      type: 'Dispense',
      patientId: intake.patientId,
      items,
      total,
      paymentMethod: paymentMethod || 'Cash',
      dispensedBy: req.user?.id,
      intakeId
    });

    await record.save();

    // Update batch quantities
    for (const item of items) {
      if (item.batchId) {
        await MedicineBatch.findByIdAndUpdate(
          item.batchId,
          { $inc: { quantity: -(item.quantity || item.qty || 1) } }
        );
      }
    }

    // Mark intake as dispensed
    intake.meta.pharmacyId = record._id;
    await intake.save();

    console.log('✅ [DISPENSE FROM INTAKE] Dispensed:', record._id);
    return res.status(201).json({ success: true, record });
  } catch (err) {
    console.error('❌ [DISPENSE FROM INTAKE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispense' });
  }
}

/**
 * GET /prescriptions/:intakeId/pdf
 * Get prescription PDF
 */
async function getPrescriptionPdf(req, res) {
  try {
    if (!requireAdminOrPharmacist(req, res)) return;

    const { Intake, Patient } = require('../../Models');
    const { intakeId } = req.params;

    const intake = await Intake.findById(intakeId).lean();
    if (!intake) {
      return res.status(404).json({ success: false, message: 'Intake not found' });
    }

    const patient = await Patient.findById(intake.patientId).lean();
    
    // Generate PDF (simplified version - you can enhance with proper PDF generation)
    const pdfData = {
      intake,
      patient,
      items: intake.meta?.pharmacyItems || []
    };

    return res.status(200).json({ 
      success: true, 
      message: 'PDF generation not fully implemented',
      data: pdfData 
    });
  } catch (err) {
    console.error('❌ [PRESCRIPTION PDF] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
}

module.exports = {
  createFromIntake,
  dispenseFromIntake,
  getPrescriptionPdf
};
