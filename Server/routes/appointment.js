const express = require('express');
const { Appointment } = require('../Models/models'); // use combined models export
const auth = require('../Middleware/Auth'); // verifies JWT
const router = express.Router();

/*
  NOTE: Role detection here follows your instruction:
  - If req.user.id starts with 'admin' → treat as admin
  - Otherwise treat as doctor
*/

// helper to normalize doctor name from populated doctorId
function extractDoctorName(docObj) {
  if (!docObj) return '';
  // prefer a single 'name' field, else use firstName + lastName, else email, else id
  if (typeof docObj.name === 'string' && docObj.name.trim()) return docObj.name.trim();
  const first = (docObj.firstName || '').toString().trim();
  const last = (docObj.lastName || '').toString().trim();
  if (first || last) return `${first} ${last}`.trim();
  if (docObj.email) return docObj.email.toString();
  return docObj._id ? docObj._id.toString() : '';
}

// normalize appointments array to include `doctor` string
function normalizeAppointments(arr) {
  return arr.map(a => {
    const doctorObj = a.doctorId || null;
    const doctorStr = extractDoctorName(doctorObj);
    return {
      ...a,
      doctor: doctorStr,
    };
  });
}

// ===============================
// CREATE Appointment
// POST /api/appointments
// ===============================
router.post('/', auth, async (req, res) => {
  console.log('📩 [CREATE] Incoming request to /api/appointments');

  try {
    const userId = req.user.id;
    const isAdmin = String(userId).startsWith('admin');
    const data = req.body;

    console.log('👤 User ID from token:', userId, 'isAdmin:', isAdmin);
    console.log('📦 [CREATE] Raw request body:', JSON.stringify(data, null, 2));

    // validate required fields (common)
    if (!data.clientName || !data.appointmentType || !data.date || !data.time || !data.location) {
      console.warn('⚠️ [CREATE] Missing required fields →', {
        clientName: data.clientName,
        appointmentType: data.appointmentType,
        date: data.date,
        time: data.time,
        location: data.location,
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errorCode: 1006,
      });
    }

    // If admin, allow passing doctorId in body; otherwise doctorId is the logged-in user
    const doctorId = isAdmin ? (data.doctorId || null) : userId;

    const appointmentData = {
      doctorId,
      patientId: data.patientId || null,
      clientName: data.clientName,
      appointmentType: data.appointmentType,
      date: data.date,
      time: data.time,
      location: data.location,
      notes: data.notes,
      phoneNumber: data.phoneNumber,
      mode: data.mode,
      priority: data.priority,
      durationMinutes: data.durationMinutes,
      reminder: data.reminder,
      chiefComplaint: data.chiefComplaint,
      vitals: data.vitals,
      status: data.status || 'Scheduled',
    };

    console.log("📝 [CREATE] Appointment payload ready:", JSON.stringify(appointmentData, null, 2));

    let appointment = await Appointment.create(appointmentData);

    console.log('✅ [CREATE] Appointment created with ID:', appointment._id);

    // populate patientId and doctorId for the response
    appointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName name email')
      .lean();

    const normalized = {
      ...appointment,
      doctor: extractDoctorName(appointment.doctorId),
    };

    res.status(201).json({
      success: true,
      message: '✅ Appointment created successfully',
      appointment: normalized,
    });
  } catch (err) {
    console.error('💥 [CREATE] Unexpected error while creating appointment:', err && err.message ? err.message : err);
    console.error(err && err.stack ? err.stack : '');
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      errorCode: 5000,
    });
  }
});

// ===============================
// GET All Appointments
// GET /api/appointments
// - admin: returns all (optionally filtered by doctor query param)
// - doctor: returns only appointments for that doctor
// ===============================
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = String(userId).startsWith('admin');
    console.log('📥 [GET ALL] Fetching appointments. User:', userId, 'isAdmin:', isAdmin);

    const { doctorId: doctorQuery } = req.query;

    let query = {};
    if (isAdmin) {
      // admin can optionally filter by doctor via ?doctorId=
      if (doctorQuery) query.doctorId = doctorQuery;
    } else {
      // doctor only sees their own
      query.doctorId = userId;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName name email') // <-- populate doctor info
      .lean();

    console.log(`📊 [GET ALL] Found ${appointments.length} appointments`);

    const normalized = normalizeAppointments(appointments);

    res.status(200).json({
      success: true,
      appointments: normalized,
    });
  } catch (err) {
    console.error('❌ [GET ALL] Error fetching appointments:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      errorCode: 5001,
    });
  }
});

// ===============================
// GET Appointment by ID
// GET /api/appointments/:id
// - admin: can fetch any appointment
// - doctor: can fetch only if appointment.doctorId === req.user.id
// ===============================
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = String(userId).startsWith('admin');
    console.log('🔎 [GET BY ID] Appointment ID:', req.params.id, 'User:', userId, 'isAdmin:', isAdmin);

    let appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName name email') // <-- populate doctor info
      .lean();

    if (!appointment) {
      console.warn('⚠️ [GET BY ID] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    // if doctor, ensure ownership
    if (!isAdmin && String(appointment.doctorId?._id ?? appointment.doctorId) !== String(userId)) {
      console.warn('⛔ [GET BY ID] Forbidden - doctor trying to access others appointment', {
        requestedBy: userId,
        appointmentDoctor: appointment.doctorId,
      });
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        errorCode: 1009,
      });
    }

    const normalized = {
      ...appointment,
      doctor: extractDoctorName(appointment.doctorId),
    };

    console.log('✅ [GET BY ID] Found appointment:', appointment._id);
    res.status(200).json({
      success: true,
      appointment: normalized,
    });
  } catch (err) {
    console.error('❌ [GET BY ID] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      errorCode: 5002,
    });
  }
});

// ===============================
// UPDATE Appointment Status
// PATCH /api/appointments/:id/status
// - admin: can update any
// - doctor: only theirs
// ===============================
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = String(userId).startsWith('admin');
    const { status } = req.body;
    console.log(`✏️ [STATUS UPDATE] ${req.params.id} → ${status} by ${userId}`);

    if (!status) {
      console.warn('⚠️ [STATUS UPDATE] Missing status field');
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        errorCode: 1008,
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.warn('⚠️ [STATUS UPDATE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    if (!isAdmin && String(appointment.doctorId) !== String(userId)) {
      console.warn('⛔ [STATUS UPDATE] Forbidden - doctor trying to update others appointment', { userId, appointmentDoctor: appointment.doctorId });
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 1009 });
    }

    appointment.status = status;
    appointment.updatedAt = Date.now();
    await appointment.save();

    // populate for response
    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName name email')
      .lean();

    const normalized = {
      ...populated,
      doctor: extractDoctorName(populated.doctorId),
    };

    console.log('✅ [STATUS UPDATE] Updated:', appointment._id, '→', appointment.status);
    res.status(200).json({
      success: true,
      message: '✅ Appointment status updated',
      appointment: normalized,
    });
  } catch (err) {
    console.error('❌ [STATUS UPDATE] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      errorCode: 5003,
    });
  }
});

// ===============================
// DELETE Appointment
// DELETE /api/appointments/:id
// - admin: can delete any
// - doctor: can delete only their own appointments
// ===============================
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = String(userId).startsWith('admin');
    console.log('🗑️ [DELETE] Appointment ID:', req.params.id, 'User:', userId, 'isAdmin:', isAdmin);

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.warn('⚠️ [DELETE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    if (!isAdmin && String(appointment.doctorId) !== String(userId)) {
      console.warn('⛔ [DELETE] Forbidden - doctor trying to delete others appointment', { userId, appointmentDoctor: appointment.doctorId });
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 1009 });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    console.log('✅ [DELETE] Appointment deleted:', req.params.id);
    res.status(200).json({
      success: true,
      message: '🗑️ Appointment deleted successfully',
    });
  } catch (err) {
    console.error('❌ [DELETE] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      errorCode: 5004,
    });
  }
});

// ===============================
// UPDATE Appointment (full edit)
// PUT /api/appointments/:id
// - admin: can edit any (and change doctorId if provided)
// - doctor: can edit only theirs (cannot reassign doctorId)
// ===============================
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = String(userId).startsWith('admin');
    console.log('✏️ [FULL UPDATE] Appointment ID:', req.params.id, 'User:', userId, 'isAdmin:', isAdmin);

    const data = req.body;
    console.log('📦 [FULL UPDATE] Incoming data:', JSON.stringify(data, null, 2));

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.warn('⚠️ [FULL UPDATE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    if (!isAdmin && String(appointment.doctorId) !== String(userId)) {
      console.warn('⛔ [FULL UPDATE] Forbidden - doctor trying to update others appointment', { userId, appointmentDoctor: appointment.doctorId });
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 1009 });
    }

    // Build update object. Admin may supply doctorId; doctor cannot reassign.
    const updateObj = {
      clientName: data.clientName,
      appointmentType: data.appointmentType,
      date: data.date,
      time: data.time,
      location: data.location,
      notes: data.notes,
      gender: data.gender,
      patientId: data.patientId || null,
      phoneNumber: data.phoneNumber,
      mode: data.mode,
      priority: data.priority,
      durationMinutes: data.durationMinutes,
      reminder: data.reminder,
      chiefComplaint: data.chiefComplaint,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      bp: data.bp,
      heartRate: data.heartRate,
      spo2: data.spo2,
      status: data.status || 'Scheduled',
      updatedAt: Date.now(),
    };

    // if admin and doctorId provided in body, allow reassign
    if (isAdmin && data.doctorId) {
      updateObj.doctorId = data.doctorId;
    }

    const updated = await Appointment.findByIdAndUpdate(req.params.id, updateObj, { new: true, runValidators: true });

    if (!updated) {
      console.warn('⚠️ [FULL UPDATE] Not found after update:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    // populate for response
    const populated = await Appointment.findById(updated._id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName name email')
      .lean();

    const normalized = {
      ...populated,
      doctor: extractDoctorName(populated.doctorId),
    };

    console.log('✅ [FULL UPDATE] Updated appointment:', updated._id);
    res.status(200).json({
      success: true,
      message: '✅ Appointment updated successfully',
      appointment: normalized,
    });
  } catch (err) {
    console.error('❌ [FULL UPDATE] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      errorCode: 5005,
    });
  }
});

module.exports = router;
