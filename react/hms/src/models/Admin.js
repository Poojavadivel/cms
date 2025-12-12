import { User, UserRole } from './User';

/**
 * The Admin model.
 * Composes a User object with admin role validation.
 */
export class Admin {
  constructor(userProfile) {
    if (!(userProfile instanceof User)) {
      throw new Error('userProfile must be an instance of User');
    }
    if (userProfile.role !== UserRole.ADMIN) {
      throw new Error('The provided user profile must have the role of Admin.');
    }
    this.userProfile = userProfile;
  }

  // Getters for convenience
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

  toJSON() {
    return this.userProfile.toJSON();
  }

  static fromJSON(json) {
    const userProfile = User.fromJSON(json);
    return new Admin(userProfile);
  }
}
