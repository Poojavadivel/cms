import 'package:flutter/material.dart';

class AppointmentDraft {
  final String clientName;
  final String appointmentType;
  final DateTime date;
  final TimeOfDay time;
  final String location;
  final String notes;

  /// 👇 Gender is now optional (nullable)
  final String? gender;

  // Enterprise extras
  final String? patientId;
  final String? phoneNumber;
  final String mode; // In-clinic / Telehealth
  final String priority; // Normal / Urgent / Emergency
  final int durationMinutes; // 15 / 20 / 30 / 45 / 60
  final bool reminder; // push/email/sms later
  final String chiefComplaint; // reason for visit

  // quick vitals (optional)
  final String? heightCm;
  final String? weightKg;
  final String? bp;
  final String? heartRate;
  final String? spo2;

  AppointmentDraft({
    required this.clientName,
    required this.appointmentType,
    required this.date,
    required this.time,
    required this.location,
    required this.notes,
    this.gender, // 👈 optional
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
  });

  DateTime get dateTime =>
      DateTime(date.year, date.month, date.day, time.hour, time.minute);

  Map<String, dynamic> toJson() => {
    'clientName': clientName,
    'appointmentType': appointmentType,
    'date': date.toIso8601String().split('T').first,
    'time':
    '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
    'location': location,
    'notes': notes,
    'gender': gender, // 👈 included, may be null
    'patientId': patientId,
    'phoneNumber': phoneNumber,
    'mode': mode,
    'priority': priority,
    'durationMinutes': durationMinutes,
    'reminder': reminder,
    'chiefComplaint': chiefComplaint,
    'vitals': {
      'heightCm': heightCm,
      'weightKg': weightKg,
      'bp': bp,
      'heartRate': heartRate,
      'spo2': spo2,
    },
  };
}
