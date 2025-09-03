import 'package:flutter/material.dart';

class AppointmentDraft {
  final String? id; // appointment ID for edit/delete
  final String clientName;
  final String appointmentType;
  final DateTime date;
  final TimeOfDay time;
  final String location;
  final String? notes;

  final String? gender; // Male / Female / null
  final String? patientId;
  final String? phoneNumber;

  final String mode; // In-clinic / Telehealth
  final String priority; // Normal / Urgent / Emergency
  final int durationMinutes; // 15 / 20 / 30 / 45 / 60
  final bool reminder;
  final String chiefComplaint;

  // quick vitals (optional)
  final String? heightCm;
  final String? weightKg;
  final String? bp;
  final String? heartRate;
  final String? spo2;

  final String status; // Scheduled / In Progress / Completed / Cancelled

  AppointmentDraft({
    this.id,
    required this.clientName,
    required this.appointmentType,
    required this.date,
    required this.time,
    required this.location,
    this.notes,
    this.gender,
    this.patientId,
    this.phoneNumber,
    this.mode = 'In-clinic',
    this.priority = 'Normal',
    this.durationMinutes = 20,
    this.reminder = true,
    this.chiefComplaint = '',
    this.heightCm,
    this.weightKg,
    this.bp,
    this.heartRate,
    this.spo2,
    this.status = 'Scheduled',
  });

  DateTime get dateTime =>
      DateTime(date.year, date.month, date.day, time.hour, time.minute);

  /// ✅ Convert model → JSON
  Map<String, dynamic> toJson() => {
    '_id': id,
    'clientName': clientName,
    'appointmentType': appointmentType,
    'date': date.toIso8601String().split('T').first,
    'time':
    '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
    'location': location,
    'notes': notes,
    'gender': gender,
    'patientId': patientId,
    'phoneNumber': phoneNumber,
    'mode': mode,
    'priority': priority,
    'durationMinutes': durationMinutes,
    'reminder': reminder,
    'chiefComplaint': chiefComplaint,
    // ✅ vitals grouped properly for backend
    'vitals': {
      'heightCm': heightCm,
      'weightKg': weightKg,
      'bp': bp,
      'heartRate': heartRate,
      'spo2': spo2,
    },
    'status': status,
  };

  /// ✅ JSON → model
  factory AppointmentDraft.fromJson(Map<String, dynamic> json) {
    final timeParts = (json['time'] ?? '00:00').toString().split(':');

    // vitals can come nested or flat
    final vitals = json['vitals'] ?? {};

    return AppointmentDraft(
      id: json['_id']?.toString(),
      clientName: json['clientName'] ?? '',
      appointmentType: json['appointmentType'] ?? '',
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      time: TimeOfDay(
        hour: int.tryParse(timeParts[0]) ?? 0,
        minute: int.tryParse(timeParts.length > 1 ? timeParts[1] : '0') ?? 0,
      ),
      location: json['location'] ?? '',
      notes: json['notes'] ?? '',
      gender: json['gender'],
      patientId: json['patientId'] is Map
          ? json['patientId']['_id']?.toString()
          : json['patientId']?.toString(),
      phoneNumber: json['phoneNumber'],
      mode: json['mode'] ?? 'In-clinic',
      priority: json['priority'] ?? 'Normal',
      durationMinutes: json['durationMinutes'] ?? 20,
      reminder: json['reminder'] ?? true,
      chiefComplaint: json['chiefComplaint'] ?? '',
      // ✅ pull from nested vitals OR flat keys
      heightCm: vitals['heightCm']?.toString() ?? json['heightCm']?.toString(),
      weightKg: vitals['weightKg']?.toString() ?? json['weightKg']?.toString(),
      bp: vitals['bp']?.toString() ?? json['bp']?.toString(),
      heartRate: vitals['heartRate']?.toString() ?? json['heartRate']?.toString(),
      spo2: vitals['spo2']?.toString() ?? json['spo2']?.toString(),
      status: json['status'] ?? 'Scheduled',
    );
  }

  /// ✅ CopyWith for immutability
  AppointmentDraft copyWith({
    String? id,
    String? clientName,
    String? appointmentType,
    DateTime? date,
    TimeOfDay? time,
    String? location,
    String? notes,
    String? gender,
    String? patientId,
    String? phoneNumber,
    String? mode,
    String? priority,
    int? durationMinutes,
    bool? reminder,
    String? chiefComplaint,
    String? heightCm,
    String? weightKg,
    String? bp,
    String? heartRate,
    String? spo2,
    String? status,
  }) {
    return AppointmentDraft(
      id: id ?? this.id,
      clientName: clientName ?? this.clientName,
      appointmentType: appointmentType ?? this.appointmentType,
      date: date ?? this.date,
      time: time ?? this.time,
      location: location ?? this.location,
      notes: notes ?? this.notes,
      gender: gender ?? this.gender,
      patientId: patientId ?? this.patientId,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      mode: mode ?? this.mode,
      priority: priority ?? this.priority,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      reminder: reminder ?? this.reminder,
      chiefComplaint: chiefComplaint ?? this.chiefComplaint,
      heightCm: heightCm ?? this.heightCm,
      weightKg: weightKg ?? this.weightKg,
      bp: bp ?? this.bp,
      heartRate: heartRate ?? this.heartRate,
      spo2: spo2 ?? this.spo2,
      status: status ?? this.status,
    );
  }
}
