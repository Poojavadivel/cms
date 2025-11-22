// routes/properReports.js
// PROPER PDF reports using pdfmake
const express = require('express');
const router = express.Router();
const Patient = require('../Models/Patient');
const User = require('../Models/User');
const Staff = require('../Models/Staff');
const Appointment = require('../Models/Appointment');
const auth = require('../middleware/auth');
const properPdfGen = require('../utils/properPdfGenerator');

// Patient Medical Report
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Fetch patient
    const patient = await Patient.findById(patientId).lean();
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();

    // Fetch doctor
    let doctor = null;
    if (patient.doctorId) {
      doctor = await User.findById(patient.doctorId).lean();
      if (!doctor) {
        const staff = await Staff.findById(patient.doctorId).lean();
        if (staff) {
          doctor = {
            name: staff.name,
            specialization: staff.designation
          };
        }
      } else {
        doctor.name = `${doctor.firstName} ${doctor.lastName || ''}`.trim();
      }
    }

    // Fetch appointments
    const appointments = await Appointment.find({ patientId })
      .sort({ startAt: -1 })
      .limit(20)
      .lean();

    // Generate PDF
    const docDefinition = properPdfGen.generatePatientReport(patient, doctor, appointments);
    
    // Set response headers
    const filename = `${patientName.replace(/\s+/g, '_')}_Medical_Report_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream PDF using browser-compatible approach
    const PdfPrinter = require('pdfmake');
    const vfsFonts = require('pdfmake/build/vfs_fonts');
    
    const printer = new PdfPrinter({
      Roboto: {
        normal: Buffer.from(vfsFonts['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(vfsFonts['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(vfsFonts['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(vfsFonts['Roboto-MediumItalic.ttf'], 'base64')
      }
    });
    
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('Error generating patient report:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate report',
        error: error.message 
      });
    }
  }
});

// Doctor Weekly Report
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Fetch doctor
    let doctor = await User.findById(doctorId).lean();
    if (!doctor) {
      const staff = await Staff.findById(doctorId).lean();
      if (staff) {
        doctor = {
          _id: staff._id,
          firstName: staff.name.split(' ')[0] || staff.name,
          lastName: staff.name.split(' ').slice(1).join(' ') || '',
          email: staff.email,
          phone: staff.phone,
          specialization: staff.designation
        };
      }
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const doctorName = `${doctor.firstName} ${doctor.lastName || ''}`.trim();

    console.log(`\n[Proper Report] Original Doctor ID: ${doctorId}`);
    
    // SMART ID RESOLUTION
    let queryDoctorId = doctorId;
    
    // Check if doctor is from Staff, then find User
    const isFromUser = await User.findById(doctorId).select('_id').lean();
    if (!isFromUser && doctor.email) {
      console.log(`[Proper Report] Staff ID detected - searching for User...`);
      const userDoctor = await User.findOne({ 
        email: doctor.email, 
        role: 'doctor' 
      }).select('_id').lean();
      
      if (userDoctor) {
        queryDoctorId = userDoctor._id;
        console.log(`[Proper Report] ✅ Using User ID: ${queryDoctorId}`);
      }
    }
    
    // Fetch patients using RESOLVED doctor ID
    const patients = await Patient.find({ 
      doctorId: queryDoctorId, 
      deleted_at: null 
    })
    .select('firstName lastName age gender bloodGroup phone email address vitals allergies createdAt')
    .lean();
    
    console.log(`[Proper Report] Found ${patients.length} patients for doctorId: ${queryDoctorId}`);

    // Fetch ALL appointments using RESOLVED doctor ID
    const totalAppointments = await Appointment.find({ doctorId: queryDoctorId })
      .select('appointmentCode patientId startAt endAt appointmentType status location notes')
      .populate('patientId', 'firstName lastName phone')
      .sort({ startAt: -1 })
      .lean();
    
    console.log(`[Proper Report] Total appointments found: ${totalAppointments.length}`);

    // Filter weekly appointments (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekAppointments = totalAppointments.filter(apt => 
      new Date(apt.startAt) >= weekAgo
    );
    
    console.log(`[Proper Report] Weekly appointments found: ${weekAppointments.length}`);

    // Add patient names to both appointment lists
    [...weekAppointments, ...totalAppointments].forEach(apt => {
      if (apt.patientId) {
        if (typeof apt.patientId === 'object' && apt.patientId.firstName) {
          // Already populated
          apt.patientName = `${apt.patientId.firstName} ${apt.patientId.lastName || ''}`.trim();
        } else {
          // Find from patients array
          const patient = patients.find(p => p._id.toString() === (apt.patientId?._id?.toString() || apt.patientId?.toString() || apt.patientId));
          apt.patientName = patient ? `${patient.firstName} ${patient.lastName || ''}`.trim() : 'Unknown Patient';
        }
      } else {
        apt.patientName = 'Unknown Patient';
      }
    });

    // Get active patients (patients with upcoming appointments)
    const now = new Date();
    
    // DEBUG: Check if doctorId exists in appointments collection
    const anyAppointment = await Appointment.findOne().select('doctorId').lean();
    console.log(`[Doctor Report] Sample appointment doctorId: ${anyAppointment?.doctorId}`);
    
    const upcomingAppointmentsGrouped = await Appointment.aggregate([
      {
        $match: {
          doctorId: queryDoctorId,
          startAt: { $gt: now },
          status: { $in: ['Scheduled', 'scheduled', 'confirmed'] }
        }
      },
      {
        $sort: { startAt: 1 }
      },
      {
        $group: {
          _id: '$patientId',
          nextAppointment: { $first: '$startAt' },
          appointmentId: { $first: '$_id' }
        }
      }
    ]);
    
    console.log(`[Doctor Report] Active patients (with upcoming appointments): ${upcomingAppointmentsGrouped.length}`);

    const activePatientIds = upcomingAppointmentsGrouped.map(a => a._id);
    const activePatientsData = await Patient.find({ _id: { $in: activePatientIds } })
      .select('firstName lastName age gender bloodGroup phone')
      .lean();

    // Merge appointment data with patient data - Create clean objects for PDF
    const activePatients = activePatientsData.map(patient => {
      const appointmentData = upcomingAppointmentsGrouped.find(a => a._id === patient._id);
      // Return clean object without MongoDB _id to avoid pdfmake conflicts
      return {
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        age: patient.age,
        gender: patient.gender || '',
        bloodGroup: patient.bloodGroup || '',
        phone: patient.phone || '',
        nextAppointment: appointmentData?.nextAppointment
      };
    }).sort((a, b) => new Date(a.nextAppointment) - new Date(b.nextAppointment));

    // Generate PDF with complete data
    console.log(`[Doctor Report] Generating PDF with:`);
    console.log(`  - Patients: ${patients.length}`);
    console.log(`  - Week Appointments: ${weekAppointments.length}`);
    console.log(`  - Total Appointments: ${totalAppointments.length}`);
    console.log(`  - Active Patients: ${activePatients.length}`);
    
    const docDefinition = properPdfGen.generateDoctorReport(doctor, patients, weekAppointments, totalAppointments, activePatients);
    
    // Set response headers
    const filename = `${doctorName.replace(/\s+/g, '_')}_Performance_Report_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream PDF
    const PdfPrinter = require('pdfmake');
    const vfsFonts = require('pdfmake/build/vfs_fonts');
    
    const printer = new PdfPrinter({
      Roboto: {
        normal: Buffer.from(vfsFonts['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(vfsFonts['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(vfsFonts['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(vfsFonts['Roboto-MediumItalic.ttf'], 'base64')
      }
    });
    
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(res);
    pdfDoc.end();

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

// Staff Report
router.get('/staff/:staffId', auth, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Fetch staff member
    const staff = await Staff.findById(staffId).lean();
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const staffName = staff.name || 'Unknown';

    // Generate PDF with staff information
    const docDefinition = properPdfGen.generateStaffReport(staff);
    
    // Set response headers
    const filename = `${staffName.replace(/\s+/g, '_')}_Staff_Report_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream PDF
    const PdfPrinter = require('pdfmake');
    const vfsFonts = require('pdfmake/build/vfs_fonts');
    
    const printer = new PdfPrinter({
      Roboto: {
        normal: Buffer.from(vfsFonts['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(vfsFonts['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(vfsFonts['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(vfsFonts['Roboto-MediumItalic.ttf'], 'base64')
      }
    });
    
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('Error generating staff report:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate staff report',
        error: error.message
      });
    }
  }
});

module.exports = router;
