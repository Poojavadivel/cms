// routes/reports.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const auth = require('../Middleware/Auth');
const { Patient, Appointment, User, Staff } = require('../Models');
const pdfGenerator = require('../utils/pdfGenerator');

// -------------------------
// PATIENT REPORT
// -------------------------
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Fetch patient data
    const patient = await Patient.findById(patientId).lean();
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    // Fetch patient's appointments
    const appointments = await Appointment.find({ patientId })
      .sort({ appointmentDate: -1 })
      .limit(20)
      .lean();

    // Fetch doctor information if assigned
    let doctor = null;
    if (patient.doctorId) {
      doctor = await User.findById(patient.doctorId).lean();
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Patient Report - ${patient.firstName} ${patient.lastName || ''}`,
        Author: 'MoviLabs HMS',
        Subject: 'Patient Medical Report',
        Creator: 'Karur Gastro Foundation'
      }
    });

    // Set response headers
    const patientName = `${patient.firstName}_${patient.lastName || 'Report'}`.replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${patientName}_Report_${Date.now()}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    pdfGenerator.addHeader(doc, 'Patient Medical Report');

    // Patient Information Section
    pdfGenerator.addSectionHeader(doc, 'Patient Information', '👤');
    
    pdfGenerator.addInfoRow(doc, 'Patient ID', patient._id?.toString() || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Full Name', `${patient.firstName} ${patient.lastName || ''}`);
    pdfGenerator.addInfoRow(doc, 'Age', patient.age?.toString() || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Gender', patient.gender || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Blood Group', patient.bloodGroup || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Phone', patient.phone || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Email', patient.email || 'N/A');
    
    // Address
    if (patient.address) {
      const addressParts = [];
      if (patient.address.houseNo) addressParts.push(patient.address.houseNo);
      if (patient.address.street) addressParts.push(patient.address.street);
      if (patient.address.line1) addressParts.push(patient.address.line1);
      if (patient.address.city) addressParts.push(patient.address.city);
      if (patient.address.state) addressParts.push(patient.address.state);
      if (patient.address.pincode) addressParts.push(patient.address.pincode);
      
      if (addressParts.length > 0) {
        pdfGenerator.addInfoRow(doc, 'Address', addressParts.join(', '));
      }
    }

    pdfGenerator.addInfoRow(doc, 'Registration Date', 
      patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'
    );

    doc.y += 10;

    // Assigned Doctor Section
    if (doctor) {
      pdfGenerator.addSectionHeader(doc, 'Assigned Doctor', '⚕️');
      pdfGenerator.addInfoRow(doc, 'Doctor Name', doctor.name || 'N/A');
      pdfGenerator.addInfoRow(doc, 'Specialization', doctor.specialization || 'N/A');
      pdfGenerator.addInfoRow(doc, 'Contact', doctor.email || doctor.phone || 'N/A');
    }

    // Vitals Section
    if (patient.vitals) {
      pdfGenerator.addSectionHeader(doc, 'Vital Signs', '❤️');
      
      if (patient.vitals.heightCm) {
        pdfGenerator.addInfoRow(doc, 'Height', `${patient.vitals.heightCm} cm`);
      }
      if (patient.vitals.weightKg) {
        pdfGenerator.addInfoRow(doc, 'Weight', `${patient.vitals.weightKg} kg`);
      }
      if (patient.vitals.bmi) {
        pdfGenerator.addInfoRow(doc, 'BMI', patient.vitals.bmi.toString());
      }
      if (patient.vitals.bp) {
        pdfGenerator.addInfoRow(doc, 'Blood Pressure', patient.vitals.bp);
      }
      if (patient.vitals.pulse) {
        pdfGenerator.addInfoRow(doc, 'Pulse', `${patient.vitals.pulse} bpm`);
      }
      if (patient.vitals.temp) {
        pdfGenerator.addInfoRow(doc, 'Temperature', `${patient.vitals.temp}°F`);
      }
      if (patient.vitals.spo2) {
        pdfGenerator.addInfoRow(doc, 'SpO2', `${patient.vitals.spo2}%`);
      }
    }

    // Medical History
    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      pdfGenerator.addSectionHeader(doc, 'Medical History', '📋');
      
      patient.medicalHistory.forEach((condition, index) => {
        doc.fontSize(11)
           .fillColor('#1f2937')
           .text(`${index + 1}. ${condition}`, 60, doc.y);
        doc.y += 18;
      });
    }

    // Allergies
    if (patient.allergies && patient.allergies.length > 0) {
      pdfGenerator.addSectionHeader(doc, 'Known Allergies', '⚠️');
      
      patient.allergies.forEach((allergy, index) => {
        doc.fontSize(11)
           .fillColor('#dc2626')
           .text(`${index + 1}. ${allergy}`, 60, doc.y);
        doc.y += 18;
      });
    }

    // Appointment History
    if (appointments.length > 0) {
      pdfGenerator.checkPageBreak(doc, 150);
      pdfGenerator.addSectionHeader(doc, 'Appointment History', '📅');

      // Statistics
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
      const upcomingAppointments = appointments.filter(a => 
        a.status === 'scheduled' && new Date(a.appointmentDate) > new Date()
      ).length;

      pdfGenerator.addStatsCards(doc, [
        { label: 'Total', value: totalAppointments },
        { label: 'Completed', value: completedAppointments },
        { label: 'Upcoming', value: upcomingAppointments },
        { label: 'Cancelled', value: cancelledAppointments }
      ]);

      // Appointments table
      const headers = ['Date', 'Time', 'Reason', 'Status'];
      const rows = appointments.slice(0, 15).map(apt => [
        new Date(apt.appointmentDate).toLocaleDateString(),
        apt.appointmentTime || 'N/A',
        (apt.reason || apt.chiefComplaint || 'General checkup').substring(0, 30),
        apt.status || 'scheduled'
      ]);

      pdfGenerator.addTable(doc, headers, rows, {
        columnWidths: [120, 80, 230, 100]
      });
    }

    // Summary Statistics
    pdfGenerator.addSectionHeader(doc, 'Summary', '📊');
    
    const lastVisit = appointments.length > 0 
      ? new Date(appointments[0].appointmentDate).toLocaleDateString()
      : 'No visits recorded';
    
    pdfGenerator.addInfoRow(doc, 'Last Visit', lastVisit);
    pdfGenerator.addInfoRow(doc, 'Total Visits', appointments.length.toString());
    pdfGenerator.addInfoRow(doc, 'Patient Status', patient.status || 'Active');

    // Finalize PDF with proper page numbers
    pdfGenerator.finalize(doc);

  } catch (error) {
    console.error('Error generating patient report:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate patient report',
        error: error.message 
      });
    }
  }
});

// -------------------------
// DOCTOR REPORT
// -------------------------
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Get date range (default: current week)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    // Try to fetch doctor data from both User and Staff collections
    // First try User collection (for authenticated doctors)
    let doctor = await User.findById(doctorId).lean();
    
    // If not found in User, try Staff collection
    if (!doctor) {
      const staff = await Staff.findById(doctorId).lean();
      if (staff) {
        // Convert Staff to doctor-like object
        doctor = {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.contact,
          specialization: staff.designation,
          qualification: staff.qualifications?.join(', ') || '',
          role: staff.roles?.includes('doctor') ? 'doctor' : staff.designation
        };
      }
    } else {
      // User collection format - add name field if not present
      if (!doctor.name) {
        doctor.name = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
      }
    }
    
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    console.log(`\n[Legacy Report] Original Doctor ID: ${doctorId}`);
    
    // SMART ID RESOLUTION
    let queryDoctorId = doctorId;
    
    // Try to find User by email if doctor is from Staff
    const isFromUser = await User.findById(doctorId).select('_id').lean();
    if (!isFromUser && doctor.email) {
      console.log(`[Legacy Report] Staff ID detected - searching for User...`);
      const userDoctor = await User.findOne({ 
        email: doctor.email, 
        role: 'doctor' 
      }).select('_id').lean();
      
      if (userDoctor) {
        queryDoctorId = userDoctor._id;
        console.log(`[Legacy Report] ✅ Using User ID: ${queryDoctorId}`);
      }
    }
    
    // Fetch patients using RESOLVED doctor ID
    const patients = await Patient.find({ 
      doctorId: queryDoctorId, 
      deleted_at: null 
    })
    .select('-__v')
    .lean();
    
    console.log(`[Legacy Report] Found ${patients.length} patients for doctor ${queryDoctorId}`);
    
    // Fetch all appointments for this doctor
    const allAppointments = await Appointment.find({ doctorId: queryDoctorId }).lean();
    console.log(`[Legacy Report] Found ${allAppointments.length} total appointments`);

    // Fetch appointments for this week (filter by startAt field)
    const appointments = allAppointments.filter(apt => 
      new Date(apt.startAt) >= startDate && 
      new Date(apt.startAt) <= endDate
    );
    console.log(`[Legacy Report] Found ${appointments.length} appointments this week`);

    // Calculate statistics
    const stats = {
      totalPatients: patients.length,
      weekAppointments: appointments.length,
      completedThisWeek: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
      cancelledThisWeek: appointments.filter(a => a.status?.toLowerCase() === 'cancelled').length,
      upcomingThisWeek: appointments.filter(a => 
        a.status?.toLowerCase() === 'scheduled' && new Date(a.startAt) > new Date()
      ).length,
      totalAppointments: allAppointments.length,
      totalCompleted: allAppointments.filter(a => a.status?.toLowerCase() === 'completed').length
    };

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Doctor Report - ${doctor.name}`,
        Author: 'MoviLabs HMS',
        Subject: 'Doctor Performance Report',
        Creator: 'Karur Gastro Foundation'
      }
    });

    // Set response headers
    const doctorName = doctor.name.replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doctorName}_Report_${Date.now()}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    pdfGenerator.addHeader(doc, 'Doctor Performance Report');

    // Doctor Information Section
    pdfGenerator.addSectionHeader(doc, 'Doctor Information', '⚕️');
    
    pdfGenerator.addInfoRow(doc, 'Doctor ID', doctor._id?.toString() || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Name', doctor.name || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Specialization', doctor.specialization || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Email', doctor.email || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Phone', doctor.phone || 'N/A');
    pdfGenerator.addInfoRow(doc, 'Qualification', doctor.qualification || 'N/A');
    
    doc.y += 20;

    // Report Period
    pdfGenerator.addSectionHeader(doc, 'Report Period', '📅');
    pdfGenerator.addInfoRow(doc, 'From', startDate.toLocaleDateString());
    pdfGenerator.addInfoRow(doc, 'To', endDate.toLocaleDateString());
    pdfGenerator.addInfoRow(doc, 'Duration', '7 Days (Current Week)');
    
    doc.y += 20;

    // Overall Statistics
    pdfGenerator.checkPageBreak(doc, 120);
    pdfGenerator.addSectionHeader(doc, 'Overall Statistics', '📊');

    pdfGenerator.addStatsCards(doc, [
      { label: 'Total Patients', value: stats.totalPatients },
      { label: 'This Week', value: stats.weekAppointments },
      { label: 'Completed', value: stats.completedThisWeek },
      { label: 'Upcoming', value: stats.upcomingThisWeek }
    ]);

    // Performance Metrics
    pdfGenerator.addSectionHeader(doc, 'Performance Metrics', '📈');
    
    const completionRate = stats.totalAppointments > 0 
      ? ((stats.totalCompleted / stats.totalAppointments) * 100).toFixed(1)
      : '0';
    
    const avgPatientsPerDay = (stats.weekAppointments / 7).toFixed(1);
    
    pdfGenerator.addInfoRow(doc, 'Total Appointments (All Time)', stats.totalAppointments.toString());
    pdfGenerator.addInfoRow(doc, 'Total Completed (All Time)', stats.totalCompleted.toString());
    pdfGenerator.addInfoRow(doc, 'Completion Rate', `${completionRate}%`);
    pdfGenerator.addInfoRow(doc, 'Average Patients/Day (This Week)', avgPatientsPerDay);
    pdfGenerator.addInfoRow(doc, 'Active Patients', stats.totalPatients.toString());

    // This Week's Appointments
    if (appointments.length > 0) {
      pdfGenerator.checkPageBreak(doc, 100);
      pdfGenerator.addSectionHeader(doc, 'This Week\'s Appointments', '📋');

      const headers = ['Date', 'Time', 'Patient', 'Reason', 'Status'];
      const rows = appointments.map(apt => {
        const patient = patients.find(p => p._id.toString() === (apt.patientId?.toString() || apt.patientId));
        const patientName = patient 
          ? `${patient.firstName} ${patient.lastName || ''}`.trim()
          : 'Unknown Patient';
        
        return [
          new Date(apt.startAt).toLocaleDateString(),
          new Date(apt.startAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          patientName.substring(0, 20),
          (apt.appointmentType || 'Consultation').substring(0, 25),
          apt.status || 'Scheduled'
        ];
      });

      pdfGenerator.addTable(doc, headers, rows, {
        columnWidths: [100, 70, 110, 130, 85],
        rowHeight: 25
      });
    } else {
      doc.fontSize(11)
         .fillColor('#6b7280')
         .text('No appointments scheduled for this week.', 60, doc.y);
      doc.y += 20;
    }

    // Daily Breakdown
    pdfGenerator.checkPageBreak(doc, 100);
    pdfGenerator.addSectionHeader(doc, 'Daily Breakdown (This Week)', '📆');

    const dailyStats = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString();
      dailyStats[dateStr] = { total: 0, completed: 0, cancelled: 0, scheduled: 0 };
    }

    appointments.forEach(apt => {
      const dateStr = new Date(apt.startAt).toLocaleDateString();
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total++;
        const status = apt.status?.toLowerCase() || 'scheduled';
        if (status === 'completed') dailyStats[dateStr].completed++;
        if (status === 'cancelled') dailyStats[dateStr].cancelled++;
        if (status === 'scheduled') dailyStats[dateStr].scheduled++;
      }
    });

    const dailyHeaders = ['Date', 'Total', 'Completed', 'Scheduled', 'Cancelled'];
    const dailyRows = Object.keys(dailyStats).map(date => [
      date,
      dailyStats[date].total.toString(),
      dailyStats[date].completed.toString(),
      dailyStats[date].scheduled.toString(),
      dailyStats[date].cancelled.toString()
    ]);

    pdfGenerator.addTable(doc, dailyHeaders, dailyRows, {
      columnWidths: [150, 85, 95, 95, 95]
    });

    // Top Patients (Most Visits)
    if (patients.length > 0) {
      pdfGenerator.checkPageBreak(doc, 100);
      pdfGenerator.addSectionHeader(doc, 'Active Patients (Sample)', '👥');

      const patientAppointmentCounts = patients.map(patient => {
        const count = allAppointments.filter(
          apt => apt.patientId?.toString() === patient._id.toString()
        ).length;
        return { patient, count };
      });

      patientAppointmentCounts.sort((a, b) => b.count - a.count);
      const topPatients = patientAppointmentCounts.slice(0, 10);

      const patientHeaders = ['Patient Name', 'Age', 'Gender', 'Total Visits'];
      const patientRows = topPatients.map(({ patient, count }) => [
        `${patient.firstName} ${patient.lastName || ''}`.trim().substring(0, 30),
        patient.age?.toString() || 'N/A',
        patient.gender || 'N/A',
        count.toString()
      ]);

      pdfGenerator.addTable(doc, patientHeaders, patientRows, {
        columnWidths: [220, 80, 100, 100]
      });
    }

    // Summary
    pdfGenerator.addSectionHeader(doc, 'Summary', '✅');

    doc.fontSize(11)
       .fillColor('#1f2937')
       .text(
         `Dr. ${doctor.name} has handled ${stats.weekAppointments} appointments this week ` +
         `with ${stats.completedThisWeek} completed consultations. The doctor has ${stats.totalPatients} ` +
         `active patients and maintains a ${completionRate}% completion rate overall.`,
         60,
         doc.y,
         { width: doc.page.width - 120, align: 'justify' }
       );

    // Finalize PDF with proper page numbers
    pdfGenerator.finalize(doc);

  } catch (error) {
    console.error('Error generating doctor report:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate doctor report',
        error: error.message 
      });
    }
  }
});

module.exports = router;
