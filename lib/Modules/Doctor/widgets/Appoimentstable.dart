import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:glowhair/Models/Patients.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import '../../../Models/dashboardmodels.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';
import 'Editappoimentspage.dart';
import 'doctor_appointment_preview.dart';
import 'eyeicon.dart';
import 'intakeform.dart';

/// Helper: map DashboardAppointments -> PatientDetails (no network)
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

class AppointmentTable extends StatefulWidget {
  final List<DashboardAppointments> appointments;
  final void Function(DashboardAppointments) onShowAppointmentDetails;
  final VoidCallback onNewAppointmentPressed;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final int currentPage;
  final VoidCallback onNextPage;
  final VoidCallback onPreviousPage;
  final void Function(DashboardAppointments)? onDeleteAppointment;
  final VoidCallback onRefreshRequested;
  final bool isLoading;

  const AppointmentTable({
    super.key,
    required this.appointments,
    required this.onShowAppointmentDetails,
    required this.onNewAppointmentPressed,
    required this.searchQuery,
    required this.onSearchChanged,
    required this.currentPage,
    required this.onNextPage,
    required this.onPreviousPage,
    this.onDeleteAppointment,
    required this.onRefreshRequested,
    this.isLoading = false,
  });

  @override
  State<AppointmentTable> createState() => _AppointmentTableState();
}

class _AppointmentTableState extends State<AppointmentTable> {
  // Enterprise features (removed checkboxes)
  String _sortColumn = 'date';
  bool _sortAscending = false;
  int _itemsPerPage = 10;
  final List<int> _pageSizeOptions = [10, 25, 50, 100];
  
  // Local state - independent from dashboard
  List<DashboardAppointments> _localAppointments = [];
  bool _isLoadingLocal = false;
  String _searchQueryLocal = '';
  
  // Column visibility
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
    _loadAppointmentsLocally();
  }
  
  Future<void> _loadAppointmentsLocally() async {
    setState(() => _isLoadingLocal = true);
    try {
      final data = await AuthService.instance.fetchAppointments();
      setState(() {
        _localAppointments = data;
      });
      debugPrint('✅ Appointments loaded: ${_localAppointments.length}');
    } catch (e) {
      debugPrint('❌ Error loading appointments: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _isLoadingLocal = false);
    }
  }

  List<DashboardAppointments> get _filteredAppointments {
    if (_searchQueryLocal.isEmpty) return _localAppointments;
    return _localAppointments
        .where((appt) =>
            appt.patientName.toLowerCase().contains(_searchQueryLocal.toLowerCase()) ||
            appt.reason.toLowerCase().contains(_searchQueryLocal.toLowerCase()) ||
            appt.patientId.toLowerCase().contains(_searchQueryLocal.toLowerCase()))
        .toList();
  }

  List<DashboardAppointments> get _sortedAppointments {
    final filtered = _filteredAppointments;
    filtered.sort((a, b) {
      int comparison = 0;
      switch (_sortColumn) {
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
    return filtered;
  }

  List<DashboardAppointments> get _paginatedAppointments {
    final startIndex = widget.currentPage * _itemsPerPage;
    final endIndex = startIndex + _itemsPerPage;
    if (startIndex >= _sortedAppointments.length) return [];
    return _sortedAppointments.sublist(
      startIndex,
      endIndex.clamp(0, _sortedAppointments.length),
    );
  }

  void _toggleSort(String column) {
    setState(() {
      if (_sortColumn == column) {
        _sortAscending = !_sortAscending;
      } else {
        _sortColumn = column;
        _sortAscending = true;
      }
    });
  }

  void _bulkDelete() {
    // Removed bulk delete functionality
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Feature Removed'),
        content: const Text('Bulk delete has been removed. Please delete appointments individually.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }





  void _showColumnSettings() {
    showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.6),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Container(
          width: MediaQuery.of(context).size.width * 0.35,
          constraints: const BoxConstraints(maxHeight: 600),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.2),
                blurRadius: 40,
                offset: const Offset(0, 15),
                spreadRadius: 0,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Premium Header
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withOpacity(0.85),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Iconsax.setting_2,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Display Settings',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Customize visible columns',
                            style: GoogleFonts.roboto(
                              fontSize: 12,
                              fontWeight: FontWeight.w400,
                              color: Colors.white.withOpacity(0.85),
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Content - Scrollable
              Expanded(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: _columnVisibility.keys.toList().asMap().entries.map((entry) {
                        int idx = entry.key;
                        String key = entry.value;
                        bool isVisible = _columnVisibility[key]!;
                        
                        return Padding(
                          padding: EdgeInsets.only(bottom: idx == _columnVisibility.length - 1 ? 0 : 12),
                          child: Container(
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isVisible
                                    ? AppColors.primary.withOpacity(0.4)
                                    : AppColors.grey200,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(12),
                              color: isVisible
                                  ? AppColors.primary.withOpacity(0.08)
                                  : AppColors.grey100.withOpacity(0.5),
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () {
                                  setState(() {
                                    _columnVisibility[key] = !isVisible;
                                  });
                                },
                                borderRadius: BorderRadius.circular(10),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          border: Border.all(
                                            color: isVisible
                                                ? AppColors.primary
                                                : AppColors.grey300,
                                            width: 2,
                                          ),
                                          borderRadius: BorderRadius.circular(6),
                                          color: isVisible
                                              ? AppColors.primary
                                              : Colors.transparent,
                                        ),
                                        child: isVisible
                                            ? Icon(
                                                Iconsax.tick_circle,
                                                size: 14,
                                                color: Colors.white,
                                              )
                                            : null,
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Text(
                                          key.toUpperCase(),
                                          style: GoogleFonts.poppins(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.kTextPrimary,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ),
                                      if (isVisible)
                                        Icon(
                                          Iconsax.eye,
                                          size: 18,
                                          color: AppColors.primary,
                                        )
                                      else
                                        Icon(
                                          Iconsax.eye_slash,
                                          size: 18,
                                          color: AppColors.grey400,
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
              
              // Professional Footer
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: AppColors.grey200,
                      width: 1,
                    ),
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _columnVisibility.updateAll((key, value) => true);
                        });
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      child: Text(
                        'Reset All',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 28,
                          vertical: 12,
                        ),
                        elevation: 2,
                        shadowColor: AppColors.primary.withOpacity(0.3),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'Done',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
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
              _AppointmentTableControls(
                searchQuery: _searchQueryLocal,
                onSearchChanged: (query) {
                  setState(() => _searchQueryLocal = query);
                },
                onNewAppointmentPressed: widget.onNewAppointmentPressed,
                selectedCount: 0,
                onBulkDelete: () {},
                onExport: () {},
                onColumnSettings: _showColumnSettings,
                onRefresh: _loadAppointmentsLocally,
              ),
              const SizedBox(height: 16),
              
              // Stats Summary Bar
              _buildStatsBar(),
              
              const SizedBox(height: 16),
              
              Expanded(
                child: _AppointmentDataView(
                  appointments: _isLoadingLocal ? [] : _paginatedAppointments,
                  onShowAppointmentDetails: widget.onShowAppointmentDetails,
                  onDeleteAppointment: (appt) {
                    if (widget.onDeleteAppointment != null) {
                      widget.onDeleteAppointment!(appt);
                      _loadAppointmentsLocally();
                    }
                  },
                  selectedRows: const {},
                  onToggleSelection: (_) {},
                  onSelectAll: () {},
                  sortColumn: _sortColumn,
                  sortAscending: _sortAscending,
                  onSort: _toggleSort,
                  columnVisibility: _columnVisibility,
                  onRefresh: _loadAppointmentsLocally,
                ),
              ),
              const SizedBox(height: 16),
              
              // Enhanced Pagination
              _EnhancedPaginationControls(
                currentPage: widget.currentPage,
                itemsPerPage: _itemsPerPage,
                totalItems: _sortedAppointments.length,
                onPrevious: widget.onPreviousPage,
                onNext: widget.onNextPage,
                pageSizeOptions: _pageSizeOptions,
                onPageSizeChanged: (size) {
                  setState(() => _itemsPerPage = size);
                },
                onJumpToPage: (page) {},
              ),
            ],
          ),
        ),
        // Skeleton Loading Overlay - Premium Enterprise Design
        if (_isLoadingLocal)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.98),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  // Skeleton rows
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.only(left: 24, right: 24, top: 24, bottom: 12),
                      itemCount: 7,
                      itemBuilder: (context, index) => _buildSkeletonRow(),
                    ),
                  ),
                  
                  // Loading state indicator at bottom
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
                          'Fetching Appointments',
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
          // Avatar skeleton
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
          
          // Text skeleton columns
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Main text line
                Container(
                  height: 14,
                  width: 140,
                  decoration: BoxDecoration(
                    color: AppColors.grey300,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 8),
                // Subtitle line
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
          
          // Other column skeletons (responsive)
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
          
          // Action skeleton
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
    final total = _localAppointments.length;
    final scheduled = _localAppointments.where((a) => a.status.toLowerCase() == 'scheduled').length;
    final completed = _localAppointments.where((a) => a.status.toLowerCase() == 'completed').length;
    final cancelled = _localAppointments.where((a) => a.status.toLowerCase() == 'cancelled').length;

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
              icon: Iconsax.calendar,
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
              icon: Iconsax.clock,
              label: 'Scheduled',
              value: scheduled.toString(),
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
              icon: Iconsax.tick_circle,
              label: 'Completed',
              value: completed.toString(),
              color: AppColors.kSuccess,
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
              icon: Iconsax.close_circle,
              label: 'Cancelled',
              value: cancelled.toString(),
              color: AppColors.kDanger,
            ),
          ),
        ],
      ),
    );
  }
}

// --- Stats Item Widget ---
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

// --- Top controls ---
class _AppointmentTableControls extends StatelessWidget {
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onNewAppointmentPressed;
  final int selectedCount;
  final VoidCallback onBulkDelete;
  final VoidCallback onExport;
  final VoidCallback onColumnSettings;
  final VoidCallback onRefresh;

  const _AppointmentTableControls({
    required this.searchQuery,
    required this.onSearchChanged,
    required this.onNewAppointmentPressed,
    required this.selectedCount,
    required this.onBulkDelete,
    required this.onExport,
    required this.onColumnSettings,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Single Row: Title + Search (with buttons inside) + Buttons
        Row(
          children: [
            // Title
            Text(
              'APPOINTMENTS',
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.appointmentsHeader,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(width: 24),
            
            // Search field with buttons inside
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
                    // Search Icon
                    Padding(
                      padding: const EdgeInsets.only(left: 12),
                      child: Icon(
                        Iconsax.search_normal_1,
                        color: AppColors.primary,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 8),
                    
                    // Search TextField
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
                          hintText: 'Search appointments...',
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
                    
                    // Clear Button (if search has text)
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
                    
                    // Divider
                    Container(
                      width: 1,
                      height: 24,
                      color: AppColors.primary.withOpacity(0.2),
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                    
                    // Refresh Button
                    IconButton(
                      onPressed: onRefresh,
                      icon: Icon(
                        Iconsax.refresh,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                      tooltip: 'Refresh',
                    ),
                    
                    // Settings Button
                    IconButton(
                      onPressed: onColumnSettings,
                      icon: Icon(
                        Iconsax.setting_4,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                      tooltip: 'Settings',
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

// --- Table view ---
class _AppointmentDataView extends StatelessWidget {
  final List<DashboardAppointments> appointments;
  final void Function(DashboardAppointments) onShowAppointmentDetails;
  final void Function(DashboardAppointments)? onDeleteAppointment;
  final Set<String> selectedRows;
  final Function(String) onToggleSelection;
  final VoidCallback onSelectAll;
  final String sortColumn;
  final bool sortAscending;
  final Function(String) onSort;
  final Map<String, bool> columnVisibility;
  final VoidCallback onRefresh;

  const _AppointmentDataView({
    required this.appointments,
    required this.onShowAppointmentDetails,
    this.onDeleteAppointment,
    required this.selectedRows,
    required this.onToggleSelection,
    required this.onSelectAll,
    required this.sortColumn,
    required this.sortAscending,
    required this.onSort,
    required this.columnVisibility,
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
                if (columnVisibility['patient'] ?? true)
                  _buildSortableHeader('Patient Name', 'patient', flex: 2),
                if (columnVisibility['age'] ?? true)
                  _buildSortableHeader('Age', 'age', flex: 1),
                if (columnVisibility['date'] ?? true)
                  _buildSortableHeader('Date', 'date', flex: 1),
                if (columnVisibility['time'] ?? true)
                  _buildSortableHeader('Time', 'time', flex: 1),
                if (columnVisibility['reason'] ?? true)
                  _buildSortableHeader('Reason', 'reason', flex: 2),
                if (columnVisibility['status'] ?? true)
                  _buildSortableHeader('Status', 'status', flex: 1),
                if (columnVisibility['actions'] ?? true)
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
          
          // Body - Enterprise Grade with Scrolling
          Expanded(
            child: appointments.isEmpty
                ? _buildEmptyState()
                : RawScrollbar(
                    thumbColor: AppColors.primary.withOpacity(0.3),
                    radius: const Radius.circular(6),
                    thickness: 8,
                    child: ListView.builder(
                      itemCount: appointments.length,
                      padding: const EdgeInsets.only(right: 4),
                      itemBuilder: (context, index) {
                        return _buildRow(context, appointments[index], index);
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
                Iconsax.calendar_remove,
                size: 72,
                color: AppColors.primary.withOpacity(0.4),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No appointments found',
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

  Widget _buildRow(BuildContext context, DashboardAppointments appt, int index) {
    final isSelected = selectedRows.contains(appt.id);
    final patient = _mapApptToPatient(appt);

    return InkWell(
      onTap: () => onToggleSelection(appt.id),
      hoverColor: AppColors.primary.withOpacity(0.03),
      splashColor: AppColors.primary.withOpacity(0.06),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected 
              ? AppColors.primary.withOpacity(0.08)
              : (index.isEven ? Colors.white : AppColors.grey50.withOpacity(0.5)),
          border: Border(
            bottom: BorderSide(
              color: AppColors.grey200.withOpacity(0.6),
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            // Checkbox
            // SizedBox(
            //   width: 60,
            //   child: Checkbox(
            //     value: isSelected,
            //     onChanged: (_) => onToggleSelection(appt.id),
            //   ),
            // ),
            
            // Patient Name
            if (columnVisibility['patient'] ?? true)
              Expanded(
                flex: 2,
                child: InkWell(
                  onTap: () => _openPreviewDialog(context, patient),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    child: Row(
                      children: [
                        _buildAvatar(appt),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                appt.patientName,
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
                                (appt.patientCode != null && appt.patientCode!.isNotEmpty) 
                                    ? appt.patientCode! 
                                    : 'ID: ${appt.patientId}',
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
              ),
            
            // Age - Centered
            if (columnVisibility['age'] ?? true)
              Expanded(
                flex: 1,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                  child: Center(
                    child: Text(
                      appt.patientAge.toString(),
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
            
            // Date
            if (columnVisibility['date'] ?? true)
              _buildCell(_formatDate(appt.date), flex: 1),
            
            // Time
            if (columnVisibility['time'] ?? true)
              _buildCell(appt.time, flex: 1),
            
            // Reason
            if (columnVisibility['reason'] ?? true)
              _buildCell(appt.reason, flex: 2),
            
            // Status
            if (columnVisibility['status'] ?? true)
              Expanded(
                flex: 1,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                  child: _buildStatusBadge(appt.status),
                ),
              ),
            
            // Actions
            if (columnVisibility['actions'] ?? true)
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildIconButton(
                        icon: Iconsax.document_text,
                        color: AppColors.kInfo,
                        tooltip: 'Intake',
                        onPressed: () => showIntakeFormDialog(context, appt),
                      ),
                      const SizedBox(width: 6),
                      _buildIconButton(
                        icon: Iconsax.edit_2,
                        color: AppColors.primary600,
                        tooltip: 'Edit',
                        onPressed: () => _openEditDialog(context, appt),
                      ),
                      const SizedBox(width: 4),
                      _buildIconButton(
                        icon: Iconsax.eye,
                        color: AppColors.accentPink,
                        tooltip: 'View',
                        onPressed: () => AppointmentDetail.show(context, patient),
                      ),
                      const SizedBox(width: 4),
                      if (onDeleteAppointment != null)
                        _buildIconButton(
                          icon: Iconsax.trash,
                          color: AppColors.kDanger,
                          tooltip: 'Delete',
                          onPressed: () => _confirmDelete(context, appt),
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

  Widget _buildAvatar(DashboardAppointments appt) {
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
          backgroundImage: appt.gender.toLowerCase() == 'male'
              ? const AssetImage('assets/boyicon.png')
              : appt.gender.toLowerCase() == 'female'
                  ? const AssetImage('assets/girlicon.png')
                  : (appt.patientAvatarUrl.isNotEmpty
                      ? NetworkImage(appt.patientAvatarUrl)
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

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'scheduled':
        backgroundColor = AppColors.kInfo.withOpacity(0.12);
        textColor = AppColors.kInfo;
        icon = Iconsax.clock;
        break;
      case 'completed':
        backgroundColor = AppColors.kSuccess.withOpacity(0.12);
        textColor = AppColors.kSuccess;
        icon = Iconsax.tick_circle;
        break;
      case 'cancelled':
        backgroundColor = AppColors.kDanger.withOpacity(0.12);
        textColor = AppColors.kDanger;
        icon = Iconsax.close_circle;
        break;
      case 'incomplete':
        backgroundColor = AppColors.kWarning.withOpacity(0.12);
        textColor = AppColors.kWarning;
        icon = Iconsax.warning_2;
        break;
      default:
        backgroundColor = AppColors.kTextSecondary.withOpacity(0.12);
        textColor = AppColors.kTextSecondary;
        icon = Iconsax.info_circle;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: textColor.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: textColor),
          const SizedBox(width: 7),
          Flexible(
            child: Text(
              status,
              style: GoogleFonts.roboto(
                fontSize: 12,
                color: textColor,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
                height: 1.3,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 15),
      label: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
        ),
        overflow: TextOverflow.ellipsis,
        maxLines: 1,
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        minimumSize: const Size(0, 32),
        elevation: 0,
        shadowColor: color.withOpacity(0.3),
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

  String _formatDate(String date) {
    try {
      final parsed = DateFormat('MMM dd, yyyy').parse(date);
      return DateFormat('dd MMM').format(parsed);
    } catch (e) {
      return date;
    }
  }

  void _confirmDelete(BuildContext context, DashboardAppointments appt) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Iconsax.warning_2, color: AppColors.kDanger),
            const SizedBox(width: 12),
            const Text('Confirm Delete'),
          ],
        ),
        content: Text('Are you sure you want to delete appointment for ${appt.patientName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              if (onDeleteAppointment != null) {
                onDeleteAppointment!(appt);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.kDanger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _openPreviewDialog(BuildContext context, PatientDetails patient) {
    DoctorAppointmentPreview.show(
      context, 
      patient,
      showBillingTab: false, // Hide billing tab in Doctor module
    );
  }

  void _openEditDialog(BuildContext context, DashboardAppointments appt) {
    EditAppointmentForm.show(
      context,
      appointmentId: appt.id,
      onSave: (updated) {
        Navigator.pop(context);
        onRefresh();
        debugPrint('✅ Updated: ${updated.toJson()}');
      },
      onDelete: () {
        Navigator.pop(context);
        if (onDeleteAppointment != null) {
          onDeleteAppointment!(appt);
        }
        onRefresh();
        debugPrint('🗑️ Deleted appointment for ${appt.patientName}');
      },
    );
  }
}

// --- Enhanced Pagination ---
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
          // Items per page
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

          // Page navigation
          Row(
            children: [
              // First page
              IconButton(
                onPressed: isFirstPage ? null : () => onJumpToPage?.call(0),
                icon: const Icon(Iconsax.arrow_left_3),
                iconSize: 18,
                color: isFirstPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'First page',
              ),
              
              // Previous
              IconButton(
                onPressed: isFirstPage ? null : onPrevious,
                icon: const Icon(Iconsax.arrow_left_2),
                iconSize: 18,
                color: isFirstPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Previous page',
              ),
              
              // Page numbers
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
              
              // Next
              IconButton(
                onPressed: isLastPage ? null : onNext,
                icon: const Icon(Iconsax.arrow_right_3),
                iconSize: 18,
                color: isLastPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Next page',
              ),
              
              // Last page
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
