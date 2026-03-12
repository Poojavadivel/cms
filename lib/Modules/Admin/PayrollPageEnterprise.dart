// lib/Modules/Admin/PayrollPageClean.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:iconsax/iconsax.dart';

import '../../Models/Payroll.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'Widgets/PayrollFormEnhanced.dart';
import 'Widgets/PayrollDetailEnhanced.dart' as DetailEnhanced;
import 'Widgets/generic_data_table.dart';


class PayrollPageEnterprise extends StatefulWidget {
  const PayrollPageEnterprise({super.key});

  @override
  State<PayrollPageEnterprise> createState() => _PayrollPageEnterpriseState();
}

class _PayrollPageEnterpriseState extends State<PayrollPageEnterprise>
    with SingleTickerProviderStateMixin {
  List<Payroll> _allPayrolls = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _departmentFilter = 'All';
  String _statusFilter = 'All';
  int? _monthFilter;
  int? _yearFilter;

  late TabController _tabController;
  final int _itemsPerPage = 25;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 7, vsync: this);
    _initializeFilters();
    _fetchPayrolls();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _initializeFilters() {
    final now = DateTime.now();
    _monthFilter = now.month;
    _yearFilter = now.year;
  }

  Future<void> _fetchPayrolls({bool forceRefresh = false}) async {
    if (mounted) setState(() => _isLoading = true);
    try {
      final fetched = await AuthService.instance.fetchPayrolls(
        forceRefresh: forceRefresh,
        month: _monthFilter,
        year: _yearFilter,
        department: _departmentFilter != 'All' ? _departmentFilter : '',
        status: _statusFilter != 'All' ? _statusFilter.toLowerCase() : '',
      );

      if (mounted) {
        setState(() {
          _allPayrolls = fetched;
          if (_currentPage < 0) _currentPage = 0;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch payrolls: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  List<Payroll> _getFilteredPayrolls() {
    final q = _searchQuery.trim().toLowerCase();
    var filtered = _allPayrolls.where((p) {
      final matchesSearch = q.isEmpty ||
          p.staffName.toLowerCase().contains(q) ||
          p.staffCode.toLowerCase().contains(q) ||
          p.department.toLowerCase().contains(q) ||
          p.payrollCode.toLowerCase().contains(q) ||
          p.designation.toLowerCase().contains(q);
      return matchesSearch;
    }).toList();

    final tabIndex = _tabController.index;
    if (tabIndex > 0) {
      final statusMap = [
        '',
        'draft',
        'pending',
        'approved',
        'processed',
        'paid',
        'rejected'
      ];
      final status = statusMap[tabIndex];
      filtered =
          filtered.where((p) => p.status.toLowerCase() == status).toList();
    }

    return filtered;
  }

  String _formatCurrency(double amount) {
    final formatter = NumberFormat.currency(symbol: '₹', decimalDigits: 0);
    return formatter.format(amount);
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredPayrolls();
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final paginated = startIndex >= filtered.length
        ? <Payroll>[]
        : filtered.sublist(startIndex, endIndex);

    return Scaffold(
      backgroundColor: AppColors.kBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Stats Dashboard
              _buildStatsDashboard(filtered),
              const SizedBox(height: 16),

              // Data Table with integrated filters
              Expanded(
                child: _buildDataTable(paginated, filtered),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==================== STATS DASHBOARD ====================

  Widget _buildStatsDashboard(List<Payroll> filtered) {
    final totalGross = filtered.fold<double>(0, (sum, p) => sum + p.grossSalary);
    final totalNet = filtered.fold<double>(0, (sum, p) => sum + p.netSalary);
    final totalDeductions = filtered.fold<double>(0, (sum, p) => sum + p.totalDeductions);
    final paidCount = filtered.where((p) => p.status.toLowerCase() == 'paid').length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Row(
        children: [
          Expanded(
            child: _StatCard(
              icon: Iconsax.document_text,
              label: 'Total Records',
              value: filtered.length.toString(),
              color: AppColors.primary600!,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: Iconsax.money_send,
              label: 'Gross Salary',
              value: _formatCurrency(totalGross),
              color: Colors.blue.shade600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: Iconsax.money_recive,
              label: 'Net Salary',
              value: _formatCurrency(totalNet),
              color: Colors.green.shade600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: Iconsax.minus,
              label: 'Deductions',
              value: _formatCurrency(totalDeductions),
              color: Colors.red.shade600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              icon: Iconsax.tick_circle,
              label: 'Paid',
              value: paidCount.toString(),
              color: Colors.green.shade700,
            ),
          ),
        ],
      ),
    );
  }

  // ==================== DATA TABLE ====================

  Widget _buildDataTable(List<Payroll> paginated, List<Payroll> filtered) {
    final headers = const ['CODE', 'STAFF NAME', 'DEPARTMENT', 'PERIOD', 'GROSS', 'DEDUCTIONS', 'NET SALARY', 'STATUS'];
    
    final cellStyle = GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary);

    Widget cell(String txt, {double width = 140}) {
      return SizedBox(
        width: width,
        child: Text(
          txt,
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          maxLines: 1,
          style: cellStyle,
        ),
      );
    }

    final rows = paginated.map((p) {
      return [
        cell(p.payrollCode.isNotEmpty ? p.payrollCode : p.staffCode, width: 120),
        cell(p.staffName, width: 180),
        cell(p.department, width: 140),
        cell(p.payPeriodDisplay, width: 120),
        cell(_formatCurrency(p.grossSalary), width: 120),
        cell(_formatCurrency(p.totalDeductions), width: 120),
        cell(_formatCurrency(p.netSalary), width: 130),
        SizedBox(width: 120, child: _buildStatusChip(p.status)),
      ];
    }).toList();

    return GenericDataTable(
      title: "Payroll",
      headers: headers,
      rows: rows,
      searchQuery: _searchQuery,
      onSearchChanged: _onSearchChanged,
      currentPage: _currentPage,
      totalItems: filtered.length,
      itemsPerPage: _itemsPerPage,
      onPreviousPage: () => setState(() => _currentPage--),
      onNextPage: () => setState(() => _currentPage++),
      isLoading: _isLoading,
      onAddPressed: _onAddPressed,
      filters: [_buildMonthYearFilter(), _buildDepartmentFilter(), _buildStatusFilter()],
      hideHorizontalScrollbar: true,
      onView: (i) => _onView(paginated[i]),
      onEdit: (i) => _onEdit(paginated[i]),
      onDelete: (i) => _onDelete(paginated[i]),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    
    switch (status.toLowerCase()) {
      case 'draft':
        color = Colors.grey.shade600;
        break;
      case 'pending':
        color = Colors.orange.shade700;
        break;
      case 'approved':
        color = Colors.green.shade700;
        break;
      case 'processed':
        color = Colors.purple.shade700;
        break;
      case 'paid':
        color = Colors.green.shade800;
        break;
      case 'rejected':
        color = Colors.red.shade700;
        break;
      default:
        color = Colors.grey.shade600;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.toUpperCase(),
        textAlign: TextAlign.center,
        overflow: TextOverflow.ellipsis,
        style: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 11,
          color: color,
        ),
      ),
    );
  }

  // ==================== FILTERS ====================

  Widget _buildMonthYearFilter() {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.calendar_month),
      tooltip: 'Month/Year',
      onSelected: (String value) {
        if (value.contains('-')) {
          final parts = value.split('-');
          setState(() {
            _monthFilter = int.parse(parts[0]);
            _yearFilter = int.parse(parts[1]);
            _currentPage = 0;
          });
          _fetchPayrolls(forceRefresh: true);
        }
      },
      itemBuilder: (BuildContext context) {
        final items = <PopupMenuItem<String>>[];
        final currentYear = DateTime.now().year;
        
        for (int year = currentYear; year >= currentYear - 2; year--) {
          for (int month = 12; month >= 1; month--) {
            final value = '$month-$year';
            final label = DateFormat('MMMM yyyy').format(DateTime(year, month));
            final isSelected = month == _monthFilter && year == _yearFilter;
            items.add(PopupMenuItem<String>(
              value: value,
              child: Row(
                children: [
                  if (isSelected) const Icon(Icons.check, size: 16),
                  if (isSelected) const SizedBox(width: 8),
                  Text(label, style: GoogleFonts.inter(fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal)),
                ],
              ),
            ));
          }
        }
        return items;
      },
    );
  }

  Widget _buildDepartmentFilter() {
    final departments = {'All', ..._allPayrolls.map((p) => p.department).where((d) => d.isNotEmpty).toSet()};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.business),
      tooltip: 'Department',
      onSelected: (String newValue) {
        setState(() {
          _departmentFilter = newValue;
          _currentPage = 0;
        });
        _fetchPayrolls();
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

  Widget _buildStatusFilter() {
    return PopupMenuButton<int>(
      icon: const Icon(Icons.filter_list),
      tooltip: 'Status',
      onSelected: (int index) {
        _tabController.animateTo(index);
        setState(() {
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        final tabs = ['All', 'Draft', 'Pending', 'Approved', 'Processed', 'Paid', 'Rejected'];
        return tabs.asMap().entries.map((entry) {
          final count = entry.key == 0
              ? _allPayrolls.length
              : _allPayrolls.where((p) => p.status.toLowerCase() == tabs[entry.key].toLowerCase()).length;
          return PopupMenuItem<int>(
            value: entry.key,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(tabs[entry.key], style: GoogleFonts.inter()),
                const SizedBox(width: 16),
                Text('($count)', style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 12)),
              ],
            ),
          );
        }).toList();
      },
    );
  }

  // ==================== ACTIONS ====================

  Future<void> _onAddPressed() async {
    try {
      final created = await showPayrollFormPopup(context);
      if (created == null) return;

      setState(() {
        final idx = _allPayrolls.indexWhere((p) => p.id == created.id);
        if (idx == -1) {
          _allPayrolls.insert(0, created);
        } else {
          _allPayrolls[idx] = created;
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payroll created successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create payroll: $e')),
        );
      }
      await _fetchPayrolls(forceRefresh: true);
    }
  }

  Future<void> _onView(Payroll payroll) async {
    await DetailEnhanced.showPayrollDetail(context,
        payrollId: payroll.id, initial: payroll);
    if (mounted) {
      await _fetchPayrolls(forceRefresh: true);
    }
  }

  Future<void> _onEdit(Payroll payroll) async {
    if (payroll.status.toLowerCase() != 'draft' &&
        payroll.status.toLowerCase() != 'pending') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Cannot edit payroll in ${payroll.status} status')),
      );
      return;
    }

    try {
      final updated = await showPayrollFormPopup(context, initial: payroll);
      if (updated == null) return;

      setState(() {
        final idx = _allPayrolls.indexWhere((p) => p.id == payroll.id);
        if (idx != -1) {
          _allPayrolls[idx] = updated;
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payroll updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update payroll: $e')),
        );
      }
      await _fetchPayrolls(forceRefresh: true);
    }
  }

  Future<void> _onDelete(Payroll payroll) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Payroll'),
        content: Text('Are you sure you want to delete payroll for ${payroll.staffName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await AuthService.instance.deletePayroll(payroll.id);
      
      setState(() {
        _allPayrolls.removeWhere((p) => p.id == payroll.id);
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payroll deleted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete payroll: $e')),
        );
      }
      await _fetchPayrolls(forceRefresh: true);
    }
  }
}

// ==================== HELPER WIDGETS ====================

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: color,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ==================== FORM POPUP ====================

Future<Payroll?> showPayrollFormPopup(BuildContext context,
    {Payroll? initial}) {
  final width = MediaQuery.of(context).size.width;

  if (width < 900) {
    return Navigator.of(context).push<Payroll>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PayrollFormEnhanced(initial: initial),
      ),
    );
  } else {
    return showDialog<Payroll>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        final maxW = MediaQuery.of(ctx).size.width * 0.95;
        final maxH = MediaQuery.of(ctx).size.height * 0.9;
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding:
              const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxW, maxHeight: maxH),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: PayrollFormEnhanced(initial: initial),
            ),
          ),
        );
      },
    );
  }
}
