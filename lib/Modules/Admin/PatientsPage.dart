import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Import our new generic table
// Adjust these imports to your project
import '../../Models/Staff.dart';
import '../../Utils/Colors.dart';
import 'widget/generic_data_table.dart';
// ---------------------------------------------------------------------

// --- Data Models ---
class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String lastVisit;
  final String doctor;
  final String condition;
  final String reason;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.lastVisit,
    required this.doctor,
    required this.condition,
    required this.reason,
  });

  factory Patient.fromMap(Map<String, dynamic> map) {
    return Patient(
      id: map['id'],
      name: map['name'],
      age: map['age'],
      gender: map['gender'],
      lastVisit: map['lastVisit'],
      doctor: map['doctor'],
      condition: map['condition'],
      reason: map['reason'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _patientsApiData = [
  {'id': 'PAT-001', 'name': 'Arthur', 'age': 45, 'gender': 'Male', 'lastVisit': '2025-08-14', 'doctor': 'Dr. Harper', 'condition': 'Hypertension', 'reason': 'Follow-up'},
  {'id': 'PAT-002', 'name': 'John Philips', 'age': 32, 'gender': 'Male', 'lastVisit': '2025-08-14', 'doctor': 'Dr. Johnson', 'condition': 'Asthma', 'reason': 'New prescription'},
  {'id': 'PAT-003', 'name': 'Regina', 'age': 28, 'gender': 'Female', 'lastVisit': '2025-08-15', 'doctor': 'Dr. Harper', 'condition': 'Dermatitis', 'reason': 'Routine check-up'},
  {'id': 'PAT-004', 'name': 'David', 'age': 51, 'gender': 'Male', 'lastVisit': '2025-08-15', 'doctor': 'Dr. Johnson', 'condition': 'Diabetes', 'reason': 'Annual exam'},
  {'id': 'PAT-005', 'name': 'Joseph', 'age': 60, 'gender': 'Male', 'lastVisit': '2025-08-16', 'doctor': 'Dr. Harper', 'condition': 'High Cholesterol', 'reason': 'Follow-up'},
  {'id': 'PAT-006', 'name': 'Lokesh', 'age': 25, 'gender': 'Male', 'lastVisit': '2025-08-16', 'doctor': 'Dr. Miller', 'condition': 'Flu', 'reason': 'Initial visit'},
  {'id': 'PAT-007', 'name': 'Sophia Miller', 'age': 38, 'gender': 'Female', 'lastVisit': '2025-08-17', 'doctor': 'Dr. Wilson', 'condition': 'Anxiety', 'reason': 'Therapy session'},
  {'id': 'PAT-008', 'name': 'James Wilson', 'age': 42, 'gender': 'Male', 'lastVisit': '2025-08-17', 'doctor': 'Dr. Harper', 'condition': 'Migraines', 'reason': 'Consultation'},
  {'id': 'PAT-009', 'name': 'Olivia Garcia', 'age': 22, 'gender': 'Female', 'lastVisit': '2025-08-18', 'doctor': 'Dr. Johnson', 'condition': 'Acne', 'reason': 'Check-up'},
  {'id': 'PAT-010', 'name': 'Liam Martinez', 'age': 30, 'gender': 'Male', 'lastVisit': '2025-08-18', 'doctor': 'Dr. Miller', 'condition': 'Sprained Ankle', 'reason': 'Injury report'},
  {'id': 'PAT-011', 'name': 'Emma Anderson', 'age': 29, 'gender': 'Female', 'lastVisit': '2025-08-19', 'doctor': 'Dr. Wilson', 'condition': 'Depression', 'reason': 'Follow-up'},
  {'id': 'PAT-012', 'name': 'Noah Taylor', 'age': 35, 'gender': 'Male', 'lastVisit': '2025-08-19', 'doctor': 'Dr. Harper', 'condition': 'Eczema', 'reason': 'New treatment'},
  {'id': 'PAT-013', 'name': 'Ava Thomas', 'age': 41, 'gender': 'Female', 'lastVisit': '2025-08-20', 'doctor': 'Dr. Wilson', 'condition': 'High Blood Pressure', 'reason': 'Routine check-up'},
  {'id': 'PAT-014', 'name': 'Isabella White', 'age': 26, 'gender': 'Female', 'lastVisit': '2025-08-20', 'doctor': 'Dr. Miller', 'condition': 'Sore Throat', 'reason': 'Initial visit'},
  {'id': 'PAT-015', 'name': 'Mason Harris', 'age': 55, 'gender': 'Male', 'lastVisit': '2025-08-21', 'doctor': 'Dr. Johnson', 'condition': 'Arthritis', 'reason': 'Follow-up'},
  {'id': 'PAT-016', 'name': 'Mia Clark', 'age': 33, 'gender': 'Female', 'lastVisit': '2025-08-21', 'doctor': 'Dr. Wilson', 'condition': 'Cough', 'reason': 'Initial visit'},
  {'id': 'PAT-017', 'name': 'Ethan Lewis', 'age': 27, 'gender': 'Male', 'lastVisit': '2025-08-22', 'doctor': 'Dr. Miller', 'condition': 'Allergies', 'reason': 'New medication'},
  {'id': 'PAT-018', 'name': 'Abigail Robinson', 'age': 39, 'gender': 'Female', 'lastVisit': '2025-08-22', 'doctor': 'Dr. Harper', 'condition': 'Hypothyroidism', 'reason': 'Follow-up'},
  {'id': 'PAT-019', 'name': 'Michael Walker', 'age': 48, 'gender': 'Male', 'lastVisit': '2025-08-23', 'doctor': 'Dr. Johnson', 'condition': 'Back Pain', 'reason': 'Consultation'},
  {'id': 'PAT-020', 'name': 'Emily Hall', 'age': 31, 'gender': 'Female', 'lastVisit': '2025-08-23', 'doctor': 'Dr. Miller', 'condition': 'Tinnitus', 'reason': 'Follow-up'},
  {'id': 'PAT-021', 'name': 'Daniel Lee', 'age': 55, 'gender': 'Male', 'lastVisit': '2025-08-24', 'doctor': 'Dr. Harper', 'condition': 'Heart Disease', 'reason': 'Annual check-up'},
  {'id': 'PAT-022', 'name': 'Chloe King', 'age': 25, 'gender': 'Female', 'lastVisit': '2025-08-24', 'doctor': 'Dr. Johnson', 'condition': 'Celiac Disease', 'reason': 'Follow-up'},
  {'id': 'PAT-023', 'name': 'Samuel Green', 'age': 42, 'gender': 'Male', 'lastVisit': '2025-08-25', 'doctor': 'Dr. Wilson', 'condition': 'Arthritis', 'reason': 'New treatment'},
  {'id': 'PAT-024', 'name': 'Zoe Scott', 'age': 29, 'gender': 'Female', 'lastVisit': '2025-08-25', 'doctor': 'Dr. Harper', 'condition': 'Pneumonia', 'reason': 'Initial visit'},
  {'id': 'PAT-025', 'name': 'Matthew Adams', 'age': 36, 'gender': 'Male', 'lastVisit': '2025-08-26', 'doctor': 'Dr. Miller', 'condition': 'Kidney Stones', 'reason': 'Consultation'},
];

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  List<Patient> _allPatients = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _doctorFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchPatients();
  }

  Future<void> _fetchPatients() async {
    setState(() {
      _isLoading = true;
    });
    await Future.delayed(const Duration(milliseconds: 700));
    final fetchedData = _patientsApiData.map((m) => Patient.fromMap(m)).toList();
    setState(() {
      _allPatients = fetchedData;
      _isLoading = false;
    });
  }

  Future<void> _onAddPressed() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Open Add Patient (demo)')));
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() { if (_currentPage > 0) setState(() => _currentPage--); }

  void _onView(int index, List<Patient> list) {
    final patient = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Viewing details for ${patient.name}")),
    );
  }

  void _onEdit(int index, List<Patient> list) {
    final patient = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Editing ${patient.name}")),
    );
  }

  Future<void> _onDelete(int index, List<Patient> list) async {
    final patient = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete ${patient.name}?'),
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
    _patientsApiData.removeWhere((item) => item['id'] == patient.id);

    // Refresh the UI by removing from the in-memory list
    _allPatients.removeWhere((p) => p.id == patient.id);

    setState(() {
      _isLoading = false;
      // Reset page to 0 if the current page is no longer valid
      final filteredItems = _getFilteredPatients();
      if (_currentPage * 10 >= filteredItems.length && _currentPage > 0) {
        _currentPage = 0;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted ${patient.name} (demo)')));
  }

  // Method to get the filtered list of patients
  List<Patient> _getFilteredPatients() {
    return _allPatients.where((p) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = p.name.toLowerCase().contains(q) || p.id.toLowerCase().contains(q);
      final matchesFilter = _doctorFilter == 'All' || p.doctor == _doctorFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _genderIcon(String gender) {
    String imagePath;
    if (gender.toLowerCase() == 'male') {
      imagePath = 'assets/boyicon.png';
    } else {
      imagePath = 'assets/girlicon.png';
    }
    return SizedBox(
      width: 24,
      height: 24,
      child: Image.asset(imagePath),
    );
  }

  // New filter widget for patient status using an icon button
  Widget _buildDoctorFilter() {
    final doctors = {'All', ..._patientsApiData.map((s) => s['doctor'] as String).toSet()};
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
    final filtered = _getFilteredPatients();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedPatients = startIndex >= filtered.length
        ? <Patient>[]
        : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['NAME', 'AGE', 'GENDER', 'LAST VISIT', 'DOCTOR', 'CONDITION'];
    final rows = paginatedPatients.map((p) {
      return [
        Row(
          children: [
            _genderIcon(p.gender),
            const SizedBox(width: 8),
            Text(p.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
          ],
        ),
        Text(p.age.toString(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(p.gender, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(p.lastVisit, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(p.doctor, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(p.condition, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Patients",
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
            // Pass action callbacks to show the action buttons
            onView: (i) => _onView(i, paginatedPatients),
            onEdit: (i) => _onEdit(i, paginatedPatients),
            onDelete: (i) => _onDelete(i, paginatedPatients),
          ),
        ),
      ),
    );
  }
}
