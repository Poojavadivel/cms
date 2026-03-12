/**
 * patient_vitals.dart
 * 
 * PURPOSE: Patient vital signs model
 * USED BY:
 *   - Doctor module (recording vitals)
 *   - Patient profile (vitals history)
 *   - Appointment details (vital signs during visit)
 * 
 * FLOW:
 *   1. Fetch vitals from /api/patients/:id/vitals
 *   2. Display in charts/timeline
 *   3. Record new vitals during appointments
 */

class PatientVitals {
  final String id;
  final String patientId;
  final String? appointmentId;
  final String recordedBy;
  
  // Core Vitals
  final BloodPressure? bloodPressure;
  final int? heartRate;
  final Temperature? temperature;
  final int? respiratoryRate;
  final int? oxygenSaturation;
  
  // Physical Measurements
  final Weight? weight;
  final Height? height;
  final double? bmi;
  
  // Additional
  final BloodGlucose? bloodGlucose;
  final int? painScale;
  
  // Metadata
  final String? notes;
  final List<AbnormalFlag> abnormalFlags;
  final DateTime recordedAt;
  final String location;
  final String? deviceInfo;

  PatientVitals({
    required this.id,
    required this.patientId,
    this.appointmentId,
    required this.recordedBy,
    this.bloodPressure,
    this.heartRate,
    this.temperature,
    this.respiratoryRate,
    this.oxygenSaturation,
    this.weight,
    this.height,
    this.bmi,
    this.bloodGlucose,
    this.painScale,
    this.notes,
    this.abnormalFlags = const [],
    required this.recordedAt,
    this.location = 'Clinic',
    this.deviceInfo,
  });

  factory PatientVitals.fromJson(Map<String, dynamic> json) {
    return PatientVitals(
      id: json['_id'] ?? '',
      patientId: json['patientId'] ?? '',
      appointmentId: json['appointmentId'],
      recordedBy: json['recordedBy'] ?? '',
      bloodPressure: json['bloodPressure'] != null 
          ? BloodPressure.fromJson(json['bloodPressure']) 
          : null,
      heartRate: json['heartRate'],
      temperature: json['temperature'] != null 
          ? Temperature.fromJson(json['temperature']) 
          : null,
      respiratoryRate: json['respiratoryRate'],
      oxygenSaturation: json['oxygenSaturation'],
      weight: json['weight'] != null ? Weight.fromJson(json['weight']) : null,
      height: json['height'] != null ? Height.fromJson(json['height']) : null,
      bmi: json['bmi']?.toDouble(),
      bloodGlucose: json['bloodGlucose'] != null 
          ? BloodGlucose.fromJson(json['bloodGlucose']) 
          : null,
      painScale: json['painScale'],
      notes: json['notes'],
      abnormalFlags: (json['abnormalFlags'] as List?)
              ?.map((e) => AbnormalFlag.fromJson(e))
              .toList() ??
          [],
      recordedAt: DateTime.parse(json['recordedAt'] ?? DateTime.now().toIso8601String()),
      location: json['location'] ?? 'Clinic',
      deviceInfo: json['deviceInfo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'patientId': patientId,
      if (appointmentId != null) 'appointmentId': appointmentId,
      'recordedBy': recordedBy,
      if (bloodPressure != null) 'bloodPressure': bloodPressure!.toJson(),
      if (heartRate != null) 'heartRate': heartRate,
      if (temperature != null) 'temperature': temperature!.toJson(),
      if (respiratoryRate != null) 'respiratoryRate': respiratoryRate,
      if (oxygenSaturation != null) 'oxygenSaturation': oxygenSaturation,
      if (weight != null) 'weight': weight!.toJson(),
      if (height != null) 'height': height!.toJson(),
      if (bmi != null) 'bmi': bmi,
      if (bloodGlucose != null) 'bloodGlucose': bloodGlucose!.toJson(),
      if (painScale != null) 'painScale': painScale,
      if (notes != null) 'notes': notes,
      'abnormalFlags': abnormalFlags.map((e) => e.toJson()).toList(),
      'recordedAt': recordedAt.toIso8601String(),
      'location': location,
      if (deviceInfo != null) 'deviceInfo': deviceInfo,
    };
  }

  String get bpDisplay => bloodPressure?.reading ?? '--/--';
  String get tempDisplay => temperature?.display ?? '--';
  String get weightDisplay => weight?.display ?? '--';
  String get heightDisplay => height?.display ?? '--';
  String get bmiDisplay => bmi != null ? bmi!.toStringAsFixed(1) : '--';
}

class BloodPressure {
  final int systolic;
  final int diastolic;
  final String reading;

  BloodPressure({
    required this.systolic,
    required this.diastolic,
    required this.reading,
  });

  factory BloodPressure.fromJson(Map<String, dynamic> json) {
    return BloodPressure(
      systolic: json['systolic'] ?? 0,
      diastolic: json['diastolic'] ?? 0,
      reading: json['reading'] ?? '${json['systolic']}/${json['diastolic']}',
    );
  }

  Map<String, dynamic> toJson() => {
        'systolic': systolic,
        'diastolic': diastolic,
        'reading': reading,
      };

  bool get isHigh => systolic > 140 || diastolic > 90;
  bool get isLow => systolic < 90 || diastolic < 60;
  bool get isNormal => !isHigh && !isLow;
}

class Temperature {
  final double value;
  final String unit;

  Temperature({required this.value, this.unit = 'C'});

  factory Temperature.fromJson(Map<String, dynamic> json) {
    return Temperature(
      value: json['value']?.toDouble() ?? 0.0,
      unit: json['unit'] ?? 'C',
    );
  }

  Map<String, dynamic> toJson() => {'value': value, 'unit': unit};

  String get display => '${value.toStringAsFixed(1)}°$unit';
  bool get isFever => unit == 'C' ? value > 37.5 : value > 99.5;
}

class Weight {
  final double value;
  final String unit;

  Weight({required this.value, this.unit = 'kg'});

  factory Weight.fromJson(Map<String, dynamic> json) {
    return Weight(
      value: json['value']?.toDouble() ?? 0.0,
      unit: json['unit'] ?? 'kg',
    );
  }

  Map<String, dynamic> toJson() => {'value': value, 'unit': unit};

  String get display => '${value.toStringAsFixed(1)} $unit';
}

class Height {
  final double value;
  final String unit;

  Height({required this.value, this.unit = 'cm'});

  factory Height.fromJson(Map<String, dynamic> json) {
    return Height(
      value: json['value']?.toDouble() ?? 0.0,
      unit: json['unit'] ?? 'cm',
    );
  }

  Map<String, dynamic> toJson() => {'value': value, 'unit': unit};

  String get display => '${value.toStringAsFixed(0)} $unit';
}

class BloodGlucose {
  final double value;
  final String testType;

  BloodGlucose({required this.value, this.testType = 'Random'});

  factory BloodGlucose.fromJson(Map<String, dynamic> json) {
    return BloodGlucose(
      value: json['value']?.toDouble() ?? 0.0,
      testType: json['testType'] ?? 'Random',
    );
  }

  Map<String, dynamic> toJson() => {'value': value, 'testType': testType};

  String get display => '${value.toStringAsFixed(0)} mg/dL';
  bool get isHigh => value > 140;
  bool get isLow => value < 70;
}

class AbnormalFlag {
  final String vital;
  final String severity;
  final String? note;

  AbnormalFlag({
    required this.vital,
    required this.severity,
    this.note,
  });

  factory AbnormalFlag.fromJson(Map<String, dynamic> json) {
    return AbnormalFlag(
      vital: json['vital'] ?? '',
      severity: json['severity'] ?? 'Normal',
      note: json['note'],
    );
  }

  Map<String, dynamic> toJson() => {
        'vital': vital,
        'severity': severity,
        if (note != null) 'note': note,
      };
}
