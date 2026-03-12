import 'User.dart';

/// Represents a Pharmacist in the Hospital Management System.
/// This model composes a base User model with pharmacist-specific details.
class Pharmacist {
  /// The core user profile containing personal information (name, email, etc.).
  final User userProfile;

  /// The pharmacist's license number.
  final String? licenseNumber;

  /// The department or pharmacy section where the pharmacist works.
  final String? department;

  Pharmacist({
    required this.userProfile,
    this.licenseNumber,
    this.department,
  }) {
    // Ensure that this user has the pharmacist role.
    if (userProfile.role != UserRole.pharmacist) {
      throw ArgumentError(
          'The provided user profile must have the role of UserRole.pharmacist.');
    }
  }

  /// Creates a copy of the instance with optional new values.
  Pharmacist copyWith({
    User? userProfile,
    String? licenseNumber,
    String? department,
  }) {
    return Pharmacist(
      userProfile: userProfile ?? this.userProfile,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      department: department ?? this.department,
    );
  }

  /// Serializes the Pharmacist object to a Map (JSON).
  Map<String, dynamic> toMap() {
    return {
      ...userProfile.toMap(),
      'licenseNumber': licenseNumber,
      'department': department,
    };
  }

  /// Deserializes a Map (JSON) to a Pharmacist object.
  factory Pharmacist.fromMap(Map<String, dynamic> map) {
    final userProfile = User.fromMap(map);
    return Pharmacist(
      userProfile: userProfile,
      licenseNumber: map['licenseNumber'],
      department: map['department'],
    );
  }

  // Convenience getters
  String get id => userProfile.id;
  String get fullName => userProfile.fullName;
  String get email => userProfile.email;
  String get phone => userProfile.phone;
  UserRole get role => userProfile.role;
}
