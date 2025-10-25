import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:shimmer/shimmer.dart';
import 'package:intl/intl.dart';

import '../../Utils/Colors.dart';

// --- Data Models ---
class ScheduleEvent {
  final String id;
  final String title;
  final String time;
  final String type; // 'appointment', 'break', etc.
  final String? patientName;
  final String? reason;

  ScheduleEvent({
    required this.id,
    required this.title,
    required this.time,
    required this.type,
    this.patientName,
    this.reason,
  });

  factory ScheduleEvent.fromMap(Map<String, dynamic> map) {
    return ScheduleEvent(
      id: map['id'] ?? '',
      title: map['title'] ?? '',
      time: map['time'] ?? '',
      type: map['type'] ?? 'appointment',
      patientName: map['patientName'],
      reason: map['reason'],
    );
  }
}

// --- Simulated API Data ---
final Map<String, List<Map<String, dynamic>>> _scheduleApiData = {
  'Monday': [
    {'id': '1', 'title': 'Team Meeting', 'time': '9:00 AM - 10:00 AM', 'type': 'break'},
    {'id': '2', 'title': 'Regina Cooper', 'time': '10:30 AM - 11:00 AM', 'type': 'appointment', 'patientName': 'Regina Cooper', 'reason': 'Regular Checkup'},
    {'id': '3', 'title': 'David Smith', 'time': '11:00 AM - 11:30 AM', 'type': 'appointment', 'patientName': 'David Smith', 'reason': 'Follow-up'},
  ],
  'Tuesday': [
    {'id': '4', 'title': 'Joseph Brown', 'time': '11:30 AM - 12:00 PM', 'type': 'appointment', 'patientName': 'Joseph Brown', 'reason': 'Consultation'},
    {'id': '5', 'title': 'Lunch Break', 'time': '1:00 PM - 2:00 PM', 'type': 'break'},
    {'id': '6', 'title': 'Sophia Miller', 'time': '2:00 PM - 2:30 PM', 'type': 'appointment', 'patientName': 'Sophia Miller', 'reason': 'New Patient'},
  ],
  'Wednesday': [],
  'Thursday': [
    {'id': '7', 'title': 'Lokesh Kumar', 'time': '12:00 PM - 12:30 PM', 'type': 'appointment', 'patientName': 'Lokesh Kumar', 'reason': 'Treatment'},
    {'id': '8', 'title': 'Admin Work', 'time': '3:00 PM - 4:00 PM', 'type': 'break'},
  ],
  'Friday': [
    {'id': '9', 'title': 'Follow-ups', 'time': '9:00 AM - 10:00 AM', 'type': 'break'},
    {'id': '10', 'title': 'John Philips', 'time': '10:00 AM - 10:30 AM', 'type': 'appointment', 'patientName': 'John Philips', 'reason': 'Checkup'},
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

class _DoctorScheduleScreenState extends State<DoctorScheduleScreen> {
  bool _isLoading = false;
  bool _isRefreshing = false;
  Map<String, List<ScheduleEvent>> _schedule = {};
  String _selectedDay = '';
  String _searchQuery = '';

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
    _selectedDay = _orderedDays[DateTime.now().weekday - 1];
    _loadSchedule();
  }

  Future<void> _loadSchedule({bool showLoading = true}) async {
    if (showLoading) {
      setState(() => _isLoading = true);
    }

    try {
      await Future.delayed(const Duration(milliseconds: 500));
      final mapped = <String, List<ScheduleEvent>>{};
      for (final d in _orderedDays) {
        final raw = _scheduleApiData[d] ?? [];
        mapped[d] = raw.map((e) => ScheduleEvent.fromMap(e)).toList();
      }

      if (mounted) {
        setState(() {
          _schedule = mapped;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load schedule: $e'),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
        });
      }
    }
  }

  Future<void> _refreshSchedule() async {
    setState(() => _isRefreshing = true);
    await _loadSchedule(showLoading: false);
  }

  List<ScheduleEvent> get _filteredEvents {
    final events = _schedule[_selectedDay] ?? [];
    if (_searchQuery.isEmpty) return events;
    return events.where((e) {
      return e.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (e.patientName?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          (e.reason?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
    }).toList();
  }

  int _getTotalAppointments() {
    return _schedule[_selectedDay]?.where((e) => e.type == 'appointment').length ?? 0;
  }

  int _getTotalBreaks() {
    return _schedule[_selectedDay]?.where((e) => e.type == 'break').length ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgGray,
      body: SafeArea(
        child: Column(
          children: [
            // Enterprise Header
            _buildEnterpriseHeader(),
            
            const SizedBox(height: 24),
            
            // Stats Bar
            _buildStatsBar(),
            
            const SizedBox(height: 24),
            
            // Day Selector
            _buildDaySelector(),
            
            const SizedBox(height: 24),
            
            // Schedule Content
            Expanded(
              child: _isLoading
                  ? _buildSkeletonLoader()
                  : _buildScheduleList(),
            ),
          ],
        ),
      ),
    );
  }

  /// Enterprise-grade header (EXACT MATCH to Patients/Appointments)
  Widget _buildEnterpriseHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon + Title + Subtitle
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary,
                  AppColors.primary.withOpacity(0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              Iconsax.calendar,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Schedule',
                style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                  letterSpacing: -0.5,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Manage your weekly schedule',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: AppColors.textLight,
                  letterSpacing: 0.1,
                ),
              ),
            ],
          ),
          
          const SizedBox(width: 24),
          
          // Extended Search Field
          Expanded(
            child: Container(
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.bgGray,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _searchQuery.isNotEmpty
                      ? AppColors.primary.withOpacity(0.3)
                      : AppColors.grey200,
                  width: 1.5,
                ),
              ),
              child: TextField(
                onChanged: (value) => setState(() => _searchQuery = value),
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textDark,
                  letterSpacing: 0.2,
                ),
                decoration: InputDecoration(
                  hintText: 'Search by patient name, reason, or time...',
                  hintStyle: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                    color: AppColors.textLight,
                    letterSpacing: 0.2,
                  ),
                  prefixIcon: Container(
                    padding: const EdgeInsets.all(12),
                    child: Icon(
                      Iconsax.search_normal_1,
                      color: _searchQuery.isNotEmpty
                          ? AppColors.primary
                          : AppColors.textLight,
                      size: 22,
                    ),
                  ),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_searchQuery.isNotEmpty)
                        IconButton(
                          icon: const Icon(Iconsax.close_circle, size: 20),
                          color: AppColors.textLight,
                          onPressed: () => setState(() => _searchQuery = ''),
                          tooltip: 'Clear search',
                        ),
                      // Today Button
                      IconButton(
                        onPressed: () {
                          setState(() => _selectedDay = _orderedDays[DateTime.now().weekday - 1]);
                        },
                        tooltip: 'Today',
                        icon: const Icon(
                          Iconsax.calendar_2,
                          size: 22,
                        ),
                        color: AppColors.primary,
                      ),
                      // Refresh Button
                      IconButton(
                        onPressed: _isRefreshing ? null : _refreshSchedule,
                        tooltip: 'Refresh schedule',
                        icon: Icon(
                          Iconsax.refresh,
                          color: _isRefreshing ? AppColors.textLight : AppColors.primary,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Stats summary bar
  Widget _buildStatsBar() {
    final totalEvents = _schedule[_selectedDay]?.length ?? 0;
    final appointments = _getTotalAppointments();
    final breaks = _getTotalBreaks();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.primary.withOpacity(0.05),
              AppColors.accentPink.withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.grey200,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            _buildStatItem(
              icon: Iconsax.calendar_1,
              label: 'Total Events',
              value: totalEvents.toString(),
              color: AppColors.primary,
            ),
            _buildStatDivider(),
            _buildStatItem(
              icon: Iconsax.user,
              label: 'Appointments',
              value: appointments.toString(),
              color: AppColors.kInfo,
            ),
            _buildStatDivider(),
            _buildStatItem(
              icon: Iconsax.coffee,
              label: 'Breaks',
              value: breaks.toString(),
              color: AppColors.kSuccess,
            ),
            _buildStatDivider(),
            _buildStatItem(
              icon: Iconsax.clock,
              label: 'Today',
              value: _selectedDay == _orderedDays[DateTime.now().weekday - 1] ? 'Active' : 'View',
              color: AppColors.accentPink,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatDivider() {
    return Container(
      height: 40,
      width: 1,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: AppColors.grey200,
    );
  }

  /// Day selector chips
  Widget _buildDaySelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _orderedDays.map((day) {
            final isSelected = day == _selectedDay;
            final isToday = day == _orderedDays[DateTime.now().weekday - 1];
            final eventCount = _schedule[day]?.length ?? 0;

            return Padding(
              padding: const EdgeInsets.only(right: 12),
              child: InkWell(
                onTap: () => setState(() => _selectedDay = day),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? LinearGradient(
                            colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)],
                          )
                        : null,
                    color: isSelected ? null : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : (isToday ? AppColors.primary.withOpacity(0.3) : AppColors.grey200),
                      width: isSelected ? 2 : 1.5,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        day.substring(0, 3),
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? Colors.white : AppColors.textDark,
                          letterSpacing: 0.3,
                        ),
                      ),
                      if (eventCount > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Colors.white.withOpacity(0.3)
                                : AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            eventCount.toString(),
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? Colors.white : AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                      if (isToday && !isSelected) ...[
                        const SizedBox(width: 8),
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  /// Skeleton loader
  Widget _buildSkeletonLoader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Column(
          children: List.generate(6, (index) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            );
          }),
        ),
      ),
    );
  }

  /// Schedule list
  Widget _buildScheduleList() {
    final events = _filteredEvents;

    if (events.isEmpty) {
      return _buildEmptyState();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: ListView.builder(
        itemCount: events.length,
        itemBuilder: (context, index) {
          return _buildEventCard(events[index], index);
        },
      ),
    );
  }

  /// Event card
  Widget _buildEventCard(ScheduleEvent event, int index) {
    final isAppointment = event.type == 'appointment';
    final isEven = index % 2 == 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isEven ? Colors.white : AppColors.bgGray.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAppointment
              ? AppColors.primary.withOpacity(0.2)
              : AppColors.grey200,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Time badge
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isAppointment
                    ? [AppColors.primary, AppColors.primary.withOpacity(0.8)]
                    : [AppColors.kSuccess, AppColors.kSuccess.withOpacity(0.8)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isAppointment ? Iconsax.user : Iconsax.coffee,
              color: Colors.white,
              size: 24,
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Event details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        event.title,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textDark,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isAppointment
                            ? AppColors.kInfo.withOpacity(0.1)
                            : AppColors.kSuccess.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isAppointment ? 'Appointment' : 'Break',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isAppointment ? AppColors.kInfo : AppColors.kSuccess,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Iconsax.clock, size: 14, color: AppColors.textLight),
                    const SizedBox(width: 6),
                    Text(
                      event.time,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textLight,
                      ),
                    ),
                    if (event.reason != null) ...[
                      const SizedBox(width: 16),
                      Icon(Iconsax.note, size: 14, color: AppColors.textLight),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          event.reason!,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textLight,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Action button
          IconButton(
            onPressed: () {
              // View details
            },
            icon: const Icon(Iconsax.eye, size: 20),
            color: AppColors.primary,
            tooltip: 'View Details',
          ),
        ],
      ),
    );
  }

  /// Empty state
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.bgGray,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Iconsax.calendar_remove,
              size: 64,
              color: AppColors.textLight,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _searchQuery.isNotEmpty
                ? 'No events found'
                : 'No events scheduled',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isNotEmpty
                ? 'Try adjusting your search'
                : 'This day is free',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textLight,
            ),
          ),
        ],
      ),
    );
  }
}
