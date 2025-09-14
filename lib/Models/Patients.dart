// lib/models/patient_models.dart
// Adjust the import path below if your Doctor.dart is in another folder.
import 'Doctor.dart';

/// Represents detailed information about a patient.
class PatientDetails {
  final String patientId;
  final String name; // full display name (firstName + lastName fallback)
  final String? firstName;
  final String? lastName;
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
  final String dateOfBirth;
  final String lastVisitDate;

  // backend required link to doctor (keeps original)
  final String doctorId;

  // New: typed Doctor object when server returns nested doctor
  final Doctor? doctor;

  // New: safe string fallback (may be empty)
  final String doctorName;

  final List<String> medicalHistory;
  final List<String> allergies;

  // New fields (vitals and notes)
  final String notes;
  final String oxygen;
  final String bmi;

  // Mutable selection used by UI checkbox
  bool isSelected;

  PatientDetails({
    required this.patientId,
    required this.name,
    this.firstName,
    this.lastName,
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
    required this.dateOfBirth,
    required this.lastVisitDate,
    required this.doctorId,
    this.doctor,
    this.doctorName = '',
    this.medicalHistory = const [],
    this.allergies = const [],
    this.notes = '',
    this.oxygen = '',
    this.bmi = '',
    this.isSelected = false,
  });

  /// Helper: returns the best available display name for the doctor.
  /// Priority:
  ///  1. doctor (typed) -> use userProfile name if possible
  ///  2. doctorName (server-provided string)
  ///  3. doctorId (fallback)
  String get doctorDisplayName {
    // 1) If typed Doctor present, try to derive readable name
    if (doctor != null) {
      try {
        // Doctor includes a User (userProfile). Try to use toMap() if available.
        // This is defensive: if userProfile.toMap() doesn't exist, fall back to first/last names on userProfile.
        try {
          final profileMap = doctor!.userProfile.toMap();
          final nameFromMap = (profileMap['name']?.toString() ??
              '${profileMap['firstName'] ?? ''} ${profileMap['lastName'] ?? ''}')
              .trim();
          if (nameFromMap.isNotEmpty) return nameFromMap;
        } catch (_) {
          // fallback to User fields (if available)
          final fn = doctor!.userProfile.firstName ?? '';
          final ln = doctor!.userProfile.lastName ?? '';
          final combined = ('$fn ${ln.isNotEmpty ? ln : ''}').trim();
          if (combined.isNotEmpty) return combined;
        }
      } catch (_) {
        // ignore and fall through
      }
    }

    // 2) server-provided doctorName string
    if (doctorName.isNotEmpty) return doctorName;

    // 3) doctorId fallback
    if (doctorId.isNotEmpty) return doctorId;

    return 'No doctor';
  }

  factory PatientDetails.fromMap(Map<String, dynamic> map) {
    final first = map['firstName']?.toString() ?? '';
    final last = map['lastName']?.toString() ?? '';
    final fullName = (map['name']?.toString().isNotEmpty ?? false)
        ? map['name'].toString()
        : ('$first${last.isNotEmpty ? ' $last' : ''}').trim();

    // parse doctor object if present (server may return doctor as nested object),
    // or parse doctorName if server returned only name string.
    Doctor? parsedDoctor;
    String parsedDoctorName = '';

    final dynamic rawDoctor = map['doctor'];

    if (rawDoctor != null) {
      try {
        if (rawDoctor is Map) {
          // Defensive copy and parse
          parsedDoctor = Doctor.fromMap(Map<String, dynamic>.from(rawDoctor));
          // Try to derive a human readable name from doctor.userProfile
          try {
            final profileMap = parsedDoctor.userProfile.toMap();
            parsedDoctorName = (profileMap['name']?.toString() ??
                '${profileMap['firstName'] ?? ''} ${profileMap['lastName'] ?? ''}')
                .trim();
          } catch (_) {
            // fallback to the user's firstName if available
            parsedDoctorName = parsedDoctor.userProfile.firstName ?? '';
          }
        } else if (rawDoctor is String) {
          parsedDoctorName = rawDoctor;
        }
      } catch (_) {
        // ignore parse errors and continue with empty parsedDoctor
        parsedDoctor = null;
      }
    }

    // server might provide doctorName separately in payload
    if (parsedDoctorName.isEmpty) {
      parsedDoctorName =
          map['doctorName']?.toString() ?? map['doctor_name']?.toString() ?? '';
    }

    return PatientDetails(
      patientId: map['_id']?.toString() ??
          map['id']?.toString() ??
          map['patientId']?.toString() ??
          '',
      name: fullName,
      firstName: first.isNotEmpty ? first : null,
      lastName: last.isNotEmpty ? last : null,
      age: map['age'] is int
          ? map['age'] as int
          : int.tryParse(map['age']?.toString() ?? '') ?? 0,
      gender: map['gender']?.toString() ?? '',
      bloodGroup: map['bloodGroup']?.toString() ?? '',
      weight: map['weight']?.toString() ?? '',
      height: map['height']?.toString() ?? '',
      emergencyContactName: map['emergencyContactName']?.toString() ?? '',
      emergencyContactPhone:
      map['emergencyContactPhone']?.toString() ?? '',
      phone: map['phone']?.toString() ?? '',
      city: map['city']?.toString() ?? '',
      address: map['address']?.toString() ?? '',
      pincode: map['pincode']?.toString() ?? '',
      insuranceNumber: map['insuranceNumber']?.toString() ?? '',
      expiryDate: map['expiryDate']?.toString() ?? '',
      avatarUrl: map['avatarUrl']?.toString() ?? '',
      dateOfBirth: map['dateOfBirth']?.toString() ?? '',
      lastVisitDate:
      map['lastVisitDate']?.toString() ?? map['updatedAt']?.toString() ?? '',
      doctorId: map['doctorId']?.toString() ?? '',
      doctor: parsedDoctor,
      doctorName: parsedDoctorName,
      medicalHistory:
      (map['medicalHistory'] as List?)?.map((e) => e.toString()).toList() ??
          [],
      allergies:
      (map['allergies'] as List?)?.map((e) => e.toString()).toList() ?? [],
      notes: map['notes']?.toString() ?? '',
      oxygen: map['oxygen']?.toString() ?? '',
      bmi: map['bmi']?.toString() ?? '',
      isSelected: map['isSelected'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    final base = <String, dynamic>{
      'patientId': patientId,
      'name': name,
      'firstName': firstName,
      'lastName': lastName,
      'age': age,
      'gender': gender,
      'bloodGroup': bloodGroup,
      'weight': weight,
      'height': height,
      'emergencyContactName': emergencyContactName,
      'emergencyContactPhone': emergencyContactPhone,
      'phone': phone,
      'city': city,
      'address': address,
      'pincode': pincode,
      'insuranceNumber': insuranceNumber,
      'expiryDate': expiryDate,
      'avatarUrl': avatarUrl,
      'dateOfBirth': dateOfBirth,
      'lastVisitDate': lastVisitDate,
      'doctorId': doctorId,
      'doctorName': doctorName,
      'medicalHistory': medicalHistory,
      'allergies': allergies,
      'notes': notes,
      'oxygen': oxygen,
      'bmi': bmi,
      'isSelected': isSelected,
    };

    if (doctor != null) {
      // include nested doctor object only if present
      try {
        base['doctor'] = doctor!.toMap();
      } catch (_) {
        // If Doctor doesn't expose toMap(), try providing a minimal map
        base['doctor'] = {
          'id': doctor!.userProfile.id ?? '',
          'firstName': doctor!.userProfile.firstName ?? '',
          'lastName': doctor!.userProfile.lastName ?? '',
        };
      }
    }

    return base;
  }

  PatientDetails copyWith({
    String? patientId,
    String? name,
    String? firstName,
    String? lastName,
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
    String? doctorId,
    Doctor? doctor,
    String? doctorName,
    List<String>? medicalHistory,
    List<String>? allergies,
    String? notes,
    String? oxygen,
    String? bmi,
    bool? isSelected,
  }) {
    return PatientDetails(
      patientId: patientId ?? this.patientId,
      name: name ?? this.name,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      emergencyContactName:
      emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone:
      emergencyContactPhone ?? this.emergencyContactPhone,
      phone: phone ?? this.phone,
      city: city ?? this.city,
      address: address ?? this.address,
      pincode: pincode ?? this.pincode,
      insuranceNumber: insuranceNumber ?? this.insuranceNumber,
      expiryDate: expiryDate ?? this.expiryDate,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      lastVisitDate: lastVisitDate ?? this.lastVisitDate,
      doctorId: doctorId ?? this.doctorId,
      doctor: doctor ?? this.doctor,
      doctorName: doctorName ?? this.doctorName,
      medicalHistory: medicalHistory ?? this.medicalHistory,
      allergies: allergies ?? this.allergies,
      notes: notes ?? this.notes,
      oxygen: oxygen ?? this.oxygen,
      bmi: bmi ?? this.bmi,
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
      doctor: map['doctor']?.toString() ?? '',
      speciality: map['speciality']?.toString() ?? '',
      reason: map['reason']?.toString() ?? '',
      date: map['date']?.toString() ?? '',
      reportStatus: map['reportStatus']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'doctor': doctor,
      'speciality': speciality,
      'reason': reason,
      'date': date,
      'reportStatus': reportStatus,
    };
  }
}

/// A container class to hold a list of [PatientDetails].
class PatientDashboardData {
  final List<PatientDetails> patients;

  PatientDashboardData({required this.patients});
}
