import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:glowhair/Models/Patients.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../Models/appointment_draft.dart';
import '../../../Models/dashboardmodels.dart';
import '../../../Utils/Colors.dart';
import 'Addnewappoiments.dart';
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
  }

  List<DashboardAppointments> get _filteredAppointments {
    if (widget.searchQuery.isEmpty) return widget.appointments;
    return widget.appointments
        .where((appt) =>
            appt.patientName.toLowerCase().contains(widget.searchQuery.toLowerCase()) ||
            appt.reason.toLowerCase().contains(widget.searchQuery.toLowerCase()) ||
            appt.patientId.toLowerCase().contains(widget.searchQuery.toLowerCase()))
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

  void _exportData() {
    // Export to CSV/Excel
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Data'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.table_chart),
              title: const Text('Export as CSV'),
              onTap: () {
                Navigator.pop(context);
                _exportToCSV();
              },
            ),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf),
              title: const Text('Export as PDF'),
              onTap: () {
                Navigator.pop(context);
                _exportToPDF();
              },
            ),
            ListTile(
              leading: const Icon(Icons.file_download),
              title: const Text('Export as Excel'),
              onTap: () {
                Navigator.pop(context);
                _exportToExcel();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _exportToCSV() {
    // Implement CSV export
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting to CSV...')),
    );
  }

  void _exportToPDF() {
    // Implement PDF export
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting to PDF...')),
    );
  }

  void _exportToExcel() {
    // Implement Excel export
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting to Excel...')),
    );
  }

  void _showColumnSettings() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Column Visibility'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: _columnVisibility.keys.map((key) {
              return CheckboxListTile(
                title: Text(key.toUpperCase()),
                value: _columnVisibility[key],
                onChanged: (value) {
                  setState(() {
                    _columnVisibility[key] = value ?? true;
                  });
                  Navigator.pop(context);
                  _showColumnSettings();
                },
              );
            }).toList(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
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
                searchQuery: widget.searchQuery,
                onSearchChanged: widget.onSearchChanged,
                onNewAppointmentPressed: widget.onNewAppointmentPressed,
                selectedCount: 0,
                onBulkDelete: _bulkDelete,
                onExport: () {}, // Removed export
                onColumnSettings: _showColumnSettings,
                onRefresh: widget.onRefreshRequested,
              ),
              const SizedBox(height: 16),
              
              // Stats Summary Bar
              _buildStatsBar(),
              
              const SizedBox(height: 16),
              
              Expanded(
                child: _AppointmentDataView(
                  appointments: _paginatedAppointments,
                  onShowAppointmentDetails: widget.onShowAppointmentDetails,
                  onDeleteAppointment: (appt) {
                    if (widget.onDeleteAppointment != null) {
                      widget.onDeleteAppointment!(appt);
                      widget.onRefreshRequested();
                    }
                  },
                  selectedRows: const {}, // Empty set - checkboxes removed
                  onToggleSelection: (_) {}, // No-op
                  onSelectAll: () {}, // No-op
                  sortColumn: _sortColumn,
                  sortAscending: _sortAscending,
                  onSort: _toggleSort,
                  columnVisibility: _columnVisibility,
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
                onJumpToPage: (page) {
                  // Implement jump to page
                },
              ),
            ],
          ),
        ),
        if (widget.isLoading)
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
      ],
    );
  }

  Widget _buildStatsBar() {
    final total = widget.appointments.length;
    final scheduled = widget.appointments.where((a) => a.status.toLowerCase() == 'scheduled').length;
    final completed = widget.appointments.where((a) => a.status.toLowerCase() == 'completed').length;
    final cancelled = widget.appointments.where((a) => a.status.toLowerCase() == 'cancelled').length;

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
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Text(
                  'APPOINTMENTS',
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.appointmentsHeader,
                    letterSpacing: 1.2,
                    height: 1.2,
                  ),
                ),
                const SizedBox(width: 16),
                if (selectedCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withOpacity(0.15),
                          AppColors.primary.withOpacity(0.10),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.3),
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Iconsax.tick_circle,
                          size: 16,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '$selectedCount selected',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            Row(
              children: [
                // Refresh Button
                IconButton(
                  onPressed: onRefresh,
                  icon: const Icon(Iconsax.refresh),
                  tooltip: 'Refresh',
                  color: AppColors.kTextSecondary,
                ),
                
                // Column Settings
                IconButton(
                  onPressed: onColumnSettings,
                  icon: const Icon(Iconsax.setting_4),
                  tooltip: 'Column Settings',
                  color: AppColors.kTextSecondary,
                ),
                
                // Export Button
                IconButton(
                  onPressed: onExport,
                  icon: const Icon(Iconsax.document_download),
                  tooltip: 'Export Data',
                  color: AppColors.kTextSecondary,
                ),
                
                const SizedBox(width: 8),
                
                // Search Field
                SizedBox(
                  width: 320,
                  height: 44,
                  child: TextField(
                    onChanged: onSearchChanged,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0.2,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search patient, reason, ID...',
                      hintStyle: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.muted,
                        letterSpacing: 0.2,
                      ),
                      prefixIcon: Icon(
                        Iconsax.search_normal_1,
                        size: 20,
                        color: AppColors.primary.withOpacity(0.6),
                      ),
                      suffixIcon: searchQuery.isNotEmpty
                          ? IconButton(
                              icon: Icon(
                                Icons.clear,
                                size: 20,
                                color: AppColors.kTextSecondary,
                              ),
                              onPressed: () => onSearchChanged(''),
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.white,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(
                          color: AppColors.searchBorder.withOpacity(0.5),
                          width: 1.5,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(
                          color: AppColors.searchBorder.withOpacity(0.5),
                          width: 1.5,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(
                          color: AppColors.primary,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Bulk Delete (if items selected)
                if (selectedCount > 0)
                  ElevatedButton.icon(
                    onPressed: onBulkDelete,
                    icon: const Icon(Iconsax.trash, size: 16),
                    label: const Text('Delete'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.kDanger,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
              ],
            ),
          ],
        ),
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
                // Checkbox column
                // SizedBox(
                //   width: 60,
                //   child: Checkbox(
                //     value: selectedRows.length == appointments.length && appointments.isNotEmpty,
                //     tristate: true,
                //     onChanged: (_) => onSelectAll(),
                //   ),
                // ),
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
          
          // Body
          Expanded(
            child: appointments.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    itemCount: appointments.length,
                    itemBuilder: (context, index) {
                      return _buildRow(context, appointments[index], index);
                    },
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
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w700,
                    color: AppColors.tableHeader,
                    fontSize: 13,
                    letterSpacing: 0.5,
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
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.kTextPrimary,
                                  letterSpacing: 0.2,
                                ),
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                (appt.patientCode != null && appt.patientCode!.isNotEmpty) 
                                    ? appt.patientCode! 
                                    : 'ID: ${appt.patientId}',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.kTextSecondary,
                                  letterSpacing: 0.3,
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
            
            // Age
            if (columnVisibility['age'] ?? true)
              _buildCell(appt.patientAge.toString(), flex: 1),
            
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
                      _buildActionButton(
                        icon: Iconsax.document_text,
                        label: 'Intake',
                        color: AppColors.kInfo,
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
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppColors.kTextPrimary,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.2,
            height: 1.4,
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
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: textColor,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
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
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(6),
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 16, color: color),
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
    DoctorAppointmentPreview.show(context, patient);
  }

  void _openEditDialog(BuildContext context, DashboardAppointments appt) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1500),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Material(
                color: Colors.white,
                child: EditAppointmentForm(
                  appointmentId: appt.id,
                  onSave: (updated) {
                    Navigator.pop(context);
                    debugPrint('Updated: ${updated.toJson()}');
                  },
                  onCancel: () => Navigator.pop(context),
                  onDelete: () {
                    Navigator.pop(context);
                    debugPrint('Deleted appointment for ${appt.patientName}');
                  },
                ),
              ),
            ),
          ),
        );
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
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  color: AppColors.kTextSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
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
                          style: GoogleFonts.inter(fontSize: 13),
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
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  color: AppColors.kTextSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
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
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
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
