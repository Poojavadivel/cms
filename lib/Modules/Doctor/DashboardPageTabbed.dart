import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'widgets/Appoimentstable.dart';
import 'widgets/Addnewappoiments.dart';
import '../../Models/Patients.dart';

class DoctorDashboardTabbedScreen extends StatefulWidget {
  const DoctorDashboardTabbedScreen({super.key});

  @override
  State<DoctorDashboardTabbedScreen> createState() =>
      _DoctorDashboardTabbedScreenState();
}

class _DoctorDashboardTabbedScreenState
    extends State<DoctorDashboardTabbedScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  bool _loading = false;
  List<DashboardAppointments> _appointments = [];
  String _searchQuery = '';
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAppointments() async {
    if (mounted) setState(() => _loading = true);
    try {
      final appointments = await AuthService.instance.fetchAppointments();
      if (mounted) {
        setState(() => _appointments = appointments ?? []);
      }
    } catch (e) {
      debugPrint("❌ Error loading appointments: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Failed to load appointments: $e")),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  PatientDetails _mapApptToPatient(DashboardAppointments appt) {
    return PatientDetails(
      patientId: appt.patientId,
      name: appt.patientName,
      gender: appt.gender,
      age: appt.patientAge,
      dateOfBirth: appt.dob,
      phone: '',
      address: appt.location,
      city: appt.location,
      bloodGroup: '',
      bmi: appt.bmi.toString(),
      height: appt.height.toString(),
      weight: appt.weight.toString(),
      doctorName: appt.doctor,
      notes: appt.currentNotes ?? '',
      lastVisitDate: appt.date,
      avatarUrl: appt.patientAvatarUrl,
      patientCode: appt.id,
      allergies: const [],
      medicalHistory: appt.diagnosis,
      emergencyContactName: '',
      emergencyContactPhone: '',
      doctorId: '',
      pincode: '',
      insuranceNumber: '',
      expiryDate: '',
    );
  }

  void _showAppointmentDetails(DashboardAppointments appointment) {
    final patient = _mapApptToPatient(appointment);
    showDialog(
      context: context,
      builder: (_) => Dialog(
        insetPadding: const EdgeInsets.all(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                appointment.patientName,
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Date: ${appointment.date}',
                style: GoogleFonts.inter(fontSize: 14),
              ),
              Text(
                'Time: ${appointment.time}',
                style: GoogleFonts.inter(fontSize: 14),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _onNewAppointmentPressed() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: AddAppointmentForm(),
      ),
    );
    if (result == true) await _loadAppointments();
  }

  void _deleteAppointment(DashboardAppointments appt) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Appointment"),
        content: Text("Delete ${appt.patientName}?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Delete", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    if (mounted) setState(() => _loading = true);
    try {
      final success = await AuthService.instance.deleteAppointment(appt.id);
      if (success && mounted) {
        await _loadAppointments();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("🗑️ ${appt.patientName} deleted"),
            backgroundColor: AppColors.kSuccess,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _updateSearchQuery(String value) {
    setState(() {
      _searchQuery = value;
      _currentPage = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final filteredAppointments = _appointments
        .where((appt) =>
            appt.patientName.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Header with Title
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(
                  color: Colors.grey.shade200,
                  width: 1,
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Doctor Dashboard',
                      style: GoogleFonts.poppins(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Manage your appointments and patients',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppColors.kTextSecondary,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.searchBorder),
                    borderRadius: BorderRadius.circular(999),
                    color: AppColors.rowAlternate,
                  ),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 16,
                        backgroundImage: AssetImage('assets/sampledoctor.png'),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Dr. Renvord',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Tab Bar
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.kTextSecondary,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              labelStyle: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
              unselectedLabelStyle: GoogleFonts.poppins(
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
              tabs: const [
                Tab(
                  icon: Icon(Iconsax.activity),
                  text: 'Overview',
                ),
                Tab(
                  icon: Icon(Iconsax.calendar),
                  text: 'Appointments',
                ),
                Tab(
                  icon: Icon(Iconsax.chart_2),
                  text: 'Statistics',
                ),
              ],
            ),
          ),

          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Overview
                _buildOverviewTab(),

                // Tab 2: Appointments
                _buildAppointmentsTab(filteredAppointments),

                // Tab 3: Statistics
                _buildStatisticsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ============ TAB 1: OVERVIEW ============
  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats Cards
          _buildStatsSection(),
          const SizedBox(height: 32),

          // Featured Appointment Card
          _buildFeaturedAppointmentCard(),
          const SizedBox(height: 32),

          // Quick Actions
          _buildQuickActionsSection(),
          const SizedBox(height: 32),

          // Recent Activity
          _buildRecentActivitySection(),
        ],
      ),
    );
  }

  Widget _buildStatsSection() {
    final stats = [
      {
        'label': 'Total Appointments',
        'value': _appointments.length.toString(),
        'icon': Iconsax.calendar,
        'color': AppColors.primary,
      },
      {
        'label': 'Completed Today',
        'value': '12',
        'icon': Iconsax.tick_circle,
        'color': const Color(0xFF00B894),
      },
      {
        'label': 'Pending',
        'value': '5',
        'icon': Iconsax.clock,
        'color': const Color(0xFFFFB84D),
      },
      {
        'label': 'Cancelled',
        'value': '2',
        'icon': Iconsax.close_circle,
        'color': const Color(0xFFFF6B6B),
      },
    ];

    return GridView.count(
      crossAxisCount: 4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.2,
      children: stats
          .map(
            (stat) => Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.grey.shade200,
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (stat['color'] as Color).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      stat['icon'] as IconData,
                      color: stat['color'] as Color,
                      size: 20,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    stat['value'] as String,
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    stat['label'] as String,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.kTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildFeaturedAppointmentCard() {
    if (_appointments.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Center(
          child: Text(
            'No appointments scheduled',
            style: GoogleFonts.inter(
              color: AppColors.kTextSecondary,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    final next = _appointments.first;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary,
            AppColors.primary.withOpacity(0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.2),
              image: next.patientAvatarUrl != null
                  ? DecorationImage(
                      image: NetworkImage(next.patientAvatarUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: next.patientAvatarUrl == null
                ? const Icon(Iconsax.user, color: Colors.white, size: 40)
                : null,
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Next Appointment',
                  style: GoogleFonts.inter(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  next.patientName,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Iconsax.clock, color: Colors.white70, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      next.time,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Icon(Iconsax.location, color: Colors.white70, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      next.location,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => _showAppointmentDetails(next),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('View Details'),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                icon: Iconsax.add_circle,
                label: 'New Appointment',
                onTap: _onNewAppointmentPressed,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionButton(
                icon: Iconsax.refresh,
                label: 'Refresh Data',
                onTap: _loadAppointments,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionButton(
                icon: Iconsax.export,
                label: 'Export Report',
                onTap: () {},
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivitySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 16),
        ..._appointments.take(3).map((appt) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary.withOpacity(0.1),
                  ),
                  child: const Icon(Iconsax.user, color: AppColors.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appt.patientName,
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '${appt.date} • ${appt.time}',
                        style: GoogleFonts.inter(
                          color: AppColors.kTextSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Iconsax.arrow_right_3,
                  color: AppColors.kTextSecondary,
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  // ============ TAB 2: APPOINTMENTS ============
  Widget _buildAppointmentsTab(List<DashboardAppointments> filtered) {
    return AppointmentTable(
      appointments: filtered,
      onShowAppointmentDetails: _showAppointmentDetails,
      onNewAppointmentPressed: _onNewAppointmentPressed,
      searchQuery: _searchQuery,
      onSearchChanged: _updateSearchQuery,
      currentPage: _currentPage,
      onNextPage: () => setState(() => _currentPage++),
      onPreviousPage: () => setState(
        () {
          if (_currentPage > 0) _currentPage--;
        },
      ),
      onDeleteAppointment: _deleteAppointment,
      onRefreshRequested: _loadAppointments,
      isLoading: _loading,
    );
  }

  // ============ TAB 3: STATISTICS ============
  Widget _buildStatisticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Performance Metrics',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 20),
          _buildStatisticsCards(),
          const SizedBox(height: 32),
          Text(
            'Appointment Status Breakdown',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          _buildStatusBreakdown(),
        ],
      ),
    );
  }

  Widget _buildStatisticsCards() {
    final stats = [
      {'title': 'Avg. Wait Time', 'value': '12 min', 'trend': '+5%'},
      {'title': 'Patient Satisfaction', 'value': '4.8/5.0', 'trend': '+2%'},
      {'title': 'Completion Rate', 'value': '95%', 'trend': '+3%'},
      {'title': 'No-Show Rate', 'value': '2.5%', 'trend': '-1%'},
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: stats
          .map(
            (stat) => Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    stat['title']!,
                    style: GoogleFonts.inter(
                      color: AppColors.kTextSecondary,
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    stat['value']!,
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    stat['trend']!,
                    style: GoogleFonts.inter(
                      color: stat['trend']!.startsWith('+')
                          ? const Color(0xFF00B894)
                          : const Color(0xFF00B894),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildStatusBreakdown() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          _buildStatusRow('Completed', 45, const Color(0xFF00B894)),
          _buildStatusRow('Scheduled', 30, AppColors.primary),
          _buildStatusRow('Pending', 15, const Color(0xFFFFB84D)),
          _buildStatusRow('Cancelled', 10, const Color(0xFFFF6B6B)),
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, int percentage, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            Text(
              '$percentage%',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: percentage / 100,
            minHeight: 8,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation(color),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

