import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Import our new generic table
// Adjust these imports to your project
import '../../Models/Staff.dart';
import '../../Utils/Colors.dart';
import 'Widgets/generic_data_table.dart';
// ---------------------------------------------------------------------

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Data Models ---
class Payroll {
  final String id;
  final String employeeName;
  final String payPeriod;
  final double grossPay;
  final double deductions;
  final double netPay;
  final String status;

  Payroll({
    required this.id,
    required this.employeeName,
    required this.payPeriod,
    required this.grossPay,
    required this.deductions,
    required this.netPay,
    required this.status,
  });

  factory Payroll.fromMap(Map<String, dynamic> map) {
    return Payroll(
      id: map['id'],
      employeeName: map['employeeName'],
      payPeriod: map['payPeriod'],
      grossPay: map['grossPay'],
      deductions: map['deductions'],
      netPay: map['netPay'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _payrollApiData = [
  {'id': 'PAY-001', 'employeeName': 'Dr. Arthur', 'payPeriod': 'Aug 1-15', 'grossPay': 5500.00, 'deductions': 1200.00, 'netPay': 4300.00, 'status': 'Paid'},
  {'id': 'PAY-002', 'employeeName': 'Jane Smith', 'payPeriod': 'Aug 1-15', 'grossPay': 4500.00, 'deductions': 850.00, 'netPay': 3650.00, 'status': 'Pending'},
  {'id': 'PAY-003', 'employeeName': 'Michael Lee', 'payPeriod': 'Aug 1-15', 'grossPay': 6200.00, 'deductions': 1500.00, 'netPay': 4700.00, 'status': 'Paid'},
  {'id': 'PAY-004', 'employeeName': 'Sophia Chen', 'payPeriod': 'Aug 1-15', 'grossPay': 4800.00, 'deductions': 900.00, 'netPay': 3900.00, 'status': 'Pending'},
  {'id': 'PAY-005', 'employeeName': 'David Garcia', 'payPeriod': 'Aug 16-31', 'grossPay': 5100.00, 'deductions': 1100.00, 'netPay': 4000.00, 'status': 'Paid'},
  {'id': 'PAY-006', 'employeeName': 'Emily Davis', 'payPeriod': 'Aug 16-31', 'grossPay': 4900.00, 'deductions': 1050.00, 'netPay': 3850.00, 'status': 'Pending'},
  {'id': 'PAY-007', 'employeeName': 'Oliver Wilson', 'payPeriod': 'Aug 16-31', 'grossPay': 6500.00, 'deductions': 1600.00, 'netPay': 4900.00, 'status': 'Paid'},
  {'id': 'PAY-008', 'employeeName': 'Noah Brown', 'payPeriod': 'Aug 16-31', 'grossPay': 5300.00, 'deductions': 1150.00, 'netPay': 4150.00, 'status': 'Pending'},
  {'id': 'PAY-009', 'employeeName': 'Isabella Miller', 'payPeriod': 'Sep 1-15', 'grossPay': 5800.00, 'deductions': 1300.00, 'netPay': 4500.00, 'status': 'Paid'},
  {'id': 'PAY-010', 'employeeName': 'James Jones', 'payPeriod': 'Sep 1-15', 'grossPay': 4750.00, 'deductions': 950.00, 'netPay': 3800.00, 'status': 'Pending'},
  {'id': 'PAY-011', 'employeeName': 'Ava Wilson', 'payPeriod': 'Sep 1-15', 'grossPay': 6000.00, 'deductions': 1400.00, 'netPay': 4600.00, 'status': 'Paid'},
  {'id': 'PAY-012', 'employeeName': 'Liam Taylor', 'payPeriod': 'Sep 1-15', 'grossPay': 5200.00, 'deductions': 1050.00, 'netPay': 4150.00, 'status': 'Pending'},
  {'id': 'PAY-013', 'employeeName': 'Charlotte Green', 'payPeriod': 'Sep 16-30', 'grossPay': 5900.00, 'deductions': 1350.00, 'netPay': 4550.00, 'status': 'Paid'},
  {'id': 'PAY-014', 'employeeName': 'Mason White', 'payPeriod': 'Sep 16-30', 'grossPay': 4650.00, 'deductions': 880.00, 'netPay': 3770.00, 'status': 'Pending'},
  {'id': 'PAY-015', 'employeeName': 'Mia Johnson', 'payPeriod': 'Sep 16-30', 'grossPay': 6100.00, 'deductions': 1450.00, 'netPay': 4650.00, 'status': 'Paid'},
  {'id': 'PAY-016', 'employeeName': 'Ethan Moore', 'payPeriod': 'Sep 16-30', 'grossPay': 5000.00, 'deductions': 1000.00, 'netPay': 4000.00, 'status': 'Pending'},
  {'id': 'PAY-017', 'employeeName': 'Avery King', 'payPeriod': 'Oct 1-15', 'grossPay': 5700.00, 'deductions': 1250.00, 'netPay': 4450.00, 'status': 'Paid'},
  {'id': 'PAY-018', 'employeeName': 'Harper Evans', 'payPeriod': 'Oct 1-15', 'grossPay': 4950.00, 'deductions': 980.00, 'netPay': 3970.00, 'status': 'Pending'},
  {'id': 'PAY-019', 'employeeName': 'Leo Martinez', 'payPeriod': 'Oct 1-15', 'grossPay': 6300.00, 'deductions': 1550.00, 'netPay': 4750.00, 'status': 'Paid'},
  {'id': 'PAY-020', 'employeeName': 'Grace Lee', 'payPeriod': 'Oct 1-15', 'grossPay': 5400.00, 'deductions': 1180.00, 'netPay': 4220.00, 'status': 'Pending'},
];

// --- Main Payroll Screen Widget ---
class PayrollScreen extends StatefulWidget {
  const PayrollScreen({super.key});

  @override
  State<PayrollScreen> createState() => _PayrollScreenState();
}

class _PayrollScreenState extends State<PayrollScreen> {
  List<Payroll> _allPayroll = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _statusFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchPayroll();
  }

  Future<void> _fetchPayroll() async {
    setState(() {
      _isLoading = true;
    });
    await Future.delayed(const Duration(milliseconds: 700));
    final fetchedData = _payrollApiData.map((m) => Payroll.fromMap(m)).toList();
    setState(() {
      _allPayroll = fetchedData;
      _isLoading = false;
    });
  }

  Future<void> _onAddPressed() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Open Add Payroll Entry (demo)')));
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() { if (_currentPage > 0) setState(() => _currentPage--); }

  void _onView(int index, List<Payroll> list) {
    final payroll = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Viewing payroll for ${payroll.employeeName}")),
    );
  }

  void _onEdit(int index, List<Payroll> list) {
    final payroll = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Editing payroll for ${payroll.employeeName}")),
    );
  }

  Future<void> _onDelete(int index, List<Payroll> list) async {
    final payroll = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete payroll entry for ${payroll.employeeName}?'),
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
    _payrollApiData.removeWhere((item) => item['id'] == payroll.id);

    // Refresh the UI by removing from the in-memory list
    _allPayroll.removeWhere((p) => p.id == payroll.id);

    setState(() {
      _isLoading = false;
      final filteredItems = _getFilteredPayroll();
      if (_currentPage * 10 >= filteredItems.length && _currentPage > 0) {
        _currentPage = 0;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted payroll entry for ${payroll.employeeName} (demo)')));
  }

  // Method to get the filtered list of payroll entries
  List<Payroll> _getFilteredPayroll() {
    return _allPayroll.where((p) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = p.employeeName.toLowerCase().contains(q) || p.id.toLowerCase().contains(q) || p.payPeriod.toLowerCase().contains(q);
      final matchesFilter = _statusFilter == 'All' || p.status == _statusFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _statusChip(String status) {
    Color bg;
    Color fg;

    switch (status) {
      case 'Paid':
        bg = Colors.green.withOpacity(0.12);
        fg = Colors.green;
        break;
      case 'Pending':
        bg = Colors.orange.withOpacity(0.12);
        fg = Colors.orange;
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
    final statuses = {'All', ..._payrollApiData.map((s) => s['status'] as String).toSet()};
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
    final filtered = _getFilteredPayroll();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedPayroll = startIndex >= filtered.length
        ? <Payroll>[]
        : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['EMPLOYEE NAME', 'PAY PERIOD', 'GROSS PAY', 'DEDUCTIONS', 'NET PAY', 'STATUS'];
    final rows = paginatedPayroll.map((p) {
      return [
        Text(p.employeeName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(p.payPeriod, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text('\$${p.grossPay.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text('\$${p.deductions.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text('\$${p.netPay.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        _statusChip(p.status),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Payroll Management",
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
            onView: (i) => _onView(i, paginatedPayroll),
            onEdit: (i) => _onEdit(i, paginatedPayroll),
            onDelete: (i) => _onDelete(i, paginatedPayroll),
          ),
        ),
      ),
    );
  }
}
