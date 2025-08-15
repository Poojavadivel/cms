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
class Staff {
  final String id;
  final String name;
  final String designation;
  final String department;
  final String contact;
  final String status;

  Staff({
    required this.id,
    required this.name,
    required this.designation,
    required this.department,
    required this.contact,
    required this.status,
  });

  factory Staff.fromMap(Map<String, dynamic> map) {
    return Staff(
      id: map['id'],
      name: map['name'],
      designation: map['designation'],
      department: map['department'],
      contact: map['contact'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _staffApiData = [
  {'id': 'DOC102', 'name': 'Dr. Amelia Harper', 'designation': 'Cardiologist', 'department': 'Cardiology', 'contact': '+1-555-123-4567', 'status': 'Available'},
  {'id': 'NUR534', 'name': 'Nurse Ethan Bennett', 'designation': 'Nurse', 'department': 'Orthopedics', 'contact': '+1-555-987-6543', 'status': 'On Leave'},
  {'id': 'LAB789', 'name': 'Liam Carter', 'designation': 'Lab Technician', 'department': 'Pathology', 'contact': '+1-555-246-8013', 'status': 'Available'},
  {'id': 'ADM456', 'name': 'Sophia Clark', 'designation': 'Admin Staff', 'department': 'General', 'contact': '+1-555-135-7912', 'status': 'Off Duty'},
  {'id': 'PHM210', 'name': 'Ava Morgan', 'designation': 'Pharmacist', 'department': 'Pharmacy', 'contact': '+1-555-369-2580', 'status': 'Available'},
  {'id': 'DOC102', 'name': 'Dr. Amelia Harper', 'designation': 'Cardiologist', 'department': 'Cardiology', 'contact': '+1-555-123-4567', 'status': 'Available'},
  {'id': 'NUR534', 'name': 'Nurse Ethan Bennett', 'designation': 'Nurse', 'department': 'Orthopedics', 'contact': '+1-555-987-6543', 'status': 'On Leave'},
  {'id': 'LAB789', 'name': 'Liam Carter', 'designation': 'Lab Technician', 'department': 'Pathology', 'contact': '+1-555-246-8013', 'status': 'Available'},
  {'id': 'ADM456', 'name': 'Sophia Clark', 'designation': 'Admin Staff', 'department': 'General', 'contact': '+1-555-135-7912', 'status': 'Off Duty'},
  {'id': 'PHM210', 'name': 'Ava Morgan', 'designation': 'Pharmacist', 'department': 'Pharmacy', 'contact': '+1-555-369-2580', 'status': 'Available'},
];

// --- Main Staff Screen Widget ---
class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> with SingleTickerProviderStateMixin {
  late Future<List<Staff>> _staffFuture;
  String _searchQuery = '';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _staffFuture = _fetchStaff();
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

  Future<List<Staff>> _fetchStaff() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _staffApiData.map((data) => Staff.fromMap(data)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<Staff>>(
        future: _staffFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildStaffContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('No staff found.'));
          }
        },
      ),
    );
  }

  Widget _buildStaffContent(BuildContext context, List<Staff> staff) {
    final filteredStaff = staff
        .where((s) =>
    s.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        s.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        s.department.toLowerCase().contains(_searchQuery.toLowerCase()))
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
                'Staff Management',
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add, size: 20),
                label: Text('Add Staff', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
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
              hintText: 'Search by name, ID, or department',
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
          _buildStaffTable(context, filteredStaff),
        ],
      ),
    );
  }

  Widget _buildStaffTable(BuildContext context, List<Staff> staff) {
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
            DataColumn(label: Text('STAFF ID')),
            DataColumn(label: Text('NAME')),
            DataColumn(label: Text('DESIGNATION')),
            DataColumn(label: Text('DEPARTMENT')),
            DataColumn(label: Text('CONTACT')),
            DataColumn(label: Center(child: Text('STATUS'))),
            DataColumn(label: Center(child: Text('ACTIONS'))),
          ],
          rows: staff.map((s) => _buildDataRow(s)).toList(),
        ),
      ),
    );
  }

  DataRow _buildDataRow(Staff staff) {
    Color statusColor;
    Color statusBackgroundColor;

    switch (staff.status) {
      case 'Available':
        statusColor = const Color(0xFF065F46);
        statusBackgroundColor = const Color(0xFFD1FAE5);
        break;
      case 'On Leave':
        statusColor = const Color(0xFF92400E);
        statusBackgroundColor = const Color(0xFFFEF3C7);
        break;
      default:
        statusColor = textSecondaryColor;
        statusBackgroundColor = Colors.grey.shade200;
    }

    return DataRow(
      cells: [
        DataCell(Text(staff.id)),
        DataCell(Text(staff.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w500))),
        DataCell(Text(staff.designation)),
        DataCell(Text(staff.department)),
        DataCell(Text(staff.contact)),
        DataCell(
          Center(
            child: Chip(
              label: Text(staff.status),
              backgroundColor: statusBackgroundColor,
              labelStyle: GoogleFonts.poppins(
                color: statusColor,
                fontWeight: FontWeight.w600,
              ),
              side: BorderSide.none,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
        ),
        DataCell(
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(icon: const Icon(Icons.visibility_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'View Details'),
              IconButton(icon: const Icon(Icons.edit_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'Edit'),
              IconButton(icon: const Icon(Icons.delete_rounded), onPressed: () {}, color: textSecondaryColor, tooltip: 'Delete'),
            ],
          ),
        ),
      ],
    );
  }
}
