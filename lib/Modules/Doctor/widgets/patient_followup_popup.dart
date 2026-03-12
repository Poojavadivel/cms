import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

/// Patient Follow-Up Details Popup
/// Shows EXACT follow-up details entered in intake form for specific patient
class PatientFollowUpPopup extends StatefulWidget {
  final String patientId;
  final String patientName;

  const PatientFollowUpPopup({
    super.key,
    required this.patientId,
    required this.patientName,
  });

  static Future<void> show({
    required BuildContext context,
    required String patientId,
    required String patientName,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => PatientFollowUpPopup(
        patientId: patientId,
        patientName: patientName,
      ),
    );
  }

  @override
  State<PatientFollowUpPopup> createState() => _PatientFollowUpPopupState();
}

class _PatientFollowUpPopupState extends State<PatientFollowUpPopup> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _followUps = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadPatientFollowUps();
  }

  Future<void> _loadPatientFollowUps() async {
    setState(() => _isLoading = true);

    try {
      // Fetch appointments for this patient that have follow-up data
      final response = await AuthService.instance.get(
        '/api/appointments?patientId=${widget.patientId}&hasFollowUp=true',
      );

      if (response != null && response['appointments'] != null) {
        final appointments = List<Map<String, dynamic>>.from(response['appointments']);
        
        // Filter appointments that have follow-up requirements
        final followUpAppointments = appointments.where((apt) {
          final followUp = apt['followUp'];
          return followUp != null && followUp['isRequired'] == true;
        }).toList();

        // Sort by date (newest first)
        followUpAppointments.sort((a, b) {
          final dateA = DateTime.tryParse(a['startAt'] ?? '') ?? DateTime.now();
          final dateB = DateTime.tryParse(b['startAt'] ?? '') ?? DateTime.now();
          return dateB.compareTo(dateA);
        });

        setState(() {
          _followUps = followUpAppointments;
          _isLoading = false;
        });
      } else {
        setState(() {
          _followUps = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load follow-ups: $e';
        _isLoading = false;
      });
      debugPrint('Error loading patient follow-ups: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 700, maxHeight: 800),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(),
            Flexible(
              child: _isLoading
                  ? _buildLoading()
                  : _errorMessage != null
                      ? _buildError()
                      : _followUps.isEmpty
                          ? _buildEmpty()
                          : _buildFollowUpsList(),
            ),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)],
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
                  'Follow-Up History',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  widget.patientName,
                  style: GoogleFonts.roboto(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close_rounded, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(40),
        child: CircularProgressIndicator(),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Iconsax.close_circle, size: 64, color: AppColors.kDanger),
            const SizedBox(height: 16),
            Text(
              'Error',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Unknown error',
              style: GoogleFonts.roboto(fontSize: 14, color: AppColors.kTextSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Iconsax.calendar_remove,
              size: 64,
              color: AppColors.kTextSecondary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No Follow-Ups Found',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This patient has no follow-up appointments scheduled',
              style: GoogleFonts.roboto(
                fontSize: 14,
                color: AppColors.kTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFollowUpsList() {
    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: _followUps.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        return _buildFollowUpCard(_followUps[index]);
      },
    );
  }

  Widget _buildFollowUpCard(Map<String, dynamic> appointment) {
    final followUp = appointment['followUp'] as Map<String, dynamic>? ?? {};
    final appointmentDate = DateTime.tryParse(appointment['startAt'] ?? '');
    final priority = followUp['priority'] ?? 'Routine';
    final recommendedDate = followUp['recommendedDate'] != null
        ? DateTime.tryParse(followUp['recommendedDate'])
        : null;

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          // Header with date and priority
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _getPriorityColor(priority).withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Icon(Iconsax.calendar, color: _getPriorityColor(priority), size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Appointment Date',
                        style: GoogleFonts.roboto(
                          fontSize: 12,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                      Text(
                        appointmentDate != null
                            ? DateFormat('MMM dd, yyyy').format(appointmentDate)
                            : 'Unknown date',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getPriorityColor(priority),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    priority,
                    style: GoogleFonts.roboto(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Recommended Follow-Up Date
                if (recommendedDate != null) ...[
                  _buildInfoRow(
                    icon: Iconsax.calendar_1,
                    label: 'Recommended Follow-Up',
                    value: DateFormat('MMM dd, yyyy').format(recommendedDate),
                    color: AppColors.kWarning,
                  ),
                  const SizedBox(height: 12),
                ],

                // Reason
                if (followUp['reason'] != null && followUp['reason'].toString().isNotEmpty) ...[
                  _buildInfoRow(
                    icon: Iconsax.document_text,
                    label: 'Reason',
                    value: followUp['reason'],
                  ),
                  const SizedBox(height: 12),
                ],

                // Instructions
                if (followUp['instructions'] != null &&
                    followUp['instructions'].toString().isNotEmpty) ...[
                  _buildInfoRow(
                    icon: Iconsax.clipboard_text,
                    label: 'Patient Instructions',
                    value: followUp['instructions'],
                    color: AppColors.kInfo,
                  ),
                  const SizedBox(height: 12),
                ],

                // Diagnosis
                if (followUp['diagnosis'] != null && followUp['diagnosis'].toString().isNotEmpty) ...[
                  _buildInfoRow(
                    icon: Iconsax.health,
                    label: 'Diagnosis/Condition',
                    value: followUp['diagnosis'],
                    color: AppColors.kDanger,
                  ),
                  const SizedBox(height: 12),
                ],

                // Treatment Plan
                if (followUp['treatmentPlan'] != null &&
                    followUp['treatmentPlan'].toString().isNotEmpty) ...[
                  _buildInfoRow(
                    icon: Iconsax.clipboard_tick,
                    label: 'Treatment Plan',
                    value: followUp['treatmentPlan'],
                    color: AppColors.kSuccess,
                  ),
                  const SizedBox(height: 12),
                ],

                // Lab Tests
                if (followUp['labTests'] != null && (followUp['labTests'] as List).isNotEmpty) ...[
                  const Divider(height: 24),
                  _buildTestsSection(
                    title: 'Lab Tests',
                    icon: Iconsax.health,
                    tests: List<Map<String, dynamic>>.from(followUp['labTests']),
                  ),
                ],

                // Imaging
                if (followUp['imaging'] != null && (followUp['imaging'] as List).isNotEmpty) ...[
                  const Divider(height: 24),
                  _buildTestsSection(
                    title: 'Imaging',
                    icon: Iconsax.scan,
                    tests: List<Map<String, dynamic>>.from(followUp['imaging']),
                  ),
                ],

                // Procedures
                if (followUp['procedures'] != null && (followUp['procedures'] as List).isNotEmpty) ...[
                  const Divider(height: 24),
                  _buildTestsSection(
                    title: 'Procedures',
                    icon: Iconsax.activity,
                    tests: List<Map<String, dynamic>>.from(followUp['procedures']),
                  ),
                ],

                // Medication
                if (followUp['prescriptionReview'] == true ||
                    (followUp['medicationCompliance'] != null &&
                        followUp['medicationCompliance'] != 'Unknown')) ...[
                  const Divider(height: 24),
                  _buildMedicationSection(followUp),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    Color? color,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: color ?? AppColors.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.roboto(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: GoogleFonts.roboto(
                  fontSize: 14,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTestsSection({
    required String title,
    required IconData icon,
    required List<Map<String, dynamic>> tests,
  }) {
    return Column(
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
        const SizedBox(height: 12),
        ...tests.map((test) {
          final testName = test['testName'] ?? test['imagingType'] ?? test['procedureName'] ?? '';
          final completed = test['completed'] ?? false;
          final ordered = test['ordered'] ?? test['scheduled'] ?? false;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Icon(
                  completed
                      ? Iconsax.tick_circle
                      : ordered
                          ? Iconsax.timer_1
                          : Iconsax.clock,
                  size: 16,
                  color: completed
                      ? AppColors.kSuccess
                      : ordered
                          ? AppColors.kWarning
                          : AppColors.kTextSecondary,
                ),
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
                    color: (completed
                            ? AppColors.kSuccess
                            : ordered
                                ? AppColors.kWarning
                                : AppColors.kTextSecondary)
                        .withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    completed
                        ? 'Completed'
                        : ordered
                            ? 'Ordered'
                            : 'Pending',
                    style: GoogleFonts.roboto(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: completed
                          ? AppColors.kSuccess
                          : ordered
                              ? AppColors.kWarning
                              : AppColors.kTextSecondary,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildMedicationSection(Map<String, dynamic> followUp) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Iconsax.health, size: 18, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Medication',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (followUp['prescriptionReview'] == true)
          Row(
            children: [
              Icon(Iconsax.document_text, size: 16, color: AppColors.kWarning),
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
        if (followUp['prescriptionReview'] == true &&
            followUp['medicationCompliance'] != null &&
            followUp['medicationCompliance'] != 'Unknown')
          const SizedBox(height: 8),
        if (followUp['medicationCompliance'] != null &&
            followUp['medicationCompliance'] != 'Unknown')
          Row(
            children: [
              Icon(
                Iconsax.status,
                size: 16,
                color: _getComplianceColor(followUp['medicationCompliance']),
              ),
              const SizedBox(width: 8),
              Text(
                'Compliance: ${followUp['medicationCompliance']}',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        border: Border(top: BorderSide(color: AppColors.grey200)),
      ),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () => Navigator.of(context).pop(),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(
            'Close',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ),
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
}
