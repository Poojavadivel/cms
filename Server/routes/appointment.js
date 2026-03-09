const express = require('express');
const { Appointment, Patient, User } = require('../Models'); // Mongoose models
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

// Normalize appointments to include doctor string, patient age, and patientCode
function normalizeAppointments(arr) {
  return arr.map(a => {
    // Determine patient name
    const patientFirstName = a.patientId?.firstName || '';
    const patientLastName = a.patientId?.lastName || '';
    const fullName = `${patientFirstName} ${patientLastName}`.trim();
    const patientName = fullName || a.patientName || 'Unknown Patient';

    // Surface chiefComplaint/reason from metadata as top-level fields
    // so the frontend can always find them without digging into metadata
    const chiefComplaint = a.metadata?.chiefComplaint || '';
    const reason = a.metadata?.reason || '';

    const normalized = {
      ...a,
      doctor: extractDoctorName(a.doctorId),
      patientName: patientName,
      patientFullName: fullName,
      patientCode: a.patientId?.patientCode || a.patientId?.metadata?.patientCode || 'N/A',
      chiefComplaint,
      reason,
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
    // Admin/superadmin can explicitly choose the doctor from the UI.
    // If no doctorId is passed, fallback to patient's assigned doctor for backward compatibility.
    let doctorId = null;
    if (role === 'doctor') {
      doctorId = userId;
    } else if (role === 'admin' || role === 'superadmin') {
      const requestedDoctorId = data.doctorId || null;

      if (requestedDoctorId) {
        const selectedDoctor = await User.findById(requestedDoctorId)
          .select('_id role firstName lastName email')
          .lean();

        if (!selectedDoctor) {
          return res.status(400).json({
            success: false,
            message: 'Selected doctor not found',
            errorCode: 1010,
          });
        }

        if (selectedDoctor.role !== 'doctor') {
          return res.status(400).json({
            success: false,
            message: 'Selected user is not a doctor',
            errorCode: 1011,
          });
        }

        doctorId = selectedDoctor._id;
      } else {
        doctorId = patient.doctorId?._id || userId;
      }
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
      .populate('patientId', 'firstName lastName phone email patientCode metadata')
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
    const { doctorId: doctorQuery, patientId, hasFollowUp, includeDeleted } = req.query;

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

    // Exclude deleted appointments by default
    if (includeDeleted !== 'true') {
      query.isDeleted = { $ne: true };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName phone email bloodGroup metadata dateOfBirth gender patientCode')
      .populate('doctorId', 'firstName lastName email')
      .sort({ startAt: -1 })
      .lean();

    const normalized = normalizeAppointments(appointments);

    res.status(200).json({ success: true, appointments: normalized });
  } catch (err) {
    console.error('💥 GET all appointments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments', errorCode: 5001 });
  }
});

// -----------------------------
// GET Deleted Appointments
// -----------------------------
router.get('/deleted/list', auth, async (req, res) => {
  console.log("📥 GET deleted appointments request, user:", req.user);
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = { isDeleted: true };

    // Doctors can only see their own deleted appointments
    if (role === 'doctor') {
      query.doctorId = userId;
    }
    // Admins can see all deleted appointments or filter by doctor
    else if (role === 'admin' || role === 'superadmin') {
      const { doctorId } = req.query;
      if (doctorId) {
        query.doctorId = doctorId;
      }
    }

    console.log("🔎 Deleted appointments query:", query);

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName phone email bloodGroup metadata dateOfBirth gender patientCode')
      .populate('doctorId', 'firstName lastName email')
      .populate('deletedBy', 'firstName lastName email')
      .sort({ deletedAt: -1 }) // Sort by deletion date, newest first
      .lean();

    console.log("✅ Found deleted appointments:", appointments.length);

    const normalized = normalizeAppointments(appointments);

    res.status(200).json({ success: true, appointments: normalized });
  } catch (err) {
    console.error('💥 GET deleted appointments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch deleted appointments', errorCode: 5001 });
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
      .populate('patientId', 'firstName lastName phone email gender bloodGroup metadata dateOfBirth')
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

    const normalized = normalizeAppointments([appointment])[0];
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

    const normalized = normalizeAppointments([populated])[0];



    res.status(200).json({ success: true, message: 'Appointment status updated', appointment: normalized });
  } catch (err) {
    console.error('💥 UPDATE status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status', errorCode: 5003 });
  }
});

// -----------------------------
// DELETE Appointment (Soft Delete)
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

    // Soft delete: mark as deleted instead of removing
    appointment.isDeleted = true;
    appointment.deletedAt = new Date();
    appointment.deletedBy = userId;
    await appointment.save();

    console.log("✅ Appointment soft deleted:", req.params.id);

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

    // Keep metadata as the source of truth for chief complaint/reason.
    // The Appointment schema does not define top-level `reason` / `chiefComplaint`.
    const hasReasonField = Object.prototype.hasOwnProperty.call(data, 'reason');
    const hasChiefComplaintField = Object.prototype.hasOwnProperty.call(data, 'chiefComplaint');
    if (hasReasonField || hasChiefComplaintField) {
      updateObj.metadata = {
        ...(appointment.metadata || {}),
        ...(data.metadata || {}),
      };

      if (hasReasonField) {
        updateObj.metadata.reason = data.reason ?? '';
      }
      if (hasChiefComplaintField) {
        updateObj.metadata.chiefComplaint = data.chiefComplaint ?? '';
      }
    }

    // Update simple fields for editing
    if (data.date && data.time) {
      updateObj.startAt = new Date(`${data.date}T${data.time}`);
    }
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
    if (data.doctorName) {
      updateObj.doctorName = data.doctorName;
    }

    const updated = await Appointment.findByIdAndUpdate(req.params.id, updateObj, { new: true, runValidators: true })
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName email')
      .lean();

    const normalized = normalizeAppointments([updated])[0];
    console.log("✅ Appointment updated successfully:", updated._id);

    res.status(200).json({ success: true, message: 'Appointment updated successfully', appointment: normalized });
  } catch (err) {
    console.error('💥 FULL UPDATE error:', err);
    // Return validation errors with details
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', '), errorCode: 4000 });
    }
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

// -----------------------------
// CHECK AVAILABILITY - Doctor & Patient
// POST /api/appointments/check-availability
// -----------------------------
router.post('/check-availability', auth, async (req, res) => {
  console.log("📥 CHECK AVAILABILITY request:", req.body);
  try {
    const { doctorId, patientId, startAt, endAt, duration = 30, excludeAppointmentId } = req.body;

    // Validate required fields
    if (!startAt) {
      return res.status(400).json({
        success: false,
        message: 'Start time is required',
        errorCode: 1011,
      });
    }

    const startTime = new Date(startAt);
    let endTime;

    if (endAt) {
      endTime = new Date(endAt);
    } else {
      // Calculate end time based on duration (in minutes)
      endTime = new Date(startTime.getTime() + duration * 60000);
    }

    // Validate times
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time format',
        errorCode: 1012,
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
        errorCode: 1013,
      });
    }

    // Results object
    const availability = {
      doctorAvailable: true,
      patientAvailable: true,
      conflicts: [],
      availableSlots: [],
      recommendations: []
    };

    // Check doctor availability
    if (doctorId) {
      const doctorQuery = {
        doctorId,
        status: { $nin: ['Cancelled', 'No-Show'] }, // Exclude cancelled appointments
        $or: [
          // Appointment starts during the requested time
          { startAt: { $gte: startTime, $lt: endTime } },
          // Appointment ends during the requested time
          { endAt: { $gt: startTime, $lte: endTime } },
          // Appointment spans the entire requested time
          { startAt: { $lte: startTime }, endAt: { $gte: endTime } }
        ]
      };

      // Exclude current appointment if editing
      if (excludeAppointmentId) {
        doctorQuery._id = { $ne: excludeAppointmentId };
      }

      const doctorConflicts = await Appointment.find(doctorQuery)
        .populate('patientId', 'firstName lastName phone')
        .populate('doctorId', 'firstName lastName')
        .lean();

      if (doctorConflicts.length > 0) {
        availability.doctorAvailable = false;
        availability.conflicts.push({
          type: 'doctor',
          message: `Doctor has ${doctorConflicts.length} appointment(s) during this time`,
          appointments: doctorConflicts.map(apt => ({
            id: apt._id,
            patientName: `${apt.patientId?.firstName || ''} ${apt.patientId?.lastName || ''}`.trim(),
            startAt: apt.startAt,
            endAt: apt.endAt,
            status: apt.status,
            type: apt.appointmentType
          }))
        });
      }

      // Find available time slots if doctor is not available
      if (!availability.doctorAvailable) {
        const dayStart = new Date(startTime);
        dayStart.setHours(9, 0, 0, 0); // Clinic opens at 9 AM
        const dayEnd = new Date(startTime);
        dayEnd.setHours(17, 0, 0, 0); // Clinic closes at 5 PM

        const allAppointments = await Appointment.find({
          doctorId,
          startAt: { $gte: dayStart, $lt: dayEnd },
          status: { $nin: ['Cancelled', 'No-Show'] }
        }).sort({ startAt: 1 }).lean();

        // Find gaps between appointments
        const slots = [];
        let currentTime = dayStart;

        for (const apt of allAppointments) {
          const aptStart = new Date(apt.startAt);
          const aptEnd = apt.endAt ? new Date(apt.endAt) : new Date(aptStart.getTime() + 30 * 60000);

          // Check if there's a gap before this appointment
          const gapMinutes = (aptStart - currentTime) / 60000;
          if (gapMinutes >= duration) {
            slots.push({
              startAt: new Date(currentTime),
              endAt: new Date(aptStart),
              durationMinutes: gapMinutes
            });
          }

          currentTime = aptEnd > currentTime ? aptEnd : currentTime;
        }

        // Check if there's time after the last appointment
        const finalGap = (dayEnd - currentTime) / 60000;
        if (finalGap >= duration) {
          slots.push({
            startAt: new Date(currentTime),
            endAt: new Date(dayEnd),
            durationMinutes: finalGap
          });
        }

        availability.availableSlots = slots.slice(0, 5); // Return top 5 slots
      }
    }

    // Check patient availability
    if (patientId) {
      const patientQuery = {
        patientId,
        status: { $nin: ['Cancelled', 'No-Show'] },
        $or: [
          { startAt: { $gte: startTime, $lt: endTime } },
          { endAt: { $gt: startTime, $lte: endTime } },
          { startAt: { $lte: startTime }, endAt: { $gte: endTime } }
        ]
      };

      if (excludeAppointmentId) {
        patientQuery._id = { $ne: excludeAppointmentId };
      }

      const patientConflicts = await Appointment.find(patientQuery)
        .populate('doctorId', 'firstName lastName')
        .lean();

      if (patientConflicts.length > 0) {
        availability.patientAvailable = false;
        availability.conflicts.push({
          type: 'patient',
          message: `Patient has ${patientConflicts.length} appointment(s) during this time`,
          appointments: patientConflicts.map(apt => ({
            id: apt._id,
            doctorName: `Dr. ${apt.doctorId?.firstName || ''} ${apt.doctorId?.lastName || ''}`.trim(),
            startAt: apt.startAt,
            endAt: apt.endAt,
            status: apt.status,
            type: apt.appointmentType
          }))
        });
      }
    }

    // Add recommendations
    if (!availability.doctorAvailable || !availability.patientAvailable) {
      availability.recommendations.push(
        'Consider selecting a different time slot',
        'Review the suggested available slots below',
        'Contact the patient/doctor to reschedule existing appointments'
      );
    }

    // Overall availability status
    availability.isAvailable = availability.doctorAvailable && availability.patientAvailable;

    console.log("✅ Availability check completed:", availability.isAvailable);

    res.status(200).json({
      success: true,
      availability,
      requestedTime: {
        startAt: startTime,
        endAt: endTime,
        duration: Math.round((endTime - startTime) / 60000)
      }
    });

  } catch (err) {
    console.error('💥 Availability check error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      errorCode: 5009,
    });
  }
});

// -----------------------------
// GET DOCTOR'S SCHEDULE
// GET /api/appointments/doctor/:doctorId/schedule?date=YYYY-MM-DD
// -----------------------------
router.get('/doctor/:doctorId/schedule', auth, async (req, res) => {
  console.log("📥 GET doctor schedule:", req.params.doctorId, req.query);
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (YYYY-MM-DD format)',
        errorCode: 1014,
      });
    }

    // Parse date and set time range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all appointments for this doctor on this date
    const appointments = await Appointment.find({
      doctorId,
      startAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'No-Show'] }
    })
      .populate('patientId', 'firstName lastName phone gender dateOfBirth')
      .sort({ startAt: 1 })
      .lean();

    // Calculate schedule statistics
    const schedule = {
      date,
      totalAppointments: appointments.length,
      appointments: appointments.map(apt => {
        const endAt = apt.endAt || new Date(new Date(apt.startAt).getTime() + 30 * 60000);
        return {
          id: apt._id,
          patientName: `${apt.patientId?.firstName || ''} ${apt.patientId?.lastName || ''}`.trim(),
          patientPhone: apt.patientId?.phone,
          patientGender: apt.patientId?.gender,
          startAt: apt.startAt,
          endAt: endAt,
          duration: Math.round((endAt - new Date(apt.startAt)) / 60000),
          type: apt.appointmentType,
          status: apt.status,
          location: apt.location
        };
      }),
      busySlots: [],
      freeSlots: []
    };

    // Define working hours (9 AM to 5 PM)
    const workStart = new Date(startOfDay);
    workStart.setHours(9, 0, 0, 0);
    const workEnd = new Date(startOfDay);
    workEnd.setHours(17, 0, 0, 0);

    // Calculate busy and free slots
    let currentTime = workStart;

    for (const apt of appointments) {
      const aptStart = new Date(apt.startAt);
      const aptEnd = apt.endAt ? new Date(apt.endAt) : new Date(aptStart.getTime() + 30 * 60000);

      // Free slot before this appointment
      if (currentTime < aptStart) {
        schedule.freeSlots.push({
          startAt: new Date(currentTime),
          endAt: new Date(aptStart),
          durationMinutes: Math.round((aptStart - currentTime) / 60000)
        });
      }

      // Busy slot for this appointment
      schedule.busySlots.push({
        startAt: aptStart,
        endAt: aptEnd,
        durationMinutes: Math.round((aptEnd - aptStart) / 60000),
        appointmentId: apt._id
      });

      currentTime = aptEnd > currentTime ? aptEnd : currentTime;
    }

    // Final free slot after last appointment
    if (currentTime < workEnd) {
      schedule.freeSlots.push({
        startAt: new Date(currentTime),
        endAt: new Date(workEnd),
        durationMinutes: Math.round((workEnd - currentTime) / 60000)
      });
    }

    // Calculate utilization percentage
    const totalWorkMinutes = (workEnd - workStart) / 60000;
    const totalBusyMinutes = schedule.busySlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);
    schedule.utilizationPercentage = totalWorkMinutes > 0
      ? Math.round((totalBusyMinutes / totalWorkMinutes) * 100)
      : 0;

    console.log("✅ Doctor schedule retrieved successfully");

    res.status(200).json({
      success: true,
      schedule
    });

  } catch (err) {
    console.error('💥 Get doctor schedule error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor schedule',
      errorCode: 5010,
    });
  }
});

module.exports = router;
