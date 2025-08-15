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
class DoctorAppointment {
  final String id;
  final String patientName;
  final String time;
  final String reason;
  final String status;
  final String avatarUrl;

  DoctorAppointment({
    required this.id,
    required this.patientName,
    required this.time,
    required this.reason,
    required this.status,
    required this.avatarUrl,
  });

  factory DoctorAppointment.fromMap(Map<String, dynamic> map) {
    return DoctorAppointment(
      id: map['id'],
      patientName: map['patientName'],
      time: map['time'],
      reason: map['reason'],
      status: map['status'],
      avatarUrl: map['avatarUrl'],
    );
  }
}

// --- Simulated API Data ---
final List<Map<String, dynamic>> _appointmentsApiData = [
  {'id': 'APT-003', 'patientName': 'Regina', 'time': '10:30 AM', 'reason': 'Follow-up Consultation', 'status': 'Upcoming', 'avatarUrl': 'https://placehold.co/100x100/E9D5FF/5B21B6?text=R'},
  {'id': 'APT-004', 'patientName': 'David', 'time': '11:00 AM', 'reason': 'Annual Check-up', 'status': 'Upcoming', 'avatarUrl': 'https://placehold.co/100x100/A7F3D0/047857?text=D'},
  {'id': 'APT-005', 'patientName': 'Joseph', 'time': '11:30 AM', 'reason': 'Prescription Refill', 'status': 'Upcoming', 'avatarUrl': 'https://placehold.co/100x100/BAE6FD/0C4A6E?text=J'},
  {'id': 'APT-001', 'patientName': 'Arthur', 'time': '9:30 AM', 'reason': 'Initial Consultation', 'status': 'Completed', 'avatarUrl': 'https://placehold.co/100x100/FBCFE8/831843?text=A'},
  {'id': 'APT-002', 'patientName': 'John Philips', 'time': '10:00 AM', 'reason': 'Post-Op Checkup', 'status': 'Completed', 'avatarUrl': 'https://placehold.co/100x100/F5D0A9/7C2D12?text=JP'},
  {'id': 'APT-006', 'patientName': 'Lokesh', 'time': '12:00 PM', 'reason': 'Allergy Test Results', 'status': 'Completed', 'avatarUrl': 'https://placehold.co/100x100/D1FAE5/065F46?text=L'},
  {'id': 'APT-010', 'patientName': 'Liam Martinez', 'time': '2:30 PM', 'reason': 'Routine Physical', 'status': 'Cancelled', 'avatarUrl': 'https://placehold.co/100x100/BFDBFE/1E40AF?text=LM'},
];

// --- Main Doctor Appointments Screen Widget ---
class DoctorAppointmentsScreen extends StatefulWidget {
  const DoctorAppointmentsScreen({super.key});

  @override
  State<DoctorAppointmentsScreen> createState() => _DoctorAppointmentsScreenState();
}

class _DoctorAppointmentsScreenState extends State<DoctorAppointmentsScreen> with TickerProviderStateMixin {
  late Future<List<DoctorAppointment>> _appointmentsFuture;
  late TabController _tabController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    // Initialize controllers before they are used.
    _tabController = TabController(length: 4, vsync: this);
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    // Fetch data after all initializations are complete.
    _appointmentsFuture = _fetchAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<List<DoctorAppointment>> _fetchAppointments() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _appointmentsApiData.map((data) => DoctorAppointment.fromMap(data)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<DoctorAppointment>>(
        future: _appointmentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildAppointmentsContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('No appointments found.'));
          }
        },
      ),
    );
  }

  Widget _buildAppointmentsContent(BuildContext context, List<DoctorAppointment> appointments) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 32),
          _buildTabs(appointments),
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
          'My Appointments',
          style: GoogleFonts.poppins(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
        // const CircleAvatar(
        //   backgroundImage: NetworkImage('https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
        //   radius: 32,
        // ),
      ],
    );
  }

  Widget _buildTabs(List<DoctorAppointment> appointments) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold),
          unselectedLabelStyle: GoogleFonts.poppins(),
          labelColor: primaryColor,
          unselectedLabelColor: textSecondaryColor,
          indicatorColor: primaryColor,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Upcoming'),
            Tab(text: 'Completed'),
            Tab(text: 'Cancelled'),
          ],
        ),
        const SizedBox(height: 24),
        SizedBox(
          height: 600, // Adjust height as needed
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildAppointmentList(appointments),
              _buildAppointmentList(appointments.where((a) => a.status == 'Upcoming').toList()),
              _buildAppointmentList(appointments.where((a) => a.status == 'Completed').toList()),
              _buildAppointmentList(appointments.where((a) => a.status == 'Cancelled').toList()),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAppointmentList(List<DoctorAppointment> appointments) {
    if (appointments.isEmpty) {
      return Center(
        child: Text(
          'No appointments in this category.',
          style: GoogleFonts.poppins(color: textSecondaryColor, fontSize: 16),
        ),
      );
    }
    return ListView.builder(
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        return _buildAppointmentCard(appointments[index]);
      },
    );
  }

  Widget _buildAppointmentCard(DoctorAppointment appointment) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 4,
      shadowColor: Colors.black.withOpacity(0.05),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Row(
          children: [
            CircleAvatar(
              backgroundImage: NetworkImage(appointment.avatarUrl),
              radius: 28,
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appointment.patientName,
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textPrimaryColor, fontSize: 18),
                  ),
                  Text(
                    appointment.reason,
                    style: GoogleFonts.poppins(color: textSecondaryColor),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  appointment.time,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: textPrimaryColor, fontSize: 16),
                ),
                Chip(
                  label: Text(appointment.status),
                  backgroundColor: _getStatusColor(appointment.status).withOpacity(0.1),
                  labelStyle: GoogleFonts.poppins(color: _getStatusColor(appointment.status), fontWeight: FontWeight.w600),
                  side: BorderSide.none,
                ),
              ],
            ),
            const SizedBox(width: 20),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Text('View Chart'),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Upcoming':
        return Colors.blue;
      case 'Completed':
        return Colors.green;
      case 'Cancelled':
        return Colors.red;
      default:
        return textSecondaryColor;
    }
  }
}
