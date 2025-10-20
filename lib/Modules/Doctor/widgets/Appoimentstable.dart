import 'package:flutter/material.dart';
import 'package:glowhair/Models/Patients.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/appointment_draft.dart';
import '../../../Models/dashboardmodels.dart';
import '../../../Utils/Colors.dart';
import 'Addnewappoiments.dart';
import 'Editappoimentspage.dart';
import 'doctor_appointment_preview.dart';
import 'eyeicon.dart';
import 'intakeform.dart';
// <-- added: update path if needed

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

class AppointmentTable extends StatelessWidget {
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
                searchQuery: searchQuery,
                onSearchChanged: onSearchChanged,
                onNewAppointmentPressed: onNewAppointmentPressed,
              ),
              const SizedBox(height: 8),
              Expanded(
                child: _AppointmentDataView(
                  appointments: _paginatedAppointments,
                  onShowAppointmentDetails: onShowAppointmentDetails,
                  onDeleteAppointment: (appt) {
                    if (onDeleteAppointment != null) {
                      onDeleteAppointment!(appt);
                      onRefreshRequested();
                    }
                  },
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
        ),
        if (isLoading)
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(child: CircularProgressIndicator()),
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
            color: AppColors.appointmentsHeader,
          ),
        ),
        Row(
          children: [
            const Icon(Icons.filter_list, color: AppColors.kTextSecondary),
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
                    color: AppColors.muted,
                  ),
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 17),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.searchBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.searchBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide:
                    const BorderSide(color: AppColors.primary, width: 2),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
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

  const _AppointmentDataView({
    required this.appointments,
    required this.onShowAppointmentDetails,
    this.onDeleteAppointment,
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
                  BorderSide(width: 0.5, color: AppColors.grey200),
                ),
                columnWidths: const {
                  0: FlexColumnWidth(1),
                  1: FlexColumnWidth(1),
                  2: FlexColumnWidth(1),
                  3: FlexColumnWidth(1),
                  4: FlexColumnWidth(1),
                  5: FlexColumnWidth(1),
                  6: FlexColumnWidth(1),
                },
                defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                children: [
                  TableRow(
                    decoration:
                    const BoxDecoration(color: AppColors.rowAlternate),
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

  Widget _header(String title, Alignment align) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      child: Align(
        alignment: align,
        child: Text(
          title,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w800,
            color: AppColors.tableHeader,
            fontSize: 15,
          ),
        ),
      ),
    );
  }

  TableRow _row(BuildContext context, DashboardAppointments appt, int index) {
    // Map appointment -> patient once here
    final PatientDetails patient = _mapApptToPatient(appt);

    return TableRow(
      key: ValueKey(appt.id),
      decoration: BoxDecoration(
        color: index.isEven ? null : AppColors.grey50,
      ),
      children: [
        InkWell(
          onTap: () => _openPreviewDialog(context, patient),
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
                      : const AssetImage('assets/boyicon.png')) as ImageProvider,
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
              ? AppColors.kDanger
              : AppColors.kTextSecondary,
          weight: FontWeight.w600,
        ),
        // Actions: Intake | Edit | Delete | Eye
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Intake
              ElevatedButton(
                onPressed: () {
                  showIntakeFormDialog(context, appt);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.kInfo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  minimumSize: const Size(0, 26),
                ),
                child: const Text('Intake', style: TextStyle(fontSize: 11)),
              ),
              const SizedBox(width: 6),

              // Edit
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(Icons.edit, size: 16),
                  color: AppColors.primary600,
                  onPressed: () => _openEditDialog(context, appt),
                ),
              ),

              // Delete
              if (onDeleteAppointment != null)
                SizedBox(
                  width: 28,
                  height: 28,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: const Icon(Icons.delete, size: 16),
                    color: AppColors.kDanger,
                    onPressed: () => onDeleteAppointment!(appt),
                  ),
                ),

              // Eye (View)
              SizedBox(
                width: 28,
                height: 28,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(Icons.remove_red_eye_outlined, size: 16),
                  color: AppColors.accentPink,
                  onPressed: () {
                    final patient = _mapApptToPatient(appt);
                    AppointmentDetail.show(context, patient);
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _center(String text,
      {Color color = AppColors.kTextPrimary, FontWeight weight = FontWeight.w500}) {
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
              color: isFirstPage ? AppColors.kTextSecondary.withOpacity(0.5) : AppColors.kTextSecondary,
            ),
            Text(
              'Page ${currentPage + 1} of $totalPages',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.kTextSecondary,
              ),
            ),
            IconButton(
              onPressed: isLastPage ? null : onNext,
              icon: const Icon(Icons.arrow_forward_ios),
              color: isLastPage ? AppColors.kTextSecondary.withOpacity(0.5) : AppColors.kTextSecondary,
            ),
          ],
        ),
      ),
    );
  }
}
