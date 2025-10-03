// routes/intake.js
const express = require('express');
const { Patient, Appointment, Intake, PharmacyRecord, LabReport, User } = require('../Models/models');
const auth = require('../Middleware/Auth'); // full middleware preferred
const router = express.Router();

/**
 * Helper: admin check
 */
function isAdminRole(role) {
  return role === 'admin' || role === 'superadmin';
}

/**
 * Normalize doctor display name
 */
function _normalizeDoctorName(docObj) {
  if (!docObj) return '';
  if (typeof docObj === 'string' && docObj.trim()) return docObj;
  if (typeof docObj.name === 'string' && docObj.name.trim()) return docObj.name.trim();
  const first = (docObj.firstName || '').toString().trim();
  const last = (docObj.lastName || '').toString().trim();
  if (first || last) return `${first} ${last}`.trim();
  if (docObj.email) return docObj.email.toString();
  return docObj._id ? docObj._id.toString() : '';
}

/**
 * Resolve patient by a flexible param (UUID _id, phone, email, or patient-specific id fields)
 * Returns { patient, by }
 */
async function resolvePatientByParam(param) {
  if (!param) return { patient: null, by: null };
  const s = String(param).trim();
  if (!s) return { patient: null, by: null };

  // 1) try _id (string match)
  try {
    const byId = await Patient.findById(s).lean();
    if (byId) return { patient: byId, by: '_id' };
  } catch (e) { /* ignore */ }

  // 2) try phone
  try {
    const byPhone = await Patient.findOne({ phone: s }).lean();
    if (byPhone) return { patient: byPhone, by: 'phone' };
  } catch (e) { /* ignore */ }

  // 3) try email
  try {
    const byEmail = await Patient.findOne({ email: s.toLowerCase() }).lean();
    if (byEmail) return { patient: byEmail, by: 'email' };
  } catch (e) { /* ignore */ }

  // 4) try metadata fields (legacy)
  try {
    const byLegacy = await Patient.findOne({ 'metadata.legacyId': s }).lean();
    if (byLegacy) return { patient: byLegacy, by: 'legacyId' };
  } catch (e) { /* ignore */ }

  return { patient: null, by: null };
}

/**
 * POST /api/patients/:id/intake
 * Creates intake snapshot (Intake collection in models_core) and optionally pharmacy / lab records.
 */
router.post('/:id/intake', auth, async (req, res) => {
  try {
    const user = req.user;
    const role = user?.role;
    const userId = user?.id;
    const isAdmin = isAdminRole(role);

    const idParam = req.params.id;
    if (!idParam || !String(idParam).trim()) {
      return res.status(400).json({ success: false, message: 'id (param) is required', errorCode: 10010 });
    }

    const data = req.body || {};

    // body must include some patient reference or appointment fallback; we'll allow data.patientId but we also try to resolve idParam
    if (!data.patientId && !data.patientSnapshot && !idParam) {
      return res.status(400).json({ success: false, message: 'patientId or patientSnapshot required', errorCode: 10011 });
    }

    // try resolve patient using idParam
    let { patient, by } = await resolvePatientByParam(idParam);
    let appointmentForFallback = null;
    let usingAppointmentFallback = false;

    // If no patient found by param, try appointment lookup (appointment id could be passed as param)
    if (!patient) {
      // Appointment ids are strings in models_core; try by _id or appointmentId fields
      appointmentForFallback = await Appointment.findById(String(idParam)).lean().catch(() => null);
      if (!appointmentForFallback) {
        // try appointmentId field or fallback _id again
        appointmentForFallback = await Appointment.findOne({ appointmentId: String(idParam) }).lean().catch(() => null);
      }

      if (appointmentForFallback) {
        // if appointment has patientId, try to resolve that patient too
        if (appointmentForFallback.patientId) {
          const resolved = await resolvePatientByParam(String(appointmentForFallback.patientId));
          if (resolved.patient) {
            patient = resolved.patient;
            by = `appointment.patientId:${resolved.by}`;
          } else {
            usingAppointmentFallback = true;
          }
        } else {
          usingAppointmentFallback = true;
        }
      }
    }

    // If still no patient and no appointment fallback but request provided data.patientId, try that
    if (!patient && data.patientId) {
      const resolved = await resolvePatientByParam(String(data.patientId));
      if (resolved.patient) {
        patient = resolved.patient;
        by = `body.patientId:${resolved.by}`;
      }
    }

    // Build patientSnapshot (immutable) — if patient exists prefer that, else use body.patientSnapshot or minimal fallback from appointment/body
    const patientSnapshot = {
      firstName: '',
      lastName: '',
      dateOfBirth: null,
      gender: null,
      phone: null,
      email: null,
    };

    if (patient) {
      patientSnapshot.firstName = patient.firstName || '';
      patientSnapshot.lastName = patient.lastName || '';
      patientSnapshot.dateOfBirth = patient.dateOfBirth || null;
      patientSnapshot.gender = patient.gender || null;
      patientSnapshot.phone = patient.phone || null;
      patientSnapshot.email = patient.email || null;
    } else if (data.patientSnapshot) {
      // accept provided snapshot (ensure firstName exists)
      patientSnapshot.firstName = data.patientSnapshot.firstName || data.patientSnapshot.first_name || '';
      patientSnapshot.lastName = data.patientSnapshot.lastName || data.patientSnapshot.last_name || '';
      patientSnapshot.dateOfBirth = data.patientSnapshot.dateOfBirth ? new Date(data.patientSnapshot.dateOfBirth) : (data.patientSnapshot.dob ? new Date(data.patientSnapshot.dob) : null);
      patientSnapshot.gender = data.patientSnapshot.gender || null;
      patientSnapshot.phone = data.patientSnapshot.phone || null;
      patientSnapshot.email = data.patientSnapshot.email || null;
    } else if (usingAppointmentFallback && appointmentForFallback) {
      patientSnapshot.firstName = appointmentForFallback.clientName || appointmentForFallback.name || '';
      patientSnapshot.phone = appointmentForFallback.phoneNumber || '';
    } else {
      // As IntakeSchema requires patientSnapshot.firstName to be present, ensure it's set
      patientSnapshot.firstName = (data.patientName || data.patientSnapshot?.firstName || '').toString().trim();
    }

    if (!patientSnapshot.firstName || patientSnapshot.firstName.trim() === '') {
      return res.status(400).json({ success: false, message: 'patientSnapshot.firstName is required (patient resolution failed)', errorCode: 10012 });
    }

    // Determine resolvedPatientId (string) if available
    const resolvedPatientId = patient ? String(patient._id) : (data.patientId ? String(data.patientId) : (appointmentForFallback && appointmentForFallback.patientId ? String(appointmentForFallback.patientId) : null));

    // Determine doctorId: admin may pass doctorId, otherwise logged-in user
    const doctorIdFromBody = data.doctorId;
    const doctorId = (isAdmin && doctorIdFromBody && String(doctorIdFromBody).trim()) ? String(doctorIdFromBody) : String(userId);

    // Build intake document matching models_core Intake schema
    const intakePayload = {
      patientId: resolvedPatientId || null, // can be null, patientSnapshot remains mandatory
      patientSnapshot: {
        firstName: (patientSnapshot.firstName || '').toString(),
        lastName: (patientSnapshot.lastName || '').toString(),
        dateOfBirth: patientSnapshot.dateOfBirth || null,
        gender: patientSnapshot.gender || null,
        phone: patientSnapshot.phone || null,
        email: patientSnapshot.email || null,
      },
      doctorId,
      appointmentId: data.appointmentId || (appointmentForFallback ? String(appointmentForFallback._id) : null),
      triage: {
        chiefComplaint: data.chiefComplaint || (data.meta && data.meta.chiefComplaint) || '',
        vitals: {
          bp: data.vitals?.bp || data.vitals?.BP || '',
          temp: data.vitals?.temp || data.vitals?.temperature || null,
          pulse: data.vitals?.pulse || data.vitals?.heartRate || null,
          spo2: data.vitals?.spo2 || data.vitals?.oxygen || null,
          weightKg: data.vitals?.weightKg || data.vitals?.weight_kg || null,
          heightCm: data.vitals?.heightCm || data.vitals?.height_cm || null,
        },
        priority: data.priority || 'Normal',
        triageCategory: data.triageCategory || 'Green',
      },
      consent: {
        consentGiven: data.consent?.consentGiven ?? false,
        consentAt: data.consent?.consentAt ? new Date(data.consent.consentAt) : (data.consentAt ? new Date(data.consentAt) : null),
        consentBy: data.consent?.consentBy || 'digital',
        consentFileId: data.consent?.consentFileId || null,
      },
      insurance: {
        hasInsurance: data.insurance?.hasInsurance ?? false,
        payer: data.insurance?.payer || '',
        policyNumber: data.insurance?.policyNumber || '',
        coverageMeta: data.insurance?.coverageMeta || {},
      },
      attachments: Array.isArray(data.attachments) ? data.attachments : [],
      notes: data.notes || data.currentNotes || '',
      meta: data.meta || {},
      status: data.status || 'New',
      createdBy: userId,
      convertedAt: null,
      convertedBy: null,
    };

    // Create pharmacy record if medicines provided
    let pharmacyRecord = null;
    if (Array.isArray(data.pharmacy) && data.pharmacy.length > 0) {
      // Map incoming pharmacy rows to PharmacyRecord.items
      const items = data.pharmacy.map(r => {
        return {
          medicineId: r.medicineId || r.medicine_id || r.MedicineId || null,
          batchId: r.batchId || null,
          sku: r.sku || r.SKU || null,
          name: r.name || r.Medicine || '',
          quantity: Number(r.quantity ?? r.Qty ?? 0),
          unitPrice: Number(r.unitPrice ?? r.price ?? 0),
          taxPercent: Number(r.taxPercent ?? 0),
          lineTotal: Number((r.quantity ?? 0) * (r.unitPrice ?? 0)),
          metadata: r.meta || {},
        };
      });

      const prPayload = {
        type: 'Dispense',
        patientId: intakePayload.patientId || null,
        appointmentId: intakePayload.appointmentId || null,
        createdBy: userId,
        items,
        total: items.reduce((s, it) => s + (Number(it.lineTotal || 0)), 0),
        paid: data.paid ?? false,
        paymentMethod: data.paymentMethod || null,
        notes: data.pharmacyNotes || intakePayload.notes || null,
        metadata: data.pharmacyMeta || {},
      };

      pharmacyRecord = await PharmacyRecord.create(prPayload);
      intakePayload.attachments = intakePayload.attachments || [];
      // To keep compatible with your previous shape, store pharmacy id in meta or attachments? We'll set meta.pharmacyId.
      intakePayload.meta = intakePayload.meta || {};
      intakePayload.meta.pharmacyId = String(pharmacyRecord._id);
    }

    // Create lab reports (Pathology) if provided
    const createdLabReportIds = [];
    if (Array.isArray(data.pathology) && data.pathology.length > 0) {
      for (const row of data.pathology) {
        try {
          const lrPayload = {
            patientId: intakePayload.patientId || null,
            appointmentId: intakePayload.appointmentId || null,
            testType: row.testType || row.testName || row.name || '',
            results: row.results || {},
            fileRef: row.fileRef || null,
            uploadedBy: userId,
            metadata: row.meta || { priority: row.priority || 'Normal', notes: row.notes || '' },
          };
          const lr = await LabReport.create(lrPayload);
          createdLabReportIds.push(String(lr._id));
        } catch (err) {
          console.error('INTAKE: LabReport create error (continuing):', err && err.message ? err.message : err);
        }
      }
      if (createdLabReportIds.length) {
        intakePayload.meta = intakePayload.meta || {};
        intakePayload.meta.labReportIds = createdLabReportIds;
      }
    }

    // Save Intake (models_core.Intake)
    const savedIntake = await Intake.create(intakePayload);

    // Push prescription snapshot into patient.prescriptions if pharmacy record exists and patient exists
    if (pharmacyRecord && intakePayload.patientId) {
      try {
        const prescriptionSnapshot = {
          prescriptionId: undefined, // will be generated by patient schema when pushed (it's nested)
          appointmentId: intakePayload.appointmentId || null,
          doctorId,
          medicines: (pharmacyRecord.items || []).map(it => ({
            medicineId: it.medicineId || null,
            name: it.name || '',
            dosage: it.dosage || '',
            frequency: it.frequency || '',
            duration: it.duration || '',
            quantity: it.quantity || 0,
          })),
          notes: pharmacyRecord.notes || intakePayload.notes || '',
          issuedAt: pharmacyRecord.createdAt || new Date(),
        };

        // push to patient.prescriptions array
        await Patient.findByIdAndUpdate(String(intakePayload.patientId), {
          $push: { prescriptions: prescriptionSnapshot },
          $set: { updatedAt: new Date() },
        }).catch(err => {
          console.warn('INTAKE: pushing prescription to patient failed:', err && err.message ? err.message : err);
        });
      } catch (err) {
        console.warn('INTAKE: error while snapshotting prescription to patient:', err && err.message ? err.message : err);
      }
    }

    // Append notes into patient.notes and update updatedAt
    if (intakePayload.notes && intakePayload.notes.trim() && intakePayload.patientId) {
      try {
        const patientDoc = await Patient.findById(String(intakePayload.patientId));
        if (patientDoc) {
          const timePrefix = `[${new Date().toISOString()}]`;
          const appended = `${timePrefix} ${intakePayload.notes}\n\n${patientDoc.notes || ''}`;
          await Patient.findByIdAndUpdate(String(intakePayload.patientId), { $set: { notes: appended, updatedAt: new Date() } });
        }
      } catch (err) {
        console.warn('INTAKE: appending notes to patient failed:', err && err.message ? err.message : err);
      }
    }

    // Update appointment vitals if appointmentId provided
    let updatedAppointment = null;
    if (intakePayload.appointmentId) {
      try {
        const appt = await Appointment.findById(String(intakePayload.appointmentId));
        if (appt) {
          // Only allow doctor or admin to update appointment
          if (!isAdmin && String(appt.doctorId) !== String(userId)) {
            // skip update
            console.warn('INTAKE: skipping appointment vitals update; not owner and not admin');
          } else {
            appt.vitals = Object.assign({}, appt.vitals || {}, intakePayload.triage?.vitals || {});
            appt.updatedAt = new Date();
            await appt.save();
            updatedAppointment = await Appointment.findById(appt._id)
              .populate('patientId', 'firstName lastName phone email')
              .populate('doctorId', 'firstName lastName email')
              .lean();
          }
        }
      } catch (err) {
        console.warn('INTAKE: updating appointment vitals failed:', err && err.message ? err.message : err);
      }
    }

    // Prepare response: include intake, patient (fresh), pharmacy (if created), appointment (if updated)
    const freshPatient = intakePayload.patientId ? await Patient.findById(String(intakePayload.patientId)).lean().catch(() => null) : null;

    // attach doctor display string to appointment if present
    if (updatedAppointment && updatedAppointment.doctorId) {
      updatedAppointment.doctor = _normalizeDoctorName(updatedAppointment.doctorId);
    }

    return res.status(201).json({
      success: true,
      message: 'Intake recorded successfully',
      intake: savedIntake.toObject ? savedIntake.toObject() : savedIntake,
      patient: freshPatient,
      pharmacy: pharmacyRecord ? pharmacyRecord.toObject() : null,
      labReportIds: createdLabReportIds,
      appointment: updatedAppointment,
    });
  } catch (err) {
    console.error('INTAKE POST error:', err && err.message ? err.message : err, err && err.stack ? err.stack : '');
    return res.status(500).json({ success: false, message: 'Failed to record intake', errorCode: 5000, detail: err && err.message ? err.message : String(err) });
  }
});

/**
 * GET /api/patients/:id/intake
 * List intakes for a patient (supports pagination and optional date range)
 */
router.get('/:id/intake', auth, async (req, res) => {
  try {
    const user = req.user;
    const role = user?.role;
    const userId = user?.id;
    const isAdmin = isAdminRole(role);

    const patientParam = req.params.id;
    if (!patientParam || !String(patientParam).trim()) {
      return res.status(400).json({ success: false, message: 'patientId (param) is required', errorCode: 10020 });
    }

    const limit = Math.min(parseInt(req.query.limit || '20', 10), 200);
    const skip = Math.max(parseInt(req.query.skip || '0', 10), 0);
    const start = req.query.start ? new Date(req.query.start) : null;
    const end = req.query.end ? new Date(req.query.end) : null;

    // try to resolve param to patient id string; if not found, accept raw param (some intakes may store appointment fallback)
    const resolved = await resolvePatientByParam(patientParam);
    const patientId = resolved.patient ? String(resolved.patient._id) : String(patientParam);

    const q = { 'patientSnapshot.phone': { $exists: true } }; // base filter to keep shape consistent
    // We'll allow matches by intake.patientId equal to resolved patient id OR patientSnapshot phone matching param
    q.$or = [{ patientId: patientId }, { 'patientSnapshot.phone': patientParam }, { 'patientSnapshot.firstName': new RegExp(patientParam, 'i') }];

    if (start || end) {
      q.createdAt = {};
      if (start) q.createdAt.$gte = start;
      if (end) q.createdAt.$lte = end;
    }

    // If doctor, restrict to intakes for which doctorId === userId OR createdBy === userId
    if (!isAdmin) {
      q.$and = q.$and || [];
      q.$and.push({ $or: [{ doctorId: userId }, { createdBy: userId }] });
    }

    const [rows, total] = await Promise.all([
      Intake.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Intake.countDocuments(q),
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: rows.length,
      intakes: rows,
    });
  } catch (err) {
    console.error('INTAKE LIST error:', err && err.message ? err.message : err);
    return res.status(500).json({ success: false, message: 'Failed to fetch intakes', errorCode: 5001 });
  }
});

/**
 * GET /api/patients/:id/intake/:intakeId
 * Return a single intake with related resources
 */
router.get('/:id/intake/:intakeId', auth, async (req, res) => {
  try {
    const user = req.user;
    const role = user?.role;
    const userId = user?.id;
    const isAdmin = isAdminRole(role);

    const patientParam = req.params.id;
    const intakeId = req.params.intakeId;
    if (!patientParam || !String(patientParam).trim() || !intakeId || !String(intakeId).trim()) {
      return res.status(400).json({ success: false, message: 'patientId and intakeId are required', errorCode: 10030 });
    }

    const intake = await Intake.findById(String(intakeId)).lean();
    if (!intake) {
      return res.status(404).json({ success: false, message: 'Intake not found', errorCode: 10031 });
    }

    // verify intake belongs to patientParam (loose check: match patientId or patientSnapshot name/phone)
    const belongs =
      (intake.patientId && String(intake.patientId) === String(patientParam)) ||
      (intake.patientSnapshot && (String(intake.patientSnapshot.phone || '') === String(patientParam) || String(intake.patientSnapshot.firstName || '').toLowerCase() === String(patientParam).toLowerCase()));

    if (!belongs) {
      return res.status(404).json({ success: false, message: 'Intake not found for this patient', errorCode: 10031 });
    }

    // Authorization: doctors may view only their intakes (or createdBy)
    if (!isAdmin && String(intake.doctorId) !== String(userId) && String(intake.createdBy) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 10032 });
    }

    // fetch related resources
    const patient = intake.patientId ? await Patient.findById(String(intake.patientId)).lean().catch(() => null) : null;
    const pharmacyObj = intake.meta && intake.meta.pharmacyId ? await PharmacyRecord.findById(String(intake.meta.pharmacyId)).lean().catch(() => null) : null;
    const labReports = intake.meta && intake.meta.labReportIds && Array.isArray(intake.meta.labReportIds)
      ? await LabReport.find({ _id: { $in: intake.meta.labReportIds } }).lean().catch(() => [])
      : [];

    let appointmentObj = null;
    if (intake.appointmentId) {
      appointmentObj = await Appointment.findById(String(intake.appointmentId))
        .populate('patientId', 'firstName lastName phone email')
        .populate('doctorId', 'firstName lastName email')
        .lean()
        .catch(() => null);
      if (appointmentObj && appointmentObj.doctorId) {
        appointmentObj.doctor = _normalizeDoctorName(appointmentObj.doctorId);
      }
    }

    return res.status(200).json({
      success: true,
      intake,
      patient,
      pharmacy: pharmacyObj,
      labReports,
      appointment: appointmentObj,
    });
  } catch (err) {
    console.error('INTAKE GET single error:', err && err.message ? err.message : err);
    return res.status(500).json({ success: false, message: 'Failed to fetch intake', errorCode: 5002 });
  }
});

module.exports = router;
