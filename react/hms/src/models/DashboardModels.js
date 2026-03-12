/**
 * Dashboard Models
 * Models for dashboard appointments and related data
 */

export class DashboardAppointments {
  constructor({
    id,
    patientName,
    patientAge,
    date,
    time,
    reason,
    doctor,
    status,
    gender,
    patientId,
    service,
    patientAvatarUrl = '',
    isSelected = false,
    previousNotes = null,
    currentNotes = null,
    pharmacy = [],
    pathology = [],
    diabetesType = 'Type 2',
    location = '',
    occupation = '',
    dob = '',
    bmi = 0.0,
    weight = 0,
    height = 0,
    bp = '',
    diagnosis = [],
    barriers = [],
    timeline = [],
    history = {},
    bloodGroup = null,
    patientCode = null,
    appointmentId = null,
    metadata = null,
  }) {
    this.id = id;
    this.patientName = patientName;
    this.patientAge = patientAge;
    this.date = date;
    this.time = time;
    this.reason = reason;
    this.doctor = doctor;
    this.status = status;
    this.gender = gender;
    this.patientId = patientId;
    this.service = service;
    this.patientAvatarUrl = patientAvatarUrl;
    this.isSelected = isSelected;
    this.previousNotes = previousNotes;
    this.currentNotes = currentNotes;
    this.pharmacy = pharmacy;
    this.pathology = pathology;
    this.diabetesType = diabetesType;
    this.location = location;
    this.occupation = occupation;
    this.dob = dob;
    this.bmi = bmi;
    this.weight = weight;
    this.height = height;
    this.bp = bp;
    this.diagnosis = diagnosis;
    this.barriers = barriers;
    this.timeline = timeline;
    this.history = history;
    this.bloodGroup = bloodGroup;
    this.patientCode = patientCode;
    this.appointmentId = appointmentId;
    this.metadata = metadata;
  }

  static _formatTime(dt) {
    if (!dt) return '';
    const h = dt.getHours().toString().padStart(2, '0');
    const m = dt.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  static fromJSON(json) {
    let doctorName = '';
    if (json.doctorId && typeof json.doctorId === 'object') {
      const d = json.doctorId;
      doctorName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
    } else if (typeof json.doctorId === 'string') {
      doctorName = json.doctorId;
    }

    let patientId = '';
    let patientFullName = '';
    let gender = '';
    let bloodGroup = null;
    let patientCode = null;
    let patientAge = 0;

    if (json.patientId && typeof json.patientId === 'object') {
      const p = json.patientId;
      patientId = p._id || '';
      patientFullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
      gender = p.gender || '';
      bloodGroup = p.bloodGroup?.toString();

      if (p.metadata && typeof p.metadata === 'object') {
        patientCode = p.metadata.patientCode?.toString();
      }

      if (p.dateOfBirth) {
        try {
          const dob = new Date(p.dateOfBirth);
          if (dob) {
            const today = new Date();
            patientAge = today.getFullYear() - dob.getFullYear();
            if (today.getMonth() < dob.getMonth() || 
                (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
              patientAge--;
            }
            if (patientAge < 0) patientAge = 0;
          }
        } catch {}
      }
    } else if (typeof json.patientId === 'string') {
      patientId = json.patientId;
      patientFullName = json.clientName || '';
    }

    let date = json.date || '';
    let time = json.time || '';
    if (!date && json.startAt) {
      try {
        const startAt = new Date(json.startAt);
        date = startAt.toISOString().split('T')[0];
        time = DashboardAppointments._formatTime(startAt);
      } catch {}
    }

    let reason = '';
    if (json.chiefComplaint?.toString().trim()) {
      reason = json.chiefComplaint.toString().trim();
    } else if (json.reason?.toString().trim()) {
      reason = json.reason.toString().trim();
    } else if (json.metadata && typeof json.metadata === 'object') {
      const meta = json.metadata;
      if (meta.chiefComplaint?.toString().trim()) {
        reason = meta.chiefComplaint.toString().trim();
      } else if (meta.reason?.toString().trim()) {
        reason = meta.reason.toString().trim();
      }
    }

    if (!reason && json.notes?.toString().trim()) {
      reason = json.notes.toString().trim();
    }

    return new DashboardAppointments({
      id: json._id || '',
      patientName: patientFullName || json.clientName || '',
      patientAge: typeof json.patientAge === 'number' 
        ? json.patientAge 
        : (patientAge > 0 ? patientAge : parseInt(json.patientAge) || 0),
      date,
      time,
      reason,
      doctor: doctorName,
      status: json.status || 'Scheduled',
      gender,
      patientId,
      service: json.appointmentType || '',
      patientAvatarUrl: json.patientAvatarUrl || '',
      previousNotes: json.history?.previousNotes,
      currentNotes: json.history?.currentNotes,
      pharmacy: Array.isArray(json.pharmacy) 
        ? json.pharmacy.map(e => typeof e === 'object' ? e : {})
        : [],
      pathology: Array.isArray(json.pathology)
        ? json.pathology.map(e => typeof e === 'object' ? e : {})
        : [],
      diabetesType: json.history?.diabetesType || 'Type 2',
      location: json.location || '',
      occupation: json.history?.occupation || '',
      dob: json.dob || '',
      bmi: parseFloat(json.bmi) || 0.0,
      weight: parseInt(json.weight) || 0,
      height: parseInt(json.height) || 0,
      bp: json.vitals?.bp || '',
      diagnosis: Array.isArray(json.diagnosis) 
        ? json.diagnosis.map(e => e.toString())
        : [],
      barriers: Array.isArray(json.barriers)
        ? json.barriers.map(e => e.toString())
        : [],
      timeline: Array.isArray(json.timeline)
        ? json.timeline.map(e => typeof e === 'object' ? e : {})
        : [],
      history: json.history && typeof json.history === 'object' 
        ? json.history 
        : {},
      bloodGroup,
      patientCode,
      appointmentId: json._id || json.appointmentId,
      metadata: json.followUp ? { followUp: json.followUp } : null,
    });
  }

  toJSON() {
    return {
      _id: this.id,
      clientName: this.patientName,
      patientAge: this.patientAge,
      date: this.date,
      time: this.time,
      chiefComplaint: this.reason,
      doctorId: this.doctor,
      status: this.status,
      gender: this.gender,
      patientId: this.patientId,
      appointmentType: this.service,
      patientAvatarUrl: this.patientAvatarUrl,
      history: this.history,
      vitals: { bp: this.bp },
      pharmacy: this.pharmacy,
      pathology: this.pathology,
      location: this.location,
    };
  }
}

export class DoctorDashboardData {
  constructor({ appointments }) {
    this.appointments = appointments;
  }

  static fromJSON(list) {
    return new DoctorDashboardData({
      appointments: Array.isArray(list) 
        ? list.map(e => DashboardAppointments.fromJSON(e))
        : [],
    });
  }
}
