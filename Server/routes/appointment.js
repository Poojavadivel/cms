const express = require('express');
const { Appointment } = require('../Models/models'); // use combined models export
const auth = require('../Middleware/Auth'); // verifies JWT
const router = express.Router();

// ===============================
// CREATE Appointment
// POST /api/appointments
// ===============================
// ===============================
// CREATE Appointment
// POST /api/appointments
// ===============================
router.post('/', auth, async (req, res) => {
  console.log('📩 [CREATE] Incoming request to /api/appointments');

  try {
    const doctorId = req.user.id;
    const data = req.body;

    console.log('👨‍⚕️ [CREATE] Doctor ID from token:', doctorId);
    console.log('📦 [CREATE] Raw request body:', JSON.stringify(data, null, 2));

    // Step 1: Validate required fields
    if (!data.clientName) console.error("❌ [CREATE] Missing: clientName");
    if (!data.appointmentType) console.error("❌ [CREATE] Missing: appointmentType");
    if (!data.date) console.error("❌ [CREATE] Missing: date");
    if (!data.time) console.error("❌ [CREATE] Missing: time");
    if (!data.location) console.error("❌ [CREATE] Missing: location");

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

    // Step 2: Construct new appointment
    console.log("🛠️ [CREATE] Constructing appointment object...");
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

    // Step 3: Save appointment to DB
    const appointment = await Appointment.create(appointmentData);

    console.log('✅ [CREATE] Appointment successfully created with ID:', appointment._id);

    // Step 4: Send response
    res.status(201).json({
      success: true,
      message: '✅ Appointment created successfully',
      appointment,
    });
  } catch (err) {
    console.error('💥 [CREATE] Unexpected error while creating appointment:', err.message);
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      errorCode: 5000,
    });
  }
});


// ===============================
// GET All Appointments for logged-in doctor
// GET /api/appointments
// ===============================
router.get('/', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    console.log('📥 [GET ALL] Fetching appointments for doctor:', doctorId);

    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'firstName lastName phone email');

    console.log(`📊 [GET ALL] Found ${appointments.length} appointments`);
    res.status(200).json({
      success: true,
      appointments,
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
// ===============================
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('🔎 [GET BY ID] Appointment ID:', req.params.id);

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone email');

    if (!appointment) {
      console.warn('⚠️ [GET BY ID] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    console.log('✅ [GET BY ID] Found appointment:', appointment._id);
    res.status(200).json({
      success: true,
      appointment,
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
// ===============================
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    console.log(`✏️ [STATUS UPDATE] ${req.params.id} → ${status}`);

    if (!status) {
      console.warn('⚠️ [STATUS UPDATE] Missing status field');
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        errorCode: 1008,
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!appointment) {
      console.warn('⚠️ [STATUS UPDATE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    console.log('✅ [STATUS UPDATE] Updated:', appointment._id, '→', appointment.status);
    res.status(200).json({
      success: true,
      message: '✅ Appointment status updated',
      appointment,
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
// ===============================
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ [DELETE] Appointment ID:', req.params.id);

    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      console.warn('⚠️ [DELETE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    console.log('✅ [DELETE] Appointment deleted:', appointment._id);
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
// ===============================
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('✏️ [FULL UPDATE] Appointment ID:', req.params.id);
    const data = req.body;
    console.log('📦 [FULL UPDATE] Incoming data:', JSON.stringify(data, null, 2));

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
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
      },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      console.warn('⚠️ [FULL UPDATE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    console.log('✅ [FULL UPDATE] Updated appointment:', appointment._id);
    res.status(200).json({
      success: true,
      message: '✅ Appointment updated successfully',
      appointment,
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
