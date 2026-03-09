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
  generateDoctorReport(doctor, arg2 = [], arg3 = [], arg4 = [], arg5 = []) {
    let patients = [];
    let weekAppointments = [];
    let totalAppointments = [];
    let activePatients = [];

    // Backward compatibility:
    // Old signature: (doctor, appointments, patients, dateRange)
    // New signature: (doctor, patients, weekAppointments, totalAppointments, activePatients)
    if (Array.isArray(arg2) && arg2.length > 0 && this._looksLikeAppointment(arg2[0])) {
      totalAppointments = arg2;
      patients = Array.isArray(arg3) ? arg3 : [];
      const dateRange = (arg4 && typeof arg4 === 'object' && !Array.isArray(arg4)) ? arg4 : null;

      if (dateRange?.start || dateRange?.end) {
        const start = this._toValidDate(dateRange.start);
        const end = this._toValidDate(dateRange.end);
        weekAppointments = totalAppointments.filter((apt) => {
          const d = this._toValidDate(apt.startAt);
          if (!d) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        });
      } else {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAppointments = totalAppointments.filter((apt) => {
          const d = this._toValidDate(apt.startAt);
          return d && d >= weekAgo;
        });
      }
      activePatients = [];
    } else {
      patients = Array.isArray(arg2) ? arg2 : [];
      weekAppointments = Array.isArray(arg3) ? arg3 : [];
      totalAppointments = Array.isArray(arg4) ? arg4 : [];
      activePatients = Array.isArray(arg5) ? arg5 : [];
    }

    const doctorName = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();

    const content = [
      this._buildDoctorInfo(doctor),
      this._buildPerformanceMetrics(patients, weekAppointments, totalAppointments, activePatients),
      this._buildAppointmentsList(weekAppointments, 'This Week\'s Appointments', 20),
      this._buildAppointmentsList(totalAppointments, 'Recent Appointments History', 30)
    ];

    // Only add patient-focused sections when there is actual data.
    if (Array.isArray(patients) && patients.length > 0) {
      content.push(this._buildPatientsList(patients, 'Assigned Patients', 30));
    }
    if (Array.isArray(activePatients) && activePatients.length > 0) {
      content.push(this._buildActivePatientsList(activePatients));
    }

    const docDefinition = {
      pageSize: config.page.size,
      pageMargins: config.page.margins,
      header: buildHeader('Doctor Performance Report', doctorName),
      footer: buildFooter(),
      content,
      styles: getStyles(),
      defaultStyle: {
        fontSize: this.fontSize.body,
        color: this.colors.text
      }
    };

    return docDefinition;
  }

  /**
   * Generate staff information report
   */
  generateStaffReport(staff) {
    const staffName = staff.name || 'Unknown';

    const docDefinition = {
      pageSize: config.page.size,
      pageMargins: config.page.margins,
      header: buildHeader('Staff Information Report', staffName),
      footer: buildFooter(),
      content: [
        this._buildStaffInfo(staff),
        this._buildStaffRoles(staff),
        this._buildStaffSchedule(staff),
        this._buildStaffNotes(staff)
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
    const allergies = this._formatAllergies(patient.allergies);

    return [
      buildDivider(),
      buildSectionHeader('Allergies'),
      {
        text: allergies,
        style: allergies !== 'None recorded' ? 'danger' : 'value',
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
        text: `• ${this._safeValue(rx.medication)} - ${this._safeValue(rx.dosage)}`,
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
    const noteText = this._formatNarrative(patient.notes);
    if (!noteText) {
      return [];
    }

    return [
      buildDivider(),
      buildSectionHeader('Clinical Notes'),
      {
        text: noteText,
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
   * Build staff info section
   */
  _buildStaffInfo(staff) {
    return [
      buildSectionHeader('Personal Information'),
      buildInfoRow('Staff ID', staff.patientFacingId || staff._id?.toString() || 'N/A'),
      buildInfoRow('Name', staff.name || 'N/A'),
      buildInfoRow('Designation', staff.designation || 'N/A'),
      buildInfoRow('Department', staff.department || 'N/A'),
      buildInfoRow('Email', staff.email || 'N/A'),
      buildInfoRow('Phone', staff.phone || staff.contact || 'N/A'),
      buildInfoRow('Status', staff.status || 'N/A'),
      buildInfoRow('Gender', staff.gender || 'N/A'),
      buildInfoRow('Date of Birth', staff.dob ? new Date(staff.dob).toLocaleDateString() : 'N/A'),
      buildInfoRow('Joined Date', staff.joinedAt ? new Date(staff.joinedAt).toLocaleDateString() : 'N/A')
    ];
  }

  /**
   * Build staff role and qualification section
   */
  _buildStaffRoles(staff) {
    const roles = Array.isArray(staff.roles) ? staff.roles.filter(Boolean) : [];
    const qualifications = Array.isArray(staff.qualifications) ? staff.qualifications.filter(Boolean) : [];

    return [
      buildDivider(),
      buildSectionHeader('Roles & Qualifications'),
      buildInfoRow('Roles', roles.length > 0 ? roles.join(', ') : 'N/A'),
      buildInfoRow('Qualifications', qualifications.length > 0 ? qualifications.join(', ') : 'N/A'),
      buildInfoRow('Experience (Years)', (staff.experienceYears ?? 'N/A').toString())
    ];
  }

  /**
   * Build staff schedule section
   */
  _buildStaffSchedule(staff) {
    const schedule = staff.schedule || staff.workingHours || {};
    const scheduleEntries = schedule && typeof schedule === 'object' && !Array.isArray(schedule)
      ? Object.entries(schedule)
      : [];

    if (scheduleEntries.length === 0) {
      return [
        buildDivider(),
        buildSectionHeader('Work Schedule'),
        buildInfoRow('Schedule', 'No schedule information available')
      ];
    }

    const rows = scheduleEntries.map(([day, hours]) => [
      this._humanizeKey(day),
      this._safeValue(hours)
    ]);

    return [
      buildDivider(),
      buildSectionHeader('Work Schedule'),
      buildTable(['Day', 'Hours'], rows, { widths: [140, '*'] })
    ];
  }

  /**
   * Build staff additional information section
   */
  _buildStaffNotes(staff) {
    const tags = Array.isArray(staff.tags) ? staff.tags.filter(Boolean) : [];
    const noteText = this._flattenStaffNotes(staff.notes);

    const content = [
      buildDivider(),
      buildSectionHeader('Additional Information')
    ];

    if (tags.length > 0) {
      content.push(buildInfoRow('Tags', tags.join(', ')));
    }

    if (noteText) {
      content.push(buildInfoRow('Comments / Notes', noteText));
    } else {
      content.push(buildInfoRow('Comments / Notes', 'No additional notes'));
    }

    return content;
  }

  _flattenStaffNotes(notes) {
    if (!notes) return '';

    if (typeof notes === 'string') {
      return notes.trim();
    }

    if (Array.isArray(notes)) {
      const values = notes.map((v) => this._safeValue(v)).filter((v) => v && v !== 'N/A');
      return values.join(' ').trim();
    }

    if (typeof notes === 'object') {
      const entries = Object.entries(notes);
      if (entries.length === 0) return '';

      // Handle legacy malformed objects like {"0":"H","1":"e",...}
      const numericKeysOnly = entries.every(([k]) => /^\d+$/.test(k));
      if (numericKeysOnly) {
        return entries
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([, v]) => (v == null ? '' : String(v)))
          .join('')
          .trim();
      }

      return entries
        .map(([k, v]) => {
          const value = this._safeValue(v);
          if (value === 'N/A') return '';
          if (k.toLowerCase() === 'notes' || k.toLowerCase() === 'general') return value;
          return `${this._humanizeKey(k)}: ${value}`;
        })
        .filter(Boolean)
        .join(' | ')
        .trim();
    }

    const text = this._safeValue(notes);
    return text === 'N/A' ? '' : text;
  }

  _safeValue(value) {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'string') return value.trim() || 'N/A';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      const items = value.map((v) => this._safeValue(v)).filter((v) => v !== 'N/A');
      return items.length > 0 ? items.join(', ') : 'N/A';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (err) {
        return String(value);
      }
    }
    return String(value);
  }

  _humanizeKey(key) {
    if (!key) return 'Field';
    return String(key)
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (s) => s.toUpperCase());
  }

  _formatAllergies(allergies) {
    if (!allergies) return 'None recorded';

    if (typeof allergies === 'string') {
      const text = allergies.trim();
      return text || 'None recorded';
    }

    if (Array.isArray(allergies)) {
      const values = allergies.map((v) => this._safeValue(v)).filter((v) => v !== 'N/A');
      return values.length > 0 ? values.join(', ') : 'None recorded';
    }

    if (typeof allergies === 'object') {
      const values = Object.values(allergies).map((v) => this._safeValue(v)).filter((v) => v !== 'N/A');
      return values.length > 0 ? values.join(', ') : 'None recorded';
    }

    const text = this._safeValue(allergies);
    return text === 'N/A' ? 'None recorded' : text;
  }

  _formatNarrative(value) {
    if (!value) return '';

    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value
        .map((v) => this._safeValue(v))
        .filter((v) => v !== 'N/A')
        .join('\n');
    }

    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => `${this._humanizeKey(k)}: ${this._safeValue(v)}`)
        .filter((line) => !line.endsWith(': N/A'))
        .join('\n');
    }

    const text = this._safeValue(value);
    return text === 'N/A' ? '' : text;
  }

  /**
   * Build performance metrics section
   */
  _buildPerformanceMetrics(patients, weekAppointments, totalAppointments, activePatients) {
    const completed = totalAppointments.filter(a => (a.status || '').toLowerCase() === 'completed').length;
    const completionRate = totalAppointments.length > 0
      ? Math.round((completed / totalAppointments.length) * 100)
      : 0;

    const validDates = weekAppointments
      .map(a => this._toValidDate(a.startAt))
      .filter(Boolean)
      .sort((a, b) => a - b);

    const reportPeriod = validDates.length > 0
      ? `${validDates[0].toLocaleDateString()} - ${validDates[validDates.length - 1].toLocaleDateString()}`
      : 'N/A';

    return [
      buildDivider(),
      buildSectionHeader('Performance Metrics'),
      buildInfoRow('Report Period', reportPeriod),
      buildInfoRow('Week Appointments', weekAppointments.length.toString()),
      buildInfoRow('Total Appointments', totalAppointments.length.toString()),
      buildInfoRow('Completed', completed.toString()),
      buildInfoRow('Completion Rate', `${completionRate}%`),
      buildInfoRow('Total Patients', patients.length.toString()),
      buildInfoRow('Active Patients', (activePatients || []).length.toString())
    ];
  }

  /**
   * Build appointments list section
   */
  _buildAppointmentsList(appointments, title = 'Appointments', limit = 15) {
    if (!appointments || appointments.length === 0) {
      return [
        buildDivider(),
        buildSectionHeader(title),
        buildInfoRow('Info', 'No appointments found')
      ];
    }

    const headers = ['Date', 'Time', 'Patient', 'Type', 'Status'];
    const rows = appointments.slice(0, limit).map(apt => {
      const dt = this._toValidDate(apt.startAt);
      const dateText = dt ? dt.toLocaleDateString() : 'N/A';
      const timeText = dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
      const patientName = apt.patientName
        || (apt.patientId && typeof apt.patientId === 'object' && (apt.patientId.firstName || apt.patientId.lastName)
          ? `${apt.patientId.firstName || ''} ${apt.patientId.lastName || ''}`.trim()
          : 'N/A');

      return [
        dateText,
        timeText,
        this._display(patientName),
        apt.appointmentType || 'Consultation',
        apt.status || 'Scheduled'
      ];
    });

    return [
      buildDivider(),
      buildSectionHeader(title),
      buildTable(headers, rows, { widths: [90, 70, 150, 100, 80] })
    ];
  }

  /**
   * Build patients list section
   */
  _buildPatientsList(patients, title = 'Patients', limit = 10) {
    if (!patients || patients.length === 0) {
      return [];
    }

    const headers = ['Patient Name', 'Age', 'Gender', 'Last Visit'];
    const rows = patients.slice(0, limit).map(p => [
      this._display(`${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || p.patientName),
      this._display((p.age || 'N/A').toString()),
      this._display(p.gender),
      this._toValidDate(p.lastVisit || p.updatedAt || p.createdAt)?.toLocaleDateString() || 'Never'
    ]);

    return [
      buildDivider(),
      buildSectionHeader(title),
      buildTable(headers, rows, { widths: [150, 50, 70, 100] })
    ];
  }

  _buildActivePatientsList(activePatients) {
    if (!activePatients || activePatients.length === 0) {
      return [];
    }

    const headers = ['Patient Name', 'Age', 'Blood Group', 'Next Appointment', 'Phone'];
    const rows = activePatients.slice(0, 20).map((p) => {
      const next = this._toValidDate(p.nextAppointment);
      return [
        this._display(`${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || p.patientName),
        this._display((p.age || 'N/A').toString()),
        this._display(p.bloodGroup),
        next ? `${next.toLocaleDateString()} ${next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A',
        this._display(p.phone)
      ];
    });

    return [
      buildDivider(),
      buildSectionHeader('Active Patients (Upcoming Appointments)'),
      buildTable(headers, rows, { widths: [130, 45, 80, 150, 90] })
    ];
  }

  _toValidDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  _looksLikeAppointment(item) {
    if (!item || typeof item !== 'object') return false;
    return 'startAt' in item || 'appointmentType' in item || 'status' in item;
  }

  _display(value) {
    if (value === null || value === undefined) return 'N/A';
    const text = String(value).trim();
    if (!text) return 'N/A';
    const lowered = text.toLowerCase();
    if (lowered === 'undefined' || lowered === 'null' || lowered === 'nan') return 'N/A';
    return text;
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
