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
  Map<String, dynamic> toJson() {
    // Combine date and time into startAt
    final startAt = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    return {
      '_id': id,
      'patientId': patientId,
      'appointmentType': appointmentType,
      'startAt': startAt.toIso8601String(),
      'location': location,
      'status': status,
      'notes': notes,
      // Send vitals as nested object
      'vitals': {
        if (heightCm != null && heightCm!.isNotEmpty) 'heightCm': heightCm,
        if (weightKg != null && weightKg!.isNotEmpty) 'weightKg': weightKg,
        if (bp != null && bp!.isNotEmpty) 'bp': bp,
        if (heartRate != null && heartRate!.isNotEmpty) 'heartRate': heartRate,
        if (spo2 != null && spo2!.isNotEmpty) 'spo2': spo2,
      },
      // Send metadata as nested object
      'metadata': {
        'mode': mode,
        'priority': priority,
        'durationMinutes': durationMinutes,
        'reminder': reminder,
        'chiefComplaint': chiefComplaint,
        if (gender != null) 'gender': gender,
        if (phoneNumber != null && phoneNumber!.isNotEmpty) 'phoneNumber': phoneNumber,
      },
    };
  }

  /// ✅ JSON → model
  factory AppointmentDraft.fromJson(Map<String, dynamic> json) {
    // Parse date and time from startAt or separate fields
    DateTime appointmentDate = DateTime.now();
    TimeOfDay appointmentTime = TimeOfDay.now();

    if (json['startAt'] != null) {
      // Backend sends startAt as ISO date string
      final startAt = DateTime.tryParse(json['startAt'].toString());
      if (startAt != null) {
        appointmentDate = startAt;
        appointmentTime = TimeOfDay(hour: startAt.hour, minute: startAt.minute);
      }
    } else {
      // Fallback to separate date/time fields
      if (json['date'] != null) {
        appointmentDate = DateTime.tryParse(json['date'].toString()) ?? DateTime.now();
      }
      if (json['time'] != null) {
        final timeParts = json['time'].toString().split(':');
        appointmentTime = TimeOfDay(
          hour: int.tryParse(timeParts[0]) ?? 0,
          minute: int.tryParse(timeParts.length > 1 ? timeParts[1] : '0') ?? 0,
        );
      }
    }

    // Extract patient info
    String clientName = '';
    String? patientIdStr;
    String? phone;
    String? gender;

    if (json['patientId'] is Map) {
      final patient = json['patientId'] as Map;
      patientIdStr = patient['_id']?.toString();
      final firstName = patient['firstName']?.toString() ?? '';
      final lastName = patient['lastName']?.toString() ?? '';
      clientName = '$firstName $lastName'.trim();
      phone = patient['phone']?.toString();
      gender = patient['gender']?.toString();
    } else if (json['patientId'] is String) {
      patientIdStr = json['patientId'];
      clientName = json['clientName'] ?? '';
    }

    // Extract metadata
    final metadata = json['metadata'] ?? {};
    
    // vitals can come nested or flat
    final vitals = json['vitals'] ?? {};

    return AppointmentDraft(
      id: json['_id']?.toString(),
      clientName: clientName.isNotEmpty ? clientName : (json['clientName'] ?? ''),
      appointmentType: json['appointmentType'] ?? 'Consultation',
      date: appointmentDate,
      time: appointmentTime,
      location: json['location'] ?? '',
      notes: json['notes']?.toString() ?? '',
      gender: metadata['gender']?.toString() ?? gender,
      patientId: patientIdStr,
      phoneNumber: metadata['phoneNumber']?.toString() ?? phone,
      mode: metadata['mode']?.toString() ?? json['mode']?.toString() ?? 'In-clinic',
      priority: metadata['priority']?.toString() ?? json['priority']?.toString() ?? 'Normal',
      durationMinutes: metadata['durationMinutes'] ?? json['durationMinutes'] ?? 20,
      reminder: metadata['reminder'] ?? json['reminder'] ?? true,
      chiefComplaint: metadata['chiefComplaint']?.toString() ?? json['chiefComplaint']?.toString() ?? '',
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
