const express = require('express');
const mongoose = require('mongoose');
const { User, Patient, Appointment } = require('../Models'); // expects Mongoose models
const auth = require('../Middleware/Auth');
const { getNextSequence, formatCode } = require('../utils/sequence');
const router = express.Router();



// -----------------------------
// GET /doctors
// -----------------------------
router.get('/', auth, async (req, res) => {
  console.log('➡️ Incoming request to GET /doctors');
  console.log('Headers:', req.headers);
  console.log('Query Params:', req.query);
  console.log('User Info:', req.user);

  try {
    console.log('🔍 Fetching users with role=doctor from MongoDB...');

    const doctors = await User.find({ role: 'doctor' })
      .sort({ firstName: 1 })
      .lean();

    console.log(`✅ Found ${doctors.length} doctor documents`);

    const payload = doctors
      .filter(d => d && d.role === 'doctor')
      .map(d => {
        const specialization = (d.metadata && (d.metadata.specialization || d.metadata.speciality)) || null;
        const department = (d.metadata && d.metadata.department) || null;
        const name = `${(d.firstName || '').trim()} ${(d.lastName || '').trim()}`.trim();

        const doc = {
          id: d._id || d.id || null,
          name: name || (d.metadata && d.metadata.name) || '',
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || null,
          phone: d.phone || null,
          specialization,
          department,
          role: d.role || 'doctor',
        };

        console.log('📦 Doctor:', doc);
        return doc;
      });

    console.log('📤 Sending response with payload');
    return res.json(payload);
  } catch (err) {
    console.error('❌ GET /doctors error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      errorCode: 5006,
    });
  }
});

// -----------------------------
// GET /api/patients/my
// Returns patients for logged-in doctor, ensures unique patient code in metadata,
// and attaches lastVisitDate (ISO string or null) for each patient.
// -----------------------------
router.get('/patients/my', auth, async (req, res) => {
  console.log('📥 GET /patients/my by user:', req.user && req.user.id);
  try {
    const doctorId = req.user.id; // from JWT
    const role = req.user.role;

    if (role !== 'doctor') {
      console.warn('🚫 Forbidden: non-doctor attempted to fetch /patients/my', req.user);
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 4010 });
    }

    // fetch patients for doctor
    const patients = await Patient.find({ doctorId, deleted_at: null })
      .select('-__v')
      .lean();

    if (!patients || patients.length === 0) {
      console.log(`ℹ️ No patients found for doctor ${doctorId}`);
      return res.status(200).json({ success: true, patients: [] });
    }

    // Build list of patientIds and a map for quick access
    const patientIds = patients.map(p => p._id);

    // Compute lastVisitDate for all patients in one aggregation:
    const lastVisits = await Appointment.aggregate([
      { $match: { patientId: { $in: patientIds }, doctorId } },
      { $group: { _id: '$patientId', lastVisit: { $max: '$startAt' } } }
    ]);

    const lastVisitMap = {};
    for (const lv of lastVisits) {
      lastVisitMap[lv._id] = lv.lastVisit;
    }

    // Assign patientCode for those missing it; update DB per patient as needed
    for (const p of patients) {
      try {
        p.metadata = p.metadata || {};

        if (!p.patientCode && !p.metadata.patientCode) {
          const seq = await getNextSequence('patientCode');
          const code = formatCode('PAT', seq, 5);
          await Patient.updateOne(
            { _id: p._id },
            { $set: { patientCode: code, 'metadata.patientCode': code } }
          );
          p.patientCode = code;
          p.metadata.patientCode = code;
          console.log(`🔖 Assigned patientCode=${code} to patient ${p._id}`);
        } else if (!p.patientCode && p.metadata.patientCode) {
          // Sync metadata to root if root is missing
          const code = p.metadata.patientCode;
          await Patient.updateOne({ _id: p._id }, { $set: { patientCode: code } });
          p.patientCode = code;
        }
      } catch (err) {
        console.error('💥 Failed to generate/save patientCode for', p._id, err);
        if (!p.patientCode && !p.metadata.patientCode) {
          p.patientCode = `PAT-${String(p._id).slice(0, 6).toUpperCase()}`;
          p.metadata.patientCode = p.patientCode;
        }
      }

      p.patientCode = p.patientCode || p.metadata.patientCode;
      const lv = lastVisitMap[p._id];
      p.lastVisitDate = lv ? new Date(lv).toISOString() : null;
    }

    console.log(`✅ Returning ${patients.length} patients for doctor ${doctorId}`);
    return res.status(200).json({ success: true, patients });
  } catch (err) {
    console.error('💥 Error fetching doctor patients:', err);
    return res.status(500).json({ success: false, message: 'Server error', errorCode: 5000 });
  }
});

module.exports = router;
