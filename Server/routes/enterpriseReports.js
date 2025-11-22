// routes/enterpriseReports.js
// Enterprise-grade PDF reports for Karur Gastro Foundation
const express = require('express');
const router = express.Router();
const auth = require('../Middleware/Auth');
const { Patient, Appointment, User, Staff } = require('../Models');
const pdfGen = require('../utils/enterprisePdfGenerator');

// ===========================
// PATIENT MEDICAL REPORT
// ===========================
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

    // Fetch appointments
    const appointments = await Appointment.find({ patientId })
      .sort({ appointmentDate: -1 })
      .limit(25)
      .lean();

    // Fetch doctor
    let doctor = null;
    if (patient.doctorId) {
      doctor = await User.findById(patient.doctorId).lean();
    }

    // Create PDF document
    const patientName = `${patient.firstName} ${patient.lastName || ''}`;
    const doc = pdfGen.createDocument(
      `Medical Report - ${patientName}`,
      'Karur Gastro Foundation'
    );

    // Set response headers
    const filename = `${patient.firstName}_${patient.lastName || 'Report'}`
      .replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${filename}_Medical_Report_${Date.now()}.pdf"`);

    // Pipe to response
    doc.pipe(res);

    // Add header
    const refNumber = pdfGen.addHeader(doc, {
      title: 'Patient Medical Report',
      subtitle: 'Karur Gastro Foundation',
      reportType: 'Confidential Medical Document',
      showLogo: true
    });

    // ===== PATIENT INFORMATION SECTION =====
    pdfGen.addSectionHeader(doc, 'Patient Information', '', {
      color: pdfGen.colors.primary
    });

    // Basic Information
    pdfGen.addInfoRow(doc, 'Patient ID', patient._id?.toString(), { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Full Name', patientName, { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'First Name', patient.firstName || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Last Name', patient.lastName || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Date of Birth', 
      patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
      { labelWidth: 140 }
    );
    pdfGen.addInfoRow(doc, 'Age', `${patient.age || 'N/A'} years`, { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Gender', patient.gender || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Blood Group', patient.bloodGroup || 'Unknown', { labelWidth: 140 });

    // Contact information
    pdfGen.addSectionHeader(doc, 'Contact & Address Information', '', {
      color: pdfGen.colors.secondary,
      marginTop: 15
    });
    
    pdfGen.addInfoRow(doc, 'Phone Number', patient.phone || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Email Address', patient.email || 'N/A', { labelWidth: 140 });
    
    // Full address breakdown
    if (patient.address) {
      pdfGen.addInfoRow(doc, 'House Number', patient.address.houseNo || 'N/A', { labelWidth: 140 });
      pdfGen.addInfoRow(doc, 'Street', patient.address.street || 'N/A', { labelWidth: 140 });
      pdfGen.addInfoRow(doc, 'Address Line 1', patient.address.line1 || 'N/A', { labelWidth: 140 });
      pdfGen.addInfoRow(doc, 'City', patient.address.city || 'N/A', { labelWidth: 140 });
      pdfGen.addInfoRow(doc, 'State', patient.address.state || 'N/A', { labelWidth: 140 });
      pdfGen.addInfoRow(doc, 'Pincode', patient.address.pincode || 'N/A', { labelWidth: 140 });
      pdfGen.addInfoRow(doc, 'Country', patient.address.country || 'N/A', { labelWidth: 140 });
    } else {
      pdfGen.addInfoRow(doc, 'Address', 'Not Provided', { labelWidth: 140 });
    }
    
    // Telegram Integration (if available)
    if (patient.telegramUserId || patient.telegramUsername) {
      pdfGen.addSectionHeader(doc, 'Telegram Integration', '', {
        color: pdfGen.colors.accent,
        marginTop: 15
      });
      pdfGen.addInfoRow(doc, 'Telegram User ID', patient.telegramUserId || 'N/A', { labelWidth: 140 });
      pdfGen.addInfoRow(doc, 'Telegram Username', patient.telegramUsername || 'N/A', { labelWidth: 140 });
    }
    
    // Registration Information
    pdfGen.addSectionHeader(doc, 'Registration Details', '', {
      color: pdfGen.colors.accent,
      marginTop: 15
    });
    pdfGen.addInfoRow(doc, 'Registration Date', 
      patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN') + ' at ' + 
      new Date(patient.createdAt).toLocaleTimeString('en-IN') : 'N/A',
      { labelWidth: 140 }
    );
    pdfGen.addInfoRow(doc, 'Last Updated', 
      patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString('en-IN') + ' at ' + 
      new Date(patient.updatedAt).toLocaleTimeString('en-IN') : 'N/A',
      { labelWidth: 140 }
    );

    // Assigned doctor
    if (doctor) {
      pdfGen.addSectionHeader(doc, 'Assigned Doctor', '', {
        color: pdfGen.colors.secondary,
        marginTop: 15
      });
      
      const doctorName = doctor.name || `${doctor.firstName} ${doctor.lastName || ''}`;
      pdfGen.addInfoRow(doc, 'Doctor Name', doctorName, { labelWidth: 120 });
      pdfGen.addInfoRow(doc, 'Specialization', 
        doctor.specialization || doctor.metadata?.specialization || 'General Physician',
        { labelWidth: 120 }
      );
      pdfGen.addInfoRow(doc, 'Contact', doctor.phone || doctor.contact || 'N/A', { labelWidth: 120 });
    }

    // ===== VITALS SECTION =====
    pdfGen.addSectionHeader(doc, 'Vital Signs & Measurements', '', {
      color: pdfGen.colors.primary,
      marginTop: 20
    });

    // Vitals in cards (using actual field names from schema)
    const vitalsStats = [
      { 
        icon: '', 
        value: patient.vitals?.bp || 'Not Recorded', 
        label: 'Blood Pressure',
        color: pdfGen.colors.danger
      },
      { 
        icon: '', 
        value: patient.vitals?.pulse ? `${patient.vitals.pulse} bpm` : 'Not Recorded', 
        label: 'Pulse Rate',
        color: pdfGen.colors.secondary
      },
      { 
        icon: '', 
        value: patient.vitals?.temp ? `${patient.vitals.temp}°C` : 'Not Recorded', 
        label: 'Temperature',
        color: pdfGen.colors.warning
      },
      { 
        icon: '', 
        value: patient.vitals?.spo2 ? `${patient.vitals.spo2}%` : 'Not Recorded', 
        label: 'SpO2 Level',
        color: pdfGen.colors.success
      },
      { 
        icon: '', 
        value: patient.vitals?.heightCm ? `${patient.vitals.heightCm} cm` : 'Not Recorded', 
        label: 'Height',
        color: pdfGen.colors.accent
      },
      { 
        icon: '', 
        value: patient.vitals?.weightKg ? `${patient.vitals.weightKg} kg` : 'Not Recorded', 
        label: 'Weight',
        color: pdfGen.colors.accent
      },
      { 
        icon: '', 
        value: patient.vitals?.bmi ? patient.vitals.bmi.toFixed(1) : 'Not Calculated', 
        label: 'BMI',
        color: pdfGen.colors.secondary
      }
    ];

    pdfGen.addStatsCards(doc, vitalsStats.slice(0, 4), { cardsPerRow: 4 });
    if (vitalsStats.length > 4) {
      pdfGen.addStatsCards(doc, vitalsStats.slice(4), { cardsPerRow: 3 });
    }
    
    // Detailed vitals note
    const noteText = 'All vital signs are recorded as per latest consultation. Values marked as "Not Recorded" were not measured during last visit.';
    const noteHeight = doc.heightOfString(noteText, { width: doc.page.width - 100, fontSize: pdfGen.fonts.small });
    doc.fontSize(pdfGen.fonts.small)
       .fillColor(pdfGen.colors.text.secondary)
       .text(noteText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
    doc.y += noteHeight + 8;

    // ===== ALLERGIES (CRITICAL - Patient Safety) =====
    if (patient.allergies && patient.allergies.length > 0) {
      pdfGen.addAlertBox(doc, 
        `⚠ ALLERGIES: ${patient.allergies.join(', ')}`,
        { type: 'danger', icon: '⚠' }
      );
    } else {
      pdfGen.addAlertBox(doc, 
        'No known allergies recorded.',
        { type: 'success', icon: '✓' }
      );
    }

    // ===== PRESCRIPTIONS =====
    if (patient.prescriptions && patient.prescriptions.length > 0) {
      pdfGen.addSectionHeader(doc, 'Prescription History', '', {
        color: pdfGen.colors.primary,
        marginTop: 15
      });

      patient.prescriptions.slice(0, 5).forEach((prescription, index) => {
        const medicineCount = prescription.medicines?.length || 0;
        const estimatedHeight = 60 + (medicineCount * 18);
        pdfGen.checkPageBreak(doc, estimatedHeight);
        
        doc.fontSize(pdfGen.fonts.body)
           .fillColor(pdfGen.colors.text.primary)
           .text(`Prescription ${index + 1}:`, pdfGen.margins.page.left, doc.y);
        doc.y += 6;
        
        pdfGen.addInfoRow(doc, '  Prescription ID', prescription.prescriptionId || 'N/A', { labelWidth: 140 });
        pdfGen.addInfoRow(doc, '  Issued Date', 
          prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleDateString('en-IN') : 'N/A',
          { labelWidth: 140 }
        );
        pdfGen.addInfoRow(doc, '  Notes', prescription.notes || 'None', { labelWidth: 140 });
        
        if (prescription.medicines && prescription.medicines.length > 0) {
          doc.fontSize(pdfGen.fonts.small)
             .fillColor(pdfGen.colors.text.secondary)
             .text('  Medicines:', pdfGen.margins.page.left, doc.y);
          doc.y += 4;
          
          prescription.medicines.forEach((med, medIndex) => {
            const medText = `    ${medIndex + 1}. ${med.name || 'N/A'} - ${med.dosage || 'N/A'}, ${med.frequency || 'N/A'}, ${med.duration || 'N/A'} (Qty: ${med.quantity || 'N/A'})`;
            const medHeight = doc.heightOfString(medText, { width: doc.page.width - 100 });
            pdfGen.checkPageBreak(doc, medHeight + 4);
            
            doc.fontSize(pdfGen.fonts.small)
               .fillColor(pdfGen.colors.text.primary)
               .text(medText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
            doc.y += medHeight + 2;
          });
        }
        doc.y += 8;
      });
      
      if (patient.prescriptions.length > 5) {
        const moreText = `... and ${patient.prescriptions.length - 5} more prescriptions on record.`;
        const moreHeight = doc.heightOfString(moreText, { width: doc.page.width - 100 });
        doc.fontSize(pdfGen.fonts.small)
           .fillColor(pdfGen.colors.text.secondary)
           .text(moreText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
        doc.y += moreHeight + 8;
      }
    }

    // ===== MEDICAL REPORTS =====
    if (patient.medicalReports && patient.medicalReports.length > 0) {
      pdfGen.addSectionHeader(doc, 'Medical Reports & Documents', '', {
        color: pdfGen.colors.primary,
        marginTop: 15
      });

      const reportHeaders = ['Report Type', 'Upload Date', 'Uploaded By', 'OCR Status'];
      const reportRows = patient.medicalReports.slice(0, 10).map(report => [
        report.reportType || 'GENERAL',
        new Date(report.uploadDate).toLocaleDateString('en-IN'),
        report.uploadedBy || 'System',
        report.ocrText ? 'Processed' : 'Pending'
      ]);

      pdfGen.addTable(doc, reportHeaders, reportRows, {
        columnWidths: [120, 100, 100, 100],
        headerBg: pdfGen.colors.secondary
      });

      if (patient.medicalReports.length > 10) {
        const totalText = `Total ${patient.medicalReports.length} medical documents on record.`;
        const totalHeight = doc.heightOfString(totalText, { width: doc.page.width - 100 });
        doc.fontSize(pdfGen.fonts.small)
           .fillColor(pdfGen.colors.text.secondary)
           .text(totalText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
        doc.y += totalHeight + 8;
      }
    }

    // ===== PATIENT NOTES =====
    if (patient.notes) {
      pdfGen.addSectionHeader(doc, 'Clinical Notes', '', {
        color: pdfGen.colors.primary,
        marginTop: 15
      });

      // Check if notes will fit, if not break to new page
      pdfGen.checkTextPageBreak(doc, patient.notes, {
        width: doc.page.width - 100,
        fontSize: pdfGen.fonts.body
      });

      doc.fontSize(pdfGen.fonts.body)
         .fillColor(pdfGen.colors.text.primary)
         .text(patient.notes, pdfGen.margins.page.left, doc.y, {
           width: doc.page.width - 100,
           align: 'justify'
         });
      doc.y += 15;
    }

    // ===== METADATA =====
    if (patient.metadata && Object.keys(patient.metadata).length > 0) {
      pdfGen.addSectionHeader(doc, 'Additional Information', '', {
        color: pdfGen.colors.accent,
        marginTop: 15
      });

      Object.keys(patient.metadata).slice(0, 10).forEach(key => {
        pdfGen.addInfoRow(doc, key, 
          typeof patient.metadata[key] === 'object' 
            ? JSON.stringify(patient.metadata[key]).substring(0, 50) + '...'
            : patient.metadata[key]?.toString() || 'N/A',
          { labelWidth: 140 }
        );
      });
    }

    // ===== ALLERGIES (ALERT BOX) =====
    if (patient.allergies && patient.allergies.length > 0) {
      const allergiesText = `Known Allergies: ${patient.allergies.join(', ')}`;
      pdfGen.addAlertBox(doc, allergiesText, {
        type: 'danger',
        icon: ''
      });
    }

    // ===== APPOINTMENT HISTORY =====
    pdfGen.addSectionHeader(doc, 'Appointment History', '', {
      color: pdfGen.colors.primary,
      marginTop: 20
    });

    // Appointment statistics
    const totalAppts = appointments.length;
    const completedAppts = appointments.filter(a => a.status === 'completed').length;
    const upcomingAppts = appointments.filter(a => 
      a.status === 'scheduled' && new Date(a.appointmentDate) > new Date()
    ).length;
    const cancelledAppts = appointments.filter(a => a.status === 'cancelled').length;

    const apptStats = [
      { icon: '', value: totalAppts, label: 'Total Appointments', color: pdfGen.colors.secondary },
      { icon: '', value: completedAppts, label: 'Completed', color: pdfGen.colors.success },
      { icon: '', value: upcomingAppts, label: 'Upcoming', color: pdfGen.colors.accent },
      { icon: '', value: cancelledAppts, label: 'Cancelled', color: pdfGen.colors.danger }
    ];

    pdfGen.addStatsCards(doc, apptStats, { cardsPerRow: 4 });

    // Appointment table with full details
    if (appointments.length > 0) {
      const headers = ['Date & Time', 'Type', 'Status', 'Location', 'Notes'];
      const rows = appointments.slice(0, 15).map(apt => [
        new Date(apt.startAt).toLocaleString('en-IN', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        apt.appointmentType || 'Consultation',
        apt.status || 'Scheduled',
        apt.location || '-',
        apt.notes?.substring(0, 30) + (apt.notes?.length > 30 ? '...' : '') || '-'
      ]);

      pdfGen.addTable(doc, headers, rows, {
        columnWidths: [110, 80, 75, 70, 145],
        headerBg: pdfGen.colors.primary
      });
      
      // Detailed appointment breakdowns
      pdfGen.addSectionHeader(doc, 'Recent Appointment Details', '', {
        color: pdfGen.colors.secondary,
        marginTop: 15
      });
      
      appointments.slice(0, 3).forEach((apt, index) => {
        const labTests = apt.followUp?.labTests?.length || 0;
        const imaging = apt.followUp?.imaging?.length || 0;
        const procedures = apt.followUp?.procedures?.length || 0;
        const estimatedHeight = 150 + (labTests * 20) + (imaging * 20) + (procedures * 20);
        pdfGen.checkPageBreak(doc, estimatedHeight);
        
        doc.fontSize(pdfGen.fonts.body)
           .fillColor(pdfGen.colors.text.primary)
           .text(`Appointment ${index + 1}:`, pdfGen.margins.page.left, doc.y);
        doc.y += 6;
        
        pdfGen.addInfoRow(doc, '  Code', apt.appointmentCode || 'N/A', { labelWidth: 140 });
        pdfGen.addInfoRow(doc, '  Date', new Date(apt.startAt).toLocaleDateString('en-IN'), { labelWidth: 140 });
        pdfGen.addInfoRow(doc, '  Time', new Date(apt.startAt).toLocaleTimeString('en-IN'), { labelWidth: 140 });
        pdfGen.addInfoRow(doc, '  Type', apt.appointmentType || 'Consultation', { labelWidth: 140 });
        pdfGen.addInfoRow(doc, '  Status', apt.status || 'Scheduled', { labelWidth: 140 });
        pdfGen.addInfoRow(doc, '  Location', apt.location || 'Not Specified', { labelWidth: 140 });
        
        // Follow-up information
        if (apt.followUp && apt.followUp.isRequired) {
          pdfGen.addAlertBox(doc, 
            `Follow-up Required: ${apt.followUp.reason || 'General follow-up'} - Priority: ${apt.followUp.priority || 'Routine'}`,
            { type: 'warning', icon: '' }
          );
          
          if (apt.followUp.recommendedDate) {
            pdfGen.addInfoRow(doc, '  Recommended Follow-up', 
              new Date(apt.followUp.recommendedDate).toLocaleDateString('en-IN'),
              { labelWidth: 140 }
            );
          }
          
          if (apt.followUp.diagnosis) {
            pdfGen.addInfoRow(doc, '  Diagnosis', apt.followUp.diagnosis, { labelWidth: 140 });
          }
          
          if (apt.followUp.treatmentPlan) {
            pdfGen.addInfoRow(doc, '  Treatment Plan', apt.followUp.treatmentPlan, { labelWidth: 140 });
          }
          
          // Lab tests with enhanced details
          if (apt.followUp.labTests && apt.followUp.labTests.length > 0) {
            doc.fontSize(pdfGen.fonts.small)
               .fillColor(pdfGen.colors.text.secondary)
               .text('  Lab Tests Ordered:', pdfGen.margins.page.left, doc.y);
            doc.y += 4;
            
            apt.followUp.labTests.forEach((test, testIndex) => {
              const status = test.completed ? `✓ ${test.resultStatus || 'Completed'}` : 
                             test.ordered ? '⏳ Ordered' : '○ Pending';
              const testText = `    ${testIndex + 1}. ${test.testName || 'N/A'} - ${status}`;
              const testHeight = doc.heightOfString(testText, { width: doc.page.width - 100 });
              
              pdfGen.checkPageBreak(doc, testHeight + 16);
              
              doc.fontSize(pdfGen.fonts.small)
                 .fillColor(pdfGen.colors.text.primary)
                 .text(testText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
              doc.y += testHeight + 4;
              
              if (test.results) {
                const resultsText = `       Results: ${test.results}`;
                const resultsHeight = doc.heightOfString(resultsText, { width: doc.page.width - 100 });
                doc.fontSize(pdfGen.fonts.tiny)
                   .fillColor(pdfGen.colors.text.secondary)
                   .text(resultsText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
                doc.y += resultsHeight + 4;
              }
            });
            doc.y += 4;
          }
          
          // Imaging with findings
          if (apt.followUp.imaging && apt.followUp.imaging.length > 0) {
            doc.fontSize(pdfGen.fonts.small)
               .fillColor(pdfGen.colors.text.secondary)
               .text('  Imaging Studies:', pdfGen.margins.page.left, doc.y);
            doc.y += 4;
            
            apt.followUp.imaging.forEach((img, imgIndex) => {
              const status = img.completed ? `✓ ${img.findingsStatus || 'Completed'}` : 
                             img.ordered ? '⏳ Ordered' : '○ Pending';
              const imgText = `    ${imgIndex + 1}. ${img.imagingType || 'N/A'} - ${status}`;
              const imgHeight = doc.heightOfString(imgText, { width: doc.page.width - 100 });
              
              pdfGen.checkPageBreak(doc, imgHeight + 16);
              
              doc.fontSize(pdfGen.fonts.small)
                 .fillColor(pdfGen.colors.text.primary)
                 .text(imgText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
              doc.y += imgHeight + 4;
              
              if (img.findings) {
                const findingsText = `       Findings: ${img.findings}`;
                const findingsHeight = doc.heightOfString(findingsText, { width: doc.page.width - 100 });
                doc.fontSize(pdfGen.fonts.tiny)
                   .fillColor(pdfGen.colors.text.secondary)
                   .text(findingsText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
                doc.y += findingsHeight + 4;
              }
            });
            doc.y += 4;
          }
          
          // Procedures
          if (apt.followUp.procedures && apt.followUp.procedures.length > 0) {
            doc.fontSize(pdfGen.fonts.small)
               .fillColor(pdfGen.colors.text.secondary)
               .text('  Procedures:', pdfGen.margins.page.left, doc.y);
            doc.y += 4;
            
            apt.followUp.procedures.forEach((proc, procIndex) => {
              const status = proc.completed ? '✓ Completed' : 
                             proc.scheduled ? '📅 Scheduled' : '○ Pending';
              const procText = `    ${procIndex + 1}. ${proc.procedureName || 'N/A'} - ${status}`;
              const procHeight = doc.heightOfString(procText, { width: doc.page.width - 100 });
              
              pdfGen.checkPageBreak(doc, procHeight + 16);
              
              doc.fontSize(pdfGen.fonts.small)
                 .fillColor(pdfGen.colors.text.primary)
                 .text(procText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
              doc.y += procHeight + 4;
              
              if (proc.notes) {
                const notesText = `       Notes: ${proc.notes}`;
                const notesHeight = doc.heightOfString(notesText, { width: doc.page.width - 100 });
                doc.fontSize(pdfGen.fonts.tiny)
                   .fillColor(pdfGen.colors.text.secondary)
                   .text(notesText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
                doc.y += notesHeight + 4;
              }
            });
            doc.y += 4;
          }
          
          // Medication Review & Compliance
          if (apt.followUp.prescriptionReview) {
            pdfGen.addInfoRow(doc, '  Medication Review', 'Required', { labelWidth: 140 });
          }
          if (apt.followUp.medicationCompliance && apt.followUp.medicationCompliance !== 'Unknown') {
            pdfGen.addInfoRow(doc, '  Medication Compliance', apt.followUp.medicationCompliance, { labelWidth: 140 });
          }
          
          // Outcome
          if (apt.followUp.outcome && apt.followUp.outcome !== 'Pending') {
            pdfGen.addInfoRow(doc, '  Patient Outcome', apt.followUp.outcome, { labelWidth: 140 });
            
            if (apt.followUp.outcomeNotes) {
              const notesHeight = doc.heightOfString(apt.followUp.outcomeNotes, { width: doc.page.width - 100 });
              doc.fontSize(pdfGen.fonts.small)
                 .fillColor(pdfGen.colors.text.secondary)
                 .text(`  Outcome Notes: ${apt.followUp.outcomeNotes}`, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
              doc.y += notesHeight + 4;
            }
          }
        }
        
        if (apt.notes) {
          pdfGen.addInfoRow(doc, '  Notes', apt.notes, { labelWidth: 140 });
        }
        
        doc.y += 8;
      });
      
      if (appointments.length > 3) {
        const showingText = `Showing 3 of ${appointments.length} total appointments. See appointment table above for complete list.`;
        const showingHeight = doc.heightOfString(showingText, { width: doc.page.width - 100 });
        doc.fontSize(pdfGen.fonts.small)
           .fillColor(pdfGen.colors.text.secondary)
           .text(showingText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
        doc.y += showingHeight + 8;
      }
    } else {
      const noApptText = 'No appointment history available.';
      const noApptHeight = doc.heightOfString(noApptText, { width: doc.page.width - 100 });
      doc.fontSize(pdfGen.fonts.body)
         .fillColor(pdfGen.colors.text.secondary)
         .text(noApptText, pdfGen.margins.page.left, doc.y, { width: doc.page.width - 100 });
      doc.y += noApptHeight + 12;
    }

    // ===== CLINICAL NOTES =====
    if (patient.notes && patient.notes.trim()) {
      pdfGen.addSectionHeader(doc, 'Clinical Notes', '', {
        color: pdfGen.colors.secondary,
        marginTop: 12
      });
      
      const notesHeight = doc.heightOfString(patient.notes, {
        width: doc.page.width - 100,
        lineGap: 1
      });
      pdfGen.checkPageBreak(doc, notesHeight + 8);
      
      doc.fontSize(pdfGen.fonts.body)
         .fillColor(pdfGen.colors.text.primary)
         .text(patient.notes, pdfGen.margins.page.left, doc.y, {
           width: doc.page.width - 100,
           align: 'justify',
           lineGap: 1
         });
      doc.y += notesHeight + 8;
    }

    // ===== SUMMARY =====
    pdfGen.addDivider(doc);
    pdfGen.addSectionHeader(doc, 'Report Summary', '', {
      color: pdfGen.colors.primary
    });

    const lastVisit = appointments.length > 0 
      ? new Date(appointments[0].appointmentDate).toLocaleDateString('en-IN')
      : 'No visits recorded';
    
    doc.fontSize(pdfGen.fonts.body)
       .fillColor(pdfGen.colors.text.primary)
       .text(`This comprehensive medical report was generated for ${patientName} (ID: ${patient._id?.toString().substring(0, 12)}) on ${new Date().toLocaleDateString('en-IN')}. The patient is currently registered with Karur Gastro Foundation and has completed ${completedAppts} appointment(s) to date. Last visit: ${lastVisit}. This document contains confidential medical information and should be handled with appropriate care.`, {
         align: 'justify',
         lineGap: 3
       });

    // Finalize with page numbers
    pdfGen.finalize(doc);

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

// ===========================
// DOCTOR PERFORMANCE REPORT
// ===========================
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    console.log(`\n========== DOCTOR REPORT DEBUG ==========`);
    console.log(`Requested Doctor ID: ${doctorId}`);
    console.log(`JWT User ID: ${req.user?.id}`);
    console.log(`JWT User Role: ${req.user?.role}`);
    
    // Date range - last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Fetch doctor from both collections
    let doctor = await User.findById(doctorId).lean();
    let doctorSource = null;
    
    if (!doctor) {
      console.log(`❌ Doctor not found in User collection`);
      const staff = await Staff.findById(doctorId).lean();
      if (staff) {
        console.log(`✅ Doctor found in Staff collection: ${staff.name}`);
        doctorSource = 'Staff';
        doctor = {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.contact,
          specialization: staff.designation,
          qualification: staff.qualifications?.join(', ') || '',
          role: 'doctor'
        };
      }
    } else {
      console.log(`✅ Doctor found in User collection: ${doctor.firstName} ${doctor.lastName}`);
      doctorSource = 'User';
      if (!doctor.name) {
        doctor.name = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
      }
    }
    
    if (!doctor) {
      console.log(`❌ Doctor not found in any collection!`);
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }
    
    console.log(`Doctor Source: ${doctorSource}`);
    console.log(`Doctor Name: ${doctor.name}`);
    
    // SMART ID RESOLUTION: Try to find the actual ID used in database
    let queryDoctorId = doctorId;
    
    console.log(`\n--- SMART ID RESOLUTION ---`);
    console.log(`Original ID from request: ${doctorId}`);
    
    // If doctor is from Staff collection, try to find matching User
    if (doctorSource === 'Staff' && doctor.email) {
      console.log(`Doctor from Staff collection - searching for User with same email...`);
      const userDoctor = await User.findOne({ 
        email: doctor.email, 
        role: 'doctor' 
      }).select('_id').lean();
      
      if (userDoctor) {
        queryDoctorId = userDoctor._id;
        console.log(`✅ Found User ID: ${queryDoctorId}`);
        console.log(`   Will use User ID for database queries`);
      } else {
        console.log(`⚠️  No User found - will try with Staff ID: ${doctorId}`);
      }
    } else {
      console.log(`Doctor from User collection - using same ID: ${doctorId}`);
    }
    
    console.log(`Final query will use: ${queryDoctorId}`);
    
    // Fetch patients using RESOLVED doctor ID
    const patients = await Patient.find({ 
      doctorId: queryDoctorId, 
      deleted_at: null 
    })
    .select('-__v')
    .lean();
    
    console.log(`\n--- QUERY RESULTS ---`);
    console.log(`✅ Found ${patients.length} patients for doctorId: ${queryDoctorId}`);
    if (patients.length === 0 && queryDoctorId !== doctorId) {
      console.log(`⚠️  No patients found with User ID, trying with Staff ID...`);
      const patientsWithStaffId = await Patient.find({ 
        doctorId: doctorId, 
        deleted_at: null 
      }).lean();
      console.log(`   Found ${patientsWithStaffId.length} patients with Staff ID`);
      if (patientsWithStaffId.length > 0) {
        queryDoctorId = doctorId;
        patients.push(...patientsWithStaffId);
      }
    }
    
    // Fetch ALL appointments for this doctor
    const allAppointments = await Appointment.find({ doctorId: queryDoctorId }).lean();
    console.log(`✅ Found ${allAppointments.length} total appointments for doctorId: ${queryDoctorId}`);
    
    // Filter appointments for the week (using startAt field from Appointment model)
    const weekAppointments = allAppointments.filter(apt => 
      new Date(apt.startAt) >= startDate && 
      new Date(apt.startAt) <= endDate
    );
    console.log(`✅ Found ${weekAppointments.length} appointments this week`);
    console.log(`========================================\n`);

    // Create PDF
    const doc = pdfGen.createDocument(
      `Performance Report - Dr. ${doctor.name}`,
      'Karur Gastro Foundation'
    );

    const filename = `Dr_${doctor.name.replace(/\s+/g, '_')}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${filename}_Performance_Report_${Date.now()}.pdf"`);

    doc.pipe(res);

    // Add header
    pdfGen.addHeader(doc, {
      title: 'Doctor Performance Report',
      subtitle: 'Karur Gastro Foundation',
      reportType: 'Weekly Performance Analysis',
      showLogo: true
    });

    // ===== DOCTOR INFORMATION =====
    pdfGen.addSectionHeader(doc, 'Doctor Information', '', {
      color: pdfGen.colors.primary
    });

    // Basic Information
    pdfGen.addInfoRow(doc, 'Doctor ID', doctor._id?.toString(), { labelWidth: 160 });
    pdfGen.addInfoRow(doc, 'Name', `Dr. ${doctor.name}`, { labelWidth: 160 });
    pdfGen.addInfoRow(doc, 'Specialization', 
      doctor.specialization || doctor.designation || doctor.metadata?.specialization || 'General Physician',
      { labelWidth: 160 }
    );
    pdfGen.addInfoRow(doc, 'Qualification', 
      doctor.qualification || doctor.metadata?.qualification || 'MBBS',
      { labelWidth: 160 }
    );
    
    // Contact Information
    pdfGen.addInfoRow(doc, 'Email', doctor.email || 'N/A', { labelWidth: 160 });
    pdfGen.addInfoRow(doc, 'Phone', doctor.phone || doctor.contact || 'N/A', { labelWidth: 160 });
    
    // Additional Details (if from Staff collection)
    if (doctor.department) {
      pdfGen.addInfoRow(doc, 'Department', doctor.department, { labelWidth: 160 });
    }
    if (doctor.experienceYears) {
      pdfGen.addInfoRow(doc, 'Experience', `${doctor.experienceYears} years`, { labelWidth: 160 });
    }
    if (doctor.status) {
      pdfGen.addInfoRow(doc, 'Current Status', doctor.status, { labelWidth: 160 });
    }
    if (doctor.shift) {
      pdfGen.addInfoRow(doc, 'Shift', doctor.shift, { labelWidth: 160 });
    }
    if (doctor.location) {
      pdfGen.addInfoRow(doc, 'Location', doctor.location, { labelWidth: 160 });
    }
    
    // Registration date
    pdfGen.addInfoRow(doc, 'Account Created', 
      doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('en-IN') : 'N/A',
      { labelWidth: 160 }
    );

    // ===== REPORT PERIOD =====
    pdfGen.addSectionHeader(doc, 'Report Period', '', {
      color: pdfGen.colors.secondary,
      marginTop: 15
    });

    pdfGen.addInfoRow(doc, 'Period', 'Last 7 Days', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'From', startDate.toLocaleDateString('en-IN'), { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'To', endDate.toLocaleDateString('en-IN'), { labelWidth: 140 });

    // ===== KEY METRICS =====
    pdfGen.addSectionHeader(doc, 'Performance Overview', '', {
      color: pdfGen.colors.primary,
      marginTop: 20
    });

    const weekCompleted = weekAppointments.filter(a => a.status === 'completed').length;
    const weekScheduled = weekAppointments.filter(a => a.status === 'scheduled').length;
    const totalCompleted = allAppointments.filter(a => a.status === 'completed').length;

    const performanceStats = [
      { 
        icon: '', 
        value: patients.length, 
        label: 'Total Patients',
        color: pdfGen.colors.secondary
      },
      { 
        icon: '', 
        value: weekAppointments.length, 
        label: 'This Week\'s Appointments',
        color: pdfGen.colors.accent
      },
      { 
        icon: '', 
        value: weekCompleted, 
        label: 'Completed This Week',
        color: pdfGen.colors.success
      },
      { 
        icon: '', 
        value: weekScheduled, 
        label: 'Scheduled This Week',
        color: pdfGen.colors.warning
      }
    ];

    pdfGen.addStatsCards(doc, performanceStats, { cardsPerRow: 4 });

    // ===== PERFORMANCE METRICS =====
    pdfGen.addSectionHeader(doc, 'Performance Metrics', '', {
      color: pdfGen.colors.primary,
      marginTop: 15
    });

    const completionRate = allAppointments.length > 0 
      ? ((totalCompleted / allAppointments.length) * 100).toFixed(1)
      : 0;
    
    const avgPatientsPerDay = (weekAppointments.length / 7).toFixed(1);

    const metricsStats = [
      { 
        icon: '', 
        value: allAppointments.length, 
        label: 'Total Appointments (All-Time)',
        color: pdfGen.colors.secondary
      },
      { 
        icon: '', 
        value: totalCompleted, 
        label: 'Total Completed (All-Time)',
        color: pdfGen.colors.success
      },
      { 
        icon: '', 
        value: `${completionRate}%`, 
        label: 'Completion Rate',
        color: pdfGen.colors.accent
      },
      { 
        icon: '', 
        value: avgPatientsPerDay, 
        label: 'Avg. Patients/Day',
        color: pdfGen.colors.warning
      }
    ];

    pdfGen.addStatsCards(doc, metricsStats, { cardsPerRow: 4 });

    // ===== THIS WEEK'S APPOINTMENTS =====
    pdfGen.addSectionHeader(doc, 'This Week\'s Appointments', '📅', {
      color: pdfGen.colors.primary,
      marginTop: 20
    });

    if (weekAppointments.length > 0) {
      const headers = ['Date', 'Time', 'Patient', 'Reason', 'Status'];
      const rows = weekAppointments.slice(0, 10).map(apt => {
        // Find patient by matching IDs (handle both string and ObjectId)
        const patient = patients.find(p => 
          p._id.toString() === (apt.patientId?.toString() || apt.patientId)
        );
        const patientName = patient 
          ? `${patient.firstName} ${patient.lastName || ''}`.trim()
          : 'Unknown Patient';
        
        return [
          new Date(apt.startAt).toLocaleDateString('en-IN'),
          new Date(apt.startAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          patientName,
          apt.appointmentType || 'Consultation',
          apt.status || 'Scheduled'
        ];
      });

      pdfGen.addTable(doc, headers, rows, {
        columnWidths: [85, 65, 120, 120, 90],
        headerBg: pdfGen.colors.primary
      });
    } else {
      doc.fontSize(pdfGen.fonts.body)
         .fillColor(pdfGen.colors.text.secondary)
         .text('No appointments scheduled for this week.', pdfGen.margins.page.left, doc.y);
      doc.y += 20;
    }

    // ===== DAILY BREAKDOWN =====
    pdfGen.addSectionHeader(doc, 'Daily Breakdown (7 Days)', '', {
      color: pdfGen.colors.primary,
      marginTop: 15
    });

    const dailyStats = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString('en-IN');
      dailyStats[dateStr] = {
        total: 0,
        completed: 0,
        scheduled: 0,
        cancelled: 0
      };
    }

    weekAppointments.forEach(apt => {
      const dateStr = new Date(apt.startAt).toLocaleDateString('en-IN');
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total++;
        const status = apt.status?.toLowerCase() || 'scheduled';
        if (status === 'completed') dailyStats[dateStr].completed++;
        if (status === 'scheduled') dailyStats[dateStr].scheduled++;
        if (status === 'cancelled') dailyStats[dateStr].cancelled++;
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

    pdfGen.addTable(doc, dailyHeaders, dailyRows, {
      columnWidths: [120, 70, 85, 85, 85],
      headerBg: pdfGen.colors.secondary
    });

    // ===== TOP PATIENTS =====
    pdfGen.addSectionHeader(doc, 'Active Patients', '', {
      color: pdfGen.colors.primary,
      marginTop: 15
    });

    if (patients.length > 0) {
      const headers = ['Patient Name', 'Age', 'Gender', 'Last Visit', 'Total Visits'];
      const rows = patients.slice(0, 10).map(p => {
        // Match appointments with proper ID comparison
        const patientAppts = allAppointments.filter(a => 
          (a.patientId?.toString() || a.patientId) === p._id.toString()
        );
        const lastAppt = patientAppts.sort((a, b) => 
          new Date(b.startAt) - new Date(a.startAt)
        )[0];
        
        return [
          `${p.firstName} ${p.lastName || ''}`.trim(),
          (p.age || 'N/A').toString(),
          p.gender || 'N/A',
          lastAppt ? new Date(lastAppt.startAt).toLocaleDateString('en-IN') : 'Never',
          patientAppts.length.toString()
        ];
      });

      pdfGen.addTable(doc, headers, rows, {
        columnWidths: [130, 50, 70, 85, 80],
        headerBg: pdfGen.colors.secondary
      });
    }

    // ===== SUMMARY =====
    pdfGen.addDivider(doc);
    pdfGen.addSectionHeader(doc, 'Performance Summary', '', {
      color: pdfGen.colors.primary
    });

    doc.fontSize(pdfGen.fonts.body)
       .fillColor(pdfGen.colors.text.primary)
       .text(`This performance report for Dr. ${doctor.name} covers the period from ${startDate.toLocaleDateString('en-IN')} to ${endDate.toLocaleDateString('en-IN')}. During this week, the doctor handled ${weekAppointments.length} appointment(s) with ${patients.length} total registered patient(s). The overall completion rate stands at ${completionRate}%, demonstrating ${completionRate > 80 ? 'excellent' : 'good'} performance. The doctor maintains an average of ${avgPatientsPerDay} patients per day. This report was generated by Karur Gastro Foundation HMS on ${new Date().toLocaleDateString('en-IN')}.`, {
         align: 'justify',
         lineGap: 3
       });

    // Finalize
    pdfGen.finalize(doc);

  } catch (error) {
    console.error('Error generating doctor report:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate report',
        error: error.message 
      });
    }
  }
});

module.exports = router;
