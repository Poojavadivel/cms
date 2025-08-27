import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/dashboardmodels.dart';
import '../../../Utils/Colors.dart';
import 'Addnewappoiments.dart';



// --- DashboardAppointments model class ---

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

// A simple example of the data you would pass to the widget.
final List<DashboardAppointments> _dummyAppointments = List.generate(
  50,
      (index) => DashboardAppointments(
    patientName: 'Patient ${index + 1}',
    patientAge: 25 + (index % 10),
    date: '2023-10-${(index % 30) + 1}',
    time: '1${(index % 10)}:00 PM',
    reason: 'Check-up',
    status: (index % 3 == 0) ? 'Complete' : 'Incomplete',
    patientAvatarUrl: 'https://i.pravatar.cc/300?img=${index + 1}',
    gender: (index % 2 == 0) ? 'Male' : 'Female',
    doctor: 'Dr. Jane Doe',
    patientId: 'ID${index + 1}',
    service: 'General Checkup',
  ),
);


// --- AppointmentTable Widget ---
class AppointmentTable extends StatelessWidget {
  final List<DashboardAppointments> appointments;
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
          // Top controls
          _AppointmentTableControls(
            searchQuery: searchQuery,
            onSearchChanged: onSearchChanged,
            onNewAppointmentPressed: onNewAppointmentPressed,
          ),

          // 👇 control the TOP gap here
          const SizedBox(height: 8), // reduce or increase top spacing

          // Table expands in middle
          Expanded(
            child: _AppointmentDataView(
              appointments: _paginatedAppointments,
              onShowAppointmentDetails: onShowAppointmentDetails,
              tableHeaderColor: _tableHeaderColor,
              rowAlternateColor: _rowAlternateColor,
              statusIncompleteColor: _statusIncompleteColor,
              intakeButtonColor: _intakeButtonColor,
              buttonBgColor: _buttonBgColor,
              textSecondaryColor: textSecondaryColor,
            ),
          ),

          // 👇 control the BOTTOM gap here
          const SizedBox(height: 1), // reduce or increase bottom spacing

          // Pagination always at bottom
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

// --- Sub-widget: AppointmentTableControls ---
// --- Sub-widget: AppointmentTableControls ---
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
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 17,
                  ),
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
            SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () {
                  showDialog(
                    context: context,
                    barrierDismissible: false, // user must press Close or Save
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
                                  Navigator.pop(context, draft); // close popup after submit
                                  debugPrint("Appointment created: ${draft.toJson()}");
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
                  IconX.add, // ✅ use IconX
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
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
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

// --- Sub-widget: AppointmentDataView ---
class _AppointmentDataView extends StatelessWidget {
  final List<DashboardAppointments> appointments;
  final void Function(DashboardAppointments) onShowAppointmentDetails;
  final Color tableHeaderColor;
  final Color rowAlternateColor;
  final Color statusIncompleteColor;
  final Color intakeButtonColor;
  final Color buttonBgColor;
  final Color textSecondaryColor;

  const _AppointmentDataView({
    required this.appointments,
    required this.onShowAppointmentDetails,
    required this.tableHeaderColor,
    required this.rowAlternateColor,
    required this.statusIncompleteColor,
    required this.intakeButtonColor,
    required this.buttonBgColor,
    required this.textSecondaryColor,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Scrollbar(
          thumbVisibility: true,
          child: SingleChildScrollView(
          scrollDirection: Axis.horizontal, // ✅ horizontal scrolling
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: constraints.maxWidth),
            child: ScrollConfiguration(
              behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
              child: SingleChildScrollView(
                scrollDirection: Axis.vertical, // ✅ vertical scrolling
                child: Table(
                  border: const TableBorder(
                    horizontalInside: BorderSide(
                      width: 0.5,
                      color: Color(0xFFE5E7EB),
                    ),
                  ),
                  columnWidths: const {
                    0: FlexColumnWidth(1), // Patient name
                    1: FlexColumnWidth(1), // Age
                    2: FlexColumnWidth(1), // Date
                    3: FlexColumnWidth(1), // Time
                    4: FlexColumnWidth(1), // Reason
                    5: FlexColumnWidth(1), // Status
                    6: FlexColumnWidth(1), // Actions
                  },
                  defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                  children: [
                    // --- Header Row ---
                    TableRow(
                      decoration: const BoxDecoration(
                        color: Color(0xFFF9FAFB),
                      ),
                      children: [
                        _buildHeaderCell("Patient Name", Alignment.centerLeft),
                        _buildHeaderCell("Age", Alignment.center),
                        _buildHeaderCell("Date", Alignment.center),
                        _buildHeaderCell("Time", Alignment.center),
                        _buildHeaderCell("Reason", Alignment.center),
                        _buildHeaderCell("Status", Alignment.center),
                        _buildHeaderCell("Actions", Alignment.center),
                      ],
                    ),

                    // --- Data Rows ---
                    for (int i = 0; i < appointments.length; i++)
                      _buildDataRow(appointments[i], i),
                  ],
                ),
              ),
            ),
          ),
        )
        );
      },
    );
  }

  /// Header cell builder
  Widget _buildHeaderCell(String title, Alignment alignment) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      child: Align(
        alignment: alignment,
        child: Text(
          title,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w800,
            color: tableHeaderColor,
            fontSize: 15,
          ),
        ),
      ),
    );
  }

  /// Data row builder
  TableRow _buildDataRow(DashboardAppointments appt, int index) {
    return TableRow(
      decoration: BoxDecoration(
        color: index % 2 == 0 ? null : rowAlternateColor,
      ),
      children: [
        // Patient Name + Avatar
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
          child: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: appt.gender.toLowerCase() == 'male'
                    ? const AssetImage('assets/boyicon.png')
                    : appt.gender.toLowerCase() == 'female'
                    ? const AssetImage('assets/girlicon.png')
                    : NetworkImage(appt.patientAvatarUrl) as ImageProvider,
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  appt.patientName,
                  style: const TextStyle(fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        _centeredCell(Text(appt.patientAge.toString(), style: const TextStyle(fontSize: 14))),
        _centeredCell(Text(appt.date, style: const TextStyle(fontSize: 14))),
        _centeredCell(Text(appt.time, style: const TextStyle(fontSize: 14))),
        _centeredCell(Text(appt.reason, style: const TextStyle(fontSize: 14))),
        _centeredCell(
          Text(
            appt.status,
            style: GoogleFonts.poppins(
              color: appt.status == 'Incomplete'
                  ? statusIncompleteColor
                  : textSecondaryColor,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),

        // Actions
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: () => print('Intake for ${appt.patientName}'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: intakeButtonColor,
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
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: Icon(Icons.edit, size: 16, color: buttonBgColor),
                  onPressed: () => print('Edit ${appt.patientName}'),
                ),
              ),
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: Icon(Icons.delete, size: 16, color: buttonBgColor),
                  onPressed: () => print('Delete ${appt.patientName}'),
                ),
              ),
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: Icon(Icons.remove_red_eye_outlined,
                      size: 16, color: buttonBgColor),
                  onPressed: () => onShowAppointmentDetails(appt),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }


  /// Helper → wrap content in centered Align
  Widget _centeredCell(Widget child) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: Center(child: child),
    );
  }

  Widget _centerLeftCell(Widget child) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: child,
      ),
    );
  }

}




// --- Sub-widget: PaginationControls ---
// This widget provides the pagination buttons.
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
    final totalPages = (totalItems / itemsPerPage).ceil();
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