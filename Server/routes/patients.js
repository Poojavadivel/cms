// routes/patients.js
const express = require('express');
const { Patient } = require('../Models');
const auth = require('../Middleware/Auth');
const router = express.Router();

// -------------------------
// CREATE Patient
// -------------------------
router.post('/', auth, async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.firstName || !data.phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, phone',
        errorCode: 3006,
      });
    }

    const payload = {
      firstName: data.firstName.trim(),
      lastName: (data.lastName || '').trim(),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      phone: data.phone,
      email: data.email || null,
      address: data.address || {},
      doctorId: data.doctorId || req.user.id || null,
      allergies: Array.isArray(data.allergies) ? data.allergies : [],
      prescriptions: Array.isArray(data.prescriptions) ? data.prescriptions : [],
      notes: data.notes || '',
      metadata: {
        ...(data.metadata || {}),
        age: data.age || null,
        bloodGroup: data.bloodGroup || null,
        insuranceNumber: data.insuranceNumber || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
      },
    };

    const created = await Patient.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('💥 [PATIENT CREATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create patient', errorCode: 5000 });
  }
});

// -------------------------
// LIST Patients (search + pagination)
// -------------------------
router.get('/', auth, async (req, res) => {
  try {
    // 🔍 Log raw query parameters
    console.log('\n==============================');
    console.log('📥 [PATIENT LIST] Incoming Request');
    console.log('Query Params:', req.query);
    console.log('Auth User:', req.user ? { id: req.user._id, email: req.user.email } : '❌ No user object');
    console.log('==============================\n');

    // Parse query params
    const q = (req.query.q || '').trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const wantMeta = String(req.query.meta || '') === '1';

    console.log(`📄 Query String: "${q}" | Page: ${page} | Limit: ${limit} | Meta: ${wantMeta}`);

    // Build filter
    const filter = { deleted_at: null };
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
        { email: regex },
        { 'address.city': regex },
        { 'metadata.bloodGroup': regex },
        { 'metadata.emergencyContactPhone': regex },
      ];
    }

    console.log('🧩 MongoDB Filter:', JSON.stringify(filter, null, 2));

    const skip = page * limit;

    console.log('⚙️ Pagination -> skip:', skip, '| limit:', limit);

    // Query database
    console.time('⏱️ [DB Query Time]');
    const [items, total] = await Promise.all([
      Patient.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ firstName: 1 })
        .populate('doctorId', 'firstName lastName email')
        .lean(),
      Patient.countDocuments(filter),
    ]);
    console.timeEnd('⏱️ [DB Query Time]');

    console.log(`📊 Query Result: Found ${items.length} patients (of ${total} total)`);

    // Enrich results
    const enriched = items.map(p => ({
      ...p,
      doctorName: p.doctorId ? `${p.doctorId.firstName} ${p.doctorId.lastName}`.trim() : '',
    }));

    // Optional metadata logging
    if (wantMeta) {
      console.log('🧾 Returning meta-enabled response');
      console.log({
        total,
        page,
        limit,
        count: enriched.length,
        firstItem: enriched[0]?.firstName || '(none)',
      });

      return res.status(200).json({
        success: true,
        patients: enriched,
        total,
        page,
        limit,
      });
    }

    // Standard response
    console.log('✅ Returning patient list (no meta)');
    console.log(`📤 Response count: ${enriched.length}`);

    return res.status(200).json(enriched);
  } catch (err) {
    console.error('❌ [PATIENT LIST] Error:', err.message);
    console.error('🔴 Stack Trace:', err.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      errorCode: 5001,
    });
  }
});


// -------------------------
// GET Patient by ID
// -------------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('doctorId', 'firstName lastName email')
      .lean();

    if (!patient || patient.deleted_at) {
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    // DEBUG: Log what we're sending to frontend
    console.log('📤 [PATIENT GET] Sending patient data:');
    console.log('   Patient ID:', patient._id);
    console.log('   Has vitals:', !!patient.vitals);
    if (patient.vitals) {
      console.log('   Vitals:', patient.vitals);
    }
    console.log('   Legacy fields - height:', patient.height, 'weight:', patient.weight, 'bmi:', patient.bmi);

    return res.status(200).json(patient);
  } catch (err) {
    console.error('❌ [PATIENT GET] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient', errorCode: 5002 });
  }
});

// -------------------------
// UPDATE Patient (full)
// -------------------------
router.put('/:id', auth, async (req, res) => {
  try {
    const data = req.body || {};

    const update = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      doctorId: data.doctorId,
      allergies: data.allergies,
      prescriptions: data.prescriptions,
      notes: data.notes,
      metadata: {
        ...(data.metadata || {}),
        age: data.age || null,
        bloodGroup: data.bloodGroup || null,
        insuranceNumber: data.insuranceNumber || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
      },
    };

    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

    const updated = await Patient.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('doctorId', 'firstName lastName email')
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('❌ [PATIENT UPDATE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update patient', errorCode: 5003 });
  }
});

// -------------------------
// PARTIAL UPDATE Patient (PATCH)
// -------------------------
router.patch('/:id', auth, async (req, res) => {
  try {
    const data = req.body || {};
    console.log('🔄 [PATIENT PATCH] Updating patient:', req.params.id, 'with:', data);

    // Build update object only with provided fields
    const update = {};
    
    if (data.firstName !== undefined) update.firstName = data.firstName;
    if (data.lastName !== undefined) update.lastName = data.lastName;
    if (data.dateOfBirth !== undefined) update.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender !== undefined) update.gender = data.gender;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.email !== undefined) update.email = data.email;
    if (data.address !== undefined) update.address = data.address;
    if (data.doctorId !== undefined) update.doctorId = data.doctorId;
    if (data.allergies !== undefined) update.allergies = data.allergies;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.bloodGroup !== undefined) update.bloodGroup = data.bloodGroup;

    // Update metadata fields
    if (data.metadata !== undefined) {
      update.metadata = data.metadata;
    }

    // Remove undefined fields
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      console.warn('❌ [PATIENT PATCH] Patient not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    console.log('✅ [PATIENT PATCH] Patient updated successfully:', updated._id);
    return res.status(200).json({ success: true, patient: updated });
  } catch (err) {
    console.error('❌ [PATIENT PATCH] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update patient', errorCode: 5003 });
  }
});

// -------------------------
// SOFT DELETE Patient
// -------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Patient.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    return res.status(200).json({ success: true, message: 'Patient deleted successfully', deletedId: deleted._id });
  } catch (err) {
    console.error('❌ [PATIENT DELETE] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete patient', errorCode: 5005 });
  }
});

module.exports = router;
