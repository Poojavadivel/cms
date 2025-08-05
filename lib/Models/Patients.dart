import 'dart:convert';

import 'User.dart';// We must import our foundational User model.

/// Represents a Patient in the Hospital Management System.
/// This model composes a base User model with patient-specific medical
/// and emergency contact details.
class Patient {
  /// The core user profile containing personal information (name, email, etc.).
  final User userProfile;

  /// The patient's blood type (e.g., "O+", "A-", "B+").
  final String bloodType;

  /// The full name of the patient's primary emergency contact.
  final String emergencyContactName;

  /// The phone number of the patient's primary emergency contact.
  final String emergencyContactPhone;

  /// The ID of the doctor primarily assigned to this patient.
  /// This can be null if no doctor is assigned yet.
  final String? assignedDoctorId;

  Patient({
    required this.userProfile,
    required this.bloodType,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    this.assignedDoctorId,
  }) {
    // A critical validation step to ensure data integrity.
    // A Patient object can only be created from a User with the 'patient' role.
    if (userProfile.role != UserRole.patient) {
      throw ArgumentError(
          'The provided user profile must have the role of UserRole.patient.');
    }
  }

  /// Creates a copy of the instance with optional new values.
  Patient copyWith({
    User? userProfile,
    String? bloodType,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? assignedDoctorId,
  }) {
    return Patient(
      userProfile: userProfile ?? this.userProfile,
      bloodType: bloodType ?? this.bloodType,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone:
      emergencyContactPhone ?? this.emergencyContactPhone,
      assignedDoctorId: assignedDoctorId ?? this.assignedDoctorId,
    );
  }

  /// Serializes the Patient object to a Map (JSON).
  /// It merges the user profile map with the patient-specific fields.
  Map<String, dynamic> toMap() {
    return {
      // Use the spread operator to include all fields from the user profile.
      ...userProfile.toMap(),
      'bloodType': bloodType,
      'emergencyContactName': emergencyContactName,
      'emergencyContactPhone': emergencyContactPhone,
      'assignedDoctorId': assignedDoctorId,
    };
  }

  /// Deserializes a Map (from JSON) into a Patient object.
  /// It constructs the base User first, then populates the patient fields.
  factory Patient.fromMap(Map<String, dynamic> map) {
    return Patient(
      // Re-construct the User object from the same map.
      userProfile: User.fromMap(map),
      bloodType: map['bloodType'] ?? '',
      emergencyContactName: map['emergencyContactName'] ?? '',
      emergencyContactPhone: map['emergencyContactPhone'] ?? '',
      assignedDoctorId: map['assignedDoctorId'],
    );
  }

  /// Helper method for JSON encoding.
  String toJson() => json.encode(toMap());

  /// Helper method for JSON decoding.
  factory Patient.fromJson(String source) => Patient.fromMap(json.decode(source));
}
