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
class Medicine {
  final String id;
  final String name;
  final String brand;
  final int stock;
  final String status;

  Medicine({
    required this.id,
    required this.name,
    required this.brand,
    required this.stock,
    required this.status,
  });

  factory Medicine.fromMap(Map<String, dynamic> map) {
    return Medicine(
      id: map['id'],
      name: map['name'],
      brand: map['brand'],
      stock: map['stock'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _pharmacyApiData = [
  {'id': 'MED-001', 'name': 'Paracetamol', 'brand': 'Cipla', 'stock': 150, 'status': 'In Stock'},
  {'id': 'MED-002', 'name': 'Amoxicillin', 'brand': 'Sun Pharma', 'stock': 80, 'status': 'In Stock'},
  {'id': 'MED-003', 'name': 'Ibuprofen', 'brand': 'Dr. Reddy\'s', 'stock': 20, 'status': 'Low Stock'},
  {'id': 'MED-004', 'name': 'Aspirin', 'brand': 'Lupin', 'stock': 0, 'status': 'Out of Stock'},
  {'id': 'MED-005', 'name': 'Metformin', 'brand': 'Cipla', 'stock': 120, 'status': 'In Stock'},
  {'id': 'MED-006', 'name': 'Atorvastatin', 'brand': 'Sun Pharma', 'stock': 90, 'status': 'In Stock'},
  {'id': 'MED-007', 'name': 'Omeprazole', 'brand': 'Dr. Reddy\'s', 'stock': 15, 'status': 'Low Stock'},
  {'id': 'MED-008', 'name': 'Losartan', 'brand': 'Lupin', 'stock': 200, 'status': 'In Stock'},
  {'id': 'MED-009', 'name': 'Amlodipine', 'brand': 'Cipla', 'stock': 0, 'status': 'Out of Stock'},
  {'id': 'MED-010', 'name': 'Gabapentin', 'brand': 'Sun Pharma', 'stock': 60, 'status': 'In Stock'},
  {'id': 'MED-011', 'name': 'Hydrochlorothiazide', 'brand': 'Dr. Reddy\'s', 'stock': 25, 'status': 'Low Stock'},
  {'id': 'MED-012', 'name': 'Sertraline', 'brand': 'Lupin', 'stock': 180, 'status': 'In Stock'},
  {'id': 'MED-013', 'name': 'Tamsulosin', 'brand': 'Cipla', 'stock': 50, 'status': 'In Stock'},
  {'id': 'MED-014', 'name': 'Furosemide', 'brand': 'Sun Pharma', 'stock': 10, 'status': 'Low Stock'},
  {'id': 'MED-015', 'name': 'Alprazolam', 'brand': 'Dr. Reddy\'s', 'stock': 0, 'status': 'Out of Stock'},
  {'id': 'MED-016', 'name': 'Citalopram', 'brand': 'Lupin', 'stock': 100, 'status': 'In Stock'},
  {'id': 'MED-017', 'name': 'Insulin Glargine', 'brand': 'Cipla', 'stock': 30, 'status': 'In Stock'},
  {'id': 'MED-018', 'name': 'Levothyroxine', 'brand': 'Sun Pharma', 'stock': 5, 'status': 'Low Stock'},
  {'id': 'MED-019', 'name': 'Rosuvastatin', 'brand': 'Dr. Reddy\'s', 'stock': 130, 'status': 'In Stock'},
  {'id': 'MED-020', 'name': 'Zolpidem', 'brand': 'Lupin', 'stock': 40, 'status': 'In Stock'},
  {'id': 'MED-021', 'name': 'Lisinopril', 'brand': 'Cipla', 'stock': 95, 'status': 'In Stock'},
  {'id': 'MED-022', 'name': 'Ranitidine', 'brand': 'Sun Pharma', 'stock': 12, 'status': 'Low Stock'},
  {'id': 'MED-023', 'name': 'Cetirizine', 'brand': 'Dr. Reddy\'s', 'stock': 0, 'status': 'Out of Stock'},
  {'id': 'MED-024', 'name': 'Metoprolol', 'brand': 'Lupin', 'stock': 88, 'status': 'In Stock'},
  {'id': 'MED-025', 'name': 'Pantoprazole', 'brand': 'Cipla', 'stock': 15, 'status': 'Low Stock'},
];

class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({super.key});

  @override
  State<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen> {
  List<Medicine> _allMedicines = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _statusFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchMedicines();
  }

  Future<void> _fetchMedicines() async {
    setState(() {
      _isLoading = true;
    });
    await Future.delayed(const Duration(milliseconds: 700));
    final fetchedData = _pharmacyApiData.map((m) => Medicine.fromMap(m)).toList();
    setState(() {
      _allMedicines = fetchedData;
      _isLoading = false;
    });
  }

  Future<void> _onAddPressed() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Open Add Medicine (demo)')));
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() { if (_currentPage > 0) setState(() => _currentPage--); }

  void _onView(int index, List<Medicine> list) {
    final medicine = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Viewing details for ${medicine.name}")),
    );
  }

  void _onEdit(int index, List<Medicine> list) {
    final medicine = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Editing ${medicine.name}")),
    );
  }

  Future<void> _onDelete(int index, List<Medicine> list) async {
    final medicine = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete ${medicine.name}?'),
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
    _pharmacyApiData.removeWhere((item) => item['id'] == medicine.id);

    // Refresh the UI by removing from the in-memory list
    _allMedicines.removeWhere((m) => m.id == medicine.id);

    setState(() {
      _isLoading = false;
      final filteredItems = _getFilteredMedicines();
      if (_currentPage * 10 >= filteredItems.length && _currentPage > 0) {
        _currentPage = 0;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted ${medicine.name} (demo)')));
  }

  // Method to get the filtered list of medicines
  List<Medicine> _getFilteredMedicines() {
    return _allMedicines.where((m) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = m.name.toLowerCase().contains(q) || m.id.toLowerCase().contains(q) || m.brand.toLowerCase().contains(q);
      final matchesFilter = _statusFilter == 'All' || m.status == _statusFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _statusChip(String status) {
    Color bg;
    Color fg;

    switch (status) {
      case 'In Stock':
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        break;
      case 'Low Stock':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        break;
      case 'Out of Stock':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
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

  Widget _buildStatusFilter() {
    final statuses = {'All', ..._pharmacyApiData.map((s) => s['status'] as String).toSet()};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      onSelected: (String newValue) {
        setState(() {
          _statusFilter = newValue;
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        return statuses.map((String value) {
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
    final filtered = _getFilteredMedicines();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedMedicines = startIndex >= filtered.length
        ? <Medicine>[]
        : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['MEDICINE ID', 'NAME', 'BRAND', 'STOCK', 'STATUS'];
    final rows = paginatedMedicines.map((m) {
      return [
        Text(m.id, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(m.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(m.brand, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(m.stock.toString(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        _statusChip(m.status),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Pharmacy Inventory",
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
            filters: [_buildStatusFilter()],
            hideHorizontalScrollbar: true,
            onView: (i) => _onView(i, paginatedMedicines),
            onEdit: (i) => _onEdit(i, paginatedMedicines),
            onDelete: (i) => _onDelete(i, paginatedMedicines),
          ),
        ),
      ),
    );
  }
}
