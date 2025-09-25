// dashboard_page.dart
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:table_calendar/table_calendar.dart';
import 'dart:math' as math;

import '../../Utils/Colors.dart';


/// THEME


class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late Future<Map<String, dynamic>> _futureData;
  int _revenueTab = 0;
  DateTime? _selectedDay;
  String _selectedAppointmentFilter = 'All';
  DateTime _focusedDay = DateTime.now();

  // State field for selected quick filter
  String _selectedReportFilter = 'All';
  final List<String> _filters = [
    "All",
    "Consultation",
    "Surgery",
    "Meetings",
    "Training",
    "Audits"
  ];


  @override
  void initState() {
    super.initState();
    _futureData = _loadDashboardData();
    _selectedDay = _focusedDay;
  }

  Future<Map<String, dynamic>> _loadDashboardData() async {
    await Future.delayed(const Duration(seconds: 2)); // simulate API
    return {
      "invoice": 1287,
      "patients": 965,
      "appointments": 128,
      "beds": 315,
    };
  }
  final Map<DateTime, List<Map<String, dynamic>>> _events = {
    // keys use DateTime(year, month, day) for exact-day match
    DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day): [
      {"title": "Morning Staff Meeting", "time": "08:00 - 09:00", "color": Colors.teal},
      {"title": "Patient Consultation - General Medicine", "time": "10:00 - 12:00", "color": Colors.blue},
      {"title": "Surgery - Orthopedics", "time": "13:00 - 15:00", "color": Colors.red},
      {"title": "Training Session", "time": "16:00 - 17:00", "color": Colors.purple},
    ],
    // sample previous day
    DateTime.now().subtract(const Duration(days: 1)).toLocal(): [
      {"title": "Inventory Audit", "time": "11:00 - 11:45", "color": Colors.orange},
    ],
  };

// helper to get events for a day (normalizes date)
  List<Map<String, dynamic>> _getEventsForDay(DateTime day) {
    final key = DateTime(day.year, day.month, day.day);
    return _events[key] ?? [];
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.kBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FutureBuilder<Map<String, dynamic>>(
            future: _futureData,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return _buildSkeleton();
              } else if (snapshot.hasError) {
                return Center(child: Text("Error: ${snapshot.error}"));
              } else if (snapshot.hasData) {
                return _buildDashboard(snapshot.data!);
              }
              return const SizedBox.shrink();
            },
          ),
        ),
      ),
    );
  }

  /// Skeleton Loader
  Widget _buildSkeleton() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(height: 40, width: 200, color: Colors.white),
          const SizedBox(height: 16),
          Row(
            children: List.generate(
              4,
                  (i) =>
                  Expanded(
                    child: Container(
                      height: 80,
                      margin: EdgeInsets.only(right: i < 3 ? 12 : 0),
                      color: Colors.white,
                    ),
                  ),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(child: Container(color: Colors.white)),
        ],
      ),
    );
  }

  /// Full Dashboard Layout
  Widget _buildDashboard(Map<String, dynamic> data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [

        /// HEADER
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("Dashboard",
                style: GoogleFonts.lexend(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextPrimary)),
            const CircleAvatar(
              backgroundImage: NetworkImage(
                  "https://placehold.co/100x100/EFEFEF/A9A9A9?text=Admin"),
              radius: 20,
            )
          ],
        ),
        const SizedBox(height: 16),

        /// TOP STATS CARDS
        Row(
        children: [
        Expanded(
        child: _statCard(
        "Total Invoice",
        data["invoice"],
        "56 more than yesterday",
        icon: Icons.receipt_long,
        iconColor: AppColors.kCFBlue,
        ),
        ),
        const SizedBox(width: 12),
        Expanded(
        child: _statCard(
        "Total Patients",
        data["patients"],
        "45 more than yesterday",
        icon: Icons.people,
        iconColor: AppColors.kSuccess,
        ),
        ),
        const SizedBox(width: 12),
        Expanded(
    child: _statCard(
    "Appointments",
    data["appointments"],
    "18 less than yesterday",
    icon: Icons.calendar_today,
    iconColor: AppColors.kDanger,
    ),
    ),
    const SizedBox(width: 12),
    Expanded(
    child: _statCard(
    "Bedroom",
    data["beds"],
    "56 more than yesterday",
    icon: Icons.bed,
    iconColor: AppColors.kCFBlue,
    ),
    ),
    ],
    ),

    const SizedBox(height: 16),

        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              /// LEFT MAIN
              Expanded(
                flex: 3,
                child: Column(
                  children: [
                    /// Top row (Patient Overview + Revenue)
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(child: _patientOverviewCard()),
                          const SizedBox(width: 12),
                          Expanded(child: _revenueCard()),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    /// Bottom row (Patient Dept + Doctors + Reports)
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(child: _patientDeptCard()),
                          const SizedBox(width: 12),
                          // Expanded(child: _doctorScheduleCard()),
                          const SizedBox(width: 12),
                          Expanded(child: _reportCard()),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 16),

              /// RIGHT SIDEBAR (Calendar + Daily Schedule)
              Expanded(
                flex: 1,
                child: _calendarCard(),
              ),
            ],
          ),
        )

      ],
    );
  }

  /// -----------------
  /// Widgets
  /// -----------------

  Widget _statCard(
      String title,
      int value,
      String subtitle, {
        required IconData icon,
        required Color iconColor,
      }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),

          // Texts
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.kTextSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "$value",
                  style: GoogleFonts.lexend(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }



  Widget _patientOverviewCard() {
    return _chartCard(
      title: "Patient Overview",
      subtitle: "by Age Stages",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Chart area (keeps safe padding so nothing overflows)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 8, right: 8, top: 4, bottom: 6),
              child: BarChart(
                BarChartData(
                  maxY: 180, // cap the max to avoid overflow
                  groupsSpace: 18,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    drawHorizontalLine: true,
                    horizontalInterval: 40,
                    getDrawingHorizontalLine: (value) =>
                        FlLine(color: AppColors.kMuted, strokeWidth: 0.6),
                  ),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        interval: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            "${value.toInt()}",
                            style:
                            GoogleFonts.inter(fontSize: 10, color: AppColors.kTextSecondary),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          final labels = [
                            "4 Jul",
                            "5 Jul",
                            "6 Jul",
                            "7 Jul",
                            "8 Jul",
                            "9 Jul",
                            "10 Jul",
                            "11 Jul"
                          ];
                          final idx = value.toInt();
                          if (idx >= 0 && idx < labels.length) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                labels[idx],
                                style: GoogleFonts.inter(
                                    fontSize: 10, color: AppColors.kTextSecondary),
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ),
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  barTouchData: BarTouchData(
                    enabled: true,
                    // Only using getTooltipItem (no tooltipBgColor param)
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipItem:
                          (group, groupIndex, rod, rodIndex) {
                        // rodIndex is index of the rod in the group: 0=Child,1=Adult,2=Elderly
                        final labels = ["Child", "Adult", "Elderly"];
                        final label = (rodIndex >= 0 && rodIndex < labels.length)
                            ? labels[rodIndex]
                            : "Value";
                        return BarTooltipItem(
                          "$label\n${rod.toY.toInt()}",
                          GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ).copyWith(height: 1.05),
                        );
                      },
                    ),
                  ),
                  barGroups: List.generate(8, (i) {
                    // Data tuned so the group fits and looks balanced.
                    final childVal = (95 + (i * 6)).toDouble();
                    final adultVal = (80 + (i * 5)).toDouble();
                    final elderVal = (50 + (i * 4)).toDouble();

                    return BarChartGroupData(
                      x: i,
                      barsSpace: 6,
                      barRods: [
                        BarChartRodData(toY: childVal, color: AppColors.kInfo, width: 8),
                        BarChartRodData(toY: adultVal, color: AppColors.kSuccess, width: 8),
                        BarChartRodData(toY: elderVal, color: AppColors.kDanger, width: 8),
                      ],
                      // optionally show initial tooltip indicators:
                      // showingTooltipIndicators: [[0],[1],[2]],
                    );
                  }),
                ),
              ),
            ),
          ),

          // Legends under the chart (keeps within card bounds)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              children: [
                _legendDot(AppColors.kInfo, "Child"),
                const SizedBox(width: 14),
                _legendDot(AppColors.kSuccess, "Adult"),
                const SizedBox(width: 14),
                _legendDot(AppColors.kDanger, "Elderly"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _legendDot(Color color, String text) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(text, style: GoogleFonts.inter(fontSize: 11, color: AppColors.kTextSecondary)),
      ],
    );
  }


  Widget _revenueCard() {
    return _chartCard(
      title: "Revenue",
      child: Column(
        children: [
          Row(
            children: ["Week", "Month", "Year"]
                .asMap()
                .entries
                .map((e) {
              final i = e.key;
              final t = e.value;
              final active = _revenueTab == i;
              return GestureDetector(
                onTap: () => setState(() => _revenueTab = i),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: active ? AppColors.kInfo.withOpacity(.1) : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(t, style: GoogleFonts.inter(
                      fontSize: 12, color: active ? AppColors.kInfo : AppColors.kTextSecondary)),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          Expanded(child: LineChart(
            LineChartData(
              gridData: FlGridData(
                  show: true, drawHorizontalLine: true, horizontalInterval: 400,
                  getDrawingHorizontalLine: (v) =>
                      FlLine(color: AppColors.kMuted, strokeWidth: 0.5)),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: true, interval: 400,
                        getTitlesWidget: (v, c) =>
                            Text(v == 0 ? "0" : "${v.toInt()}",
                                style: GoogleFonts.inter(
                                    fontSize: 10, color: AppColors.kTextSecondary)))),
                bottomTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: true,
                        getTitlesWidget: (v, c) {
                          final labels = [
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat"
                          ];
                          if (v.toInt() < labels.length) {
                            return Text(labels[v.toInt()],
                                style: GoogleFonts.inter(
                                    fontSize: 10, color: AppColors.kTextSecondary));
                          }
                          return const SizedBox.shrink();
                        })),
                rightTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                topTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(isCurved: true,
                    spots: [
                      FlSpot(0, 800),
                      FlSpot(1, 1200),
                      FlSpot(2, 1000),
                      FlSpot(3, 1495),
                      FlSpot(4, 1100),
                      FlSpot(5, 1200),
                      FlSpot(6, 1150)
                    ],
                    color: AppColors.kTextPrimary,
                    dotData: FlDotData(show: true)),
                LineChartBarData(isCurved: true,
                    spots: [
                      FlSpot(0, 600),
                      FlSpot(1, 700),
                      FlSpot(2, 900),
                      FlSpot(3, 1000),
                      FlSpot(4, 950),
                      FlSpot(5, 970),
                      FlSpot(6, 930)
                    ],
                    color: AppColors.kInfo,
                    dotData: FlDotData(show: true)),
              ],
            ),
          ))
        ],
      ),
    );
  }

  /// Helpers
  BoxDecoration _cardDecoration() =>
      BoxDecoration(color: AppColors.kCard,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
                color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
          ]);

  // Widget _chartCard(
  //     {required String title, String? subtitle, required Widget child}) {
  //   return Container(
  //     padding: const EdgeInsets.all(16),
  //     decoration: _cardDecoration(),
  //     child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  //       Row(
  //         mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //         children: [
  //           Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  //             Text(title, style: GoogleFonts.lexend(fontSize: 15,
  //                 fontWeight: FontWeight.w600,
  //                 color: AppColors.kTextPrimary)),
  //             if(subtitle != null) Text(subtitle, style: GoogleFonts.inter(
  //                 fontSize: 11, color: AppColors.kTextSecondary)),
  //           ]),
  //           Container(
  //             padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
  //             decoration: BoxDecoration(
  //                 color: AppColors.kMuted, borderRadius: BorderRadius.circular(6)),
  //             child: Row(children: [
  //               Text("Last 8 Days", style: GoogleFonts.inter(
  //                   fontSize: 10, color: AppColors.kTextPrimary)),
  //               const Icon(
  //                   Icons.arrow_drop_down, size: 16, color: AppColors.kTextPrimary)
  //             ]),
  //           )
  //         ],
  //       ),
  //       const SizedBox(height: 12),
  //       Expanded(child: child),
  //     ]),
  //   );
  // }

  /// -----------------
  /// Lower Row
  /// -----------------
  // Updated chartCard to make the small pill (Last 8 Days) safe and non-overflowing.
// Note: Title here uses Inter (not Lexend) to avoid large font pushing layout.
  Widget _chartCard({required String title, String? subtitle, required Widget child}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: _cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: GoogleFonts.inter(
                              fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.kTextPrimary)),
                      if (subtitle != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text(subtitle,
                              style: GoogleFonts.inter(fontSize: 11, color: AppColors.kTextSecondary)),
                        ),
                    ],
                  ),
                ),

                const SizedBox(width: 10),

                // Safe pill: IntrinsicWidth + FittedBox ensures it never overflows.
              ],
            ),
            const SizedBox(height: 12),
            Expanded(child: child),
          ],
        ),
      ),
    );
  }


// Finalized, shrinked and balanced Patient Dept card (won't overflow)
  Widget _patientDeptCard() {
    // Full upcoming appointments dataset (typed)
    final List<Map<String, String>> upcoming = [
      {"name": "Arthur Morgan", "doctor": "Dr. John", "time": "10:00 AM - 10:30 AM", "status": "Confirmed"},
      {"name": "Regina Mills", "doctor": "Dr. Joel", "time": "10:30 AM - 11:00 AM", "status": "Confirmed"},
      {"name": "David Warner", "doctor": "Dr. John", "time": "11:00 AM - 11:30 AM", "status": "Pending"},
      {"name": "Joseph King", "doctor": "Dr. John", "time": "11:30 AM - 12:00 PM", "status": "Confirmed"},
      {"name": "Lokesh", "doctor": "Dr. John", "time": "12:00 PM - 12:30 PM", "status": "Cancelled"},
      {"name": "Kanagaraj", "doctor": "Dr. John", "time": "12:30 PM - 01:00 PM", "status": "Confirmed"},
      {"name": "Priya", "doctor": "Dr. Olivia", "time": "01:00 PM - 01:30 PM", "status": "Confirmed"},
      {"name": "Suresh K", "doctor": "Dr. Petra", "time": "01:30 PM - 02:00 PM", "status": "Pending"},
      {"name": "Anita", "doctor": "Dr. Ameena", "time": "02:00 PM - 02:30 PM", "status": "Confirmed"},
      {"name": "Ravi", "doctor": "Dr. Damian", "time": "02:30 PM - 03:00 PM", "status": "Confirmed"},
      {"name": "Extra Patient", "doctor": "Dr. Chloe", "time": "03:00 PM - 03:30 PM", "status": "Pending"},
    ];

    // Quick filter options
    final List<String> filters = ['All', 'Confirmed', 'Pending', 'Cancelled', 'By Doctor'];

    // Apply quick filter
    List<Map<String, String>> filtered;
    if (_selectedAppointmentFilter == 'All') {
      filtered = upcoming;
    } else if (_selectedAppointmentFilter == 'By Doctor') {
      final String doctorToShow = 'Dr. John';
      filtered = upcoming.where((a) => (a['doctor'] ?? '') == doctorToShow).toList();
    } else {
      filtered = upcoming
          .where((a) => (a['status'] ?? '').toLowerCase() == _selectedAppointmentFilter.toLowerCase())
          .toList();
    }

    final items = filtered.take(10).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header (title + quick filters dropdown pill)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Upcoming Appointments",
                    style: GoogleFonts.inter(
                        fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.kTextPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text("Next scheduled visits",
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.kTextSecondary)),
                ],
              ),
              Container(
                height: 30,
                width: 80,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.kMuted,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedAppointmentFilter,
                    isExpanded: true,
                    alignment: Alignment.centerLeft,
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextPrimary),
                    items: filters.map((f) {
                      return DropdownMenuItem<String>(
                        value: f,
                        child: Text(
                          f,
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextPrimary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (v) {
                      if (v == null) return;
                      if (v == 'By Doctor') {
                        showDialog(
                          context: context,
                          builder: (ctx) {
                            return AlertDialog(
                              title: Text('Select Doctor',
                                  style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                              content: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  for (var d in ['Dr. John', 'Dr. Joel', 'Dr. Olivia'])
                                    ListTile(
                                      title: Text(d, style: GoogleFonts.inter()),
                                      onTap: () {
                                        setState(() => _selectedAppointmentFilter = 'By Doctor');
                                        Navigator.of(ctx).pop();
                                      },
                                    ),
                                ],
                              ),
                            );
                          },
                        );
                      } else {
                        setState(() => _selectedAppointmentFilter = v);
                      }
                    },
                    icon: const Center(
                      child: Icon(Icons.arrow_drop_down, size: 16),
                    ),
                    dropdownColor: AppColors.kCard,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Scrollable list (internal scroll only, scrollbar hidden)
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: ScrollConfiguration(
                behavior: _NoScrollbarBehavior(),
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  itemCount: items.length,
                  separatorBuilder: (_, __) =>
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  itemBuilder: (context, index) {
                    final it = items[index];
                    final String name = it['name'] ?? '';
                    final String doctor = it['doctor'] ?? '';
                    final String time = it['time'] ?? '';
                    final String status = it['status'] ?? '';
                    final bool confirmed = status.toLowerCase() == 'confirmed';
                    final bool cancelled = status.toLowerCase() == 'cancelled';

                    // 🔹 Decide icon: boy or girl
                    final bool isGirl = name.toLowerCase().endsWith('a') ||
                        name.toLowerCase().endsWith('i') ||
                        name.toLowerCase().endsWith('y');

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          // Avatar (icon instead of initials)
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: Colors.grey.shade200,
                            backgroundImage: AssetImage(
                              isGirl ? 'assets/girlicon.png' : 'assets/boyicon.png',
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Name + doctor/time
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name,
                                    style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.kTextPrimary)),
                                const SizedBox(height: 2),
                                Text("$doctor • $time",
                                    style: GoogleFonts.inter(
                                        fontSize: 11, color: AppColors.kTextSecondary)),
                              ],
                            ),
                          ),

                          // Status chip
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: cancelled
                                  ? Colors.red.shade50
                                  : (confirmed
                                  ? Colors.green.shade50
                                  : Colors.yellow.shade50),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Text(
                              status,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: cancelled
                                    ? Colors.red.shade700
                                    : (confirmed
                                    ? Colors.green.shade700
                                    : Colors.orange.shade700),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }





  // Widget _doctorScheduleCard() {
  //   final doctors = [
  //     {
  //       "name": "Dr. Petra Winsburry",
  //       "dept": "General Medicine",
  //       "time": "09:00 AM - 12:00 PM",
  //       "status": "Available"
  //     },
  //     {
  //       "name": "Dr. Ameena Karim",
  //       "dept": "Orthopedics",
  //       "time": "10:00 AM - 01:00 PM",
  //       "status": "Unavailable"
  //     },
  //     {
  //       "name": "Dr. Olivia Martinez",
  //       "dept": "Cardiology",
  //       "time": "10:00 AM - 01:00 PM",
  //       "status": "Available"
  //     },
  //     {
  //       "name": "Dr. Damian Sanchez",
  //       "dept": "Pediatrics",
  //       "time": "11:00 AM - 02:00 PM",
  //       "status": "Available"
  //     },
  //     {
  //       "name": "Dr. Chloe Harrington",
  //       "dept": "Dermatology",
  //       "time": "11:00 AM - 02:00 PM",
  //       "status": "Unavailable"
  //     },
  //   ];
  //   return _chartCard(
  //     title: "Doctors' Schedule",
  //     child: ListView.builder(
  //       physics: const NeverScrollableScrollPhysics(),
  //       itemCount: doctors.length,
  //       itemBuilder: (context, i) {
  //         final d = doctors[i];
  //         final isAvailable = d["status"] == "Available";
  //         return Padding(
  //           padding: const EdgeInsets.only(bottom: 8),
  //           child: Row(
  //             children: [
  //               const CircleAvatar(
  //                   backgroundImage: NetworkImage("https://placehold.co/48x48"),
  //                   radius: 16),
  //               const SizedBox(width: 8),
  //               Expanded(
  //                 child: Column(
  //                   crossAxisAlignment: CrossAxisAlignment.start,
  //                   children: [
  //                     Text(d["name"]!, style: GoogleFonts.inter(fontSize: 12,
  //                         fontWeight: FontWeight.w500,
  //                         color: AppColors.kTextPrimary)),
  //                     Text(d["dept"]!, style: GoogleFonts.inter(
  //                         fontSize: 11, color: AppColors.kTextSecondary)),
  //                   ],
  //                 ),
  //               ),
  //               Text(d["time"]!, style: GoogleFonts.inter(
  //                   fontSize: 11, color: AppColors.kTextSecondary)),
  //               const SizedBox(width: 6),
  //               Container(
  //                 padding: const EdgeInsets.symmetric(
  //                     horizontal: 8, vertical: 4),
  //                 decoration: BoxDecoration(
  //                   color: isAvailable ? Colors.green.shade100 : Colors.red
  //                       .shade100,
  //                   borderRadius: BorderRadius.circular(12),
  //                 ),
  //                 child: Text(d["status"]!, style: GoogleFonts.inter(
  //                     fontSize: 11,
  //                     color: isAvailable ? Colors.green.shade700 : Colors.red
  //                         .shade700)),
  //               )
  //             ],
  //           ),
  //         );
  //       },
  //     ),
  //   );
  // }

  Widget _reportCard() {
    // Quick filter options
    final List<String> filters = [
      'All', 'Cleaning', 'Equipment', 'Medication', 'HVAC', 'Transport'
    ];

    // Full reports dataset (typed)
    final List<Map<String, dynamic>> reports = [
      {"icon": Icons.cleaning_services, "title": "Room Cleaning Needed", "time": "1 min ago", "tag": "Cleaning"},
      {"icon": Icons.build, "title": "Equipment Maintenance", "time": "3 min ago", "tag": "Equipment"},
      {"icon": Icons.medical_services, "title": "Medication Restock", "time": "5 min ago", "tag": "Medication"},
      {"icon": Icons.ac_unit, "title": "HVAC System Issue", "time": "1 hour ago", "tag": "HVAC"},
      {"icon": Icons.local_shipping, "title": "Patient Transport Required", "time": "Yesterday", "tag": "Transport"},
      {"icon": Icons.cleaning_services, "title": "Ward Sanitization Overdue", "time": "2 hours ago", "tag": "Cleaning"},
      {"icon": Icons.build, "title": "X-Ray Calibration", "time": "3 hours ago", "tag": "Equipment"},
      {"icon": Icons.medical_services, "title": "Vaccine Stock Low", "time": "4 hours ago", "tag": "Medication"},
      {"icon": Icons.ac_unit, "title": "Ventilation Check", "time": "5 hours ago", "tag": "HVAC"},
      {"icon": Icons.local_shipping, "title": "Wheelchair Request", "time": "Yesterday", "tag": "Transport"},
      {"icon": Icons.build, "title": "MRI Maintenance", "time": "Yesterday", "tag": "Equipment"},
    ];

    // Apply quick filter
    final filtered = (_selectedReportFilter == 'All')
        ? reports
        : reports.where((r) =>
    (r['tag'] as String).toLowerCase() ==
        _selectedReportFilter.toLowerCase()).toList();

    // ✅ Show all filtered reports (no 10/10 cap)
    final items = filtered;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: title + quick-filter pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Report",
                      style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.kTextPrimary)),
                  const SizedBox(height: 4),
                  Text("Recent system & facility reports",
                      style: GoogleFonts.inter(
                          fontSize: 11, color: AppColors.kTextSecondary)),
                ],
              ),

              // ✅ Compact quick filter dropdown pill
              Container(
                height: 30,
                width: 100,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.kMuted,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedReportFilter,
                    isDense: true,
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextPrimary),
                    items: filters.map((f) {
                      return DropdownMenuItem<String>(
                        value: f,
                        child: Text(
                          f,
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextPrimary),
                          overflow: TextOverflow.ellipsis, // ✅ prevent overflow
                        ),
                      );
                    }).toList(),
                    onChanged: (v) {
                      if (v == null) return;
                      setState(() {
                        _selectedReportFilter = v;
                      });
                    },
                    icon: const Icon(Icons.arrow_drop_down, size: 16),
                    dropdownColor: AppColors.kCard,
                    // ✅ fixes the "10/10" fallback
                    isExpanded: false,
                  ),
                ),
              ),

            ],
          ),
          const SizedBox(height: 12),

          // Scrollable list (internal scroll only, scrollbar hidden)
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: ScrollConfiguration(
                behavior: _NoScrollbarBehavior(),
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  itemCount: items.length,
                  separatorBuilder: (_, __) =>
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  itemBuilder: (context, index) {
                    final r = items[index];
                    final IconData icon = r['icon'] as IconData;
                    final String title = r['title'] as String;
                    final String time = r['time'] as String;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(
                          vertical: 8, horizontal: 10),
                      decoration: BoxDecoration(
                          color: AppColors.kBg,
                          borderRadius: BorderRadius.circular(8)),
                      child: Row(
                        children: [
                          Icon(icon, size: 18, color: AppColors.kInfo),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(title,
                                    style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.kTextPrimary)),
                                const SizedBox(height: 4),
                                Text(time,
                                    style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: AppColors.kTextSecondary)),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios,
                              size: 14, color: AppColors.kTextSecondary),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }


 // put at the top of the file if not already imported

  Widget _calendarCard() {
    final now = DateTime.now();

    return _chartCard(
      title: 'Calendar',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ---- COMPACT CALENDAR ----
          TableCalendar(
            focusedDay: _focusedDay,
            firstDay: DateTime.utc(2020, 1, 1),
            lastDay: DateTime.utc(2030, 12, 31),
            selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
            onDaySelected: (selected, focused) {
              setState(() {
                _selectedDay = selected;
                _focusedDay = focused;
              });
            },

            // 🔹 Reduce row height (compact calendar)
            rowHeight: 36,

            headerStyle: HeaderStyle(
              titleCentered: true,
              formatButtonVisible: false,
              titleTextStyle: GoogleFonts.lexend(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.kTextPrimary,
              ),
              leftChevronIcon: const Icon(Icons.chevron_left, size: 16),
              rightChevronIcon: const Icon(Icons.chevron_right, size: 16),
            ),
            calendarStyle: CalendarStyle(
              // 🔹 Reduce padding inside cells
              cellMargin: const EdgeInsets.all(2),
              cellPadding: const EdgeInsets.symmetric(vertical: 2),

              todayDecoration: BoxDecoration(
                color: AppColors.kInfo.withOpacity(.6),
                shape: BoxShape.circle,
              ),
              selectedDecoration: BoxDecoration(
                color: AppColors.kInfo,
                shape: BoxShape.circle,
              ),
              defaultTextStyle: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.kTextPrimary,
              ),
              weekendTextStyle: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.kDanger,
              ),
              todayTextStyle: GoogleFonts.inter(
                fontSize: 12,
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
            daysOfWeekStyle: DaysOfWeekStyle(
              weekdayStyle: GoogleFonts.inter(
                fontSize: 11,
                color: AppColors.kTextSecondary,
              ),
              weekendStyle: GoogleFonts.inter(
                fontSize: 11,
                color: AppColors.kDanger,
              ),
            ),
          ),

          const SizedBox(height: 8),

          // ---- ACTIVITIES HEADER ----
          Row(
            children: [
              Text(
                'Activities',
                style: GoogleFonts.lexend(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.kTextPrimary,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                DateFormat('EEE, d MMM').format(_selectedDay ?? _focusedDay),
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppColors.kTextSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          // ---- SCROLLABLE EVENTS LIST ----
          Expanded(
            child: ScrollConfiguration(
              behavior: _NoScrollbarBehavior(),
              child: ListView.builder(
                physics: const BouncingScrollPhysics(),
                itemCount: _getEventsForDay(_selectedDay ?? _focusedDay).length,
                itemBuilder: (context, idx) {
                  final ev = _getEventsForDay(_selectedDay ?? _focusedDay)[idx];
                  return _eventTile(
                    ev['title'] as String,
                    ev['time'] as String,
                    ev['color'] as Color,
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }








// ---------------------------
// Helper widgets
// ---------------------------

  Widget _eventTile(String title, String time, Color color) {
    return InkWell(
      onTap: () {
        // add navigation or modal open
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.01),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.08)),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 6)),
          ],
        ),
        child: Row(
          children: [
            // vertical accent
            Container(
              width: 8,
              height: 48,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [color.withOpacity(.9), color.withOpacity(.6)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
                borderRadius: BorderRadius.circular(6),
              ),
              margin: const EdgeInsets.only(right: 12),
            ),
            // text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.kTextPrimary)),
                  const SizedBox(height: 6),
                  Text(time, style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary)),
                ],
              ),
            ),
            // action
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.chevron_right, size: 18),
            ),
          ],
        ),
      ),
    );
  }
}
class _NoScrollbarBehavior extends ScrollBehavior {
  @override
  Widget buildOverscrollIndicator(BuildContext context, Widget child, ScrollableDetails details) {
    // remove the glowing effect on Android
    return child;
  }

  @override
  Widget buildScrollbar(BuildContext context, Widget child, ScrollableDetails details) {
    // prevents default Scrollbar from being added
    return child;
  }
}