import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:glowhair/Modules/Doctor/widgets/Editappoimentspage.dart';
import '../../Models/appointment_draft.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import '../Doctor/widgets/Addnewappoiments.dart';
import '../Doctor/widgets/doctor_appointment_preview.dart';
import 'widget/generic_data_table.dart';

// ---------------------------------------------------------------------
// Appointments Screen (supports Admin + Doctor; uses backend `doctor` field)
// - Uses DashboardAppointments model
// - Shows Doctor column (admin-only extra)
// - fetch / delete / edit / view use AuthService.instance
// ---------------------------------------------------------------------

const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

class AdminAppointmentsScreen extends StatefulWidget {
  const AdminAppointmentsScreen({super.key});

  @override
  State<AdminAppointmentsScreen> createState() => _AdminAppointmentsScreenState();
}

class _AdminAppointmentsScreenState extends State<AdminAppointmentsScreen> {
  List<DashboardAppointments> _allAppointments = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _doctorFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchAppointments();
  }

  Future<void> _fetchAppointments() async {
    setState(() => _isLoading = true);
    try {
      final appointments = await AuthService.instance.fetchAppointments();
      setState(() {
        _allAppointments = appointments;
      });
    } catch (e) {
      debugPrint('❌ fetchAppointments error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed to load appointments: $e'),
        ));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _onAddPressed() async {
    if (!mounted) return;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => Dialog(
        child: SizedBox(
          width: 800, // makes it wide on web/desktop
          child: const AddAppointmentForm(),
        ),
      ),
    );

    if (result == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Appointment saved ✅")),
      );
    }
  }


  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() {
    if (_currentPage > 0) setState(() => _currentPage--);
  }

  Future<void> _onView(int index, List<DashboardAppointments> list) async {
    final appointment = list[index];
    try {
      // Fetch full details if backend supports it; fallback to using DashboardAppointments
      AppointmentDraft? draft;
      try {
        draft = await AuthService.instance.fetchAppointmentById(appointment.id);
      } catch (_) {
        draft = null;
      }

      await showDialog(
        context: context,
        builder: (_) => DoctorAppointmentPreview(appointment: appointment),
      );
    } catch (e) {
      debugPrint('❌ view error: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to open preview: $e')));
    }
  }

  Future<void> _onEdit(int index, List<DashboardAppointments> list) async {
    final appointment = list[index];

    try {
      // Try to fetch full draft to edit
      AppointmentDraft draft;
      try {
        draft = await AuthService.instance.fetchAppointmentById(appointment.id);
      } catch (_) {
        // fallback create basic draft from available fields
        draft = AppointmentDraft(
          id: appointment.id,
          clientName: appointment.patientName,
          appointmentType: appointment.service,
          date: DateTime.tryParse(appointment.date) ?? DateTime.now(),
          time: TimeOfDay(
            hour: int.tryParse(appointment.time.split(':').first) ?? 0,
            minute: appointment.time.contains(':')
                ? int.tryParse(appointment.time.split(':').last.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0
                : 0,
          ),
          location: appointment.location,
          notes: appointment.currentNotes,
          gender: appointment.gender,
          patientId: appointment.patientId,
          phoneNumber: null,
          mode: 'In-clinic',
          priority: 'Normal',
          durationMinutes: 20,
          reminder: true,
          chiefComplaint: appointment.reason,
          status: appointment.status,
        );
      }

      // Navigate to edit form and expect AppointmentDraft returned on save
      final result = await Navigator.push<AppointmentDraft?>(
        context,
        MaterialPageRoute(
          builder: (_) => ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Material(
              color: Colors.white,
              child: EditAppointmentForm(
                appointmentId: appointment.id,
                onSave: (updatedDraft) {
                  Navigator.pop(context, updatedDraft); // 👈 Return the draft
                  debugPrint('Updated: ${updatedDraft.toJson()}');
                },
                onCancel: () => Navigator.pop(context, null), // 👈 Return null
                onDelete: () {
                  Navigator.pop(context, null); // 👈 Or handle deletion separately
                  debugPrint('Deleted appointment for ${appointment.patientName}');
                },
              ),
            ),
          ),
        ),
      );

      // If user saved changes, call editAppointment
      if (result != null) {
        if (mounted) setState(() => _isLoading = true);
        try {
          final success = await AuthService.instance.editAppointment(result);
          if (success) {
            await _fetchAppointments();
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Appointment updated'))
            );
          } else {
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Failed to update appointment'))
            );
          }
        } catch (e) {
          debugPrint('❌ edit API error: $e');
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error updating: $e'))
          );
        } finally {
          if (mounted) setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      debugPrint('❌ edit error: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to edit: $e'))
      );
    }
  }


  Future<void> _onDelete(int index, List<DashboardAppointments> list) async {
    final appointment = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete appointment for ${appointment.patientName}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      final success = await AuthService.instance.deleteAppointment(appointment.id);
      if (success) {
        await _fetchAppointments();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted appointment for ${appointment.patientName}')));
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete appointment')));
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('❌ delete error: $e');
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deleting: $e')));
    }
  }

  List<DashboardAppointments> _getFilteredAppointments() {
    final q = _searchQuery.trim().toLowerCase();
    return _allAppointments.where((a) {
      final matchesSearch = a.patientName.toLowerCase().contains(q) ||
          a.id.toLowerCase().contains(q) ||
          a.doctor.toLowerCase().contains(q) ||
          a.patientId.toLowerCase().contains(q);
      final matchesFilter = _doctorFilter == 'All' || a.doctor == _doctorFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _statusChip(String status) {
    Color bg;
    Color fg;

    switch (status) {
      case 'Completed':
        bg = Colors.green.withOpacity(0.12);
        fg = Colors.green;
        break;
      case 'Pending':
        bg = Colors.orange.withOpacity(0.12);
        fg = Colors.orange;
        break;
      case 'Cancelled':
        bg = Colors.red.withOpacity(0.12);
        fg = Colors.red;
        break;
      default:
        bg = Colors.grey.withOpacity(0.12);
        fg = Colors.grey;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildDoctorFilter() {
    final doctors = {'All', ..._allAppointments.map((s) => s.doctor).where((d) => d.isNotEmpty).toSet()};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      onSelected: (String newValue) {
        setState(() {
          _doctorFilter = newValue;
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        return doctors.map((String value) {
          return PopupMenuItem<String>(
            value: value,
            child: Text(value, style: GoogleFonts.inter()),
          );
        }).toList();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredAppointments();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedAppointments = startIndex >= filtered.length ? <DashboardAppointments>[] : filtered.sublist(startIndex, endIndex);

    final headers = const ['PATIENT NAME', 'DOCTOR NAME', 'DATE', 'TIME', 'REASON', 'STATUS'];
    final rows = paginatedAppointments.map((a) {
      return [
        Row(
          children: [
            Image.asset(
              (a.gender).toLowerCase() == 'male' ? 'assets/boyicon.png' : 'assets/girlicon.png',
              height: 28,
              width: 28,
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.patientName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: textPrimaryColor)),
                Text('${a.patientAge} yrs • ${a.patientId}', style: GoogleFonts.inter(fontSize: 12, color: textSecondaryColor)),
              ],
            ),
          ],
        ),
        Text(a.doctor, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(a.date, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(a.time, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(a.reason, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        _statusChip(a.status),
      ];
    }).toList();

    return Scaffold(

      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Appointments",
            headers: headers,
            rows: rows,
            searchQuery: _searchQuery,
            onSearchChanged: _onSearchChanged,
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: 10,
            onPreviousPage: _prevPage,
            onNextPage: _nextPage,
            isLoading: _isLoading,
            onAddPressed: _onAddPressed,
            filters: [_buildDoctorFilter()],
            hideHorizontalScrollbar: true,
            onView: (i) => _onView(i, paginatedAppointments),
            onEdit: (i) => _onEdit(i, paginatedAppointments),
            onDelete: (i) => _onDelete(i, paginatedAppointments),
          ),
        ),
      ),
    );
  }
}
