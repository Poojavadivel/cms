// lib/screens/patients/patients_screen.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../Models/Patients.dart' show PatientDetails; // backend model (adjust path if needed)
import '../../Utils/Colors.dart';
import '../Doctor/widgets/doctor_appointment_preview.dart';
import 'Widgets/generic_data_table.dart';

// New imports (adjust paths if needed)
import '../../Services/Authservices.dart';
import '../../Services/ReportService.dart';
import 'Widgets/enterprise_patient_form.dart'; // New enterprise form

// ---------------------------------------------------------------------
// --- Data Models (view-layer lightweight model used by this screen) ---
// ---------------------------------------------------------------------
class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String lastVisit;
  final String doctor;
  final String condition;
  final String reason;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.lastVisit,
    required this.doctor,
    required this.condition,
    required this.reason,
  });

  /// Construct from a raw Map (API document)
  factory Patient.fromMap(Map<String, dynamic> map) {
    // derive a display name:
    String name = '';
    final rawName = (map['name'] ?? '').toString();
    if (rawName.trim().isNotEmpty) {
      name = rawName.trim();
    } else {
      // fallback to firstName + lastName
      final fn = (map['firstName'] ?? '').toString().trim();
      final ln = (map['lastName'] ?? '').toString().trim();
      name = (fn + (ln.isNotEmpty ? ' $ln' : '')).trim();
    }

    // lastVisit may be stored as lastVisitDate or lastVisit
    String lastVisit = '';
    if (map['lastVisit'] != null) {
      lastVisit = map['lastVisit'].toString();
    } else if (map['lastVisitDate'] != null) {
      lastVisit = map['lastVisitDate'].toString();
    } else if (map['updatedAt'] != null) {
      lastVisit = map['updatedAt'].toString();
    }

    // doctor field could be doctorId or assignedDoctor or nested object
    String doctor = '';
    if (map['doctor'] != null) {
      final raw = map['doctor'];
      if (raw is Map && raw.containsKey('name')) {
        doctor = raw['name']?.toString() ?? '';
      } else {
        doctor = raw.toString();
      }
    } else if (map['assignedDoctor'] != null) {
      doctor = map['assignedDoctor'].toString();
    } else if (map['doctorId'] != null) {
      doctor = map['doctorId'].toString();
    } else if (map['doctorName'] != null) {
      doctor = map['doctorName'].toString();
    }

    // Extract condition from multiple possible sources
    String condition = '';
    if (map['condition'] != null && map['condition'].toString().trim().isNotEmpty) {
      condition = map['condition'].toString().trim();
    } else if (map['medicalHistory'] is List && (map['medicalHistory'] as List).isNotEmpty) {
      final history = map['medicalHistory'] as List;
      if (history.length == 1) {
        condition = history.first.toString();
      } else {
        condition = '${history.first} +${history.length - 1}';
      }
    } else if (map['metadata'] is Map) {
      final meta = map['metadata'] as Map;
      if (meta['medicalHistory'] is List && (meta['medicalHistory'] as List).isNotEmpty) {
        final history = meta['medicalHistory'] as List;
        if (history.length == 1) {
          condition = history.first.toString();
        } else {
          condition = '${history.first} +${history.length - 1}';
        }
      } else if (meta['condition'] != null && meta['condition'].toString().trim().isNotEmpty) {
        condition = meta['condition'].toString().trim();
      }
    }
    
    // Fallback to notes if still empty
    if (condition.isEmpty && map['notes'] != null && map['notes'].toString().trim().isNotEmpty) {
      final notes = map['notes'].toString().trim();
      condition = notes.length > 30 ? '${notes.substring(0, 30)}...' : notes;
    }
    
    // Final fallback
    if (condition.isEmpty) {
      condition = 'N/A';
    }

    return Patient(
      id: (map['_id'] ?? map['id'] ?? map['patientId'] ?? '').toString(),
      name: name,
      age: (map['age'] is int)
          ? map['age'] as int
          : int.tryParse((map['age'] ?? '').toString()) ?? 0,
      gender: (map['gender'] ?? '').toString(),
      lastVisit: lastVisit,
      doctor: doctor,
      condition: condition,
      reason: (map['reason'] ?? '').toString(),
    );
  }

  /// convenience converter from PatientDetails (backend model) -> view model
  factory Patient.fromDetails(PatientDetails d) {
    // derive a display name
    final name = (d.name.isNotEmpty)
        ? d.name
        : ('${d.firstName ?? ''}${(d.lastName ?? '').isNotEmpty ? ' ${d.lastName}' : ''}')
        .trim();

    // get doctor display string safely
    final docStr = patientDisplayDoctorFromDetails(d);

    // Extract condition from medical history (take first item or join multiple)
    String condition = '';
    if (d.medicalHistory.isNotEmpty) {
      // If there's only one condition, show it; otherwise show first with count
      if (d.medicalHistory.length == 1) {
        condition = d.medicalHistory.first;
      } else {
        condition = '${d.medicalHistory.first} +${d.medicalHistory.length - 1}';
      }
    } else if (d.notes.isNotEmpty) {
      // Fallback to notes if no medical history
      condition = d.notes.length > 30 ? '${d.notes.substring(0, 30)}...' : d.notes;
    } else {
      condition = 'N/A';
    }

    return Patient(
      id: d.patientId,
      name: name.isNotEmpty ? name : 'Unknown',
      age: d.age,
      // PatientDetails.gender is a String in your model
      gender: d.gender.isNotEmpty ? d.gender : 'Other',
      lastVisit: d.lastVisitDate.isNotEmpty ? d.lastVisitDate : '',
      doctor: docStr,
      condition: condition,
      reason: '',
    );
  }
}

/// Safely derive a doctor display name from PatientDetails.
/// Priority: typed doctor -> doctorName -> doctorId -> ''
String patientDisplayDoctorFromDetails(PatientDetails d) {
  try {
    final dynamic docRaw = (d as dynamic).doctor;
    if (docRaw != null) {
      if (docRaw is Map) {
        final n = (docRaw['name'] ?? docRaw['fullName'] ?? '').toString();
        if (n.trim().isNotEmpty) return n.trim();
      } else {
        try {
          final userProfile = docRaw.userProfile;
          if (userProfile != null) {
            final parts = <String>[];
            try {
              final fn = userProfile.firstName ?? '';
              final ln = userProfile.lastName ?? '';
              if (fn.toString().trim().isNotEmpty) parts.add(fn.toString().trim());
              if (ln.toString().trim().isNotEmpty) parts.add(ln.toString().trim());
            } catch (_) {}
            try {
              final combined = userProfile.toMap()['name']?.toString();
              if (combined != null && combined.trim().isNotEmpty) return combined.trim();
            } catch (_) {}
            if (parts.isNotEmpty) return parts.join(' ');
          }
        } catch (_) {
          final s = docRaw.toString();
          if (s.trim().isNotEmpty) return s.trim();
        }
      }
    }
  } catch (_) {}

  try {
    final name = (d as dynamic).doctorName;
    if (name != null && name.toString().trim().isNotEmpty) return name.toString().trim();
  } catch (_) {}

  try {
    final id = d.doctorId;
    if (id.isNotEmpty) return id;
  } catch (_) {}

  return '';
}

// ---------------------------------------------------------------------

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  List<Patient> _allPatients = [];
  // Keep the raw PatientDetails objects keyed by patientId for preview/edit usage:
  final Map<String, PatientDetails> _detailsById = {};
  bool _isLoading = true;
  bool _isDownloading = false;
  String _searchQuery = '';
  int _currentPage = 0;
  String _doctorFilter = 'All';
  final ReportService _reportService = ReportService();

  @override
  void initState() {
    super.initState();
    _fetchPatients();
  }

  Future<void> _fetchPatients() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // fetch via AuthService (expects List<PatientDetails>)
      final details = await AuthService.instance.fetchPatients(forceRefresh: true);

      // fill map and view list
      final mapped = <Patient>[];
      final tempMap = <String, PatientDetails>{};
      for (final d in details) {
        tempMap[d.patientId] = d;
        mapped.add(Patient.fromDetails(d));
      }

      if (mounted) {
        setState(() {
          _allPatients = mapped;
          _detailsById.clear();
          _detailsById.addAll(tempMap);
        });
      }
    } catch (e, st) {
      debugPrint('Failed to fetch patients: $e\n$st');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load patients')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _onAddPressed() async {
    // show EnterprisePatientForm which returns PatientDetails on success
    final created = await showDialog<dynamic>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        backgroundColor: Colors.transparent,
        child: EnterprisePatientForm(), // New enterprise-grade form
      ),
    );

    if (created != null) {
      // Try to refresh with new list
      await _fetchPatients();
      if (mounted) {
        final addedName = (created is PatientDetails)
            ? created.name
            : ((created is Map ? (created['name'] ?? created['firstName'] ?? 'added') : 'added'));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Patient $addedName added successfully')),
        );
      }
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() {
    if (_currentPage > 0) setState(() => _currentPage--);
  }

  void _onView(int index, List<Patient> list) {
    final patient = list[index];
    final details = _detailsById[patient.id];
    if (details != null) {
      DoctorAppointmentPreview.show(
        context, 
        details,
        showBillingTab: true, // Show billing tab in Admin module
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Patient details not available')),
      );
    }
  }

  Future<void> _onEdit(int index, List<Patient> list) async {
    final patient = list[index];
    final details = _detailsById[patient.id];
    if (details == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Patient details not available for editing')));
      return;
    }

    // open the enterprise patient form in edit mode
    final result = await showDialog<dynamic>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        backgroundColor: Colors.transparent,
        child: EnterprisePatientForm(initial: details), // New enterprise form
      ),
    );

    // If result is returned (updated PatientDetails), refresh list and notify user
    if (result != null) {
      await _fetchPatients();
      if (mounted) {
        final updatedName = (result is PatientDetails) ? result.name : patient.name;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Updated $updatedName')));
      }
    }
  }

  Future<void> _onDelete(int index, List<Patient> list) async {
    final patient = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete ${patient.name}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      // call AuthService.deletePatient(id)
      final ok = await AuthService.instance.deletePatient(patient.id);
      if (ok) {
        // refresh local list
        await _fetchPatients();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted ${patient.name}')));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete ${patient.name}')));
        }
      }
    } catch (e) {
      debugPrint('Error deleting patient: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deleting ${patient.name}')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Download patient report
  Future<void> _onDownloadReport(int index, List<Patient> paginatedPatients) async {
    if (index < 0 || index >= paginatedPatients.length) return;
    
    final patient = paginatedPatients[index];
    
    setState(() => _isDownloading = true);
    
    try {
      final result = await _reportService.downloadPatientReport(patient.id);
      
      if (mounted) {
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Report downloaded successfully'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to download report'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  // Method to get the filtered list of patients
  List<Patient> _getFilteredPatients() {
    final q = _searchQuery.trim().toLowerCase();
    return _allPatients.where((p) {
      final matchesSearch = q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.id.toLowerCase().contains(q) ||
          p.doctor.toLowerCase().contains(q);
      final matchesFilter = _doctorFilter == 'All' || p.doctor == _doctorFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _genderIcon(String gender) {
    String imagePath;
    if (gender.toLowerCase() == 'male') {
      imagePath = 'assets/boyicon.png';
    } else {
      imagePath = 'assets/girlicon.png';
    }
    return SizedBox(
      width: 24,
      height: 24,
      child: Image.asset(imagePath, errorBuilder: (c, e, s) => const Icon(Icons.person, size: 20)),
    );
  }

  // doctor filter popup (computed from current data)
  Widget _buildDoctorFilter() {
    final doctors = {'All', ..._allPatients.map((s) => s.doctor).where((d) => d.isNotEmpty).toSet()};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      onSelected: (String newValue) {
        setState(() {
          _doctorFilter = newValue;
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        return doctors.map((String value) {
          return PopupMenuItem<String>(
            value: value,
            child: Text(value, style: GoogleFonts.inter()),
          );
        }).toList();
      },
    );
  }

  /// Format an ISO-like lastVisit string to a readable date/time.
  /// If parsing fails, returns the original string (safe fallback).
  String formatLastVisit(String raw) {
    if (raw.trim().isEmpty) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      // Desired format: 03/10/2025
      return DateFormat('dd/MM/yyyy').format(dt);
    } catch (e) {
      // If it's not strictly ISO parseable, try a looser parse or return raw
      try {
        final dt = DateTime.tryParse(raw) ?? DateTime.parse(raw);
        return DateFormat('dd/MM/yyyy').format(dt.toLocal());
      } catch (_) {
        return raw;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredPatients();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedPatients = startIndex >= filtered.length ? <Patient>[] : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['NAME', 'AGE', 'GENDER', 'LAST VISIT', 'DOCTOR', 'CONDITION'];
    final rows = paginatedPatients.map((p) {
      return [
        Row(
          children: [
            _genderIcon(p.gender),
            const SizedBox(width: 8),
            Flexible(
              child: Text(p.name,
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
            ),
          ],
        ),
        Text(p.age.toString(),
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        Text(p.gender, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        Text(formatLastVisit(p.lastVisit),
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        Text(p.doctor, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        Text(p.condition, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Patients",
            headers: headers,
            rows: rows,
            searchQuery: _searchQuery,
            onSearchChanged: _onSearchChanged,
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: 10,
            onPreviousPage: _prevPage,
            onNextPage: _nextPage,
            isLoading: _isLoading || _isDownloading,
            onAddPressed: _onAddPressed,
            filters: [_buildDoctorFilter()],
            hideHorizontalScrollbar: true,
            onDownload: (i) => _onDownloadReport(i, paginatedPatients),
            onView: (i) => _onView(i, paginatedPatients),
            onEdit: (i) => _onEdit(i, paginatedPatients),
            onDelete: (i) => _onDelete(i, paginatedPatients),
          ),
        ),
      ),
    );
  }
}
