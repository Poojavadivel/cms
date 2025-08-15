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
class PathologyReport {
  final String reportId;
  final String patientName;
  final String testName;
  final String collectionDate;
  final String status;

  PathologyReport({
    required this.reportId,
    required this.patientName,
    required this.testName,
    required this.collectionDate,
    required this.status,
  });

  factory PathologyReport.fromMap(Map<String, dynamic> map) {
    return PathologyReport(
      reportId: map['reportId'],
      patientName: map['patientName'],
      testName: map['testName'],
      collectionDate: map['collectionDate'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _pathologyApiData = [
  {'reportId': 'LAB-001', 'patientName': 'Arthur', 'testName': 'Complete Blood Count (CBC)', 'collectionDate': '2025-08-14', 'status': 'Completed'},
  {'reportId': 'LAB-002', 'patientName': 'John Philips', 'testName': 'Lipid Profile', 'collectionDate': '2025-08-14', 'status': 'Completed'},
  {'reportId': 'LAB-003', 'patientName': 'Regina', 'testName': 'Thyroid Function Test', 'collectionDate': '2025-08-15', 'status': 'Pending'},
  {'reportId': 'LAB-004', 'patientName': 'David', 'testName': 'Urinalysis', 'collectionDate': '2025-08-15', 'status': 'In Progress'},
  {'reportId': 'LAB-005', 'patientName': 'Joseph', 'testName': 'Liver Function Test', 'collectionDate': '2025-08-16', 'status': 'Pending'},
  {'reportId': 'LAB-006', 'patientName': 'Lokesh', 'testName': 'Glucose Tolerance Test', 'collectionDate': '2025-08-16', 'status': 'Completed'},
  {'reportId': 'LAB-007', 'patientName': 'Sophia Miller', 'testName': 'Biopsy Analysis', 'collectionDate': '2025-08-17', 'status': 'Pending'},
  {'reportId': 'LAB-008', 'patientName': 'James Wilson', 'testName': 'Kidney Function Test', 'collectionDate': '2025-08-17', 'status': 'Completed'},
  {'reportId': 'LAB-009', 'patientName': 'Olivia Garcia', 'testName': 'D-Dimer Test', 'collectionDate': '2025-08-18', 'status': 'Pending'},
  {'reportId': 'LAB-010', 'patientName': 'Liam Martinez', 'testName': 'Coagulation Profile', 'collectionDate': '2025-08-18', 'status': 'In Progress'},
  {'reportId': 'LAB-011', 'patientName': 'Emma Anderson', 'testName': 'Vitamin D Test', 'collectionDate': '2025-08-19', 'status': 'Completed'},
  {'reportId': 'LAB-012', 'patientName': 'Noah Taylor', 'testName': 'Electrolyte Panel', 'collectionDate': '2025-08-19', 'status': 'Pending'},
  {'reportId': 'LAB-013', 'patientName': 'Ava Thomas', 'testName': 'Hormone Panel', 'collectionDate': '2025-08-20', 'status': 'Completed'},
  {'reportId': 'LAB-014', 'patientName': 'Isabella White', 'testName': 'Tumor Markers', 'collectionDate': '2025-08-20', 'status': 'Pending'},
  {'reportId': 'LAB-015', 'patientName': 'Mason Harris', 'testName': 'Allergy Test', 'collectionDate': '2025-08-21', 'status': 'Completed'},
  {'reportId': 'LAB-016', 'patientName': 'Mia Clark', 'testName': 'C-Reactive Protein (CRP)', 'collectionDate': '2025-08-21', 'status': 'In Progress'},
  {'reportId': 'LAB-017', 'patientName': 'Ethan Lewis', 'testName': 'Blood Typing', 'collectionDate': '2025-08-22', 'status': 'Pending'},
  {'reportId': 'LAB-018', 'patientName': 'Abigail Robinson', 'testName': 'Microbiology Culture', 'collectionDate': '2025-08-22', 'status': 'Completed'},
  {'reportId': 'LAB-019', 'patientName': 'Michael Walker', 'testName': 'Genetic Testing', 'collectionDate': '2025-08-23', 'status': 'Pending'},
  {'reportId': 'LAB-020', 'patientName': 'Emily Hall', 'testName': 'Toxicology Screen', 'collectionDate': '2025-08-23', 'status': 'Completed'},
];

// --- Main Pathology Screen Widget ---
class PathologyScreen extends StatefulWidget {
  const PathologyScreen({super.key});

  @override
  State<PathologyScreen> createState() => _PathologyScreenState();
}

class _PathologyScreenState extends State<PathologyScreen> with SingleTickerProviderStateMixin {
  late Future<List<PathologyReport>> _reportsFuture;
  String _searchQuery = '';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _reportsFuture = _fetchReports();
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

  Future<List<PathologyReport>> _fetchReports() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _pathologyApiData.map((data) => PathologyReport.fromMap(data)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<PathologyReport>>(
        future: _reportsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildPathologyContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('No reports found.'));
          }
        },
      ),
    );
  }

  Widget _buildPathologyContent(BuildContext context, List<PathologyReport> reports) {
    final filteredReports = reports
        .where((r) =>
    r.patientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        r.reportId.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        r.testName.toLowerCase().contains(_searchQuery.toLowerCase()))
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
                'Pathology Reports',
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add, size: 20),
                label: Text('Add Report', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
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
              hintText: 'Search by patient, report ID, or test name',
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
          _buildReportsTable(context, filteredReports),
        ],
      ),
    );
  }

  Widget _buildReportsTable(BuildContext context, List<PathologyReport> reports) {
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
            DataColumn(label: Text('REPORT ID')),
            DataColumn(label: Text('PATIENT')),
            DataColumn(label: Text('TEST NAME')),
            DataColumn(label: Text('COLLECTION DATE')),
            DataColumn(label: Center(child: Text('STATUS'))),
            DataColumn(label: Center(child: Text('ACTIONS'))),
          ],
          rows: reports.map((r) => _buildDataRow(context, r)).toList(),
        ),
      ),
    );
  }

  DataRow _buildDataRow(BuildContext context, PathologyReport report) {
    return DataRow(
      cells: [
        DataCell(Text(report.reportId)),
        DataCell(Text(report.patientName, style: GoogleFonts.poppins(fontWeight: FontWeight.w500))),
        DataCell(Text(report.testName)),
        DataCell(Text(report.collectionDate)),
        DataCell(
          Center(
            child: Chip(
              label: Text(report.status),
              backgroundColor: report.status == 'Completed'
                  ? const Color(0xFFD1FAE5)
                  : report.status == 'Pending'
                  ? const Color(0xFFFEF3C7)
                  : const Color(0xFFE0E7FF),
              labelStyle: GoogleFonts.poppins(
                color: report.status == 'Completed'
                    ? const Color(0xFF065F46)
                    : report.status == 'Pending'
                    ? const Color(0xFF92400E)
                    : const Color(0xFF3730A3),
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
                    builder: (context) => PathologyDetailScreen(report: report),
                  ),
                );
              },
              child: Text(
                'View Reports',
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

// --- Pathology Detail Screen ---
class PathologyDetailScreen extends StatelessWidget {
  final PathologyReport report;

  const PathologyDetailScreen({super.key, required this.report});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text('Pathology Report', style: GoogleFonts.poppins(color: textPrimaryColor)),
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    report.reportId,
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: textPrimaryColor,
                    ),
                  ),
                  Chip(
                    label: Text(report.status),
                    backgroundColor: report.status == 'Completed'
                        ? const Color(0xFFD1FAE5)
                        : report.status == 'Pending'
                        ? const Color(0xFFFEF3C7)
                        : const Color(0xFFE0E7FF),
                    labelStyle: GoogleFonts.poppins(
                      color: report.status == 'Completed'
                          ? const Color(0xFF065F46)
                          : report.status == 'Pending'
                          ? const Color(0xFF92400E)
                          : const Color(0xFF3730A3),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 24),
              _buildDetailRow('Patient Name', report.patientName),
              _buildDetailRow('Test Name', report.testName),
              _buildDetailRow('Collection Date', report.collectionDate),
              _buildDetailRow('Report Date', '2025-08-25'),
              _buildDetailRow('Reporting Pathologist', 'Dr. Evelyn Reed'),
              const SizedBox(height: 24),
              Text(
                'Report Summary',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'All values are within the normal range. No abnormalities detected. Follow-up in 6 months is recommended for routine monitoring.',
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
