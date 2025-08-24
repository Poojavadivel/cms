// lib/models/dashboard_models.dart

/// Represents a single appointment entry in the dashboard.
/// Contains details about the patient, date, time, reason, doctor, status,
/// gender (for icon selection), patient ID, service, and an optional avatar URL.
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
  bool isSelected; // Added for checkbox functionality

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
    this.patientAvatarUrl = '', // Default empty string
    this.isSelected = false, // Default to false
  });

  // Added a copyWith method to easily create a new instance with updated properties
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
    );
  }
}

/// A container class to hold a list of [DashboardAppointments].
/// This is typically used to represent the overall data fetched for a dashboard or list view.
class DoctorDashboardData {
  final List<DashboardAppointments> appointments;

  DoctorDashboardData({required this.appointments});
}
