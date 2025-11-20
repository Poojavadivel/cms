import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import '../../../Utils/Colors.dart';

/// Professional Follow-Up Calendar Popup
/// Displays comprehensive follow-up details when clicking on calendar events
/// Based on medical industry standards (Epic, Cerner, Athenahealth)
class FollowUpCalendarPopup extends StatelessWidget {
  final Map<String, dynamic> appointmentData;
  final VoidCallback? onScheduleAppointment;
  final VoidCallback? onClose;

  const FollowUpCalendarPopup({
    super.key,
    required this.appointmentData,
    this.onScheduleAppointment,
    this.onClose,
  });

  static Future<void> show({
    required BuildContext context,
    required Map<String, dynamic> appointmentData,
    VoidCallback? onScheduleAppointment,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => FollowUpCalendarPopup(
        appointmentData: appointmentData,
        onScheduleAppointment: onScheduleAppointment,
        onClose: () => Navigator.of(ctx).pop(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final followUp = appointmentData['followUp'] ?? {};
    final patient = appointmentData['patientId'] ?? {};
    final isRequired = followUp['isRequired'] ?? false;

    if (!isRequired) {
      return _buildBasicAppointmentView(context);
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 700),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(context, followUp),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPatientInfo(patient),
                    const SizedBox(height: 20),
                    _buildFollowUpDetails(followUp),
                    const SizedBox(height: 20),
                    _buildMedicalContext(followUp),
                    const SizedBox(height: 20),
                    _buildTestsAndProcedures(followUp),
                    const SizedBox(height: 20),
                    _buildMedicationInfo(followUp),
                  ],
                ),
              ),
            ),
            _buildActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicAppointmentView(BuildContext context) {
    final patient = appointmentData['patientId'] ?? {};
    final appointmentType = appointmentData['appointmentType'] ?? 'Consultation';
    final startAt = appointmentData['startAt'];
    final notes = appointmentData['notes'] ?? '';

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Iconsax.calendar, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointmentType,
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kTextPrimary,
                        ),
                      ),
                      if (startAt != null)
                        Text(
                          _formatDateTime(startAt),
                          style: GoogleFonts.roboto(
                            fontSize: 13,
                            color: AppColors.kTextSecondary,
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onClose,
                  icon: const Icon(Icons.close_rounded),
                  color: AppColors.kTextSecondary,
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildPatientInfo(patient),
            if (notes.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildInfoCard(
                icon: Iconsax.note_text,
                title: 'Notes',
                content: notes,
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onClose,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text('Close', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, Map<String, dynamic> followUp) {
    final priority = followUp['priority'] ?? 'Routine';
    final priorityColor = _getPriorityColor(priority);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [priorityColor, priorityColor.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Iconsax.calendar_tick, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Follow-Up Required',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  '$priority Priority',
                  style: GoogleFonts.roboto(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onClose,
            icon: const Icon(Icons.close_rounded, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildPatientInfo(Map<String, dynamic> patient) {
    final firstName = patient['firstName'] ?? '';
    final lastName = patient['lastName'] ?? '';
    final phone = patient['phone'] ?? '';
    final email = patient['email'] ?? '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.05),
            AppColors.primary.withOpacity(0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: AppColors.primary.withOpacity(0.1),
            child: Text(
              firstName.isNotEmpty ? firstName[0].toUpperCase() : 'P',
              style: GoogleFonts.poppins(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$firstName $lastName',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                if (phone.isNotEmpty)
                  Row(
                    children: [
                      Icon(Iconsax.call, size: 14, color: AppColors.kTextSecondary),
                      const SizedBox(width: 6),
                      Text(
                        phone,
                        style: GoogleFonts.roboto(
                          fontSize: 13,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                    ],
                  ),
                if (email.isNotEmpty)
                  Row(
                    children: [
                      Icon(Iconsax.sms, size: 14, color: AppColors.kTextSecondary),
                      const SizedBox(width: 6),
                      Text(
                        email,
                        style: GoogleFonts.roboto(
                          fontSize: 13,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFollowUpDetails(Map<String, dynamic> followUp) {
    final recommendedDate = followUp['recommendedDate'];
    final reason = followUp['reason'] ?? '';
    final instructions = followUp['instructions'] ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Follow-Up Details'),
        const SizedBox(height: 12),
        if (recommendedDate != null)
          _buildInfoCard(
            icon: Iconsax.calendar_1,
            title: 'Recommended Date',
            content: _formatDate(recommendedDate),
            iconColor: AppColors.kWarning,
          ),
        if (reason.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildInfoCard(
            icon: Iconsax.document_text,
            title: 'Reason',
            content: reason,
          ),
        ],
        if (instructions.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildInfoCard(
            icon: Iconsax.clipboard_text,
            title: 'Patient Instructions',
            content: instructions,
            iconColor: AppColors.kInfo,
          ),
        ],
      ],
    );
  }

  Widget _buildMedicalContext(Map<String, dynamic> followUp) {
    final diagnosis = followUp['diagnosis'] ?? '';
    final treatmentPlan = followUp['treatmentPlan'] ?? '';

    if (diagnosis.isEmpty && treatmentPlan.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Medical Context'),
        const SizedBox(height: 12),
        if (diagnosis.isNotEmpty)
          _buildInfoCard(
            icon: Iconsax.health,
            title: 'Diagnosis/Condition',
            content: diagnosis,
            iconColor: AppColors.kDanger,
          ),
        if (treatmentPlan.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildInfoCard(
            icon: Iconsax.clipboard_tick,
            title: 'Treatment Plan',
            content: treatmentPlan,
            iconColor: AppColors.kSuccess,
          ),
        ],
      ],
    );
  }

  Widget _buildTestsAndProcedures(Map<String, dynamic> followUp) {
    final labTests = followUp['labTests'] as List? ?? [];
    final imaging = followUp['imaging'] as List? ?? [];
    final procedures = followUp['procedures'] as List? ?? [];

    if (labTests.isEmpty && imaging.isEmpty && procedures.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Tests & Procedures'),
        const SizedBox(height: 12),
        if (labTests.isNotEmpty) _buildTestList('Lab Tests', labTests, Iconsax.health),
        if (imaging.isNotEmpty) ...[
          if (labTests.isNotEmpty) const SizedBox(height: 12),
          _buildTestList('Imaging', imaging, Iconsax.scan),
        ],
        if (procedures.isNotEmpty) ...[
          if (labTests.isNotEmpty || imaging.isNotEmpty) const SizedBox(height: 12),
          _buildTestList('Procedures', procedures, Iconsax.activity),
        ],
      ],
    );
  }

  Widget _buildTestList(String title, List tests, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...tests.map((test) {
            final testName = test['testName'] ?? test['imagingType'] ?? test['procedureName'] ?? '';
            final ordered = test['ordered'] ?? false;
            final completed = test['completed'] ?? false;
            final scheduled = test['scheduled'] ?? false;

            String status = 'Pending';
            Color statusColor = AppColors.kTextSecondary;
            IconData statusIcon = Iconsax.clock;

            if (completed) {
              status = 'Completed';
              statusColor = AppColors.kSuccess;
              statusIcon = Iconsax.tick_circle;
            } else if (ordered || scheduled) {
              status = 'Ordered';
              statusColor = AppColors.kWarning;
              statusIcon = Iconsax.timer_1;
            }

            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Icon(statusIcon, size: 16, color: statusColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      testName,
                      style: GoogleFonts.roboto(
                        fontSize: 13,
                        color: AppColors.kTextPrimary,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status,
                      style: GoogleFonts.roboto(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildMedicationInfo(Map<String, dynamic> followUp) {
    final prescriptionReview = followUp['prescriptionReview'] ?? false;
    final medicationCompliance = followUp['medicationCompliance'] ?? '';

    if (!prescriptionReview && medicationCompliance.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Medication'),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.grey50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.grey200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (prescriptionReview)
                Row(
                  children: [
                    Icon(Iconsax.health, size: 18, color: AppColors.kWarning),
                    const SizedBox(width: 8),
                    Text(
                      'Prescription Review Required',
                      style: GoogleFonts.roboto(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.kTextPrimary,
                      ),
                    ),
                  ],
                ),
              if (prescriptionReview && medicationCompliance.isNotEmpty)
                const SizedBox(height: 12),
              if (medicationCompliance.isNotEmpty)
                Row(
                  children: [
                    Icon(Iconsax.status, size: 18, color: _getComplianceColor(medicationCompliance)),
                    const SizedBox(width: 8),
                    Text(
                      'Compliance: $medicationCompliance',
                      style: GoogleFonts.roboto(
                        fontSize: 13,
                        color: AppColors.kTextPrimary,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActions(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        border: Border(top: BorderSide(color: AppColors.grey200)),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: onClose,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: BorderSide(color: AppColors.grey300),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Close',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: onScheduleAppointment ?? onClose,
              icon: const Icon(Iconsax.calendar_add, size: 18),
              label: Text(
                'Schedule Appointment',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: AppColors.kTextPrimary,
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String content,
    Color? iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: iconColor ?? AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.roboto(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  content,
                  style: GoogleFonts.roboto(
                    fontSize: 14,
                    color: AppColors.kTextPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'Critical':
        return const Color(0xFFDC2626);
      case 'Urgent':
        return const Color(0xFFEA580C);
      case 'Important':
        return const Color(0xFFF59E0B);
      case 'Routine':
      default:
        return const Color(0xFF059669);
    }
  }

  Color _getComplianceColor(String compliance) {
    switch (compliance) {
      case 'Good':
        return AppColors.kSuccess;
      case 'Fair':
        return AppColors.kWarning;
      case 'Poor':
        return AppColors.kDanger;
      default:
        return AppColors.kTextSecondary;
    }
  }

  String _formatDate(dynamic date) {
    try {
      DateTime dt;
      if (date is String) {
        dt = DateTime.parse(date);
      } else if (date is DateTime) {
        dt = date;
      } else {
        return '';
      }
      return DateFormat('MMM dd, yyyy').format(dt);
    } catch (e) {
      return '';
    }
  }

  String _formatDateTime(dynamic date) {
    try {
      DateTime dt;
      if (date is String) {
        dt = DateTime.parse(date);
      } else if (date is DateTime) {
        dt = date;
      } else {
        return '';
      }
      return DateFormat('MMM dd, yyyy hh:mm a').format(dt);
    } catch (e) {
      return '';
    }
  }
}
