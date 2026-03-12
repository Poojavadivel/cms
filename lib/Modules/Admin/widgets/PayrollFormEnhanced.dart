// lib/Modules/Admin/Widgets/PayrollFormEnhanced.dart
// ENTERPRISE-GRADE PAYROLL FORM - SPACE OPTIMIZED
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:iconsax/iconsax.dart';

import '../../../Models/Payroll.dart';
import '../../../Models/staff.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

class PayrollFormEnhanced extends StatefulWidget {
  final Payroll? initial;

  const PayrollFormEnhanced({super.key, this.initial});

  @override
  State<PayrollFormEnhanced> createState() => _PayrollFormEnhancedState();
}

class _PayrollFormEnhancedState extends State<PayrollFormEnhanced> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isEdit = false;
  late TabController _tabController;

  // Staff selection
  List<Staff> _allStaff = [];
  Staff? _selectedStaff;

  // Controllers
  final _basicSalaryCtrl = TextEditingController();
  final _overtimePayCtrl = TextEditingController();
  final _bonusCtrl = TextEditingController();
  final _incentivesCtrl = TextEditingController();
  final _arrearsCtrl = TextEditingController();
  final _pfCtrl = TextEditingController();
  final _esiCtrl = TextEditingController();
  final _ptCtrl = TextEditingController();
  final _tdsCtrl = TextEditingController();
  final _presentDaysCtrl = TextEditingController();
  final _absentDaysCtrl = TextEditingController();
  final _lopDaysCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();
  final _accountNumberCtrl = TextEditingController();
  final _ifscCodeCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  // Computed values
  double _grossSalary = 0;
  double _totalDeductions = 0;
  double _netSalary = 0;

  // Pay Period & Status
  int _month = DateTime.now().month;
  int _year = DateTime.now().year;
  String _status = 'draft';
  String _paymentMode = 'bank_transfer';

  // Additional components (for future use)
  // ignore: unused_field
  List<SalaryComponent> _earnings = [];
  // ignore: unused_field
  List<SalaryComponent> _deductions = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _isEdit = widget.initial != null;
    _fetchStaff();
    if (_isEdit) _populateFields();
    
    // Add listeners for auto-calculation
    _basicSalaryCtrl.addListener(_calculateSalary);
    _overtimePayCtrl.addListener(_calculateSalary);
    _bonusCtrl.addListener(_calculateSalary);
    _incentivesCtrl.addListener(_calculateSalary);
    _arrearsCtrl.addListener(_calculateSalary);
    _pfCtrl.addListener(_calculateSalary);
    _esiCtrl.addListener(_calculateSalary);
    _ptCtrl.addListener(_calculateSalary);
    _tdsCtrl.addListener(_calculateSalary);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _basicSalaryCtrl.dispose();
    _overtimePayCtrl.dispose();
    _bonusCtrl.dispose();
    _incentivesCtrl.dispose();
    _arrearsCtrl.dispose();
    _pfCtrl.dispose();
    _esiCtrl.dispose();
    _ptCtrl.dispose();
    _tdsCtrl.dispose();
    _presentDaysCtrl.dispose();
    _absentDaysCtrl.dispose();
    _lopDaysCtrl.dispose();
    _bankNameCtrl.dispose();
    _accountNumberCtrl.dispose();
    _ifscCodeCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _calculateSalary() {
    setState(() {
      final basic = double.tryParse(_basicSalaryCtrl.text) ?? 0;
      final overtime = double.tryParse(_overtimePayCtrl.text) ?? 0;
      final bonus = double.tryParse(_bonusCtrl.text) ?? 0;
      final incentives = double.tryParse(_incentivesCtrl.text) ?? 0;
      final arrears = double.tryParse(_arrearsCtrl.text) ?? 0;
      
      _grossSalary = basic + overtime + bonus + incentives + arrears;
      
      final pf = double.tryParse(_pfCtrl.text) ?? 0;
      final esi = double.tryParse(_esiCtrl.text) ?? 0;
      final pt = double.tryParse(_ptCtrl.text) ?? 0;
      final tds = double.tryParse(_tdsCtrl.text) ?? 0;
      
      _totalDeductions = pf + esi + pt + tds;
      _netSalary = _grossSalary - _totalDeductions;
    });
  }

  Future<void> _fetchStaff() async {
    try {
      final staffList = await AuthService.instance.fetchStaffs();
      if (mounted) {
        setState(() => _allStaff = staffList);
        if (_isEdit && widget.initial != null) {
          _selectedStaff = _allStaff.firstWhere(
            (s) => s.id == widget.initial!.staffId,
            orElse: () => _allStaff.isNotEmpty ? _allStaff.first : Staff(id: '', name: '', designation: '', department: ''),
          );
        }
      }
    } catch (e) {
      // Silent fail
    }
  }

  void _populateFields() {
    final p = widget.initial!;
    _basicSalaryCtrl.text = p.basicSalary.toString();
    _overtimePayCtrl.text = p.overtimePay.toString();
    _bonusCtrl.text = p.bonus.toString();
    _incentivesCtrl.text = p.incentives.toString();
    _arrearsCtrl.text = p.arrears.toString();
    _pfCtrl.text = p.statutory.employeePF.toString();
    _esiCtrl.text = p.statutory.employeeESI.toString();
    _ptCtrl.text = p.statutory.professionalTax.toString();
    _tdsCtrl.text = p.statutory.tdsDeducted.toString();
    _presentDaysCtrl.text = p.attendance.presentDays.toString();
    _absentDaysCtrl.text = p.attendance.absentDays.toString();
    _lopDaysCtrl.text = p.lossOfPayDays.toString();
    _bankNameCtrl.text = p.bankName;
    _accountNumberCtrl.text = p.accountNumber;
    _ifscCodeCtrl.text = p.ifscCode;
    _notesCtrl.text = p.notes;
    _month = p.payPeriodMonth;
    _year = p.payPeriodYear;
    _status = p.status;
    _paymentMode = p.paymentMode;
    _earnings = List.from(p.earnings);
    _deductions = List.from(p.deductions);
    _calculateSalary();
  }

  Future<void> _onSave() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedStaff == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a staff member')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Calculate pay period dates
      final payPeriodStart = DateTime(_year, _month, 1);
      final payPeriodEnd = DateTime(_year, _month + 1, 0); // Last day of the month
      
      final payload = {
        'staffId': _selectedStaff!.id,
        'payPeriodMonth': _month,
        'payPeriodYear': _year,
        'payPeriodStart': payPeriodStart.toIso8601String(),
        'payPeriodEnd': payPeriodEnd.toIso8601String(),
        'basicSalary': double.tryParse(_basicSalaryCtrl.text) ?? 0,
        'overtimePay': double.tryParse(_overtimePayCtrl.text) ?? 0,
        'bonus': double.tryParse(_bonusCtrl.text) ?? 0,
        'incentives': double.tryParse(_incentivesCtrl.text) ?? 0,
        'arrears': double.tryParse(_arrearsCtrl.text) ?? 0,
        'statutory': {
          'employeePF': double.tryParse(_pfCtrl.text) ?? 0,
          'employeeESI': double.tryParse(_esiCtrl.text) ?? 0,
          'professionalTax': double.tryParse(_ptCtrl.text) ?? 0,
          'tdsDeducted': double.tryParse(_tdsCtrl.text) ?? 0,
        },
        'attendance': {
          'presentDays': int.tryParse(_presentDaysCtrl.text) ?? 0,
          'absentDays': int.tryParse(_absentDaysCtrl.text) ?? 0,
        },
        'lossOfPayDays': int.tryParse(_lopDaysCtrl.text) ?? 0,
        'paymentMode': _paymentMode,
        'bankName': _bankNameCtrl.text,
        'accountNumber': _accountNumberCtrl.text,
        'ifscCode': _ifscCodeCtrl.text,
        'notes': _notesCtrl.text,
        'status': _status,
      };

      if (_isEdit) {
        await AuthService.instance.updatePayroll(widget.initial!.id, payload);
        if (mounted) Navigator.pop(context, true);
      } else {
        final created = await AuthService.instance.createPayroll(payload);
        if (mounted) Navigator.pop(context, created);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1200,
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.white, Color(0xFFFAFBFC)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 40,
            offset: const Offset(0, 20),
            spreadRadius: -10,
          ),
          BoxShadow(
            color: const Color(0xFF4F46E5).withOpacity(0.1),
            blurRadius: 60,
            offset: const Offset(0, 30),
            spreadRadius: -20,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildHeader(),
          _buildSummaryBar(),
          _buildTabBar(),
          Expanded(child: _buildTabContent()),
          _buildFooter(),
        ],
      ),
    );
  }

  // ==================== PREMIUM HEADER ====================
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.white, Color(0xFFFAFBFC)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        border: Border(
          bottom: BorderSide(color: const Color(0xFFE5E7EB), width: 1),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Iconsax.receipt_edit, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isEdit ? 'Edit Payroll' : 'Create New Payroll',
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _isEdit && widget.initial != null
                      ? 'Updating payroll for ${widget.initial!.staffName}'
                      : 'Fill in the details below to generate payroll',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Iconsax.close_circle, color: Color(0xFF64748B), size: 20),
              tooltip: 'Close',
            ),
          ),
        ],
      ),
    );
  }

  // ==================== PREMIUM SUMMARY BAR ====================
  Widget _buildSummaryBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFFF8FAFC), const Color(0xFFF1F5F9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border(
          bottom: BorderSide(color: const Color(0xFFE5E7EB), width: 1),
        ),
      ),
      child: Row(
        children: [
          _buildSummaryItem(
            'Gross Salary',
            _formatCurrency(_grossSalary),
            const Color(0xFF3B82F6),
            Iconsax.money_send,
          ),
          const SizedBox(width: 12),
          Container(
            width: 1,
            height: 40,
            color: const Color(0xFFE5E7EB),
          ),
          const SizedBox(width: 12),
          _buildSummaryItem(
            'Deductions',
            _formatCurrency(_totalDeductions),
            const Color(0xFFEF4444),
            Iconsax.minus_cirlce,
          ),
          const SizedBox(width: 12),
          Container(
            width: 1,
            height: 40,
            color: const Color(0xFFE5E7EB),
          ),
          const SizedBox(width: 12),
          _buildSummaryItem(
            'Net Salary',
            _formatCurrency(_netSalary),
            const Color(0xFF10B981),
            Iconsax.wallet_check,
            isLarge: true,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color, IconData icon, {bool isLarge = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: isLarge ? 22 : 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: isLarge ? 22 : 18,
                      color: color,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return NumberFormat.currency(symbol: '₹', decimalDigits: 0).format(amount);
  }

  // ==================== PREMIUM TAB BAR ====================
  Widget _buildTabBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: const Color(0xFFE5E7EB), width: 1),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: const Color(0xFF4F46E5),
        unselectedLabelColor: const Color(0xFF64748B),
        indicatorColor: const Color(0xFF4F46E5),
        indicatorWeight: 3,
        indicatorPadding: const EdgeInsets.symmetric(horizontal: -8),
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.2),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        tabs: const [
          Tab(icon: Icon(Iconsax.user, size: 18), text: 'Basic Info'),
          Tab(icon: Icon(Iconsax.money_4, size: 18), text: 'Salary & Earnings'),
          Tab(icon: Icon(Iconsax.status_up, size: 18), text: 'Deductions'),
          Tab(icon: Icon(Iconsax.card, size: 18), text: 'Payment'),
        ],
      ),
    );
  }

  // ==================== TAB CONTENT ====================
  Widget _buildTabContent() {
    return Form(
      key: _formKey,
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildBasicInfoTab(),
          _buildSalaryTab(),
          _buildDeductionsTab(),
          _buildPaymentTab(),
        ],
      ),
    );
  }

  // TAB 1: Basic Info
  Widget _buildBasicInfoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Staff Selection'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: _buildDropdown<Staff>(
                  label: 'Select Staff Member',
                  value: _selectedStaff,
                  items: _allStaff.map((s) => DropdownMenuItem<Staff>(
                    value: s,
                    child: Text('${s.name} (${s.patientFacingId}) - ${s.designation}', style: GoogleFonts.inter(fontSize: 13)),
                  )).toList(),
                  onChanged: _isEdit ? null : (val) => setState(() => _selectedStaff = val),
                  icon: Iconsax.user_octagon,
                ),
              ),
            ],
          ),
          if (_selectedStaff != null) ...[
            const SizedBox(height: 16),
            _buildInfoCard([
              _buildInfoRow('Department', _selectedStaff!.department),
              _buildInfoRow('Designation', _selectedStaff!.designation),
              _buildInfoRow('Employee Code', _selectedStaff!.patientFacingId),
            ]),
          ],
          const SizedBox(height: 24),
          _buildSectionTitle('Pay Period'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildDropdown(
                  label: 'Month',
                  value: _month,
                  items: List.generate(12, (i) => i + 1).map((m) => DropdownMenuItem(
                    value: m,
                    child: Text(DateFormat('MMMM').format(DateTime(2024, m)), style: GoogleFonts.inter(fontSize: 13)),
                  )).toList(),
                  onChanged: (val) => setState(() => _month = val!),
                  icon: Iconsax.calendar_1,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildDropdown(
                  label: 'Year',
                  value: _year,
                  items: List.generate(5, (i) => DateTime.now().year - i).map((y) => DropdownMenuItem(
                    value: y,
                    child: Text(y.toString(), style: GoogleFonts.inter(fontSize: 13)),
                  )).toList(),
                  onChanged: (val) => setState(() => _year = val!),
                  icon: Iconsax.calendar_2,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildDropdown(
                  label: 'Status',
                  value: _status,
                  items: ['draft', 'pending', 'approved', 'processed'].map((s) => DropdownMenuItem(
                    value: s,
                    child: Text(s.toUpperCase(), style: GoogleFonts.inter(fontSize: 13)),
                  )).toList(),
                  onChanged: (val) => setState(() => _status = val!),
                  icon: Iconsax.status,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildSectionTitle('Attendance Summary'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildCompactField('Present Days', _presentDaysCtrl, Iconsax.tick_circle)),
              const SizedBox(width: 12),
              Expanded(child: _buildCompactField('Absent Days', _absentDaysCtrl, Iconsax.close_circle)),
              const SizedBox(width: 12),
              Expanded(child: _buildCompactField('LOP Days', _lopDaysCtrl, Iconsax.minus_cirlce)),
            ],
          ),
        ],
      ),
    );
  }

  // TAB 2: Salary & Earnings
  Widget _buildSalaryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle('Basic Salary'),
                const SizedBox(height: 12),
                _buildCompactField('Basic Salary', _basicSalaryCtrl, Iconsax.money, prefix: '₹'),
                const SizedBox(height: 24),
                _buildSectionTitle('Additional Earnings'),
                const SizedBox(height: 12),
                _buildCompactField('Overtime Pay', _overtimePayCtrl, Iconsax.clock, prefix: '₹'),
                const SizedBox(height: 12),
                _buildCompactField('Bonus', _bonusCtrl, Iconsax.award, prefix: '₹'),
                const SizedBox(height: 12),
                _buildCompactField('Incentives', _incentivesCtrl, Iconsax.medal_star, prefix: '₹'),
                const SizedBox(height: 12),
                _buildCompactField('Arrears', _arrearsCtrl, Iconsax.wallet_add, prefix: '₹'),
              ],
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: _buildCalculationPanel(),
          ),
        ],
      ),
    );
  }

  Widget _buildCalculationPanel() {
    final basic = double.tryParse(_basicSalaryCtrl.text) ?? 0;
    final overtime = double.tryParse(_overtimePayCtrl.text) ?? 0;
    final bonus = double.tryParse(_bonusCtrl.text) ?? 0;
    final incentives = double.tryParse(_incentivesCtrl.text) ?? 0;
    final arrears = double.tryParse(_arrearsCtrl.text) ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.calculator, size: 20, color: Colors.blue.shade700),
              const SizedBox(width: 8),
              Text('Salary Breakdown', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.blue.shade900)),
            ],
          ),
          const SizedBox(height: 16),
          _buildCalcRow('Basic Salary', basic),
          const Divider(height: 20),
          _buildCalcRow('Overtime Pay', overtime),
          _buildCalcRow('Bonus', bonus),
          _buildCalcRow('Incentives', incentives),
          _buildCalcRow('Arrears', arrears),
          const Divider(height: 20),
          _buildCalcRow('Total Earnings', _grossSalary, isBold: true, color: Colors.blue.shade700),
        ],
      ),
    );
  }

  Widget _buildCalcRow(String label, double amount, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.w400,
              color: color ?? Colors.grey.shade700,
            ),
          ),
          Text(
            _formatCurrency(amount),
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              color: color ?? Colors.grey.shade900,
            ),
          ),
        ],
      ),
    );
  }

  // TAB 3: Deductions & Compliance
  Widget _buildDeductionsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle('Statutory Deductions'),
                const SizedBox(height: 12),
                _buildCompactField('Provident Fund (PF)', _pfCtrl, Iconsax.shield_tick, prefix: '₹'),
                const SizedBox(height: 12),
                _buildCompactField('ESI', _esiCtrl, Iconsax.health, prefix: '₹'),
                const SizedBox(height: 12),
                _buildCompactField('Professional Tax (PT)', _ptCtrl, Iconsax.receipt_text, prefix: '₹'),
                const SizedBox(height: 12),
                _buildCompactField('TDS', _tdsCtrl, Iconsax.document_text, prefix: '₹'),
              ],
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: _buildDeductionPanel(),
          ),
        ],
      ),
    );
  }

  Widget _buildDeductionPanel() {
    final pf = double.tryParse(_pfCtrl.text) ?? 0;
    final esi = double.tryParse(_esiCtrl.text) ?? 0;
    final pt = double.tryParse(_ptCtrl.text) ?? 0;
    final tds = double.tryParse(_tdsCtrl.text) ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.minus_cirlce, size: 20, color: Colors.red.shade700),
              const SizedBox(width: 8),
              Text('Deduction Summary', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.red.shade900)),
            ],
          ),
          const SizedBox(height: 16),
          _buildCalcRow('Provident Fund', pf),
          _buildCalcRow('ESI', esi),
          _buildCalcRow('Professional Tax', pt),
          _buildCalcRow('TDS', tds),
          const Divider(height: 20),
          _buildCalcRow('Total Deductions', _totalDeductions, isBold: true, color: Colors.red.shade700),
          const Divider(height: 20),
          _buildCalcRow('Net Salary', _netSalary, isBold: true, color: Colors.green.shade700),
        ],
      ),
    );
  }

  // TAB 4: Payment & Notes
  Widget _buildPaymentTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Payment Mode'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildDropdown(
                  label: 'Payment Method',
                  value: _paymentMode,
                  items: [
                    DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer', style: GoogleFonts.inter(fontSize: 13))),
                    DropdownMenuItem(value: 'cash', child: Text('Cash', style: GoogleFonts.inter(fontSize: 13))),
                    DropdownMenuItem(value: 'cheque', child: Text('Cheque', style: GoogleFonts.inter(fontSize: 13))),
                    DropdownMenuItem(value: 'upi', child: Text('UPI', style: GoogleFonts.inter(fontSize: 13))),
                  ],
                  onChanged: (val) => setState(() => _paymentMode = val!),
                  icon: Iconsax.wallet,
                ),
              ),
            ],
          ),
          if (_paymentMode == 'bank_transfer') ...[
            const SizedBox(height: 24),
            _buildSectionTitle('Bank Details'),
            const SizedBox(height: 12),
            _buildCompactField('Bank Name', _bankNameCtrl, Iconsax.bank, isText: true),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildCompactField('Account Number', _accountNumberCtrl, Iconsax.card, isText: true)),
                const SizedBox(width: 16),
                Expanded(child: _buildCompactField('IFSC Code', _ifscCodeCtrl, Iconsax.code, isText: true)),
              ],
            ),
          ],
          const SizedBox(height: 24),
          _buildSectionTitle('Additional Notes'),
          const SizedBox(height: 12),
          TextFormField(
            controller: _notesCtrl,
            maxLines: 4,
            style: GoogleFonts.inter(fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Enter any additional notes or remarks...',
              hintStyle: GoogleFonts.inter(fontSize: 13, color: Colors.grey.shade400),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              filled: true,
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
        ],
      ),
    );
  }

  // ==================== FOOTER ====================
  // ==================== PREMIUM FOOTER ====================
  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFAFBFC), Colors.white],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
        border: Border(
          top: BorderSide(color: const Color(0xFFE5E7EB), width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -4),
            spreadRadius: -4,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFD1FAE5), Color(0xFFA7F3D0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF10B981), width: 1),
              ),
              child: Row(
                children: [
                  const Icon(Iconsax.wallet_check, color: Color(0xFF047857), size: 24),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Final Net Salary',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF047857),
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatCurrency(_netSalary),
                        style: GoogleFonts.inter(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF065F46),
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              side: const BorderSide(color: Color(0xFFE5E7EB), width: 1.5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF64748B),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _onSave,
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Iconsax.tick_circle, size: 20),
              label: Text(
                _isEdit ? 'Update Payroll' : 'Create Payroll',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: Colors.white,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==================== REUSABLE WIDGETS ====================
  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey.shade800),
    );
  }

  Widget _buildCompactField(String label, TextEditingController controller, IconData icon, {String? prefix, bool isText = false}) {
    return TextFormField(
      controller: controller,
      keyboardType: isText ? TextInputType.text : TextInputType.number,
      inputFormatters: isText ? null : [FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}'))],
      style: GoogleFonts.inter(fontSize: 13),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.inter(fontSize: 12),
        prefixIcon: Icon(icon, size: 18, color: Colors.grey.shade600),
        prefixText: prefix,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        filled: true,
        fillColor: Colors.grey.shade50,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        isDense: true,
      ),
    );
  }

  Widget _buildDropdown<T>({
    required String label,
    T? value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?>? onChanged,
    required IconData icon,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      items: items,
      onChanged: onChanged,
      style: GoogleFonts.inter(fontSize: 13, color: Colors.black),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.inter(fontSize: 12),
        prefixIcon: Icon(icon, size: 18, color: Colors.grey.shade600),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        filled: true,
        fillColor: Colors.grey.shade50,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        isDense: true,
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey.shade600)),
          Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
