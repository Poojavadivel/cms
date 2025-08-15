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
class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String lastVisit;
  final String status;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.lastVisit,
    required this.status,
  });

  factory Patient.fromMap(Map<String, dynamic> map) {
    return Patient(
      id: map['id'],
      name: map['name'],
      age: map['age'],
      gender: map['gender'],
      lastVisit: map['lastVisit'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _patientsApiData = [
  {'id': 'PAT-001', 'name': 'Arthur', 'age': 45, 'gender': 'Male', 'lastVisit': '2025-08-14', 'status': 'Active'},
  {'id': 'PAT-002', 'name': 'John Philips', 'age': 32, 'gender': 'Male', 'lastVisit': '2025-08-14', 'status': 'Active'},
  {'id': 'PAT-003', 'name': 'Regina', 'age': 28, 'gender': 'Female', 'lastVisit': '2025-08-15', 'status': 'Active'},
  {'id': 'PAT-004', 'name': 'David', 'age': 51, 'gender': 'Male', 'lastVisit': '2025-08-15', 'status': 'Inactive'},
  {'id': 'PAT-005', 'name': 'Joseph', 'age': 60, 'gender': 'Male', 'lastVisit': '2025-08-16', 'status': 'Active'},
  {'id': 'PAT-006', 'name': 'Lokesh', 'age': 25, 'gender': 'Male', 'lastVisit': '2025-08-16', 'status': 'Active'},
  {'id': 'PAT-007', 'name': 'Sophia Miller', 'age': 38, 'gender': 'Female', 'lastVisit': '2025-08-17', 'status': 'Active'},
  {'id': 'PAT-008', 'name': 'James Wilson', 'age': 42, 'gender': 'Male', 'lastVisit': '2025-08-17', 'status': 'Active'},
  {'id': 'PAT-009', 'name': 'Olivia Garcia', 'age': 22, 'gender': 'Female', 'lastVisit': '2025-08-18', 'status': 'Active'},
  {'id': 'PAT-010', 'name': 'Liam Martinez', 'age': 30, 'gender': 'Male', 'lastVisit': '2025-08-18', 'status': 'Inactive'},
  {'id': 'PAT-011', 'name': 'Emma Anderson', 'age': 29, 'gender': 'Female', 'lastVisit': '2025-08-19', 'status': 'Active'},
  {'id': 'PAT-012', 'name': 'Noah Taylor', 'age': 35, 'gender': 'Male', 'lastVisit': '2025-08-19', 'status': 'Active'},
  {'id': 'PAT-013', 'name': 'Ava Thomas', 'age': 41, 'gender': 'Female', 'lastVisit': '2025-08-20', 'status': 'Active'},
  {'id': 'PAT-014', 'name': 'Isabella White', 'age': 26, 'gender': 'Female', 'lastVisit': '2025-08-20', 'status': 'Active'},
  {'id': 'PAT-015', 'name': 'Mason Harris', 'age': 55, 'gender': 'Male', 'lastVisit': '2025-08-21', 'status': 'Active'},
  {'id': 'PAT-016', 'name': 'Mia Clark', 'age': 33, 'gender': 'Female', 'lastVisit': '2025-08-21', 'status': 'Inactive'},
  {'id': 'PAT-017', 'name': 'Ethan Lewis', 'age': 27, 'gender': 'Male', 'lastVisit': '2025-08-22', 'status': 'Active'},
  {'id': 'PAT-018', 'name': 'Abigail Robinson', 'age': 39, 'gender': 'Female', 'lastVisit': '2025-08-22', 'status': 'Active'},
  {'id': 'PAT-019', 'name': 'Michael Walker', 'age': 48, 'gender': 'Male', 'lastVisit': '2025-08-23', 'status': 'Active'},
  {'id': 'PAT-020', 'name': 'Emily Hall', 'age': 31, 'gender': 'Female', 'lastVisit': '2025-08-23', 'status': 'Active'},
];

// --- Main Patients Screen Widget ---
class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> with SingleTickerProviderStateMixin {
  late Future<List<Patient>> _patientsFuture;
  String _searchQuery = '';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _patientsFuture = _fetchPatients();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<List<Patient>> _fetchPatients() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _patientsApiData.map((data) => Patient.fromMap(data)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<Patient>>(
        future: _patientsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildPatientsContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('No patients found.'));
          }
        },
      ),
    );
  }

  Widget _buildPatientsContent(BuildContext context, List<Patient> patients) {
    final filteredPatients = patients
        .where((p) =>
    p.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        p.id.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Patient Management',
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add, size: 20),
                label: Text('Add Patient', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  elevation: 2,
                  shadowColor: primaryColor.withOpacity(0.4),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            onChanged: (value) => setState(() => _searchQuery = value),
            decoration: InputDecoration(
              hintText: 'Search by patient name or ID',
              hintStyle: GoogleFonts.poppins(color: textSecondaryColor),
              prefixIcon: const Icon(Icons.search, color: textSecondaryColor),
              filled: true,
              fillColor: Colors.grey[50],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            ),
          ),
          const SizedBox(height: 24),
          _buildPatientsTable(context, filteredPatients),
        ],
      ),
    );
  }

  Widget _buildPatientsTable(BuildContext context, List<Patient> patients) {
    return Container(
      width: double.infinity,
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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(Colors.grey[50]),
          headingTextStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: textSecondaryColor),
          dataTextStyle: GoogleFonts.poppins(color: textPrimaryColor),
          columnSpacing: 20,
          dataRowHeight: 64,
          columns: const [
            DataColumn(label: Text('PATIENT ID')),
            DataColumn(label: Text('NAME')),
            DataColumn(label: Text('AGE')),
            DataColumn(label: Text('GENDER')),
            DataColumn(label: Text('LAST VISIT')),
            DataColumn(label: Center(child: Text('STATUS'))),
            DataColumn(label: Center(child: Text('ACTIONS'))),
          ],
          rows: patients.map((p) => _buildDataRow(context, p)).toList(),
        ),
      ),
    );
  }

  DataRow _buildDataRow(BuildContext context, Patient patient) {
    return DataRow(
      cells: [
        DataCell(Text(patient.id)),
        DataCell(Text(patient.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w500))),
        DataCell(Text(patient.age.toString())),
        DataCell(Text(patient.gender)),
        DataCell(Text(patient.lastVisit)),
        DataCell(
          Center(
            child: Chip(
              label: Text(patient.status),
              backgroundColor: patient.status == 'Active' ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
              labelStyle: GoogleFonts.poppins(
                color: patient.status == 'Active' ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                fontWeight: FontWeight.w600,
              ),
              side: BorderSide.none,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
        ),
        DataCell(
          Center(
            child: TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PatientDetailScreen(patient: patient),
                  ),
                );
              },
              child: Text(
                'View Details',
                style: GoogleFonts.poppins(
                  color: primaryColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// --- Patient Detail Screen ---
class PatientDetailScreen extends StatelessWidget {
  final Patient patient;

  const PatientDetailScreen({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text('Patient Details', style: GoogleFonts.poppins(color: textPrimaryColor)),
        backgroundColor: cardBackgroundColor,
        elevation: 1,
        iconTheme: const IconThemeData(color: textPrimaryColor),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Container(
          padding: const EdgeInsets.all(32.0),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                patient.name,
                style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Chip(
                label: Text(patient.status),
                backgroundColor: patient.status == 'Active' ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                labelStyle: GoogleFonts.poppins(
                  color: patient.status == 'Active' ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 24),
              _buildDetailRow('Patient ID', patient.id),
              _buildDetailRow('Age', '${patient.age} years'),
              _buildDetailRow('Gender', patient.gender),
              _buildDetailRow('Last Visit', patient.lastVisit),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textSecondaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textPrimaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
