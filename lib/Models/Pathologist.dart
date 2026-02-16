import 'User.dart';

/// Represents a Pathologist in the Hospital Management System.
/// This model composes a base User model with pathologist-specific details.
class Pathologist {
  /// The core user profile containing personal information (name, email, etc.).
  final User userProfile;

  /// The pathologist's license number.
  final String? licenseNumber;

  /// The department or lab section where the pathologist works.
  final String? department;

  /// The pathologist's specialization (e.g., "Clinical Pathology", "Histopathology").
  final String? specialization;

  Pathologist({
    required this.userProfile,
    this.licenseNumber,
    this.department,
    this.specialization,
  }) {
    // Ensure that this user has the pathologist role.
    if (userProfile.role != UserRole.pathologist) {
      throw ArgumentError(
          'The provided user profile must have the role of UserRole.pathologist.');
    }
  }

  /// Creates a copy of the instance with optional new values.
  Pathologist copyWith({
    User? userProfile,
    String? licenseNumber,
    String? department,
    String? specialization,
  }) {
    return Pathologist(
      userProfile: userProfile ?? this.userProfile,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      department: department ?? this.department,
      specialization: specialization ?? this.specialization,
    );
  }

  /// Serializes the Pathologist object to a Map (JSON).
  Map<String, dynamic> toMap() {
    return {
      ...userProfile.toMap(),
      'licenseNumber': licenseNumber,
      'department': department,
      'specialization': specialization,
    };
  }

  /// Deserializes a Map (JSON) to a Pathologist object.
  factory Pathologist.fromMap(Map<String, dynamic> map) {
    final userProfile = User.fromMap(map);
    return Pathologist(
      userProfile: userProfile,
      licenseNumber: map['licenseNumber'],
      department: map['department'],
      specialization: map['specialization'],
    );
  }

  // Convenience getters
  String get id => userProfile.id;
  String get fullName => userProfile.fullName;
  String get email => userProfile.email;
  String get phone => userProfile.phone;
  UserRole get role => userProfile.role;
}
