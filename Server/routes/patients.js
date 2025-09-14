// routes/patients.js
const express = require('express');
const { Patient } = require('../Models/models'); // expects Patient in combined models export
const auth = require('../Middleware/Auth');
const router = express.Router();
const { User } = require('../Models/models');


// optional admin check helper (adjust to your req.user)
function requireAdmin(req, res) {
  const role = req.user && req.user.role;
  if (!role || (role !== 'admin' && role !== 'superadmin')) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: admin role required',
      errorCode: 3002,
    });
    return false;
  }
  return true;
}

// small util helpers
const maybeNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
};
const toNumberOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// ===============================
// CREATE Patient
// POST /api/patients
// Returns: created patient object (plain) so frontend.createPatient can parse it directly.
// ===============================
router.post('/', auth, async (req, res) => {
  console.log('📩 [PATIENT CREATE] payload:', JSON.stringify(req.body, null, 2));
  try {
    // if (!requireAdmin(req, res)) return; // enable if needed

    const data = req.body || {};

    // minimal validation
    if (!data.name || !data.phone) {
      console.warn('⚠️ [PATIENT CREATE] Missing required fields', { name: !!data.name, phone: !!data.phone });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone',
        errorCode: 3006,
      });
    }

    // Derive firstName / lastName if not provided
    let firstName = (data.firstName || '').toString().trim();
    let lastName = (data.lastName || '').toString().trim();
    if (!firstName && !lastName) {
      const parts = (data.name || '').toString().trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) {
        firstName = '';
        lastName = '';
      } else if (parts.length === 1) {
        firstName = parts[0];
        lastName = '';
      } else {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
    }

    // doctorId is required in your schema - prefer provided, fallback to request user id
    const doctorId = data.doctorId || req.user?.id || null;
    if (!doctorId) {
      console.warn('⚠️ [PATIENT CREATE] Missing doctorId (required by schema).');
      return res.status(400).json({
        success: false,
        message: 'doctorId is required',
        errorCode: 3009,
      });
    }

    const payload = {
      name: data.name,
      firstName: maybeNull(firstName) ?? '',
      lastName: maybeNull(lastName) ?? '',
      phone: data.phone,
      email: maybeNull(data.email) || undefined,
      dateOfBirth: maybeNull(data.dateOfBirth) || undefined,
      gender: maybeNull(data.gender) || undefined,
      age: toNumberOrNull(data.age),
      bloodGroup: maybeNull(data.bloodGroup) || undefined,
      weight: maybeNull(data.weight) || undefined,
      height: maybeNull(data.height) || undefined,
      emergencyContactName: maybeNull(data.emergencyContactName) || undefined,
      emergencyContactPhone: maybeNull(data.emergencyContactPhone) || undefined,
      address: data.address || undefined,
      city: maybeNull(data.city) || undefined,
      pincode: maybeNull(data.pincode) || undefined,
      insuranceNumber: maybeNull(data.insuranceNumber) || undefined,
      expiryDate: maybeNull(data.expiryDate) || undefined,
      avatarUrl: maybeNull(data.avatarUrl) || undefined,
      doctorId,
      medicalHistory: Array.isArray(data.medicalHistory) ? data.medicalHistory : (data.medicalHistory ? [data.medicalHistory] : []),
      allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : []),
      prescriptions: Array.isArray(data.prescriptions) ? data.prescriptions : [],
      labReports: Array.isArray(data.labReports) ? data.labReports : [],
      notes: data.notes || undefined,
      status: data.status || 'active',
    };

    const created = await Patient.create(payload);
    console.log('✅ [PATIENT CREATE] created:', created._id);

    // Return plain created document (frontend will accept this)
    return res.status(201).json(created);
  } catch (err) {
    console.error('💥 [PATIENT CREATE] Error:', err);

    if (err && err.code === 11000) {
      const dupFields = Object.keys(err.keyValue || {}).join(', ');
      return res.status(409).json({
        success: false,
        message: `Duplicate key: ${dupFields}`,
        errorCode: 4001,
        detail: err.keyValue,
      });
    }

    if (err && err.name === 'ValidationError') {
      const details = {};
      for (const k in err.errors) {
        if (Object.prototype.hasOwnProperty.call(err.errors, k)) {
          details[k] = err.errors[k].message || err.errors[k].kind || String(err.errors[k]);
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed while creating patient',
        errorCode: 4000,
        validation: details,
      });
    }

    return res.status(500).json({ success: false, message: 'Failed to create patient', errorCode: 5000 });
  }
});

// ===============================
// LIST Patients (search + pagination)
// GET /api/patients
// Query params: q, page, limit, status, meta=1 -> wrapper
// Default: returns plain array (so frontend.fetchPatients which accepts List works).
// ===============================
// at top of your file (if not already imported)
const { Pool } = require('pg');

// create a pool (or import an existing one from your db module)
  

router.get('/', auth, async (req, res) => {
  try {
    console.log('📥 [PATIENT LIST] query:', req.query);

    const q = (req.query.q || '').toString().trim();
    const page = Math.max(0, parseInt(req.query.page ?? '0', 10) || 0);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50));
    const status = (req.query.status || '').toString().trim();
    const wantMeta = String(req.query.meta || '').trim() === '1';

    const filter = {};
    if (status) filter.status = status;
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
        { emergencyContactPhone: regex },
        { insuranceNumber: regex },
        { 'address.city': regex },
      ];
    }

    const skip = page * limit;

    // --- Step 1: fetch patients from Mongo ---
    const [items, total] = await Promise.all([
      Patient.find(filter).skip(skip).limit(limit).sort({ name: 1 }).lean(),
      Patient.countDocuments(filter),
    ]);

    // --- Step 2: extract doctorIds ---
    const doctorIds = [...new Set(items.map(p => p.doctorId).filter(Boolean))];

    // --- Step 3: fetch doctors from Postgres ---
    const doctorMap = {};
    if (doctorIds.length > 0) {
      const doctors = await User.findAll({
        where: {
          id: doctorIds,
          role: 'doctor',
        },
        attributes: ['id', 'firstName', 'lastName', 'specialization'],
      });

      doctors.forEach(doc => {
        doctorMap[doc.id] = {
          id: doc.id,
          name: `${doc.firstName} ${doc.lastName}`,
          specialization: doc.specialization || '',
        };
      });
    }

    // --- Step 4: merge doctor info into patients ---
    const enrichedPatients = items.map(p => {
      const doctor = doctorMap[p.doctorId];
      return {
        ...p,
        doctorName: doctor ? doctor.name : '',
        doctorSpecialization: doctor ? doctor.specialization : '',
      };
    });

    if (wantMeta) {
      return res.status(200).json({
        success: true,
        patients: enrichedPatients,
        total,
        page,
        limit,
      });
    }

    return res.status(200).json(enrichedPatients);
  } catch (err) {
    console.error('❌ [PATIENT LIST] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      errorCode: 5001,
    });
  }
});



// ===============================
// GET Patient by ID
// GET /api/patients/:id
// Default: returns plain patient object (frontend.fetchPatientById accepts this).
// Use ?meta=1 for wrapper { success, patient }.
// ===============================
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('🔎 [PATIENT GET] id:', req.params.id);
    const wantMeta = String(req.query.meta || '').trim() === '1';
    const patient = await Patient.findById(req.params.id).lean();

    if (!patient) {
      console.warn('⚠️ [PATIENT GET] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    if (wantMeta) return res.status(200).json({ success: true, patient });

    return res.status(200).json(patient);
  } catch (err) {
    console.error('❌ [PATIENT GET] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient', errorCode: 5002 });
  }
});

// ===============================
// UPDATE Patient (full)
// PUT /api/patients/:id
// Returns updated patient object (plain).
// ===============================
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('✏️ [PATIENT UPDATE] id:', req.params.id, 'payload:', JSON.stringify(req.body, null, 2));
    // if (!requireAdmin(req, res)) return;

    const data = req.body || {};

    let firstName = data.firstName ?? undefined;
    let lastName = data.lastName ?? undefined;
    if (!firstName && !lastName && data.name) {
      const parts = (data.name || '').toString().trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        firstName = parts[0];
        lastName = '';
      } else if (parts.length > 1) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
    }

    const update = {
      name: data.name !== undefined ? data.name : undefined,
      firstName: firstName !== undefined ? firstName : undefined,
      lastName: lastName !== undefined ? lastName : undefined,
      age: data.age !== undefined ? toNumberOrNull(data.age) : undefined,
      gender: data.gender !== undefined ? data.gender : undefined,
      bloodGroup: data.bloodGroup !== undefined ? data.bloodGroup : undefined,
      weight: data.weight !== undefined ? data.weight : undefined,
      height: data.height !== undefined ? data.height : undefined,
      emergencyContactName: data.emergencyContactName !== undefined ? data.emergencyContactName : undefined,
      emergencyContactPhone: data.emergencyContactPhone !== undefined ? data.emergencyContactPhone : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      email: data.email !== undefined ? data.email : undefined,
      address: data.address !== undefined ? data.address : undefined,
      city: data.city !== undefined ? data.city : undefined,
      pincode: data.pincode !== undefined ? data.pincode : undefined,
      insuranceNumber: data.insuranceNumber !== undefined ? data.insuranceNumber : undefined,
      expiryDate: data.expiryDate !== undefined ? data.expiryDate : undefined,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
      dateOfBirth: data.dateOfBirth !== undefined ? data.dateOfBirth : undefined,
      lastVisitDate: data.lastVisitDate !== undefined ? data.lastVisitDate : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
      status: data.status !== undefined ? data.status : undefined,
      updatedAt: Date.now(),
    };

    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const updated = await Patient.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!updated) {
      console.warn('⚠️ [PATIENT UPDATE] Not found after update:', req.params.id);
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    console.log('✅ [PATIENT UPDATE] updated:', updated._id);
    // return plain updated patient
    return res.status(200).json(updated);
  } catch (err) {
    console.error('❌ [PATIENT UPDATE] Error:', err);

    if (err && err.name === 'ValidationError') {
      const details = {};
      for (const k in err.errors) {
        if (Object.prototype.hasOwnProperty.call(err.errors, k)) {
          details[k] = err.errors[k].message || err.errors[k].kind || String(err.errors[k]);
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed while updating patient',
        errorCode: 4002,
        validation: details,
      });
    }

    return res.status(500).json({ success: false, message: 'Failed to update patient', errorCode: 5003 });
  }
});

// ===============================
// PATCH status (optional)
// PATCH /api/patients/:id/status
// Returns updated patient object (plain).
// ===============================
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required', errorCode: 3008 });
    }

    const patient = await Patient.findByIdAndUpdate(req.params.id, { status, updatedAt: Date.now() }, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });

    return res.status(200).json(patient);
  } catch (err) {
    console.error('❌ [PATIENT STATUS] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update patient status', errorCode: 5004 });
  }
});

// ===============================
// DELETE Patient
// DELETE /api/patients/:id
// Returns wrapper with deletedId (frontend supports this).
// ===============================
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ [PATIENT DELETE] id:', req.params.id);
    const deleted = await Patient.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.warn('⚠️ [PATIENT DELETE] Not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    return res.status(200).json({ success: true, message: 'Patient deleted successfully', deletedId: deleted._id });
  } catch (err) {
    console.error('❌ [PATIENT DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete patient', errorCode: 5005 });
  }
});

// router.get('/doctors',auth, async (req, res) => {
//   console.log('➡️ Incoming request to /doctors');
//   console.log('Headers:', req.headers);
//   console.log('Query Params:', req.query);

//   try {
//     console.log('🔍 Fetching doctors from database...');
//     const doctors = await User.findAll({
//       where: { role: 'doctor' },
//       attributes: ['id', 'firstName', 'lastName', 'specialization', 'department'],
//       order: [['firstName', 'ASC']],
//     });

//     console.log(`✅ Found ${doctors.length} doctors`);

//     const payload = doctors.map(d => ({
//       id: d.id,
//       name: `${d.firstName} ${d.lastName}`.trim(),
//       firstName: d.firstName,
//       lastName: d.lastName,
//       specialization: d.specialization || null,
//       department: d.department || null,
//     }));

//     console.log('📦 Sending response payload');
//     return res.json(payload);
//   } catch (err) {
//     console.error('❌ GET /doctors error:', err);
//     return res.status(500).json({ error: 'Failed to fetch doctors' });
//   }
// });


module.exports = router;
