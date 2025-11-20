// routes/intake.js
const express = require('express');
const { Patient, Appointment, Intake, PharmacyRecord, LabReport, User } = require('../Models');
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

  console.log(`resolvePatientByParam: attempting to resolve "${s}"`);

  // 1) try _id (string match)
  try {
    const byId = await Patient.findById(s).lean();
    if (byId) {
      console.log(`resolvePatientByParam: resolved by _id -> ${byId._id}`);
      return { patient: byId, by: '_id' };
    }
  } catch (e) {
    console.warn('resolvePatientByParam: findById error (ignored)', e && e.message ? e.message : e);
  }

  // 2) try phone
  try {
    const byPhone = await Patient.findOne({ phone: s }).lean();
    if (byPhone) {
      console.log(`resolvePatientByParam: resolved by phone -> ${byPhone._id}`);
      return { patient: byPhone, by: 'phone' };
    }
  } catch (e) {
    console.warn('resolvePatientByParam: findOne(phone) error (ignored)', e && e.message ? e.message : e);
  }

  // 3) try email
  try {
    const byEmail = await Patient.findOne({ email: s.toLowerCase() }).lean();
    if (byEmail) {
      console.log(`resolvePatientByParam: resolved by email -> ${byEmail._id}`);
      return { patient: byEmail, by: 'email' };
    }
  } catch (e) {
    console.warn('resolvePatientByParam: findOne(email) error (ignored)', e && e.message ? e.message : e);
  }

  // 4) try metadata fields (legacy)
  try {
    const byLegacy = await Patient.findOne({ 'metadata.legacyId': s }).lean();
    if (byLegacy) {
      console.log(`resolvePatientByParam: resolved by legacyId -> ${byLegacy._id}`);
      return { patient: byLegacy, by: 'legacyId' };
    }
  } catch (e) {
    console.warn('resolvePatientByParam: findOne(metadata.legacyId) error (ignored)', e && e.message ? e.message : e);
  }

  console.log(`resolvePatientByParam: no patient found for "${s}"`);
  return { patient: null, by: null };
}

/**
 * POST /api/patients/:id/intake
 * Creates intake snapshot (Intake collection in models_core) and optionally pharmacy / lab records.
 */
router.post('/:id/intake', auth, async (req, res) => {
  console.log('INTAKE POST: entry', { params: req.params, user: req.user ? { id: req.user.id, role: req.user.role } : null });
  try {
    const user = req.user;
    const role = user?.role;
    const userId = user?.id;
    const isAdmin = isAdminRole(role);

    const idParam = req.params.id;
    if (!idParam || !String(idParam).trim()) {
      console.log('INTAKE POST: missing id param');
      return res.status(400).json({ success: false, message: 'id (param) is required', errorCode: 10010 });
    }

    const data = req.body || {};
    console.log('INTAKE POST: body received (keys):', Object.keys(data));

    // body must include some patient reference or appointment fallback; we'll allow data.patientId but we also try to resolve idParam
    if (!data.patientId && !data.patientSnapshot && !idParam) {
      console.log('INTAKE POST: missing patient reference in body and params');
      return res.status(400).json({ success: false, message: 'patientId or patientSnapshot required', errorCode: 10011 });
    }

    // try resolve patient using idParam
    let { patient, by } = await resolvePatientByParam(idParam);
    let appointmentForFallback = null;
    let usingAppointmentFallback = false;

    // If no patient found by param, try appointment lookup (appointment id could be passed as param)
    if (!patient) {
      console.log(`INTAKE POST: no patient resolved for "${idParam}", attempting appointment lookup`);
      // Appointment ids are strings in models_core; try by _id or appointmentId fields
      appointmentForFallback = await Appointment.findById(String(idParam)).lean().catch((e) => {
        console.warn('INTAKE POST: Appointment.findById error (ignored)', e && e.message ? e.message : e);
        return null;
      });
      if (!appointmentForFallback) {
        // try appointmentId field or fallback _id again
        appointmentForFallback = await Appointment.findOne({ appointmentId: String(idParam) }).lean().catch((e) => {
          console.warn('INTAKE POST: Appointment.findOne(appointmentId) error (ignored)', e && e.message ? e.message : e);
          return null;
        });
      }

      if (appointmentForFallback) {
        console.log(`INTAKE POST: appointment fallback found -> ${appointmentForFallback._id}`);
        // if appointment has patientId, try to resolve that patient too
        if (appointmentForFallback.patientId) {
          const resolved = await resolvePatientByParam(String(appointmentForFallback.patientId));
          if (resolved.patient) {
            patient = resolved.patient;
            by = `appointment.patientId:${resolved.by}`;
            console.log(`INTAKE POST: resolved patient via appointment.patientId -> ${patient._id}`);
          } else {
            usingAppointmentFallback = true;
            console.log('INTAKE POST: using appointment fallback (no patient doc resolved)');
          }
        } else {
          usingAppointmentFallback = true;
          console.log('INTAKE POST: appointment has no patientId, using appointment fallback');
        }
      } else {
        console.log('INTAKE POST: no appointment fallback found');
      }
    } else {
      console.log(`INTAKE POST: patient resolved from param by="${by}" id=${patient._id}`);
    }

    // If still no patient and no appointment fallback but request provided data.patientId, try that
    if (!patient && data.patientId) {
      console.log(`INTAKE POST: attempting to resolve patient from body.patientId = ${data.patientId}`);
      const resolved = await resolvePatientByParam(String(data.patientId));
      if (resolved.patient) {
        patient = resolved.patient;
        by = `body.patientId:${resolved.by}`;
        console.log(`INTAKE POST: resolved patient from body.patientId -> ${patient._id}`);
      } else {
        console.log('INTAKE POST: could not resolve patient from body.patientId');
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
      console.log('INTAKE POST: using patient doc to build patientSnapshot');
    } else if (data.patientSnapshot) {
      // accept provided snapshot (ensure firstName exists)
      patientSnapshot.firstName = data.patientSnapshot.firstName || data.patientSnapshot.first_name || '';
      patientSnapshot.lastName = data.patientSnapshot.lastName || data.patientSnapshot.last_name || '';
      patientSnapshot.dateOfBirth = data.patientSnapshot.dateOfBirth ? new Date(data.patientSnapshot.dateOfBirth) : (data.patientSnapshot.dob ? new Date(data.patientSnapshot.dob) : null);
      patientSnapshot.gender = data.patientSnapshot.gender || null;
      patientSnapshot.phone = data.patientSnapshot.phone || null;
      patientSnapshot.email = data.patientSnapshot.email || null;
      console.log('INTAKE POST: using provided patientSnapshot from body');
    } else if (usingAppointmentFallback && appointmentForFallback) {
      patientSnapshot.firstName = appointmentForFallback.clientName || appointmentForFallback.name || '';
      patientSnapshot.phone = appointmentForFallback.phoneNumber || '';
      console.log('INTAKE POST: using appointment fallback to build minimal patientSnapshot');
    } else {
      // As IntakeSchema requires patientSnapshot.firstName to be present, ensure it's set
      patientSnapshot.firstName = (data.patientName || data.patientSnapshot?.firstName || '').toString().trim();
      console.log('INTAKE POST: building minimal patientSnapshot from body fields');
    }

    if (!patientSnapshot.firstName || patientSnapshot.firstName.trim() === '') {
      console.log('INTAKE POST: patientSnapshot.firstName missing after resolution');
      return res.status(400).json({ success: false, message: 'patientSnapshot.firstName is required (patient resolution failed)', errorCode: 10012 });
    }

    // Determine resolvedPatientId (string) if available
    const resolvedPatientId = patient ? String(patient._id) : (data.patientId ? String(data.patientId) : (appointmentForFallback && appointmentForFallback.patientId ? String(appointmentForFallback.patientId) : null));
    console.log('INTAKE POST: resolvedPatientId =', resolvedPatientId);

    // Determine doctorId: admin may pass doctorId, otherwise logged-in user
    const doctorIdFromBody = data.doctorId;
    const doctorId = (isAdmin && doctorIdFromBody && String(doctorIdFromBody).trim()) ? String(doctorIdFromBody) : String(userId);
    console.log('INTAKE POST: doctorId resolved to', doctorId, 'isAdmin:', isAdmin);

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
          spo2: data.vitals?.spo2 || null,
          weightKg: data.vitals?.weightKg || data.vitals?.weight_kg || null,
          heightCm: data.vitals?.heightCm || data.vitals?.height_cm || null,
          bmi: data.vitals?.bmi || null,
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

    console.log('INTAKE POST: intakePayload prepared (patientSnapshot.firstName):', intakePayload.patientSnapshot.firstName);
    console.log('INTAKE POST: 📊 Vitals extracted:', JSON.stringify(intakePayload.triage.vitals));

    // Create pharmacy record if medicines provided
    let pharmacyRecord = null;
    if (Array.isArray(data.pharmacy) && data.pharmacy.length > 0) {
      console.log('INTAKE POST: pharmacy data present, creating PharmacyRecord with', data.pharmacy.length, 'items');
      // Map incoming pharmacy rows to PharmacyRecord.items
      const items = data.pharmacy.map(r => {
        return {
          medicineId: r.medicineId || r.medicine_id || r.MedicineId || null,
          batchId: r.batchId || null,
          sku: r.sku || r.SKU || null,
          name: r.name || r.Medicine || '',
          dosage: r.Dosage || r.dosage || '',
          frequency: r.Frequency || r.frequency || '',
          notes: r.Notes || r.notes || '',
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
      console.log('INTAKE POST: PharmacyRecord created ->', pharmacyRecord._id);

      intakePayload.attachments = intakePayload.attachments || [];
      // To keep compatible with your previous shape, store pharmacy id in meta or attachments? We'll set meta.pharmacyId.
      intakePayload.meta = intakePayload.meta || {};
      intakePayload.meta.pharmacyId = String(pharmacyRecord._id);
    }

    // Create lab reports (Pathology) if provided
    const createdLabReportIds = [];
    if (Array.isArray(data.pathology) && data.pathology.length > 0) {
      console.log('INTAKE POST: pathology data present, creating LabReport(s):', data.pathology.length);
      for (const row of data.pathology) {
        try {
          const lrPayload = {
            patientId: intakePayload.patientId || null,
            appointmentId: intakePayload.appointmentId || null,
            testType: row['Test Name'] || row.testType || row.testName || row.name || '',
            results: row.results || {},
            fileRef: row.fileRef || null,
            uploadedBy: userId,
            metadata: {
              category: row.Category || row.category || '',
              priority: row.Priority || row.priority || 'Normal',
              notes: row.Notes || row.notes || '',
              ...(row.meta || {})
            },
          };
          const lr = await LabReport.create(lrPayload);
          createdLabReportIds.push(String(lr._id));
          console.log('INTAKE POST: LabReport created ->', lr._id);
        } catch (err) {
          console.error('INTAKE: LabReport create error (continuing):', err && err.message ? err.message : err);
        }
      }
      if (createdLabReportIds.length) {
        intakePayload.meta = intakePayload.meta || {};
        intakePayload.meta.labReportIds = createdLabReportIds;
        console.log('INTAKE POST: labReportIds added to intakePayload.meta', createdLabReportIds);
      }
    }

    // Save Intake (models_core.Intake)
    const savedIntake = await Intake.create(intakePayload);
    console.log('INTAKE POST: Intake saved ->', savedIntake._id);

    // Push prescription snapshot into patient.prescriptions if pharmacy record exists and patient exists
    if (pharmacyRecord && intakePayload.patientId) {
      try {
        console.log('INTAKE POST: snapshotting prescription to patient:', intakePayload.patientId);
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
        console.log('INTAKE POST: prescription snapshot pushed to patient');
      } catch (err) {
        console.warn('INTAKE: error while snapshotting prescription to patient:', err && err.message ? err.message : err);
      }
    }

    // Update patient vitals and notes
    if (intakePayload.patientId) {
      try {
        console.log('INTAKE POST: updating patient vitals and notes:', intakePayload.patientId);
        const patientDoc = await Patient.findById(String(intakePayload.patientId));
        if (patientDoc) {
          // Update vitals from intake
          if (intakePayload.triage && intakePayload.triage.vitals) {
            const vitals = intakePayload.triage.vitals;
            patientDoc.vitals = patientDoc.vitals || {};
            
            // Log what we're receiving
            console.log('INTAKE POST: Received vitals:', JSON.stringify(vitals));
            
            // Update each vital if provided (check for falsy but allow 0)
            if (vitals.heightCm !== null && vitals.heightCm !== undefined && vitals.heightCm !== '') {
              patientDoc.vitals.heightCm = Number(vitals.heightCm) || null;
            }
            if (vitals.weightKg !== null && vitals.weightKg !== undefined && vitals.weightKg !== '') {
              patientDoc.vitals.weightKg = Number(vitals.weightKg) || null;
            }
            if (vitals.bmi !== null && vitals.bmi !== undefined && vitals.bmi !== '') {
              patientDoc.vitals.bmi = Number(vitals.bmi) || null;
            }
            if (vitals.bp) {
              patientDoc.vitals.bp = vitals.bp;
            }
            if (vitals.temp !== null && vitals.temp !== undefined && vitals.temp !== '') {
              patientDoc.vitals.temp = Number(vitals.temp) || null;
            }
            if (vitals.pulse !== null && vitals.pulse !== undefined && vitals.pulse !== '') {
              patientDoc.vitals.pulse = Number(vitals.pulse) || null;
            }
            if (vitals.spo2 !== null && vitals.spo2 !== undefined && vitals.spo2 !== '') {
              patientDoc.vitals.spo2 = Number(vitals.spo2) || null;
            }
            
            console.log('INTAKE POST: Updated patient vitals:', JSON.stringify(patientDoc.vitals));
          } else {
            console.warn('INTAKE POST: No vitals found in intakePayload.triage');
          }

          // Append notes
          if (intakePayload.notes && intakePayload.notes.trim()) {
            const timePrefix = `[${new Date().toISOString()}]`;
            const appended = `${timePrefix} ${intakePayload.notes}\n\n${patientDoc.notes || ''}`;
            patientDoc.notes = appended;
            console.log('INTAKE POST: patient notes appended');
          }

          patientDoc.updatedAt = new Date();
          await patientDoc.save();
          console.log('INTAKE POST: ✅ Patient document saved with vitals');
        } else {
          console.warn('INTAKE POST: Patient not found:', intakePayload.patientId);
        }
      } catch (err) {
        console.error('INTAKE: ❌ Error updating patient vitals/notes:', err && err.message ? err.message : err);
        console.error('Stack:', err.stack);
      }
    }

    // Update appointment vitals and followUp data if appointmentId provided
    let updatedAppointment = null;
    if (intakePayload.appointmentId) {
      try {
        console.log('INTAKE POST: attempting to update appointment vitals for', intakePayload.appointmentId);
        const appt = await Appointment.findById(String(intakePayload.appointmentId));
        if (appt) {
          // Only allow doctor or admin to update appointment
          if (!isAdmin && String(appt.doctorId) !== String(userId)) {
            // skip update
            console.warn('INTAKE: skipping appointment vitals update; not owner and not admin');
          } else {
            appt.vitals = Object.assign({}, appt.vitals || {}, intakePayload.triage?.vitals || {});
            
            // Update followUp data if provided
            if (data.followUp) {
              console.log('INTAKE POST: updating followUp data for appointment');
              appt.followUp = appt.followUp || {};
              
              // Basic follow-up info
              if (data.followUp.isRequired !== undefined) appt.followUp.isRequired = data.followUp.isRequired;
              if (data.followUp.priority) appt.followUp.priority = data.followUp.priority;
              if (data.followUp.recommendedDate) appt.followUp.recommendedDate = new Date(data.followUp.recommendedDate);
              if (data.followUp.reason) appt.followUp.reason = data.followUp.reason;
              if (data.followUp.instructions) appt.followUp.instructions = data.followUp.instructions;
              if (data.followUp.diagnosis) appt.followUp.diagnosis = data.followUp.diagnosis;
              if (data.followUp.treatmentPlan) appt.followUp.treatmentPlan = data.followUp.treatmentPlan;
              
              // Lab tests
              if (Array.isArray(data.followUp.labTests)) {
                appt.followUp.labTests = data.followUp.labTests;
              }
              
              // Imaging
              if (Array.isArray(data.followUp.imaging)) {
                appt.followUp.imaging = data.followUp.imaging;
              }
              
              // Procedures
              if (Array.isArray(data.followUp.procedures)) {
                appt.followUp.procedures = data.followUp.procedures;
              }
              
              // Medication
              if (data.followUp.prescriptionReview !== undefined) appt.followUp.prescriptionReview = data.followUp.prescriptionReview;
              if (data.followUp.medicationCompliance) appt.followUp.medicationCompliance = data.followUp.medicationCompliance;
              
              console.log('INTAKE POST: ✅ followUp data updated');
            }
            
            appt.updatedAt = new Date();
            await appt.save();
            updatedAppointment = await Appointment.findById(appt._id)
              .populate('patientId', 'firstName lastName phone email')
              .populate('doctorId', 'firstName lastName email')
              .lean();
            console.log('INTAKE POST: appointment updated ->', appt._id);
          }
        } else {
          console.log('INTAKE POST: appointment not found for update:', intakePayload.appointmentId);
        }
      } catch (err) {
        console.warn('INTAKE: updating appointment vitals failed:', err && err.message ? err.message : err);
      }
    }

    // Prepare response: include intake, patient (fresh), pharmacy (if created), appointment (if updated)
    const freshPatient = intakePayload.patientId ? await Patient.findById(String(intakePayload.patientId)).lean().catch(() => null) : null;
    console.log('INTAKE POST: fetched freshPatient ->', freshPatient ? freshPatient._id : null);

    // attach doctor display string to appointment if present
    if (updatedAppointment && updatedAppointment.doctorId) {
      updatedAppointment.doctor = _normalizeDoctorName(updatedAppointment.doctorId);
    }

    console.log('INTAKE POST: returning success response');
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
  console.log('INTAKE LIST: entry', { params: req.params, query: req.query, user: req.user ? { id: req.user.id, role: req.user.role } : null });
  try {
    const user = req.user;
    const role = user?.role;
    const userId = user?.id;
    const isAdmin = isAdminRole(role);

    const patientParam = req.params.id;
    if (!patientParam || !String(patientParam).trim()) {
      console.log('INTAKE LIST: missing patientParam');
      return res.status(400).json({ success: false, message: 'patientId (param) is required', errorCode: 10020 });
    }

    const limit = Math.min(parseInt(req.query.limit || '20', 10), 200);
    const skip = Math.max(parseInt(req.query.skip || '0', 10), 0);
    const start = req.query.start ? new Date(req.query.start) : null;
    const end = req.query.end ? new Date(req.query.end) : null;

    console.log('INTAKE LIST: resolved query params', { limit, skip, start, end });

    const resolved = await resolvePatientByParam(patientParam);
    const patientId = resolved.patient ? String(resolved.patient._id) : String(patientParam);
    console.log('INTAKE LIST: patient resolved to', patientId, 'by:', resolved.by);

    const q = { 'patientSnapshot.phone': { $exists: true } };
    q.$or = [{ patientId: patientId }, { 'patientSnapshot.phone': patientParam }, { 'patientSnapshot.firstName': new RegExp(patientParam, 'i') }];

    if (start || end) {
      q.createdAt = {};
      if (start) q.createdAt.$gte = start;
      if (end) q.createdAt.$lte = end;
    }

    if (!isAdmin) {
      q.$and = q.$and || [];
      q.$and.push({ $or: [{ doctorId: userId }, { createdBy: userId }] });
      console.log('INTAKE LIST: applying doctor restriction for user', userId);
    }

    const qForLog = JSON.parse(JSON.stringify(q, (k, v) => (v instanceof RegExp ? v.toString() : v)));
    console.log('INTAKE LIST: final query', qForLog);

    // fetch intakes
    const [rows, total] = await Promise.all([
      Intake.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Intake.countDocuments(q),
    ]);

    // Collect all pharmacyIds and labReportIds across rows for bulk fetch
    const pharmacyIdSet = new Set();
    const labReportIdSet = new Set();

    for (const r of rows) {
      try {
        const pid = r?.meta?.pharmacyId;
        if (pid) pharmacyIdSet.add(String(pid));
      } catch (e) { /* ignore */ }

      try {
        const lrIds = r?.meta?.labReportIds;
        if (Array.isArray(lrIds)) {
          for (const id of lrIds) {
            if (id) labReportIdSet.add(String(id));
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Bulk fetch PharmacyRecords and LabReports
    let pharmacyMap = {};
    let labReportMap = {};

    try {
      if (pharmacyIdSet.size > 0) {
        const pharmacyIds = Array.from(pharmacyIdSet);
        const prs = await PharmacyRecord.find({ _id: { $in: pharmacyIds } }).lean().catch(() => []);
        pharmacyMap = prs.reduce((acc, p) => {
          acc[String(p._id)] = p;
          return acc;
        }, {});
        console.log('INTAKE LIST: fetched PharmacyRecord count =', prs.length);
      } else {
        console.log('INTAKE LIST: no pharmacyIds to fetch');
      }
    } catch (e) {
      console.warn('INTAKE LIST: error fetching PharmacyRecords (continuing):', e && e.message ? e.message : e);
      pharmacyMap = {};
    }

    try {
      if (labReportIdSet.size > 0) {
        const labIds = Array.from(labReportIdSet);
        const lrs = await LabReport.find({ _id: { $in: labIds } }).lean().catch(() => []);
        labReportMap = lrs.reduce((acc, l) => {
          acc[String(l._id)] = l;
          return acc;
        }, {});
        console.log('INTAKE LIST: fetched LabReport count =', Object.keys(labReportMap).length);
      } else {
        console.log('INTAKE LIST: no labReportIds to fetch');
      }
    } catch (e) {
      console.warn('INTAKE LIST: error fetching LabReports (continuing):', e && e.message ? e.message : e);
      labReportMap = {};
    }

    // Attach resolved pharmacy & labReports to each intake object
    const enriched = rows.map(r => {
      const copy = Object.assign({}, r);
      try {
        const pid = copy?.meta?.pharmacyId ? String(copy.meta.pharmacyId) : null;
        copy.pharmacy = pid ? (pharmacyMap[pid] || null) : null;
      } catch (e) {
        copy.pharmacy = null;
      }

      try {
        const lrIds = Array.isArray(copy?.meta?.labReportIds) ? copy.meta.labReportIds.map(id => labReportMap[String(id)]).filter(x => x) : [];
        copy.labReports = lrIds;
      } catch (e) {
        copy.labReports = [];
      }

      return copy;
    });

    // Log sample (selected fields)
    console.log('INTAKE LIST: rows sample (enriched):', enriched.slice(0, Math.min(enriched.length, 5)).map(r => ({
      _id: r._id,
      patientId: r.patientId,
      pharmacyId: r?.meta?.pharmacyId,
      pharmacyPresent: !!r.pharmacy,
      labReportIds: r?.meta?.labReportIds,
      labReportsCount: Array.isArray(r.labReports) ? r.labReports.length : 0,
      createdAt: r.createdAt
    })));

    console.log(`INTAKE LIST: returning ${enriched.length} rows (total: ${total})`);
    return res.status(200).json({
      success: true,
      total,
      count: enriched.length,
      intakes: enriched,
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
  console.log('INTAKE GET single: entry', { params: req.params, user: req.user ? { id: req.user.id, role: req.user.role } : null });
  try {
    const user = req.user;
    const role = user?.role;
    const userId = user?.id;
    const isAdmin = isAdminRole(role);

    const patientParam = req.params.id;
    const intakeId = req.params.intakeId;
    if (!patientParam || !String(patientParam).trim() || !intakeId || !String(intakeId).trim()) {
      console.log('INTAKE GET single: missing params');
      return res.status(400).json({ success: false, message: 'patientId and intakeId are required', errorCode: 10030 });
    }

    console.log('INTAKE GET single: fetching intake', intakeId);
    const intake = await Intake.findById(String(intakeId)).lean();
    if (!intake) {
      console.log('INTAKE GET single: intake not found', intakeId);
      return res.status(404).json({ success: false, message: 'Intake not found', errorCode: 10031 });
    }

    // verify intake belongs to patientParam (loose check: match patientId or patientSnapshot name/phone)
    const belongs =
      (intake.patientId && String(intake.patientId) === String(patientParam)) ||
      (intake.patientSnapshot && (String(intake.patientSnapshot.phone || '') === String(patientParam) || String(intake.patientSnapshot.firstName || '').toLowerCase() === String(patientParam).toLowerCase()));

    if (!belongs) {
      console.log('INTAKE GET single: intake does not belong to patientParam', { intakeId, patientParam });
      return res.status(404).json({ success: false, message: 'Intake not found for this patient', errorCode: 10031 });
    }

    // Authorization: doctors may view only their intakes (or createdBy)
    if (!isAdmin && String(intake.doctorId) !== String(userId) && String(intake.createdBy) !== String(userId)) {
      console.log('INTAKE GET single: forbidden for user', userId, 'intake doctorId:', intake.doctorId, 'createdBy:', intake.createdBy);
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 10032 });
    }

    console.log('INTAKE GET single: fetching related resources for intake', intakeId);
    // fetch related resources
    const patient = intake.patientId ? await Patient.findById(String(intake.patientId)).lean().catch((e) => {
      console.warn('INTAKE GET single: Patient.findById error (ignored)', e && e.message ? e.message : e);
      return null;
    }) : null;

    const pharmacyObj = intake.meta && intake.meta.pharmacyId ? await PharmacyRecord.findById(String(intake.meta.pharmacyId)).lean().catch((e) => {
      console.warn('INTAKE GET single: PharmacyRecord.findById error (ignored)', e && e.message ? e.message : e);
      return null;
    }) : null;

    const labReports = intake.meta && intake.meta.labReportIds && Array.isArray(intake.meta.labReportIds)
      ? await LabReport.find({ _id: { $in: intake.meta.labReportIds } }).lean().catch((e) => {
        console.warn('INTAKE GET single: LabReport.find error (ignored)', e && e.message ? e.message : e);
        return [];
      })
      : [];

    let appointmentObj = null;
    if (intake.appointmentId) {
      appointmentObj = await Appointment.findById(String(intake.appointmentId))
        .populate('patientId', 'firstName lastName phone email')
        .populate('doctorId', 'firstName lastName email')
        .lean()
        .catch((e) => {
          console.warn('INTAKE GET single: Appointment.findById/populate error (ignored)', e && e.message ? e.message : e);
          return null;
        });
      if (appointmentObj && appointmentObj.doctorId) {
        appointmentObj.doctor = _normalizeDoctorName(appointmentObj.doctorId);
      }
    }

    console.log('INTAKE GET single: returning intake + related resources', { intakeId, patient: patient ? patient._id : null, pharmacy: pharmacyObj ? pharmacyObj._id : null, labReportsCount: labReports.length });
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
