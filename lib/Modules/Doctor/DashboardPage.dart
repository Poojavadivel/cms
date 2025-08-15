import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Data Models ---
class DoctorDashboardStats {
  final int todaysAppointments;
  final int totalPatients;
  final int pendingReports;

  DoctorDashboardStats({
    required this.todaysAppointments,
    required this.totalPatients,
    required this.pendingReports,
  });
}

class UpcomingAppointment {
  final String patientName;
  final String time;
  final String reason;

  UpcomingAppointment({
    required this.patientName,
    required this.time,
    required this.reason,
  });
}

// --- Simulated API Data ---
final _dashboardStatsData = DoctorDashboardStats(
  todaysAppointments: 8,
  totalPatients: 124,
  pendingReports: 5,
);

final List<UpcomingAppointment> _upcomingAppointmentsData = [
  UpcomingAppointment(patientName: 'Regina', time: '10:30 AM', reason: 'Follow-up Consultation'),
  UpcomingAppointment(patientName: 'David', time: '11:00 AM', reason: 'Annual Check-up'),
  UpcomingAppointment(patientName: 'Joseph', time: '11:30 AM', reason: 'Prescription Refill'),
  UpcomingAppointment(patientName: 'Sophia Miller', time: '2:00 PM', reason: 'New Patient Visit'),
];

// --- Main Doctor Dashboard Screen Widget ---
class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> with SingleTickerProviderStateMixin {
  late Future<DoctorDashboardStats> _statsFuture;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _statsFuture = _fetchDashboardData();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<DoctorDashboardStats> _fetchDashboardData() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _dashboardStatsData;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<DoctorDashboardStats>(
        future: _statsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildDashboardContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('Could not load dashboard data.'));
          }
        },
      ),
    );
  }

  Widget _buildDashboardContent(BuildContext context, DoctorDashboardStats stats) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 32),
          _buildWelcomeCard(),
          const SizedBox(height: 32),
          _buildStatsGrid(stats),
          const SizedBox(height: 32),
          _buildUpcomingAppointments(),
        ],
      ),
    );
  }

  // --- WIDGET BUILDER METHODS ---

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Dashboard',
          style: GoogleFonts.poppins(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
        Row(
          children: [
            const CircleAvatar(
              backgroundImage: NetworkImage('https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
              radius: 24,
            ),
            const SizedBox(width: 12),
            Text(
              'Dr. Amelia Harper',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [primaryColor, Color(0xFFFF6B6B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: primaryColor.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back, Dr. Harper!',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'You have ${_dashboardStatsData.todaysAppointments} appointments scheduled for today.',
                  style: GoogleFonts.poppins(color: Colors.white.withOpacity(0.9), height: 1.5, fontSize: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(DoctorDashboardStats stats) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      crossAxisSpacing: 24,
      mainAxisSpacing: 24,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _buildStatCard(Icons.calendar_today_rounded, 'Today\'s Appointments', stats.todaysAppointments.toString()),
        _buildStatCard(Icons.groups_rounded, 'Total Patients', stats.totalPatients.toString()),
        _buildStatCard(Icons.pending_actions_rounded, 'Pending Reports', stats.pendingReports.toString()),
      ],
    );
  }

  Widget _buildStatCard(IconData icon, String title, String value) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: primaryColor, size: 32),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.poppins(color: textSecondaryColor, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingAppointments() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Upcoming Appointments',
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 16),
          ..._upcomingAppointmentsData.map((appt) => _buildAppointmentTile(appt)).toList(),
        ],
      ),
    );
  }

  Widget _buildAppointmentTile(UpcomingAppointment appointment) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: primaryColorLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person_rounded, color: primaryColor),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appointment.patientName,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: textPrimaryColor),
                ),
                Text(
                  appointment.reason,
                  style: GoogleFonts.poppins(color: textSecondaryColor),
                ),
              ],
            ),
          ),
          Text(
            appointment.time,
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: textPrimaryColor),
          ),
        ],
      ),
    );
  }
}
