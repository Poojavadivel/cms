/**
 * pdfGenerators/ProperPdfGenerator.js
 * Main PDF generator class using pdfmake
 */

const PdfPrinter = require('pdfmake');
const config = require('./config');
const { getStyles } = require('./styles');
const {
  buildHeader,
  buildFooter,
  buildSectionHeader,
  buildInfoRow,
  buildTable,
  buildDivider
} = require('./components');

class ProperPdfGenerator {
  constructor() {
    this.spacing = config.spacing;
    this.colors = config.colors;
    this.fontSize = config.fontSize;
  }

  /**
   * Generate patient report
   */
  generatePatientReport(patient, doctor, appointments) {
    const patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();

    const docDefinition = {
      pageSize: config.page.size,
      pageMargins: config.page.margins,
      header: buildHeader('Patient Medical Report', patientName),
      footer: buildFooter(),
      content: [
        this._buildPatientInfo(patient, doctor),
        this._buildVitals(patient),
        this._buildAllergies(patient),
        this._buildPrescriptions(patient),
        this._buildAppointments(appointments),
        this._buildClinicalNotes(patient)
      ],
      styles: getStyles(),
      defaultStyle: {
        fontSize: this.fontSize.body,
        color: this.colors.text
      }
    };

    return docDefinition;
  }

  /**
   * Generate doctor performance report
   */
  generateDoctorReport(doctor, appointments, patients, dateRange) {
    const doctorName = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();

    const docDefinition = {
      pageSize: config.page.size,
      pageMargins: config.page.margins,
      header: buildHeader('Doctor Performance Report', doctorName),
      footer: buildFooter(),
      content: [
        this._buildDoctorInfo(doctor),
        this._buildPerformanceMetrics(appointments, patients, dateRange),
        this._buildAppointmentsList(appointments),
        this._buildPatientsList(patients)
      ],
      styles: getStyles(),
      defaultStyle: {
        fontSize: this.fontSize.body,
        color: this.colors.text
      }
    };

    return docDefinition;
  }

  /**
   * Build patient info section
   */
  _buildPatientInfo(patient, doctor) {
    const content = [
      buildSectionHeader('Patient Information'),
      buildInfoRow('Patient ID', patient._id?.toString()),
      buildInfoRow('Full Name', `${patient.firstName} ${patient.lastName || ''}`.trim()),
      buildInfoRow('Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'),
      buildInfoRow('Age', `${patient.age || 'N/A'} years`),
      buildInfoRow('Gender', patient.gender),
      buildInfoRow('Blood Group', patient.bloodGroup),
      buildInfoRow('Phone', patient.phone),
      buildInfoRow('Email', patient.email),
      buildInfoRow('Assigned Doctor', doctor ? `Dr. ${doctor.firstName || doctor.name}` : 'Not Assigned')
    ];

    if (patient.address) {
      content.push(
        buildInfoRow('Address', 
          `${patient.address.line1 || ''}, ${patient.address.city || ''}, ${patient.address.state || ''}`.trim() || 'N/A'
        )
      );
    }

    return content;
  }

  /**
   * Build vitals section
   */
  _buildVitals(patient) {
    if (!patient.vitals || Object.keys(patient.vitals).length === 0) {
      return [];
    }

    return [
      buildDivider(),
      buildSectionHeader('Vital Signs'),
      buildInfoRow('Blood Pressure', patient.vitals.bloodPressure),
      buildInfoRow('Heart Rate', patient.vitals.heartRate),
      buildInfoRow('Temperature', patient.vitals.temperature),
      buildInfoRow('Weight', patient.vitals.weight),
      buildInfoRow('Height', patient.vitals.height)
    ];
  }

  /**
   * Build allergies section
   */
  _buildAllergies(patient) {
    const allergies = patient.allergies && patient.allergies.length > 0
      ? patient.allergies.join(', ')
      : 'None recorded';

    return [
      buildDivider(),
      buildSectionHeader('Allergies'),
      {
        text: allergies,
        style: patient.allergies && patient.allergies.length > 0 ? 'danger' : 'value',
        margin: [0, 0, 0, this.spacing.sm]
      }
    ];
  }

  /**
   * Build prescriptions section
   */
  _buildPrescriptions(patient) {
    if (!patient.prescriptions || patient.prescriptions.length === 0) {
      return [];
    }

    return [
      buildDivider(),
      buildSectionHeader('Current Prescriptions'),
      ...patient.prescriptions.map(rx => ({
        text: `• ${rx.medication} - ${rx.dosage}`,
        margin: [0, 0, 0, this.spacing.xs]
      }))
    ];
  }

  /**
   * Build appointments section
   */
  _buildAppointments(appointments) {
    if (!appointments || appointments.length === 0) {
      return [];
    }

    const headers = ['Date', 'Doctor', 'Type', 'Status'];
    const rows = appointments.slice(0, 10).map(apt => [
      new Date(apt.startAt).toLocaleDateString(),
      apt.doctorId?.name || apt.doctorId?.firstName || 'N/A',
      apt.appointmentType || 'Consultation',
      apt.status || 'Scheduled'
    ]);

    return [
      buildDivider(),
      buildSectionHeader('Appointment History'),
      buildTable(headers, rows, { widths: [100, 150, 100, 80] })
    ];
  }

  /**
   * Build clinical notes section
   */
  _buildClinicalNotes(patient) {
    if (!patient.notes || !patient.notes.trim()) {
      return [];
    }

    return [
      buildDivider(),
      buildSectionHeader('Clinical Notes'),
      {
        text: patient.notes,
        margin: [0, 0, 0, this.spacing.md],
        alignment: 'justify'
      }
    ];
  }

  /**
   * Build doctor info section
   */
  _buildDoctorInfo(doctor) {
    return [
      buildSectionHeader('Doctor Information'),
      buildInfoRow('Doctor ID', doctor._id?.toString()),
      buildInfoRow('Name', doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()),
      buildInfoRow('Email', doctor.email),
      buildInfoRow('Phone', doctor.phone),
      buildInfoRow('Specialization', doctor.specialization || 'N/A')
    ];
  }

  /**
   * Build performance metrics section
   */
  _buildPerformanceMetrics(appointments, patients, dateRange) {
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const completionRate = appointments.length > 0 
      ? Math.round((completed / appointments.length) * 100) 
      : 0;

    return [
      buildDivider(),
      buildSectionHeader('Performance Metrics'),
      buildInfoRow('Report Period', 
        `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
      ),
      buildInfoRow('Total Appointments', appointments.length.toString()),
      buildInfoRow('Completed', completed.toString()),
      buildInfoRow('Completion Rate', `${completionRate}%`),
      buildInfoRow('Total Patients', patients.length.toString())
    ];
  }

  /**
   * Build appointments list section
   */
  _buildAppointmentsList(appointments) {
    if (!appointments || appointments.length === 0) {
      return [];
    }

    const headers = ['Date', 'Patient', 'Type', 'Status'];
    const rows = appointments.slice(0, 15).map(apt => [
      new Date(apt.startAt).toLocaleDateString(),
      apt.patientId ? `${apt.patientId.firstName} ${apt.patientId.lastName || ''}`.trim() : 'N/A',
      apt.appointmentType || 'Consultation',
      apt.status || 'Scheduled'
    ]);

    return [
      buildDivider(),
      buildSectionHeader('Appointments'),
      buildTable(headers, rows, { widths: [100, 150, 100, 80] })
    ];
  }

  /**
   * Build patients list section
   */
  _buildPatientsList(patients) {
    if (!patients || patients.length === 0) {
      return [];
    }

    const headers = ['Patient Name', 'Age', 'Gender', 'Last Visit'];
    const rows = patients.slice(0, 10).map(p => [
      `${p.firstName} ${p.lastName || ''}`.trim(),
      (p.age || 'N/A').toString(),
      p.gender || 'N/A',
      p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'Never'
    ]);

    return [
      buildDivider(),
      buildSectionHeader('Patients'),
      buildTable(headers, rows, { widths: [150, 50, 70, 100] })
    ];
  }

  /**
   * Create PDF from document definition
   */
  createPdf(docDefinition) {
    const printer = new PdfPrinter(config.fonts);
    return printer.createPdfKitDocument(docDefinition);
  }
}

module.exports = ProperPdfGenerator;
