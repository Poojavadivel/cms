/**
 * Patient Vitals Models
 * Comprehensive vital signs tracking for patient health monitoring
 */

export class BloodPressure {
  constructor({ systolic, diastolic, reading }) {
    this.systolic = systolic;
    this.diastolic = diastolic;
    this.reading = reading;
  }

  static fromJSON(json) {
    return new BloodPressure({
      systolic: json.systolic || 0,
      diastolic: json.diastolic || 0,
      reading: json.reading || `${json.systolic}/${json.diastolic}`,
    });
  }

  toJSON() {
    return {
      systolic: this.systolic,
      diastolic: this.diastolic,
      reading: this.reading,
    };
  }

  get isHigh() {
    return this.systolic > 140 || this.diastolic > 90;
  }

  get isLow() {
    return this.systolic < 90 || this.diastolic < 60;
  }

  get isNormal() {
    return !this.isHigh && !this.isLow;
  }
}

export class Temperature {
  constructor({ value, unit = 'C' }) {
    this.value = value;
    this.unit = unit;
  }

  static fromJSON(json) {
    return new Temperature({
      value: parseFloat(json.value) || 0.0,
      unit: json.unit || 'C',
    });
  }

  toJSON() {
    return { value: this.value, unit: this.unit };
  }

  get display() {
    return `${this.value.toFixed(1)}°${this.unit}`;
  }

  get isFever() {
    return this.unit === 'C' ? this.value > 37.5 : this.value > 99.5;
  }
}

export class Weight {
  constructor({ value, unit = 'kg' }) {
    this.value = value;
    this.unit = unit;
  }

  static fromJSON(json) {
    return new Weight({
      value: parseFloat(json.value) || 0.0,
      unit: json.unit || 'kg',
    });
  }

  toJSON() {
    return { value: this.value, unit: this.unit };
  }

  get display() {
    return `${this.value.toFixed(1)} ${this.unit}`;
  }
}

export class Height {
  constructor({ value, unit = 'cm' }) {
    this.value = value;
    this.unit = unit;
  }

  static fromJSON(json) {
    return new Height({
      value: parseFloat(json.value) || 0.0,
      unit: json.unit || 'cm',
    });
  }

  toJSON() {
    return { value: this.value, unit: this.unit };
  }

  get display() {
    return `${this.value.toFixed(0)} ${this.unit}`;
  }
}

export class BloodGlucose {
  constructor({ value, testType = 'Random' }) {
    this.value = value;
    this.testType = testType;
  }

  static fromJSON(json) {
    return new BloodGlucose({
      value: parseFloat(json.value) || 0.0,
      testType: json.testType || 'Random',
    });
  }

  toJSON() {
    return { value: this.value, testType: this.testType };
  }

  get display() {
    return `${this.value.toFixed(0)} mg/dL`;
  }

  get isHigh() {
    return this.value > 140;
  }

  get isLow() {
    return this.value < 70;
  }
}

export class AbnormalFlag {
  constructor({ vital, severity, note = null }) {
    this.vital = vital;
    this.severity = severity;
    this.note = note;
  }

  static fromJSON(json) {
    return new AbnormalFlag({
      vital: json.vital || '',
      severity: json.severity || 'Normal',
      note: json.note,
    });
  }

  toJSON() {
    return {
      vital: this.vital,
      severity: this.severity,
      ...(this.note && { note: this.note }),
    };
  }
}

export class PatientVitals {
  constructor({
    id,
    patientId,
    appointmentId = null,
    recordedBy,
    bloodPressure = null,
    heartRate = null,
    temperature = null,
    respiratoryRate = null,
    oxygenSaturation = null,
    weight = null,
    height = null,
    bmi = null,
    bloodGlucose = null,
    painScale = null,
    notes = null,
    abnormalFlags = [],
    recordedAt,
    location = 'Clinic',
    deviceInfo = null,
  }) {
    this.id = id;
    this.patientId = patientId;
    this.appointmentId = appointmentId;
    this.recordedBy = recordedBy;
    this.bloodPressure = bloodPressure;
    this.heartRate = heartRate;
    this.temperature = temperature;
    this.respiratoryRate = respiratoryRate;
    this.oxygenSaturation = oxygenSaturation;
    this.weight = weight;
    this.height = height;
    this.bmi = bmi;
    this.bloodGlucose = bloodGlucose;
    this.painScale = painScale;
    this.notes = notes;
    this.abnormalFlags = abnormalFlags;
    this.recordedAt = new Date(recordedAt);
    this.location = location;
    this.deviceInfo = deviceInfo;
  }

  static fromJSON(json) {
    return new PatientVitals({
      id: json._id || '',
      patientId: json.patientId || '',
      appointmentId: json.appointmentId,
      recordedBy: json.recordedBy || '',
      bloodPressure: json.bloodPressure ? BloodPressure.fromJSON(json.bloodPressure) : null,
      heartRate: json.heartRate,
      temperature: json.temperature ? Temperature.fromJSON(json.temperature) : null,
      respiratoryRate: json.respiratoryRate,
      oxygenSaturation: json.oxygenSaturation,
      weight: json.weight ? Weight.fromJSON(json.weight) : null,
      height: json.height ? Height.fromJSON(json.height) : null,
      bmi: json.bmi ? parseFloat(json.bmi) : null,
      bloodGlucose: json.bloodGlucose ? BloodGlucose.fromJSON(json.bloodGlucose) : null,
      painScale: json.painScale,
      notes: json.notes,
      abnormalFlags: (json.abnormalFlags || []).map(e => AbnormalFlag.fromJSON(e)),
      recordedAt: json.recordedAt ? new Date(json.recordedAt) : new Date(),
      location: json.location || 'Clinic',
      deviceInfo: json.deviceInfo,
    });
  }

  toJSON() {
    return {
      _id: this.id,
      patientId: this.patientId,
      ...(this.appointmentId && { appointmentId: this.appointmentId }),
      recordedBy: this.recordedBy,
      ...(this.bloodPressure && { bloodPressure: this.bloodPressure.toJSON() }),
      ...(this.heartRate != null && { heartRate: this.heartRate }),
      ...(this.temperature && { temperature: this.temperature.toJSON() }),
      ...(this.respiratoryRate != null && { respiratoryRate: this.respiratoryRate }),
      ...(this.oxygenSaturation != null && { oxygenSaturation: this.oxygenSaturation }),
      ...(this.weight && { weight: this.weight.toJSON() }),
      ...(this.height && { height: this.height.toJSON() }),
      ...(this.bmi != null && { bmi: this.bmi }),
      ...(this.bloodGlucose && { bloodGlucose: this.bloodGlucose.toJSON() }),
      ...(this.painScale != null && { painScale: this.painScale }),
      ...(this.notes && { notes: this.notes }),
      abnormalFlags: this.abnormalFlags.map(e => e.toJSON()),
      recordedAt: this.recordedAt.toISOString(),
      location: this.location,
      ...(this.deviceInfo && { deviceInfo: this.deviceInfo }),
    };
  }

  get bpDisplay() {
    return this.bloodPressure?.reading || '--/--';
  }

  get tempDisplay() {
    return this.temperature?.display || '--';
  }

  get weightDisplay() {
    return this.weight?.display || '--';
  }

  get heightDisplay() {
    return this.height?.display || '--';
  }

  get bmiDisplay() {
    return this.bmi != null ? this.bmi.toFixed(1) : '--';
  }
}
