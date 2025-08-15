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
class DoctorPatient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String lastVisit;
  final String primaryConcern;
  final String avatarUrl;

  DoctorPatient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.lastVisit,
    required this.primaryConcern,
    required this.avatarUrl,
  });

  factory DoctorPatient.fromMap(Map<String, dynamic> map) {
    return DoctorPatient(
      id: map['id'],
      name: map['name'],
      age: map['age'],
      gender: map['gender'],
      lastVisit: map['lastVisit'],
      primaryConcern: map['primaryConcern'],
      avatarUrl: map['avatarUrl'],
    );
  }
}

// --- Simulated API Data ---
final List<Map<String, dynamic>> _patientsApiData = [
  {'id': 'PAT-001', 'name': 'Arthur', 'age': 45, 'gender': 'Male', 'lastVisit': '2025-08-14', 'primaryConcern': 'Hypertension', 'avatarUrl': 'https://placehold.co/100x100/FBCFE8/831843?text=A'},
  {'id': 'PAT-002', 'name': 'John Philips', 'age': 32, 'gender': 'Male', 'lastVisit': '2025-08-14', 'primaryConcern': 'Asthma', 'avatarUrl': 'https://placehold.co/100x100/F5D0A9/7C2D12?text=JP'},
  {'id': 'PAT-003', 'name': 'Regina', 'age': 28, 'gender': 'Female', 'lastVisit': '2025-08-15', 'primaryConcern': 'Migraines', 'avatarUrl': 'https://placehold.co/100x100/E9D5FF/5B21B6?text=R'},
  {'id': 'PAT-004', 'name': 'David', 'age': 51, 'gender': 'Male', 'lastVisit': '2025-08-15', 'primaryConcern': 'Diabetes', 'avatarUrl': 'https://placehold.co/100x100/A7F3D0/047857?text=D'},
  {'id': 'PAT-005', 'name': 'Joseph', 'age': 60, 'gender': 'Male', 'lastVisit': '2025-08-16', 'primaryConcern': 'Arthritis', 'avatarUrl': 'https://placehold.co/100x100/BAE6FD/0C4A6E?text=J'},
  {'id': 'PAT-006', 'name': 'Lokesh', 'age': 25, 'gender': 'Male', 'lastVisit': '2025-08-16', 'primaryConcern': 'Allergies', 'avatarUrl': 'https://placehold.co/100x100/D1FAE5/065F46?text=L'},
  {'id': 'PAT-007', 'name': 'Sophia Miller', 'age': 38, 'gender': 'Female', 'lastVisit': '2025-08-17', 'primaryConcern': 'Thyroid Disorder', 'avatarUrl': 'https://placehold.co/100x100/FECACA/991B1B?text=SM'},
];

// --- Main Doctor Patients Screen Widget ---
class DoctorPatientsScreen extends StatefulWidget {
  const DoctorPatientsScreen({super.key});

  @override
  State<DoctorPatientsScreen> createState() => _DoctorPatientsScreenState();
}

class _DoctorPatientsScreenState extends State<DoctorPatientsScreen> with SingleTickerProviderStateMixin {
  late Future<List<DoctorPatient>> _patientsFuture;
  String _searchQuery = '';
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
    _patientsFuture = _fetchPatients();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<List<DoctorPatient>> _fetchPatients() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _patientsApiData.map((data) => DoctorPatient.fromMap(data)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<DoctorPatient>>(
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

  Widget _buildPatientsContent(BuildContext context, List<DoctorPatient> patients) {
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
          _buildHeader(),
          const SizedBox(height: 32),
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

  // --- WIDGET BUILDER METHODS ---

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'My Patients',
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

  Widget _buildPatientsTable(BuildContext context, List<DoctorPatient> patients) {
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
            DataColumn(label: Text('PRIMARY CONCERN')),
            DataColumn(label: Center(child: Text('ACTIONS'))),
          ],
          rows: patients.map((p) => _buildDataRow(context, p)).toList(),
        ),
      ),
    );
  }

  DataRow _buildDataRow(BuildContext context, DoctorPatient patient) {
    return DataRow(
      cells: [
        DataCell(Text(patient.id)),
        DataCell(
          Row(
            children: [
              CircleAvatar(
                backgroundImage: NetworkImage(patient.avatarUrl),
                radius: 20,
              ),
              const SizedBox(width: 12),
              Text(patient.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w500)),
            ],
          ),
        ),
        DataCell(Text(patient.age.toString())),
        DataCell(Text(patient.gender)),
        DataCell(Text(patient.lastVisit)),
        DataCell(Text(patient.primaryConcern)),
        DataCell(
          Center(
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => DoctorPatientDetailScreen(patient: patient),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('View Chart'),
            ),
          ),
        ),
      ],
    );
  }
}

// --- Patient Detail Screen ---
class DoctorPatientDetailScreen extends StatelessWidget {
  final DoctorPatient patient;

  const DoctorPatientDetailScreen({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text('Patient Chart', style: GoogleFonts.poppins(color: textPrimaryColor)),
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
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 24),
              _buildDetailRow('Patient ID', patient.id),
              _buildDetailRow('Age', '${patient.age} years'),
              _buildDetailRow('Gender', patient.gender),
              _buildDetailRow('Last Visit', patient.lastVisit),
              _buildDetailRow('Primary Concern', patient.primaryConcern),
              const SizedBox(height: 24),
              Text(
                'Medical History',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'No significant medical history. Patient is a non-smoker and consumes alcohol occasionally. No known allergies.',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  color: textSecondaryColor,
                  height: 1.5,
                ),
              ),
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
