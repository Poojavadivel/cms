import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:shimmer/shimmer.dart';

import '../../Models/Patients.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import 'widgets/doctor_appointment_preview.dart';
import 'widgets/follow_up_calendar_popup.dart';

/// ENTERPRISE-GRADE SCHEDULE CALENDAR
/// Professional medical theme matching dashboard
/// Skeleton loading, appointment actions, robust date parsing
class EnterpriseScheduleScreen extends StatefulWidget {
  const EnterpriseScheduleScreen({super.key});

  @override
  State<EnterpriseScheduleScreen> createState() => _EnterpriseScheduleScreenState();
}

class _EnterpriseScheduleScreenState extends State<EnterpriseScheduleScreen> {
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
      debugPrint('❌ Error loading appointments: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load appointments: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<DashboardAppointments> _getAppointmentsForDay(DateTime day) {
    final dayStr = DateFormat('yyyy-MM-dd').format(day);
    return _appointments.where((a) {
      try {
        final apptDateStr = _parseDate(a.date);
        return apptDateStr == dayStr;
      } catch (e) {
        debugPrint('❌ Date parse error: ${a.date}');
        return false;
      }
    }).toList()..sort((a, b) => a.time.compareTo(b.time));
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
        return '';
      }
    }
  }

  int _getAppointmentCountForDay(DateTime day) {
    return _getAppointmentsForDay(day).length;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return _buildSkeleton();
    }

    final selectedDayAppointments = _getAppointmentsForDay(_selectedDay);

    return Container(
      color: const Color(0xFFF8FAFC),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // CALENDAR SECTION
          Expanded(
            flex: 3,
            child: _buildCalendarCard(),
          ),

          const SizedBox(width: 20),

          // APPOINTMENTS LIST SECTION
          Expanded(
            flex: 2,
            child: _buildAppointmentsList(selectedDayAppointments),
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Iconsax.calendar_1,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Schedule Calendar',
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E40AF).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Iconsax.note_text,
                      color: Color(0xFF1E40AF),
                      size: 14,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${_appointments.length} Total',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1E40AF),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
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
            calendarBuilders: CalendarBuilders(
              markerBuilder: (context, date, events) {
                final count = _getAppointmentCountForDay(date);
                if (count == 0) return const SizedBox.shrink();
                
                return Positioned(
                  bottom: 1,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E40AF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      count.toString(),
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                );
              },
            ),
            calendarStyle: CalendarStyle(
              // Today styling
              todayDecoration: BoxDecoration(
                color: const Color(0xFF0EA5E9).withOpacity(0.15),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF0EA5E9), width: 1.5),
              ),
              todayTextStyle: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0EA5E9),
              ),
              // Selected day styling
              selectedDecoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)],
                ),
                shape: BoxShape.circle,
              ),
              selectedTextStyle: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
              // Default text styling
              defaultTextStyle: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF0F172A),
              ),
              weekendTextStyle: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF64748B),
              ),
              outsideTextStyle: GoogleFonts.inter(
                fontSize: 14,
                color: const Color(0xFFCBD5E1),
              ),
              // Remove default markers
              markerDecoration: const BoxDecoration(),
            ),
            headerStyle: HeaderStyle(
              formatButtonVisible: true,
              titleCentered: true,
              titleTextStyle: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0F172A),
              ),
              formatButtonTextStyle: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1E40AF),
              ),
              formatButtonDecoration: BoxDecoration(
                color: const Color(0xFF1E40AF).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF1E40AF).withOpacity(0.3)),
              ),
              leftChevronIcon: const Icon(
                Iconsax.arrow_left_2,
                color: Color(0xFF1E40AF),
                size: 20,
              ),
              rightChevronIcon: const Icon(
                Iconsax.arrow_right_3,
                color: Color(0xFF1E40AF),
                size: 20,
              ),
            ),
            daysOfWeekStyle: DaysOfWeekStyle(
              weekdayStyle: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF64748B),
              ),
              weekendStyle: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF64748B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentsList(List<DashboardAppointments> appointments) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
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
                  Text(
                    'Appointments',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('EEEE, MMMM d, y').format(_selectedDay),
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${appointments.length}',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Expanded(
            child: appointments.isEmpty
                ? _buildEmptyState()
                : ListView.separated(
                    itemCount: appointments.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, index) {
                      final appointment = appointments[index];
                      return _AppointmentCard(
                        appointment: appointment,
                        onViewDetails: () => _showAppointmentPreview(appointment),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF1E40AF).withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Iconsax.calendar_remove,
              size: 64,
              color: const Color(0xFF1E40AF).withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No Appointments',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'No appointments scheduled\nfor this day',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: const Color(0xFF94A3B8),
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _showAppointmentPreview(DashboardAppointments appointment) async {
    try {
      // Check if this appointment has follow-up details
      final hasFollowUp = appointment.metadata?['followUp']?['isRequired'] == true;
      
      if (hasFollowUp) {
        // Show follow-up calendar popup
        await _showFollowUpPopup(appointment);
      } else {
        // Show regular appointment preview
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => const Center(
            child: CircularProgressIndicator(color: Color(0xFF1E40AF)),
          ),
        );
        
        final patientDetails = await AuthService.instance.fetchPatientById(appointment.patientId);
        
        if (mounted) Navigator.of(context).pop();
        
        if (mounted) {
          await DoctorAppointmentPreview.show(
            context,
            patientDetails,
            showBillingTab: false,
          );
        }
      }
    } catch (e) {
      if (mounted) Navigator.of(context).pop();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading appointment: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      debugPrint('❌ Error showing appointment preview: $e');
    }
  }
  
  Future<void> _showFollowUpPopup(DashboardAppointments appointment) async {
    try {
      // Fetch full appointment details with follow-up data
      final response = await AuthService.instance.get('/appointments/${appointment.appointmentId}');
      
      if (response != null && response['appointment'] != null) {
        await FollowUpCalendarPopup.show(
          context: context,
          appointmentData: response['appointment'],
          onScheduleAppointment: () {
            Navigator.of(context).pop();
            // TODO: Navigate to appointment scheduling
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Appointment scheduling will be implemented'),
                backgroundColor: Color(0xFF1E40AF),
              ),
            );
          },
        );
      }
    } catch (e) {
      debugPrint('❌ Error showing follow-up popup: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading follow-up details: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildSkeleton() {
    return Container(
      color: const Color(0xFFF8FAFC),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: _shimmerBox(double.infinity, double.infinity, 16),
          ),
          const SizedBox(width: 20),
          Expanded(
            flex: 2,
            child: _shimmerBox(double.infinity, double.infinity, 16),
          ),
        ],
      ),
    );
  }

  Widget _shimmerBox(double width, double height, double radius) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
}

class _AppointmentCard extends StatelessWidget {
  final DashboardAppointments appointment;
  final VoidCallback onViewDetails;

  const _AppointmentCard({
    required this.appointment,
    required this.onViewDetails,
  });

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return const Color(0xFF0EA5E9);
      case 'completed':
        return const Color(0xFF10B981);
      case 'cancelled':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF94A3B8);
    }
  }
  
  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'Critical':
        return const Color(0xFFDC2626);
      case 'Urgent':
        return const Color(0xFFEA580C);
      case 'Important':
        return const Color(0xFFF59E0B);
      case 'Routine':
      default:
        return const Color(0xFF059669);
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(appointment.status);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Gender Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: appointment.gender.toLowerCase() == 'male'
                      ? const LinearGradient(colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)])
                      : const LinearGradient(colors: [Color(0xFFEC4899), Color(0xFFDB2777)]),
                ),
                child: Icon(
                  appointment.gender.toLowerCase() == 'male' ? Iconsax.man : Iconsax.woman,
                  size: 24,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              // Patient Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appointment.patientName,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${appointment.patientAge} years • ${appointment.gender}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              // Follow-Up Badge (if applicable) + Status Badge
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // Follow-Up Badge
                  if (appointment.metadata?['followUp']?['isRequired'] == true)
                    Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _getPriorityColor(appointment.metadata?['followUp']?['priority'] ?? 'Routine'),
                            _getPriorityColor(appointment.metadata?['followUp']?['priority'] ?? 'Routine').withOpacity(0.8),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: _getPriorityColor(appointment.metadata?['followUp']?['priority'] ?? 'Routine').withOpacity(0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Iconsax.notification_bing, size: 12, color: Colors.white),
                          const SizedBox(width: 4),
                          Text(
                            'Follow-Up',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      appointment.status,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Iconsax.clock, size: 16, color: Color(0xFF1E40AF)),
                    const SizedBox(width: 8),
                    Text(
                      'Time:',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      appointment.time,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Iconsax.note_text, size: 16, color: Color(0xFF0EA5E9)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Reason:',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            appointment.reason.isNotEmpty 
                                ? appointment.reason 
                                : 'General Consultation',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: const Color(0xFF0F172A),
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // View Details Button
                InkWell(
                  onTap: onViewDetails,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)],
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Iconsax.eye, color: Colors.white, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'View Patient Details',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
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
