import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../Models/Patients.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'widgets/doctor_appointment_preview.dart';

/// Enterprise-Grade Patients Page
/// - EXACT MATCH to AppointmentsPageNew style
/// - Direct API calls (independent)
/// - Skeleton loading
/// - Enterprise fonts & styling
/// - Male/Female icons
class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  bool _isLoading = false;
  bool _isRefreshing = false;
  List<PatientDetails> _patients = [];
  List<PatientDetails> _filteredPatients = [];
  
  String _searchQuery = '';
  int _currentPage = 0;
  final int _itemsPerPage = 10;
  
  String _sortColumn = 'name';
  bool _sortAscending = true;

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  /// Load patients directly from AuthService
  Future<void> _loadPatients({bool showLoading = true}) async {
    if (showLoading) {
      setState(() => _isLoading = true);
    }
    
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
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
        });
      }
    }
  }

  /// Refresh patients with visual feedback
  Future<void> _refreshPatients() async {
    setState(() => _isRefreshing = true);
    await _loadPatients(showLoading: false);
  }

  /// Apply filters and sorting
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
    showDialog(
      context: context,
      builder: (_) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        child: DoctorAppointmentPreview(patient: patient),
      ),
    );
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '—';
    try {
      final dt = DateTime.parse(isoDate);
      return DateFormat('dd MMM yyyy').format(dt);
    } catch (e) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgGray,
      body: SafeArea(
        child: Column(
          children: [
            // Enterprise Header
            _buildEnterpriseHeader(),
            
            const SizedBox(height: 24),
            
            // Stats Bar
            _buildStatsBar(),
            
            const SizedBox(height: 24),
            
            // Table Content
            Expanded(
              child: _isLoading
                  ? _buildSkeletonLoader()
                  : _buildPatientsTable(),
            ),
          ],
        ),
      ),
    );
  }

  /// Enterprise-grade header with title and search
  Widget _buildEnterpriseHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon + Title + Subtitle
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary,
                  AppColors.primary.withOpacity(0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              Iconsax.profile_2user,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Patients',
                style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                  letterSpacing: -0.5,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Manage all patient records',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: AppColors.textLight,
                  letterSpacing: 0.1,
                ),
              ),
            ],
          ),
          
          const SizedBox(width: 24),
          
          // Extended Search Field with Refresh & Filter icons
          Expanded(
            child: Container(
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.bgGray,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _searchQuery.isNotEmpty
                      ? AppColors.primary.withOpacity(0.3)
                      : AppColors.grey200,
                  width: 1.5,
                ),
              ),
              child: TextField(
                onChanged: _filterPatients,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textDark,
                  letterSpacing: 0.2,
                ),
                decoration: InputDecoration(
                  hintText: 'Search by patient name, code, or phone...',
                  hintStyle: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                    color: AppColors.textLight,
                    letterSpacing: 0.2,
                  ),
                  prefixIcon: Container(
                    padding: const EdgeInsets.all(12),
                    child: Icon(
                      Iconsax.search_normal_1,
                      color: _searchQuery.isNotEmpty
                          ? AppColors.primary
                          : AppColors.textLight,
                      size: 22,
                    ),
                  ),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_searchQuery.isNotEmpty)
                        IconButton(
                          icon: const Icon(Iconsax.close_circle, size: 20),
                          color: AppColors.textLight,
                          onPressed: () => _filterPatients(''),
                          tooltip: 'Clear search',
                        ),
                      // Filter Icon
                      IconButton(
                        onPressed: () {
                          // Add filter functionality here
                        },
                        tooltip: 'Filter',
                        icon: const Icon(
                          Iconsax.filter,
                          size: 22,
                        ),
                        color: AppColors.primary,
                      ),
                      // Refresh Button
                      IconButton(
                        onPressed: _isRefreshing ? null : _refreshPatients,
                        tooltip: 'Refresh patients',
                        icon: Icon(
                          Iconsax.refresh,
                          color: _isRefreshing ? AppColors.textLight : AppColors.primary,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Stats summary bar
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

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.white,
              AppColors.bgGray,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.grey200, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            _buildStatItem(
              icon: Iconsax.profile_2user,
              label: 'Total',
              value: total.toString(),
              color: AppColors.primary,
            ),
            _buildDivider(),
            _buildStatItem(
              icon: Iconsax.man,
              label: 'Male',
              value: male.toString(),
              color: AppColors.kInfo,
            ),
            _buildDivider(),
            _buildStatItem(
              icon: Iconsax.woman,
              label: 'Female',
              value: female.toString(),
              color: AppColors.accentPink,
            ),
            _buildDivider(),
            _buildStatItem(
              icon: Iconsax.activity,
              label: 'Today',
              value: today.toString(),
              color: AppColors.kSuccess,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: color,
                  letterSpacing: -0.5,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textLight,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 50,
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.grey200.withOpacity(0),
            AppColors.grey200,
            AppColors.grey200.withOpacity(0),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
    );
  }

  /// Skeleton loader while fetching data
  Widget _buildSkeletonLoader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            // Header skeleton
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.bgGray,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: List.generate(
                  6,
                  (index) => Expanded(
                    child: Shimmer.fromColors(
                      baseColor: Colors.grey[300]!,
                      highlightColor: Colors.grey[100]!,
                      child: Container(
                        height: 16,
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            
            // Rows skeleton
            Expanded(
              child: ListView.builder(
                itemCount: 10,
                itemBuilder: (context, index) {
                  return Shimmer.fromColors(
                    baseColor: Colors.grey[300]!,
                    highlightColor: Colors.grey[100]!,
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: AppColors.grey200,
                            width: 1,
                          ),
                        ),
                      ),
                      child: Row(
                        children: List.generate(
                          6,
                          (i) => Expanded(
                            child: Container(
                              height: 14,
                              margin: const EdgeInsets.symmetric(horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Main patients table
  Widget _buildPatientsTable() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Table Header
            _buildTableHeader(),
            
            // Table Body
            Expanded(
              child: _paginatedPatients.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      itemCount: _paginatedPatients.length,
                      itemBuilder: (context, index) {
                        final patient = _paginatedPatients[index];
                        return _buildTableRow(patient, index);
                      },
                    ),
            ),
            
            const SizedBox(height: 1),
            
            // Pagination
            _buildPagination(),
          ],
        ),
      ),
    );
  }

  /// Table header with sorting (EXACT MATCH to Appointments)
  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.05),
            AppColors.accentPink.withOpacity(0.05),
          ],
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
        border: Border(
          bottom: BorderSide(
            color: AppColors.grey200,
            width: 1.5,
          ),
        ),
      ),
      child: Row(
        children: [
          _buildHeaderCell('Patient', 'name', flex: 2),
          _buildHeaderCell('Age', 'age', flex: 1),
          _buildHeaderCell('Gender', 'gender', flex: 1),
          _buildHeaderCell('Phone', 'phone', flex: 2),
          _buildHeaderCell('Last Visit', 'lastVisit', flex: 2),
          _buildHeaderCell('Actions', '', flex: 1, sortable: false),
        ],
      ),
    );
  }

  Widget _buildHeaderCell(String label, String column, {int flex = 1, bool sortable = true}) {
    final isSorted = _sortColumn == column;
    
    return Expanded(
      flex: flex,
      child: sortable
          ? InkWell(
              onTap: () => _sortPatients(column),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isSorted ? AppColors.primary : AppColors.textDark,
                      letterSpacing: 0.5,
                    ),
                  ),
                  if (sortable) ...[
                    const SizedBox(width: 4),
                    Icon(
                      isSorted
                          ? (_sortAscending ? Iconsax.arrow_up_3 : Iconsax.arrow_down_1)
                          : Iconsax.arrow_3,
                      size: 16,
                      color: isSorted ? AppColors.primary : AppColors.textLight,
                    ),
                  ],
                ],
              ),
            )
          : Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
                letterSpacing: 0.5,
              ),
            ),
    );
  }

  /// Table row (EXACT MATCH to Appointments structure)
  Widget _buildTableRow(PatientDetails patient, int index) {
    final isEven = index % 2 == 0;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: isEven ? Colors.white : AppColors.bgGray.withOpacity(0.3),
        border: Border(
          bottom: BorderSide(
            color: AppColors.grey200.withOpacity(0.5),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Patient Info (Name + Code)
          Expanded(
            flex: 2,
            child: Row(
              children: [
                // Avatar with Boy/Girl Icon
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary.withOpacity(0.2),
                        AppColors.accentPink.withOpacity(0.2),
                      ],
                    ),
                    border: Border.all(
                      color: AppColors.primary.withOpacity(0.3),
                      width: 2,
                    ),
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      patient.gender.toLowerCase() == 'male'
                          ? 'assets/boyicon.png'
                          : 'assets/girlicon.png',
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        patient.name,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textDark,
                          letterSpacing: 0.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        patient.patientCode?.isNotEmpty == true
                            ? patient.patientCode!
                            : 'N/A',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textLight,
                          letterSpacing: 0.3,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Age
          Expanded(
            flex: 1,
            child: Text(
              '${patient.age} yrs',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textDark,
                letterSpacing: 0.2,
              ),
            ),
          ),
          
          // Gender with icon (separate column)
          Expanded(
            flex: 1,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  patient.gender.toLowerCase() == 'male'
                      ? Iconsax.man
                      : Iconsax.woman,
                  size: 18,
                  color: patient.gender.toLowerCase() == 'male'
                      ? AppColors.kInfo
                      : AppColors.accentPink,
                ),
                const SizedBox(width: 6),
                Text(
                  patient.gender,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textDark,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
          
          // Phone
          Expanded(
            flex: 2,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Iconsax.call,
                  size: 14,
                  color: AppColors.textLight,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    patient.phone.isNotEmpty ? patient.phone : '—',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textDark,
                      letterSpacing: 0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          
          // Last Visit
          Expanded(
            flex: 2,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Iconsax.calendar_1,
                  size: 14,
                  color: AppColors.textLight,
                ),
                const SizedBox(width: 6),
                Text(
                  _formatDate(patient.lastVisitDate),
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textDark,
                    letterSpacing: 0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          
          // Actions
          Expanded(
            flex: 1,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildActionButton(
                  icon: Iconsax.eye,
                  color: AppColors.kInfo,
                  onTap: () => _showPatientDetails(patient),
                  tooltip: 'View Details',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    required String tooltip,
  }) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: color.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.bgGray,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Iconsax.search_normal_1,
              size: 64,
              color: AppColors.textLight,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No patients found',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isNotEmpty
                ? 'Try adjusting your search'
                : 'No patient records yet',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgGray.withOpacity(0.3),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
        border: Border(
          top: BorderSide(
            color: AppColors.grey200,
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Showing ${_currentPage * _itemsPerPage + 1} - '
            '${((_currentPage + 1) * _itemsPerPage).clamp(0, _filteredPatients.length)} '
            'of ${_filteredPatients.length} patients',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textLight,
              letterSpacing: 0.2,
            ),
          ),
          Row(
            children: [
              _buildPaginationButton(
                icon: Iconsax.arrow_left_2,
                onTap: _currentPage > 0
                    ? () => setState(() => _currentPage--)
                    : null,
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Text(
                  '${_currentPage + 1} / $_totalPages',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              _buildPaginationButton(
                icon: Iconsax.arrow_right_3,
                onTap: _currentPage < _totalPages - 1
                    ? () => setState(() => _currentPage++)
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaginationButton({
    required IconData icon,
    required VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: onTap != null ? Colors.white : AppColors.grey200,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: onTap != null
                ? AppColors.grey200
                : AppColors.grey200.withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          size: 16,
          color: onTap != null ? AppColors.textDark : AppColors.textLight,
        ),
      ),
    );
  }
}
