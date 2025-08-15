import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Simulated API Data ---
// This represents the raw JSON data you would get from an API call.
const List<Map<String, dynamic>> _apiData = [
  {'patientName': 'Arthur', 'patientImage': 'A', 'date': '12 May, 2023', 'time': '9:30 AM', 'doctor': 'Dr. John', 'reason': 'Fever', 'isCompleted': true},
  {'patientName': 'John Philips', 'patientImage': 'JP', 'date': '12 May, 2023', 'time': '9:30 AM', 'doctor': 'Dr. Joel', 'reason': 'Injury', 'isCompleted': true},
  {'patientName': 'Regina', 'patientImage': 'R', 'date': '11 May, 2023', 'time': '10:30 AM', 'doctor': 'Dr. Joel', 'reason': 'Knee Pain', 'isCompleted': true},
  {'patientName': 'David', 'patientImage': 'D', 'date': '11 May, 2023', 'time': '11:00 AM', 'doctor': 'Dr. John', 'reason': 'Fever', 'isCompleted': true},
  {'patientName': 'Joseph', 'patientImage': 'J', 'date': '10 May, 2023', 'time': '11:30 AM', 'doctor': 'Dr. John', 'reason': 'Throat pain', 'isCompleted': true},
  {'patientName': 'Lokesh', 'patientImage': 'L', 'date': '10 May, 2023', 'time': '11:00 AM', 'doctor': 'Dr. John', 'reason': 'Cold', 'isCompleted': true},
  {'patientName': 'Kanagaraj', 'patientImage': 'K', 'date': '09 May, 2023', 'time': '11:00 AM', 'doctor': 'Dr. John', 'reason': 'Cold', 'isCompleted': false},
];


// --- Data Models ---
class Appointment {
  final String patientName;
  final String patientImage; // Can be a URL or an initial
  final String date;
  final String time;
  final String doctor;
  final String reason;
  final bool isCompleted;

  Appointment({
    required this.patientName,
    required this.patientImage,
    required this.date,
    required this.time,
    required this.doctor,
    required this.reason,
    required this.isCompleted,
  });

  // Factory constructor to create an Appointment from a map (simulating JSON parsing)
  factory Appointment.fromMap(Map<String, dynamic> map) {
    return Appointment(
      patientName: map['patientName'],
      patientImage: map['patientImage'],
      date: map['date'],
      time: map['time'],
      doctor: map['doctor'],
      reason: map['reason'],
      isCompleted: map['isCompleted'],
    );
  }
}

// --- Main Dashboard Widget ---
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<List<Appointment>> _appointmentsFuture;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _appointmentsFuture = _fetchAppointments();
  }

  // Simulates fetching and parsing data from an API
  Future<List<Appointment>> _fetchAppointments() async {
    // Simulate a network delay
    await Future.delayed(const Duration(seconds: 2));
    // Parse the raw data into a list of Appointment objects
    return _apiData.map((data) => Appointment.fromMap(data)).toList();
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<Appointment>>(
        future: _appointmentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            final appointments = snapshot.data!;
            return _buildDashboardContent(context, appointments);
          } else {
            return const Center(child: Text('No appointments found.'));
          }
        },
      ),
    );
  }

  // Builds the main content of the dashboard once data is loaded
  Widget _buildDashboardContent(BuildContext context, List<Appointment> appointments) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 32),
          _buildSummaryCards(context),
          const SizedBox(height: 32),
          _buildAppointmentsTable(context, appointments),
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
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_none_rounded, size: 30, color: textSecondaryColor),
                  onPressed: () {},
                ),
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: primaryColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                    child: const Text(
                      '3',
                      style: TextStyle(color: Colors.white, fontSize: 8),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 20),
            const CircleAvatar(
              backgroundImage: NetworkImage('https://placehold.co/100x100/EFEFEF/A9A9A9?text=Admin'),
              radius: 24,
            ),
            const SizedBox(width: 12),
            Text(
              'Admin',
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

  Widget _buildSummaryCards(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isWide = constraints.maxWidth > 900;
        return isWide
            ? Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 2, child: _buildWelcomeCard(isWide)),
            const SizedBox(width: 24),
            Expanded(flex: 1, child: _buildWeeklyTargetCard()),
          ],
        )
            : Column(
          children: [
            _buildWelcomeCard(isWide),
            const SizedBox(height: 24),
            _buildWeeklyTargetCard(),
          ],
        );
      },
    );
  }

  Widget _buildWelcomeCard(bool isWide) {
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
                  'Welcome,',
                  style: GoogleFonts.poppins(color: Colors.white70, fontSize: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  'Admin',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Here is the summary of the clinic activities and performance.',
                  style: GoogleFonts.poppins(color: Colors.white.withOpacity(0.9), height: 1.5),
                ),
              ],
            ),
          ),
          if (isWide)
            Image.network(
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBagy25Cnmp324FbolwuK96LQOpnQOb4qYl5iTcVLe8GazBi_LP4O7Tph4dAqKKVCYGOKZrq-iX1Zz4_tRHv4qqgizLB2gHErY90foWhYArFfNld869JWB_03xT6EOaRumVZx1AvoP69qZ_1AUi2Ln2ZSf4XpRD7tnZ_9BzFxJc3PG_us24IbfU0w6KUsmjKWoriDaXKJSrW5FqYkDv6PNX73FTX5sfGVQCNTzPpyDn2zZX5C9RJC1JQtH-YvdMDzpGukA8vdaKfq0',
              width: 150,
              height: 150,
              fit: BoxFit.contain,
            )
        ],
      ),
    );
  }

  Widget _buildWeeklyTargetCard() {
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
        children: [
          SizedBox(
            width: 140,
            height: 140,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: 1.0,
                  strokeWidth: 12,
                  backgroundColor: primaryColorLight,
                  color: primaryColorLight.withOpacity(0.5),
                ),
                CircularProgressIndicator(
                  value: 0.65,
                  strokeWidth: 12,
                  valueColor: const AlwaysStoppedAnimation<Color>(primaryColor),
                  strokeCap: StrokeCap.round,
                ),
                Center(
                  child: Text(
                    '65%',
                    style: GoogleFonts.poppins(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: textPrimaryColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Weekly Target',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              color: textSecondaryColor,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentsTable(BuildContext context, List<Appointment> appointments) {
    final filteredAppointments = appointments
        .where((appt) => appt.patientName.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'APPOINTMENTS',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              Row(
                children: [
                  SizedBox(
                    width: 250,
                    child: TextField(
                      onChanged: (value) => setState(() => _searchQuery = value),
                      decoration: InputDecoration(
                        hintText: 'Search patient...',
                        hintStyle: GoogleFonts.poppins(color: textSecondaryColor),
                        prefixIcon: const Icon(Icons.search, color: textSecondaryColor),
                        filled: true,
                        fillColor: Colors.grey[50],
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: () { /* Handle new appointment */ },
                    icon: const Icon(Icons.add, size: 20),
                    label: Text('New', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      elevation: 2,
                      shadowColor: primaryColor.withOpacity(0.4),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: DataTable(
              headingRowHeight: 56,
              dataRowMinHeight: 64,
              dataRowMaxHeight: 64,
              columnSpacing: 20,
              headingTextStyle: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                color: textSecondaryColor,
              ),
              dataTextStyle: GoogleFonts.poppins(
                color: textPrimaryColor,
              ),
              columns: const [
                DataColumn(label: Text('PATIENT')),
                DataColumn(label: Text('DATE')),
                DataColumn(label: Text('TIME')),
                DataColumn(label: Text('DOCTOR')),
                DataColumn(label: Text('REASON')),
                DataColumn(label: Center(child: Text('STATUS'))),
                DataColumn(label: Center(child: Text('ACTIONS'))),
              ],
              rows: filteredAppointments.map((appt) => _buildDataRow(appt)).toList(),
            ),
          ),
        ],
      ),
    );
  }

  DataRow _buildDataRow(Appointment appt) {
    return DataRow(
      cells: [
        DataCell(Row(
          children: [
            CircleAvatar(
              backgroundColor: Color((appt.patientName.hashCode * 0xFFFFFF).toInt()).withOpacity(1.0),
              child: Text(
                appt.patientImage,
                style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 12),
            Text(appt.patientName),
          ],
        )),
        DataCell(Text(appt.date)),
        DataCell(Text(appt.time)),
        DataCell(Text(appt.doctor)),
        DataCell(Text(appt.reason)),
        DataCell(Center(
          child: Chip(
            label: Text(appt.isCompleted ? 'Completed' : 'Incomplete'),
            backgroundColor: appt.isCompleted ? const Color(0xFFD1FAE5) : primaryColorLight,
            labelStyle: GoogleFonts.poppins(
              color: appt.isCompleted ? const Color(0xFF065F46) : primaryColor,
              fontWeight: FontWeight.w600,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            side: BorderSide.none,
          ),
        )),
        DataCell(Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(icon: const Icon(Icons.visibility_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'View Details'),
            IconButton(icon: const Icon(Icons.edit_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'Edit'),
            IconButton(icon: const Icon(Icons.delete_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'Delete'),
          ],
        )),
      ],
    );
  }
}
