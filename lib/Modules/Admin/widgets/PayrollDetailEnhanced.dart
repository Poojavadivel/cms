// lib/Modules/Admin/Widgets/PayrollDetailEnhanced.dart
// ENTERPRISE-LEVEL PAYROLL DETAIL VIEW - PRODUCTION GRADE
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:iconsax/iconsax.dart';

import '../../../Models/Payroll.dart';
import '../../../Services/Authservices.dart';

/// Show payroll detail - Enterprise grade
Future<Payroll?> showPayrollDetail(
  BuildContext context, {
  required String payrollId,
  Payroll? initial,
}) {
  final screenWidth = MediaQuery.of(context).size.width;

  if (screenWidth < 900) {
    // Mobile: Fullscreen
    return Navigator.of(context).push<Payroll>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PayrollDetailPage(payrollId: payrollId, initial: initial),
      ),
    );
  } else {
    // Desktop: Large Dialog
    return showDialog<Payroll>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(20),
          child: Container(
            width: MediaQuery.of(ctx).size.width * 0.9,
            height: MediaQuery.of(ctx).size.height * 0.9,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: PayrollDetailPage(payrollId: payrollId, initial: initial),
          ),
        );
      },
    );
  }
}

class PayrollDetailPage extends StatefulWidget {
  final String payrollId;
  final Payroll? initial;

  const PayrollDetailPage({
    super.key,
    required this.payrollId,
    this.initial,
  });

  @override
  State<PayrollDetailPage> createState() => _PayrollDetailPageState();
}

class _PayrollDetailPageState extends State<PayrollDetailPage> {
  bool _loading = true;
  bool _saving = false;
  Payroll? _payroll;
  String? _error;

  @override
  void initState() {
    super.initState();
    _payroll = widget.initial;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final p = await AuthService.instance.fetchPayrollById(widget.payrollId);
      if (mounted) {
        setState(() {
          _payroll = p;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _approvePayroll() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Approve Payroll', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to approve this payroll?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Approve'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _saving = true);
    try {
      final updated = await AuthService.instance.approvePayroll(widget.payrollId);
      if (mounted) {
        setState(() {
          _payroll = updated;
          _saving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payroll approved')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }

  Future<void> _rejectPayroll() async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reject Payroll', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Reason for rejection:'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter reason...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _saving = true);
    try {
      final updated = await AuthService.instance.rejectPayroll(widget.payrollId, reason: controller.text);
      if (mounted) {
        setState(() {
          _payroll = updated;
          _saving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payroll rejected')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }

  String _formatCurrency(double amount) {
    return NumberFormat.currency(symbol: '₹', decimalDigits: 0).format(amount);
  }



  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'draft':
        return Colors.grey.shade600;
      case 'pending':
        return Colors.orange.shade700;
      case 'approved':
        return Colors.green.shade700;
      case 'processed':
        return Colors.purple.shade700;
      case 'paid':
        return Colors.green.shade800;
      case 'rejected':
        return Colors.red.shade700;
      default:
        return Colors.grey.shade600;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        color: const Color(0xFFF5F5F5),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 40,
                height: 40,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation(Colors.grey.shade800),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Loading...',
                style: GoogleFonts.roboto(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Colors.grey.shade700,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Container(
        color: const Color(0xFFF5F5F5),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Iconsax.warning_2, size: 48, color: Colors.grey.shade600),
              const SizedBox(height: 16),
              Text(
                'Error Loading Data',
                style: GoogleFonts.roboto(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        ),
      );
    }

    final p = _payroll;
    if (p == null) {
      return const Center(child: Text('No data'));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: Column(
        children: [
          // Enterprise App Bar
          _buildEnterpriseAppBar(p),
          
          // Main Content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Header Section
                  _buildEnterpriseHeader(p),
                  
                  // Content Container
                  Container(
                    constraints: const BoxConstraints(maxWidth: 1400),
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Financial Summary
                        _buildFinancialSummary(p),
                        const SizedBox(height: 32),

                        // Grid Layout
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 2,
                              child: Column(
                                children: [
                                  _buildEarningsSection(p),
                                  const SizedBox(height: 24),
                                  _buildDeductionsSection(p),
                                ],
                              ),
                            ),
                            const SizedBox(width: 24),
                            Expanded(
                              child: Column(
                                children: [
                                  _buildAttendanceSection(p),
                                  const SizedBox(height: 24),
                                  if (p.paymentMode == 'bank_transfer')
                                    _buildPaymentInfoSection(p),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Action Bar
          _buildEnterpriseActions(p),

          // Loading Overlay
          if (_saving)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation(Colors.grey.shade800),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Processing...',
                        style: GoogleFonts.roboto(
                          fontSize: 14,
                          color: Colors.grey.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseAppBar(Payroll p) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade300, width: 1),
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, size: 20),
                onPressed: () => Navigator.pop(context),
                tooltip: 'Back',
                color: Colors.grey.shade700,
              ),
              const SizedBox(width: 16),
              Text(
                'Payroll Detail',
                style: GoogleFonts.roboto(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey.shade900,
                  letterSpacing: 0.2,
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () {},
                icon: Icon(Icons.print_outlined, size: 16, color: Colors.grey.shade700),
                label: Text(
                  'Print',
                  style: GoogleFonts.roboto(
                    fontSize: 13,
                    color: Colors.grey.shade700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: () {},
                icon: Icon(Icons.download_outlined, size: 16, color: Colors.grey.shade700),
                label: Text(
                  'Export',
                  style: GoogleFonts.roboto(
                    fontSize: 13,
                    color: Colors.grey.shade700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEnterpriseHeader(Payroll p) {
    final statusColor = _getStatusColor(p.status);
    
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 1400),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Center(
                    child: Text(
                      p.staffName.substring(0, 1).toUpperCase(),
                      style: GoogleFonts.roboto(
                        fontSize: 24,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.staffName,
                        style: GoogleFonts.roboto(
                          fontSize: 20,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey.shade900,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${p.designation} • ${p.department}',
                        style: GoogleFonts.roboto(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(2),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    p.status.toUpperCase(),
                    style: GoogleFonts.roboto(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: statusColor,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Divider(height: 1, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildHeaderInfo('Payroll ID', p.payrollCode),
                const SizedBox(width: 40),
                _buildHeaderInfo('Pay Period', p.payPeriodDisplay),
                const SizedBox(width: 40),
                _buildHeaderInfo('Staff Code', p.staffCode),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildHeaderInfo(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.roboto(
            fontSize: 11,
            color: Colors.grey.shade600,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.roboto(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade900,
          ),
        ),
      ],
    );
  }

  Widget _buildFinancialSummary(Payroll p) {
    return Row(
      children: [
        Expanded(
          child: _buildFinancialCard(
            label: 'GROSS SALARY',
            value: _formatCurrency(p.grossSalary),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildFinancialCard(
            label: 'DEDUCTIONS',
            value: _formatCurrency(p.totalDeductions),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildFinancialCard(
            label: 'NET SALARY',
            value: _formatCurrency(p.netSalary),
            isHighlight: true,
          ),
        ),
      ],
    );
  }

  Widget _buildFinancialCard({
    required String label,
    required String value,
    bool isHighlight = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isHighlight ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(2),
        border: Border.all(
          color: isHighlight ? Colors.grey.shade900 : Colors.grey.shade300,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.roboto(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: isHighlight ? Colors.grey.shade400 : Colors.grey.shade600,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.roboto(
              fontSize: 24,
              fontWeight: FontWeight.w500,
              color: isHighlight ? Colors.white : Colors.grey.shade900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsSection(Payroll p) {
    return _buildEnterpriseSection(
      title: 'Earnings',
      children: [
        _buildDataRow('Basic Salary', _formatCurrency(p.basicSalary)),
        _buildDataRow('Overtime Pay', _formatCurrency(p.overtimePay)),
        _buildDataRow('Bonus', _formatCurrency(p.bonus)),
        _buildDataRow('Incentives', _formatCurrency(p.incentives)),
        _buildDataRow('Arrears', _formatCurrency(p.arrears)),
        Divider(height: 1, color: Colors.grey.shade300),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: _buildDataRow(
            'Total Earnings',
            _formatCurrency(p.grossSalary),
            isBold: true,
          ),
        ),
      ],
    );
  }

  Widget _buildDeductionsSection(Payroll p) {
    return _buildEnterpriseSection(
      title: 'Deductions',
      children: [
        _buildDataRow('Provident Fund', _formatCurrency(p.statutory.employeePF)),
        _buildDataRow('ESI', _formatCurrency(p.statutory.employeeESI)),
        _buildDataRow('Professional Tax', _formatCurrency(p.statutory.professionalTax)),
        _buildDataRow('TDS', _formatCurrency(p.statutory.tdsDeducted)),
        Divider(height: 1, color: Colors.grey.shade300),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: _buildDataRow(
            'Total Deductions',
            _formatCurrency(p.totalDeductions),
            isBold: true,
          ),
        ),
      ],
    );
  }

  Widget _buildAttendanceSection(Payroll p) {
    return _buildEnterpriseSection(
      title: 'Attendance',
      children: [
        _buildDataRow('Present Days', p.attendance.presentDays.toString()),
        _buildDataRow('Absent Days', p.attendance.absentDays.toString()),
        _buildDataRow('LOP Days', p.lossOfPayDays.toString()),
        Divider(height: 1, color: Colors.grey.shade300),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: _buildDataRow(
            'Total Days',
            p.attendance.totalDays.toString(),
            isBold: true,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentInfoSection(Payroll p) {
    return _buildEnterpriseSection(
      title: 'Payment Information',
      children: [
        _buildDataRow('Bank Name', p.bankName),
        _buildDataRow('Account Number', p.accountNumber),
        _buildDataRow('IFSC Code', p.ifscCode),
        _buildDataRow('Payment Mode', p.paymentMode.toUpperCase()),
      ],
    );
  }

  Widget _buildEnterpriseSection({
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(2),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              title,
              style: GoogleFonts.roboto(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade900,
                letterSpacing: 0.2,
              ),
            ),
          ),
          Divider(height: 1, color: Colors.grey.shade300),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.roboto(
              fontSize: 13,
              color: Colors.grey.shade700,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.roboto(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w500 : FontWeight.w400,
              color: Colors.grey.shade900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnterpriseActions(Payroll p) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey.shade300, width: 1),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Close',
              style: GoogleFonts.roboto(
                fontSize: 13,
                color: Colors.grey.shade700,
              ),
            ),
          ),
          if (p.status.toLowerCase() == 'pending') ...[
            const SizedBox(width: 12),
            OutlinedButton(
              onPressed: _rejectPayroll,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                side: BorderSide(color: Colors.grey.shade400),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              child: Text(
                'Reject',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  color: Colors.grey.shade800,
                ),
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: _approvePayroll,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                backgroundColor: Colors.grey.shade900,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              child: Text(
                'Approve',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }


}
