class DashboardAppointments {
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

    // New fields
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

  DashboardAppointments copyWith({
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

    // New fields
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