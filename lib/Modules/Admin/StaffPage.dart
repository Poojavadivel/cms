import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Import our new generic table
// Adjust these imports to your project
import '../../Models/Staff.dart';
import '../../Utils/Colors.dart';
import 'widget/generic_data_table.dart';
// ---------------------------------------------------------------------

// Dummy staff data (your sample)
List<Map<String, dynamic>> _staffApiData = [
  {'id': 'DOC102', 'name': 'Dr. Amelia Harper', 'designation': 'Cardiologist', 'department': 'Cardiology', 'contact': '+1-555-123-4567', 'status': 'Available'},
  {'id': 'NUR534', 'name': 'Nurse Ethan Bennett', 'designation': 'Nurse', 'department': 'Orthopedics', 'contact': '+1-555-987-6543', 'status': 'On Leave'},
  {'id': 'LAB789', 'name': 'Liam Carter', 'designation': 'Lab Technician', 'department': 'Pathology', 'contact': '+1-555-246-8013', 'status': 'Available'},
  {'id': 'ADM456', 'name': 'Sophia Clark', 'designation': 'Admin Staff', 'department': 'General', 'contact': '+1-555-135-7912', 'status': 'Off Duty'},
  {'id': 'PHM210', 'name': 'Ava Morgan', 'designation': 'Pharmacist', 'department': 'Pharmacy', 'contact': '+1-555-369-2580', 'status': 'Available'},
  {'id': 'DOC103', 'name': 'Dr. Ben Johnson', 'designation': 'Neurologist', 'department': 'Neurology', 'contact': '+1-555-123-4568', 'status': 'Available'},
  {'id': 'NUR535', 'name': 'Nurse Emily White', 'designation': 'Nurse', 'department': 'Pediatrics', 'contact': '+1-555-987-6544', 'status': 'On Leave'},
  {'id': 'LAB790', 'name': 'Noah Brown', 'designation': 'Lab Technician', 'department': 'Pathology', 'contact': '+1-555-246-8014', 'status': 'Available'},
  {'id': 'ADM457', 'name': 'Olivia Green', 'designation': 'Admin Staff', 'department': 'General', 'contact': '+1-555-135-7913', 'status': 'Off Duty'},
  {'id': 'PHM211', 'name': 'William Davis', 'designation': 'Pharmacist', 'department': 'Pharmacy', 'contact': '+1-555-369-2581', 'status': 'Available'},
  {'id': 'DOC104', 'name': 'Dr. Clara Miller', 'designation': 'Psychiatrist', 'department': 'Psychiatry', 'contact': '+1-555-123-4569', 'status': 'On Leave'},
  {'id': 'NUR536', 'name': 'Nurse James Wilson', 'designation': 'Nurse', 'department': 'General', 'contact': '+1-555-987-6545', 'status': 'Available'},
  {'id': 'DOC105', 'name': 'Dr. Adam Lee', 'designation': 'Orthopedist', 'department': 'Orthopedics', 'contact': '+1-555-123-4570', 'status': 'Available'},
  {'id': 'NUR537', 'name': 'Nurse Grace Hall', 'designation': 'Nurse', 'department': 'Dermatology', 'contact': '+1-555-987-6546', 'status': 'On Leave'},
  {'id': 'LAB791', 'name': 'Charlotte King', 'designation': 'Lab Technician', 'department': 'Pathology', 'contact': '+1-555-246-8015', 'status': 'Available'},
  {'id': 'ADM458', 'name': 'Daniel Scott', 'designation': 'Admin Staff', 'department': 'General', 'contact': '+1-555-135-7914', 'status': 'Off Duty'},
  {'id': 'PHM212', 'name': 'Chloe Baker', 'designation': 'Pharmacist', 'department': 'Pharmacy', 'contact': '+1-555-369-2582', 'status': 'Available'},
  {'id': 'DOC106', 'name': 'Dr. Lucas Adams', 'designation': 'Pediatrician', 'department': 'Pediatrics', 'contact': '+1-555-123-4571', 'status': 'Available'},
  {'id': 'NUR538', 'name': 'Nurse Mia Rogers', 'designation': 'Nurse', 'department': 'Cardiology', 'contact': '+1-555-987-6547', 'status': 'On Leave'},
  {'id': 'LAB792', 'name': 'Henry Foster', 'designation': 'Lab Technician', 'department': 'Pathology', 'contact': '+1-555-246-8016', 'status': 'Available'},
  {'id': 'ADM459', 'name': 'Lily Evans', 'designation': 'Admin Staff', 'department': 'General', 'contact': '+1-555-135-7915', 'status': 'Off Duty'},
  {'id': 'PHM213', 'name': 'Noah Clark', 'designation': 'Pharmacist', 'department': 'Pharmacy', 'contact': '+1-555-369-2583', 'status': 'Available'},
  {'id': 'DOC107', 'name': 'Dr. Zoe Wilson', 'designation': 'Radiologist', 'department': 'Radiology', 'contact': '+1-555-123-4572', 'status': 'Available'},
  {'id': 'NUR539', 'name': 'Nurse Oliver King', 'designation': 'Nurse', 'department': 'Orthopedics', 'contact': '+1-555-987-6548', 'status': 'On Leave'},
  {'id': 'LAB793', 'name': 'Penelope White', 'designation': 'Lab Technician', 'department': 'Pathology', 'contact': '+1-555-246-8017', 'status': 'Available'},
];

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  List<Staff> _allStaff = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _departmentFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchStaff();
  }

  Future<void> _fetchStaff() async {
    setState(() {
      _isLoading = true;
    });
    await Future.delayed(const Duration(milliseconds: 700));
    final fetchedData = _staffApiData.map((m) => Staff.fromMap(m)).toList();
    setState(() {
      _allStaff = fetchedData;
      _isLoading = false;
    });
  }

  // Callbacks passed to GenericDataTable
  Future<void> _onAddPressed() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Open Add Staff (demo)')));
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() { if (_currentPage > 0) setState(() => _currentPage--); }

  void _onView(int index, List<Staff> list) {
    final staffMember = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Viewing details for ${staffMember.name}")),
    );
  }

  void _onEdit(int index, List<Staff> list) {
    final staffMember = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Editing ${staffMember.name}")),
    );
  }

  Future<void> _onDelete(int index, List<Staff> list) async {
    final staffMember = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete ${staffMember.name}?'),
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
    _staffApiData.removeWhere((item) => item['id'] == staffMember.id);

    // Refresh the UI by fetching the new list
    _allStaff.removeWhere((staff) => staff.id == staffMember.id);

    setState(() {
      _isLoading = false;
      // Reset page to 0 if the current page is no longer valid
      final filteredItems = _getFilteredStaff();
      if (_currentPage * 10 >= filteredItems.length && _currentPage > 0) {
        _currentPage = 0;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted ${staffMember.name} (demo)')));
  }

  // Method to get the filtered list of staff
  List<Staff> _getFilteredStaff() {
    return _allStaff.where((s) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = s.name.toLowerCase().contains(q) || s.id.toLowerCase().contains(q) || s.department.toLowerCase().contains(q);
      final matchesFilter = _departmentFilter == 'All' || s.department == _departmentFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _statusChip(String status) {
    final isAvailable = status.toLowerCase() == 'available';
    final bg = isAvailable ? Colors.green.withOpacity(0.12) : AppColors.primary600.withOpacity(0.12);
    final fg = isAvailable ? Colors.green : AppColors.primary600;

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

  // New filter widget for departments using an icon button
  Widget _buildDepartmentFilter() {
    final departments = {'All', ..._staffApiData.map((s) => s['department'] as String).toSet()};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      onSelected: (String newValue) {
        setState(() {
          _departmentFilter = newValue;
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        return departments.map((String value) {
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
    final filtered = _getFilteredStaff();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedStaff = startIndex >= filtered.length
        ? <Staff>[]
        : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['STAFF ID', 'STAFF NAME', 'DESIGNATION', 'DEPARTMENT', 'CONTACT', 'STATUS'];
    final rows = paginatedStaff.map((s) {
      return [
        Text(s.id, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(s.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(s.designation, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(s.department, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(s.contact, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        _statusChip(s.status),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Staff",
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
            filters: [_buildDepartmentFilter()],
            hideHorizontalScrollbar: true,
            // Pass action callbacks to show the action buttons
            onView: (i) => _onView(i, paginatedStaff),
            onEdit: (i) => _onEdit(i, paginatedStaff),
            onDelete: (i) => _onDelete(i, paginatedStaff),
          ),
        ),
      ),
    );
  }
}
