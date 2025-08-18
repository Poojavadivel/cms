import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../PatientsPage.dart'; // Assuming DoctorPatient is defined here

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color alertRed = Color(0xFFDC2626);
const Color alertYellow = Color(0xFFD97706);

// --- Data Models for Patient Chart ---
class PatientVital {
  final String label;
  final String value;
  PatientVital({required this.label, required this.value});
}

class LabReport {
  final String test;
  final String result;
  final String date;
  LabReport({required this.test, required this.result, required this.date});
}

class Medication {
  final String name;
  final String dosage;
  final String frequency;
  Medication({required this.name, required this.dosage, required this.frequency});
}

class PatientChartDetails {
  final DoctorPatient patient;
  final List<PatientVital> vitals;
  final List<LabReport> reports;
  final List<Medication> medications;

  PatientChartDetails({
    required this.patient,
    required this.vitals,
    required this.reports,
    required this.medications,
  });
}

// --- Simulated API Data ---
final _patientChartApiData = PatientChartDetails(
  patient: DoctorPatient.fromMap({
    'id': 'PAT-001', 'name': 'Sophia Carter', 'age': 72, 'gender': 'Female', 'lastVisit': '2025-08-14', 'primaryConcern': 'Hypertension', 'avatarUrl': 'https://placehold.co/100x100/FBCFE8/831843?text=SC'
  }),
  vitals: [
    PatientVital(label: 'Temperature', value: '98.6°F'),
    PatientVital(label: 'BP', value: '140/90 mmHg'),
    PatientVital(label: 'Pulse', value: '80 bpm'),
    PatientVital(label: 'Resp. Rate', value: '18/min'),
  ],
  reports: [
    LabReport(test: 'ECG', result: 'Normal Sinus Rhythm', date: '2025-08-15'),
    LabReport(test: 'Chest X-ray', result: 'Clear Lung Fields', date: '2025-08-15'),
    LabReport(test: 'Blood Panel', result: 'Pending', date: '2025-08-15'),
  ],
  medications: [
    Medication(name: 'Lisinopril', dosage: '10mg', frequency: 'Once Daily'),
    Medication(name: 'Metformin', dosage: '500mg', frequency: 'Twice Daily'),
  ],
);

// --- Main Patient Detail Screen Widget ---
class DoctorPatientDetailScreen extends StatefulWidget {
  final DoctorPatient patient;
  const DoctorPatientDetailScreen({super.key, required this.patient});

  @override
  State<DoctorPatientDetailScreen> createState() => _DoctorPatientDetailScreenState();
}

class _DoctorPatientDetailScreenState extends State<DoctorPatientDetailScreen> {
  late Future<PatientChartDetails> _chartFuture;

  @override
  void initState() {
    super.initState();
    _chartFuture = _fetchChartDetails();
  }

  Future<PatientChartDetails> _fetchChartDetails() async {
    await Future.delayed(const Duration(seconds: 1));
    return _patientChartApiData;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text('Patient Record', style: GoogleFonts.poppins(color: textPrimaryColor, fontWeight: FontWeight.bold)),
        backgroundColor: cardBackgroundColor,
        elevation: 1,
        iconTheme: const IconThemeData(color: textPrimaryColor),
      ),
      body: FutureBuilder<PatientChartDetails>(
        future: _chartFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return _buildChartContent(context, snapshot.data!);
          } else {
            return const Center(child: Text('No patient data found.'));
          }
        },
      ),
    );
  }

  Widget _buildChartContent(BuildContext context, PatientChartDetails chartData) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        children: [
          _buildPatientHeader(chartData.patient),
          const SizedBox(height: 32),
          LayoutBuilder(
            builder: (context, constraints) {
              bool isWide = constraints.maxWidth > 950;
              return isWide
                  ? Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 2, child: _buildMainColumn(chartData)),
                  const SizedBox(width: 32),
                  Expanded(flex: 1, child: _buildSidebarColumn(chartData)),
                ],
              )
                  : Column(
                children: [
                  _buildSidebarColumn(chartData), // Show critical info first on mobile
                  const SizedBox(height: 32),
                  _buildMainColumn(chartData),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  // --- WIDGET BUILDER METHODS ---

  Widget _buildPatientHeader(DoctorPatient patient) {
    return Row(
      children: [
        CircleAvatar(
          backgroundImage: NetworkImage(patient.avatarUrl),
          radius: 32,
        ),
        const SizedBox(width: 20),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              patient.name,
              style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: textPrimaryColor),
            ),
            Text(
              'ID: ${patient.id}  •  ${patient.age} years old  •  ${patient.gender}',
              style: GoogleFonts.poppins(fontSize: 16, color: textSecondaryColor),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMainColumn(PatientChartDetails chartData) {
    return Column(
      children: [
        _buildInfoCard('Clinical Records', _buildClinicalRecords(chartData)),
        const SizedBox(height: 24),
        _buildInfoCard('Investigations & Reports', _buildReportsTable(chartData.reports)),
        const SizedBox(height: 24),
        _buildInfoCard('Medications & Prescriptions', _buildMedicationsTable(chartData.medications)),
      ],
    );
  }

  Widget _buildSidebarColumn(PatientChartDetails chartData) {
    return Column(
      children: [
        _buildAlertsCard(),
        const SizedBox(height: 24),
        _buildInfoCard('Vitals & Monitoring', _buildVitalsGrid(chartData.vitals)),
        const SizedBox(height: 24),
        _buildInfoCard('Treatment & Procedures', _buildTreatmentSection()),
      ],
    );
  }

  Widget _buildInfoCard(String title, Widget child) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: textPrimaryColor),
          ),
          const Divider(height: 32),
          child,
        ],
      ),
    );
  }

  Widget _buildClinicalRecords(PatientChartDetails chartData) {
    return Column(
      children: [
        _buildDetailItem('Chief Complaint', 'Shortness of breath, chest pain'),
        const SizedBox(height: 16),
        _buildDetailItem('Past Medical History', 'Hypertension, Type 2 Diabetes'),
      ],
    );
  }

  Widget _buildVitalsGrid(List<PatientVital> vitals) {
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 3,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
      ),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: vitals.length,
      itemBuilder: (context, index) {
        return _buildDetailItem(vitals[index].label, vitals[index].value);
      },
    );
  }

  Widget _buildReportsTable(List<LabReport> reports) {
    return DataTable(
      columns: const [
        DataColumn(label: Text('Test')),
        DataColumn(label: Text('Result')),
        DataColumn(label: Text('Date')),
      ],
      rows: reports.map((report) => DataRow(cells: [
        DataCell(Text(report.test)),
        DataCell(
            report.result == 'Pending'
                ? Chip(label: Text(report.result), backgroundColor: alertYellow.withOpacity(0.2))
                : Text(report.result)
        ),
        DataCell(Text(report.date)),
      ])).toList(),
    );
  }

  Widget _buildMedicationsTable(List<Medication> medications) {
    return DataTable(
      columns: const [
        DataColumn(label: Text('Medication')),
        DataColumn(label: Text('Dosage')),
        DataColumn(label: Text('Frequency')),
      ],
      rows: medications.map((med) => DataRow(cells: [
        DataCell(Text(med.name)),
        DataCell(Text(med.dosage)),
        DataCell(Text(med.frequency)),
      ])).toList(),
    );
  }

  Widget _buildAlertsCard() {
    return _buildInfoCard(
        'Medical Alerts',
        Column(
          children: [
            _buildAlertRow(Icons.warning_amber_rounded, 'Allergies', 'Penicillin', alertRed),
            _buildAlertRow(Icons.favorite_border_rounded, 'Chronic Conditions', 'Hypertension, Type 2 Diabetes', alertYellow),
          ],
        )
    );
  }

  Widget _buildAlertRow(IconData icon, String title, String subtitle, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(subtitle, style: GoogleFonts.poppins(color: textSecondaryColor)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTreatmentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailItem('Current Plan', 'Continue medications, monitor vitals'),
        const SizedBox(height: 16),
        _buildDetailItem('Past Surgeries', 'None'),
        const SizedBox(height: 16),
        _buildDetailItem('Upcoming Procedures', 'Angiography (2025-08-16)'),
      ],
    );
  }

  Widget _buildDetailItem(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.poppins(color: textSecondaryColor, fontSize: 14)),
        Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16, color: textPrimaryColor)),
      ],
    );
  }
}
