import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../Models/Patients.dart';
import '../../Services/Authservices.dart'; // AuthService with instance (AuthService.instance)
import '../../Utils/Api_handler.dart';
import '../Admin/widget/generic_data_table.dart';
import 'widgets/doctor_appointment_preview.dart';
import 'widgets/eyeicon.dart'; // update path if needed

// --- Theme Colors (kept from your original file) ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryHoverColor = Color(0xFFDC2626);
const Color backgroundColor = Color(0xFFF9FAFB);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color borderColor = Color(0xFFE5E7EB);
const Color accentLight = Color(0xFFFEE2E2);
const Color accentDark = Color(0xFFB91C1C);

/// ScrollBehavior that hides all scrollbars (vertical & horizontal)
class _NoScrollbarBehavior extends ScrollBehavior {
  const _NoScrollbarBehavior();

  @override
  Widget buildScrollbar(BuildContext context, Widget child, ScrollableDetails details) {
    // Return child directly so no Scrollbar is added.
    return child;
  }

  // For older Flutter versions, also override buildOverscrollIndicator to avoid glow if desired:
  @override
  Widget buildOverscrollIndicator(BuildContext context, Widget child, ScrollableDetails details) {
    return child;
  }
}

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  String _searchQuery = '';
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  String _genderFilter = 'All';

  bool _isLoading = false;
  List<PatientDetails> _currentPageItems = [];
  int _totalItems = 0;

  @override
  void initState() {
    super.initState();
    _loadPage();
  }

  /// Helper: choose asset based on gender
  ImageProvider _placeholderForGender(String? gender) {
    final g = (gender ?? '').toLowerCase();
    if (g == 'male') return const AssetImage('assets/boyicon.png');
    if (g == 'female') return const AssetImage('assets/girlicon.png');
    // fallback
    return const AssetImage('assets/boyicon.png');
  }

  Future<void> _loadPage() async {
    setState(() => _isLoading = true);
    try {
      // If AuthService supports filters/search/pagination, pass them there.
      final patients = await AuthService.instance.fetchDoctorPatients();

      setState(() {
        _currentPageItems = patients;
        _totalItems = patients.length; // if API returns total separately, use that
      });
    } catch (e) {
      debugPrint("❌ Failed to load patients: $e");
      setState(() {
        _currentPageItems = [];
        _totalItems = 0;
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
    _loadPage();
  }

  void _onGenderFilterChanged(String? v) {
    if (v == null) return;
    setState(() {
      _genderFilter = v;
      _currentPage = 0;
    });
    _loadPage();
  }

  void _previousPage() {
    if (_currentPage > 0) {
      setState(() => _currentPage -= 1);
      _loadPage();
    }
  }

  void _nextPage() {
    final totalPages = (_totalItems / _itemsPerPage).ceil();
    if (_currentPage < totalPages - 1) {
      setState(() => _currentPage += 1);
      _loadPage();
    }
  }

  void _showPatientDetails(BuildContext context, PatientDetails p) {
    // Call the preview dialog (no backend call)
    DoctorAppointmentPreview.show(context, p);
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final dt = DateTime.parse(isoDate);
      return DateFormat('dd/MM/yyyy').format(dt);
    } catch (e) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    final headers = [
      'Patient Name',
      'ID', // will show patientCode if available
      'Date of Birth',
      'Gender',
      'Contact No',
      'Last Visit'
    ];

    final filters = <Widget>[
      SizedBox(
        height: 40,
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: _genderFilter,
            items: const [
              DropdownMenuItem(value: 'All', child: Text('All genders')),
              DropdownMenuItem(value: 'Male', child: Text('Male')),
              DropdownMenuItem(value: 'Female', child: Text('Female')),
              DropdownMenuItem(value: 'Other', child: Text('Other')),
            ],
            onChanged: _onGenderFilterChanged,
          ),
        ),
      ),
      const SizedBox(width: 8),
      SizedBox(
        height: 40,
        width: 40,
        child: OutlinedButton(
          style: OutlinedButton.styleFrom(
            padding: EdgeInsets.zero,
            shape: const CircleBorder(),
          ),
          onPressed: () {
            setState(() {
              _genderFilter = 'All';
              _searchQuery = '';
              _currentPage = 0;
            });
            _loadPage();
          },
          child: const Icon(Icons.close, size: 18, color: primaryColor),
        ),
      ),
    ];

    final rows = _currentPageItems.map<List<Widget>>((p) {
      final ImageProvider avatarImage =
      (p.avatarUrl.isNotEmpty) ? NetworkImage(p.avatarUrl) : _placeholderForGender(p.gender);

      // Show patientCode (if provided by backend) else fallback to patientId
      final displayId = (p.patientCode != null && p.patientCode!.isNotEmpty) ? p.patientCode! : p.patientId;

      return [
        Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: avatarImage,
              backgroundColor: Colors.transparent,
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                p.name,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: textPrimaryColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        Text(displayId, style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),
        Text(_formatDate(p.dateOfBirth), style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),
        Text(p.gender, style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),
        Text(p.phone, style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),
        Text(_formatDate(p.lastVisitDate), style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),
      ];
    }).toList();

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        // Wrap the table with a ScrollConfiguration that disables any scrollbar widgets,
        // this hides both vertical and horizontal scrollbars on this page.
        child: ScrollConfiguration(
          behavior: const _NoScrollbarBehavior(),
          child: Column(
            children: [
              Expanded(
                child: GenericDataTable(
                  title: 'Patients',
                  headers: headers,
                  rows: rows,
                  searchQuery: _searchQuery,
                  onSearchChanged: _onSearchChanged,
                  currentPage: _currentPage,
                  totalItems: _totalItems,
                  itemsPerPage: _itemsPerPage,
                  onPreviousPage: _previousPage,
                  onNextPage: _nextPage,
                  isLoading: _isLoading,
                  filters: filters,
                  onView: (rowIndex) {
                    if (rowIndex >= 0 && rowIndex < _currentPageItems.length) {
                      _showPatientDetails(context, _currentPageItems[rowIndex]);
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
