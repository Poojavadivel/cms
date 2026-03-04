/**
 * reports/doctorReportController.js
 * Controller for doctor performance report generation
 */

const pdfGen = require('../../utils/enterprisePdfGenerator');
const { fetchDoctorReportData } = require('./dataService');
const { formatFilename, formatDate, calculateCompletionRate } = require('./utils');

/**
 * Generate doctor performance report PDF
 * GET /doctor/:doctorId
 */
async function generateDoctorReport(req, res) {
  try {
    const { doctorId } = req.params;

    // Fetch data
    const {
      doctor,
      weekAppointments,
      allAppointments,
      patients,
      startDate,
      endDate
    } = await fetchDoctorReportData(doctorId);

    // Create PDF document
    const doctorName = doctor.name || `${doctor.firstName || 'Doctor'} ${doctor.lastName || ''}`.trim();
    const doc = pdfGen.createDocument(
      `Performance Report - ${doctorName}`,
      'Movi Innovations'
    );

    // Set response headers
    const filename = formatFilename(doctorName, 'Performance_Report');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Pipe to response
    doc.pipe(res);

    // Add header
    pdfGen.addHeader(doc, {
      title: 'Doctor Performance Report',
      subtitle: 'Movi Innovations',
      reportType: `Week of ${formatDate(startDate)} - ${formatDate(endDate)}`,
      showLogo: true
    });

    // Doctor Information
    pdfGen.addSectionHeader(doc, 'Doctor Information', '', {
      color: pdfGen.colors.primary
    });

    pdfGen.addInfoRow(doc, 'Doctor ID', doctor._id.toString(), { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Name', doctorName, { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Email', doctor.email || 'N/A', { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Phone', doctor.phone || 'N/A', { labelWidth: 140 });
    if (doctor.specialization) {
      pdfGen.addInfoRow(doc, 'Specialization', doctor.specialization, { labelWidth: 140 });
    }

    // Performance Metrics
    const completedAppts = weekAppointments.filter(a => a.status === 'Completed').length;
    const completionRate = calculateCompletionRate(completedAppts, weekAppointments.length);
    const avgPatientsPerDay = (weekAppointments.length / 7).toFixed(1);

    pdfGen.addSectionHeader(doc, 'Weekly Performance Metrics', '', {
      color: pdfGen.colors.secondary,
      marginTop: 15
    });

    pdfGen.addInfoRow(doc, 'Week Period', `${formatDate(startDate)} - ${formatDate(endDate)}`, { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Total Appointments This Week', weekAppointments.length.toString(), { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Completed Appointments', completedAppts.toString(), { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Completion Rate', `${completionRate}%`, { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Total Patients (All Time)', patients.length.toString(), { labelWidth: 140 });
    pdfGen.addInfoRow(doc, 'Average Patients Per Day', avgPatientsPerDay, { labelWidth: 140 });

    // Weekly Appointments Table
    if (weekAppointments.length > 0) {
      pdfGen.addSectionHeader(doc, 'Appointments This Week', '', {
        color: pdfGen.colors.primary,
        marginTop: 15
      });

      const headers = ['Date', 'Patient', 'Type', 'Status'];
      const rows = weekAppointments.slice(0, 15).map(apt => [
        formatDate(apt.startAt),
        apt.patientId ? `${apt.patientId.firstName} ${apt.patientId.lastName || ''}`.trim() : 'N/A',
        apt.appointmentType || 'Consultation',
        apt.status || 'Scheduled'
      ]);

      pdfGen.addTable(doc, headers, rows, {
        columnWidths: [100, 150, 100, 80],
        headerBg: pdfGen.colors.primary
      });
    }

    // Top Patients Table
    if (patients.length > 0) {
      pdfGen.addSectionHeader(doc, 'Registered Patients', '', {
        color: pdfGen.colors.secondary,
        marginTop: 15
      });

      const headers = ['Patient Name', 'Age', 'Gender', 'Last Visit', 'Total Visits'];
      const rows = patients.slice(0, 10).map(p => {
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
          lastAppt ? formatDate(lastAppt.startAt) : 'Never',
          patientAppts.length.toString()
        ];
      });

      pdfGen.addTable(doc, headers, rows, {
        columnWidths: [130, 50, 70, 85, 80],
        headerBg: pdfGen.colors.secondary
      });
    }

    // Performance Summary
    pdfGen.addDivider(doc);
    pdfGen.addSectionHeader(doc, 'Performance Summary', '', {
      color: pdfGen.colors.primary
    });

    const performanceText = `This performance report for Dr. ${doctorName} covers the period from ${formatDate(startDate)} to ${formatDate(endDate)}. During this week, the doctor handled ${weekAppointments.length} appointment(s) with ${patients.length} total registered patient(s). The overall completion rate stands at ${completionRate}%, demonstrating ${completionRate > 80 ? 'excellent' : 'good'} performance. The doctor maintains an average of ${avgPatientsPerDay} patients per day. This report was generated by Movi Innovations HMS on ${formatDate(new Date())}.`;

    doc.fontSize(pdfGen.fonts.body)
      .fillColor(pdfGen.colors.text.primary)
      .text(performanceText, pdfGen.margins.page.left, doc.y, {
        align: 'justify',
        lineGap: 3
      });

    // Finalize PDF
    pdfGen.finalize(doc);

  } catch (error) {
    console.error('Error generating doctor report:', error);
    if (!res.headersSent) {
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to generate report'
      });
    }
  }
}

module.exports = {
  generateDoctorReport
};
