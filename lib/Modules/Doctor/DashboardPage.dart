import 'package:flutter/material.dart';
import 'package:glowhair/Modules/Doctor/widgets/Addnewappoiments.dart';
import 'package:google_fonts/google_fonts.dart';

// Import your models + services
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import 'widgets/Appoimentstable.dart';
import 'widgets/doctor_appointment_preview.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFCF1717);
const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF333333);
const Color textSecondaryColor = Color(0xFF666666);

const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _intakeButtonColor = Color(0xFFF87171);

// --- Main Doctor Dashboard Screen Widget ---
class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  late Future<DoctorDashboardData> _dashboardFuture;
  String _searchQuery = '';
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _dashboardFuture = _fetchDashboardData();
  }

  Future<DoctorDashboardData> _fetchDashboardData() async {
    print("🌍 Fetching appointments from backend...");
    final appointments = await AuthService.instance.fetchAppointments();
    print("📊 Backend returned ${appointments.length} appointments");
    return DoctorDashboardData(appointments: appointments);
  }

  void _showAppointmentDetails(DashboardAppointments appointment) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return DoctorAppointmentPreview(appointment: appointment);
      },
    );
  }

  void _onNewAppointmentPressed() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(16),
          child: AddAppointmentForm(),
        );
      },
    );

    print("📥 Dialog closed, result = $result");

    if (result == true) {
      print("🔄 Forcing refresh with new data...");
      final newData = await _fetchDashboardData();
      setState(() {
        _dashboardFuture = Future.value(newData); // ✅ new resolved future
      });
    }
  }

  void _deleteAppointment(DashboardAppointments appt) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Appointment"),
        content: Text("Are you sure you want to delete ${appt.patientName}?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("Delete")),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final success = await AuthService.instance.deleteAppointment(appt.id);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("✅ Deleted ${appt.patientName}")),
        );
        setState(() {
          _dashboardFuture = _fetchDashboardData();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("❌ Failed to delete ${appt.patientName}")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("💥 Error: $e")),
      );
    }
  }



  void _updateSearchQuery(String value) {
    setState(() {
      _searchQuery = value;
      _currentPage = 0;
    });
  }

  void _goToNextPage() {
    setState(() => _currentPage++);
  }

  void _goToPreviousPage() {
    setState(() => _currentPage--);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<DoctorDashboardData>(
        future: _dashboardFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
                child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return _buildDashboardContent(context, snapshot.data!);
          } else {
            return const Center(
                child: Text('Could not load dashboard data.'));
          }
        },
      ),
    );
  }

  Widget _buildDashboardContent(
      BuildContext context, DoctorDashboardData data) {
    final filteredAppointments = data.appointments
        .where((appt) =>
        appt.patientName.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          _buildHeader(),
          const SizedBox(height: 24),
          _buildStatsAndWelcomeCards(),
          const SizedBox(height: 24),
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

  // --- HEADER + CARDS ---

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Dashboard',
          style: GoogleFonts.poppins(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: const Color(0xFFB91C1C),
          ),
        ),
        Row(
          children: [
            const SizedBox(width: 16),
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFFCA5A5)),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 14,
                    backgroundImage: AssetImage('assets/sampledoctor.png'),
                    backgroundColor: Colors.transparent,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Renvord Atkin',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF991B1B),
                      fontSize: 14,
                    ),
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
                  style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF7F1D1D)),
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
            height: 100,
            child: Image.asset(
              'assets/sampledoctor.png',
              fit: BoxFit.contain,
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
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
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
                  valueColor:
                  AlwaysStoppedAnimation<Color>(Color(0xFFF87171)),
                  strokeCap: StrokeCap.round,
                ),
                Center(
                  child: Text(
                    '65%',
                    style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF991B1B)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Weekly appointments completed',
            textAlign: TextAlign.center,
            style: GoogleFonts.lexend(
                color: const Color(0xFFB91C1C), fontSize: 12),
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
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
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
            style: GoogleFonts.lexend(
                color: const Color(0xFFB91C1C), fontSize: 12),
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
