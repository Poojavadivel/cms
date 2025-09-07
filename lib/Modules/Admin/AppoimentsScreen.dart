import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Import our new generic table
// Adjust these imports to your project
import '../../Models/Staff.dart';
import '../../Utils/Colors.dart';
import 'widget/generic_data_table.dart';
// ---------------------------------------------------------------------

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Data Models ---
class Appointment {
  final String id;
  final String patientName;
  final String doctor;
  final String date;
  final String time;
  final String status;
  final String gender;
  final String reason;

  Appointment({
    required this.id,
    required this.patientName,
    required this.doctor,
    required this.date,
    required this.time,
    required this.status,
    required this.gender,
    required this.reason,
  });

  factory Appointment.fromMap(Map<String, dynamic> map) {
    return Appointment(
      id: map['id'],
      patientName: map['patientName'],
      doctor: map['doctor'],
      date: map['date'],
      time: map['time'],
      status: map['status'],
      gender: map['gender'],
      reason: map['reason'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _appointmentsApiData = [
  {'id': 'APT-001', 'patientName': 'Arthur', 'gender': 'Male', 'doctor': 'Dr. John', 'date': '2025-08-14', 'time': '9:30 AM', 'status': 'Completed', 'reason': 'General Checkup'},
  {'id': 'APT-002', 'patientName': 'John Philips', 'gender': 'Male', 'doctor': 'Dr. Joel', 'date': '2025-08-14', 'time': '10:00 AM', 'status': 'Completed', 'reason': 'Follow-up Consultation'},
  {'id': 'APT-003', 'patientName': 'Regina', 'gender': 'Female', 'doctor': 'Dr. Joel', 'date': '2025-08-15', 'time': '10:30 AM', 'status': 'Pending', 'reason': 'Sickness'},
  {'id': 'APT-004', 'patientName': 'David', 'gender': 'Male', 'doctor': 'Dr. John', 'date': '2025-08-15', 'time': '11:00 AM', 'status': 'Cancelled', 'reason': 'Injury Evaluation'},
  {'id': 'APT-005', 'patientName': 'Joseph', 'gender': 'Male', 'doctor': 'Dr. John', 'date': '2025-08-16', 'time': '11:30 AM', 'status': 'Pending', 'reason': 'General Checkup'},
  {'id': 'APT-006', 'patientName': 'Lokesh', 'gender': 'Male', 'doctor': 'Dr. Amelia', 'date': '2025-08-16', 'time': '12:00 PM', 'status': 'Completed', 'reason': 'Medical Report Review'},
  {'id': 'APT-007', 'patientName': 'Sophia Miller', 'gender': 'Female', 'doctor': 'Dr. Evelyn', 'date': '2025-08-17', 'time': '9:00 AM', 'status': 'Pending', 'reason': 'Sickness'},
  {'id': 'APT-008', 'patientName': 'James Wilson', 'gender': 'Male', 'doctor': 'Dr. John', 'date': '2025-08-17', 'time': '9:30 AM', 'status': 'Completed', 'reason': 'Vaccination'},
  {'id': 'APT-009', 'patientName': 'Olivia Garcia', 'gender': 'Female', 'doctor': 'Dr. Amelia', 'date': '2025-08-18', 'time': '10:00 AM', 'status': 'Pending', 'reason': 'General Checkup'},
  {'id': 'APT-010', 'patientName': 'Liam Martinez', 'gender': 'Male', 'doctor': 'Dr. Joel', 'date': '2025-08-18', 'time': '10:30 AM', 'status': 'Cancelled', 'reason': 'Injury Evaluation'},
  {'id': 'APT-011', 'patientName': 'Emma Anderson', 'gender': 'Female', 'doctor': 'Dr. Evelyn', 'date': '2025-08-19', 'time': '11:00 AM', 'status': 'Completed', 'reason': 'Follow-up Consultation'},
  {'id': 'APT-012', 'patientName': 'Noah Taylor', 'gender': 'Male', 'doctor': 'Dr. John', 'date': '2025-08-19', 'time': '11:30 AM', 'status': 'Pending', 'reason': 'Sickness'},
  {'id': 'APT-013', 'patientName': 'Ava Thomas', 'gender': 'Female', 'doctor': 'Dr. Amelia', 'date': '2025-08-20', 'time': '1:00 PM', 'status': 'Completed', 'reason': 'General Checkup'},
  {'id': 'APT-014', 'patientName': 'Isabella White', 'gender': 'Female', 'doctor': 'Dr. Joel', 'date': '2025-08-20', 'time': '1:30 PM', 'status': 'Pending', 'reason': 'Medical Report Review'},
  {'id': 'APT-015', 'patientName': 'Mason Harris', 'gender': 'Male', 'doctor': 'Dr. Evelyn', 'date': '2025-08-21', 'time': '2:00 PM', 'status': 'Completed', 'reason': 'Sickness'},
  {'id': 'APT-016', 'patientName': 'Mia Clark', 'gender': 'Female', 'doctor': 'Dr. John', 'date': '2025-08-21', 'time': '2:30 PM', 'status': 'Cancelled', 'reason': 'Injury Evaluation'},
  {'id': 'APT-017', 'patientName': 'Ethan Lewis', 'gender': 'Male', 'doctor': 'Dr. Amelia', 'date': '2025-08-22', 'time': '3:00 PM', 'status': 'Pending', 'reason': 'General Checkup'},
  {'id': 'APT-018', 'patientName': 'Abigail Robinson', 'gender': 'Female', 'doctor': 'Dr. Joel', 'date': '2025-08-22', 'time': '3:30 PM', 'status': 'Completed', 'reason': 'Follow-up Consultation'},
  {'id': 'APT-019', 'patientName': 'Michael Walker', 'gender': 'Male', 'doctor': 'Dr. John', 'date': '2025-08-23', 'time': '4:00 PM', 'status': 'Pending', 'reason': 'Sickness'},
  {'id': 'APT-020', 'patientName': 'Emily Hall', 'gender': 'Female', 'doctor': 'Dr. Evelyn', 'date': '2025-08-23', 'time': '4:30 PM', 'status': 'Completed', 'reason': 'Vaccination'},
];

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  List<Appointment> _allAppointments = [];
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
    setState(() {
      _isLoading = true;
    });
    await Future.delayed(const Duration(milliseconds: 700));
    final fetchedData = _appointmentsApiData.map((m) => Appointment.fromMap(m)).toList();
    setState(() {
      _allAppointments = fetchedData;
      _isLoading = false;
    });
  }

  Future<void> _onAddPressed() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Open Add Appointment (demo)')));
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() { if (_currentPage > 0) setState(() => _currentPage--); }

  void _onView(int index, List<Appointment> list) {
    final appointment = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Viewing appointment for ${appointment.patientName}")),
    );
  }

  void _onEdit(int index, List<Appointment> list) {
    final appointment = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Editing appointment for ${appointment.patientName}")),
    );
  }

  Future<void> _onDelete(int index, List<Appointment> list) async {
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
    await Future.delayed(const Duration(milliseconds: 600));

    // Find the original data map and remove it from the list
    _appointmentsApiData.removeWhere((item) => item['id'] == appointment.id);

    // Refresh the UI by removing from the in-memory list
    _allAppointments.removeWhere((a) => a.id == appointment.id);

    setState(() {
      _isLoading = false;
      final filteredItems = _getFilteredAppointments();
      if (_currentPage * 10 >= filteredItems.length && _currentPage > 0) {
        _currentPage = 0;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted appointment for ${appointment.patientName} (demo)')));
  }

  // Method to get the filtered list of appointments
  List<Appointment> _getFilteredAppointments() {
    return _allAppointments.where((a) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = a.patientName.toLowerCase().contains(q) || a.id.toLowerCase().contains(q) || a.doctor.toLowerCase().contains(q);
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
    final doctors = {'All', ..._appointmentsApiData.map((s) => s['doctor'] as String).toSet()};
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
    final paginatedAppointments = startIndex >= filtered.length
        ? <Appointment>[]
        : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['PATIENT NAME', 'DOCTOR NAME', 'DATE', 'TIME', 'REASON', 'STATUS'];
    final rows = paginatedAppointments.map((a) {
      return [
        // Custom widget for patient name with icon
        Row(
          children: [
            Image.asset(
              a.gender.toLowerCase() == 'male' ? 'assets/boyicon.png' : 'assets/girlicon.png',
              height: 24,
              width: 24,
            ),
            const SizedBox(width: 8),
            Text(
              a.patientName,
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor),
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
