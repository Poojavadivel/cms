import { User, UserRole } from './User';

/**
 * Represents a Pharmacist in the Hospital Management System.
 * This model composes a base User model with pharmacist-specific details.
 */
export class Pharmacist {
  constructor({ userProfile, licenseNumber = null, department = null }) {
    if (!(userProfile instanceof User)) {
      throw new Error('userProfile must be an instance of User');
    }
    if (userProfile.role !== UserRole.PHARMACIST) {
      throw new Error('The provided user profile must have the role of UserRole.pharmacist.');
    }
    
    this.userProfile = userProfile;
    this.licenseNumber = licenseNumber;
    this.department = department;
  }

  /** Serializes the Pharmacist object to JSON */
  toJSON() {
    return {
      ...this.userProfile.toJSON(),
      licenseNumber: this.licenseNumber,
      department: this.department,
    };
  }

  /** Deserializes a JSON object into a Pharmacist object */
  static fromJSON(json) {
    const userProfile = User.fromJSON(json);
    return new Pharmacist({
      userProfile,
      licenseNumber: json.licenseNumber || null,
      department: json.department || null,
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
