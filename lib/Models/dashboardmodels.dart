class DashboardAppointments {
  final String id;
  final String patientName;
  final int patientAge;
  final String date;
  final String time;
  final String reason;
  final String doctor; // now normalized string name
  final String status;
  final String gender;
  final String patientId;
  final String service;
  final String patientAvatarUrl;
  bool isSelected;

  final String? previousNotes;
  final String? currentNotes;

  final List<Map<String, String>> pharmacy;
  final List<Map<String, String>> pathology;

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
  
  // New fields for patient code and blood group
  final String? bloodGroup;
  final String? patientCode;
  
  // Follow-up tracking fields
  final String? appointmentId;
  final Map<String, dynamic>? metadata;

  DashboardAppointments({
    required this.id,
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
    this.previousNotes,
    this.currentNotes,
    this.pharmacy = const [],
    this.pathology = const [],
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
    this.bloodGroup,
    this.patientCode,
    this.appointmentId,
    this.metadata,
  });

  /// ✅ Create from JSON safely
  factory DashboardAppointments.fromJson(Map<String, dynamic> json) {
    // Extract doctor field safely (may be String, Map, or null)
    String doctorName = '';
    if (json['doctorId'] is Map) {
      final d = json['doctorId'] as Map;
      doctorName = '${d['firstName'] ?? ''} ${d['lastName'] ?? ''}'.trim();
    } else if (json['doctorId'] is String) {
      doctorName = json['doctorId'];
    }

    // Extract patient field safely
    String patientId = '';
    String patientFullName = '';
    String gender = '';
    String? bloodGroup;
    String? patientCode;
    int patientAge = 0;
    
    if (json['patientId'] is Map) {
      final p = json['patientId'] as Map;
      patientId = p['_id'] ?? '';
      patientFullName = '${p['firstName'] ?? ''} ${p['lastName'] ?? ''}'.trim();
      gender = p['gender'] ?? '';
      bloodGroup = p['bloodGroup']?.toString();
      
      // Extract patient code from metadata
      if (p['metadata'] is Map) {
        patientCode = p['metadata']['patientCode']?.toString();
      }
      
      // Calculate age from dateOfBirth if available
      if (p['dateOfBirth'] != null) {
        try {
          final dob = DateTime.tryParse(p['dateOfBirth'].toString());
          if (dob != null) {
            final today = DateTime.now();
            patientAge = today.year - dob.year;
            if (today.month < dob.month || (today.month == dob.month && today.day < dob.day)) {
              patientAge--;
            }
            if (patientAge < 0) patientAge = 0;
          }
        } catch (e) {
          // If calculation fails, keep age as 0
        }
      }
    } else if (json['patientId'] is String) {
      patientId = json['patientId'];
      patientFullName = json['clientName'] ?? '';
    }

    // Parse date/time
    String date = json['date'] ??
        (json['startAt'] != null
            ? DateTime.tryParse(json['startAt'])
            ?.toIso8601String()
            .split('T')
            .first ??
            ''
            : '');
    String time = json['time'] ??
        (json['startAt'] != null
            ? _formatTime(DateTime.tryParse(json['startAt']))
            : '');

    // ✅ Fix: read reason (chiefComplaint) from multiple possible locations
    String reason = '';
    if (json['chiefComplaint'] != null && json['chiefComplaint'].toString().trim().isNotEmpty) {
      reason = json['chiefComplaint'].toString().trim();
    } else if (json['reason'] != null && json['reason'].toString().trim().isNotEmpty) {
      reason = json['reason'].toString().trim();
    } else if (json['metadata'] is Map) {
      final meta = json['metadata'] as Map;
      if (meta['chiefComplaint'] != null && meta['chiefComplaint'].toString().trim().isNotEmpty) {
        reason = meta['chiefComplaint'].toString().trim();
      } else if (meta['reason'] != null && meta['reason'].toString().trim().isNotEmpty) {
        reason = meta['reason'].toString().trim();
      }
    }
    
    // Final fallback: check notes
    if (reason.isEmpty && json['notes'] != null && json['notes'].toString().trim().isNotEmpty) {
      reason = json['notes'].toString().trim();
    }

    return DashboardAppointments(
      id: json['_id'] ?? '',
      patientName: patientFullName.isNotEmpty ? patientFullName : (json['clientName'] ?? ''),
      patientAge: json['patientAge'] is int
          ? json['patientAge']
          : (patientAge > 0 ? patientAge : int.tryParse(json['patientAge']?.toString() ?? '0') ?? 0),
      date: date,
      time: time,
      reason: reason, // ✅ fixed here
      doctor: doctorName,
      status: json['status'] ?? 'Scheduled',
      gender: gender,
      patientId: patientId,
      service: json['appointmentType'] ?? '',
      patientAvatarUrl: json['patientAvatarUrl'] ?? '',
      previousNotes: json['history']?['previousNotes'],
      currentNotes: json['history']?['currentNotes'],
      pharmacy: (json['pharmacy'] as List?)
          ?.map((e) => Map<String, String>.from(e))
          .toList() ??
          [],
      pathology: (json['pathology'] as List?)
          ?.map((e) => Map<String, String>.from(e))
          .toList() ??
          [],
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
      bloodGroup: bloodGroup,
      patientCode: patientCode,
      appointmentId: json['_id'] ?? json['appointmentId'],
      metadata: json['followUp'] != null ? {'followUp': json['followUp']} : null,
    );
  }


  /// Helper: Format DateTime -> HH:mm
  static String _formatTime(DateTime? dt) {
    if (dt == null) return '';
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  /// ✅ Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
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
      'history': history,
      'vitals': {'bp': bp},
      'pharmacy': pharmacy,
      'pathology': pathology,
      'location': location,
    };
  }
}

class DoctorDashboardData {
  final List<DashboardAppointments> appointments;
  DoctorDashboardData({required this.appointments});

  factory DoctorDashboardData.fromJson(List<dynamic> list) {
    return DoctorDashboardData(
      appointments:
      list.map((e) => DashboardAppointments.fromJson(e)).toList(),
    );
  }
}
