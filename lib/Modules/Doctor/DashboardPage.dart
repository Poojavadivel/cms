import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math';

// Import the centralized DashboardAppointments model
// Ensure this path correctly points to your models folder from DashboardPage.dart
import '../../Models/dashboardmodels.dart';
import 'widgets/Appoimentstable.dart';
import 'widgets/doctor_appointment_preview.dart'; // Assuming this widget exists for previewing appointments

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFCF1717);
const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF333333);
const Color textSecondaryColor = Color(0xFF666666);

// Specific colors used in the table
const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _intakeButtonColor = Color(0xFFF87171);


// --- Data Models ---
// The DashboardAppointments class definition is now in '../../../models/dashboard_appointment.dart';
// REMOVED the DashboardAppointment class definition from here to avoid type conflicts.

/// A container class to hold a list of [DashboardAppointments].
/// This is typically used to represent the overall data fetched for a dashboard or list view.


// --- Simulated API Data ---
final _dashboardApiData = DoctorDashboardData(
  appointments: [
    DashboardAppointments(patientName: 'Arthur', patientAge: 32, date: '05/12/2022', time: '9:30 AM', reason: 'Fever', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P001', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
    DashboardAppointments(patientName: 'John', patientAge: 28, date: '05/12/2022', time: '9:30 AM', reason: 'Injury', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P002', service: 'Emergency', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=J', isSelected: false),
    DashboardAppointments(patientName: 'Bhavana', patientAge: 20, date: '19/08/2025', time: '10:30 AM', reason: 'Head Ache', doctor: 'Dr. Joel', status: 'Completed', gender: 'Female', patientId: 'P003', service: 'Neurology Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=B', isSelected: false),
    DashboardAppointments(patientName: 'David', patientAge: 26, date: '05/12/2022', time: '11:00 AM', reason: 'Fever', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P004', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=D', isSelected: false),
    DashboardAppointments(patientName: 'Joseph', patientAge: 77, date: '05/12/2022', time: '11:30 AM', reason: 'Throat pain', doctor: 'Dr. John', status: 'Incomplete', gender: 'Male', patientId: 'P005', service: 'ENT Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=P', isSelected: false),
    DashboardAppointments(patientName: 'Lakesh', patientAge: 45, date: '05/12/2022', time: '12:00 PM', reason: 'Cold', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P006', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
    DashboardAppointments(patientName: 'Sophia', patientAge: 38, date: '05/12/2022', time: '12:30 PM', reason: 'Check-up', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P007', service: 'Pediatrics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=S', isSelected: false),
    DashboardAppointments(patientName: 'Ethan', patientAge: 52, date: '05/12/2022', time: '1:00 PM', reason: 'Follow-up', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Male', patientId: 'P008', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=E', isSelected: false),
    DashboardAppointments(patientName: 'Olivia', patientAge: 29, date: '05/12/2022', time: '2:00 PM', reason: 'Consultation', doctor: 'Dr. John', status: 'Completed', gender: 'Female', patientId: 'P009', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=O', isSelected: false),
    DashboardAppointments(patientName: 'Liam', patientAge: 35, date: '05/12/2022', time: '2:30 PM', reason: 'Headache', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P010', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
    DashboardAppointments(patientName: 'Ava', patientAge: 41, date: '05/12/2022', time: '3:00 PM', reason: 'Back Pain', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P011', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
  ],
);

// --- Main Doctor Dashboard Screen Widget ---
class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  late Future<DoctorDashboardData> _dashboardFuture;
  String _searchQuery = ''; // State for search query is now managed directly here for the dashboard content
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _dashboardFuture = _fetchDashboardData();
  }

  void _showAppointmentDetails(DashboardAppointments appointment) { // Changed to DashboardAppointments
    showDialog(
      context: context,
      builder: (BuildContext context) {
        // Assuming you have a widget named DoctorAppointmentPreview in widgets/doctor_appointment_preview.dart
        return DoctorAppointmentPreview(appointment: appointment);
      },
    );
  }

  void _onNewAppointmentPressed() {
    // Implement logic for creating a new appointment
    print('New Appointment button pressed from Dashboard!');
    // You might navigate to a new screen or show a form here.
  }

  Future<DoctorDashboardData> _fetchDashboardData() async {
    await Future.delayed(const Duration(seconds: 1));
    return _dashboardApiData;
  }

  void _updateSearchQuery(String value) {
    setState(() {
      _searchQuery = value;
      _currentPage = 0; // Reset page on new search
    });
  }

  void _goToNextPage() {
    setState(() {
      _currentPage++;
    });
  }

  void _goToPreviousPage() {
    setState(() {
      _currentPage--;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<DoctorDashboardData>(
        future: _dashboardFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return _buildDashboardContent(context, snapshot.data!);
          } else {
            return const Center(child: Text('Could not load dashboard data.'));
          }
        },
      ),
    );
  }

  Widget _buildDashboardContent(BuildContext context, DoctorDashboardData data) {
    final filteredAppointments = data.appointments
        .where((appt) => appt.patientName.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          _buildHeader(),
          const SizedBox(height: 24),
          _buildStatsAndWelcomeCards(),
          const SizedBox(height: 24),
          // Directly use AppointmentTable here
          Expanded(
            child: AppointmentTable(
              appointments: filteredAppointments,
              onShowAppointmentDetails: _showAppointmentDetails,
              onNewAppointmentPressed: _onNewAppointmentPressed,
              searchQuery: _searchQuery,
              onSearchChanged: _updateSearchQuery,
              currentPage: _currentPage,
              onNextPage: _goToNextPage,
              onPreviousPage: _goToPreviousPage,
            ),
          ),
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
          style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C)),
        ),
        Row(
          children: [
            // const Icon(Icons.notifications, color: Color(0xFFDC2626)),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFFCA5A5)),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 14,
                    backgroundImage: AssetImage('assets/sampledoctor.png'),
                    backgroundColor: Colors.transparent, // optional
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Renvord Atkin',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF991B1B), fontSize: 14),
                  ),
                ],
              ),
            ),
          ],
        )
      ],
    );
  }

  Widget _buildStatsAndWelcomeCards() {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isWide = constraints.maxWidth > 900;
        return isWide
            ? IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(flex: 2, child: _buildWelcomeCard()),
              const SizedBox(width: 24),
              Expanded(flex: 1, child: _buildStatsCard()),
              const SizedBox(width: 24),
              Expanded(flex: 1, child: _buildBarChartCard()),
            ],
          ),
        )
            : Column(
          children: [
            _buildWelcomeCard(),
            const SizedBox(height: 24),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(child: _buildStatsCard()),
                  const SizedBox(width: 24),
                  Expanded(child: _buildBarChartCard()),
                ],
              ),
            )
          ],
        );
      },
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Good Morning',
                  style: GoogleFonts.montserrat(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                    color: const Color(0xFF991B1B),
                  ),
                ),

                Text(
                  'Dr. Renvord Atkinson',
                  style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF7F1D1D)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Here is your dashboard to manage consultations with ease',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    height: 1.4,
                    color: const Color(0xFFB91C1C),
                  ),
                ),

              ],
            ),
          ),
          SizedBox(
            width: 100,
            height: 100, // add height here

            // color: Colors.white, // background color
            child: Image.asset(
              'assets/sampledoctor.png',
              fit: BoxFit.contain, height: 250,width: 1000,
            ),
          ),

        ],
      ),
    );
  }

  Widget _buildStatsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 70,
            height: 70,
            child: Stack(
              fit: StackFit.expand,
              children: [
                const CircularProgressIndicator(
                  value: 1.0,
                  strokeWidth: 6,
                  backgroundColor: Color(0xFFFECACA),
                  color: Color(0xFFFECACA),
                ),
                const CircularProgressIndicator(
                  value: 0.65,
                  strokeWidth: 6,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFF87171)),
                  strokeCap: StrokeCap.round,
                ),
                Center(
                  child: Text(
                    '65%',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF991B1B)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Weekly appointments completed',
            textAlign: TextAlign.center,
            style: GoogleFonts.lexend(color: const Color(0xFFB91C1C), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChartCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildBar(0.6, const Color(0xFFF87171)),
                _buildBar(0.8, const Color(0xFFFCA5A5)),
                _buildBar(0.5, const Color(0xFFF87171)),
                _buildBar(0.9, const Color(0xFFFEE2E2)),
                _buildBar(0.7, const Color(0xFFDC2626)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Weekly hours completed',
            textAlign: TextAlign.center,
            style: GoogleFonts.lexend(color: const Color(0xFFB91C1C), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(double heightFactor, Color color) {
    return FractionallySizedBox(
      heightFactor: heightFactor,
      child: Container(
        width: 8,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(4),
        ),
      ),
    );
  }
}
