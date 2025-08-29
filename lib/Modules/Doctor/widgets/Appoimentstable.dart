import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/appointment_draft.dart';
import '../../../Models/dashboardmodels.dart';
import '../../../Utils/Colors.dart';
import 'Addnewappoiments.dart';
import 'Editappoimentspage.dart';

// ✅ Preview dialog widget
import 'doctor_appointment_preview.dart';
// ✅ New pages we wire to (stubs below)
import 'eyeicon.dart';
import 'intakeform.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _intakeButtonColor = Color(0xFFF87171);

// --- AppointmentTable Widget ---
class AppointmentTable extends StatelessWidget {
  final List<DashboardAppointments> appointments;

  // kept for backward compatibility with your parent
  final void Function(DashboardAppointments) onShowAppointmentDetails;

  final VoidCallback onNewAppointmentPressed;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final int currentPage;
  final VoidCallback onNextPage;
  final VoidCallback onPreviousPage;

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
  });

  List<DashboardAppointments> get _filteredAppointments {
    if (searchQuery.isEmpty) return appointments;
    return appointments
        .where((appt) =>
        appt.patientName.toLowerCase().contains(searchQuery.toLowerCase()))
        .toList();
  }

  List<DashboardAppointments> get _paginatedAppointments {
    const itemsPerPage = 10;
    final startIndex = currentPage * itemsPerPage;
    final endIndex = startIndex + itemsPerPage;
    if (startIndex >= _filteredAppointments.length) return [];
    return _filteredAppointments.sublist(
      startIndex,
      endIndex.clamp(0, _filteredAppointments.length),
    );
  }

  @override
  Widget build(BuildContext context) {
    const itemsPerPage = 10;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
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
            searchQuery: searchQuery,
            onSearchChanged: onSearchChanged,
            onNewAppointmentPressed: onNewAppointmentPressed,
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _AppointmentDataView(
              appointments: _paginatedAppointments,
            ),
          ),
          const SizedBox(height: 1),
          _PaginationControls(
            currentPage: currentPage,
            itemsPerPage: itemsPerPage,
            totalItems: _filteredAppointments.length,
            onPrevious: onPreviousPage,
            onNext: onNextPage,
          ),
        ],
      ),
    );
  }
}

// --- Top controls ---
class _AppointmentTableControls extends StatelessWidget {
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onNewAppointmentPressed;

  const _AppointmentTableControls({
    required this.searchQuery,
    required this.onSearchChanged,
    required this.onNewAppointmentPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'APPOINTMENTS',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: _appointmentsHeaderColor,
          ),
        ),
        Row(
          children: [
            const Icon(Icons.filter_list, color: textSecondaryColor),
            const SizedBox(width: 8),
            SizedBox(
              width: 220,
              height: 48,
              child: TextField(
                onChanged: onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search patient name...',
                  hintStyle: GoogleFonts.inter(
                    fontSize: 14,
                    color: const Color(0xFF9CA3AF),
                  ),
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 17),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: _searchBorderColor),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: _searchBorderColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: primaryColor, width: 2),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),

            // New Appointment (no IconX here → avoids name collision)
            SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () {
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) {
                      return Dialog(
                        backgroundColor: Colors.transparent,
                        insetPadding: const EdgeInsets.all(16),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 600),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Material(
                              color: Colors.white,
                              child: AddAppointmentForm(
                                onSubmit: (draft) {
                                  Navigator.pop(context, draft);
                                  debugPrint(
                                      "Appointment created: ${draft.toJson()}");
                                },
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
                icon: const Icon(
                  Icons.add_rounded, // ✅ Fixed
                  size: 18,
                  color: Colors.white,
                ),
                label: Text(
                  'New Appointment',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary600,
                  foregroundColor: Colors.white,
                  padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
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

  const _AppointmentDataView({
    required this.appointments,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      return Scrollbar(
        thumbVisibility: true,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: constraints.maxWidth),
            child: SingleChildScrollView(
              scrollDirection: Axis.vertical,
              child: Table(
                border: const TableBorder(
                  horizontalInside:
                  BorderSide(width: 0.5, color: Color(0xFFE5E7EB)),
                ),
                columnWidths: const {
                  0: FlexColumnWidth(1), // Patient
                  1: FlexColumnWidth(1), // Age
                  2: FlexColumnWidth(1), // Date
                  3: FlexColumnWidth(1), // Time
                  4: FlexColumnWidth(1), // Reason
                  5: FlexColumnWidth(1), // Status
                  6: FlexColumnWidth(1), // Actions
                },
                defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                children: [
                  // Header
                  TableRow(
                    decoration:
                    const BoxDecoration(color: Color(0xFFF9FAFB)),
                    children: [
                      _header('Patient Name', Alignment.centerLeft),
                      _header('Age', Alignment.center),
                      _header('Date', Alignment.center),
                      _header('Time', Alignment.center),
                      _header('Reason', Alignment.center),
                      _header('Status', Alignment.center),
                      _header('Actions', Alignment.center),
                    ],
                  ),

                  // Rows
                  for (int i = 0; i < appointments.length; i++)
                    _row(context, appointments[i], i),
                ],
              ),
            ),
          ),
        ),
      );
    });
  }

  // Header cell
  Widget _header(String title, Alignment align) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      child: Align(
        alignment: align,
        child: Text(
          title,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w800,
            color: _tableHeaderColor,
            fontSize: 15,
          ),
        ),
      ),
    );
  }

  // Data row
  TableRow _row(BuildContext context, DashboardAppointments appt, int index) {
    return TableRow(
      decoration:
      BoxDecoration(color: index.isEven ? null : _rowAlternateColor),
      children: [
        // Patient Name (Tap → Preview dialog)
        InkWell(
          onTap: () => _openPreviewDialog(context, appt),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundImage: appt.gender.toLowerCase() == 'male'
                      ? const AssetImage('assets/boyicon.png')
                      : appt.gender.toLowerCase() == 'female'
                      ? const AssetImage('assets/girlicon.png')
                      : (appt.patientAvatarUrl.isNotEmpty
                      ? NetworkImage(appt.patientAvatarUrl)
                      : const AssetImage('assets/boyicon.png'))
                  as ImageProvider,
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    appt.patientName,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),

        _center(appt.patientAge.toString()),
        _center(appt.date),
        _center(appt.time),
        _center(appt.reason),
        _center(
          appt.status,
          color: appt.status == 'Incomplete'
              ? _statusIncompleteColor
              : textSecondaryColor,
          weight: FontWeight.w600,
        ),

        // Actions: Intake | Edit | Delete | Eye
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Intake -> IntakeFormPage
              ElevatedButton(
                onPressed: () {
                  showIntakeFormDialog(context, appt); // 👈 opens as dialog instead of route
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _intakeButtonColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  minimumSize: const Size(0, 26),
                ),
                child: const Text('Intake', style: TextStyle(fontSize: 11)),
              ),
              const SizedBox(width: 4),

              // Edit -> EditAppointmentForm dialog
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(Icons.edit, size: 16, color: _buttonBgColor),
                  onPressed: () => _openEditDialog(context, appt),
                ),
              ),

              // Delete (stub)
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(Icons.delete, size: 16, color: _buttonBgColor),
                  onPressed: () {
                    // TODO: hook your delete API
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Deleted ${appt.patientName}')),
                    );
                  },
                ),
              ),

              // Eye -> AppointmentDetailPage
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(
                    Icons.remove_red_eye_outlined,
                    size: 16,
                    color: _buttonBgColor,
                  ),
                  onPressed: () {
                    AppointmentDetail.show(context, appt);
                  },
                ),
              )

            ],
          ),
        ),
      ],
    );
  }

  // Helpers
  Widget _center(String text,
      {Color color = textPrimaryColor, FontWeight weight = FontWeight.w500}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: Center(
        child: Text(
          text,
          style: TextStyle(fontSize: 14, color: color, fontWeight: weight),
        ),
      ),
    );
  }

  void _openPreviewDialog(BuildContext context, DashboardAppointments appt) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => DoctorAppointmentPreview(appointment: appt),
    );
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
            constraints: const BoxConstraints(maxWidth: 600),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Material(
                color: Colors.white,
                child: EditAppointmentForm(
                  initial: AppointmentDraft(
                    clientName: appt.patientName,
                    appointmentType: appt.service,
                    date: DateTime.tryParse(appt.date) ?? DateTime.now(),
                    time: const TimeOfDay(hour: 10, minute: 30),
                    location: "Clinic Room 101",
                    notes: appt.reason,
                  ),
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

// --- Pagination ---
class _PaginationControls extends StatelessWidget {
  final int currentPage;
  final int itemsPerPage;
  final int totalItems;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _PaginationControls({
    required this.currentPage,
    required this.itemsPerPage,
    required this.totalItems,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final totalPages = (totalItems / itemsPerPage).ceil().clamp(1, 9999);
    final isFirstPage = currentPage == 0;
    final isLastPage = currentPage >= totalPages - 1;

    return Align(
      alignment: Alignment.bottomRight,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              onPressed: isFirstPage ? null : onPrevious,
              icon: const Icon(Icons.arrow_back_ios),
              color: isFirstPage
                  ? textSecondaryColor.withOpacity(0.5)
                  : textSecondaryColor,
            ),
            Text(
              'Page ${currentPage + 1} of $totalPages',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: textSecondaryColor,
              ),
            ),
            IconButton(
              onPressed: isLastPage ? null : onNext,
              icon: const Icon(Icons.arrow_forward_ios),
              color: isLastPage
                  ? textSecondaryColor.withOpacity(0.5)
                  : textSecondaryColor,
            ),
          ],
        ),
      ),
    );
  }
}
