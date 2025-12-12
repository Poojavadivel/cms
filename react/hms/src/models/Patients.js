import { Doctor } from './Doctor';

/**
 * Represents detailed information about a patient in the Hospital Management System.
 */
export class PatientDetails {
  constructor({
    patientId,
    name,
    firstName = null,
    lastName = null,
    age,
    gender,
    bloodGroup,
    weight,
    height,
    bp = '',
    pulse = '',
    temp = '',
    emergencyContactName,
    emergencyContactPhone,
    phone,
    houseNo = '',
    street = '',
    city,
    state = '',
    pincode,
    country = '',
    address = '',
    insuranceNumber,
    expiryDate,
    avatarUrl,
    dateOfBirth,
    lastVisitDate,
    doctorId,
    doctor = null,
    doctorName = '',
    medicalHistory = [],
    allergies = [],
    notes = '',
    oxygen = '',
    bmi = '',
    isSelected = false,
    patientCode = null,
  }) {
    this.patientId = patientId;
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
    this.gender = gender;
    this.bloodGroup = bloodGroup;
    this.weight = weight;
    this.height = height;
    this.bp = bp;
    this.pulse = pulse;
    this.temp = temp;
    this.emergencyContactName = emergencyContactName;
    this.emergencyContactPhone = emergencyContactPhone;
    this.phone = phone;
    this.houseNo = houseNo;
    this.street = street;
    this.city = city;
    this.state = state;
    this.pincode = pincode;
    this.country = country;
    this.address = address;
    this.insuranceNumber = insuranceNumber;
    this.expiryDate = expiryDate;
    this.avatarUrl = avatarUrl;
    this.dateOfBirth = dateOfBirth;
    this.lastVisitDate = lastVisitDate;
    this.doctorId = doctorId;
    this.doctor = doctor;
    this.doctorName = doctorName;
    this.medicalHistory = medicalHistory;
    this.allergies = allergies;
    this.notes = notes;
    this.oxygen = oxygen;
    this.bmi = bmi;
    this.isSelected = isSelected;
    this.patientCode = patientCode;
  }

  get doctorDisplayName() {
    if (this.doctor) {
      try {
        const profileMap = this.doctor.userProfile.toJSON();
        const nameFromMap = (profileMap.name || `${profileMap.firstName || ''} ${profileMap.lastName || ''}`).trim();
        if (nameFromMap) return nameFromMap;
      } catch {
        const fn = this.doctor.userProfile.firstName || '';
        const ln = this.doctor.userProfile.lastName || '';
        const combined = `${fn} ${ln}`.trim();
        if (combined) return combined;
      }
    }
    if (this.doctorName) return this.doctorName;
    if (this.doctorId) return this.doctorId;
    return 'No doctor';
  }

  get displayId() {
    return this.patientCode || this.patientId;
  }

  get patientCodeOrId() {
    return this.patientCode || this.patientId;
  }

  static _extractVital(map, vitalKey, legacyKey) {
    if (map.vitals && typeof map.vitals === 'object') {
      const value = map.vitals[vitalKey];
      if (value != null) {
        return value.toString();
      }
    }
    return map[legacyKey]?.toString() || '';
  }

  static _parseNumber(value) {
    if (!value) return null;
    return parseFloat(value) || null;
  }

  static fromJSON(json) {
    const first = json.firstName?.toString() || '';
    const last = json.lastName?.toString() || '';
    const fullName = json.name?.toString() || `${first} ${last}`.trim();

    let parsedDoctor = null;
    let parsedDoctorName = '';

    const rawDoctor = json.doctor;
    if (rawDoctor) {
      try {
        if (typeof rawDoctor === 'object') {
          parsedDoctor = Doctor.fromJSON(rawDoctor);
          try {
            const profileMap = parsedDoctor.userProfile.toJSON();
            parsedDoctorName = (profileMap.name || `${profileMap.firstName || ''} ${profileMap.lastName || ''}`).trim();
          } catch {
            parsedDoctorName = parsedDoctor.userProfile.firstName || '';
          }
        } else if (typeof rawDoctor === 'string') {
          parsedDoctorName = rawDoctor;
        }
      } catch {
        parsedDoctor = null;
      }
    }

    if (!parsedDoctorName) {
      parsedDoctorName = json.doctorName?.toString() || json.doctor_name?.toString() || '';
    }

    let extractedPatientCode = null;
    try {
      if (json.patientCode) {
        extractedPatientCode = json.patientCode;
      } else if (json.patient_code) {
        extractedPatientCode = json.patient_code;
      } else if (json.metadata && typeof json.metadata === 'object') {
        extractedPatientCode = json.metadata.patientCode || json.metadata.patient_code || null;
      }
    } catch {}

    const metadata = json.metadata && typeof json.metadata === 'object' ? json.metadata : {};
    const addressObj = json.address && typeof json.address === 'object' ? json.address : {};

    let extractedAge = 0;
    if (typeof json.age === 'number') {
      extractedAge = json.age;
    } else if (json.age) {
      extractedAge = parseInt(json.age) || 0;
    }
    if (extractedAge === 0 && metadata.age) {
      extractedAge = typeof metadata.age === 'number' ? metadata.age : parseInt(metadata.age) || 0;
    }
    if (extractedAge === 0 && json.dateOfBirth) {
      try {
        const dob = new Date(json.dateOfBirth);
        if (dob) {
          const now = new Date();
          extractedAge = now.getFullYear() - dob.getFullYear();
          if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) {
            extractedAge--;
          }
        }
      } catch {}
    }

    const doctorIdValue = (() => {
      const doctorId = json.doctorId;
      if (!doctorId) return '';
      if (typeof doctorId === 'string') return doctorId;
      if (typeof doctorId === 'object') {
        return (doctorId._id || doctorId.id || '').toString();
      }
      return doctorId.toString();
    })();

    const medicalHistoryValue = (() => {
      try {
        if (Array.isArray(metadata.medicalHistory)) {
          return metadata.medicalHistory.map(e => e.toString());
        } else if (metadata.medicalHistory && typeof metadata.medicalHistory === 'object') {
          const mh = metadata.medicalHistory;
          const conditions = mh.currentConditions;
          if (Array.isArray(conditions)) {
            return conditions.map(e => e.toString());
          }
          return [];
        } else if (Array.isArray(json.medicalHistory)) {
          return json.medicalHistory.map(e => e.toString());
        }
      } catch {}
      return [];
    })();

    const allergiesValue = (() => {
      try {
        if (Array.isArray(json.allergies)) {
          return json.allergies.map(e => e.toString());
        }
      } catch {}
      return [];
    })();

    return new PatientDetails({
      patientId: json._id?.toString() || json.id?.toString() || json.patientId?.toString() || '',
      name: fullName,
      firstName: first || null,
      lastName: last || null,
      age: extractedAge,
      gender: json.gender?.toString() || '',
      bloodGroup: json.bloodGroup?.toString() || metadata.bloodGroup?.toString() || 'O+',
      weight: PatientDetails._extractVital(json, 'weightKg', 'weight'),
      height: PatientDetails._extractVital(json, 'heightCm', 'height'),
      bmi: PatientDetails._extractVital(json, 'bmi', 'bmi'),
      oxygen: PatientDetails._extractVital(json, 'spo2', 'oxygen'),
      bp: PatientDetails._extractVital(json, 'bp', 'bp'),
      pulse: PatientDetails._extractVital(json, 'pulse', 'pulse'),
      temp: PatientDetails._extractVital(json, 'temp', 'temp'),
      emergencyContactName: metadata.emergencyContactName?.toString() || json.emergencyContactName?.toString() || '',
      emergencyContactPhone: metadata.emergencyContactPhone?.toString() || json.emergencyContactPhone?.toString() || '',
      phone: json.phone?.toString() || '',
      houseNo: addressObj.houseNo?.toString() || json.houseNo?.toString() || '',
      street: addressObj.street?.toString() || json.street?.toString() || '',
      city: addressObj.city?.toString() || json.city?.toString() || '',
      state: addressObj.state?.toString() || json.state?.toString() || '',
      pincode: addressObj.pincode?.toString() || json.pincode?.toString() || '',
      country: addressObj.country?.toString() || json.country?.toString() || '',
      address: addressObj.line1?.toString() || json.address?.toString() || '',
      insuranceNumber: metadata.insuranceNumber?.toString() || json.insuranceNumber?.toString() || '',
      expiryDate: metadata.expiryDate?.toString() || json.expiryDate?.toString() || '',
      avatarUrl: metadata.avatarUrl?.toString() || json.avatarUrl?.toString() || '',
      dateOfBirth: json.dateOfBirth?.toString() || '',
      lastVisitDate: json.lastVisitDate?.toString() || json.updatedAt?.toString() || '',
      doctorId: doctorIdValue,
      doctor: parsedDoctor,
      doctorName: parsedDoctorName,
      medicalHistory: medicalHistoryValue,
      allergies: allergiesValue,
      notes: json.notes?.toString() || '',
      isSelected: json.isSelected === true,
      patientCode: extractedPatientCode,
    });
  }

  toJSON() {
    const safeDoctorId = this.doctorId || '';

    const base = {
      patientId: this.patientId,
      name: this.name,
      firstName: this.firstName,
      lastName: this.lastName,
      age: this.age,
      gender: this.gender,
      bloodGroup: this.bloodGroup,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth,
      address: {
        houseNo: this.houseNo,
        street: this.street,
        city: this.city,
        state: this.state,
        pincode: this.pincode,
        country: this.country,
        line1: this.address,
      },
      vitals: {
        heightCm: PatientDetails._parseNumber(this.height),
        weightKg: PatientDetails._parseNumber(this.weight),
        bmi: PatientDetails._parseNumber(this.bmi),
        bp: this.bp || null,
        pulse: PatientDetails._parseNumber(this.pulse),
        spo2: PatientDetails._parseNumber(this.oxygen),
        temp: PatientDetails._parseNumber(this.temp),
      },
      doctorId: safeDoctorId,
      allergies: this.allergies,
      notes: this.notes,
      metadata: {
        age: this.age,
        bloodGroup: this.bloodGroup,
        emergencyContactName: this.emergencyContactName,
        emergencyContactPhone: this.emergencyContactPhone,
        insuranceNumber: this.insuranceNumber,
        expiryDate: this.expiryDate,
        avatarUrl: this.avatarUrl,
        medicalHistory: this.medicalHistory,
      },
    };

    if (this.patientCode) {
      base.patientCode = this.patientCode;
    }

    if (this.doctor) {
      try {
        base.doctor = this.doctor.toJSON();
      } catch {
        base.doctor = {
          id: this.doctor.userProfile.id || '',
          firstName: this.doctor.userProfile.firstName || '',
          lastName: this.doctor.userProfile.lastName || '',
        };
      }
    }

    return base;
  }
}

/**
 * Represents a single checkup record for a patient.
 */
export class CheckupRecord {
  constructor({
    doctor,
    speciality,
    reason,
    date,
    reportStatus,
  }) {
    this.doctor = doctor;
    this.speciality = speciality;
    this.reason = reason;
    this.date = date;
    this.reportStatus = reportStatus;
  }

  static fromJSON(json) {
    return new CheckupRecord({
      doctor: json.doctor?.toString() || '',
      speciality: json.speciality?.toString() || '',
      reason: json.reason?.toString() || '',
      date: json.date?.toString() || '',
      reportStatus: json.reportStatus?.toString() || '',
    });
  }

  toJSON() {
    return {
      doctor: this.doctor,
      speciality: this.speciality,
      reason: this.reason,
      date: this.date,
      reportStatus: this.reportStatus,
    };
  }
}

/**
 * A container class to hold a list of PatientDetails.
 */
export class PatientDashboardData {
  constructor({ patients }) {
    this.patients = patients;
  }
}
