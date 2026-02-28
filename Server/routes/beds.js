// Server/routes/beds.js
// API routes for Bed Allocation & Occupancy module

const express = require('express');
const router = express.Router();
const Ward = require('../Models/Ward');
const Bed = require('../Models/Bed');
const Patient = require('../Models/Patient');
const auth = require('../Middleware/Auth');

/**
 * GET /api/beds
 * Return all beds grouped by ward, plus summary stats
 */
router.get('/', auth, async (req, res) => {
  try {
    const wards = await Ward.find({ deleted_at: null }).sort({ name: 1 }).lean();
    const beds = await Bed.find({ deleted_at: null }).sort({ label: 1 }).lean();

    // Group beds by ward
    const wardMap = {};
    for (const ward of wards) {
      wardMap[ward._id] = { ...ward, beds: [] };
    }
    for (const bed of beds) {
      if (wardMap[bed.ward]) wardMap[bed.ward].beds.push(bed);
    }

    const grouped = Object.values(wardMap);

    // Summary stats
    const totalBeds = beds.length;
    const available = beds.filter(b => b.status === 'AVAILABLE').length;
    const occupied = beds.filter(b => b.status === 'OCCUPIED').length;
    const cleaning = beds.filter(b => b.status === 'CLEANING').length;
    const occupancyRate = totalBeds > 0 ? ((occupied / totalBeds) * 100).toFixed(1) : '0.0';

    return res.status(200).json({
      success: true,
      data: {
        wards: grouped,
        summary: { totalBeds, available, occupied, cleaning, occupancyRate: parseFloat(occupancyRate) },
      },
    });
  } catch (err) {
    console.error('GET /api/beds error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch beds', error: err.message });
  }
});

/**
 * GET /api/beds/patients
 * Return list of patients for bed assignment dropdown
 */
router.get('/patients', auth, async (req, res) => {
  try {
    const q = req.query.q || '';
    const filter = { deleted_at: null };
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { patientCode: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }
    const patients = await Patient.find(filter)
      .select('firstName lastName patientCode phone gender age')
      .sort({ firstName: 1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, data: patients });
  } catch (err) {
    console.error('GET /api/beds/patients error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch patients', error: err.message });
  }
});

/**
 * PUT /api/beds/:id/assign
 * Assign a patient to a bed (AVAILABLE → OCCUPIED)
 * Body: { patientId, notes? }
 */
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed || bed.deleted_at) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }
    if (bed.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: 'Bed is not available for assignment' });
    }

    const { patientId, notes } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }

    const patient = await Patient.findById(patientId).select('firstName lastName patientCode').lean();
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    bed.status = 'OCCUPIED';
    bed.patientId = patient._id;
    bed.patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
    bed.notes = notes || '';
    await bed.save();

    return res.status(200).json({ success: true, data: bed.toJSON() });
  } catch (err) {
    console.error('PUT /api/beds/:id/assign error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to assign bed', error: err.message });
  }
});

/**
 * PUT /api/beds/:id/discharge
 * Discharge patient from bed (OCCUPIED → CLEANING)
 * Body: { reason? }
 */
router.put('/:id/discharge', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed || bed.deleted_at) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }
    if (bed.status !== 'OCCUPIED') {
      return res.status(400).json({ success: false, message: 'Bed is not occupied' });
    }

    const { reason } = req.body;
    bed.status = 'CLEANING';
    bed.dischargeReason = reason || '';
    bed.patientId = null;
    bed.patientName = null;
    await bed.save();

    return res.status(200).json({ success: true, data: bed.toJSON() });
  } catch (err) {
    console.error('PUT /api/beds/:id/discharge error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to discharge', error: err.message });
  }
});

/**
 * PUT /api/beds/:id/mark-available
 * Mark bed as available after cleaning (CLEANING → AVAILABLE)
 */
router.put('/:id/mark-available', auth, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed || bed.deleted_at) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }
    if (bed.status !== 'CLEANING') {
      return res.status(400).json({ success: false, message: 'Bed is not in cleaning state' });
    }

    bed.status = 'AVAILABLE';
    bed.patientId = null;
    bed.patientName = null;
    bed.notes = '';
    bed.dischargeReason = '';
    await bed.save();

    return res.status(200).json({ success: true, data: bed.toJSON() });
  } catch (err) {
    console.error('PUT /api/beds/:id/mark-available error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to mark available', error: err.message });
  }
});

module.exports = router;
