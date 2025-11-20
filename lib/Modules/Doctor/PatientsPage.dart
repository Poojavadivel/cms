import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../Models/Patients.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'widgets/doctor_appointment_preview.dart';
import 'widgets/patient_followup_popup.dart';

/// Enterprise-Grade Patients Page - EXACT UI MATCH to Appointments Table
class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  bool _isLoading = false;
  List<PatientDetails> _patients = [];
  List<PatientDetails> _filteredPatients = [];

  String _searchQuery = '';
  int _currentPage = 0;
  int _itemsPerPage = 10;
  final List<int> _pageSizeOptions = [10, 25, 50, 100];

  String _sortColumn = 'name';
  bool _sortAscending = true;

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  Future<void> _loadPatients() async {
    setState(() => _isLoading = true);

    try {
      final patients = await AuthService.instance.fetchDoctorPatients();

      if (mounted) {
        setState(() {
          _patients = patients;
          _applyFiltersAndSort();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load patients: $e'),
            backgroundColor: AppColors.kDanger,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _applyFiltersAndSort() {
    if (_searchQuery.isEmpty) {
      _filteredPatients = List.from(_patients);
    } else {
      _filteredPatients = _patients
          .where((patient) =>
              patient.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              (patient.patientCode?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
              patient.phone.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }

    _sortPatients(_sortColumn);
    _currentPage = 0;
  }

  void _filterPatients(String query) {
    setState(() {
      _searchQuery = query;
      _applyFiltersAndSort();
    });
  }

  void _sortPatients(String column) {
    setState(() {
      if (_sortColumn == column) {
        _sortAscending = !_sortAscending;
      } else {
        _sortColumn = column;
        _sortAscending = true;
      }

      _filteredPatients.sort((a, b) {
        int comparison = 0;
        switch (column) {
          case 'name':
            comparison = a.name.compareTo(b.name);
            break;
          case 'age':
            comparison = a.age.compareTo(b.age);
            break;
          case 'gender':
            comparison = a.gender.compareTo(b.gender);
            break;
          case 'phone':
            comparison = a.phone.compareTo(b.phone);
            break;
          case 'lastVisit':
            comparison = a.lastVisitDate.compareTo(b.lastVisitDate);
            break;
        }
        return _sortAscending ? comparison : -comparison;
      });
    });
  }

  List<PatientDetails> get _paginatedPatients {
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = startIndex + _itemsPerPage;
    if (startIndex >= _filteredPatients.length) return [];
    return _filteredPatients.sublist(
      startIndex,
      endIndex.clamp(0, _filteredPatients.length),
    );
  }

  int get _totalPages => (_filteredPatients.length / _itemsPerPage).ceil();

  void _showPatientDetails(PatientDetails patient) {
    DoctorAppointmentPreview.show(
      context, 
      patient,
      showBillingTab: false, // Hide billing tab in Doctor module
    );
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '—';
    try {
      final dt = DateTime.parse(isoDate);
      return DateFormat('dd MMM').format(dt);
    } catch (e) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // EXACT MATCH: Controls like appointments
              _PatientsTableControls(
                searchQuery: _searchQuery,
                onSearchChanged: (query) {
                  setState(() => _searchQuery = query);
                  _applyFiltersAndSort();
                },
                onRefresh: _loadPatients,
              ),
              const SizedBox(height: 16),

              // Stats Summary Bar
              _buildStatsBar(),

              const SizedBox(height: 16),

              // Table
              Expanded(
                child: _PatientsDataView(
                  patients: _isLoading ? [] : _paginatedPatients,
                  onShowPatientDetails: _showPatientDetails,
                  sortColumn: _sortColumn,
                  sortAscending: _sortAscending,
                  onSort: (column) => _sortPatients(column),
                  onRefresh: _loadPatients,
                ),
              ),
              const SizedBox(height: 16),

              // Enhanced Pagination (exact match to appointments)
              _EnhancedPaginationControls(
                currentPage: _currentPage,
                itemsPerPage: _itemsPerPage,
                totalItems: _filteredPatients.length,
                onPrevious: () {
                  if (_currentPage > 0) {
                    setState(() => _currentPage--);
                  }
                },
                onNext: () {
                  if (_currentPage < _totalPages - 1) {
                    setState(() => _currentPage++);
                  }
                },
                pageSizeOptions: _pageSizeOptions,
                onPageSizeChanged: (size) {
                  setState(() => _itemsPerPage = size);
                },
                onJumpToPage: (page) {
                  setState(() => _currentPage = page);
                },
              ),
            ],
          ),
        ),

        // Skeleton Loading Overlay - Premium Enterprise Design (EXACT MATCH)
        if (_isLoading)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.98),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.only(left: 24, right: 24, top: 24, bottom: 12),
                      itemCount: 7,
                      itemBuilder: (context, index) => _buildSkeletonRow(),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          height: 48,
                          width: 48,
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Fetching Patients',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.kTextPrimary,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Please wait while we load your data...',
                          style: GoogleFonts.roboto(
                            fontSize: 13,
                            fontWeight: FontWeight.w400,
                            color: AppColors.kTextSecondary,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildSkeletonRow() {
    return Container(
      height: 72,
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.grey200,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppColors.grey200.withOpacity(0.6),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.grey300,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 4),

          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  height: 14,
                  width: 140,
                  decoration: BoxDecoration(
                    color: AppColors.grey300,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 11,
                  width: 100,
                  decoration: BoxDecoration(
                    color: AppColors.grey300,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          ),

          ...List.generate(4, (i) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Container(
                  height: 14,
                  decoration: BoxDecoration(
                    color: AppColors.grey300,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            );
          }),

          Padding(
            padding: const EdgeInsets.all(12),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.grey300,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsBar() {
    final total = _patients.length;
    final male = _patients.where((p) => p.gender.toLowerCase() == 'male').length;
    final female = _patients.where((p) => p.gender.toLowerCase() == 'female').length;
    final today = _patients.where((p) {
      try {
        final lastVisit = DateTime.parse(p.lastVisitDate);
        final now = DateTime.now();
        return lastVisit.year == now.year &&
            lastVisit.month == now.month &&
            lastVisit.day == now.day;
      } catch (e) {
        return false;
      }
    }).length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.06),
            AppColors.accentPink.withOpacity(0.06),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.15),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
            spreadRadius: 1,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Expanded(
            child: _StatItem(
              icon: Iconsax.profile_2user,
              label: 'Total',
              value: total.toString(),
              color: AppColors.primary,
            ),
          ),
          Container(
            width: 1,
            height: 50,
            color: AppColors.grey200,
            margin: const EdgeInsets.symmetric(horizontal: 16),
          ),
          Expanded(
            child: _StatItem(
              icon: Iconsax.man,
              label: 'Male',
              value: male.toString(),
              color: AppColors.kInfo,
            ),
          ),
          Container(
            width: 1,
            height: 50,
            color: AppColors.grey200,
            margin: const EdgeInsets.symmetric(horizontal: 16),
          ),
          Expanded(
            child: _StatItem(
              icon: Iconsax.woman,
              label: 'Female',
              value: female.toString(),
              color: AppColors.accentPink,
            ),
          ),
          Container(
            width: 1,
            height: 50,
            color: AppColors.grey200,
            margin: const EdgeInsets.symmetric(horizontal: 16),
          ),
          Expanded(
            child: _StatItem(
              icon: Iconsax.activity,
              label: 'Today',
              value: today.toString(),
              color: AppColors.kSuccess,
            ),
          ),
        ],
      ),
    );
  }
}

// --- Stats Item Widget (EXACT MATCH) ---
class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: color.withOpacity(0.2),
              width: 1.5,
            ),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(width: 14),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppColors.kTextSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  color: AppColors.kTextPrimary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                  height: 1.2,
                ),
                overflow: TextOverflow.visible,
                maxLines: 1,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// --- Top controls (EXACT MATCH to appointments) ---
class _PatientsTableControls extends StatelessWidget {
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onRefresh;

  const _PatientsTableControls({
    required this.searchQuery,
    required this.onSearchChanged,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Text(
              'PATIENTS',
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.appointmentsHeader,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(width: 24),

            Expanded(
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.3),
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.white,
                ),
                child: Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 12),
                      child: Icon(
                        Iconsax.search_normal_1,
                        color: AppColors.primary,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 8),

                    Expanded(
                      child: TextField(
                        onChanged: onSearchChanged,
                        cursorColor: AppColors.primary,
                        style: GoogleFonts.roboto(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppColors.kTextPrimary,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Search patients...',
                          hintStyle: GoogleFonts.roboto(
                            fontSize: 13,
                            color: AppColors.kTextSecondary,
                            fontWeight: FontWeight.w400,
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                        ),
                      ),
                    ),

                    if (searchQuery.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(right: 4),
                        child: IconButton(
                          icon: Icon(
                            Icons.close,
                            color: AppColors.primary,
                            size: 18,
                          ),
                          onPressed: () => onSearchChanged(''),
                          constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                          tooltip: 'Clear',
                        ),
                      ),

                    Container(
                      width: 1,
                      height: 24,
                      color: AppColors.primary.withOpacity(0.2),
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                    ),

                    IconButton(
                      onPressed: onRefresh,
                      icon: Icon(
                        Iconsax.refresh,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                      tooltip: 'Refresh',
                      padding: const EdgeInsets.only(right: 8),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

// --- Table view (EXACT MATCH to appointments) ---
class _PatientsDataView extends StatelessWidget {
  final List<PatientDetails> patients;
  final void Function(PatientDetails) onShowPatientDetails;
  final String sortColumn;
  final bool sortAscending;
  final Function(String) onSort;
  final VoidCallback onRefresh;

  const _PatientsDataView({
    required this.patients,
    required this.onShowPatientDetails,
    required this.sortColumn,
    required this.sortAscending,
    required this.onSort,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.grey200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          // Header
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withOpacity(0.10),
                  AppColors.accentPink.withOpacity(0.10),
                ],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
              border: Border(
                bottom: BorderSide(
                  color: AppColors.primary.withOpacity(0.15),
                  width: 2,
                ),
              ),
            ),
            child: Row(
              children: [
                _buildSortableHeader('Patient Name', 'name', flex: 2),
                _buildSortableHeader('Age', 'age', flex: 1),
                _buildSortableHeader('Gender', 'gender', flex: 1),
                _buildSortableHeader('Phone', 'phone', flex: 2),
                _buildSortableHeader('Last Visit', 'lastVisit', flex: 1),
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                    child: Text(
                      'Actions',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        color: AppColors.tableHeader,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Body
          Expanded(
            child: patients.isEmpty
                ? _buildEmptyState()
                : RawScrollbar(
                    thumbColor: AppColors.primary.withOpacity(0.3),
                    radius: const Radius.circular(6),
                    thickness: 8,
                    child: ListView.builder(
                      itemCount: patients.length,
                      padding: const EdgeInsets.only(right: 4),
                      itemBuilder: (context, index) {
                        return _buildRow(context, patients[index], index);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortableHeader(String title, String column, {int flex = 1}) {
    return Expanded(
      flex: flex,
      child: InkWell(
        onTap: () => onSort(column),
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  title,
                  style: GoogleFonts.roboto(
                    fontWeight: FontWeight.w700,
                    color: AppColors.tableHeader,
                    fontSize: 12.5,
                    letterSpacing: 0.6,
                    height: 1.4,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(width: 6),
              Icon(
                sortColumn == column
                    ? (sortAscending ? Iconsax.arrow_up_3 : Iconsax.arrow_down_1)
                    : Iconsax.arrow_3,
                size: 14,
                color: sortColumn == column ? AppColors.primary : AppColors.kTextSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Iconsax.profile_remove,
                size: 72,
                color: AppColors.primary.withOpacity(0.4),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No patients found',
              style: GoogleFonts.poppins(
                fontSize: 18,
                color: AppColors.kTextPrimary,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Try adjusting your search or filters',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.kTextSecondary,
                letterSpacing: 0.2,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(BuildContext context, PatientDetails patient, int index) {
    return InkWell(
      onTap: () => onShowPatientDetails(patient),
      hoverColor: AppColors.primary.withOpacity(0.03),
      splashColor: AppColors.primary.withOpacity(0.06),
      child: Container(
        decoration: BoxDecoration(
          color: index.isEven ? Colors.white : AppColors.grey50.withOpacity(0.5),
          border: Border(
            bottom: BorderSide(
              color: AppColors.grey200.withOpacity(0.6),
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            // Patient Name
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                child: Row(
                  children: [
                    _buildAvatar(patient),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            patient.name,
                            style: GoogleFonts.roboto(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                              color: AppColors.kTextPrimary,
                              letterSpacing: 0.25,
                              height: 1.4,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                          const SizedBox(height: 3),
                          Text(
                            (patient.patientCode != null && patient.patientCode!.isNotEmpty)
                                ? patient.patientCode!
                                : 'ID: ${patient.patientId}',
                            style: GoogleFonts.roboto(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: AppColors.kTextSecondary,
                              letterSpacing: 0.25,
                              height: 1.3,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Age
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                child: Center(
                  child: Text(
                    patient.age.toString(),
                    style: GoogleFonts.roboto(
                      fontSize: 13,
                      color: AppColors.kTextPrimary,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.25,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ),
            ),

            // Gender
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      patient.gender.toLowerCase() == 'male' ? Iconsax.man : Iconsax.woman,
                      size: 16,
                      color: patient.gender.toLowerCase() == 'male'
                          ? AppColors.kInfo
                          : AppColors.accentPink,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        patient.gender,
                        style: GoogleFonts.roboto(
                          fontSize: 13,
                          color: AppColors.kTextPrimary,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.25,
                          height: 1.5,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Phone
            _buildCell(patient.phone.isNotEmpty ? patient.phone : '—', flex: 2),

            // Last Visit
            _buildCell(_formatDate(patient.lastVisitDate), flex: 1),

            // Actions
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildIconButton(
                      icon: Iconsax.eye,
                      color: AppColors.kInfo,
                      tooltip: 'View',
                      onPressed: () => onShowPatientDetails(patient),
                    ),
                    const SizedBox(width: 8),
                    _buildIconButton(
                      icon: Iconsax.calendar_tick,
                      color: AppColors.kSuccess,
                      tooltip: 'View Follow-Ups',
                      onPressed: () => _navigateToFollowUps(context, patient),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(PatientDetails patient) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.1),
            AppColors.accentPink.withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.25),
          width: 2.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(0, 3),
            spreadRadius: 1,
          ),
        ],
      ),
      child: ClipOval(
        child: CircleAvatar(
          radius: 20,
          backgroundColor: Colors.transparent,
          backgroundImage: patient.gender.toLowerCase() == 'male'
              ? const AssetImage('assets/boyicon.png')
              : patient.gender.toLowerCase() == 'female'
                  ? const AssetImage('assets/girlicon.png')
                  : (patient.avatarUrl != null && patient.avatarUrl!.isNotEmpty
                      ? NetworkImage(patient.avatarUrl!)
                      : const AssetImage('assets/boyicon.png')) as ImageProvider,
        ),
      ),
    );
  }

  Widget _buildCell(String text, {int flex = 1}) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        child: Text(
          text,
          style: GoogleFonts.roboto(
            fontSize: 13,
            color: AppColors.kTextPrimary,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.25,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          maxLines: 1,
        ),
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    required Color color,
    required String tooltip,
    required VoidCallback onPressed,
  }) {
    return Tooltip(
      message: tooltip,
      textStyle: GoogleFonts.roboto(
        fontSize: 12,
        color: Colors.white,
        fontWeight: FontWeight.w500,
      ),
      decoration: BoxDecoration(
        color: Colors.grey[800],
        borderRadius: BorderRadius.circular(6),
      ),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(6),
        hoverColor: color.withOpacity(0.12),
        child: Container(
          width: 36,
          height: 36,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.09),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: color.withOpacity(0.25),
              width: 1.1,
            ),
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.08),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(
            icon,
            size: 16,
            color: color,
            semanticLabel: tooltip,
          ),
        ),
      ),
    );
  }

  String _formatDate(String? date) {
    if (date == null || date.isEmpty) return '—';
    try {
      final dt = DateTime.parse(date);
      return DateFormat('dd MMM').format(dt);
    } catch (e) {
      return date;
    }
  }

  void _navigateToFollowUps(BuildContext context, PatientDetails patient) {
    PatientFollowUpPopup.show(
      context: context,
      patientId: patient.patientId,
      patientName: patient.name,
    );
  }
}

// --- Enhanced Pagination (EXACT MATCH to appointments) ---
class _EnhancedPaginationControls extends StatelessWidget {
  final int currentPage;
  final int itemsPerPage;
  final int totalItems;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final List<int> pageSizeOptions;
  final Function(int) onPageSizeChanged;
  final Function(int)? onJumpToPage;

  const _EnhancedPaginationControls({
    required this.currentPage,
    required this.itemsPerPage,
    required this.totalItems,
    required this.onPrevious,
    required this.onNext,
    required this.pageSizeOptions,
    required this.onPageSizeChanged,
    this.onJumpToPage,
  });

  @override
  Widget build(BuildContext context) {
    final totalPages = (totalItems / itemsPerPage).ceil().clamp(1, 9999);
    final isFirstPage = currentPage == 0;
    final isLastPage = currentPage >= totalPages - 1;
    final startItem = (currentPage * itemsPerPage) + 1;
    final endItem = ((currentPage + 1) * itemsPerPage).clamp(0, totalItems);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Text(
                'Rows per page:',
                style: GoogleFonts.roboto(
                  fontSize: 12.5,
                  color: AppColors.kTextSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                  height: 1.4,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.grey200,
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: itemsPerPage,
                    isDense: true,
                    items: pageSizeOptions.map((size) {
                      return DropdownMenuItem<int>(
                        value: size,
                        child: Text(
                          size.toString(),
                          style: GoogleFonts.roboto(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) onPageSizeChanged(value);
                    },
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Text(
                'Showing $startItem-$endItem of $totalItems',
                style: GoogleFonts.roboto(
                  fontSize: 12.5,
                  color: AppColors.kTextSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                  height: 1.4,
                ),
              ),
            ],
          ),

          Row(
            children: [
              IconButton(
                onPressed: isFirstPage ? null : () => onJumpToPage?.call(0),
                icon: const Icon(Iconsax.arrow_left_3),
                iconSize: 18,
                color: isFirstPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'First page',
              ),

              IconButton(
                onPressed: isFirstPage ? null : onPrevious,
                icon: const Icon(Iconsax.arrow_left_2),
                iconSize: 18,
                color: isFirstPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Previous page',
              ),

              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.12),
                      AppColors.primary.withOpacity(0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.35),
                    width: 1.5,
                  ),
                ),
                child: Text(
                  'Page ${currentPage + 1} of $totalPages',
                  style: GoogleFonts.roboto(
                    fontSize: 12.5,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(width: 8),

              IconButton(
                onPressed: isLastPage ? null : onNext,
                icon: const Icon(Iconsax.arrow_right_3),
                iconSize: 18,
                color: isLastPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Next page',
              ),

              IconButton(
                onPressed: isLastPage ? null : () => onJumpToPage?.call(totalPages - 1),
                icon: const Icon(Iconsax.arrow_right_2),
                iconSize: 18,
                color: isLastPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Last page',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
