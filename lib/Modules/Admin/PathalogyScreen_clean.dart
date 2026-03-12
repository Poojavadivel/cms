import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Import our new generic table
// Adjust these imports to your project
import '../../Models/Staff.dart';
import '../../Utils/Colors.dart';
import 'Widgets/generic_data_table.dart';

// ---------------------------------------------------------------------

// --- Data Models ---
class PathologyReport {
  final String reportId;
  final String patientName;
  final String testName;
  final String collectionDate;
  final String status;
  final String doctorName;

  PathologyReport({
    required this.reportId,
    required this.patientName,
    required this.testName,
    required this.collectionDate,
    required this.status,
    required this.doctorName,
  });

  factory PathologyReport.fromMap(Map<String, dynamic> map) {
    return PathologyReport(
      reportId: map['reportId'],
      patientName: map['patientName'],
      testName: map['testName'],
      collectionDate: map['collectionDate'],
      status: map['status'],
      doctorName: map['doctorName'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _pathologyApiData = [
  {'reportId': 'LAB-001', 'patientName': 'Arthur', 'testName': 'Complete Blood Count (CBC)', 'collectionDate': '2025-08-14', 'status': 'Completed', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-002', 'patientName': 'John Philips', 'testName': 'Lipid Profile', 'collectionDate': '2025-08-14', 'status': 'Completed', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-003', 'patientName': 'Regina', 'testName': 'Thyroid Function Test', 'collectionDate': '2025-08-15', 'status': 'Pending', 'doctorName': 'Dr. Emily'},
  {'reportId': 'LAB-004', 'patientName': 'David', 'testName': 'Urinalysis', 'collectionDate': '2025-08-15', 'status': 'In Progress', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-005', 'patientName': 'Joseph', 'testName': 'Liver Function Test', 'collectionDate': '2025-08-16', 'status': 'Pending', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-006', 'patientName': 'Lokesh', 'testName': 'Glucose Tolerance Test', 'collectionDate': '2025-08-16', 'status': 'Completed', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-007', 'patientName': 'Sophia Miller', 'testName': 'Biopsy Analysis', 'collectionDate': '2025-08-17', 'status': 'Pending', 'doctorName': 'Dr. Emily'},
  {'reportId': 'LAB-008', 'patientName': 'James Wilson', 'testName': 'Kidney Function Test', 'collectionDate': '2025-08-17', 'status': 'Completed', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-009', 'patientName': 'Olivia Garcia', 'testName': 'D-Dimer Test', 'collectionDate': '2025-08-18', 'status': 'Pending', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-010', 'patientName': 'Liam Martinez', 'testName': 'Coagulation Profile', 'collectionDate': '2025-08-18', 'status': 'In Progress', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-011', 'patientName': 'Emma Anderson', 'testName': 'Vitamin D Test', 'collectionDate': '2025-08-19', 'status': 'Completed', 'doctorName': 'Dr. Emily'},
  {'reportId': 'LAB-012', 'patientName': 'Noah Taylor', 'testName': 'Electrolyte Panel', 'collectionDate': '2025-08-19', 'status': 'Pending', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-013', 'patientName': 'Ava Thomas', 'testName': 'Hormone Panel', 'collectionDate': '2025-08-20', 'status': 'Completed', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-014', 'patientName': 'Isabella White', 'testName': 'Tumor Markers', 'collectionDate': '2025-08-20', 'status': 'Pending', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-015', 'patientName': 'Mason Harris', 'testName': 'Allergy Test', 'collectionDate': '2025-08-21', 'status': 'Completed', 'doctorName': 'Dr. Emily'},
  {'reportId': 'LAB-016', 'patientName': 'Mia Clark', 'testName': 'C-Reactive Protein (CRP)', 'collectionDate': '2025-08-21', 'status': 'In Progress', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-017', 'patientName': 'Ethan Lewis', 'testName': 'Blood Typing', 'collectionDate': '2025-08-22', 'status': 'Pending', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-018', 'patientName': 'Abigail Robinson', 'testName': 'Microbiology Culture', 'collectionDate': '2025-08-22', 'status': 'Completed', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-019', 'patientName': 'Michael Walker', 'testName': 'Genetic Testing', 'collectionDate': '2025-08-23', 'status': 'Pending', 'doctorName': 'Dr. Emily'},
  {'reportId': 'LAB-020', 'patientName': 'Emily Hall', 'testName': 'Toxicology Screen', 'collectionDate': '2025-08-23', 'status': 'Completed', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-021', 'patientName': 'Daniel Lee', 'testName': 'X-ray', 'collectionDate': '2025-08-24', 'status': 'In Progress', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-022', 'patientName': 'Chloe King', 'testName': 'MRI Scan', 'collectionDate': '2025-08-24', 'status': 'Pending', 'doctorName': 'Dr. Alan'},
  {'reportId': 'LAB-023', 'patientName': 'Samuel Green', 'testName': 'CT Scan', 'collectionDate': '2025-08-25', 'status': 'Completed', 'doctorName': 'Dr. Emily'},
  {'reportId': 'LAB-024', 'patientName': 'Zoe Scott', 'testName': 'Ultrasound', 'collectionDate': '2025-08-25', 'status': 'In Progress', 'doctorName': 'Dr. Sarah'},
  {'reportId': 'LAB-025', 'patientName': 'Matthew Adams', 'testName': 'Electrocardiogram (ECG)', 'collectionDate': '2025-08-26', 'status': 'Completed', 'doctorName': 'Dr. Alan'},
];

class PathologyScreen extends StatefulWidget {
  const PathologyScreen({super.key});

  @override
  State<PathologyScreen> createState() => _PathologyScreenState();
}

class _PathologyScreenState extends State<PathologyScreen> {
  List<PathologyReport> _allReports = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _doctorFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    setState(() {
      _isLoading = true;
    });
    await Future.delayed(const Duration(milliseconds: 700));
    final fetchedData = _pathologyApiData.map((m) => PathologyReport.fromMap(m)).toList();
    setState(() {
      _allReports = fetchedData;
      _isLoading = false;
    });
  }

  Future<void> _onAddPressed() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _EnterpriseAddReportDialog(),
    );

    if (result != null) {
      // Add the new report to the list
      setState(() {
        _allReports.add(PathologyReport.fromMap(result));
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text('Report ${result['reportId']} created successfully', style: GoogleFonts.inter(fontWeight: FontWeight.w500))),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 6,
            margin: const EdgeInsets.all(16),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() { if (_currentPage > 0) setState(() => _currentPage--); }

  void _onView(int index, List<PathologyReport> list) {
    final report = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Showing raw test view for report ID: ${report.reportId}")),
    );
  }
  Future<void> _onEdit(int index, List<PathologyReport> list) async {
    final report = list[index];
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _EnterpriseEditReportDialog(report: report),
    );

    if (result != null && mounted) {
      // Update the report in the list
      setState(() {
        final globalIndex = _allReports.indexWhere((r) => r.reportId == report.reportId);
        if (globalIndex != -1) {
          _allReports[globalIndex] = PathologyReport.fromMap(result);
        }
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text('Report ${result['reportId']} updated successfully', style: GoogleFonts.inter(fontWeight: FontWeight.w500))),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 6,
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }
  void _onDelete(int index, List<PathologyReport> list) {
    final report = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Showing raw test view for report ID: ${report.reportId}")),
    );
  }

  // Method to get the filtered list of reports
  List<PathologyReport> _getFilteredReports() {
    return _allReports.where((r) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = r.patientName.toLowerCase().contains(q) || r.reportId.toLowerCase().contains(q) || r.testName.toLowerCase().contains(q);
      final matchesFilter = _doctorFilter == 'All' || r.doctorName == _doctorFilter;
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
      case 'In Progress':
        bg = Colors.blue.withOpacity(0.12);
        fg = Colors.blue;
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
    final doctors = {'All', ..._pathologyApiData.map((s) => s['doctorName'] as String).toSet()};
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
    final filtered = _getFilteredReports();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedReports = startIndex >= filtered.length
        ? <PathologyReport>[]
        : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['REPORT ID', 'PATIENT NAME', 'DOCTOR', 'TEST NAME', 'DATE', 'STATUS'];
    final rows = paginatedReports.map((p) {
      return [
        Text(p.reportId, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B))),
        Text(p.patientName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B))),
        Text(p.doctorName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B))),
        Text(p.testName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B))),
        Text(p.collectionDate, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B))),
        _statusChip(p.status),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Pathology Reports",
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
            onView: (i) => _onView(i, paginatedReports),
            onEdit: (i) => _onEdit(i, paginatedReports),
            onDelete: (i) => _onDelete(i, paginatedReports),
          ),
        ),
      ),
    );
  }
}

// ================================================================
