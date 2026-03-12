/**
 * bot/contextBuilder.js
 * Enhanced context builder for fetching relevant data based on intent and role
 */

/**
 * Build enhanced context based on user role, intent, and entity
 * @param {string} entity - Extracted entity (patient name, etc.)
 * @param {string} userRole - User role (doctor, admin, pharmacist, pathologist)
 * @param {string} intent - Extracted intent
 * @param {string} userId - User ID
 * @returns {Promise<object>} Enhanced context object
 */
async function buildEnhancedContext(entity, userRole, intent, userId) {
  const context = {
    role: userRole,
    intent: intent,
    data: {},
    summary: []
  };

  try {
    // Route to appropriate context builder based on role
    if (userRole === 'doctor') {
      await buildDoctorContext(context, entity, intent);
    } else if (userRole === 'admin') {
      await buildAdminContext(context, entity, intent);
    } else if (userRole === 'pharmacist') {
      await buildPharmacistContext(context, entity, intent);
    } else if (userRole === 'pathologist') {
      await buildPathologistContext(context, entity, intent);
    }
  } catch (err) {
    console.error('[buildEnhancedContext] Error:', err);
    context.error = 'Some context data unavailable';
  }

  return context;
}

/**
 * Build context for doctor role
 */
async function buildDoctorContext(context, entity, intent) {
  const Appointment = require('../../Models').Appointment;
  const Patient = require('../../Models').Patient;
  const LabReport = require('../../Models').LabReport;
  const LabReportDocument = require('../../Models').LabReportDocument;
  const MedicalHistoryDocument = require('../../Models').MedicalHistoryDocument;
  const PrescriptionDocument = require('../../Models').PrescriptionDocument;
  const Billing = require('../../Models').Billing;
  
  // Handle appointments queries
  if (intent === 'appointments' || intent === 'appointments_today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointments = await Appointment.find({
      startAt: { $gte: today, $lt: tomorrow }
    }).populate('patientId', 'firstName lastName phone email age gender bloodGroup')
      .populate('doctorId', 'firstName lastName')
      .sort({ startAt: 1 }).lean();
    
    if (appointments && appointments.length > 0) {
      context.data.todayAppointments = appointments.map(a => ({
        appointmentId: a._id,
        patient: a.patientId ? `${a.patientId.firstName} ${a.patientId.lastName}` : 'Unknown',
        patientAge: a.patientId?.age,
        patientGender: a.patientId?.gender,
        patientPhone: a.patientId?.phone,
        doctor: a.doctorId ? `${a.doctorId.firstName} ${a.doctorId.lastName}` : 'Unknown',
        time: a.startAt,
        type: a.appointmentType,
        status: a.status,
        location: a.location,
        notes: a.notes
      }));
      context.summary.push(`${appointments.length} appointment(s) scheduled today`);
    } else {
      context.data.todayAppointments = [];
      context.summary.push('No appointments scheduled for today');
    }
  }
  
  // Handle specific patient queries
  if (entity && (intent === 'patient_info' || intent.includes('patient') || intent === 'vitals' || intent === 'allergies' || intent === 'prescriptions')) {
    const patient = await findPatient(entity);
    
    if (patient) {
      context.data.patientInfo = {
        patientId: patient._id,
        name: `${patient.firstName} ${patient.lastName}`,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        email: patient.email,
        vitals: patient.vitals,
        allergies: patient.allergies,
        prescriptions: patient.prescriptions?.slice(0, 5)
      };
      context.summary.push(`Found patient: ${patient.firstName} ${patient.lastName}`);
      
      // Get appointments for this patient
      const appointments = await Appointment.find({ patientId: patient._id })
        .populate('doctorId', 'firstName lastName')
        .limit(10).sort({ startAt: -1 }).lean();
      
      if (appointments && appointments.length > 0) {
        context.data.patientAppointments = appointments.map(a => ({
          date: a.startAt,
          doctor: a.doctorId ? `${a.doctorId.firstName} ${a.doctorId.lastName}` : 'Unknown',
          type: a.appointmentType,
          status: a.status,
          notes: a.notes,
          vitals: a.vitals
        }));
        context.summary.push(`${appointments.length} appointment(s) on record`);
      }
      
      // Get medical history
      const medicalHistory = await MedicalHistoryDocument.find({ patientId: patient._id })
        .limit(10).sort({ createdAt: -1 }).lean();
      
      if (medicalHistory && medicalHistory.length > 0) {
        context.data.medicalHistory = medicalHistory.map(h => ({
          type: h.medicalType,
          date: h.date || h.recordDate,
          hospitalName: h.hospitalName,
          doctorName: h.doctorName,
          department: h.department,
          diagnosis: h.diagnosis,
          chronicConditions: h.chronicConditions,
          surgicalHistory: h.surgicalHistory,
          medications: h.medications,
          allergies: h.allergies,
          doctorNotes: h.doctorNotes
        }));
        context.summary.push(`${medicalHistory.length} medical history record(s)`);
      }
      
      // Get prescription documents
      const prescriptionDocs = await PrescriptionDocument.find({ patientId: patient._id })
        .limit(10).sort({ createdAt: -1 }).lean();
      
      if (prescriptionDocs && prescriptionDocs.length > 0) {
        context.data.prescriptionDocuments = prescriptionDocs.map(p => ({
          date: p.date || p.prescriptionDate,
          doctorName: p.doctorName,
          medicines: p.medicines,
          diagnosis: p.diagnosis
        }));
        context.summary.push(`${prescriptionDocs.length} prescription document(s)`);
      }
      
      // Get lab reports
      const reports = await LabReport.find({ patientId: patient._id })
        .limit(10).sort({ createdAt: -1 }).lean();
      const reportDocs = await LabReportDocument.find({ patientId: patient._id })
        .limit(10).sort({ createdAt: -1 }).lean();
      
      if (reports && reports.length > 0) {
        context.data.labReports = reports.map(r => ({
          reportId: r._id,
          testName: r.testName || r.testType,
          status: r.status,
          date: r.reportDate || r.createdAt,
          results: r.results
        }));
        context.summary.push(`${reports.length} lab report(s) available`);
      }
      
      if (reportDocs && reportDocs.length > 0) {
        context.data.labReportDocuments = reportDocs.map(r => ({
          testType: r.testType,
          reportDate: r.reportDate,
          results: r.results
        }));
        context.summary.push(`${reportDocs.length} scanned lab report(s) available`);
      }
    }
  }
  
  // Handle lab report queries
  if (intent === 'lab_reports' || intent === 'pending_labs' || intent.includes('lab')) {
    let query = {};
    
    if (intent === 'pending_labs') {
      query.status = { $in: ['pending', 'Pending', 'in-progress', 'processing'] };
    } else if (entity) {
      const patient = await findPatient(entity);
      if (patient) {
        query.patientId = patient._id;
      }
    }
    
    const reports = await LabReport.find(query)
      .populate('patientId', 'firstName lastName age gender')
      .limit(20).sort({ createdAt: -1 }).lean();
    
    if (reports && reports.length > 0) {
      context.data.labReports = reports.map(r => ({
        patient: r.patientId ? `${r.patientId.firstName} ${r.patientId.lastName}` : r.patientName,
        testName: r.testName || r.testType,
        status: r.status,
        priority: r.priority,
        date: r.reportDate || r.createdAt,
        results: r.results
      }));
      context.summary.push(`${reports.length} lab report(s) found`);
    } else {
      context.summary.push('No lab reports found');
    }
  }
  
  // Handle billing queries
  if (intent === 'billing' && entity) {
    const patient = await findPatient(entity);
    if (patient) {
      const billings = await Billing.find({ patientId: patient._id })
        .limit(10).sort({ createdAt: -1 }).lean();
      
      if (billings && billings.length > 0) {
        context.data.billings = billings.map(b => ({
          billNumber: b.billNumber,
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          balanceAmount: b.balanceAmount,
          status: b.status
        }));
        context.summary.push(`${billings.length} billing record(s) found`);
      }
    }
  }
}

/**
 * Build context for admin role
 */
async function buildAdminContext(context, entity, intent) {
  const User = require('../../Models').User;
  
  const staffCount = await User.countDocuments({ role: 'staff' });
  const doctorCount = await User.countDocuments({ role: 'doctor' });
  
  context.data.staffMetrics = {
    totalStaff: staffCount,
    totalDoctors: doctorCount
  };
  context.summary.push(`Hospital has ${doctorCount} doctor(s) and ${staffCount} staff member(s)`);
}

/**
 * Build context for pharmacist role
 */
async function buildPharmacistContext(context, entity, intent) {
  if (entity) {
    const Medicine = require('../../Models').Medicine;
    const medicine = await Medicine.findOne({
      name: new RegExp(entity, 'i')
    }).lean();
    
    if (medicine) {
      context.data.medicineInfo = {
        name: medicine.name,
        stock: medicine.stock || medicine.quantity,
        expiryDate: medicine.expiryDate,
        supplier: medicine.supplier
      };
      context.summary.push(`Medicine "${medicine.name}" found in inventory`);
    }
  }
}

/**
 * Build context for pathologist role
 */
async function buildPathologistContext(context, entity, intent) {
  if (entity) {
    const Report = require('../../Models').Report;
    const reports = await Report.find({
      $or: [
        { patientName: new RegExp(entity, 'i') },
        { patientCode: new RegExp(entity, 'i') }
      ]
    }).limit(3).sort({ createdAt: -1 }).lean();
    
    if (reports && reports.length > 0) {
      context.data.recentReports = reports.map(r => ({
        testName: r.testName,
        result: r.result,
        date: r.createdAt,
        status: r.status
      }));
      context.summary.push(`Found ${reports.length} recent lab report(s)`);
    }
  }
}

/**
 * Find patient by various identifiers
 */
async function findPatient(entity) {
  const Patient = require('../../Models').Patient;
  const safe = entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRegex = new RegExp(safe, "i");
  
  // Search by ID, name, phone, email, telegram username
  let patient = await Patient.findOne({
    $or: [
      { _id: entity },
      { firstName: nameRegex },
      { lastName: nameRegex },
      { email: nameRegex },
      { phone: entity },
      { phone: nameRegex },
      { telegramUsername: nameRegex },
    ]
  }).lean();
  
  // Try split name search if not found
  if (!patient && entity.includes(' ')) {
    const nameParts = entity.split(' ').filter(Boolean);
    if (nameParts.length >= 2) {
      const firstNameRegex = new RegExp(nameParts[0], "i");
      const lastNameRegex = new RegExp(nameParts.slice(1).join(' '), "i");
      
      patient = await Patient.findOne({
        firstName: firstNameRegex,
        lastName: lastNameRegex
      }).lean();
    }
  }
  
  return patient;
}

module.exports = {
  buildEnhancedContext
};
