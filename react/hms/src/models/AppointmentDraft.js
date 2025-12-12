/**
 * Represents a draft or actual appointment in the Hospital Management System.
 */
export class AppointmentDraft {
  constructor({
    id = null,
    clientName,
    appointmentType,
    date,
    time,
    location,
    notes = null,
    gender = null,
    patientId = null,
    phoneNumber = null,
    mode = 'In-clinic',
    priority = 'Normal',
    durationMinutes = 20,
    reminder = true,
    chiefComplaint = '',
    heightCm = null,
    weightKg = null,
    bp = null,
    heartRate = null,
    spo2 = null,
    status = 'Scheduled',
  }) {
    this.id = id;
    this.clientName = clientName;
    this.appointmentType = appointmentType;
    this.date = new Date(date);
    this.time = time; // Store as object { hour, minute } or string "HH:mm"
    this.location = location;
    this.notes = notes;
    this.gender = gender;
    this.patientId = patientId;
    this.phoneNumber = phoneNumber;
    this.mode = mode;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.reminder = reminder;
    this.chiefComplaint = chiefComplaint;
    this.heightCm = heightCm;
    this.weightKg = weightKg;
    this.bp = bp;
    this.heartRate = heartRate;
    this.spo2 = spo2;
    this.status = status;
  }

  get dateTime() {
    const timeObj = typeof this.time === 'string' 
      ? this._parseTimeString(this.time) 
      : this.time;
    return new Date(
      this.date.getFullYear(),
      this.date.getMonth(),
      this.date.getDate(),
      timeObj.hour,
      timeObj.minute
    );
  }

  _parseTimeString(timeStr) {
    const parts = timeStr.split(':');
    return {
      hour: parseInt(parts[0]) || 0,
      minute: parseInt(parts[1]) || 0,
    };
  }

  toJSON() {
    const timeObj = typeof this.time === 'string' 
      ? this._parseTimeString(this.time) 
      : this.time;
    
    const startAt = new Date(
      this.date.getFullYear(),
      this.date.getMonth(),
      this.date.getDate(),
      timeObj.hour,
      timeObj.minute
    );

    return {
      _id: this.id,
      patientId: this.patientId,
      appointmentType: this.appointmentType,
      startAt: startAt.toISOString(),
      location: this.location,
      status: this.status,
      notes: this.notes,
      vitals: {
        ...(this.heightCm && { heightCm: this.heightCm }),
        ...(this.weightKg && { weightKg: this.weightKg }),
        ...(this.bp && { bp: this.bp }),
        ...(this.heartRate && { heartRate: this.heartRate }),
        ...(this.spo2 && { spo2: this.spo2 }),
      },
      metadata: {
        mode: this.mode,
        priority: this.priority,
        durationMinutes: this.durationMinutes,
        reminder: this.reminder,
        chiefComplaint: this.chiefComplaint,
        ...(this.gender && { gender: this.gender }),
        ...(this.phoneNumber && { phoneNumber: this.phoneNumber }),
      },
    };
  }

  static fromJSON(json) {
    let appointmentDate = new Date();
    let appointmentTime = { hour: 0, minute: 0 };

    if (json.startAt) {
      const startAt = new Date(json.startAt);
      if (startAt) {
        appointmentDate = startAt;
        appointmentTime = { hour: startAt.getHours(), minute: startAt.getMinutes() };
      }
    } else {
      if (json.date) {
        appointmentDate = new Date(json.date);
      }
      if (json.time) {
        const timeParts = json.time.toString().split(':');
        appointmentTime = {
          hour: parseInt(timeParts[0]) || 0,
          minute: parseInt(timeParts[1]) || 0,
        };
      }
    }

    let clientName = '';
    let patientIdStr = null;
    let phone = null;
    let gender = null;

    if (json.patientId && typeof json.patientId === 'object') {
      const patient = json.patientId;
      patientIdStr = patient._id?.toString();
      const firstName = patient.firstName?.toString() || '';
      const lastName = patient.lastName?.toString() || '';
      clientName = `${firstName} ${lastName}`.trim();
      phone = patient.phone?.toString();
      gender = patient.gender?.toString();
    } else if (json.patientId && typeof json.patientId === 'string') {
      patientIdStr = json.patientId;
      clientName = json.clientName || '';
    }

    const metadata = json.metadata || {};
    const vitals = json.vitals || {};

    return new AppointmentDraft({
      id: json._id?.toString(),
      clientName: clientName || json.clientName || '',
      appointmentType: json.appointmentType || 'Consultation',
      date: appointmentDate,
      time: appointmentTime,
      location: json.location || '',
      notes: json.notes?.toString() || '',
      gender: metadata.gender?.toString() || gender,
      patientId: patientIdStr,
      phoneNumber: metadata.phoneNumber?.toString() || phone,
      mode: metadata.mode?.toString() || json.mode?.toString() || 'In-clinic',
      priority: metadata.priority?.toString() || json.priority?.toString() || 'Normal',
      durationMinutes: metadata.durationMinutes || json.durationMinutes || 20,
      reminder: metadata.reminder !== undefined ? metadata.reminder : json.reminder !== undefined ? json.reminder : true,
      chiefComplaint: metadata.chiefComplaint?.toString() || json.chiefComplaint?.toString() || '',
      heightCm: vitals.heightCm?.toString() || json.heightCm?.toString(),
      weightKg: vitals.weightKg?.toString() || json.weightKg?.toString(),
      bp: vitals.bp?.toString() || json.bp?.toString(),
      heartRate: vitals.heartRate?.toString() || json.heartRate?.toString(),
      spo2: vitals.spo2?.toString() || json.spo2?.toString(),
      status: json.status || 'Scheduled',
    });
  }
}
