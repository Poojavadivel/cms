import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Utils/Colors.dart'; // make sure path matches your project

// --- Data Models ---
class ScheduleEvent {
  final String title;
  final String time;
  final String type; // 'appointment', 'break', etc.

  ScheduleEvent({
    required this.title,
    required this.time,
    required this.type,
  });

  factory ScheduleEvent.fromMap(Map<String, dynamic> map) {
    return ScheduleEvent(
      title: map['title'] ?? '',
      time: map['time'] ?? '',
      type: map['type'] ?? 'appointment',
    );
  }
}

// --- Simulated API Data (Mon-Fri preserved, weekend empty) ---
final Map<String, List<Map<String, dynamic>>> _scheduleApiData = {
  'Monday': [
    {'title': 'Team Meeting', 'time': '9:00 AM - 10:00 AM', 'type': 'break'},
    {'title': 'Regina', 'time': '10:30 AM - 11:00 AM', 'type': 'appointment'},
    {'title': 'David', 'time': '11:00 AM - 11:30 AM', 'type': 'appointment'},
  ],
  'Tuesday': [
    {'title': 'Joseph', 'time': '11:30 AM - 12:00 PM', 'type': 'appointment'},
    {'title': 'Lunch Break', 'time': '1:00 PM - 2:00 PM', 'type': 'break'},
    {'title': 'Sophia Miller', 'time': '2:00 PM - 2:30 PM', 'type': 'appointment'},
  ],
  'Wednesday': [],
  'Thursday': [
    {'title': 'Lokesh', 'time': '12:00 PM - 12:30 PM', 'type': 'appointment'},
    {'title': 'Admin Work', 'time': '3:00 PM - 4:00 PM', 'type': 'break'},
  ],
  'Friday': [
    {'title': 'Follow-ups', 'time': '9:00 AM - 10:00 AM', 'type': 'break'},
    {'title': 'John Philips', 'time': '10:00 AM - 10:30 AM', 'type': 'appointment'},
  ],
  'Saturday': [],
  'Sunday': [],
};

// --- Main Doctor Schedule Screen Widget ---
class DoctorScheduleScreen extends StatefulWidget {
  const DoctorScheduleScreen({super.key});

  @override
  State<DoctorScheduleScreen> createState() => _DoctorScheduleScreenState();
}

class _DoctorScheduleScreenState extends State<DoctorScheduleScreen> with SingleTickerProviderStateMixin {
  late Future<Map<String, List<ScheduleEvent>>> _scheduleFuture;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  final List<String> _orderedDays = const [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this, duration: const Duration(milliseconds: 450));
    _fadeAnimation = CurvedAnimation(parent: _animationController, curve: Curves.easeInOut);
    _scheduleFuture = _fetchSchedule();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<Map<String, List<ScheduleEvent>>> _fetchSchedule() async {
    await Future.delayed(const Duration(milliseconds: 600));
    _animationController.forward();
    final mapped = <String, List<ScheduleEvent>>{};
    for (final d in _orderedDays) {
      final raw = _scheduleApiData[d] ?? [];
      mapped[d] = raw.map((e) => ScheduleEvent.fromMap(e)).toList();
    }
    return mapped;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: FutureBuilder<Map<String, List<ScheduleEvent>>>(
          future: _scheduleFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: SizedBox(width: 36, height: 36, child: CircularProgressIndicator()));
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}', style: GoogleFonts.inter(color: AppColors.kTextPrimary)));
            } else if (snapshot.hasData) {
              return FadeTransition(opacity: _fadeAnimation, child: _buildScheduleContent(context, snapshot.data!));
            } else {
              return Center(child: Text('No schedule found', style: GoogleFonts.inter(color: AppColors.kTextSecondary)));
            }
          },
        ),
      ),
    );
  }

  Widget _buildScheduleContent(BuildContext context, Map<String, List<ScheduleEvent>> schedule) {
    return LayoutBuilder(builder: (context, constraints) {
      final maxWidth = constraints.maxWidth;
      final maxHeight = constraints.maxHeight;

      // Reserve header area height
      const headerReserve = 120.0;
      // available height for schedule card
      final availableHeight = (maxHeight - headerReserve).clamp(360.0, 900.0);
      final containerHeight = availableHeight;

      final isNarrow = maxWidth < 1000;
      // smaller min width so weekend fits on narrower screens
      final dayMinWidth = isNarrow ? 200.0 : 240.0;

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(maxWidth),
            const SizedBox(height: 18),
            SizedBox(
              height: containerHeight,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.kCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.grey200),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 18, offset: const Offset(0, 8))],
                ),
                padding: const EdgeInsets.all(14),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: LayoutBuilder(builder: (context, innerConstraints) {
                    // choose layout based on width
                    if (innerConstraints.maxWidth < 900) {
                      return _buildScrollableStackedWeek(schedule, dayMinWidth: dayMinWidth, cardHeight: containerHeight);
                    } else {
                      return _buildWeekRow(schedule, dayMinWidth: dayMinWidth, cardHeight: containerHeight);
                    }
                  }),
                ),
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildHeader(double maxWidth) {
    final isCompact = maxWidth < 840;
    return Row(
      children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('My Schedule', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.kTextPrimary)),
            const SizedBox(height: 6),
            Text('Overview for the week', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
          ]),
        ),
        Row(children: [
          OutlinedButton.icon(
            onPressed: () {},
            icon: Icon(Icons.today, size: 16, color: AppColors.kTextPrimary),
            label: Text('Today', style: GoogleFonts.inter(color: AppColors.kTextPrimary)),
            style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.grey200), backgroundColor: AppColors.kCard, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
          ),
          const SizedBox(width: 10),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.add, size: 16),
            label: Text(isCompact ? 'New' : 'New appointment', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
          ),
        ]),
      ],
    );
  }

  Widget _buildWeekRow(Map<String, List<ScheduleEvent>> schedule, {required double dayMinWidth, required double cardHeight}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _orderedDays.map((day) {
        final events = schedule[day] ?? [];
        return Flexible(
          fit: FlexFit.tight,
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: dayMinWidth),
            child: _buildDayColumn(day, events, cardHeight: cardHeight),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildScrollableStackedWeek(Map<String, List<ScheduleEvent>> schedule, {required double dayMinWidth, required double cardHeight}) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _orderedDays.map((day) {
          final events = schedule[day] ?? [];
          return SizedBox(width: dayMinWidth, child: _buildDayColumn(day, events, cardHeight: cardHeight));
        }).toList(),
      ),
    );
  }

  Widget _buildDayColumn(String day, List<ScheduleEvent> events, {required double cardHeight}) {
    final isWeekend = day == 'Saturday' || day == 'Sunday';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        border: Border(right: BorderSide(color: AppColors.grey200, width: 1)),
      ),
      height: double.infinity,
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(day.toUpperCase(), style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: isWeekend ? AppColors.primary : AppColors.kTextSecondary)),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: isWeekend ? AppColors.primary.withOpacity(0.06) : AppColors.rowAlternate,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('${events.length}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Expanded(
            child: events.isEmpty ? _buildEmptyDay() : _buildEventsList(events),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyDay() {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.calendar_month, size: 36, color: AppColors.kTextSecondary.withOpacity(0.6)),
        const SizedBox(height: 8),
        Text('No data', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
      ]),
    );
  }

  Widget _buildEventsList(List<ScheduleEvent> events) {
    return Scrollbar(
      thumbVisibility: true,
      child: ListView.separated(
        padding: EdgeInsets.zero,
        itemCount: events.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, idx) {
          return _buildEventCard(events[idx]);
        },
      ),
    );
  }

  Widget _buildEventCard(ScheduleEvent event) {
    final isAppointment = event.type == 'appointment';
    final bg = isAppointment ? AppColors.kCFBlue.withOpacity(0.06) : AppColors.rowAlternate;
    final border = isAppointment ? AppColors.kCFBlue.withOpacity(0.12) : AppColors.grey200;
    final badgeColor = isAppointment ? AppColors.primary : AppColors.kTextSecondary;

    return LayoutBuilder(builder: (context, constraints) {
      // compact if narrow column
      final compact = constraints.maxWidth < 240;

      // We constrain chips and the time box so they cannot push the card wider.
      final chipMaxWidth = constraints.maxWidth * 0.45;
      final timeMaxWidth = constraints.maxWidth * 0.45;

      return MouseRegion(
        cursor: SystemMouseCursors.click,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: EdgeInsets.all(compact ? 8.0 : 12.0),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: border),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 4))],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // left accent
                  Container(width: 6, height: 46, decoration: BoxDecoration(color: badgeColor, borderRadius: BorderRadius.circular(6))),
                  const SizedBox(width: 10),

                  // title + chips: this area is flexible and will ellipsize or wrap safely
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title (wraps up to 2 lines)
                        Text(
                          event.title,
                          maxLines: compact ? 1 : 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(fontSize: compact ? 13 : 14, fontWeight: FontWeight.w700, color: AppColors.kTextPrimary),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            // Time chip (constrained)
                            ConstrainedBox(
                              constraints: BoxConstraints(maxWidth: timeMaxWidth),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(color: AppColors.kCard, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.grey200)),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.schedule, size: 14, color: AppColors.kTextSecondary),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        event.time,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Type badge (constrained)
                            ConstrainedBox(
                              constraints: BoxConstraints(maxWidth: chipMaxWidth),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(color: isAppointment ? AppColors.primary.withOpacity(0.08) : AppColors.kTextSecondary.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                                child: Text(
                                  isAppointment ? 'Appointment' : 'Break',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: badgeColor),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // compact popup actions - doesn't increase layout width
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 36,
                    height: 36,
                    child: PopupMenuButton<int>(
                      tooltip: 'More actions',
                      padding: EdgeInsets.zero,
                      icon: Icon(Icons.more_vert, size: 18, color: AppColors.kTextSecondary),
                      onSelected: (v) {},
                      itemBuilder: (ctx) => [
                        PopupMenuItem(value: 1, child: Text('View', style: GoogleFonts.inter())),
                        PopupMenuItem(value: 2, child: Text('Reschedule', style: GoogleFonts.inter())),
                        PopupMenuItem(value: 3, child: Text('Cancel', style: GoogleFonts.inter())),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    });
  }
}
