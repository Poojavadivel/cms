import { User, UserRole } from './User';

/**
 * Represents a Pathologist in the Hospital Management System.
 * This model composes a base User model with pathologist-specific details.
 */
export class Pathologist {
  constructor({ userProfile, licenseNumber = null, department = null, specialization = null }) {
    if (!(userProfile instanceof User)) {
      throw new Error('userProfile must be an instance of User');
    }
    if (userProfile.role !== UserRole.PATHOLOGIST) {
      throw new Error('The provided user profile must have the role of UserRole.pathologist.');
    }
    
    this.userProfile = userProfile;
    this.licenseNumber = licenseNumber;
    this.department = department;
    this.specialization = specialization;
  }

  /** Serializes the Pathologist object to JSON */
  toJSON() {
    return {
      ...this.userProfile.toJSON(),
      licenseNumber: this.licenseNumber,
      department: this.department,
      specialization: this.specialization,
    };
  }

  /** Deserializes a JSON object into a Pathologist object */
  static fromJSON(json) {
    const userProfile = User.fromJSON(json);
    return new Pathologist({
      userProfile,
      licenseNumber: json.licenseNumber || null,
      department: json.department || null,
      specialization: json.specialization || null,
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
