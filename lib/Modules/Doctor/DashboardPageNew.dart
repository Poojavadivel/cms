import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../Models/Patients.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import 'widgets/doctor_appointment_preview.dart';

/// ENTERPRISE-GRADE DOCTOR DASHBOARD
/// NO SCROLLING - Fully responsive single-screen design
/// Professional medical color scheme (Blues/Teals)
class EnterpriseDoctorDashboard extends StatefulWidget {
  const EnterpriseDoctorDashboard({super.key});

  @override
  State<EnterpriseDoctorDashboard> createState() => _EnterpriseDoctorDashboardState();
}

class _EnterpriseDoctorDashboardState extends State<EnterpriseDoctorDashboard> {
  bool _loading = true;
  List<DashboardAppointments> _appointments = [];
  List<PatientDetails> _patients = [];
  String _doctorName = 'Doctor';
  String _selectedPeriod = 'Today';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final appointments = await AuthService.instance.fetchAppointments();
      final patients = await AuthService.instance.fetchDoctorPatients();

      String docName = 'Doctor';
      try {
        final currentStaff = AuthService.instance.currentStaff;
        if (currentStaff != null && currentStaff.name.isNotEmpty) {
          docName = currentStaff.name;
        }
      } catch (e) {
        debugPrint('Could not load doctor name: $e');
      }

      if (mounted) {
        setState(() {
          _appointments = appointments;
          _patients = patients;
          _doctorName = docName;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading dashboard data: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  // METRICS CALCULATIONS - ALL REAL DATA FROM API
  int get _totalPatients => _patients.length;

  int get _todayAppointments {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    return _appointments.where((a) {
      final apptDate = _parseDate(a.date);
      return apptDate == today;
    }).length;
  }

  int get _waitingNow {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    return _appointments.where((a) {
      final apptDate = _parseDate(a.date);
      final isToday = apptDate == today;
      final isScheduled = a.status.toLowerCase() == 'scheduled';
      return isToday && isScheduled;
    }).length;
  }

  int get _completedToday {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    return _appointments.where((a) {
      final apptDate = _parseDate(a.date);
      final isToday = apptDate == today;
      final isCompleted = a.status.toLowerCase() == 'completed';
      return isToday && isCompleted;
    }).length;
  }

  String _parseDate(String date) {
    try {
      // Try "MMM dd, yyyy" format first
      return DateFormat('yyyy-MM-dd').format(DateFormat('MMM dd, yyyy').parse(date));
    } catch (e) {
      try {
        // Try ISO format (2025-11-03T12:35:00.000Z)
        final parsed = DateTime.parse(date);
        return DateFormat('yyyy-MM-dd').format(parsed);
      } catch (e2) {
        debugPrint('❌ Failed to parse date: $date, Error: $e2');
        return '';
      }
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenHeight = constraints.maxHeight;
        final screenWidth = constraints.maxWidth;
        final isCompact = screenWidth < 1200;

        // FIXED CALCULATIONS - Account for all padding/margins
        final headerHeight = screenHeight * 0.12;
        final quickActionsHeight = screenHeight * 0.08;
        final contentHeight = screenHeight * 0.80;
        
        // Show skeleton loader while loading
        if (_loading) {
          return Container(
            width: screenWidth,
            height: screenHeight,
            color: const Color(0xFFF8FAFC),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // HEADER SKELETON
                SizedBox(
                  height: headerHeight,
                  child: _buildHeaderSkeleton(headerHeight),
                ),

                // QUICK ACTIONS SKELETON
                SizedBox(
                  height: quickActionsHeight,
                  child: _buildQuickActionsSkeleton(),
                ),

                // MAIN CONTENT SKELETON
                SizedBox(
                  height: contentHeight,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: isCompact 
                      ? _buildCompactSkeleton(contentHeight)
                      : _buildWideSkeleton(contentHeight),
                  ),
                ),
              ],
            ),
          );
        }
        
        return Container(
          width: screenWidth,
          height: screenHeight,
          color: const Color(0xFFF8FAFC),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // HEADER - Exact height with internal padding handled
              SizedBox(
                height: headerHeight,
                child: _buildHeader(headerHeight),
              ),

              // QUICK ACTIONS - Exact height
              SizedBox(
                height: quickActionsHeight,
                child: _buildQuickActions(quickActionsHeight),
              ),

              // MAIN CONTENT - Exact height minus internal padding
              SizedBox(
                height: contentHeight,
                child: isCompact 
                  ? _buildCompactLayout(contentHeight)
                  : _buildWideLayout(contentHeight),
              ),
            ],
          ),
        );
      },
    );
  }

  // SKELETON LOADERS
  Widget _buildHeaderSkeleton(double height) {
    return Container(
      height: height,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E40AF).withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon placeholder
          _shimmerBox(48, 48, 12),
          const SizedBox(width: 16),
          // Text placeholders
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                _shimmerBox(200, 20, 4, color: Colors.white.withOpacity(0.3)),
                const SizedBox(height: 4),
                _shimmerBox(150, 12, 4, color: Colors.white.withOpacity(0.2)),
              ],
            ),
          ),
          _shimmerBox(80, 36, 8, color: Colors.white.withOpacity(0.2)),
          const SizedBox(width: 12),
          _shimmerBox(120, 36, 8, color: Colors.white.withOpacity(0.95)),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSkeleton() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: List.generate(4, (index) => 
          Expanded(
            child: Container(
              margin: EdgeInsets.only(left: index > 0 ? 10 : 0),
              child: _shimmerBox(double.infinity, 48, 10),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWideSkeleton(double contentHeight) {
    final adjustedHeight = contentHeight - 24;
    final statsHeight = adjustedHeight * 0.19;
    final chartHeight = adjustedHeight * 0.37;
    final queueHeight = adjustedHeight * 0.39;
    final upcomingHeight = adjustedHeight * 0.49;
    final statusHeight = adjustedHeight * 0.47;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // LEFT SECTION
        Expanded(
          flex: 65,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Stats cards skeleton
              SizedBox(
                height: statsHeight,
                child: Row(
                  children: List.generate(4, (index) => 
                    Expanded(
                      child: Container(
                        margin: EdgeInsets.only(left: index > 0 ? 10 : 0),
                        child: _shimmerBox(double.infinity, statsHeight, 12),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Chart skeleton
              _shimmerBox(double.infinity, chartHeight, 14),
              const SizedBox(height: 10),
              // Queue skeleton
              _shimmerBox(double.infinity, queueHeight, 14),
            ],
          ),
        ),
        const SizedBox(width: 10),
        // RIGHT SECTION
        Expanded(
          flex: 35,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _shimmerBox(double.infinity, upcomingHeight, 14),
              const SizedBox(height: 10),
              _shimmerBox(double.infinity, statusHeight, 14),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCompactSkeleton(double contentHeight) {
    final adjustedHeight = contentHeight - 24;
    final statsHeight = adjustedHeight * 0.21;
    final queueHeight = adjustedHeight * 0.75;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Stats cards skeleton
        SizedBox(
          height: statsHeight,
          child: Row(
            children: List.generate(4, (index) => 
              Expanded(
                child: Container(
                  margin: EdgeInsets.only(left: index > 0 ? 8 : 0),
                  child: _shimmerBox(double.infinity, statsHeight, 12),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        // Queue skeleton
        _shimmerBox(double.infinity, queueHeight, 14),
      ],
    );
  }

  Widget _shimmerBox(double width, double height, double radius, {Color? color}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: color ?? Colors.white,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Shimmer.fromColors(
        baseColor: Colors.grey.shade300,
        highlightColor: Colors.grey.shade100,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(double allocatedHeight) {
    // Use all allocated height, account for margin in padding
    return Container(
      height: allocatedHeight,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8), // Total 20px vertical
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        // ENTERPRISE-GRADE: Deep professional blue gradient
        gradient: const LinearGradient(
          colors: [
            Color(0xFF1E40AF), // Blue-700 - Deep professional
            Color(0xFF1E3A8A), // Blue-800 - Darker enterprise blue
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12), // Reduced for more professional look
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E40AF).withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Iconsax.user_octagon,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    '${_getGreeting()}, Dr. $_doctorName',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      height: 1.0, // Reduced from 1.2
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 1), // Reduced from 2
                Flexible(
                  child: Text(
                    'You have $_waitingNow patients waiting',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withOpacity(0.9),
                      height: 1.0, // Added explicit height
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Period Selector
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _periodButton('Today'),
                _periodButton('Week'),
                _periodButton('Month'),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Iconsax.calendar_1,
                  color: Color(0xFF0EA5E9),
                  size: 14,
                ),
                const SizedBox(width: 6),
                Text(
                  DateFormat('MMM dd, yyyy').format(DateTime.now()),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _periodButton(String label) {
    final isSelected = _selectedPeriod == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedPeriod = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isSelected ? const Color(0xFF0EA5E9) : Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActions(double allocatedHeight) {
    return Container(
      height: allocatedHeight,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: _actionButton(
              icon: Iconsax.health,
              label: 'Start Consultation',
              color: const Color(0xFF10B981),
              onTap: () => debugPrint('Start Consultation'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _actionButton(
              icon: Iconsax.danger,
              label: 'Emergency',
              color: const Color(0xFFEF4444),
              onTap: () => debugPrint('Emergency'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _actionButton(
              icon: Iconsax.note_text,
              label: 'Quick Notes',
              color: const Color(0xFFF59E0B),
              onTap: () => debugPrint('Quick Notes'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _actionButton(
              icon: Iconsax.message_text,
              label: 'Messages',
              color: const Color(0xFF8B5CF6),
              onTap: () => debugPrint('Messages'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.2), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWideLayout(double allocatedHeight) {
    // Account for padding (16 left + 16 right, 8 top + 16 bottom = 24 vertical)
    final contentHeight = allocatedHeight - 24;
    
    // Add buffer to prevent overflow
    final statsHeight = contentHeight * 0.19; // Reduced from 0.20
    final chartHeight = contentHeight * 0.37; // Reduced from 0.38
    final queueHeight = contentHeight * 0.39; // Reduced from 0.40
    final upcomingHeight = contentHeight * 0.49; // Reduced from 0.50
    final statusHeight = contentHeight * 0.47; // Reduced from 0.48
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // LEFT SECTION - 65%
          Expanded(
            flex: 65,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // STATS CARDS - Fixed height
                SizedBox(
                  height: statsHeight,
                  child: Row(
                    children: [
                      Expanded(child: _statCard(
                        icon: Iconsax.user_octagon,
                        label: 'Total Patients',
                        value: _totalPatients.toString(),
                        color: const Color(0xFF0EA5E9),
                      )),
                      const SizedBox(width: 10),
                      Expanded(child: _statCard(
                        icon: Iconsax.calendar_tick,
                        label: "Today's Appointments",
                        value: _todayAppointments.toString(),
                        color: const Color(0xFF8B5CF6),
                      )),
                      const SizedBox(width: 10),
                      Expanded(child: _statCard(
                        icon: Iconsax.timer_1,
                        label: 'Waiting Now',
                        value: _waitingNow.toString(),
                        color: const Color(0xFFF59E0B),
                      )),
                      const SizedBox(width: 10),
                      Expanded(child: _statCard(
                        icon: Iconsax.tick_circle,
                        label: 'Completed Today',
                        value: _completedToday.toString(),
                        color: const Color(0xFF10B981),
                      )),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // PATIENT FLOW CHART - Fixed height
                SizedBox(
                  height: chartHeight,
                  child: _buildPatientFlowChart(),
                ),
                const SizedBox(height: 10),

                // PATIENT QUEUE - Fixed height
                SizedBox(
                  height: queueHeight,
                  child: _buildPatientQueue(),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // RIGHT SECTION - 35%
          Expanded(
            flex: 35,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // UPCOMING APPOINTMENTS - Fixed height
                SizedBox(
                  height: upcomingHeight,
                  child: _buildUpcomingAppointments(),
                ),
                const SizedBox(height: 10),

                // STATUS DISTRIBUTION - Fixed height
                SizedBox(
                  height: statusHeight,
                  child: _buildStatusDistribution(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactLayout(double allocatedHeight) {
    // Account for padding
    final contentHeight = allocatedHeight - 24;
    
    // Add buffer for compact
    final statsHeight = contentHeight * 0.21; // Reduced from 0.22
    final queueHeight = contentHeight * 0.75; // Reduced from 0.76
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // STATS CARDS - Fixed height
          SizedBox(
            height: statsHeight,
            child: Row(
              children: [
                Expanded(child: _statCard(
                  icon: Iconsax.user_octagon,
                  label: 'Total',
                  value: _totalPatients.toString(),
                  color: const Color(0xFF0EA5E9),
                )),
                const SizedBox(width: 8),
                Expanded(child: _statCard(
                  icon: Iconsax.calendar_tick,
                  label: "Today",
                  value: _todayAppointments.toString(),
                  color: const Color(0xFF8B5CF6),
                )),
                const SizedBox(width: 8),
                Expanded(child: _statCard(
                  icon: Iconsax.timer_1,
                  label: 'Waiting',
                  value: _waitingNow.toString(),
                  color: const Color(0xFFF59E0B),
                )),
                const SizedBox(width: 8),
                Expanded(child: _statCard(
                  icon: Iconsax.tick_circle,
                  label: 'Done',
                  value: _completedToday.toString(),
                  color: const Color(0xFF10B981),
                )),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // PATIENT QUEUE - Fixed height
          SizedBox(
            height: queueHeight,
            child: _buildPatientQueue(),
          ),
        ],
      ),
    );
  }

  Widget _statCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Calculate available height and adjust content accordingly
        final availableHeight = constraints.maxHeight;
        final contentPadding = 10.0; // Reduced from 12
        final iconSize = availableHeight > 90 ? 36.0 : 32.0;
        final valueFontSize = availableHeight > 90 ? 22.0 : 18.0;
        final labelFontSize = availableHeight > 90 ? 10.0 : 9.0;
        
        return Container(
          padding: EdgeInsets.all(contentPadding),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: iconSize,
                height: iconSize,
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: iconSize * 0.55),
              ),
              SizedBox(height: availableHeight > 90 ? 6 : 4),
              Flexible(
                child: Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: valueFontSize,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                    height: 1.0,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(height: availableHeight > 90 ? 3 : 2),
              Flexible(
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: labelFontSize,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                    height: 1.1,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPatientFlowChart() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Iconsax.chart, color: Color(0xFF0EA5E9), size: 18),
              const SizedBox(width: 8),
              Text(
                'Patient Flow',
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const Spacer(),
              _chartLegend('Scheduled', const Color(0xFF0EA5E9)),
              const SizedBox(width: 10),
              _chartLegend('Completed', const Color(0xFF10B981)),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _buildLineChart(),
          ),
        ],
      ),
    );
  }

  Widget _chartLegend(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildLineChart() {
    // Generate data for last 7 days
    final now = DateTime.now();
    final dates = List.generate(7, (i) => now.subtract(Duration(days: 6 - i)));
    
    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 5,
          getDrawingHorizontalLine: (value) => FlLine(
            color: const Color(0xFFE2E8F0),
            strokeWidth: 1,
          ),
        ),
        titlesData: FlTitlesData(
          show: true,
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              interval: 1,
              getTitlesWidget: (value, meta) {
                if (value.toInt() >= 0 && value.toInt() < dates.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      DateFormat('EEE').format(dates[value.toInt()]),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  );
                }
                return const SizedBox();
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 35,
              interval: 5,
              getTitlesWidget: (value, meta) {
                return Text(
                  value.toInt().toString(),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF94A3B8),
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        minX: 0,
        maxX: 6,
        minY: 0,
        maxY: 20,
        lineBarsData: [
          // Scheduled line
          LineChartBarData(
            spots: List.generate(7, (i) => FlSpot(i.toDouble(), (8 + (i * 1.5) % 10))),
            isCurved: true,
            color: const Color(0xFF0EA5E9),
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                return FlDotCirclePainter(
                  radius: 4,
                  color: Colors.white,
                  strokeWidth: 2,
                  strokeColor: const Color(0xFF0EA5E9),
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              color: const Color(0xFF0EA5E9).withOpacity(0.1),
            ),
          ),
          // Completed line
          LineChartBarData(
            spots: List.generate(7, (i) => FlSpot(i.toDouble(), (5 + (i * 1.2) % 8))),
            isCurved: true,
            color: const Color(0xFF10B981),
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                return FlDotCirclePainter(
                  radius: 4,
                  color: Colors.white,
                  strokeWidth: 2,
                  strokeColor: const Color(0xFF10B981),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPatientQueue() {
    // Get today's date in yyyy-MM-dd format
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    
    // Filter appointments for today with 'scheduled' status
    final waitingPatients = _appointments.where((a) {
      final apptDateStr = _parseDate(a.date);
      final isToday = apptDateStr == today;
      final isScheduled = a.status.toLowerCase() == 'scheduled';
      
      debugPrint('🔍 Checking appointment: ${a.patientName}, Date: $apptDateStr, Today: $today, Match: $isToday, Status: ${a.status}, Scheduled: $isScheduled');
      
      return isToday && isScheduled;
    }).toList();
    
    // Sort by time (earliest first)
    waitingPatients.sort((a, b) {
      try {
        final timeA = _parseTime(a.time);
        final timeB = _parseTime(b.time);
        return timeA.compareTo(timeB);
      } catch (e) {
        return 0;
      }
    });
    
    // Limit to 5 to prevent overflow
    final limitedQueue = waitingPatients.take(5).toList();
    
    debugPrint('📊 Patient Queue: Found ${waitingPatients.length} appointments today, showing ${limitedQueue.length}');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Iconsax.profile_2user, color: Color(0xFF0EA5E9), size: 18),
              const SizedBox(width: 8),
              Text(
                'Patient Queue',
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0EA5E9).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${limitedQueue.length} Waiting',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0EA5E9),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: limitedQueue.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Iconsax.user_tick,
                          size: 40,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'No patients in queue',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'All caught up! 🎉',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: EdgeInsets.zero,
                    itemCount: limitedQueue.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final appointment = limitedQueue[index];
                      return _queueItem(appointment, index + 1);
                    },
                  ),
          ),
        ],
      ),
    );
  }
  
  String _parseTime(String timeStr) {
    // Return time as-is for sorting (assumes HH:mm format like "10:30" or "14:00")
    return timeStr;
  }

  Widget _queueItem(DashboardAppointments appointment, int position) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0EA5E9), Color(0xFF0284C7)],
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '#$position',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  appointment.patientName,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 2),
                Text(
                  appointment.reason.isEmpty ? 'General Consultation' : appointment.reason,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                appointment.time,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Waiting',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFFF59E0B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 6),
          IconButton(
            onPressed: () => debugPrint('Start consultation for ${appointment.patientName}'),
            icon: const Icon(Iconsax.play_circle, color: Color(0xFF10B981)),
            iconSize: 20,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingAppointments() {
    // Filter for future scheduled appointments
    final now = DateTime.now();
    final upcoming = _appointments.where((a) {
      try {
        // Parse date - handle both "MMM dd, yyyy" and ISO format
        DateTime apptDate;
        try {
          apptDate = DateFormat('MMM dd, yyyy').parse(a.date);
        } catch (e) {
          // Try ISO format or other formats
          apptDate = DateTime.parse(a.date);
        }
        
        // Check if appointment is in the future and scheduled
        final isFuture = apptDate.isAfter(now);
        final isScheduled = a.status.toLowerCase() == 'scheduled';
        
        return isFuture && isScheduled;
      } catch (e) {
        debugPrint('Error parsing appointment date: ${a.date}, error: $e');
        return false;
      }
    }).toList();
    
    // Sort by date (earliest first) and limit to 4
    upcoming.sort((a, b) {
      try {
        final dateA = _parseAppointmentDate(a.date);
        final dateB = _parseAppointmentDate(b.date);
        return dateA.compareTo(dateB);
      } catch (e) {
        return 0;
      }
    });
    
    final limitedUpcoming = upcoming.take(4).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Iconsax.calendar_2, color: Color(0xFF8B5CF6), size: 18),
              const SizedBox(width: 8),
              Text(
                'Upcoming',
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${limitedUpcoming.length}',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF8B5CF6),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: limitedUpcoming.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Iconsax.calendar,
                          size: 40,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'No upcoming appointments',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: EdgeInsets.zero,
                    itemCount: limitedUpcoming.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final appt = limitedUpcoming[index];
                      return _upcomingItem(appt);
                    },
                  ),
          ),
        ],
      ),
    );
  }
  
  DateTime _parseAppointmentDate(String dateStr) {
    try {
      return DateFormat('MMM dd, yyyy').parse(dateStr);
    } catch (e) {
      return DateTime.parse(dateStr);
    }
  }

  Widget _upcomingItem(DashboardAppointments appointment) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFF8B5CF6).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Iconsax.calendar_tick,
              color: Color(0xFF8B5CF6),
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  appointment.patientName,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 2),
                Text(
                  '${appointment.date} • ${appointment.time}',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Eye icon to view appointment details
          InkWell(
            onTap: () => _showAppointmentPreview(appointment),
            borderRadius: BorderRadius.circular(6),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(
                Iconsax.eye,
                color: Color(0xFF8B5CF6),
                size: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Future<void> _showAppointmentPreview(DashboardAppointments appointment) async {
    try {
      // Show loading indicator
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF8B5CF6),
          ),
        ),
      );
      
      // Fetch patient details using correct method
      final patientDetails = await AuthService.instance.fetchPatientById(appointment.patientId);
      
      // Close loading indicator
      if (mounted) Navigator.of(context).pop();
      
      // Show appointment preview
      if (mounted) {
        await DoctorAppointmentPreview.show(
          context,
          patientDetails,
          showBillingTab: false, // Hide billing in doctor side
        );
      }
    } catch (e) {
      // Close loading if still open
      if (mounted) Navigator.of(context).pop();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading patient: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      debugPrint('❌ Error showing appointment preview: $e');
    }
  }

  Widget _buildStatusDistribution() {
    final scheduled = _appointments.where((a) => a.status.toLowerCase() == 'scheduled').length;
    final completed = _appointments.where((a) => a.status.toLowerCase() == 'completed').length;
    final cancelled = _appointments.where((a) => a.status.toLowerCase() == 'cancelled').length;
    final total = _appointments.length;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Iconsax.status, color: Color(0xFF10B981), size: 18),
              const SizedBox(width: 8),
              Text(
                'Status Overview',
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              mainAxisSize: MainAxisSize.min,
              children: [
                _statusBar(
                  'Scheduled',
                  scheduled,
                  total,
                  const Color(0xFF0EA5E9),
                ),
                const SizedBox(height: 12),
                _statusBar(
                  'Completed',
                  completed,
                  total,
                  const Color(0xFF10B981),
                ),
                const SizedBox(height: 12),
                _statusBar(
                  'Cancelled',
                  cancelled,
                  total,
                  const Color(0xFFEF4444),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusBar(String label, int count, int total, Color color) {
    final percentage = total > 0 ? (count / total * 100).toInt() : 0;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
            ),
            Text(
              '$count ($percentage%)',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: total > 0 ? count / total : 0,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }
}
