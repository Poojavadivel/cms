import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math';

import 'widgets/doctor_appointment_preview.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFCF1717);
const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF333333);
const Color textSecondaryColor = Color(0xFF666666);

// --- Data Models ---
class DashboardAppointment {
  final String patientName;
  final int patientAge;
  final String date;
  final String time;
  final String reason;
  final String doctor;
  final String status;
  final String gender; // Used to select the correct local asset icon

  DashboardAppointment({
    required this.patientName,
    required this.patientAge,
    required this.date,
    required this.time,
    required this.reason,
    required this.doctor,
    required this.status,
    required this.gender,
  });
}

class DoctorDashboardData {
  final List<DashboardAppointment> appointments;
  DoctorDashboardData({required this.appointments});
}

// --- Simulated API Data ---
final _dashboardApiData = DoctorDashboardData(
  appointments: [
    DashboardAppointment(patientName: 'Arthur', patientAge: 32, date: '05/12/2022', time: '9:30 AM', reason: 'Fever', doctor: 'Dr. John', status: 'Completed', gender: 'Male'),
    DashboardAppointment(patientName: 'John', patientAge: 28, date: '05/12/2022', time: '9:30 AM', reason: 'Injury', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male'),
    DashboardAppointment(patientName: 'Bhavana', patientAge: 20, date: '19/08/2025', time: '10:30 AM', reason: 'Head Ache', doctor: 'Dr. Joel', status: 'Completed', gender: 'Female'),
    DashboardAppointment(patientName: 'David', patientAge: 26, date: '05/12/2022', time: '11:00 AM', reason: 'Fever', doctor: 'Dr. John', status: 'Completed', gender: 'Male'),
    DashboardAppointment(patientName: 'Joseph', patientAge: 77, date: '05/12/2022', time: '11:30 AM', reason: 'Throat pain', doctor: 'Dr. John', status: 'Incomplete', gender: 'Male'),
    DashboardAppointment(patientName: 'Lakesh', patientAge: 45, date: '05/12/2022', time: '12:00 PM', reason: 'Cold', doctor: 'Dr. John', status: 'Completed', gender: 'Male'),
    DashboardAppointment(patientName: 'Sophia', patientAge: 38, date: '05/12/2022', time: '12:30 PM', reason: 'Check-up', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female'),
    DashboardAppointment(patientName: 'Ethan', patientAge: 52, date: '05/12/2022', time: '1:00 PM', reason: 'Follow-up', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Male'),
    DashboardAppointment(patientName: 'Olivia', patientAge: 29, date: '05/12/2022', time: '2:00 PM', reason: 'Consultation', doctor: 'Dr. John', status: 'Completed', gender: 'Female'),
    DashboardAppointment(patientName: 'Liam', patientAge: 35, date: '05/12/2022', time: '2:30 PM', reason: 'Headache', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male'),
    DashboardAppointment(patientName: 'Ava', patientAge: 41, date: '05/12/2022', time: '3:00 PM', reason: 'Back Pain', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female'),
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
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _dashboardFuture = _fetchDashboardData();
  }
  void _showAppointmentDetails(DashboardAppointment appointment) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        // Assuming you have a widget named DoctorAppointmentPreview
        return DoctorAppointmentPreview(appointment: appointment);
      },
    );
  }
  Future<DoctorDashboardData> _fetchDashboardData() async {
    await Future.delayed(const Duration(seconds: 1));
    return _dashboardApiData;
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
          Expanded(child: _buildAppointmentsSection(filteredAppointments)),
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
            const Icon(Icons.notifications, color: Color(0xFFDC2626)),
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
                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w500, color: const Color(0xFF991B1B)),
                ),
                Text(
                  'Dr. Renvord Atkinson',
                  style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF7F1D1D)),
                ),
                const SizedBox(height: 8),
                Text(
                  'Here is your dashboard to manage consultations with ease',
                  style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFFB91C1C)),
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
            style: GoogleFonts.poppins(color: const Color(0xFFB91C1C), fontSize: 12),
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
            style: GoogleFonts.poppins(color: const Color(0xFFB91C1C), fontSize: 12),
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

  Widget _buildAppointmentsSection(List<DashboardAppointment> appointments) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'APPOINTMENTS',
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C)),
              ),
              Row(
                children: [
                  SizedBox(
                    width: 200,
                    child: TextField(
                      onChanged: (value) {
                        setState(() {
                          _searchQuery = value;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search patient name...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        isDense: true,
                        contentPadding: const EdgeInsets.all(10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Color(0xFFFCA5A5)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.add, size: 18,color: Colors.white,),
                    label: const Text('New Appointment'),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        textStyle: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600)
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: SingleChildScrollView(
              child: SizedBox(
                width: double.infinity,
                child: DataTable(
                  horizontalMargin: 0,
                  columnSpacing: 16,
                  columns: [
                    DataColumn(label: Text('Patient Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16))),
                    DataColumn(label: Padding(padding: EdgeInsets.only(left: 26), child: Text('Age', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: Color(0xFF991B1B), fontSize: 16),),),),
                    DataColumn(label: Padding(padding: EdgeInsets.only(left: 36),child: Text('Date', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16)))),
                    DataColumn(label: Padding(padding: EdgeInsets.only(left: 36),child: Text('Time', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16)))),
                    DataColumn(label: Padding(padding: EdgeInsets.only(left: 36),child: Text('Reason', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16)))),
                    DataColumn(label: Padding(padding: EdgeInsets.only(left: 36),child: Text('Status', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16)))),
                     DataColumn(label: Padding(padding: EdgeInsets.only(left: 76),child: Text('Actions', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16)))),
                  ],
                  rows: appointments.map((appt) => DataRow(
                      color: MaterialStateProperty.resolveWith<Color?>((Set<MaterialState> states) {
                        return appointments.indexOf(appt) % 2 == 0 ? null : const Color(0xFFFEF2F2);
                      }),
                      cells: [
                        DataCell(
                            Row(
                              children: [
                                CircleAvatar(
                                  backgroundImage: AssetImage(
                                      appt.gender == 'Male' ? 'assets/boyicon.png' : 'assets/girlicon.png'
                                  ),
                                  radius: 16,
                                ),
                                const SizedBox(width: 8),
                                Text(appt.patientName, style: const TextStyle(fontSize: 14)),
                              ],
                            )
                        ),
                        DataCell(Center(child: Text(appt.patientAge.toString(), style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.date, style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.time, style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.reason, style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.status, style: GoogleFonts.poppins(color: appt.status == 'Incomplete' ? const Color(0xFFDC2626) : textSecondaryColor, fontWeight: FontWeight.w600, fontSize: 14)))),
                        DataCell(
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFF87171),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    minimumSize: const Size(0, 24),
                                  ),
                                  child: const Text('Intake', style: TextStyle(fontSize: 12)),
                                ),
                                IconButton(icon: const Icon(Icons.edit, size: 18, color: Color(0xFFDC2626)), onPressed: () {}),
                                IconButton(icon: const Icon(Icons.delete, size: 18, color: Color(0xFFDC2626)), onPressed: () {}),
                                IconButton(icon: const Icon(Icons.remove_red_eye_outlined, size: 18, color: Color(0xFFDC2626)), onPressed: () => _showAppointmentDetails(appt)),
                              ],
                            )
                        ),
                      ])).toList(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
