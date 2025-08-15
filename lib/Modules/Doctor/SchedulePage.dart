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
      title: map['title'],
      time: map['time'],
      type: map['type'],
    );
  }
}

// --- Simulated API Data ---
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

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _scheduleFuture = _fetchSchedule();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<Map<String, List<ScheduleEvent>>> _fetchSchedule() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _scheduleApiData.map((key, value) {
      return MapEntry(key, value.map((e) => ScheduleEvent.fromMap(e)).toList());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<Map<String, List<ScheduleEvent>>>(
        future: _scheduleFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildScheduleContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('No schedule found.'));
          }
        },
      ),
    );
  }

  Widget _buildScheduleContent(BuildContext context, Map<String, List<ScheduleEvent>> schedule) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 32),
          _buildWeekView(schedule),
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
          'My Schedule',
          style: GoogleFonts.poppins(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
        // const CircleAvatar(
        //   backgroundImage: NetworkImage('https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
        //   radius: 32,
        // ),
      ],
    );
  }

  Widget _buildWeekView(Map<String, List<ScheduleEvent>> schedule) {
    return Container(
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: schedule.entries.map((entry) {
          return Expanded(
            child: _buildDayColumn(entry.key, entry.value),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDayColumn(String day, List<ScheduleEvent> events) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: Colors.grey[200]!, width: 1.0),
        ),
      ),
      child: Column(
        children: [
          Text(
            day.toUpperCase(),
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.bold,
              color: textSecondaryColor,
            ),
          ),
          const SizedBox(height: 16),
          ...events.map((event) => _buildEventCard(event)).toList(),
        ],
      ),
    );
  }

  Widget _buildEventCard(ScheduleEvent event) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: event.type == 'appointment' ? primaryColorLight : Colors.grey[100],
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              event.title,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.bold,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              event.time,
              style: GoogleFonts.poppins(color: textSecondaryColor),
            ),
          ],
        ),
      ),
    );
  }
}
