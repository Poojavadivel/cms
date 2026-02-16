// lib/models/patient_models.dart
// Adjust the import path below if your Doctor.dart is in another folder.
import 'package:flutter/foundation.dart';
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
  final String bp;           // Blood pressure
  final String pulse;        // Pulse rate
  final String temp;         // Temperature
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String phone;
  final String houseNo;
  final String street;
  final String city;
  final String state;
  final String pincode;
  final String country;
  final String address; // Legacy field for backward compatibility
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

  // New: patientCode coming from backend (metadata.patientCode or patientCode)
  final String? patientCode;

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
    this.bp = '',
    this.pulse = '',
    this.temp = '',
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.phone,
    this.houseNo = '',
    this.street = '',
    required this.city,
    this.state = '',
    required this.pincode,
    this.country = '',
    this.address = '', // Legacy field
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
    this.patientCode,
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

  /// Prefer showing patientCode (PAT-xxx) if available, otherwise fallback to patientId.
  String get displayId => (patientCode != null && patientCode!.isNotEmpty) ? patientCode! : patientId;

  factory PatientDetails.fromMap(Map<String, dynamic> map) {
    // DEBUG: Log incoming data to see what backend is sending
    debugPrint('🔍 PatientDetails.fromMap - Checking for vitals...');
    debugPrint('   Has vitals key: ${map.containsKey('vitals')}');
    if (map.containsKey('vitals')) {
      debugPrint('   Vitals data: ${map['vitals']}');
    }
    debugPrint('   Legacy fields - height: ${map['height']}, weight: ${map['weight']}, bmi: ${map['bmi']}');
    
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

    // Extract patientCode from several possible places:
    // 1) top-level map['patientCode']
    // 2) map['patient_code']
    // 3) map['metadata']?.['patientCode'] or ['patient_code']
    String? extractedPatientCode;
    try {
      if (map.containsKey('patientCode') && (map['patientCode'] is String)) {
        extractedPatientCode = map['patientCode'] as String;
      } else if (map.containsKey('patient_code') && (map['patient_code'] is String)) {
        extractedPatientCode = map['patient_code'] as String;
      } else if (map['metadata'] is Map) {
        final md = Map<String, dynamic>.from(map['metadata'] as Map);
        if (md.containsKey('patientCode') && md['patientCode'] is String) {
          extractedPatientCode = md['patientCode'] as String;
        } else if (md.containsKey('patient_code') && md['patient_code'] is String) {
          extractedPatientCode = md['patient_code'] as String;
        }
      }
    } catch (_) {
      extractedPatientCode = null;
    }

    // Extract metadata for commonly nested fields
    final metadata = (map['metadata'] is Map) 
        ? Map<String, dynamic>.from(map['metadata'] as Map) 
        : <String, dynamic>{};
    
    // Extract address object
    final addressObj = (map['address'] is Map)
        ? Map<String, dynamic>.from(map['address'] as Map)
        : <String, dynamic>{};
    
    // Extract age from multiple possible locations
    int extractedAge = 0;
    if (map['age'] is int) {
      extractedAge = map['age'] as int;
    } else if (map['age'] != null) {
      extractedAge = int.tryParse(map['age'].toString()) ?? 0;
    }
    // Fallback to metadata.age
    if (extractedAge == 0 && metadata['age'] != null) {
      if (metadata['age'] is int) {
        extractedAge = metadata['age'] as int;
      } else {
        extractedAge = int.tryParse(metadata['age'].toString()) ?? 0;
      }
    }
    // If still 0, try to calculate from dateOfBirth
    if (extractedAge == 0 && map['dateOfBirth'] != null) {
      try {
        final dob = DateTime.tryParse(map['dateOfBirth'].toString());
        if (dob != null) {
          final now = DateTime.now();
          extractedAge = now.year - dob.year;
          if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
            extractedAge--;
          }
        }
      } catch (_) {}
    }
    
    return PatientDetails(
      patientId: map['_id']?.toString() ??
          map['id']?.toString() ??
          map['patientId']?.toString() ??
          '',
      name: fullName,
      firstName: first.isNotEmpty ? first : null,
      lastName: last.isNotEmpty ? last : null,
      age: extractedAge,
      gender: map['gender']?.toString() ?? '',
      bloodGroup: map['bloodGroup']?.toString() ?? 
          metadata['bloodGroup']?.toString() ?? 'O+',
      // Extract from vitals object first, then fallback to legacy fields
      weight: _extractVital(map, 'weightKg', 'weight'),
      height: _extractVital(map, 'heightCm', 'height'),
      bmi: _extractVital(map, 'bmi', 'bmi'),
      oxygen: _extractVital(map, 'spo2', 'oxygen'),
      bp: _extractVital(map, 'bp', 'bp'),
      pulse: _extractVital(map, 'pulse', 'pulse'),
      temp: _extractVital(map, 'temp', 'temp'),
      // Emergency contact from metadata
      emergencyContactName: metadata['emergencyContactName']?.toString() ?? 
          map['emergencyContactName']?.toString() ?? '',
      emergencyContactPhone: metadata['emergencyContactPhone']?.toString() ?? 
          map['emergencyContactPhone']?.toString() ?? '',
      phone: map['phone']?.toString() ?? '',
      // Address fields from address object or root level
      houseNo: addressObj['houseNo']?.toString() ?? map['houseNo']?.toString() ?? '',
      street: addressObj['street']?.toString() ?? map['street']?.toString() ?? '',
      city: addressObj['city']?.toString() ?? map['city']?.toString() ?? '',
      state: addressObj['state']?.toString() ?? map['state']?.toString() ?? '',
      pincode: addressObj['pincode']?.toString() ?? map['pincode']?.toString() ?? '',
      country: addressObj['country']?.toString() ?? map['country']?.toString() ?? '',
      address: addressObj['line1']?.toString() ?? map['address']?.toString() ?? '', // Legacy
      // Insurance from metadata
      insuranceNumber: metadata['insuranceNumber']?.toString() ?? 
          map['insuranceNumber']?.toString() ?? '',
      expiryDate: metadata['expiryDate']?.toString() ?? 
          map['expiryDate']?.toString() ?? '',
      avatarUrl: metadata['avatarUrl']?.toString() ?? 
          map['avatarUrl']?.toString() ?? '',
      dateOfBirth: map['dateOfBirth']?.toString() ?? '',
      lastVisitDate: map['lastVisitDate']?.toString() ?? map['updatedAt']?.toString() ?? '',
      doctorId: (() {
        // Handle doctorId - can be String ID or Map (doctor object)
        final doctorIdValue = map['doctorId'];
        if (doctorIdValue == null) return '';
        if (doctorIdValue is String) return doctorIdValue;
        if (doctorIdValue is Map) {
          // Backend returned full doctor object - extract ID
          return (doctorIdValue['_id'] ?? doctorIdValue['id'] ?? '').toString();
        }
        return doctorIdValue.toString();
      })(),
      doctor: parsedDoctor,
      doctorName: parsedDoctorName,
      medicalHistory: (() {
        // Handle medicalHistory - can be List (old format) or Map (new format)
        try {
          if (metadata['medicalHistory'] is List) {
            return (metadata['medicalHistory'] as List).map((e) => e.toString()).toList();
          } else if (metadata['medicalHistory'] is Map) {
            // New format - extract current conditions as simple list
            final mh = metadata['medicalHistory'] as Map;
            final conditions = mh['currentConditions'];
            if (conditions is List) {
              return conditions.map((e) => e.toString()).toList();
            }
            return <String>[];
          } else if (map['medicalHistory'] is List) {
            return (map['medicalHistory'] as List).map((e) => e.toString()).toList();
          }
        } catch (_) {}
        return <String>[];
      })(),
      allergies: (() {
        try {
          if (map['allergies'] is List) {
            return (map['allergies'] as List).map((e) => e.toString()).toList();
          }
        } catch (_) {}
        return <String>[];
      })(),
      notes: map['notes']?.toString() ?? '',
      isSelected: map['isSelected'] == true,
      patientCode: extractedPatientCode,
    );
  }

  /// Helper to extract vital signs from vitals object or fallback to legacy field
  static String _extractVital(Map<String, dynamic> map, String vitalKey, String legacyKey) {
    // Check vitals object first
    if (map['vitals'] is Map) {
      final vitals = map['vitals'] as Map<String, dynamic>;
      final value = vitals[vitalKey];
      if (value != null) {
        debugPrint('   ✅ Extracted $vitalKey from vitals: $value');
        return value.toString();
      }
    }
    // Fallback to legacy field
    final legacyValue = map[legacyKey]?.toString() ?? '';
    if (legacyValue.isNotEmpty) {
      debugPrint('   ⚠️ Using legacy field $legacyKey: $legacyValue');
    } else {
      debugPrint('   ❌ No value for $vitalKey/$legacyKey');
    }
    return legacyValue;
  }

  /// Prefer showing patientCode (PAT-xxx) if available, otherwise fallback to patientId.
  String get patientCodeOrId => (patientCode != null && patientCode!.isNotEmpty) ? patientCode! : patientId;

  /// Helper to parse number from string
  static num? _parseNumber(String value) {
    if (value.isEmpty) return null;
    return num.tryParse(value);
  }

  Map<String, dynamic> toJson() {
    // Ensure doctorId is always a string (defensive programming)
    String safeDoctorId = '';
    if (doctorId.isNotEmpty) {
      safeDoctorId = doctorId;
    }
    
    final base = <String, dynamic>{
      'patientId': patientId,
      'name': name,
      'firstName': firstName,
      'lastName': lastName,
      'age': age,                   // ✅ FIXED - Add age to root level
      'gender': gender,
      'bloodGroup': bloodGroup,     // ✅ FIXED - Add bloodGroup to root level
      'phone': phone,
      'dateOfBirth': dateOfBirth,
      
      // Address as structured object
      'address': {
        'houseNo': houseNo,
        'street': street,
        'city': city,
        'state': state,
        'pincode': pincode,
        'country': country,
        'line1': address, // Legacy field for backward compatibility
      },
      
      // Vitals as structured object
      'vitals': {
        'heightCm': _parseNumber(height),
        'weightKg': _parseNumber(weight),
        'bmi': _parseNumber(bmi),
        'bp': bp.isNotEmpty ? bp : null,
        'pulse': _parseNumber(pulse),
        'spo2': _parseNumber(oxygen),
        'temp': _parseNumber(temp),
      },
      
      'doctorId': safeDoctorId,
      'allergies': allergies,
      'notes': notes,
      
      // Metadata for extra fields
      'metadata': {
        'age': age,
        'bloodGroup': bloodGroup,
        'emergencyContactName': emergencyContactName,
        'emergencyContactPhone': emergencyContactPhone,
        'insuranceNumber': insuranceNumber,
        'expiryDate': expiryDate,
        'avatarUrl': avatarUrl,
        'medicalHistory': medicalHistory,
      },
    };

    if (patientCode != null) {
      base['patientCode'] = patientCode;
    }

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
    String? bp,
    String? pulse,
    String? temp,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? phone,
    String? houseNo,
    String? street,
    String? city,
    String? state,
    String? pincode,
    String? country,
    String? address,
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
    String? patientCode,
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
      bp: bp ?? this.bp,
      pulse: pulse ?? this.pulse,
      temp: temp ?? this.temp,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
      phone: phone ?? this.phone,
      houseNo: houseNo ?? this.houseNo,
      street: street ?? this.street,
      city: city ?? this.city,
      state: state ?? this.state,
      pincode: pincode ?? this.pincode,
      country: country ?? this.country,
      address: address ?? this.address,
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
      patientCode: patientCode ?? this.patientCode,
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
