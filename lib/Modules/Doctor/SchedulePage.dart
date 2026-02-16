import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';

class DoctorScheduleScreen extends StatefulWidget {
  const DoctorScheduleScreen({super.key});

  @override
  State<DoctorScheduleScreen> createState() => _DoctorScheduleScreenState();
}

class _DoctorScheduleScreenState extends State<DoctorScheduleScreen> {
  bool _loading = true;
  List<DashboardAppointments> _appointments = [];
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.month;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _loading = true);
    try {
      final appointments = await AuthService.instance.fetchAppointments();
      if (mounted) {
        setState(() => _appointments = appointments);
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<DashboardAppointments> _getAppointmentsForDay(DateTime day) {
    final dayStr = DateFormat('yyyy-MM-dd').format(day);
    return _appointments.where((a) {
      try {
        final apptDate = DateFormat('MMM dd, yyyy').parse(a.date);
        return DateFormat('yyyy-MM-dd').format(apptDate) == dayStr;
      } catch (e) {
        return false;
      }
    }).toList()..sort((a, b) => a.time.compareTo(b.time));
  }

  int _getAppointmentCountForDay(DateTime day) {
    return _getAppointmentsForDay(day).length;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        color: const Color(0xFFF5F7FA),
        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    final selectedDayAppointments = _getAppointmentsForDay(_selectedDay);

    return Container(
      color: const Color(0xFFF5F7FA),
      padding: const EdgeInsets.all(24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Calendar Section
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Schedule Calendar', style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 24),
                  TableCalendar(
                    firstDay: DateTime.utc(2020, 1, 1),
                    lastDay: DateTime.utc(2030, 12, 31),
                    focusedDay: _focusedDay,
                    selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                    calendarFormat: _calendarFormat,
                    onDaySelected: (selectedDay, focusedDay) {
                      setState(() {
                        _selectedDay = selectedDay;
                        _focusedDay = focusedDay;
                      });
                    },
                    onFormatChanged: (format) {
                      setState(() => _calendarFormat = format);
                    },
                    onPageChanged: (focusedDay) {
                      _focusedDay = focusedDay;
                    },
                    eventLoader: (day) => List.generate(_getAppointmentCountForDay(day), (_) => ''),
                    calendarStyle: CalendarStyle(
                      todayDecoration: BoxDecoration(
                        color: const Color(0xFF4FACFE).withOpacity(0.3),
                        shape: BoxShape.circle,
                      ),
                      selectedDecoration: const BoxDecoration(
                        color: Color(0xFF667EEA),
                        shape: BoxShape.circle,
                      ),
                      markerDecoration: const BoxDecoration(
                        color: Color(0xFFF093FB),
                        shape: BoxShape.circle,
                      ),
                      todayTextStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                      selectedTextStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
                      defaultTextStyle: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF1E293B)),
                      weekendTextStyle: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B)),
                      outsideTextStyle: GoogleFonts.inter(fontSize: 14, color: const Color(0xFFCBD5E1)),
                    ),
                    headerStyle: HeaderStyle(
                      formatButtonVisible: true,
                      titleCentered: true,
                      titleTextStyle: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                      formatButtonTextStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF667EEA)),
                      formatButtonDecoration: BoxDecoration(
                        color: const Color(0xFF667EEA).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      leftChevronIcon: const Icon(Iconsax.arrow_left_2, color: Color(0xFF667EEA)),
                      rightChevronIcon: const Icon(Iconsax.arrow_right_3, color: Color(0xFF667EEA)),
                    ),
                    daysOfWeekStyle: DaysOfWeekStyle(
                      weekdayStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                      weekendStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(width: 24),

          // Appointments List Section
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Appointments', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B))),
                          const SizedBox(height: 4),
                          Text(
                            DateFormat('EEEE, MMMM d, y').format(_selectedDay),
                            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF667EEA).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${selectedDayAppointments.length}',
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF667EEA)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Expanded(
                    child: selectedDayAppointments.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Iconsax.calendar_remove, size: 64, color: const Color(0xFFCBD5E1)),
                                ),
                                const SizedBox(height: 24),
                                Text(
                                  'No Appointments',
                                  style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'No appointments scheduled\nfor this day',
                                  style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF94A3B8)),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            itemCount: selectedDayAppointments.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, index) {
                              final appointment = selectedDayAppointments[index];
                              return _AppointmentCard(appointment: appointment);
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final DashboardAppointments appointment;

  const _AppointmentCard({required this.appointment});

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return const Color(0xFF4FACFE);
      case 'completed':
        return const Color(0xFF00CEC9);
      case 'cancelled':
        return const Color(0xFFFF7675);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(appointment.status);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: appointment.gender.toLowerCase() == 'male' ? const Color(0xFF667EEA).withOpacity(0.1) : const Color(0xFFFD79A8).withOpacity(0.1),
                ),
                child: Icon(
                  appointment.gender.toLowerCase() == 'male' ? Iconsax.man : Iconsax.woman,
                  size: 28,
                  color: appointment.gender.toLowerCase() == 'male' ? const Color(0xFF667EEA) : const Color(0xFFFD79A8),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appointment.patientName,
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${appointment.patientAge} years • ${appointment.gender}',
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Text(
                  appointment.status,
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(Iconsax.clock, size: 18, color: const Color(0xFF667EEA)),
                    const SizedBox(width: 12),
                    Text('Time:', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF64748B))),
                    const Spacer(),
                    Text(appointment.time, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Iconsax.note_text, size: 18, color: const Color(0xFF4FACFE)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Reason:', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF64748B))),
                          const SizedBox(height: 4),
                          Text(
                            appointment.reason.isNotEmpty ? appointment.reason : 'General Consultation',
                            style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF1E293B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
