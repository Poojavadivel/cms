// lib/Models/staff.dart
import 'package:flutter/foundation.dart';

class Staff {
  // Core identity
  final String id; // e.g. MongoDB _id or UUID
  final String name;
  final String designation; // e.g. "Cardiologist", "Nurse"
  final String department; // e.g. "Cardiology"
  final String patientFacingId; // optional short id shown in UI (DOC102 etc.)

  // Contact / profile
  final String contact; // phone
  final String email;
  final String avatarUrl; // optional network image
  final String gender; // "male" / "female" / "other"

  // Employment / meta
  final String status; // "Available", "On Leave", "Off Duty", etc.
  final String shift; // "Morning", "Night", "Flexible"
  final List<String> roles; // e.g. ["doctor","supervisor"]
  final List<String> qualifications; // e.g. ["MBBS", "MD Cardiology"]
  final int experienceYears; // professional experience
  final DateTime? joinedAt;
  final DateTime? lastActiveAt;

  // Optional profile details
  final String location; // branch / clinic location
  final String dob; // date-of-birth string (ISO or display)
  final Map<String, String> notes; // small key:value notes (e.g., {"allergy":"penicillin"})

  // Counts / relations
  final int appointmentsCount; // cached count to show in UI
  final List<String> tags; // quick filters like ["senior","on-call"]

  // UI helper (mutable-ish for selection states; keep as field for convenience)
  bool isSelected;

  Staff({
    required this.id,
    required this.name,
    required this.designation,
    required this.department,
    this.patientFacingId = '',
    this.contact = '',
    this.email = '',
    this.avatarUrl = '',
    this.gender = '',
    this.status = 'Off Duty',
    this.shift = '',
    this.roles = const [],
    this.qualifications = const [],
    this.experienceYears = 0,
    this.joinedAt,
    this.lastActiveAt,
    this.location = '',
    this.dob = '',
    this.notes = const {},
    this.appointmentsCount = 0,
    this.tags = const [],
    this.isSelected = false,
  });

  // ----------------- New: fromMap factory (defensive) -----------------
  /// Create Staff from a plain Map (e.g. API response)
  factory Staff.fromMap(Map<String, dynamic> map) {
    DateTime? parseDate(dynamic v) {
      if (v == null) return null;
      if (v is DateTime) return v;
      try {
        return DateTime.tryParse(v.toString());
      } catch (_) {
        return null;
      }
    }

    Map<String, String> parseNotes(dynamic n) {
      if (n == null) return <String, String>{};
      if (n is Map) {
        try {
          return n.map((k, v) => MapEntry(k.toString(), v?.toString() ?? ''));
        } catch (_) {
          return <String, String>{};
        }
      }
      // if notes is a string, store it under "notes"
      if (n is String) {
        return {'notes': n};
      }
      return <String, String>{};
    }

    List<String> parseStringList(dynamic v) {
      if (v == null) return <String>[];
      if (v is List) return v.map((e) => e.toString()).toList();
      if (v is String) return v.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      return <String>[];
    }

    String _stringFallback(List<dynamic> keys) {
      for (final k in keys) {
        final val = map[k];
        if (val != null) {
          final s = val.toString().trim();
          if (s.isNotEmpty) return s;
        }
      }
      return '';
    }

    // Determine designation with fallback keys; ensure not empty
    final designationValue = _stringFallback(['designation', 'role', 'title']).isNotEmpty
        ? _stringFallback(['designation', 'role', 'title'])
        : '-';

    final contactValue = _stringFallback(['contact', 'phone', 'phoneNumber', 'contactNumber']).isNotEmpty
        ? _stringFallback(['contact', 'phone', 'phoneNumber', 'contactNumber'])
        : '-';

    // parse notes (could be Map or String)
    final parsedNotes = parseNotes(map['notes']);

    // helper to safely extract nested metadata values
    String _metaLookup(Map<String, dynamic>? meta, List<String> keys) {
      if (meta == null) return '';
      for (final k in keys) {
        final v = meta[k];
        if (v != null) {
          final s = v.toString().trim();
          if (s.isNotEmpty) return s;
        }
      }
      return '';
    }

    // Try to find patientFacingId / staff code from multiple places in priority order:
    // 1. top-level patientFacingId or code
    // 2. top-level code or patientFacingId
    // 3. metadata.staffCode / metadata.staff_code / metadata.code / metadata.patientFacingId
    // 4. notes['staffCode'] or notes['code']
    String patientFacingId = '';
    // direct keys
    final directPf = (map['patientFacingId'] ?? map['patientFacing'] ?? map['code'])?.toString().trim() ?? '';
    if (directPf.isNotEmpty) {
      patientFacingId = directPf;
    } else {
      // metadata object may contain staffCode
      final metaRaw = map['metadata'];
      if (metaRaw is Map) {
        patientFacingId = _metaLookup(metaRaw.cast<String, dynamic>(), ['staffCode', 'staff_code', 'code', 'patientFacingId']);
      } else if (map['meta'] is Map) {
        patientFacingId = _metaLookup((map['meta'] as Map).cast<String, dynamic>(), ['staffCode', 'staff_code', 'code', 'patientFacingId']);
      }

      // fallback to notes keys
      if (patientFacingId.isEmpty) {
        final noteCode = (parsedNotes['staffCode'] ?? parsedNotes['staff_code'] ?? parsedNotes['code'])?.toString().trim() ?? '';
        if (noteCode.isNotEmpty) patientFacingId = noteCode;
      }
    }

    // If metadata provided but not mapped to model, fold stringified metadata into notes
    Map<String, String> mergedNotes = Map<String, String>.from(parsedNotes);
    final metaRaw2 = map['metadata'];
    if (metaRaw2 is Map) {
      metaRaw2.forEach((k, v) {
        try {
          final key = 'meta_${k.toString()}';
          if (!mergedNotes.containsKey(key)) {
            mergedNotes[key] = v?.toString() ?? '';
          }
        } catch (_) {}
      });
    }

    // also preserve any top-level unknown fields that are small strings? (avoid huge blobs)
    // (optional) - skip for now to avoid noisy notes.

    return Staff(
      id: map['_id']?.toString() ?? map['id']?.toString() ?? '',
      name: (map['name']?.toString() ?? map['fullName']?.toString() ?? map['firstName']?.toString() ?? '').toString(),
      designation: designationValue,
      department: map['department']?.toString() ?? map['dept']?.toString() ?? '',
      patientFacingId: patientFacingId,
      contact: contactValue,
      email: map['email']?.toString() ?? '',
      avatarUrl: map['avatarUrl']?.toString() ?? map['photo']?.toString() ?? '',
      gender: map['gender']?.toString() ?? '',
      status: map['status']?.toString() ?? 'Off Duty',
      shift: map['shift']?.toString() ?? '',
      roles: parseStringList(map['roles'] ?? (map['metadata'] is Map ? (map['metadata']['roles'] ?? []) : [])),
      qualifications: parseStringList(map['qualifications'] ?? (map['metadata'] is Map ? (map['metadata']['qualifications'] ?? []) : [])),
      experienceYears: int.tryParse((map['experienceYears'] ?? map['metadata']?['experienceYears'] ?? map['experience'] ?? 0).toString()) ?? 0,
      joinedAt: parseDate(map['joinedAt'] ?? map['metadata']?['joinedAt'] ?? map['createdAt']),
      lastActiveAt: parseDate(map['lastActiveAt'] ?? map['metadata']?['lastActiveAt'] ?? map['updatedAt']),
      location: map['location']?.toString() ?? (map['metadata'] is Map ? (map['metadata']['location']?.toString() ?? '') : ''),
      dob: map['dob']?.toString() ?? (map['metadata'] is Map ? (map['metadata']['dob']?.toString() ?? '') : ''),
      notes: mergedNotes,
      appointmentsCount: int.tryParse((map['appointmentsCount'] ?? map['metadata']?['appointmentsCount'] ?? map['apptCount'] ?? 0).toString()) ?? 0,
      tags: parseStringList(map['tags'] ?? (map['metadata'] is Map ? (map['metadata']['tags'] ?? []) : [])),
      isSelected: map['isSelected'] == true,
    );
  }
  // -------------------------------------------------------------------

  /// Backwards-compatible JSON factory
  factory Staff.fromJson(Map<String, dynamic> json) => Staff.fromMap(json);

  /// Convert to JSON for API or local storage
  Map<String, dynamic> toJson() {
    // Put the short code in top-level 'code' and also in 'metadata.staffCode'
    final meta = <String, dynamic>{};
    if (patientFacingId.isNotEmpty) meta['staffCode'] = patientFacingId;

    // If notes contains meta_ keys, move them back to metadata (reverse of fromMap)
    final notesToEmit = <String, String>{};
    notes.forEach((k, v) {
      if (k.startsWith('meta_')) {
        meta[k.substring(5)] = v;
      } else {
        notesToEmit[k] = v;
      }
    });

    return {
      if (id.isNotEmpty) '_id': id,
      'name': name,
      'designation': designation,
      'department': department,
      'code': patientFacingId,
      'contact': contact,
      'email': email,
      'avatarUrl': avatarUrl,
      'gender': gender,
      'status': status,
      'shift': shift,
      'roles': roles,
      'qualifications': qualifications,
      'experienceYears': experienceYears,
      'joinedAt': joinedAt?.toIso8601String(),
      'lastActiveAt': lastActiveAt?.toIso8601String(),
      'location': location,
      'dob': dob,
      'notes': notesToEmit,
      'appointmentsCount': appointmentsCount,
      'tags': tags,
      'isSelected': isSelected,
      'metadata': meta,
    };
  }

  /// Immutable copyWith pattern
  Staff copyWith({
    String? id,
    String? name,
    String? designation,
    String? department,
    String? patientFacingId,
    String? contact,
    String? email,
    String? avatarUrl,
    String? gender,
    String? status,
    String? shift,
    List<String>? roles,
    List<String>? qualifications,
    int? experienceYears,
    DateTime? joinedAt,
    DateTime? lastActiveAt,
    String? location,
    String? dob,
    Map<String, String>? notes,
    int? appointmentsCount,
    List<String>? tags,
    bool? isSelected,
  }) {
    return Staff(
      id: id ?? this.id,
      name: name ?? this.name,
      designation: designation ?? this.designation,
      department: department ?? this.department,
      patientFacingId: patientFacingId ?? this.patientFacingId,
      contact: contact ?? this.contact,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      gender: gender ?? this.gender,
      status: status ?? this.status,
      shift: shift ?? this.shift,
      roles: roles ?? List.from(this.roles),
      qualifications: qualifications ?? List.from(this.qualifications),
      experienceYears: experienceYears ?? this.experienceYears,
      joinedAt: joinedAt ?? this.joinedAt,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
      location: location ?? this.location,
      dob: dob ?? this.dob,
      notes: notes ?? Map.from(this.notes),
      appointmentsCount: appointmentsCount ?? this.appointmentsCount,
      tags: tags ?? List.from(this.tags),
      isSelected: isSelected ?? this.isSelected,
    );
  }

  /// Helpful debug string
  @override
  String toString() {
    return 'Staff(id: $id, name: $name, designation: $designation, department: $department, status: $status)';
  }

  /// Lightweight equality (by id) to help list operations in UI
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Staff && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
