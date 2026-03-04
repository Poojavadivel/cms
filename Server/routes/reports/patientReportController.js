/**
 * reports/patientReportController.js
 * Controller for patient medical report generation
 */

const pdfGen = require('../../utils/enterprisePdfGenerator');
const { fetchPatientReportData } = require('./dataService');
const { formatPatientName, formatFilename, formatDate } = require('./utils');
const {
  generatePatientInfoSection,
  generateContactInfoSection,
  generateEmergencyContactSection,
  generateMedicalInfoSection
} = require('./patientReportGenerator');

/**
 * Generate patient medical report PDF
 * GET /patient/:patientId
 */
async function generatePatientReport(req, res) {
  try {
    const { patientId } = req.params;

    // Fetch data
    const { patient, appointments, doctor } = await fetchPatientReportData(patientId);

    // Create PDF document
    const patientName = formatPatientName(patient);
    const doc = pdfGen.createDocument(
      `Medical Report - ${patientName}`,
      'Movi Innovations'
    );

    // Set response headers
    const filename = formatFilename(
      `${patient.firstName}_${patient.lastName || 'Report'}`,
      'Medical_Report'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Pipe to response
    doc.pipe(res);

    // Add header
    pdfGen.addHeader(doc, {
      title: 'Patient Medical Report',
      subtitle: 'Movi Innovations',
      reportType: 'Confidential Medical Document',
      showLogo: true
    });

    // Generate sections
    generatePatientInfoSection(doc, patient);
    generateContactInfoSection(doc, patient);
    generateEmergencyContactSection(doc, patient);
    generateMedicalInfoSection(doc, patient, doctor);

    // Appointment History Section
    if (appointments && appointments.length > 0) {
      pdfGen.addSectionHeader(doc, 'Appointment History', '', {
        color: pdfGen.colors.primary,
        marginTop: 15
      });

      // Appointment summary table
      const headers = ['Date', 'Doctor', 'Type', 'Status'];
      const rows = appointments.slice(0, 10).map(apt => [
        formatDate(apt.startAt),
        apt.doctorId?.name || apt.doctorId?.firstName || 'N/A',
        apt.appointmentType || 'Consultation',
        apt.status || 'N/A'
      ]);

      pdfGen.addTable(doc, headers, rows, {
        columnWidths: [100, 140, 100, 80],
        headerBg: pdfGen.colors.primary
      });

      // Detailed recent appointments (last 3)
      const detailedAppts = appointments.slice(0, 3);
      if (detailedAppts.length > 0) {
        pdfGen.addSectionHeader(doc, 'Recent Appointment Details', '', {
          color: pdfGen.colors.secondary,
          marginTop: 15
        });

        detailedAppts.forEach((apt, index) => {
          pdfGen.addInfoRow(doc, `Appointment ${index + 1}`,
            formatDate(apt.startAt),
            { labelWidth: 140 }
          );
          if (apt.notes) {
            pdfGen.addInfoRow(doc, '  Notes', apt.notes, { labelWidth: 140 });
          }
          if (index < detailedAppts.length - 1) {
            doc.y += 8;
          }
        });
      }
    }

    // Clinical Notes
    if (patient.notes && patient.notes.trim()) {
      pdfGen.addSectionHeader(doc, 'Clinical Notes', '', {
        color: pdfGen.colors.secondary,
        marginTop: 12
      });

      doc.fontSize(pdfGen.fonts.body)
        .fillColor(pdfGen.colors.text.primary)
        .text(patient.notes, pdfGen.margins.page.left, doc.y, {
          width: doc.page.width - 100,
          align: 'justify',
          lineGap: 2
        });
    }

    // Footer
    pdfGen.addDivider(doc);
    doc.fontSize(pdfGen.fonts.small)
      .fillColor(pdfGen.colors.text.secondary)
      .text(
        `This confidential medical report was generated on ${formatDate(new Date())} by Movi Innovations Hospital Management System. For inquiries, contact Movi Innovations.`,
        pdfGen.margins.page.left,
        doc.y,
        { align: 'center', lineGap: 2 }
      );

    // Finalize PDF
    pdfGen.finalize(doc);

  } catch (error) {
    console.error('Error generating patient report:', error);
    if (!res.headersSent) {
      res.status(error.message === 'Patient not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to generate report'
      });
    }
  }
}

module.exports = {
  generatePatientReport
};
