import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:shimmer/shimmer.dart';

import '../../Models/Patients.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'widgets/Addnewappoiments.dart';
import 'widgets/doctor_appointment_preview.dart';
import 'widgets/intakeform.dart';

/// Enterprise-Grade Appointments Page
/// - Direct API calls (independent from dashboard)
/// - Skeleton loading
/// - No checkboxes
/// - Enterprise fonts & styling
/// - Male/Female icons
/// - Enhanced search & header
class AppointmentsPageNew extends StatefulWidget {
  const AppointmentsPageNew({super.key});

  @override
  State<AppointmentsPageNew> createState() => _AppointmentsPageNewState();
}

class _AppointmentsPageNewState extends State<AppointmentsPageNew> {
  bool _isLoading = false;
  bool _isRefreshing = false;
  List<DashboardAppointments> _appointments = [];
  List<DashboardAppointments> _filteredAppointments = [];
  
  String _searchQuery = '';
  int _currentPage = 0;
  final int _itemsPerPage = 10;
  
  String _sortColumn = 'date';
  bool _sortAscending = false;
  
  // Column visibility settings
  Map<String, bool> _columnVisibility = {
    'patient': true,
    'age': true,
    'date': true,
    'time': true,
    'reason': true,
    'status': true,
    'actions': true,
  };

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  /// Load appointments directly from AuthService
  Future<void> _loadAppointments({bool showLoading = true}) async {
    if (showLoading) {
      setState(() => _isLoading = true);
    }
    
    try {
      final appointments = await AuthService.instance.fetchAppointments() ?? [];
      
      if (mounted) {
        setState(() {
          _appointments = appointments;
          _applyFiltersAndSort();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load appointments: $e'),
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

  /// Refresh appointments with visual feedback
  Future<void> _refreshAppointments() async {
    setState(() => _isRefreshing = true);
    await _loadAppointments(showLoading: false);
  }

  /// Apply filters and sorting
  void _applyFiltersAndSort() {
    if (_searchQuery.isEmpty) {
      _filteredAppointments = List.from(_appointments);
    } else {
      _filteredAppointments = _appointments
          .where((appt) =>
              appt.patientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              (appt.patientCode?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
              appt.reason.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }
    
    _sortAppointments(_sortColumn);
    _currentPage = 0;
  }

  void _filterAppointments(String query) {
    setState(() {
      _searchQuery = query;
      _applyFiltersAndSort();
    });
  }

  void _sortAppointments(String column) {
    setState(() {
      if (_sortColumn == column) {
        _sortAscending = !_sortAscending;
      } else {
        _sortColumn = column;
        _sortAscending = true;
      }

      _filteredAppointments.sort((a, b) {
        int comparison = 0;
        switch (column) {
          case 'patient':
            comparison = a.patientName.compareTo(b.patientName);
            break;
          case 'age':
            comparison = a.patientAge.compareTo(b.patientAge);
            break;
          case 'date':
            comparison = a.date.compareTo(b.date);
            break;
          case 'time':
            comparison = a.time.compareTo(b.time);
            break;
          case 'reason':
            comparison = a.reason.compareTo(b.reason);
            break;
          case 'status':
            comparison = a.status.compareTo(b.status);
            break;
        }
        return _sortAscending ? comparison : -comparison;
      });
    });
  }

  List<DashboardAppointments> get _paginatedAppointments {
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = startIndex + _itemsPerPage;
    if (startIndex >= _filteredAppointments.length) return [];
    return _filteredAppointments.sublist(
      startIndex,
      endIndex.clamp(0, _filteredAppointments.length),
    );
  }

  int get _totalPages => (_filteredAppointments.length / _itemsPerPage).ceil();

  PatientDetails _mapApptToPatient(DashboardAppointments appt) {
    return PatientDetails(
      patientId: appt.patientId,
      name: appt.patientName,
      firstName: null,
      lastName: null,
      age: appt.patientAge,
      gender: appt.gender,
      bloodGroup: appt.bloodGroup ?? '',
      weight: appt.weight == 0 ? '' : appt.weight.toString(),
      height: appt.height == 0 ? '' : appt.height.toString(),
      emergencyContactName: '',
      emergencyContactPhone: '',
      phone: '',
      city: appt.location,
      address: appt.location,
      pincode: '',
      insuranceNumber: '',
      expiryDate: '',
      avatarUrl: appt.patientAvatarUrl,
      dateOfBirth: appt.dob,
      lastVisitDate: appt.date,
      doctorId: appt.doctor,
      doctor: null,
      doctorName: appt.doctor,
      medicalHistory: appt.diagnosis,
      allergies: const [],
      notes: appt.currentNotes ?? appt.previousNotes ?? '',
      oxygen: '',
      bmi: appt.bmi == 0.0 ? '' : appt.bmi.toString(),
      isSelected: appt.isSelected,
      patientCode: appt.patientCode,
    );
  }

  void _showAppointmentDetails(DashboardAppointments appointment) {
    final patient = _mapApptToPatient(appointment);
    showDialog(
      context: context,
      builder: (_) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        child: DoctorAppointmentPreview(patient: patient),
      ),
    );
  }

  Future<void> _onNewAppointmentPressed() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        child: AddAppointmentForm(
          onSubmit: (draft) async {
            Navigator.pop(context, true);
          },
        ),
      ),
    );

    if (result == true) {
      _loadAppointments();
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
                  : _buildAppointmentTable(),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title Row
          Row(
            children: [
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
                  Iconsax.calendar_1,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Appointments',
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
                      'Manage all patient appointments',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: AppColors.textLight,
                        letterSpacing: 0.1,
                      ),
                    ),
                  ],
                ),
              ),
              // Refresh Button
              IconButton(
                onPressed: _isRefreshing ? null : _refreshAppointments,
                tooltip: 'Refresh appointments',
                icon: Icon(
                  Iconsax.refresh,
                  color: _isRefreshing ? AppColors.textLight : AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 8),
              // Column Settings Button
              IconButton(
                onPressed: _showColumnSettings,
                tooltip: 'Column settings',
                icon: Icon(
                  Iconsax.setting_4,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 8),
              // New Appointment Button
              ElevatedButton.icon(
                onPressed: _onNewAppointmentPressed,
                icon: const Icon(Iconsax.add, size: 20),
                label: Text(
                  'New Appointment',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Enterprise Search Bar
          Container(
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
              onChanged: _filterAppointments,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: AppColors.textDark,
                letterSpacing: 0.2,
              ),
              decoration: InputDecoration(
                hintText: 'Search by patient name, code, or reason...',
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
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Iconsax.close_circle, size: 20),
                        color: AppColors.textLight,
                        onPressed: () => _filterAppointments(''),
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
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
    final total = _appointments.length;
    final scheduled = _appointments.where((a) => a.status.toLowerCase() == 'scheduled').length;
    final completed = _appointments.where((a) => a.status.toLowerCase() == 'completed').length;
    final cancelled = _appointments.where((a) => a.status.toLowerCase() == 'cancelled').length;

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
              icon: Iconsax.calendar_2,
              label: 'Total',
              value: total.toString(),
              color: AppColors.primary,
            ),
            _buildDivider(),
            _buildStatItem(
              icon: Iconsax.clock,
              label: 'Scheduled',
              value: scheduled.toString(),
              color: AppColors.kInfo,
            ),
            _buildDivider(),
            _buildStatItem(
              icon: Iconsax.tick_circle,
              label: 'Completed',
              value: completed.toString(),
              color: AppColors.kSuccess,
            ),
            _buildDivider(),
            _buildStatItem(
              icon: Iconsax.close_circle,
              label: 'Cancelled',
              value: cancelled.toString(),
              color: AppColors.kDanger,
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

  /// Main appointment table
  Widget _buildAppointmentTable() {
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
              child: _paginatedAppointments.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      itemCount: _paginatedAppointments.length,
                      itemBuilder: (context, index) {
                        final appointment = _paginatedAppointments[index];
                        return _buildTableRow(appointment, index);
                      },
                    ),
            ),
            
            // Pagination
            _buildPagination(),
          ],
        ),
      ),
    );
  }

  /// Table header with sorting
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
          _buildHeaderCell('Patient', 'patient', flex: 2),
          _buildHeaderCell('Age', 'age', flex: 1),
          _buildHeaderCell('Gender', 'gender', flex: 1),
          _buildHeaderCell('Date', 'date', flex: 2),
          _buildHeaderCell('Reason', 'reason', flex: 2),
          _buildHeaderCell('Status', 'status', flex: 1),
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
              onTap: () => _sortAppointments(column),
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

  /// Table row
  Widget _buildTableRow(DashboardAppointments appointment, int index) {
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
          // Patient Info
          Expanded(
            flex: 2,
            child: Row(
              children: [
                // Avatar
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
                    image: appointment.patientAvatarUrl.isNotEmpty
                        ? DecorationImage(
                            image: NetworkImage(appointment.patientAvatarUrl),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: appointment.patientAvatarUrl.isEmpty
                      ? Center(
                          child: Text(
                            appointment.patientName[0].toUpperCase(),
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        appointment.patientName,
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
                        appointment.patientCode?.isNotEmpty == true
                            ? appointment.patientCode!
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
              '${appointment.patientAge} yrs',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textDark,
                letterSpacing: 0.2,
              ),
            ),
          ),
          
          // Gender with icon
          Expanded(
            flex: 1,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  appointment.gender.toLowerCase() == 'male'
                      ? Iconsax.man
                      : Iconsax.woman,
                  size: 18,
                  color: appointment.gender.toLowerCase() == 'male'
                      ? AppColors.kInfo
                      : AppColors.accentPink,
                ),
                const SizedBox(width: 6),
                Text(
                  appointment.gender,
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
          
          // Date & Time
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Iconsax.calendar_1,
                      size: 14,
                      color: AppColors.textLight,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      appointment.date,
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
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Iconsax.clock,
                      size: 14,
                      color: AppColors.textLight,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      appointment.time,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textLight,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Reason
          Expanded(
            flex: 2,
            child: Text(
              appointment.reason,
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
          
          // Status
          Expanded(
            flex: 1,
            child: _buildStatusBadge(appointment.status),
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
                  onTap: () => _showAppointmentDetails(appointment),
                  tooltip: 'View Details',
                ),
                const SizedBox(width: 8),
                _buildActionButton(
                  icon: Iconsax.clipboard_text,
                  color: AppColors.kSuccess,
                  onTap: () => _showIntakeForm(appointment),
                  tooltip: 'Intake Form',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    IconData icon;
    
    switch (status.toLowerCase()) {
      case 'completed':
        color = AppColors.kSuccess;
        icon = Iconsax.tick_circle;
        break;
      case 'scheduled':
        color = AppColors.kInfo;
        icon = Iconsax.clock;
        break;
      case 'cancelled':
        color = AppColors.kDanger;
        icon = Iconsax.close_circle;
        break;
      case 'no show':
        color = AppColors.kWarning;
        icon = Iconsax.warning_2;
        break;
      default:
        color = AppColors.textLight;
        icon = Iconsax.info_circle;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            status,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
              letterSpacing: 0.3,
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

  void _showIntakeForm(DashboardAppointments appointment) {
    showIntakeFormDialog(context, appointment);
  }

  /// Enterprise-grade column settings popup
  void _showColumnSettings() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.1),
                      AppColors.accentPink.withOpacity(0.1),
                    ],
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                  border: Border(
                    bottom: BorderSide(
                      color: AppColors.grey200,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Iconsax.setting_4,
                            size: 20,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Column Settings',
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Customize table columns visibility',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppColors.textLight,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Iconsax.close_circle),
                      color: AppColors.textLight,
                    ),
                  ],
                ),
              ),
              
              // Column toggles
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: _columnVisibility.entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: AppColors.grey200,
                            width: 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: CheckboxListTile(
                          title: Text(
                            entry.key.replaceFirst(
                              entry.key[0],
                              entry.key[0].toUpperCase(),
                            ),
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textDark,
                            ),
                          ),
                          value: entry.value,
                          onChanged: (value) {
                            setState(() {
                              _columnVisibility[entry.key] = value ?? true;
                            });
                          },
                          activeColor: AppColors.primary,
                          checkColor: Colors.white,
                          controlAffinity: ListTileControlAffinity.leading,
                          dense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 4,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              
              // Action buttons
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.bgGray,
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
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        'Close',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textLight,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Column settings updated',
                              style: GoogleFonts.inter(fontSize: 14),
                            ),
                            backgroundColor: AppColors.kSuccess,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'Apply',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
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
            'No appointments found',
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
                : 'No appointments scheduled yet',
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
            '${((_currentPage + 1) * _itemsPerPage).clamp(0, _filteredAppointments.length)} '
            'of ${_filteredAppointments.length} appointments',
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
