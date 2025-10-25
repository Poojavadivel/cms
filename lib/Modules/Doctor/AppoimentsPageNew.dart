import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../Models/dashboardmodels.dart';
import '../../Models/appointment_draft.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'widgets/Addnewappoiments.dart';
import 'widgets/intakeform.dart';
import 'widgets/Editappoimentspage.dart';

class DoctorAppointmentsPageNew extends StatefulWidget {
  const DoctorAppointmentsPageNew({super.key});

  @override
  State<DoctorAppointmentsPageNew> createState() => _DoctorAppointmentsPageNewState();
}

class _DoctorAppointmentsPageNewState extends State<DoctorAppointmentsPageNew> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<DashboardAppointments> _appointments = [];
  List<DashboardAppointments> _filteredAppointments = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadAppointments();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      _applyFilters();
    }
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);
    try {
      final appointments = await AuthService.instance.fetchAppointments();
      setState(() {
        _appointments = appointments;
        _isLoading = false;
        _applyFilters();
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load appointments: $e')),
        );
      }
    }
  }

  void _applyFilters() {
    var filtered = _appointments;

    // Apply tab filter
    switch (_tabController.index) {
      case 0: // All
        break;
      case 1: // Upcoming
        filtered = filtered.where((a) => a.status.toLowerCase() == 'scheduled').toList();
        break;
      case 2: // Completed
        filtered = filtered.where((a) => a.status.toLowerCase() == 'completed').toList();
        break;
      case 3: // Cancelled
        filtered = filtered.where((a) => a.status.toLowerCase() == 'cancelled').toList();
        break;
    }

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((a) {
        return a.patientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            a.patientId.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            a.status.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }

    setState(() => _filteredAppointments = filtered);
  }

  void _onSearchChanged(String query) {
    setState(() => _searchQuery = query);
    _applyFilters();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildHeader(),
          _buildSearchBar(),
          _buildTabs(),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: const Color(0xFFE5E7EB))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'My Appointments',
                style: GoogleFonts.lexend(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Manage and track all patient appointments',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.kTextSecondary,
                ),
              ),
            ],
          ),
          ElevatedButton.icon(
            onPressed: () async {
              await showDialog(
                context: context,
                builder: (_) => Dialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Container(
                    width: 600,
                    padding: const EdgeInsets.all(24),
                    child: AddAppointmentForm(
                      onSubmit: (draft) async {
                        Navigator.pop(context, true);
                      },
                    ),
                  ),
                ),
              );
              if (mounted) _loadAppointments();
            },
            icon: const Icon(Iconsax.add, size: 20),
            label: Text('New Appointment', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Colors.white,
      child: TextField(
        onChanged: _onSearchChanged,
        decoration: InputDecoration(
          hintText: 'Search by patient name, ID, or status...',
          hintStyle: GoogleFonts.inter(color: AppColors.kTextSecondary),
          prefixIcon: Icon(Iconsax.search_normal, color: AppColors.kTextSecondary),
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: const Color(0xFFE5E7EB))),
      ),
      child: TabBar(
        controller: _tabController,
        labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 15),
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.kTextSecondary,
        indicatorColor: AppColors.primary,
        indicatorWeight: 3,
        tabs: [
          Tab(text: 'All (${_appointments.length})'),
          Tab(text: 'Upcoming (${_appointments.where((a) => a.status.toLowerCase() == 'scheduled').length})'),
          Tab(text: 'Completed (${_appointments.where((a) => a.status.toLowerCase() == 'completed').length})'),
          Tab(text: 'Cancelled (${_appointments.where((a) => a.status.toLowerCase() == 'cancelled').length})'),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_filteredAppointments.isEmpty) {
      return _buildEmptyState();
    }

    return _buildTable();
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.calendar_1, size: 64, color: AppColors.kTextSecondary.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            'No appointments found',
            style: GoogleFonts.lexend(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.kTextSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your filters or search query',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTable() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          children: [
            _buildTableHeader(),
            const Divider(height: 1),
            ..._filteredAppointments.map((appt) => _buildTableRow(appt)),
          ],
        ),
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Row(
        children: [
          _buildHeaderCell('Patient', flex: 3),
          _buildHeaderCell('Date & Time', flex: 2),
          _buildHeaderCell('Reason', flex: 2),
          _buildHeaderCell('Status', flex: 2),
          _buildHeaderCell('Actions', flex: 3),
        ],
      ),
    );
  }

  Widget _buildHeaderCell(String title, {int flex = 1}) {
    return Expanded(
      flex: flex,
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppColors.kTextSecondary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildTableRow(DashboardAppointments appt) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: const Color(0xFFE5E7EB))),
      ),
      child: Row(
        children: [
          _buildPatientCell(appt),
          _buildDateTimeCell(appt),
          _buildReasonCell(appt),
          _buildStatusCell(appt),
          _buildActionsCell(appt),
        ],
      ),
    );
  }

  Widget _buildPatientCell(DashboardAppointments appt) {
    final isMale = appt.gender.toLowerCase() == 'male';
    final isFemale = appt.gender.toLowerCase() == 'female';

    return Expanded(
      flex: 3,
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: isMale
                ? Colors.blue.shade50
                : isFemale
                    ? Colors.pink.shade50
                    : AppColors.primary.withOpacity(0.1),
            child: Icon(
              isMale
                  ? Iconsax.man
                  : isFemale
                      ? Iconsax.woman
                      : Iconsax.user,
              color: isMale
                  ? Colors.blue.shade700
                  : isFemale
                      ? Colors.pink.shade700
                      : AppColors.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appt.patientName,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'ID: ${appt.patientId}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateTimeCell(DashboardAppointments appt) {
    return Expanded(
      flex: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            appt.date,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.kTextPrimary,
            ),
          ),
          Text(
            appt.time,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReasonCell(DashboardAppointments appt) {
    return Expanded(
      flex: 2,
      child: Text(
        appt.reason.isNotEmpty ? appt.reason : 'General Consultation',
        style: GoogleFonts.inter(
          fontSize: 13,
          color: AppColors.kTextPrimary,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildStatusCell(DashboardAppointments appt) {
    final status = appt.status.toLowerCase();
    Color bgColor, textColor;

    switch (status) {
      case 'scheduled':
        bgColor = Colors.blue.shade50;
        textColor = Colors.blue.shade700;
        break;
      case 'completed':
        bgColor = Colors.green.shade50;
        textColor = Colors.green.shade700;
        break;
      case 'cancelled':
        bgColor = Colors.red.shade50;
        textColor = Colors.red.shade700;
        break;
      default:
        bgColor = Colors.grey.shade50;
        textColor = Colors.grey.shade700;
    }

    return Expanded(
      flex: 2,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          appt.status,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  Widget _buildActionsCell(DashboardAppointments appt) {
    return Expanded(
      flex: 3,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _buildActionButton(
            icon: Iconsax.document_text,
            label: 'Intake',
            onPressed: () async => await _intakeAppointment(appt),
            color: const Color(0xFF9333EA),
          ),
          const SizedBox(width: 8),
          _buildActionButton(
            icon: Iconsax.edit,
            label: 'Edit',
            onPressed: () async => await _editAppointment(appt),
            color: const Color(0xFF0EA5E9),
          ),
          const SizedBox(width: 8),
          _buildActionButton(
            icon: Iconsax.eye,
            label: 'View',
            onPressed: () async => await _viewIntakeDetails(appt),
            color: const Color(0xFF10B981),
          ),
          const SizedBox(width: 8),
          _buildActionButton(
            icon: Iconsax.trash,
            label: 'Delete',
            onPressed: () async => await _deleteAppointment(appt),
            color: const Color(0xFFEF4444),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Future<void> Function() onPressed,
    required Color color,
  }) {
    return Tooltip(
      message: label,
      child: InkWell(
        onTap: () async => await onPressed(),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _viewAppointment(DashboardAppointments appt) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Iconsax.calendar, color: AppColors.primary),
            const SizedBox(width: 12),
            Text('Appointment Details', style: GoogleFonts.lexend(fontWeight: FontWeight.w600)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDetailRow('Patient', appt.patientName),
              _buildDetailRow('Patient ID', appt.patientId),
              _buildDetailRow('Date', appt.date),
              _buildDetailRow('Time', appt.time),
              _buildDetailRow('Status', appt.status),
              if (appt.gender.isNotEmpty) _buildDetailRow('Gender', appt.gender),
              if (appt.reason.isNotEmpty) _buildDetailRow('Reason', appt.reason),
              if (appt.service.isNotEmpty) _buildDetailRow('Service', appt.service),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close', style: GoogleFonts.inter(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.kTextPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _intakeAppointment(DashboardAppointments appt) async {
    await showIntakeFormDialog(context, appt);
    if (mounted) {
      await _loadAppointments();
    }
  }

  Future<void> _viewIntakeDetails(DashboardAppointments appt) async {
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final patientId = appt.patientId.toString();
      final intakeData = await AuthService.instance.getIntakes(patientId: patientId, limit: 1);

      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog

      if (intakeData == null || (intakeData is List && intakeData.isEmpty)) {
        _showNoIntakeDialog(appt);
        return;
      }

      // Parse intake data
      dynamic intake = intakeData is List ? intakeData.first : intakeData;
      if (intake is Map && intake.containsKey('data') && intake['data'] is List && (intake['data'] as List).isNotEmpty) {
        intake = (intake['data'] as List).first;
      }

      _showIntakeDetailsDialog(appt, intake);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to load intake: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showNoIntakeDialog(DashboardAppointments appt) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Iconsax.info_circle, color: Colors.orange, size: 24),
            const SizedBox(width: 12),
            Text('No Intake Found', style: GoogleFonts.lexend(fontWeight: FontWeight.w600)),
          ],
        ),
        content: Text(
          'No intake records found for ${appt.patientName}.\n\nWould you like to create one now?',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.inter()),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _intakeAppointment(appt);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF9333EA),
              foregroundColor: Colors.white,
            ),
            child: Text('Create Intake', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _showIntakeDetailsDialog(DashboardAppointments appt, dynamic intake) {
    final vitals = intake is Map ? intake['vitals'] : null;
    final pharmacy = intake is Map && intake['pharmacy'] is List ? intake['pharmacy'] as List : [];
    final pathology = intake is Map && intake['pathology'] is List ? intake['pathology'] as List : [];
    final notes = intake is Map ? (intake['currentNotes'] ?? intake['notes'] ?? '') : '';

    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 800, maxHeight: 700),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Iconsax.document_text, color: AppColors.primary, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Intake Details',
                          style: GoogleFonts.lexend(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                        Text(
                          appt.patientName,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppColors.kTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const Divider(height: 32),
              Expanded(
                child: ListView(
                  children: [
                    // Vitals Section
                    if (vitals != null) ...[
                      _buildSectionTitle('Vitals'),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: Wrap(
                          spacing: 24,
                          runSpacing: 12,
                          children: [
                            _buildVitalChip('Height', '${vitals['heightCm'] ?? vitals['height_cm'] ?? 'N/A'} cm'),
                            _buildVitalChip('Weight', '${vitals['weightKg'] ?? vitals['weight_kg'] ?? 'N/A'} kg'),
                            _buildVitalChip('BMI', vitals['bmi']?.toString() ?? 'N/A'),
                            _buildVitalChip('SpO₂', '${vitals['spo2'] ?? 'N/A'}%'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Notes Section
                    if (notes.toString().isNotEmpty) ...[
                      _buildSectionTitle('Medical Notes'),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Text(
                          notes.toString(),
                          style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Pharmacy Section
                    if (pharmacy.isNotEmpty) ...[
                      _buildSectionTitle('Pharmacy (${pharmacy.length} items)'),
                      const SizedBox(height: 12),
                      ...pharmacy.map((med) => _buildMedicineCard(med)),
                      const SizedBox(height: 20),
                    ],

                    // Pathology Section
                    if (pathology.isNotEmpty) ...[
                      _buildSectionTitle('Pathology (${pathology.length} tests)'),
                      const SizedBox(height: 12),
                      ...pathology.map((test) => _buildTestCard(test)),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.lexend(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.kTextPrimary,
      ),
    );
  }

  Widget _buildVitalChip(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.kTextSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.kTextPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildMedicineCard(dynamic med) {
    final name = med['Medicine'] ?? med['name'] ?? 'Unknown';
    final dosage = med['Dosage'] ?? med['dosage'] ?? '';
    final frequency = med['Frequency'] ?? med['frequency'] ?? '';
    final notes = med['Notes'] ?? med['notes'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.purple.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.purple.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.health, size: 20, color: Colors.purple.shade700),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.kTextPrimary,
                  ),
                ),
              ),
            ],
          ),
          if (dosage.isNotEmpty || frequency.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                if (dosage.isNotEmpty) ...[
                  Text('Dosage: ', style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
                  Text(dosage, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 16),
                ],
                if (frequency.isNotEmpty) ...[
                  Text('Frequency: ', style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
                  Text(frequency, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
          ],
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Notes: $notes',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary, fontStyle: FontStyle.italic),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTestCard(dynamic test) {
    final name = test['Test Name'] ?? test['name'] ?? 'Unknown Test';
    final category = test['Category'] ?? test['category'] ?? '';
    final priority = test['Priority'] ?? test['priority'] ?? '';
    final notes = test['Notes'] ?? test['notes'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.activity, size: 20, color: Colors.green.shade700),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.kTextPrimary,
                  ),
                ),
              ),
            ],
          ),
          if (category.isNotEmpty || priority.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                if (category.isNotEmpty) ...[
                  Text('Category: ', style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
                  Text(category, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 16),
                ],
                if (priority.isNotEmpty) ...[
                  Text('Priority: ', style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
                  Text(priority, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
          ],
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Notes: $notes',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary, fontStyle: FontStyle.italic),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _editAppointment(DashboardAppointments appt) async {
    // Import at top: import 'widgets/Editappoimentspage.dart';
    // Import at top: import '../../Models/appointment_draft.dart';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 900, maxHeight: 700),
          padding: const EdgeInsets.all(24),
          child: EditAppointmentForm(
            appointmentId: appt.id,
            onSave: (updatedDraft) async {
              try {
                final success = await AuthService.instance.editAppointment(updatedDraft);
                if (success && mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✅ Appointment updated successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  _loadAppointments();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('❌ Failed to update: $e')),
                  );
                }
              }
            },
            onCancel: () => Navigator.of(ctx).pop(),
            onDelete: () async {
              Navigator.of(ctx).pop();
              _deleteAppointment(appt);
            },
          ),
        ),
      ),
    );
  }

  Future<void> _deleteAppointment(DashboardAppointments appt) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Iconsax.warning_2, color: Colors.red, size: 24),
            const SizedBox(width: 12),
            Text('Delete Appointment', style: GoogleFonts.lexend(fontWeight: FontWeight.w600)),
          ],
        ),
        content: Text(
          'Are you sure you want to delete the appointment for ${appt.patientName}?\n\nThis action cannot be undone.',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: GoogleFonts.inter()),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text('Delete', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final success = await AuthService.instance.deleteAppointment(appt.id);
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Appointment deleted successfully'),
              backgroundColor: Colors.green,
            ),
          );
          _loadAppointments();
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('❌ Failed to delete appointment'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('❌ Error: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }
}
