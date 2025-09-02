const express = require('express');
const { Appointment } = require('../Models/models'); // use combined models export
const auth = require('../Middleware/Auth'); // verifies JWT
const router = express.Router();


// ===============================
// CREATE Appointment
// POST /api/appointments
// ===============================
router.post('/', auth, async (req, res) => {
  try {
    const doctorId = req.user.id; 
    const data = req.body;

    if (!data.clientName || !data.appointmentType || !data.date || !data.time || !data.location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errorCode: 1006,
      });
    }

    const appointment = await Appointment.create({
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
    });

    res.status(201).json({
      success: true,
      message: '✅ Appointment created successfully',
      appointment,
    });
  } catch (err) {
    console.error('❌ Error creating appointment:', err);
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

    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'firstName lastName phone email');

    res.status(200).json(appointments);
  } catch (err) {
    console.error('❌ Error fetching appointments:', err);
    res.status(500).json({
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
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone email');

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    res.status(200).json(appointment);
  } catch (err) {
    console.error('❌ Error fetching appointment by ID:', err);
    res.status(500).json({
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

    if (!status) {
      return res.status(400).json({
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
      return res.status(404).json({
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    res.status(200).json({
      message: '✅ Appointment status updated',
      appointment,
    });
  } catch (err) {
    console.error('❌ Error updating appointment status:', err);
    res.status(500).json({
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
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
        errorCode: 1007,
      });
    }

    res.status(200).json({
      message: '🗑️ Appointment deleted successfully',
    });
  } catch (err) {
    console.error('❌ Error deleting appointment:', err);
    res.status(500).json({
      message: 'Failed to delete appointment',
      errorCode: 5004,
    });
  }
});


module.exports = router;
