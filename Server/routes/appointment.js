const express = require('express');
const { Appointment,Patient } = require('../Models'); // Mongoose models
const auth = require('../Middleware/Auth'); // loads fresh user + role
const router = express.Router();

// -----------------------------
// Helper: extract doctor name
// -----------------------------
function extractDoctorName(docObj) {
  if (!docObj) return '';
  const first = (docObj.firstName || '').toString().trim();
  const last = (docObj.lastName || '').toString().trim();
  if (first || last) return `${first} ${last}`.trim();
  if (docObj.email) return docObj.email.toString();
  return docObj._id ? docObj._id.toString() : '';
}

// -----------------------------
// Helper: calculate age from dateOfBirth
// -----------------------------
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return 0;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age > 0 ? age : 0;
}

// Normalize appointments to include doctor string and patient age
function normalizeAppointments(arr) {
  return arr.map(a => {
    const normalized = {
      ...a,
      doctor: extractDoctorName(a.doctorId),
    };
    
    // Calculate age from patient dateOfBirth if available
    if (a.patientId && typeof a.patientId === 'object' && a.patientId.dateOfBirth) {
      normalized.patientAge = calculateAge(a.patientId.dateOfBirth);
    }
    
    return normalized;
  });
}

// -----------------------------
// CREATE Appointment
// -----------------------------
router.post('/', auth, async (req, res) => {
  console.log("📥 CREATE appointment request body:", req.body, "user:", req.user);
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const data = req.body;

    // --- Compute startAt if not passed ---
    let startAt = data.startAt;
    if (!startAt && data.date && data.time) {
      startAt = new Date(`${data.date}T${data.time}`);
    }

    if (!data.patientId || !data.appointmentType || !startAt) {
      console.warn("❌ Missing fields for appointment creation:", data);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientId, appointmentType, startAt',
        errorCode: 1006,
      });
    }

    // --- Fetch patient to get their assigned doctorId ---
    const patient = await Patient.findById(data.patientId)
      .populate('doctorId', 'firstName lastName email')
      .lean();

    if (!patient) {
      console.warn(`❌ Patient not found for ID: ${data.patientId}`);
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        errorCode: 1007,
      });
    }

    // --- Determine doctorId ---
    let doctorId = null;
    if (role === 'doctor') {
      doctorId = userId;
    } else if (role === 'admin' || role === 'superadmin') {
      doctorId = patient.doctorId?._id || userId;
    } else {
      doctorId = userId;
    }

    console.log("👨‍⚕️ Assigned doctorId:", doctorId);

    // --- Calculate endAt based on duration ---
    const duration = data.durationMinutes || 20;
    const endAt = new Date(new Date(startAt).getTime() + duration * 60000);

    const appointmentData = {
      patientId: data.patientId,
      doctorId,
      appointmentType: data.appointmentType,
      startAt: new Date(startAt),
      endAt,
      location: data.location || '',
      status: data.status || 'Scheduled',
      vitals: data.vitals || {},
      notes: data.notes || '',
      metadata: {
        mode: data.mode,
        priority: data.priority,
        reminder: data.reminder,
        chiefComplaint: data.chiefComplaint,
      },
    };

    let appointment = await Appointment.create(appointmentData);
    console.log("✅ Appointment created:", appointment._id);

    appointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName email')
      .lean();

    const normalized = {
      ...appointment,
      doctor: extractDoctorName(appointment.doctorId),
    };

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: normalized,
    });
  } catch (err) {
    console.error('💥 CREATE appointment error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      errorCode: 5000,
    });
  }
});

// -----------------------------
// GET All Appointments
// -----------------------------
router.get('/', auth, async (req, res) => {
  console.log("📥 GET all appointments request, user:", req.user, "query:", req.query);
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { doctorId: doctorQuery, patientId, hasFollowUp } = req.query;

    let query = {};
    if (role === 'admin' || role === 'superadmin') {
      if (doctorQuery) query.doctorId = doctorQuery;
    } else if (role === 'doctor') {
      query.doctorId = userId;
    }
    
    // Filter by patientId if provided
    if (patientId) {
      query.patientId = patientId;
    }
    
    // Filter by follow-up if requested
    if (hasFollowUp === 'true') {
      query['followUp.isRequired'] = true;
    }
    
    console.log("🔎 Appointment query:", query);

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName phone email bloodGroup metadata dateOfBirth')
      .populate('doctorId', 'firstName lastName email')
      .sort({ startAt: -1 }) // Sort by date, newest first
      .lean();

    console.log("✅ Found appointments:", appointments.length);

    const normalized = normalizeAppointments(appointments);

    res.status(200).json({ success: true, appointments: normalized });
  } catch (err) {
    console.error('💥 GET all appointments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments', errorCode: 5001 });
  }
});

// -----------------------------
// GET Appointment by ID
// -----------------------------
router.get('/:id', auth, async (req, res) => {
  console.log("📥 GET appointment by ID:", req.params.id, "user:", req.user);
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName email')
      .lean();

    if (!appointment) {
      console.warn("❌ Appointment not found:", req.params.id);
      return res.status(404).json({ success: false, message: 'Appointment not found', errorCode: 1007 });
    }

    if (role === 'doctor' && String(appointment.doctorId?._id ?? appointment.doctorId) !== String(userId)) {
      console.warn("🚫 Forbidden access by doctor:", userId);
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 1009 });
    }

    const normalized = { ...appointment, doctor: extractDoctorName(appointment.doctorId) };
    console.log("✅ Appointment fetched:", appointment._id);

    res.status(200).json({ success: true, appointment: normalized });
  } catch (err) {
    console.error('💥 GET by ID error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch appointment', errorCode: 5002 });
  }
});

// -----------------------------
// UPDATE Appointment Status
// -----------------------------
router.patch('/:id/status', auth, async (req, res) => {
  console.log("📥 PATCH status for appointment:", req.params.id, "body:", req.body, "user:", req.user);
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { status } = req.body;

    if (!status) {
      console.warn("❌ Missing status field");
      return res.status(400).json({ success: false, message: 'Status is required', errorCode: 1008 });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.warn("❌ Appointment not found:", req.params.id);
      return res.status(404).json({ success: false, message: 'Appointment not found', errorCode: 1007 });
    }

    if (role === 'doctor' && String(appointment.doctorId) !== String(userId)) {
      console.warn("🚫 Doctor forbidden to update:", userId);
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 1009 });
    }

    appointment.status = status;
    await appointment.save();
    console.log("✅ Appointment status updated:", appointment._id, "→", status);

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName email')
      .lean();

    const normalized = { ...populated, doctor: extractDoctorName(populated.doctorId) };

    res.status(200).json({ success: true, message: 'Appointment status updated', appointment: normalized });
  } catch (err) {
    console.error('💥 UPDATE status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status', errorCode: 5003 });
  }
});

// -----------------------------
// DELETE Appointment
// -----------------------------
router.delete('/:id', auth, async (req, res) => {
  console.log("📥 DELETE appointment:", req.params.id, "user:", req.user);
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.warn("❌ Appointment not found for deletion:", req.params.id);
      return res.status(404).json({ success: false, message: 'Appointment not found', errorCode: 1007 });
    }

    if (role === 'doctor' && String(appointment.doctorId) !== String(userId)) {
      console.warn("🚫 Doctor forbidden to delete:", userId);
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 1009 });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    console.log("✅ Appointment deleted:", req.params.id);

    res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('💥 DELETE appointment error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete appointment', errorCode: 5004 });
  }
});

// -----------------------------
// FULL UPDATE Appointment
// -----------------------------
router.put('/:id', auth, async (req, res) => {
  console.log("📥 PUT full update appointment:", req.params.id, "body:", req.body, "user:", req.user);
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const data = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.warn("❌ Appointment not found:", req.params.id);
      return res.status(404).json({ success: false, message: 'Appointment not found', errorCode: 1007 });
    }

    if (role === 'doctor' && String(appointment.doctorId) !== String(userId)) {
      console.warn("🚫 Doctor forbidden to update appointment:", userId);
      return res.status(403).json({ success: false, message: 'Forbidden', errorCode: 1009 });
    }

    const updateObj = {
      patientId: data.patientId || appointment.patientId,
      appointmentType: data.appointmentType || appointment.appointmentType,
      startAt: data.startAt ? new Date(data.startAt) : appointment.startAt,
      endAt: data.endAt ? new Date(data.endAt) : appointment.endAt,
      location: data.location ?? appointment.location,
      status: data.status || appointment.status,
      vitals: data.vitals ?? appointment.vitals,
      notes: data.notes ?? appointment.notes,
      metadata: data.metadata ?? appointment.metadata,
    };

    // Handle follow-up data from intake form
    if (data.followUp && typeof data.followUp === 'object') {
      updateObj.followUp = {
        ...appointment.followUp,
        ...data.followUp,
      };
      
      // If follow-up is required, set the flag
      if (data.followUp.isRequired) {
        updateObj.followUp.isFollowUp = false; // This is the original appointment
        // Convert recommendedDate string to Date if provided
        if (data.followUp.recommendedDate) {
          updateObj.followUp.recommendedDate = new Date(data.followUp.recommendedDate);
        }
      }
    }

    if ((role === 'admin' || role === 'superadmin') && data.doctorId) {
      updateObj.doctorId = data.doctorId;
    }

    const updated = await Appointment.findByIdAndUpdate(req.params.id, updateObj, { new: true, runValidators: true })
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName email')
      .lean();

    const normalized = { ...updated, doctor: extractDoctorName(updated.doctorId) };
    console.log("✅ Appointment updated successfully:", updated._id);

    res.status(200).json({ success: true, message: 'Appointment updated successfully', appointment: normalized });
  } catch (err) {
    console.error('💥 FULL UPDATE error:', err);
    res.status(500).json({ success: false, message: 'Failed to update appointment', errorCode: 5005 });
  }
});

// -----------------------------
// CREATE Follow-Up Appointment
// -----------------------------
router.post('/:id/follow-up', auth, async (req, res) => {
  console.log("📥 CREATE follow-up appointment for:", req.params.id, "body:", req.body);
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const { followUpDate, followUpReason, appointmentType, location, notes } = req.body;

    // Validate follow-up date
    if (!followUpDate) {
      return res.status(400).json({
        success: false,
        message: 'Follow-up date is required',
        errorCode: 1008,
      });
    }

    // Find the original appointment
    const originalAppointment = await Appointment.findById(id).lean();
    if (!originalAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Original appointment not found',
        errorCode: 1009,
      });
    }

    // Check authorization
    if (role === 'doctor' && originalAppointment.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create follow-up for this appointment',
        errorCode: 1010,
      });
    }

    // Create follow-up appointment
    const followUpAppointment = new Appointment({
      patientId: originalAppointment.patientId,
      doctorId: originalAppointment.doctorId,
      appointmentType: appointmentType || 'Follow-Up',
      startAt: new Date(followUpDate),
      location: location || originalAppointment.location,
      status: 'Scheduled',
      notes: notes || '',
      isFollowUp: true,
      previousAppointmentId: id,
      followUpReason: followUpReason || '',
      bookingSource: 'web',
    });

    await followUpAppointment.save();

    // Update original appointment to mark it has follow-up
    await Appointment.findByIdAndUpdate(id, {
      hasFollowUp: true,
      nextFollowUpId: followUpAppointment._id,
      followUpDate: new Date(followUpDate),
    });

    // Populate patient and doctor details for response
    const populated = await Appointment.findById(followUpAppointment._id)
      .populate('patientId', 'firstName lastName phone dateOfBirth gender')
      .populate('doctorId', 'firstName lastName email')
      .lean();

    const normalized = normalizeAppointments([populated])[0];

    console.log("✅ Follow-up appointment created successfully:", followUpAppointment._id);

    res.status(201).json({
      success: true,
      message: 'Follow-up appointment created successfully',
      appointment: normalized,
      followUpId: followUpAppointment._id,
    });
  } catch (err) {
    console.error('💥 Follow-up creation error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create follow-up appointment',
      errorCode: 5006,
    });
  }
});

// -----------------------------
// GET Follow-Up History for Patient
// -----------------------------
router.get('/patient/:patientId/follow-ups', auth, async (req, res) => {
  console.log("📥 GET follow-up history for patient:", req.params.patientId);
  try {
    const { patientId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    // Find all appointments for this patient
    let query = { patientId, isFollowUp: true };
    
    // If doctor, only show their own follow-ups
    if (role === 'doctor') {
      query.doctorId = userId;
    }

    const followUps = await Appointment.find(query)
      .populate('patientId', 'firstName lastName phone dateOfBirth gender')
      .populate('doctorId', 'firstName lastName email')
      .populate('previousAppointmentId', 'startAt appointmentType status')
      .sort({ startAt: -1 })
      .lean();

    const normalized = normalizeAppointments(followUps);

    console.log(`✅ Found ${followUps.length} follow-up appointments`);

    res.status(200).json({
      success: true,
      followUps: normalized,
      count: followUps.length,
    });
  } catch (err) {
    console.error('💥 Follow-up history error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-up history',
      errorCode: 5007,
    });
  }
});

// -----------------------------
// GET Follow-Up Chain for Appointment
// -----------------------------
router.get('/:id/follow-up-chain', auth, async (req, res) => {
  console.log("📥 GET follow-up chain for appointment:", req.params.id);
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id).lean();
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        errorCode: 1009,
      });
    }

    const chain = [];

    // Get previous appointments (go backwards)
    let currentId = appointment.previousAppointmentId;
    while (currentId) {
      const prev = await Appointment.findById(currentId)
        .populate('patientId', 'firstName lastName phone')
        .populate('doctorId', 'firstName lastName email')
        .lean();
      if (prev) {
        chain.unshift(prev);
        currentId = prev.previousAppointmentId;
      } else {
        break;
      }
    }

    // Add current appointment
    const current = await Appointment.findById(id)
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName email')
      .lean();
    chain.push(current);

    // Get next appointments (go forwards)
    currentId = appointment.nextFollowUpId;
    while (currentId) {
      const next = await Appointment.findById(currentId)
        .populate('patientId', 'firstName lastName phone')
        .populate('doctorId', 'firstName lastName email')
        .lean();
      if (next) {
        chain.push(next);
        currentId = next.nextFollowUpId;
      } else {
        break;
      }
    }

    const normalized = normalizeAppointments(chain);

    console.log(`✅ Found ${chain.length} appointments in chain`);

    res.status(200).json({
      success: true,
      chain: normalized,
      count: chain.length,
    });
  } catch (err) {
    console.error('💥 Follow-up chain error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-up chain',
      errorCode: 5008,
    });
  }
});

module.exports = router;
