const express = require('express');
const { Patient } = require('../Models');
const auth = require('../Middleware/Auth');
const { getNextSequence, formatCode } = require('../utils/sequence');
const router = express.Router();

// -------------------------
// CREATE Patient
// -------------------------
router.post('/', auth, async (req, res) => {
  try {
    const data = req.body || {};
    console.log('📥 [PATIENT CREATE] Received data:', JSON.stringify(data, null, 2));

    if (!data.firstName || !data.phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, phone',
        errorCode: 3006,
      });
    }

    // Build address object (handle both structured and flat formats)
    const address = data.address && typeof data.address === 'object'
      ? data.address
      : {
        houseNo: data.houseNo || '',
        street: data.street || '',
        line1: data.address || '',
        city: data.city || '',
        district: data.district || '',
        state: data.state || '',
        pincode: data.pincode || '',
        country: data.country || '',
        lat: data.lat || '',
        lng: data.lng || '',
      };

    console.log('🏠 [PATIENT CREATE] Address object:', JSON.stringify(address, null, 2));

    // Build vitals object (handle both structured and flat formats)
    const vitals = data.vitals && typeof data.vitals === 'object'
      ? data.vitals
      : {
        heightCm: data.height ? parseFloat(data.height) : null,
        weightKg: data.weight ? parseFloat(data.weight) : null,
        bmi: data.bmi ? parseFloat(data.bmi) : null,
        bp: data.bp || null,
        temp: data.temp ? parseFloat(data.temp) : null,
        pulse: data.pulse ? parseInt(data.pulse) : null,
        spo2: data.oxygen ? parseFloat(data.oxygen) : (data.spo2 ? parseFloat(data.spo2) : null),
      };

    // Generate human-readable Patient Code (corrected numeric format: PAT-00001)
    const seq = await getNextSequence('patientCode');
    const patientCode = formatCode('PAT', seq, 5);

    const payload = {
      patientCode,
      firstName: data.firstName.trim(),
      lastName: (data.lastName || '').trim(),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender || null,
      phone: data.phone,
      email: data.email || null,

      // Address object
      address: address,

      // Vitals object
      vitals: vitals,

      doctorId: data.doctorId || req.user.id || null,
      allergies: Array.isArray(data.allergies) ? data.allergies : [],
      prescriptions: Array.isArray(data.prescriptions) ? data.prescriptions : [],
      notes: data.notes || '',

      // Metadata object (prioritize nested metadata, fallback to top-level)
      metadata: {
        patientCode: patientCode, // Store in both places for safety
        age: data.metadata?.age ?? data.age ?? null,
        bloodGroup: data.metadata?.bloodGroup ?? data.bloodGroup ?? null,
        insuranceNumber: data.metadata?.insuranceNumber ?? data.insuranceNumber ?? null,
        expiryDate: data.metadata?.expiryDate ?? data.expiryDate ?? null,
        emergencyContactName: data.metadata?.emergencyContactName ?? data.emergencyContactName ?? null,
        emergencyContactPhone: data.metadata?.emergencyContactPhone ?? data.emergencyContactPhone ?? null,
        avatarUrl: data.metadata?.avatarUrl ?? data.avatarUrl ?? null,
        medicalHistory: Array.isArray(data.metadata?.medicalHistory) ? data.metadata.medicalHistory : (Array.isArray(data.medicalHistory) ? data.medicalHistory : []),
      },
    };

    console.log('💾 [PATIENT CREATE] Storing payload:', JSON.stringify(payload, null, 2));

    const created = await Patient.create(payload);

    console.log('✅ [PATIENT CREATE] Success:', created._id);
    return res.status(201).json(created);
  } catch (err) {
    console.error('💥 [PATIENT CREATE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: err.message,
      errorCode: 5000
    });
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

    // ✅ REMOVED: Doctor filtering - Now doctors can see ALL patients
    // if (req.user && req.user.role === 'doctor') {
    //   filter.doctorId = req.user.id;
    // }

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
        { patientCode: regex },
        { 'metadata.patientCode': regex }
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
        .populate('doctorId', 'firstName lastName email phone gender role department designation')
        .lean(),
      Patient.countDocuments(filter),
    ]);
    console.timeEnd('⏱️ [DB Query Time]');

    console.log(`📊 Query Result: Found ${items.length} patients (of ${total} total)`);

    // Log first item's doctor population for debugging
    if (items.length > 0 && items[0].doctorId) {
      console.log('👨‍⚕️ First patient doctor:', JSON.stringify(items[0].doctorId, null, 2));
    }

    // Enrich results and ensure every patient has a "CORRECT" numeric patientCode
    // We do this in a loop to assign codes to legacy data on the fly
    const enriched = await Promise.all(items.map(async (p) => {
      let code = p.patientCode || p.metadata?.patientCode;

      // If code is missing or not in a "clean" numeric format (like those PAT-SLICE fallbacks), assign a new one
      const isClean = code && /^PAT-\d{5}$/.test(code);

      if (!isClean) {
        try {
          const seq = await getNextSequence('patientCode');
          code = formatCode('PAT', seq, 5);

          // Update database in the background (no await here to keep response fast)
          // but we use the new code for the current response
          Patient.updateOne(
            { _id: p._id },
            { $set: { patientCode: code, 'metadata.patientCode': code } }
          ).catch(e => console.error('Failed to sync patientCode:', e));

          console.log(`✅ [SYNC] Assigned correct numeric code ${code} to patient ${p._id}`);
        } catch (err) {
          console.error('Failed to generate code during list sync:', err);
          code = code || `PAT-${String(p._id).slice(0, 6).toUpperCase()}`;
        }
      }

      return {
        ...p,
        patientCode: code,
        doctor: p.doctorId, // ✅ Mirror doctorId to doctor field for frontend
        doctorName: p.doctorId ? `${p.doctorId.firstName} ${p.doctorId.lastName}`.trim() : '',
      };
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
      .populate('doctorId', 'firstName lastName email phone gender role department designation')
      .lean();

    if (!patient || patient.deleted_at) {
      return res.status(404).json({ success: false, message: 'Patient not found', errorCode: 3007 });
    }

    // Generate human-readable Patient Code if missing (numeric format PAT-00001)
    let code = patient.patientCode || patient.metadata?.patientCode;
    const isClean = code && /^PAT-\d{5}$/.test(code);

    if (!isClean) {
      try {
        const seq = await getNextSequence('patientCode');
        code = formatCode('PAT', seq, 5);
        await Patient.updateOne(
          { _id: patient._id },
          { $set: { patientCode: code, 'metadata.patientCode': code } }
        );
        patient.patientCode = code;
      } catch (err) {
        console.error('Failed to sync patientCode on single fetch:', err);
      }
    }

    // ✅ CRITICAL: Add doctor field mirroring doctorId for frontend compatibility
    const enrichedPatient = {
      ...patient,
      patientCode: code || patient.patientCode,
      doctor: patient.doctorId // Mirror doctorId to doctor field
    };

    // DEBUG: Log what we're sending to frontend
    console.log('📤 [PATIENT GET] Sending patient data:');
    console.log('   Patient ID:', enrichedPatient._id);
    console.log('   Name:', enrichedPatient.firstName, enrichedPatient.lastName);
    console.log('   Age:', enrichedPatient.age);
    console.log('   Gender:', enrichedPatient.gender);
    console.log('   Blood Group:', enrichedPatient.bloodGroup);
    console.log('   Doctor (populated):', enrichedPatient.doctor ? `${enrichedPatient.doctor.firstName} ${enrichedPatient.doctor.lastName}` : 'None');
    console.log('   Has metadata:', !!enrichedPatient.metadata);
    if (enrichedPatient.metadata) {
      console.log('   Metadata:', JSON.stringify(enrichedPatient.metadata, null, 2));
    }
    console.log('   Has vitals:', !!enrichedPatient.vitals);
    if (enrichedPatient.vitals) {
      console.log('   Vitals:', enrichedPatient.vitals);
    }
    console.log('   Legacy fields - height:', enrichedPatient.height, 'weight:', enrichedPatient.weight, 'bmi:', enrichedPatient.bmi);

    return res.status(200).json(enrichedPatient);
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
    console.log('🔄 [PATIENT UPDATE] ID:', req.params.id);
    console.log('📥 [PATIENT UPDATE] Data:', JSON.stringify(data, null, 2));

    // Build address object (handle both formats)
    let address = undefined;
    if (data.address !== undefined) {
      address = typeof data.address === 'object'
        ? data.address
        : {
          houseNo: data.houseNo || '',
          street: data.street || '',
          line1: data.address || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          pincode: data.pincode || '',
          country: data.country || '',
          lat: data.lat || '',
          lng: data.lng || '',
        };

      console.log('🏠 [PATIENT UPDATE] Address object:', JSON.stringify(address, null, 2));
    }

    // Build vitals object (handle both formats)
    let vitals = undefined;
    if (data.vitals !== undefined || data.height !== undefined || data.weight !== undefined) {
      vitals = data.vitals && typeof data.vitals === 'object'
        ? data.vitals
        : {
          heightCm: data.height ? parseFloat(data.height) : undefined,
          weightKg: data.weight ? parseFloat(data.weight) : undefined,
          bmi: data.bmi ? parseFloat(data.bmi) : undefined,
          bp: data.bp || undefined,
          temp: data.temp ? parseFloat(data.temp) : undefined,
          pulse: data.pulse ? parseInt(data.pulse) : undefined,
          spo2: data.oxygen ? parseFloat(data.oxygen) : (data.spo2 ? parseFloat(data.spo2) : undefined),
        };

      // Remove undefined fields from vitals
      if (vitals) {
        Object.keys(vitals).forEach(k => vitals[k] === undefined && delete vitals[k]);
      }
    }

    const update = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      age: data.age || data.metadata?.age || undefined,               // ✅ Save to root level
      gender: data.gender,
      bloodGroup: data.bloodGroup || data.metadata?.bloodGroup || undefined,  // ✅ Save to root level
      phone: data.phone,
      email: data.email,

      // Address object
      address: address,

      // Vitals object
      vitals: vitals,

      doctorId: data.doctorId,
      allergies: data.allergies,
      prescriptions: data.prescriptions,
      notes: data.notes,

      // Metadata object (keep for backward compatibility)
      metadata: {
        ...(data.metadata || {}),
        patientCode: data.patientCode || data.metadata?.patientCode // Ensure patientCode is preserved in metadata
      }
    };

    // --- CRITICAL: Protect patientCode from being changed during update ---
    // Fetch existing patient to get current code
    const existingPatient = await Patient.findById(req.params.id).lean();
    if (existingPatient && existingPatient.patientCode) {
      update.patientCode = existingPatient.patientCode; // Always keep the original code
      if (update.metadata) {
        update.metadata.patientCode = existingPatient.patientCode;
      }
    } else if (existingPatient && existingPatient.metadata?.patientCode) {
      update.patientCode = existingPatient.metadata.patientCode;
      if (update.metadata) {
        update.metadata.patientCode = existingPatient.metadata.patientCode;
      }
    }
    // ----------------------------------------------------------------------

    // Remove undefined fields
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
    if (update.metadata) {
      Object.keys(update.metadata).forEach(k => update.metadata[k] === undefined && delete update.metadata[k]);
    }

    console.log('💾 [PATIENT UPDATE] Payload:', JSON.stringify(update, null, 2));

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    )
      .populate('doctorId', 'firstName lastName email phone gender role department designation')
      .lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        errorCode: 3007
      });
    }

    // ✅ CRITICAL: Add doctor field mirroring doctorId for frontend compatibility
    const enrichedPatient = {
      ...updated,
      doctor: updated.doctorId // Mirror doctorId to doctor field
    };

    console.log('✅ [PATIENT UPDATE] Success');
    return res.status(200).json(enrichedPatient);
  } catch (err) {
    console.error('❌ [PATIENT UPDATE] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: err.message,
      errorCode: 5003
    });
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

    // --- CRITICAL: Protect patientCode from being changed during patch ---
    delete update.patientCode;
    if (update.metadata) delete update.metadata.patientCode;
    // ---------------------------------------------------------------------

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
