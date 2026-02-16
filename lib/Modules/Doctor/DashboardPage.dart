import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

import '../../Models/Patients.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';

class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  bool _loading = true;
  List<DashboardAppointments> _appointments = [];
  List<PatientDetails> _patients = [];
  int _touchedIndex = -1;
  String _doctorName = 'Doctor';

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

      // Try to get doctor name from AuthService or user profile
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
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int get _totalPatients => _patients.length;

  int get _todayAppointments {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    return _appointments.where((a) {
      try {
        return DateFormat('yyyy-MM-dd').format(DateFormat('MMM dd, yyyy').parse(a.date)) == today;
      } catch (e) {
        return false;
      }
    }).length;
  }

  int get _upcomingAppointments {
    final now = DateTime.now();
    return _appointments.where((a) {
      try {
        return DateFormat('MMM dd, yyyy').parse(a.date).isAfter(now) && a.status.toLowerCase() == 'scheduled';
      } catch (e) {
        return false;
      }
    }).length;
  }

  int get _completedToday {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    return _appointments.where((a) {
      try {
        return DateFormat('yyyy-MM-dd').format(DateFormat('MMM dd, yyyy').parse(a.date)) == today && a.status.toLowerCase() == 'completed';
      } catch (e) {
        return false;
      }
    }).length;
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  void _navigateToPage(int pageIndex) {
    // Navigate to the respective page by finding the root page and updating its index
    final rootPageState = context.findAncestorStateOfType<State>();
    if (rootPageState != null && rootPageState.mounted) {
      // Use a callback or setState if you can access the parent state
      // For now, we'll just show a message
      debugPrint('Navigate to page $pageIndex');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        color: const Color(0xFFFFFBF5),
        child: Center(
          child: CircularProgressIndicator(
            color: const Color(0xFFFF6B35),
          ),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final screenHeight = constraints.maxHeight;
        final screenWidth = constraints.maxWidth;

        return Container(
          width: screenWidth,
          height: screenHeight,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFFFBF5), Color(0xFFFFF5EB)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Dashboard Header - 12% of height
              SizedBox(
                height: screenHeight * 0.12,
                child: _buildDashboardHeader(),
              ),
              const SizedBox(height: 12),

              // Stats Cards - 11% of height
              SizedBox(
                height: screenHeight * 0.11,
                child: Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Iconsax.profile_2user,
                        label: 'Total Patients',
                        value: '$_totalPatients',
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF6B35), Color(0xFFFF8C42)],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Iconsax.calendar,
                        label: "Today's Appointments",
                        value: '$_todayAppointments',
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF9A76), Color(0xFFFFAA88)],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Iconsax.clock,
                        label: 'Upcoming',
                        value: '$_upcomingAppointments',
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFFB347), Color(0xFFFFCC33)],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Iconsax.tick_circle,
                        label: 'Completed Today',
                        value: '$_completedToday',
                        gradient: const LinearGradient(
                          colors: [Color(0xFF4ECDC4), Color(0xFF44A08D)],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Main Content - Fills remaining space (73%)
              Expanded(
                child: Row(
                  children: [
                    // Left Side - Charts (60%)
                    Expanded(
                      flex: 3,
                      child: Column(
                        children: [
                          // Pie Charts Row - 42% of content
                          Expanded(
                            flex: 42,
                            child: Row(
                              children: [
                                Expanded(
                                  child: _AppointmentChart(
                                    appointments: _appointments,
                                    touchedIndex: _touchedIndex,
                                    onTouch: (i) => setState(() => _touchedIndex = i),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _GenderChart(patients: _patients),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Today's Schedule - 56% of content
                          Expanded(
                            flex: 56,
                            child: _TodaySchedule(appointments: _appointments),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Right Side - Upcoming Appointments (40%)
                    Expanded(
                      flex: 2,
                      child: _UpcomingSection(
                        appointments: _appointments,
                        onViewAppointments: () => _navigateToPage(1),
                        onViewPatients: () => _navigateToPage(2),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDashboardHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF6B35), Color(0xFFFF8C42)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF6B35).withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Iconsax.user,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${_getGreeting()}, Dr. $_doctorName!',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Welcome back to your dashboard',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(
                  Iconsax.calendar_2,
                  color: const Color(0xFFFF6B35),
                  size: 16,
                ),
                const SizedBox(width: 6),
                Text(
                  DateFormat('MMM dd, yyyy').format(DateTime.now()),
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFFFF6B35),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Gradient gradient;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF2D3748),
                    height: 1,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF718096),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AppointmentChart extends StatelessWidget {
  final List<DashboardAppointments> appointments;
  final int touchedIndex;
  final Function(int) onTouch;

  const _AppointmentChart({
    required this.appointments,
    required this.touchedIndex,
    required this.onTouch,
  });

  @override
  Widget build(BuildContext context) {
    final scheduled = appointments.where((a) => a.status.toLowerCase() == 'scheduled').length;
    final completed = appointments.where((a) => a.status.toLowerCase() == 'completed').length;
    final cancelled = appointments.where((a) => a.status.toLowerCase() == 'cancelled').length;
    final total = scheduled + completed + cancelled;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF6B35), Color(0xFFFF8C42)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Iconsax.status, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 10),
              Text(
                'Appointment Status',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF2D3748),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: total == 0
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Iconsax.chart_21, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 12),
                        Text(
                          'No data',
                          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade400),
                        ),
                      ],
                    ),
                  )
                : PieChart(
                    PieChartData(
                      pieTouchData: PieTouchData(
                        touchCallback: (FlTouchEvent event, pieTouchResponse) {
                          if (!event.isInterestedForInteractions ||
                              pieTouchResponse == null ||
                              pieTouchResponse.touchedSection == null) {
                            onTouch(-1);
                          } else {
                            onTouch(pieTouchResponse.touchedSection!.touchedSectionIndex);
                          }
                        },
                      ),
                      sectionsSpace: 2,
                      centerSpaceRadius: 35,
                      sections: [
                        PieChartSectionData(
                          value: scheduled.toDouble(),
                          title: '$scheduled',
                          color: const Color(0xFFFFB347),
                          radius: touchedIndex == 0 ? 55 : 45,
                          titleStyle: GoogleFonts.poppins(
                            fontSize: touchedIndex == 0 ? 16 : 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        PieChartSectionData(
                          value: completed.toDouble(),
                          title: '$completed',
                          color: const Color(0xFF4ECDC4),
                          radius: touchedIndex == 1 ? 55 : 45,
                          titleStyle: GoogleFonts.poppins(
                            fontSize: touchedIndex == 1 ? 16 : 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        PieChartSectionData(
                          value: cancelled.toDouble(),
                          title: '$cancelled',
                          color: const Color(0xFFFF6B6B),
                          radius: touchedIndex == 2 ? 55 : 45,
                          titleStyle: GoogleFonts.poppins(
                            fontSize: touchedIndex == 2 ? 16 : 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 6,
            children: [
              _Legend('Scheduled', const Color(0xFFFFB347), Iconsax.clock),
              _Legend('Completed', const Color(0xFF4ECDC4), Iconsax.tick_circle),
              _Legend('Cancelled', const Color(0xFFFF6B6B), Iconsax.close_circle),
            ],
          ),
        ],
      ),
    );
  }
}

class _GenderChart extends StatelessWidget {
  final List<PatientDetails> patients;

  const _GenderChart({required this.patients});

  @override
  Widget build(BuildContext context) {
    final male = patients.where((p) => p.gender.toLowerCase() == 'male').length;
    final female = patients.where((p) => p.gender.toLowerCase() == 'female').length;
    final total = male + female;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF9A76), Color(0xFFFFAA88)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Iconsax.people, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 10),
              Text(
                'Patient Demographics',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF2D3748),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: total == 0
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Iconsax.chart_21, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 12),
                        Text(
                          'No data',
                          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade400),
                        ),
                      ],
                    ),
                  )
                : PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 35,
                      sections: [
                        PieChartSectionData(
                          value: male.toDouble(),
                          title: '$male',
                          color: const Color(0xFF5B9BD5),
                          radius: 45,
                          titleStyle: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        PieChartSectionData(
                          value: female.toDouble(),
                          title: '$female',
                          color: const Color(0xFFFF9A9E),
                          radius: 45,
                          titleStyle: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 14,
            children: [
              _Legend('Male', const Color(0xFF5B9BD5), Iconsax.man),
              _Legend('Female', const Color(0xFFFF9A9E), Iconsax.woman),
            ],
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;

  const _Legend(this.label, this.color, this.icon);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF718096),
          ),
        ),
      ],
    );
  }
}

class _TodaySchedule extends StatelessWidget {
  final List<DashboardAppointments> appointments;

  const _TodaySchedule({required this.appointments});

  @override
  Widget build(BuildContext context) {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final todayAppts = appointments.where((a) {
      try {
        return DateFormat('yyyy-MM-dd').format(DateFormat('MMM dd, yyyy').parse(a.date)) == today;
      } catch (e) {
        return false;
      }
    }).toList()
      ..sort((a, b) => a.time.compareTo(b.time));

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFB347), Color(0xFFFFCC33)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Iconsax.calendar_1, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 10),
              Text(
                "Today's Schedule",
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF2D3748),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFB347), Color(0xFFFFCC33)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${todayAppts.length}',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: todayAppts.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Iconsax.calendar_remove, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 12),
                        Text(
                          'No appointments today',
                          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade400),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: todayAppts.length > 4 ? 4 : todayAppts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final a = todayAppts[i];
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFFFFF5EB),
                              Colors.white,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFFE0CC)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: a.gender.toLowerCase() == 'male'
                                      ? [
                                          const Color(0xFF5B9BD5).withOpacity(0.2),
                                          const Color(0xFF5B9BD5).withOpacity(0.1),
                                        ]
                                      : [
                                          const Color(0xFFFF9A9E).withOpacity(0.2),
                                          const Color(0xFFFF9A9E).withOpacity(0.1),
                                        ],
                                ),
                              ),
                              child: Icon(
                                a.gender.toLowerCase() == 'male' ? Iconsax.man : Iconsax.woman,
                                size: 22,
                                color: a.gender.toLowerCase() == 'male'
                                    ? const Color(0xFF5B9BD5)
                                    : const Color(0xFFFF9A9E),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    a.patientName,
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF2D3748),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    a.reason.isNotEmpty ? a.reason : 'Consultation',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: const Color(0xFF718096),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFFF6B35), Color(0xFFFF8C42)],
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                a.time,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _UpcomingSection extends StatelessWidget {
  final List<DashboardAppointments> appointments;
  final VoidCallback onViewAppointments;
  final VoidCallback onViewPatients;

  const _UpcomingSection({
    required this.appointments,
    required this.onViewAppointments,
    required this.onViewPatients,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final upcoming = appointments.where((a) {
      try {
        return DateFormat('MMM dd, yyyy').parse(a.date).isAfter(now) &&
            a.status.toLowerCase() == 'scheduled';
      } catch (e) {
        return false;
      }
    }).toList()
      ..sort((a, b) {
        try {
          return DateFormat('MMM dd, yyyy')
              .parse(a.date)
              .compareTo(DateFormat('MMM dd, yyyy').parse(b.date));
        } catch (e) {
          return 0;
        }
      });

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4ECDC4), Color(0xFF44A08D)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Iconsax.calendar_tick, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Upcoming Appointments',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF2D3748),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4ECDC4), Color(0xFF44A08D)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${upcoming.length}',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: upcoming.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Iconsax.calendar_tick, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 12),
                        Text(
                          'No upcoming\nappointments',
                          style: GoogleFonts.inter(fontSize: 14, color: Colors.grey.shade400),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: upcoming.length > 10 ? 10 : upcoming.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final a = upcoming[i];
                      String date = '';
                      try {
                        date = DateFormat('MMM dd').format(DateFormat('MMM dd, yyyy').parse(a.date));
                      } catch (e) {
                        date = a.date;
                      }
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF0FFF4), Colors.white],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFD4F1DB)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: a.gender.toLowerCase() == 'male'
                                      ? [
                                          const Color(0xFF5B9BD5).withOpacity(0.2),
                                          const Color(0xFF5B9BD5).withOpacity(0.1),
                                        ]
                                      : [
                                          const Color(0xFFFF9A9E).withOpacity(0.2),
                                          const Color(0xFFFF9A9E).withOpacity(0.1),
                                        ],
                                ),
                              ),
                              child: Icon(
                                a.gender.toLowerCase() == 'male' ? Iconsax.man : Iconsax.woman,
                                size: 22,
                                color: a.gender.toLowerCase() == 'male'
                                    ? const Color(0xFF5B9BD5)
                                    : const Color(0xFFFF9A9E),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    a.patientName,
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF2D3748),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '$date • ${a.time}',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: const Color(0xFF718096),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 16),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onViewAppointments,
                  icon: const Icon(Iconsax.calendar, size: 18),
                  label: Text(
                    'View Appointments',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF6B35),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onViewPatients,
                  icon: const Icon(Iconsax.profile_2user, size: 18),
                  label: Text(
                    'View Patients',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4ECDC4),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
