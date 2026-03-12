import 'dart:convert';
import 'User.dart';

 // We must import our foundational User model.

/// Represents a Doctor in the Hospital Management System.
/// This model composes a base User model with doctor-specific professional details.
class Doctor {
  /// The core user profile containing personal information (name, email, etc.).
  final User userProfile;

  /// The doctor's medical specialization (e.g., "Cardiology", "Neurology").
  final String specialization;

  /// The doctor's official medical license number.
  final String licenseNumber;

  /// The department within the hospital where the doctor works (e.g., "Emergency", "Pediatrics").
  final String department;

  Doctor({
    required this.userProfile,
    required this.specialization,
    required this.licenseNumber,
    required this.department,
  }) {
    // This is a critical validation step to ensure data integrity.
    // A Doctor object can only be created from a User with the 'doctor' role.
    if (userProfile.role != UserRole.doctor) {
      throw ArgumentError(
          'The provided user profile must have the role of UserRole.doctor.');
    }
  }

  /// Creates a copy of the instance with optional new values.
  Doctor copyWith({
    User? userProfile,
    String? specialization,
    String? licenseNumber,
    String? department,
  }) {
    return Doctor(
      userProfile: userProfile ?? this.userProfile,
      specialization: specialization ?? this.specialization,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      department: department ?? this.department,
    );
  }

  /// Serializes the Doctor object to a Map (JSON).
  /// It cleverly merges the user profile map with the doctor-specific fields.
  Map<String, dynamic> toMap() {
    return {
      // Use the spread operator to include all fields from the user profile.
      ...userProfile.toMap(),
      'specialization': specialization,
      'licenseNumber': licenseNumber,
      'department': department,
    };
  }

  /// Deserializes a Map (from JSON) into a Doctor object.
  /// It constructs the base User first, then populates the doctor fields.
  factory Doctor.fromMap(Map<String, dynamic> map) {
    return Doctor(
      // Re-construct the User object from the same map.
      userProfile: User.fromMap(map),
      specialization: map['specialization'] ?? '',
      licenseNumber: map['licenseNumber'] ?? '',
      department: map['department'] ?? '',
    );
  }

  /// Helper method for JSON encoding.
  String toJson() => json.encode(toMap());

  /// Helper method for JSON decoding.
  factory Doctor.fromJson(String source) => Doctor.fromMap(json.decode(source));
}
