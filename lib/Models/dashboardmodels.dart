class DashboardAppointments {
  final String id; // 👈 Appointment ID from MongoDB (_id)
  final String patientName;
  final int patientAge;
  final String date;
  final String time;
  final String reason;
  final String doctor;
  final String status;
  final String gender; // Used to select the correct local asset icon (Male/Female)
  final String patientId;
  final String service;
  final String patientAvatarUrl; // Optional: for network images if needed
  bool isSelected;

  // ✅ Notes
  final String? previousNotes;
  final String? currentNotes;

  // ✅ Pharmacy & Pathology
  final List<Map<String, String>> pharmacy;
  final List<Map<String, String>> pathology;

  // Extended fields for detailed preview
  final String diabetesType;
  final String location;
  final String occupation;
  final String dob;
  final double bmi;
  final int weight;
  final int height;
  final String bp;
  final List<String> diagnosis;
  final List<String> barriers;
  final List<Map<String, String>> timeline;
  final Map<String, String> history;

  DashboardAppointments({
    required this.id, // 👈 Required
    required this.patientName,
    required this.patientAge,
    required this.date,
    required this.time,
    required this.reason,
    required this.doctor,
    required this.status,
    required this.gender,
    required this.patientId,
    required this.service,
    this.patientAvatarUrl = '',
    this.isSelected = false,

    // ✅ Notes
    this.previousNotes,
    this.currentNotes,

    // ✅ Tables
    this.pharmacy = const [],
    this.pathology = const [],

    // Extended fields
    this.diabetesType = 'Type 2',
    this.location = '',
    this.occupation = '',
    this.dob = '',
    this.bmi = 0.0,
    this.weight = 0,
    this.height = 0,
    this.bp = '',
    this.diagnosis = const [],
    this.barriers = const [],
    this.timeline = const [],
    this.history = const {},
  });

  /// ✅ Create object from API JSON
  factory DashboardAppointments.fromJson(Map<String, dynamic> json) {
    return DashboardAppointments(
      id: json['_id'] ?? '', // 👈 Map MongoDB _id
      patientName: json['clientName'] ?? '',
      patientAge: int.tryParse(json['patientAge']?.toString() ?? '0') ?? 0,
      date: json['date'] ?? '',
      time: json['time'] ?? '',
      reason: json['chiefComplaint'] ?? '',
      doctor: json['doctorId'] ?? '',
      status: json['status'] ?? 'Scheduled',
      gender: json['gender'] ?? '',
      patientId: json['patientId'] is Map
          ? json['patientId']['_id'] ?? ''
          : (json['patientId']?.toString() ?? ''),
      service: json['appointmentType'] ?? '',
      patientAvatarUrl: json['patientAvatarUrl'] ?? '',

      // ✅ Notes
      previousNotes: json['history']?['previousNotes'],
      currentNotes: json['history']?['currentNotes'],

      // ✅ Tables
      pharmacy: (json['pharmacy'] as List?)
          ?.map((e) => Map<String, String>.from(e))
          .toList() ??
          [],
      pathology: (json['pathology'] as List?)
          ?.map((e) => Map<String, String>.from(e))
          .toList() ??
          [],

      // Extended fields
      diabetesType: json['history']?['diabetesType'] ?? 'Type 2',
      location: json['location'] ?? '',
      occupation: json['history']?['occupation'] ?? '',
      dob: json['dob'] ?? '',
      bmi: double.tryParse(json['bmi']?.toString() ?? '0') ?? 0.0,
      weight: int.tryParse(json['weight']?.toString() ?? '0') ?? 0,
      height: int.tryParse(json['height']?.toString() ?? '0') ?? 0,
      bp: json['vitals']?['bp'] ?? '',
      diagnosis: (json['diagnosis'] as List?)
          ?.map((e) => e.toString())
          .toList() ??
          [],
      barriers: (json['barriers'] as List?)
          ?.map((e) => e.toString())
          .toList() ??
          [],
      timeline: (json['timeline'] as List?)
          ?.map((e) => Map<String, String>.from(e))
          .toList() ??
          [],
      history: json['history'] != null
          ? Map<String, String>.from(json['history'])
          : {},
    );
  }

  /// ✅ Convert object to JSON for API
  Map<String, dynamic> toJson() {
    return {
      '_id': id, // 👈 Include id
      'clientName': patientName,
      'patientAge': patientAge,
      'date': date,
      'time': time,
      'chiefComplaint': reason,
      'doctorId': doctor,
      'status': status,
      'gender': gender,
      'patientId': patientId,
      'appointmentType': service,
      'patientAvatarUrl': patientAvatarUrl,
      'history': {
        'previousNotes': previousNotes,
        'currentNotes': currentNotes,
        'diabetesType': diabetesType,
        'occupation': occupation,
      },
      'pharmacy': pharmacy,
      'pathology': pathology,
      'dob': dob,
      'bmi': bmi,
      'weight': weight,
      'height': height,
      'vitals': {
        'bp': bp,
      },
      'diagnosis': diagnosis,
      'barriers': barriers,
      'timeline': timeline,
    };
  }

  DashboardAppointments copyWith({
    String? id,
    String? patientName,
    int? patientAge,
    String? date,
    String? time,
    String? reason,
    String? doctor,
    String? status,
    String? gender,
    String? patientId,
    String? service,
    String? patientAvatarUrl,
    bool? isSelected,

    // ✅ Notes
    String? previousNotes,
    String? currentNotes,

    // ✅ Tables
    List<Map<String, String>>? pharmacy,
    List<Map<String, String>>? pathology,

    // Extended fields
    String? diabetesType,
    String? location,
    String? occupation,
    String? dob,
    double? bmi,
    int? weight,
    int? height,
    String? bp,
    List<String>? diagnosis,
    List<String>? barriers,
    List<Map<String, String>>? timeline,
    Map<String, String>? history,
  }) {
    return DashboardAppointments(
      id: id ?? this.id,
      patientName: patientName ?? this.patientName,
      patientAge: patientAge ?? this.patientAge,
      date: date ?? this.date,
      time: time ?? this.time,
      reason: reason ?? this.reason,
      doctor: doctor ?? this.doctor,
      status: status ?? this.status,
      gender: gender ?? this.gender,
      patientId: patientId ?? this.patientId,
      service: service ?? this.service,
      patientAvatarUrl: patientAvatarUrl ?? this.patientAvatarUrl,
      isSelected: isSelected ?? this.isSelected,

      // ✅ Notes
      previousNotes: previousNotes ?? this.previousNotes,
      currentNotes: currentNotes ?? this.currentNotes,

      // ✅ Tables
      pharmacy: pharmacy ?? this.pharmacy,
      pathology: pathology ?? this.pathology,

      // Extended fields
      diabetesType: diabetesType ?? this.diabetesType,
      location: location ?? this.location,
      occupation: occupation ?? this.occupation,
      dob: dob ?? this.dob,
      bmi: bmi ?? this.bmi,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      bp: bp ?? this.bp,
      diagnosis: diagnosis ?? this.diagnosis,
      barriers: barriers ?? this.barriers,
      timeline: timeline ?? this.timeline,
      history: history ?? this.history,
    );
  }
}

class DoctorDashboardData {
  final List<DashboardAppointments> appointments;
  DoctorDashboardData({required this.appointments});
}
