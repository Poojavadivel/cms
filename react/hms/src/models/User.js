// User Role Enum
export const UserRole = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PHARMACIST: 'pharmacist',
  PATHOLOGIST: 'pathologist',
  RECEPTION: 'reception',
  UNKNOWN: 'unknown',
};

/**
 * The foundational User model for the Hospital Management System.
 * This class represents the core identity and shared data for any person
 * interacting with the system, regardless of their role.
 */
export class User {
  constructor({
    id,
    role,
    firstName,
    lastName,
    dateOfBirth = null,
    email,
    phone,
    country,
    state,
    city,
    createdAt,
  }) {
    this.id = id;
    this.role = role;
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    this.email = email;
    this.phone = phone;
    this.country = country;
    this.state = state;
    this.city = city;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  /** Computed property to get the full name */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** Computed property to calculate the current age */
  get age() {
    if (!this.dateOfBirth) return null;
    const now = new Date();
    let age = now.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = now.getMonth() - this.dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < this.dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  /** Serializes the User object to a JSON object */
  toJSON() {
    return {
      id: this.id,
      role: this.role,
      firstName: this.firstName,
      lastName: this.lastName,
      dateOfBirth: this.dateOfBirth?.toISOString(),
      email: this.email,
      phone: this.phone,
      country: this.country,
      state: this.state,
      city: this.city,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /** Deserializes a JSON object into a User object */
  static fromJSON(json) {
    const roleValue = Object.values(UserRole).find((r) => r === json.role) || UserRole.UNKNOWN;
    
    return new User({
      id: json.id || '',
      role: roleValue,
      firstName: json.firstName || '',
      lastName: json.lastName || '',
      dateOfBirth: json.dateOfBirth,
      email: json.email || '',
      phone: json.phone || '',
      country: json.country || '',
      state: json.state || '',
      city: json.city || '',
      createdAt: json.createdAt || new Date().toISOString(),
    });
  }
}
