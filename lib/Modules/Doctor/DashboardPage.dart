// doctor_dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:glowhair/Modules/Doctor/widgets/Addnewappoiments.dart';
import 'package:google_fonts/google_fonts.dart';

// Import your models + services
import '../../Models/Patients.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'widgets/Appoimentstable.dart';
import 'widgets/doctor_appointment_preview.dart';
import 'widgets/eyeicon.dart';

class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  bool _loading = false;
  List<DashboardAppointments> _appointments = [];

  String _searchQuery = '';
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  /// Fetch appointments from backend
  Future<void> _loadAppointments() async {
    if (mounted) setState(() => _loading = true);
    try {
      final appointments = await AuthService.instance.fetchAppointments();
      final list = appointments ?? <DashboardAppointments>[];
      if (mounted) setState(() {
        _appointments = list;
      });
    } catch (e, st) {
      debugPrint("❌ Error loading appointments: $e\n$st");
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
      phone: '', // not present in DashboardAppointments
      address: appt.location,
      city: appt.location,
      bloodGroup: '', // not available in appt
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
      emergencyContactPhone: '', doctorId: '', pincode: '', insuranceNumber: '', expiryDate: '',
    );
  }

  void _showAppointmentDetails(DashboardAppointments appointment) {
    final patient = _mapApptToPatient(appointment);

    showDialog(
      context: context,
      builder: (_) => Dialog(
        insetPadding: const EdgeInsets.all(12),
        child: AppointmentDetail(patient: patient),
      ),
    );
  }


  Future<void> _onNewAppointmentPressed() async {
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

    if (result == true) {
      await _loadAppointments();
    }
  }

  void _deleteAppointment(DashboardAppointments appt) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Appointment"),
        content: Text("Are you sure you want to delete ${appt.patientName}?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Delete", style: TextStyle(color: AppColors.kDanger)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    if (mounted) setState(() => _loading = true);

    try {
      final success = await AuthService.instance.deleteAppointment(appt.id);
      if (success == true) {
        final freshAppointments = await AuthService.instance.fetchAppointments();
        final list = freshAppointments ?? <DashboardAppointments>[];
        if (mounted) {
          setState(() {
            _appointments = list;
            _loading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("🗑️ Deleted ${appt.patientName}"),
              backgroundColor: AppColors.kSuccess,
            ),
          );
        }
      } else {
        if (mounted) setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Could not delete appointment."),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    } catch (e, st) {
      debugPrint("❌ Error deleting appointment: $e\n$st");
      if (mounted) setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("💥 Error while deleting ${appt.patientName}: $e"),
          backgroundColor: AppColors.kDanger,
        ),
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
    setState(() {
      if (_currentPage > 0) _currentPage--;
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
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            _buildHeader(),
            const SizedBox(height: 20),
            _buildStatsAndWelcomeCards(),
            const SizedBox(height: 20),
            Expanded(
              child: AppointmentTable(
                key: ValueKey(_appointments.length),
                appointments: filteredAppointments,
                onShowAppointmentDetails: _showAppointmentDetails,
                onNewAppointmentPressed: _onNewAppointmentPressed,
                searchQuery: _searchQuery,
                onSearchChanged: _updateSearchQuery,
                currentPage: _currentPage,
                onNextPage: _goToNextPage,
                onPreviousPage: _goToPreviousPage,
                onDeleteAppointment: _deleteAppointment,
                onRefreshRequested: _loadAppointments,
                isLoading: _loading,
              ),
            ),
          ],
        ),
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
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        Row(
          children: [
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.searchBorder),
                borderRadius: BorderRadius.circular(999),
                color: AppColors.rowAlternate,
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
                      color: AppColors.primary700,
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
              Expanded(flex: 2, child: _buildWelcomeCard(short: true)),
              const SizedBox(width: 20),
              Expanded(flex: 1, child: _buildSmallCenterCard()),
              const SizedBox(width: 20),
              Expanded(flex: 1, child: _buildBarChartCard(short: true)),
              const SizedBox(width: 20),
              SizedBox(width: 220, child: _buildDoctorMetricTiles()),
            ],
          ),
        )
            : Column(
          children: [
            _buildWelcomeCard(short: true),
            const SizedBox(height: 16),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(child: _buildSmallCenterCard()),
                  const SizedBox(width: 12),
                  Expanded(child: _buildBarChartCard(short: true)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _buildDoctorMetricTiles(),
          ],
        );
      },
    );
  }

  Widget _buildWelcomeCard({bool short = false}) {
    return Container(
      padding: const EdgeInsets.all(24),
      constraints: BoxConstraints(minHeight: short ? 110 : 150),
      decoration: BoxDecoration(
        color: Colors.white, // Enterprise Blue solid background
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 12,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Greeting in green (modern serif feel)
                Text(
                  'Good Morning',
                  style: GoogleFonts.montserratAlternates(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.6,
                    color: AppColors.kSuccess, // green accent
                  ),
                ),

                // Doctor’s name in white (corporate identity)
                Text(
                  'Dr. Renvord Atkinson',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.3,
                    color: Colors.black,
                  ),
                ),

                const SizedBox(height: 8),

                // Subtitle in red with elegant serif
                Text(
                  'Here is your dashboard to manage consultations with ease',
                  style: GoogleFonts.robotoSlab(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    height: 1.5,
                    letterSpacing: 0.2,
                    color: AppColors.kDanger, // red highlight
                  ),
                ),
              ],
            ),
          ),

          // Doctor image
          SizedBox(
            width: short ? 72 : 88,
            height: short ? 72 : 88,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                'assets/sampledoctor.png',
                fit: BoxFit.cover,
              ),
            ),
          ),
        ],
      ),
    );
  }




  Widget _buildSmallCenterCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      constraints: const BoxConstraints(minHeight: 130),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Circular progress indicator with dual colors
          SizedBox(
            width: 70,
            height: 70,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Base ring (light gray background)
                CircularProgressIndicator(
                  value: 1.0,
                  strokeWidth: 6,
                  backgroundColor: AppColors.grey200,
                  color: AppColors.grey200,
                ),
                // Progress ring (success green instead of blue)
                CircularProgressIndicator(
                  value: 0.65,
                  strokeWidth: 6,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.kSuccess),
                ),
                // Percentage text
                Center(
                  child: Text(
                    '65%',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.kSuccess,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          // Caption text in info blue
          Text(
            'Weekly appointments completed',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              color: AppColors.kInfo,
              fontSize: 13,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChartCard({bool short = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      constraints: BoxConstraints(minHeight: short ? 120 : 160),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 6),
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
                _buildBar(0.55, AppColors.primary600),   // scheduled (blue)
                _buildBar(0.75, AppColors.kSuccess),     // completed (green)
                _buildBar(0.45, AppColors.kInfo),        // consultations (blue info)
                _buildBar(0.85, AppColors.kDanger),      // missed/cancelled (red)
                _buildBar(0.65, AppColors.grey400),      // pending (gray)
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Weekly hours completed',
            textAlign: TextAlign.center,
            style: GoogleFonts.manrope(
              color: AppColors.kTextSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(double heightFactor, Color color) {
    return FractionallySizedBox(
      heightFactor: heightFactor.clamp(0.05, 1.0),
      child: Container(
        width: 12,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(6),
        ),
      ),
    );
  }

  Widget _buildDoctorMetricTiles() {
    final tiles = [
      {
        'title': 'Patients',
        'value': '1.8K',
        'color': AppColors.primary,
        'subtitle': 'Active'
      },
      {
        'title': 'New Referrals',
        'value': '86',
        'color': AppColors.kSuccess,
        'subtitle': 'This week'
      },
      {
        'title': 'Consults',
        'value': '420',
        'color': AppColors.kInfo,
        'subtitle': 'This month'
      },
      {
        'title': 'Follow-ups',
        'value': '132',
        'color': AppColors.kDanger,
        'subtitle': 'Pending'
      },
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      alignment: WrapAlignment.start,
      children: tiles.map((t) {
        return Container(
          width: 104,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
          decoration: BoxDecoration(
            color: t['color'] as Color,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Column(
            children: [
              Text(
                t['title'] as String,
                style: GoogleFonts.poppins(color: AppColors.white70, fontSize: 12),
              ),
              const SizedBox(height: 6),
              Text(
                t['value'] as String,
                style: GoogleFonts.poppins(
                  color: AppColors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                t['subtitle'] as String,
                style: GoogleFonts.inter(color: AppColors.white70, fontSize: 11),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
