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
class Appointment {
  final String id;
  final String patientName;
  final String doctor;
  final String date;
  final String time;
  final String status;

  Appointment({
    required this.id,
    required this.patientName,
    required this.doctor,
    required this.date,
    required this.time,
    required this.status,
  });

  factory Appointment.fromMap(Map<String, dynamic> map) {
    return Appointment(
      id: map['id'],
      patientName: map['patientName'],
      doctor: map['doctor'],
      date: map['date'],
      time: map['time'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _appointmentsApiData = [
  {'id': 'APT-001', 'patientName': 'Arthur', 'doctor': 'Dr. John', 'date': '2025-08-14', 'time': '9:30 AM', 'status': 'Completed'},
  {'id': 'APT-002', 'patientName': 'John Philips', 'doctor': 'Dr. Joel', 'date': '2025-08-14', 'time': '10:00 AM', 'status': 'Completed'},
  {'id': 'APT-003', 'patientName': 'Regina', 'doctor': 'Dr. Joel', 'date': '2025-08-15', 'time': '10:30 AM', 'status': 'Pending'},
  {'id': 'APT-004', 'patientName': 'David', 'doctor': 'Dr. John', 'date': '2025-08-15', 'time': '11:00 AM', 'status': 'Cancelled'},
  {'id': 'APT-005', 'patientName': 'Joseph', 'doctor': 'Dr. John', 'date': '2025-08-16', 'time': '11:30 AM', 'status': 'Pending'},
  {'id': 'APT-006', 'patientName': 'Lokesh', 'doctor': 'Dr. Amelia', 'date': '2025-08-16', 'time': '12:00 PM', 'status': 'Completed'},
  {'id': 'APT-007', 'patientName': 'Sophia Miller', 'doctor': 'Dr. Evelyn', 'date': '2025-08-17', 'time': '9:00 AM', 'status': 'Pending'},
  {'id': 'APT-008', 'patientName': 'James Wilson', 'doctor': 'Dr. John', 'date': '2025-08-17', 'time': '9:30 AM', 'status': 'Completed'},
  {'id': 'APT-009', 'patientName': 'Olivia Garcia', 'doctor': 'Dr. Amelia', 'date': '2025-08-18', 'time': '10:00 AM', 'status': 'Pending'},
  {'id': 'APT-010', 'patientName': 'Liam Martinez', 'doctor': 'Dr. Joel', 'date': '2025-08-18', 'time': '10:30 AM', 'status': 'Cancelled'},
  {'id': 'APT-011', 'patientName': 'Emma Anderson', 'doctor': 'Dr. Evelyn', 'date': '2025-08-19', 'time': '11:00 AM', 'status': 'Completed'},
  {'id': 'APT-012', 'patientName': 'Noah Taylor', 'doctor': 'Dr. John', 'date': '2025-08-19', 'time': '11:30 AM', 'status': 'Pending'},
  {'id': 'APT-013', 'patientName': 'Ava Thomas', 'doctor': 'Dr. Amelia', 'date': '2025-08-20', 'time': '1:00 PM', 'status': 'Completed'},
  {'id': 'APT-014', 'patientName': 'Isabella White', 'doctor': 'Dr. Joel', 'date': '2025-08-20', 'time': '1:30 PM', 'status': 'Pending'},
  {'id': 'APT-015', 'patientName': 'Mason Harris', 'doctor': 'Dr. Evelyn', 'date': '2025-08-21', 'time': '2:00 PM', 'status': 'Completed'},
  {'id': 'APT-016', 'patientName': 'Mia Clark', 'doctor': 'Dr. John', 'date': '2025-08-21', 'time': '2:30 PM', 'status': 'Cancelled'},
  {'id': 'APT-017', 'patientName': 'Ethan Lewis', 'doctor': 'Dr. Amelia', 'date': '2025-08-22', 'time': '3:00 PM', 'status': 'Pending'},
  {'id': 'APT-018', 'patientName': 'Abigail Robinson', 'doctor': 'Dr. Joel', 'date': '2025-08-22', 'time': '3:30 PM', 'status': 'Completed'},
  {'id': 'APT-019', 'patientName': 'Michael Walker', 'doctor': 'Dr. John', 'date': '2025-08-23', 'time': '4:00 PM', 'status': 'Pending'},
  {'id': 'APT-020', 'patientName': 'Emily Hall', 'doctor': 'Dr. Evelyn', 'date': '2025-08-23', 'time': '4:30 PM', 'status': 'Completed'},
];

// --- Main Appointments Screen Widget ---
class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> with SingleTickerProviderStateMixin {
  late Future<List<Appointment>> _appointmentsFuture;
  String _searchQuery = '';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _appointmentsFuture = _fetchAppointments();
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

  Future<List<Appointment>> _fetchAppointments() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _appointmentsApiData.map((data) => Appointment.fromMap(data)).toList();
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

  Widget _buildAppointmentsContent(BuildContext context, List<Appointment> appointments) {
    final filteredAppointments = appointments
        .where((a) =>
    a.patientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        a.doctor.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        a.id.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Appointments',
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add, size: 20),
                label: Text('Add Appointment', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
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
          const SizedBox(height: 24),
          TextField(
            onChanged: (value) => setState(() => _searchQuery = value),
            decoration: InputDecoration(
              hintText: 'Search by patient, doctor, or ID',
              hintStyle: GoogleFonts.poppins(color: textSecondaryColor),
              prefixIcon: const Icon(Icons.search, color: textSecondaryColor),
              filled: true,
              fillColor: Colors.grey[50],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            ),
          ),
          const SizedBox(height: 24),
          _buildAppointmentsTable(context, filteredAppointments),
        ],
      ),
    );
  }

  Widget _buildAppointmentsTable(BuildContext context, List<Appointment> appointments) {
    return Container(
      width: double.infinity,
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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(Colors.grey[50]),
          headingTextStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: textSecondaryColor),
          dataTextStyle: GoogleFonts.poppins(color: textPrimaryColor),
          columnSpacing: 20,
          dataRowHeight: 64,
          columns: const [
            DataColumn(label: Text('APPOINTMENT ID')),
            DataColumn(label: Text('PATIENT')),
            DataColumn(label: Text('DOCTOR')),
            DataColumn(label: Text('DATE')),
            DataColumn(label: Text('TIME')),
            DataColumn(label: Center(child: Text('STATUS'))),
            DataColumn(label: Center(child: Text('ACTIONS'))),
          ],
          rows: appointments.map((a) => _buildDataRow(a)).toList(),
        ),
      ),
    );
  }

  DataRow _buildDataRow(Appointment appointment) {
    Color statusColor;
    Color statusBackgroundColor;

    switch (appointment.status) {
      case 'Completed':
        statusColor = const Color(0xFF065F46);
        statusBackgroundColor = const Color(0xFFD1FAE5);
        break;
      case 'Pending':
        statusColor = const Color(0xFF92400E);
        statusBackgroundColor = const Color(0xFFFEF3C7);
        break;
      case 'Cancelled':
        statusColor = const Color(0xFF991B1B);
        statusBackgroundColor = const Color(0xFFFEE2E2);
        break;
      default:
        statusColor = textSecondaryColor;
        statusBackgroundColor = Colors.grey.shade200;
    }

    return DataRow(
      cells: [
        DataCell(Text(appointment.id)),
        DataCell(Text(appointment.patientName, style: GoogleFonts.poppins(fontWeight: FontWeight.w500))),
        DataCell(Text(appointment.doctor)),
        DataCell(Text(appointment.date)),
        DataCell(Text(appointment.time)),
        DataCell(
          Center(
            child: Chip(
              label: Text(appointment.status),
              backgroundColor: statusBackgroundColor,
              labelStyle: GoogleFonts.poppins(
                color: statusColor,
                fontWeight: FontWeight.w600,
              ),
              side: BorderSide.none,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
        ),
        DataCell(
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(icon: const Icon(Icons.visibility_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'View Details'),
              IconButton(icon: const Icon(Icons.edit_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'Edit'),
              IconButton(icon: const Icon(Icons.delete_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'Delete'),
            ],
          ),
        ),
      ],
    );
  }
}
