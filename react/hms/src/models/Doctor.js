import { User, UserRole } from './User';

/**
 * Represents a Doctor in the Hospital Management System.
 * This model composes a base User model with doctor-specific professional details.
 */
export class Doctor {
  constructor({ userProfile, specialization, licenseNumber, department }) {
    if (!(userProfile instanceof User)) {
      throw new Error('userProfile must be an instance of User');
    }
    if (userProfile.role !== UserRole.DOCTOR) {
      throw new Error('The provided user profile must have the role of UserRole.doctor.');
    }
    
    this.userProfile = userProfile;
    this.specialization = specialization;
    this.licenseNumber = licenseNumber;
    this.department = department;
  }

  /** Serializes the Doctor object to JSON */
  toJSON() {
    return {
      ...this.userProfile.toJSON(),
      specialization: this.specialization,
      licenseNumber: this.licenseNumber,
      department: this.department,
    };
  }

  /** Deserializes a JSON object into a Doctor object */
  static fromJSON(json) {
    const userProfile = User.fromJSON(json);
    return new Doctor({
      userProfile,
      specialization: json.specialization || '',
      licenseNumber: json.licenseNumber || '',
      department: json.department || '',
    });
  }

  // Convenience getters
  get id() {
    return this.userProfile.id;
  }

  get fullName() {
    return this.userProfile.fullName;
  }

  get email() {
    return this.userProfile.email;
  }

  get phone() {
    return this.userProfile.phone;
  }

  get role() {
    return this.userProfile.role;
  }
}
