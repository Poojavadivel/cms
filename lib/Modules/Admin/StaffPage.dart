import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Adjust these imports to your project structure
import '../../Models/staff.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import 'widget/generic_data_table.dart';
// ---------------------------------------------------------------------

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

  // ---------------- Helper: dedupe ----------------
  List<Staff> _dedupeById(List<Staff> input) {
    final seen = <String>{};
    final out = <Staff>[];
    for (final s in input) {
      final key = (s.id.isNotEmpty) ? s.id : '\$tmp-${s.hashCode}';
      if (!seen.contains(key)) {
        seen.add(key);
        out.add(s);
      }
    }
    return out;
  }

  // ---------------- Fetch from API ----------------
  Future<void> _fetchStaff({bool forceRefresh = false}) async {
    setState(() => _isLoading = true);
    try {
      final fetched = await AuthService.instance.fetchStaffs(forceRefresh: forceRefresh);
      // dedupe server list to avoid duplicates
      final unique = _dedupeById(fetched);
      setState(() {
        _allStaff = unique;
        if (_currentPage < 0) _currentPage = 0;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to fetch staff: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // ---------------- Search / Pagination ----------------
  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() {
    if (_currentPage > 0) setState(() => _currentPage--);
  }

  // ---------------- Utilities ----------------
  List<Staff> _getFilteredStaff() {
    return _allStaff.where((s) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = q.isEmpty ||
          s.name.toLowerCase().contains(q) ||
          s.id.toLowerCase().contains(q) ||
          s.department.toLowerCase().contains(q) ||
          s.designation.toLowerCase().contains(q) ||
          s.contact.toLowerCase().contains(q);
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

  Widget _buildDepartmentFilter() {
    final departments = {'All', ..._allStaff.map((s) => s.department).toSet()};
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

  // ---------------- Staff form dialog (popup) ----------------
  Future<void> _onAddPressed() async {
    try {
      final created = await showStaffFormPopup(context);
      if (created == null) return;

      // optimistic insert OR replace existing (prevent duplicates)
      setState(() {
        final idx = _allStaff.indexWhere((s) => s.id == created.id);
        if (idx == -1) {
          _allStaff.insert(0, created);
        } else {
          _allStaff[idx] = created;
        }
      });

      // If temp id, try to resync so server id replaces temp
      if (created.id.startsWith('temp-')) {
        try {
          await _fetchStaff(forceRefresh: true);
        } catch (_) {}
      }

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Staff created')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Create failed: $e')));
      await _fetchStaff(forceRefresh: true);
    }
  }

  Future<void> _onEdit(int index, List<Staff> list) async {
    final original = list[index];

    try {
      final updated = await showStaffFormPopup(context, initial: original);
      if (updated == null) return;

      setState(() {
        final idx = _allStaff.indexWhere((s) => s.id == original.id);
        if (idx != -1) {
          _allStaff[idx] = updated;
        } else {
          final insertAt = index.clamp(0, _allStaff.length);
          _allStaff.insert(insertAt, updated);
        }
      });

      // authoritative fetch when possible
      if (!updated.id.startsWith('temp-')) {
        try {
          final fresh = await AuthService.instance.fetchStaffById(updated.id);
          setState(() {
            final i = _allStaff.indexWhere((s) => s.id == updated.id);
            if (i != -1) _allStaff[i] = fresh;
          });
        } catch (_) {}
      }

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Staff updated')));
    } catch (e) {
      // revert
      setState(() {
        final idx = _allStaff.indexWhere((s) => s.id == original.id);
        if (idx != -1) _allStaff[idx] = original;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Update failed: $e')));
      await _fetchStaff(forceRefresh: true);
    }
  }

  // ---------------- Delete (optimistic) ----------------
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

    final removedIndex = _allStaff.indexWhere((s) => s.id == staffMember.id);
    Staff? removed;
    if (removedIndex != -1) {
      removed = _allStaff.removeAt(removedIndex);
      setState(() {});
    }

    setState(() => _isLoading = true);
    try {
      final ok = await AuthService.instance.deleteStaff(staffMember.id);
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted ${staffMember.name}')));
        final filteredItems = _getFilteredStaff();
        if (_currentPage * 10 >= filteredItems.length && _currentPage > 0) {
          setState(() => _currentPage = 0);
        }
      } else {
        if (removed != null) setState(() => _allStaff.insert(removedIndex, removed!));
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delete failed')));
      }
    } catch (e) {
      if (removed != null) setState(() => _allStaff.insert(removedIndex, removed!));
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // ---------------- View (simple) ----------------
  void _onView(int index, List<Staff> list) {
    final staffMember = list[index];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Viewing details for ${staffMember.name}")),
    );
  }

  @override
  Widget build(BuildContext context) {
    // ensure we use a deduped filtered list for pagination and rendering
    final filtered = _dedupeById(_getFilteredStaff());

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedStaff = startIndex >= filtered.length ? <Staff>[] : filtered.sublist(startIndex, endIndex);

    final headers = const ['STAFF ID', 'STAFF NAME', 'DESIGNATION', 'DEPARTMENT', 'CONTACT', 'STATUS'];

    final cellStyle = GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary ?? Colors.black);

    Widget _cell(String txt, {double width = 140}) {
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

    final rows = paginatedStaff.map((s) {
      final id = s.id;
      final name = s.name.isNotEmpty ? s.name : '-';
      final designation = s.designation.isNotEmpty ? s.designation : '-';
      final department = s.department.isNotEmpty ? s.department : '-';
      final contact = s.contact.isNotEmpty ? s.contact : '-';
      final status = s.status.isNotEmpty ? s.status : '-';

      return [
        _cell(id, width: 150),
        _cell(name, width: 200),
        _cell(designation, width: 160),
        _cell(department, width: 140),
        _cell(contact, width: 150),
        SizedBox(width: 120, child: _statusChip(status)),
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
            onView: (i) => _onView(i, paginatedStaff),
            onEdit: (i) => _onEdit(i, paginatedStaff),
            onDelete: (i) => _onDelete(i, paginatedStaff),
          ),
        ),
      ),
    );
  }
}

// ================= StaffFormPopup + helper =================

/// Shows centered 3/4-width popup that returns created/updated Staff or null

// assume Staff and AuthService are defined elsewhere in your project


// assume Staff and AuthService are defined elsewhere in your project

Future<Staff?> showStaffFormPopup(BuildContext context, {Staff? initial}) {
  final width = MediaQuery.of(context).size.width;
  // On narrow screens open full-screen, on wide screens show centered dialog-like page.
  if (width < 900) {
    return Navigator.of(context).push<Staff>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => StaffFormPage(initial: initial),
      ),
    );
  } else {
    // For wide screens: show single centered dialog card (no extra Material wrapper).
    return showDialog<Staff>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        final maxW = MediaQuery.of(ctx).size.width * 0.95;
        final maxH = MediaQuery.of(ctx).size.height * 0.9;
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxW, maxHeight: maxH),
            // <-- IMPORTANT: return StaffFormPage directly (it contains the single container)
            child: StaffFormPage(initial: initial),
          ),
        );
      },
    );
  }
}

// Full-page Staff form (single card container — NO AppBar, NO avatar/upload)
class StaffFormPage extends StatefulWidget {
  final Staff? initial;
  const StaffFormPage({super.key, this.initial});

  @override
  State<StaffFormPage> createState() => _StaffFormPageState();
}

class _StaffFormPageState extends State<StaffFormPage> {
  final _formKey = GlobalKey<FormState>();

  // controllers
  late final TextEditingController _nameCtrl;
  late final TextEditingController _designationCtrl;
  late final TextEditingController _departmentCtrl;
  late final TextEditingController _contactCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _codeCtrl; // staff id / code
  late final TextEditingController _notesCtrl;
  late final TextEditingController _qualCtrl;
  late final TextEditingController _locationCtrl;
  late final TextEditingController _experienceCtrl;

  bool _isSaving = false;

  // UI state
  bool _useAutoId = true;
  String _status = 'Available';
  String _shift = 'Morning';
  DateTime? _joinedAt;
  DateTime? _dob;
  final List<String> _selectedRoles = [];

  // role options
  final List<String> _roleOptions = [
    'Doctor',
    'Nurse',
    'Lab Technician',
    'Pharmacist',
    'Admin Staff',
    'Radiologist',
    'Therapist',
    'Reception',
    'Manager',
  ];

  final List<String> _statusOptions = ['Available', 'Off Duty', 'On Leave', 'On Call'];
  final List<String> _shiftOptions = ['Morning', 'Evening', 'Night', 'Flexible'];

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;

    _nameCtrl = TextEditingController(text: initial?.name ?? '');
    _designationCtrl = TextEditingController(text: initial?.designation ?? '');
    _departmentCtrl = TextEditingController(text: initial?.department ?? '');
    _contactCtrl = TextEditingController(text: initial?.contact ?? '');
    _emailCtrl = TextEditingController(text: initial?.email ?? '');
    _codeCtrl = TextEditingController(text: initial?.patientFacingId ?? _genAutoId(initial?.designation));
    _notesCtrl = TextEditingController(text: (initial?.notes.values.join('\n')) ?? '');
    _qualCtrl = TextEditingController(text: (initial?.qualifications ?? []).join(', '));
    _locationCtrl = TextEditingController(text: initial?.location ?? '');
    _experienceCtrl = TextEditingController(text: (initial?.experienceYears ?? 0) > 0 ? (initial!.experienceYears).toString() : '');

    _status = initial?.status ?? 'Available';
    _shift = initial?.shift ?? 'Morning';
    _joinedAt = initial?.joinedAt;
    _dob = initial?.lastActiveAt;
    if (initial?.roles != null) _selectedRoles.addAll(initial!.roles);

    if ((initial?.patientFacingId ?? '').isNotEmpty) _useAutoId = false;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _designationCtrl.dispose();
    _departmentCtrl.dispose();
    _contactCtrl.dispose();
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    _notesCtrl.dispose();
    _qualCtrl.dispose();
    _locationCtrl.dispose();
    _experienceCtrl.dispose();
    super.dispose();
  }

  String _genAutoId(String? designation) {
    final prefix = (designation ?? 'STF').replaceAll(RegExp(r'[^A-Za-z]'), '');
    final pr = prefix.length >= 3 ? prefix.substring(0, 3) : prefix.padRight(3, 'X');
    final rnd = Random().nextInt(900) + 100;
    return '${pr.toUpperCase()}$rnd';
  }

  TextStyle get _labelStyle => GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey[800]!);
  TextStyle get _sectionTitle => GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700);

  InputDecoration _dec({required String hintText, Widget? prefixIcon}) {
    return InputDecoration(
      hintText: hintText,
      prefixIcon: prefixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      filled: true,
      fillColor: Colors.grey.shade50,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey.shade200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.3),
      ),
    );
  }

  Widget _field({
    required String label,
    required TextEditingController controller,
    String? hint,
    Widget? prefix,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    int maxLines = 1,
    bool readOnly = false,
  }) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: _labelStyle),
      const SizedBox(height: 6),
      TextFormField(
        controller: controller,
        decoration: _dec(hintText: hint ?? '', prefixIcon: prefix),
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        enabled: !_isSaving && !readOnly,
      ),
    ]);
  }

  Future<void> _pickJoinedAt() async {
    final now = DateTime.now();
    final res = await showDatePicker(
      context: context,
      initialDate: _joinedAt ?? now,
      firstDate: DateTime(now.year - 50),
      lastDate: DateTime(now.year + 5),
    );
    if (res != null) setState(() => _joinedAt = res);
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final res = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 25),
      firstDate: DateTime(now.year - 100),
      lastDate: DateTime(now.year),
    );
    if (res != null) setState(() => _dob = res);
  }

  String _fmtDate(DateTime? d) {
    if (d == null) return '';
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  // Roles selector UI
  Widget _rolesSelector() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Roles', style: _labelStyle),
      const SizedBox(height: 6),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _selectedRoles
            .map((r) => Chip(
          label: Text(r, style: GoogleFonts.inter(fontSize: 13)),
          deleteIcon: const Icon(Icons.close, size: 18),
          onDeleted: () => setState(() => _selectedRoles.remove(r)),
        ))
            .toList(),
      ),
    ]);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    final isEdit = widget.initial != null;
    final tmpId = widget.initial?.id ?? 'temp-${DateTime.now().millisecondsSinceEpoch}';
    final idVal = _codeCtrl.text.trim();

    final notesMap = <String, String>{};
    if (_notesCtrl.text.trim().isNotEmpty) notesMap['notes'] = _notesCtrl.text.trim();

    final experienceYears = int.tryParse(_experienceCtrl.text.trim()) ?? (widget.initial?.experienceYears ?? 0);

    final staffDraft = Staff(
      id: tmpId,
      name: _nameCtrl.text.trim(),
      designation: _designationCtrl.text.trim(),
      department: _departmentCtrl.text.trim(),
      patientFacingId: idVal,
      contact: _contactCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      avatarUrl: widget.initial?.avatarUrl ?? '',
      gender: widget.initial?.gender ?? '',
      status: _status,
      shift: _shift,
      roles: List.from(_selectedRoles),
      qualifications: _qualCtrl.text.trim().isEmpty ? widget.initial?.qualifications ?? [] : _qualCtrl.text.split(',').map((s) => s.trim()).toList(),
      experienceYears: experienceYears,
      joinedAt: _joinedAt,
      lastActiveAt: DateTime.now(),
      location: _locationCtrl.text.trim(),
      dob: _dob?.toIso8601String() ?? widget.initial?.dob ?? '',
      notes: notesMap,
      appointmentsCount: widget.initial?.appointmentsCount ?? 0,
      tags: widget.initial?.tags ?? const [],
      isSelected: widget.initial?.isSelected ?? false,
    );

    try {
      if (isEdit) {
        final ok = await AuthService.instance.updateStaff(staffDraft);
        if (ok) {
          try {
            final fresh = await AuthService.instance.fetchStaffById(staffDraft.id);
            if (mounted) Navigator.of(context).pop(fresh);
            return;
          } catch (_) {
            if (mounted) Navigator.of(context).pop(staffDraft);
            return;
          }
        } else {
          if (mounted) Navigator.of(context).pop(staffDraft);
          return;
        }
      } else {
        final created = await AuthService.instance.createStaff(staffDraft);
        if (created != null) {
          if (mounted) Navigator.of(context).pop(created);
          return;
        } else {
          if (mounted) Navigator.of(context).pop(staffDraft);
          return;
        }
      }
    } catch (e) {
      debugPrint('StaffFormPage save error: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: ${e.toString()}')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.initial != null;
    final width = MediaQuery.of(context).size.width;
    final contentWidth =  width * 0.95;

    // --- SINGLE VISIBLE CONTAINER CARD ---
    return ScrollConfiguration(behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentWidth),
          child: Container(
            // <-- This is the single container you will see (borderRadius, shadow, etc.)
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))],
            ),
            child: Form(
              key: _formKey,
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                // header (title + subtitle) — no AppBar, no avatar upload
                Text(isEdit ? 'Edit Staff' : 'Add New Staff', style: GoogleFonts.lexend(fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text('Profile, contact and staff details', style: GoogleFonts.inter(color: Colors.grey[600])),
                const SizedBox(height: 18),

                // responsive grid
                LayoutBuilder(builder: (ctx, cons) {
                  final isWide = cons.maxWidth >= 760;
                  final colW = isWide ? (cons.maxWidth - 20) / 2 : cons.maxWidth;
                  return Wrap(spacing: 20, runSpacing: 14, children: [
                    SizedBox(
                        width: colW,
                        child: _field(
                            label: 'Full name',
                            controller: _nameCtrl,
                            hint: 'e.g. Dr. John Doe',
                            prefix: const Icon(Icons.person_outline),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Name required' : null)),
                    SizedBox(width: colW, child: _field(label: 'Designation', controller: _designationCtrl, hint: 'e.g. Cardiologist', prefix: const Icon(Icons.work_outline))),
                    SizedBox(width: colW, child: _field(label: 'Department', controller: _departmentCtrl, hint: 'e.g. Cardiology', prefix: const Icon(Icons.local_hospital_outlined))),

                    // Staff ID (auto/manual)
                    SizedBox(
                      width: colW,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Staff ID', style: _labelStyle),
                        const SizedBox(height: 6),
                        Row(children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              decoration: _dec(hintText: 'ID mode'),
                              value: _useAutoId ? 'Auto' : 'Manual',
                              items: const [
                                DropdownMenuItem(value: 'Auto', child: Text('Auto-generate')),
                                DropdownMenuItem(value: 'Manual', child: Text('Manual entry')),
                              ],
                              onChanged: (v) {
                                if (v == null) return;
                                setState(() {
                                  _useAutoId = v == 'Auto';
                                  if (_useAutoId) _codeCtrl.text = _genAutoId(_designationCtrl.text);
                                });
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton.icon(
                            onPressed: _useAutoId ? () => setState(() => _codeCtrl.text = _genAutoId(_designationCtrl.text)) : null,
                            icon: const Icon(Icons.refresh, size: 18),
                            label: Text('New', style: GoogleFonts.inter()),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.grey.shade100, foregroundColor: Colors.black, elevation: 0),
                          ),
                        ]),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _codeCtrl,
                          decoration: _dec(hintText: 'e.g. DOC102'),
                          readOnly: _useAutoId,
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'ID required' : null,
                        ),
                      ]),
                    ),

                    SizedBox(width: colW, child: _field(label: 'Contact', controller: _contactCtrl, hint: '+91 9XXXXXXXXX', prefix: const Icon(Icons.phone_outlined), keyboardType: TextInputType.phone)),
                    SizedBox(width: colW, child: _field(label: 'Email', controller: _emailCtrl, hint: 'you@clinic.com', prefix: const Icon(Icons.email_outlined), keyboardType: TextInputType.emailAddress)),

                    // Status dropdown
                    SizedBox(
                      width: colW,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Status', style: _labelStyle),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          decoration: _dec(hintText: 'Select status'),
                          value: _status,
                          items: _statusOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                          onChanged: (v) => setState(() => _status = v ?? 'Available'),
                        ),
                      ]),
                    ),

                    // Shift dropdown
                    SizedBox(
                      width: colW,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Shift', style: _labelStyle),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          decoration: _dec(hintText: 'Select shift'),
                          value: _shift,
                          items: _shiftOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                          onChanged: (v) => setState(() => _shift = v ?? 'Morning'),
                        ),
                      ]),
                    ),

                    // Joined at & DOB
                    SizedBox(
                      width: colW,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Joining date', style: _labelStyle),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: _pickJoinedAt,
                          child: IgnorePointer(
                            child: TextFormField(
                              decoration: _dec(hintText: 'Select joining date'),
                              controller: TextEditingController(text: _fmtDate(_joinedAt)),
                              validator: (_) => null,
                              enabled: !_isSaving,
                            ),
                          ),
                        )
                      ]),
                    ),

                    SizedBox(
                      width: colW,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Date of Birth', style: _labelStyle),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: _pickDob,
                          child: IgnorePointer(
                            child: TextFormField(
                              decoration: _dec(hintText: 'Select DOB'),
                              controller: TextEditingController(text: _fmtDate(_dob)),
                              enabled: !_isSaving,
                            ),
                          ),
                        )
                      ]),
                    ),

                    // Experience & location
                    SizedBox(width: colW, child: _field(label: 'Experience (years)', controller: _experienceCtrl, hint: 'e.g. 5', keyboardType: TextInputType.number)),
                    SizedBox(width: colW, child: _field(label: 'Location / Branch', controller: _locationCtrl, hint: 'e.g. Main Clinic')),

                    // Roles selector (full width cell)
                    SizedBox(width: cons.maxWidth, child: _rolesSelector()),

                    // Qualifications and notes (full width)
                    SizedBox(
                      width: cons.maxWidth,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Qualifications (comma separated)', style: _labelStyle),
                        const SizedBox(height: 6),
                        TextFormField(controller: _qualCtrl, decoration: _dec(hintText: 'MBBS, MD Cardiology'), maxLines: 2),
                        const SizedBox(height: 12),
                        Text('Notes', style: _sectionTitle),
                        const SizedBox(height: 8),
                        TextFormField(controller: _notesCtrl, decoration: _dec(hintText: 'Short notes or remarks'), maxLines: 4),
                      ]),
                    ),
                  ]);
                }),

                const SizedBox(height: 18),

                // actions
                Row(children: [
                  OutlinedButton.icon(
                    onPressed: _isSaving ? null : () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.close),
                    label: Text('Cancel', style: GoogleFonts.inter()),
                  ),
                  const SizedBox(width: 12),
                  const Spacer(),
                  ElevatedButton.icon(
                    onPressed: _isSaving ? null : _submit,
                    icon: const Icon(Icons.save, color: Colors.white),
                    label: Text(
                      _isSaving ? 'Saving...' : 'Save staff',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        color: Colors.white,   // 🔹 Force text color to white
                      ),
                    ),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14)),
                  ),
                ]),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
