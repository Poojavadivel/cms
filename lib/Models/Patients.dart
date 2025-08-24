// lib/models/patient_models.dart

/// Represents detailed information about a patient.
class PatientDetails {
  final String patientId;
  final String name;
  final int age;
  final String gender;
  final String bloodGroup;
  final String weight;
  final String height;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String phone;
  final String city;
  final String address;
  final String pincode;
  final String insuranceNumber;
  final String expiryDate;
  final String avatarUrl;
  final String dateOfBirth; // Added dateOfBirth
  final String lastVisitDate; // Added lastVisitDate
  bool isSelected; // Added for checkbox functionality

  PatientDetails({
    required this.patientId,
    required this.name,
    required this.age,
    required this.gender,
    required this.bloodGroup,
    required this.weight,
    required this.height,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.phone,
    required this.city,
    required this.address,
    required this.pincode,
    required this.insuranceNumber,
    required this.expiryDate,
    required this.avatarUrl,
    required this.dateOfBirth, // Must be required
    required this.lastVisitDate, // Must be required
    this.isSelected = false, // Default to false
  });

  factory PatientDetails.fromMap(Map<String, dynamic> map) {
    return PatientDetails(
      patientId: map['patientId'],
      name: map['name'],
      age: map['age'],
      gender: map['gender'],
      bloodGroup: map['bloodGroup'],
      weight: map['weight'],
      height: map['height'],
      emergencyContactName: map['emergencyContactName'],
      emergencyContactPhone: map['emergencyContactPhone'],
      phone: map['phone'],
      city: map['city'],
      address: map['address'],
      pincode: map['pincode'],
      insuranceNumber: map['insuranceNumber'],
      expiryDate: map['expiryDate'],
      avatarUrl: map['avatarUrl'],
      dateOfBirth: map['dateOfBirth'], // Map from JSON
      lastVisitDate: map['lastVisitDate'], // Map from JSON
      isSelected: map['isSelected'] ?? false,
    );
  }

  PatientDetails copyWith({
    String? patientId,
    String? name,
    int? age,
    String? gender,
    String? bloodGroup,
    String? weight,
    String? height,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? phone,
    String? city,
    String? address,
    String? pincode,
    String? insuranceNumber,
    String? expiryDate,
    String? avatarUrl,
    String? dateOfBirth,
    String? lastVisitDate,
    bool? isSelected,
  }) {
    return PatientDetails(
      patientId: patientId ?? this.patientId,
      name: name ?? this.name,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
      phone: phone ?? this.phone,
      city: city ?? this.city,
      address: address ?? this.address,
      pincode: pincode ?? this.pincode,
      insuranceNumber: insuranceNumber ?? this.insuranceNumber,
      expiryDate: expiryDate ?? this.expiryDate,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      lastVisitDate: lastVisitDate ?? this.lastVisitDate,
      isSelected: isSelected ?? this.isSelected,
    );
  }
}

/// Represents a single checkup record for a patient.
class CheckupRecord {
  final String doctor;
  final String speciality;
  final String reason;
  final String date;
  final String reportStatus;

  CheckupRecord({
    required this.doctor,
    required this.speciality,
    required this.reason,
    required this.date,
    required this.reportStatus,
  });

  factory CheckupRecord.fromMap(Map<String, dynamic> map) {
    return CheckupRecord(
      doctor: map['doctor'],
      speciality: map['speciality'],
      reason: map['reason'],
      date: map['date'],
      reportStatus: map['reportStatus'],
    );
  }
}

/// A container class to hold a list of [PatientDetails].
class PatientDashboardData {
  final List<PatientDetails> patients;

  PatientDashboardData({required this.patients});
}
