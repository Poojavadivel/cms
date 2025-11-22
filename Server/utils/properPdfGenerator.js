// utils/properPdfGenerator.js
// PROPER PDF generator using pdfmake - handles layout correctly
const PdfPrinter = require('pdfmake');
const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/vfs_fonts.js',
    bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    italics: 'node_modules/pdfmake/build/vfs_fonts.js',
    bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js'
  }
};

class ProperPdfGenerator {
  constructor() {
    // 8px grid system - all spacing multiples of 8
    this.spacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    };

    // Consistent colors
    this.colors = {
      primary: '#1a365d',
      secondary: '#2563eb',
      accent: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      text: '#1f2937',
      textLight: '#6b7280',
      border: '#e5e7eb'
    };

    // Font sizes
    this.fontSize = {
      h1: 24,
      h2: 18,
      h3: 14,
      body: 11,
      small: 9
    };
  }

  // Generate patient report (returns document definition, not PDF object)
  generatePatientReport(patient, doctor, appointments) {
    const patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
    
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 80, 50, 80],
      
      header: this._buildHeader('Patient Medical Report', patientName),
      footer: this._buildFooter(),
      
      content: [
        this._buildPatientInfo(patient, doctor),
        this._buildVitals(patient),
        this._buildAllergies(patient),
        this._buildPrescriptions(patient),
        this._buildAppointments(appointments),
        this._buildClinicalNotes(patient)
      ],
      
      styles: this._getStyles(),
      defaultStyle: {
        fontSize: this.fontSize.body,
        color: this.colors.text
      }
    };

    return docDefinition;
  }

  // Header
  _buildHeader(title, patientName = null) {
    return function(currentPage, pageCount) {
      return {
        columns: [
          {
            stack: [
              { text: 'Karur Gastro Foundation', style: 'headerTitle' },
              patientName ? { text: patientName, style: 'headerPatientName', margin: [0, 2, 0, 0] } : {}
            ]
          },
          {
            text: title,
            style: 'headerSubtitle',
            alignment: 'right'
          }
        ],
        margin: [50, 20, 50, 10]
      };
    };
  }

  // Footer
  _buildFooter() {
    return function(currentPage, pageCount) {
      return {
        columns: [
          {
            text: 'CONFIDENTIAL MEDICAL DOCUMENT',
            style: 'footer'
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            style: 'footer',
            alignment: 'right'
          }
        ],
        margin: [50, 10, 50, 10]
      };
    };
  }

  // Patient Info Section
  _buildPatientInfo(patient, doctor) {
    const items = [
      this._sectionHeader('Patient Demographics'),
      {
        columns: [
          { width: '50%', stack: [
            this._infoRow('Patient ID', patient._id?.toString().substring(0, 12) + '...'),
            this._infoRow('Full Name', `${patient.firstName} ${patient.lastName || ''}`.trim()),
            this._infoRow('Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'),
            this._infoRow('Age', `${patient.age || 'N/A'} years`),
            this._infoRow('Gender', patient.gender || 'N/A'),
            this._infoRow('Blood Group', patient.bloodGroup || 'Unknown')
          ]},
          { width: '50%', stack: [
            this._infoRow('Mobile', patient.phone || 'N/A'),
            this._infoRow('Email', patient.email || 'N/A'),
            this._infoRow('Address', patient.address?.street || patient.address?.line1 || 'N/A'),
            this._infoRow('City', patient.address?.city || 'N/A'),
            this._infoRow('State', patient.address?.state || 'N/A'),
            this._infoRow('PIN Code', patient.address?.pincode || 'N/A')
          ]}
        ],
        columnGap: this.spacing.md,
        margin: [0, 0, 0, this.spacing.md]
      }
    ];

    if (doctor) {
      items.push(
        { text: '', margin: [0, this.spacing.sm, 0, 0] },
        {
          table: {
            widths: ['*'],
            body: [[{
              stack: [
                { text: 'Assigned Doctor', style: 'doctorBoxTitle', margin: [0, 0, 0, 4] },
                {
                  columns: [
                    { width: '50%', text: `Dr. ${doctor.name || `${doctor.firstName} ${doctor.lastName || ''}`.trim()}`, style: 'doctorName' },
                    { width: '50%', text: doctor.specialization || doctor.designation || 'General Physician', style: 'doctorSpecialization', alignment: 'right' }
                  ]
                }
              ],
              fillColor: '#f0f9ff',
              margin: [this.spacing.sm, this.spacing.sm, this.spacing.sm, this.spacing.sm]
            }]]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#bfdbfe',
            vLineColor: () => '#bfdbfe'
          },
          margin: [0, 0, 0, this.spacing.lg]
        }
      );
    }

    return items;
  }

  // Vitals Section
  _buildVitals(patient) {
    if (!patient.vitals || Object.keys(patient.vitals).length === 0) {
      return [];
    }

    const vitals = patient.vitals;
    return [
      this._sectionHeader('Clinical Vitals'),
      {
        columns: [
          { width: '14.28%', stack: [this._vitalCard('BP', vitals.bp || '-', '#ef4444')] },
          { width: '14.28%', stack: [this._vitalCard('Pulse', vitals.pulse ? `${vitals.pulse}` : '-', '#f97316')] },
          { width: '14.28%', stack: [this._vitalCard('Temp', vitals.temp ? `${vitals.temp}°C` : '-', '#eab308')] },
          { width: '14.28%', stack: [this._vitalCard('SpO2', vitals.spo2 ? `${vitals.spo2}%` : '-', '#10b981')] },
          { width: '14.28%', stack: [this._vitalCard('Height', vitals.heightCm ? `${vitals.heightCm} cm` : '-', '#3b82f6')] },
          { width: '14.28%', stack: [this._vitalCard('Weight', vitals.weightKg ? `${vitals.weightKg} kg` : '-', '#6366f1')] },
          { width: '14.28%', stack: [this._vitalCard('BMI', vitals.bmi ? vitals.bmi.toFixed(1) : '-', '#8b5cf6')] }
        ],
        columnGap: this.spacing.xs,
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Allergies Section
  _buildAllergies(patient) {
    if (!patient.allergies || patient.allergies.length === 0) {
      return [
        {
          table: {
            widths: ['*'],
            body: [[{
              text: '✓ No known allergies recorded',
              fillColor: '#f0fdf4',
              color: '#065f46',
              bold: true,
              margin: [this.spacing.sm, this.spacing.sm, this.spacing.sm, this.spacing.sm]
            }]]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, this.spacing.md]
        }
      ];
    }

    return [
      {
        table: {
          widths: ['*'],
          body: [[{
            text: `⚠ ALLERGIES: ${patient.allergies.join(', ')}`,
            fillColor: '#fef2f2',
            color: '#991b1b',
            bold: true,
            margin: [this.spacing.sm, this.spacing.sm, this.spacing.sm, this.spacing.sm]
          }]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, this.spacing.md]
      }
    ];
  }

  // Prescriptions Section
  _buildPrescriptions(patient) {
    if (!patient.prescriptions || patient.prescriptions.length === 0) {
      return [];
    }

    const items = [this._sectionHeader('Prescription History')];

    patient.prescriptions.slice(0, 5).forEach((rx, idx) => {
      items.push({
        stack: [
          { text: `Prescription ${idx + 1}`, style: 'prescriptionTitle', margin: [0, this.spacing.sm, 0, this.spacing.xs] },
          this._infoRow('Issued Date', rx.issuedAt ? new Date(rx.issuedAt).toLocaleDateString('en-IN') : 'N/A'),
          this._infoRow('Notes', rx.notes || 'None'),
          { text: 'Medicines:', bold: true, margin: [0, this.spacing.xs, 0, this.spacing.xs] },
          {
            ul: (rx.medicines || []).map(med => 
              `${med.name || 'N/A'} - ${med.dosage || 'N/A'}, ${med.frequency || 'N/A'}, ${med.duration || 'N/A'} (Qty: ${med.quantity || 'N/A'})`
            ),
            margin: [this.spacing.md, 0, 0, this.spacing.sm]
          }
        ],
        margin: [0, 0, 0, this.spacing.md]
      });
    });

    return items;
  }

  // Appointments Section
  _buildAppointments(appointments) {
    if (!appointments || appointments.length === 0) {
      return [
        this._sectionHeader('Appointment History'),
        { text: 'No appointment history available.', style: 'noData', margin: [0, 0, 0, this.spacing.lg] }
      ];
    }

    const tableBody = [
      [
        { text: 'Date', style: 'tableHeader' },
        { text: 'Time', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
        { text: 'Location', style: 'tableHeader' }
      ]
    ];

    appointments.slice(0, 15).forEach(apt => {
      const date = new Date(apt.startAt);
      tableBody.push([
        { text: date.toLocaleDateString('en-IN'), style: 'tableCell' },
        { text: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), style: 'tableCell' },
        { text: apt.appointmentType || 'Consultation', style: 'tableCell' },
        { text: apt.status || 'Scheduled', style: 'tableCell' },
        { text: apt.location || 'N/A', style: 'tableCell' }
      ]);
    });

    return [
      this._sectionHeader('Appointment History'),
      {
        table: {
          headerRows: 1,
          widths: ['20%', '15%', '20%', '20%', '25%'],
          body: tableBody
        },
        layout: {
          fillColor: function(rowIndex) {
            return rowIndex === 0 ? '#1a365d' : (rowIndex % 2 === 0 ? '#f9fafb' : null);
          }
        },
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Clinical Notes Section
  _buildClinicalNotes(patient) {
    if (!patient.notes || !patient.notes.trim()) {
      return [];
    }

    return [
      this._sectionHeader('Clinical Notes'),
      {
        text: patient.notes,
        alignment: 'justify',
        lineHeight: 1.3,
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Helper: Section Header
  _sectionHeader(text) {
    return {
      table: {
        widths: ['*'],
        body: [[{
          text: text.toUpperCase(),
          style: 'sectionHeader',
          fillColor: '#eff6ff',
          margin: [this.spacing.sm, this.spacing.xs, this.spacing.sm, this.spacing.xs]
        }]]
      },
      layout: 'noBorders',
      margin: [0, this.spacing.md, 0, this.spacing.sm]
    };
  }

  // Helper: Subsection Header
  _subsectionHeader(text) {
    return {
      text: text,
      style: 'subsectionHeader',
      margin: [0, this.spacing.sm, 0, this.spacing.xs]
    };
  }

  // Helper: Info Row
  _infoRow(label, value) {
    return {
      columns: [
        { text: `${label}:`, width: 120, bold: true, color: this.colors.textLight },
        { text: value || 'N/A', width: '*' }
      ],
      margin: [0, 2, 0, 2]
    };
  }

  // Helper: Vital Card
  _vitalCard(label, value, accentColor = null) {
    const color = accentColor || this.colors.primary;
    return {
      table: {
        widths: ['*'],
        body: [[
          { 
            stack: [
              { text: value, bold: true, fontSize: this.fontSize.h3, alignment: 'center', color: color, margin: [0, this.spacing.xs, 0, 2] },
              { text: label, fontSize: this.fontSize.small, color: this.colors.textLight, alignment: 'center', margin: [0, 0, 0, this.spacing.xs] }
            ],
            fillColor: '#ffffff'
          }
        ]]
      },
      layout: {
        hLineWidth: () => 2,
        vLineWidth: () => 2,
        hLineColor: (i) => i === 0 ? color : this.colors.border,
        vLineColor: () => this.colors.border
      }
    };
  }

  // Styles Definition
  _getStyles() {
    return {
      headerTitle: {
        fontSize: this.fontSize.h2,
        bold: true,
        color: this.colors.primary
      },
      headerPatientName: {
        fontSize: this.fontSize.body,
        color: this.colors.textLight,
        italics: true
      },
      headerSubtitle: {
        fontSize: this.fontSize.h3,
        bold: true,
        color: this.colors.secondary
      },
      doctorBoxTitle: {
        fontSize: this.fontSize.small,
        color: this.colors.textLight,
        bold: true
      },
      doctorName: {
        fontSize: this.fontSize.body,
        color: this.colors.primary,
        bold: true
      },
      doctorSpecialization: {
        fontSize: this.fontSize.small,
        color: this.colors.textLight,
        italics: true
      },
      footer: {
        fontSize: this.fontSize.small,
        color: this.colors.textLight
      },
      sectionHeader: {
        fontSize: this.fontSize.h3,
        bold: true,
        color: this.colors.primary
      },
      subsectionHeader: {
        fontSize: this.fontSize.body,
        bold: true,
        color: this.colors.secondary
      },
      tableHeader: {
        fontSize: this.fontSize.body,
        bold: true,
        color: '#ffffff',
        fillColor: this.colors.primary,
        margin: [4, 4, 4, 4]
      },
      tableCell: {
        fontSize: this.fontSize.body,
        margin: [4, 4, 4, 4]
      },
      prescriptionTitle: {
        fontSize: this.fontSize.body,
        bold: true,
        color: this.colors.secondary
      },
      noData: {
        fontSize: this.fontSize.body,
        color: this.colors.textLight,
        italics: true
      }
    };
  }


  // Generate doctor report (combined weekly + total)
  generateDoctorReport(doctor, patients, weekAppointments, totalAppointments, activePatients) {
    const doctorName = `Dr. ${doctor.name || `${doctor.firstName} ${doctor.lastName || ''}`.trim()}`;
    
    // Get upcoming appointments (future scheduled appointments)
    const now = new Date();
    const upcomingAppointments = totalAppointments.filter(apt => 
      new Date(apt.startAt) > now && 
      (apt.status === 'Scheduled' || apt.status === 'scheduled' || apt.status === 'confirmed')
    ).slice(0, 20);
    
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 80, 50, 80],
      
      header: this._buildHeader('Doctor Performance Report', doctorName),
      footer: this._buildFooter(),
      
      content: [
        this._buildDoctorInfo(doctor),
        this._buildDoctorStats(patients, weekAppointments, totalAppointments, activePatients),
        this._buildWeeklySummary(weekAppointments),
        this._buildDoctorAppointments(upcomingAppointments, 'Upcoming Appointments', 20),
        this._buildDoctorAppointments(weekAppointments, 'This Week\'s Appointments'),
        this._buildDoctorAppointments(totalAppointments, 'Recent Appointments History', 30),
        this._buildDoctorPatients(patients, 'All Assigned Patients'),
        this._buildActivePatients(activePatients)
      ],
      
      styles: this._getStyles(),
      defaultStyle: {
        fontSize: this.fontSize.body,
        color: this.colors.text
      }
    };

    return docDefinition;
  }

  // Doctor Info Section
  _buildDoctorInfo(doctor) {
    return [
      this._sectionHeader('Doctor Information'),
      {
        columns: [
          { width: '50%', stack: [
            this._infoRow('Name', `${doctor.firstName} ${doctor.lastName || ''}`),
            this._infoRow('Specialization', doctor.specialization || 'General Physician'),
            this._infoRow('Email', doctor.email || 'N/A')
          ]},
          { width: '50%', stack: [
            this._infoRow('Phone', doctor.phone || 'N/A'),
            this._infoRow('Doctor ID', doctor._id?.toString().substring(0, 16))
          ]}
        ],
        columnGap: this.spacing.md,
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Doctor Stats Section (Weekly + Total + Active)
  _buildDoctorStats(patients, weekAppointments, totalAppointments, activePatients) {
    const totalPatients = patients.length;
    
    // Weekly stats
    const weekTotal = weekAppointments.length;
    const weekCompleted = weekAppointments.filter(a => a.status === 'Completed' || a.status === 'completed').length;
    const weekPending = weekAppointments.filter(a => a.status === 'Scheduled' || a.status === 'scheduled' || a.status === 'confirmed').length;
    const weekCancelled = weekAppointments.filter(a => a.status === 'Cancelled' || a.status === 'cancelled').length;
    
    // Total stats
    const totalTotal = totalAppointments.length;
    const totalCompleted = totalAppointments.filter(a => a.status === 'Completed' || a.status === 'completed').length;
    const totalPending = totalAppointments.filter(a => a.status === 'Scheduled' || a.status === 'scheduled' || a.status === 'confirmed').length;
    
    // Active stats (appointments in future)
    const now = new Date();
    const activeAppointments = totalAppointments.filter(a => new Date(a.startAt) > now && (a.status === 'Scheduled' || a.status === 'scheduled' || a.status === 'confirmed')).length;

    return [
      this._sectionHeader('Performance Overview'),
      
      // Weekly Stats Row
      {
        table: {
          widths: ['*'],
          body: [[{
            text: 'THIS WEEK (Last 7 Days)',
            style: 'subsectionHeader',
            fillColor: '#eff6ff',
            margin: [this.spacing.xs, this.spacing.xs, this.spacing.xs, this.spacing.xs]
          }]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, this.spacing.xs]
      },
      {
        columns: [
          { width: '25%', stack: [this._vitalCard('Total', weekTotal, '#3b82f6')] },
          { width: '25%', stack: [this._vitalCard('Completed', weekCompleted, '#10b981')] },
          { width: '25%', stack: [this._vitalCard('Pending', weekPending, '#f59e0b')] },
          { width: '25%', stack: [this._vitalCard('Cancelled', weekCancelled, '#ef4444')] }
        ],
        columnGap: this.spacing.sm,
        margin: [0, 0, 0, this.spacing.md]
      },
      
      // Total Stats Row
      {
        table: {
          widths: ['*'],
          body: [[{
            text: 'OVERALL STATISTICS (All Time)',
            style: 'subsectionHeader',
            fillColor: '#f0fdf4',
            margin: [this.spacing.xs, this.spacing.xs, this.spacing.xs, this.spacing.xs]
          }]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, this.spacing.xs]
      },
      {
        columns: [
          { width: '20%', stack: [this._vitalCard('Patients', totalPatients, '#8b5cf6')] },
          { width: '20%', stack: [this._vitalCard('Active', Array.isArray(activePatients) ? activePatients.length : 0, '#ec4899')] },
          { width: '20%', stack: [this._vitalCard('Total Appts', totalTotal, '#6366f1')] },
          { width: '20%', stack: [this._vitalCard('Completed', totalCompleted, '#10b981')] },
          { width: '20%', stack: [this._vitalCard('Upcoming', activeAppointments, '#f59e0b')] }
        ],
        columnGap: this.spacing.sm,
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Weekly Summary Section
  _buildWeeklySummary(weekAppointments) {
    if (weekAppointments.length === 0) {
      return [];
    }

    // Calculate daily breakdown
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const dailyCount = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    weekAppointments.forEach(apt => {
      const date = new Date(apt.startAt);
      const dayKey = date.toLocaleDateString('en-IN');
      dailyCount[dayKey] = (dailyCount[dayKey] || 0) + 1;
    });

    const dailyData = Object.entries(dailyCount).slice(0, 7);

    return [
      this._sectionHeader('Weekly Activity'),
      {
        table: {
          widths: Array(dailyData.length).fill('*'),
          body: [
            dailyData.map(([date]) => ({
              text: new Date(date.split('/').reverse().join('-')).toLocaleDateString('en-IN', { weekday: 'short' }),
              style: 'tableCell',
              alignment: 'center',
              bold: true,
              color: this.colors.textLight
            })),
            dailyData.map(([_, count]) => ({
              text: count.toString(),
              style: 'tableHeader',
              alignment: 'center',
              fontSize: this.fontSize.h3
            }))
          ]
        },
        layout: {
          fillColor: (rowIndex) => rowIndex === 1 ? '#eff6ff' : null,
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => this.colors.border,
          vLineColor: () => this.colors.border
        },
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Doctor Appointments Section (Flexible)
  _buildDoctorAppointments(appointments, title = 'Appointments', limit = 20) {
    if (!appointments || appointments.length === 0) {
      return [
        this._sectionHeader(title),
        { text: 'No appointments found.', style: 'noData', margin: [0, 0, 0, this.spacing.lg] }
      ];
    }

    const tableBody = [
      [
        { text: 'Date', style: 'tableHeader' },
        { text: 'Time', style: 'tableHeader' },
        { text: 'Patient', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' }
      ]
    ];

    const displayCount = appointments.slice(0, limit);
    displayCount.forEach(apt => {
      try {
        // Safe date handling
        let dateText = 'N/A';
        let timeText = 'N/A';
        if (apt.startAt) {
          try {
            const date = new Date(apt.startAt);
            if (!isNaN(date.getTime())) {
              dateText = date.toLocaleDateString('en-IN');
              timeText = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (err) {
            console.error('Error formatting appointment date:', err);
          }
        }
        
        const statusColor = apt.status === 'Completed' || apt.status === 'completed' ? '#10b981' : 
                           apt.status === 'Cancelled' || apt.status === 'cancelled' ? '#ef4444' : 
                           this.colors.text;
        
        tableBody.push([
          { text: dateText, style: 'tableCell' },
          { text: timeText, style: 'tableCell' },
          { text: apt.patientName || 'N/A', style: 'tableCell' },
          { text: apt.appointmentType || 'Consultation', style: 'tableCell' },
          { text: apt.status || 'Scheduled', style: 'tableCell', color: statusColor, bold: true }
        ]);
      } catch (err) {
        console.error('Error processing appointment item:', err, apt);
        // Skip this appointment if there's an error
      }
    });

    const subtitle = appointments.length > limit ? 
      `Showing ${limit} of ${appointments.length} appointments` : 
      `Total: ${appointments.length} appointments`;

    return [
      this._sectionHeader(title),
      { text: subtitle, style: 'noData', margin: [0, 0, 0, this.spacing.xs] },
      {
        table: {
          headerRows: 1,
          widths: ['18%', '15%', '25%', '22%', '20%'],
          body: tableBody
        },
        layout: {
          fillColor: function(rowIndex) {
            return rowIndex === 0 ? '#1a365d' : (rowIndex % 2 === 0 ? '#f9fafb' : null);
          }
        },
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Doctor Patients Section (All Patients)
  _buildDoctorPatients(patients, title = 'Assigned Patients') {
    if (!patients || patients.length === 0) {
      return [
        this._sectionHeader(title),
        { text: 'No patients assigned.', style: 'noData', margin: [0, 0, 0, this.spacing.lg] }
      ];
    }

    const tableBody = [
      [
        { text: 'Name', style: 'tableHeader' },
        { text: 'Age', style: 'tableHeader' },
        { text: 'Gender', style: 'tableHeader' },
        { text: 'Blood Group', style: 'tableHeader' },
        { text: 'Phone', style: 'tableHeader' }
      ]
    ];

    const displayCount = patients.slice(0, 30);
    displayCount.forEach(patient => {
      try {
        // Safe handling of patient data
        const patientName = `${patient.firstName || 'N/A'} ${patient.lastName || ''}`.trim();
        const patientAge = patient.age?.toString() || 'N/A';
        const patientGender = patient.gender || 'N/A';
        const patientBloodGroup = patient.bloodGroup || 'N/A';
        const patientPhone = patient.phone || 'N/A';
        
        tableBody.push([
          { text: patientName, style: 'tableCell' },
          { text: patientAge, style: 'tableCell' },
          { text: patientGender, style: 'tableCell' },
          { text: patientBloodGroup, style: 'tableCell' },
          { text: patientPhone, style: 'tableCell' }
        ]);
      } catch (err) {
        console.error('Error processing patient item:', err, patient);
        // Skip this patient if there's an error
      }
    });

    const subtitle = patients.length > 30 ? 
      `Showing 30 of ${patients.length} patients` : 
      `Total: ${patients.length} patients`;

    return [
      this._sectionHeader(title),
      { text: subtitle, style: 'noData', margin: [0, 0, 0, this.spacing.xs] },
      {
        table: {
          headerRows: 1,
          widths: ['30%', '10%', '15%', '20%', '25%'],
          body: tableBody
        },
        layout: {
          fillColor: function(rowIndex) {
            return rowIndex === 0 ? '#1a365d' : (rowIndex % 2 === 0 ? '#f9fafb' : null);
          }
        },
        margin: [0, 0, 0, this.spacing.lg]
      }
    ];
  }

  // Active Patients Section (Patients with upcoming appointments)
  _buildActivePatients(activePatients) {
    // Validate input
    if (!activePatients || !Array.isArray(activePatients)) {
      console.error('Invalid activePatients input:', typeof activePatients);
      return {
        stack: [
          this._sectionHeader('Active Patients (With Upcoming Appointments)'),
          { text: 'Error: Invalid data format', style: 'noData', margin: [0, 0, 0, this.spacing.lg] }
        ]
      };
    }
    
    if (activePatients.length === 0) {
      return {
        stack: [
          this._sectionHeader('Active Patients (With Upcoming Appointments)'),
          { text: 'No active patients with upcoming appointments', style: 'noData', margin: [0, 0, 0, this.spacing.lg] }
        ]
      };
    }

    const tableBody = [
      [
        { text: 'Patient Name', style: 'tableHeader' },
        { text: 'Age', style: 'tableHeader' },
        { text: 'Blood Group', style: 'tableHeader' },
        { text: 'Next Appointment', style: 'tableHeader' },
        { text: 'Phone', style: 'tableHeader' }
      ]
    ];

    console.log(`[PDF Generator] Processing ${activePatients.length} active patients`);
    
    activePatients.slice(0, 20).forEach((item, index) => {
      console.log(`[PDF Generator] Processing patient ${index + 1}:`, {
        firstName: item.firstName,
        hasId: !!item._id,
        keys: Object.keys(item)
      });
      try {
        // Safe handling of patient data
        const patientName = `${item.firstName || 'N/A'} ${item.lastName || ''}`.trim();
        const patientAge = item.age?.toString() || 'N/A';
        const patientBloodGroup = item.bloodGroup || 'N/A';
        const patientPhone = item.phone || 'N/A';
        
        let appointmentText = 'N/A';
        if (item.nextAppointment) {
          try {
            const nextDate = new Date(item.nextAppointment);
            if (!isNaN(nextDate.getTime())) {
              appointmentText = nextDate.toLocaleDateString('en-IN') + ' ' + 
                              nextDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (err) {
            console.error('Error formatting appointment date:', err);
          }
        }
        
        tableBody.push([
          { text: patientName, style: 'tableCell', bold: true },
          { text: patientAge, style: 'tableCell' },
          { text: patientBloodGroup, style: 'tableCell' },
          { text: appointmentText, style: 'tableCell', color: '#10b981', bold: true },
          { text: patientPhone, style: 'tableCell' }
        ]);
      } catch (err) {
        console.error('Error processing active patient item:', err, item);
        // Skip this patient if there's an error
      }
    });

    return {
      stack: [
        this._sectionHeader('Active Patients (With Upcoming Appointments)'),
        { text: `${activePatients.length} patients with scheduled appointments`, style: 'noData', margin: [0, 0, 0, this.spacing.xs] },
        {
          table: {
            headerRows: 1,
            widths: ['25%', '10%', '15%', '30%', '20%'],
            body: tableBody
          },
          layout: {
            fillColor: function(rowIndex) {
              return rowIndex === 0 ? '#1a365d' : (rowIndex % 2 === 0 ? '#f0fdf4' : null);
            }
          },
          margin: [0, 0, 0, this.spacing.lg]
        }
      ]
    };
  }

  // Generate staff report
  generateStaffReport(staff) {
    const staffName = staff.name || 'Unknown';
    
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 80, 50, 80],
      
      header: this._buildHeader('Staff Information Report', staffName),
      footer: this._buildFooter(),
      
      content: [
        this._buildStaffInfo(staff),
        this._buildStaffRolesAndPermissions(staff),
        this._buildStaffSchedule(staff),
        this._buildStaffNotes(staff)
      ],
      
      styles: this._getStyles(),
      defaultStyle: {
        fontSize: this.fontSize.body,
        color: this.colors.text
      }
    };

    return docDefinition;
  }

  // Build staff information section
  _buildStaffInfo(staff) {
    const infoRows = [
      ['Staff ID', staff.patientFacingId || staff._id || '-'],
      ['Name', staff.name || '-'],
      ['Designation', staff.designation || '-'],
      ['Department', staff.department || '-'],
      ['Email', staff.email || '-'],
      ['Phone', staff.phone || staff.contact || '-'],
      ['Status', staff.status || 'Active'],
      ['Gender', staff.gender || '-'],
      ['Date of Birth', staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : '-'],
      ['Joined Date', staff.joinedDate ? new Date(staff.joinedDate).toLocaleDateString() : 
                      staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : '-']
    ];

    return {
      stack: [
        this._sectionHeader('Personal Information'),
        {
          table: {
            widths: ['40%', '60%'],
            body: infoRows.map(([label, value]) => [
              { text: label, style: 'label', fillColor: '#f9fafb' },
              { text: value, style: 'value' }
            ])
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, this.spacing.lg]
        }
      ]
    };
  }

  // Build roles and permissions section
  _buildStaffRolesAndPermissions(staff) {
    const roles = staff.roles || [];
    const permissions = staff.permissions || [];

    return {
      stack: [
        this._sectionHeader('Roles & Permissions'),
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Roles', style: 'subsectionHeader', margin: [0, 0, 0, this.spacing.sm] },
                roles.length > 0 ? {
                  ul: roles.map(role => role.charAt(0).toUpperCase() + role.slice(1)),
                  margin: [0, 0, 0, this.spacing.md]
                } : {
                  text: 'No roles assigned',
                  style: 'noData',
                  margin: [0, 0, 0, this.spacing.md]
                }
              ]
            },
            {
              width: '50%',
              stack: [
                { text: 'Permissions', style: 'subsectionHeader', margin: [0, 0, 0, this.spacing.sm] },
                permissions.length > 0 ? {
                  ul: permissions.map(perm => perm.charAt(0).toUpperCase() + perm.slice(1)),
                  margin: [0, 0, 0, this.spacing.md]
                } : {
                  text: 'Standard permissions',
                  style: 'noData',
                  margin: [0, 0, 0, this.spacing.md]
                }
              ]
            }
          ],
          columnGap: this.spacing.md,
          margin: [0, 0, 0, this.spacing.lg]
        }
      ]
    };
  }

  // Build staff schedule section
  _buildStaffSchedule(staff) {
    const schedule = staff.schedule || staff.workingHours || {};
    
    return {
      stack: [
        this._sectionHeader('Work Schedule'),
        schedule && Object.keys(schedule).length > 0 ? {
          table: {
            widths: ['30%', '70%'],
            body: Object.entries(schedule).map(([day, hours]) => [
              { text: day.charAt(0).toUpperCase() + day.slice(1), style: 'label', fillColor: '#f9fafb' },
              { text: hours || 'Not scheduled', style: 'value' }
            ])
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, this.spacing.lg]
        } : {
          text: 'No schedule information available',
          style: 'noData',
          margin: [0, 0, 0, this.spacing.lg]
        }
      ]
    };
  }

  // Build staff notes section
  _buildStaffNotes(staff) {
    const notes = staff.notes || {};
    const tags = staff.tags || [];

    return {
      stack: [
        this._sectionHeader('Additional Information'),
        tags.length > 0 ? {
          stack: [
            { text: 'Tags', style: 'subsectionHeader', margin: [0, 0, 0, this.spacing.sm] },
            {
              text: tags.join(', '),
              style: 'value',
              margin: [0, 0, 0, this.spacing.md]
            }
          ]
        } : {},
        notes && Object.keys(notes).length > 0 ? {
          stack: [
            { text: 'Notes', style: 'subsectionHeader', margin: [0, 0, 0, this.spacing.sm] },
            {
              table: {
                widths: ['30%', '70%'],
                body: Object.entries(notes).map(([key, value]) => [
                  { text: key.charAt(0).toUpperCase() + key.slice(1), style: 'label', fillColor: '#f9fafb' },
                  { text: value || '-', style: 'value' }
                ])
              },
              layout: 'lightHorizontalLines',
              margin: [0, 0, 0, this.spacing.md]
            }
          ]
        } : {
          text: 'No additional notes',
          style: 'noData',
          margin: [0, 0, 0, this.spacing.md]
        }
      ]
    };
  }

}

module.exports = new ProperPdfGenerator();
