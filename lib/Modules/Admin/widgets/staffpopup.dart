// lib/modules/staff/staff_form_page.dart
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/staff.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

/// Enterprise-grade Staff Form Page
/// - Responsive two-column layout
/// - Floating close button top-right
/// - Avatar placeholder + upload hook
/// - Defensive initialization from `widget.initial`
/// - Inline validation and clear actions
class StaffFormPage extends StatefulWidget {
  final Staff? initial;
  const StaffFormPage({super.key, this.initial});

  @override
  State<StaffFormPage> createState() => _StaffFormPageState();
}

class _StaffFormPageState extends State<StaffFormPage> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  late final TextEditingController _nameCtrl;
  late final TextEditingController _designationCtrl;
  late final TextEditingController _departmentCtrl;
  late final TextEditingController _contactCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _codeCtrl;
  late final TextEditingController _notesCtrl;
  late final TextEditingController _qualCtrl;
  late final TextEditingController _locationCtrl;
  late final TextEditingController _experienceCtrl;

  bool _isSaving = false;
  bool _useAutoId = true;
  String _status = 'Available';
  String _shift = 'Morning';
  DateTime? _joinedAt;
  DateTime? _dob;
  List<String> _selectedRoles = [];
  String? _avatarPreviewUrl;

  // NEW: gender state and options
  String _gender = 'Male';
  final List<String> _genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

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

  late final AnimationController _animController;
  late final Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();
    final s = widget.initial;

    // Defensive initialization
    _nameCtrl = TextEditingController(text: s?.name ?? '');
    _designationCtrl = TextEditingController(text: s?.designation ?? '');
    _departmentCtrl = TextEditingController(text: s?.department ?? '');
    _contactCtrl = TextEditingController(text: s?.contact ?? '');
    _emailCtrl = TextEditingController(text: s?.email ?? '');
    _codeCtrl = TextEditingController(text: (s?.patientFacingId != null && s!.patientFacingId.isNotEmpty) ? s.patientFacingId : _genAutoId(s?.designation));
    _notesCtrl = TextEditingController(text: _notesToText(s?.notes));
    _qualCtrl = TextEditingController(text: (s?.qualifications ?? []).join(', '));
    _locationCtrl = TextEditingController(text: s?.location ?? '');
    _experienceCtrl = TextEditingController(text: (s?.experienceYears ?? 0) > 0 ? (s!.experienceYears).toString() : '');

    _status = s?.status ?? 'Available';
    _shift = s?.shift ?? 'Morning';
    _joinedAt = _parseDate(s?.joinedAt);
    _dob = _parseDate(s?.dob ?? s?.lastActiveAt);
    _selectedRoles = List.from(s?.roles ?? <String>[]);
    _avatarPreviewUrl = s?.avatarUrl;

    // NEW: initialize gender from initial if present
    _gender = (s?.gender != null && (s!.gender).isNotEmpty) ? s.gender : 'Male';

    _useAutoId = (s?.patientFacingId == null || s!.patientFacingId.isEmpty);

    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _fadeIn = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.forward();
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
    _animController.dispose();
    super.dispose();
  }

  String _genAutoId(String? designation) {
    final prefix = (designation ?? 'STF').replaceAll(RegExp(r'[^A-Za-z]'), '');
    final pr = (prefix.length >= 3) ? prefix.substring(0, 3) : prefix.padRight(3, 'X');
    final rnd = Random().nextInt(900) + 100; // int
    return '${pr.toUpperCase()}$rnd';
  }

  DateTime? _parseDate(dynamic val) {
    if (val == null) return null;
    if (val is DateTime) return val;
    if (val is String && val.trim().isNotEmpty) return DateTime.tryParse(val);
    return null;
  }

  String _notesToText(dynamic notes) {
    if (notes == null) return '';
    if (notes is String) return notes;
    if (notes is Map) {
      return notes.values.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).join('\n');
    }
    return notes.toString();
  }

  TextStyle get _labelStyle => GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey[800]!);

  InputDecoration _dec({required String hintText, Widget? prefixIcon}) {
    return InputDecoration(
      hintText: hintText,
      prefixIcon: prefixIcon,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 14.0),
      filled: true,
      fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10.0), borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10.0), borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.2)),
    );
  }

  Future<void> _pickDate(BuildContext ctx, DateTime? initial, void Function(DateTime) onPicked) async {
    final now = DateTime.now();
    final res = await showDatePicker(context: ctx, initialDate: initial ?? now, firstDate: DateTime(1900), lastDate: DateTime(now.year + 5));
    if (res != null) setState(() => onPicked(res));
  }

  String _fmtDate(DateTime? d) {
    if (d == null) return '';
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
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
        validator: validator,
        maxLines: maxLines,
        enabled: !_isSaving && !readOnly,
      )
    ]);
  }

  Widget _rolesSelector() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Text('Roles', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
        const SizedBox(width: 8),
        const Tooltip(message: 'Assign roles', child: Icon(Icons.info_outline, size: 18)),
      ]),
      const SizedBox(height: 8),
      Wrap(spacing: 8, runSpacing: 8, children: _selectedRoles.map((r) {
        return Chip(label: Text(r), onDeleted: () => setState(() => _selectedRoles.remove(r)));
      }).toList()),
      const SizedBox(height: 8),
      Wrap(spacing: 8, children: _roleOptions.map((r) {
        final sel = _selectedRoles.contains(r);
        return ChoiceChip(label: Text(r), selected: sel, onSelected: (v) {
          setState(() {
            if (v) {
              if (!_selectedRoles.contains(r)) _selectedRoles.add(r);
            } else {
              _selectedRoles.remove(r);
            }
          });
        });
      }).toList()),
    ]);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fix validation errors before saving')));
      return;
    }
    setState(() => _isSaving = true);

    final isEdit = widget.initial != null;
    final tmpId = widget.initial?.id ?? 'temp-${DateTime.now().millisecondsSinceEpoch}';
    final idVal = _codeCtrl.text.trim();

    final notes = <String, String>{};
    final noteText = _notesCtrl.text.trim();
    if (noteText.isNotEmpty) notes['notes'] = noteText;

    final experienceYears = int.tryParse(_experienceCtrl.text.trim()) ?? (widget.initial?.experienceYears ?? 0);

    final staffDraft = Staff(
      id: tmpId,
      name: _nameCtrl.text.trim(),
      designation: _designationCtrl.text.trim(),
      department: _departmentCtrl.text.trim(),
      patientFacingId: idVal,
      contact: _contactCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      avatarUrl: _avatarPreviewUrl ?? widget.initial?.avatarUrl ?? '',
      // UPDATED: use selected gender
      gender: _gender,
      status: _status,
      shift: _shift,
      roles: List.from(_selectedRoles),
      qualifications: _qualCtrl.text.trim().isEmpty ? widget.initial?.qualifications ?? [] : _qualCtrl.text.split(',').map((e) => e.trim()).toList(),
      experienceYears: experienceYears,
      joinedAt: _joinedAt,
      lastActiveAt: DateTime.now(),
      location: _locationCtrl.text.trim(),
      dob: _dob?.toIso8601String() ?? widget.initial?.dob ?? '',
      notes: notes,
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
      debugPrint('Fail saving staff: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  // Avatar block
  Widget _avatarBlock() {
    final initials = _initials(_nameCtrl.text);
    return Column(
      children: [
        Stack(alignment: Alignment.bottomRight, children: [
          CircleAvatar(
            radius: 44.0,
            backgroundColor: AppColors.primary600.withOpacity(0.08),
            backgroundImage: (_avatarPreviewUrl != null && _avatarPreviewUrl!.isNotEmpty) ? NetworkImage(_avatarPreviewUrl!) : null,
            child: (_avatarPreviewUrl == null || _avatarPreviewUrl!.isEmpty) ? Text(initials, style: GoogleFonts.inter(fontSize: 22.0, fontWeight: FontWeight.w700, color: AppColors.primary600)) : null,
          ),
          Material(
            color: Colors.white,
            elevation: 2,
            shape: const CircleBorder(),
            child: InkWell(
              borderRadius: BorderRadius.circular(20.0),
              onTap: _toggleAvatarPlaceholder,
              child: Container(padding: const EdgeInsets.all(8.0), child: const Icon(Icons.camera_alt_outlined, size: 18.0)),
            ),
          ),
        ]),
        const SizedBox(height: 8.0),
        SizedBox(
          width: 150.0,
          child: Text('Profile picture (optional)\nPNG/JPG • max 5MB', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 12.0, color: Colors.grey[600])),
        )
      ],
    );
  }

  void _toggleAvatarPlaceholder() {
    setState(() {
      if (_avatarPreviewUrl == null || _avatarPreviewUrl!.isEmpty) {
        _avatarPreviewUrl = 'https://picsum.photos/200';
      } else {
        _avatarPreviewUrl = null;
      }
    });
  }

  String _initials(String name) {
    final p = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).toList();
    if (p.isEmpty) return 'S';
    if (p.length == 1) return p.first.substring(0, 1).toUpperCase();
    return (p[0].substring(0, 1) + p[1].substring(0, 1)).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.initial != null;
    final width = MediaQuery.of(context).size.width;
    final maxCardWidth = (width >= 1200) ? 1980.0 : (width * 0.96);

    return Center(
      child: FadeTransition(
        opacity: _fadeIn,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxCardWidth, maxHeight: MediaQuery.of(context).size.height * 0.92),
          child: Material(
            elevation: 18.0,
            borderRadius: BorderRadius.circular(12.0),
            color: Colors.transparent,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12.0),
                  child: Container(
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(24.0, 24.0, 24.0, 20.0),
                    child: SingleChildScrollView(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                          // _avatarBlock(),
                          const SizedBox(width: 18.0),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(isEdit ? 'Edit Staff' : 'Add New Staff', style: GoogleFonts.lexend(fontSize: 20.0, fontWeight: FontWeight.w800)),
                              const SizedBox(height: 6.0),
                              Text('Profile, contact and employment details', style: GoogleFonts.inter(color: Colors.grey[600])),
                            ]),
                          ),
                          Row(children: [
                            const SizedBox(width: 8.0),
                          ])
                        ]),
                        const SizedBox(height: 18.0),
                        Card(
                          elevation: 6,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0)),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Form(
                              key: _formKey,
                              child: LayoutBuilder(builder: (ctx, cons) {
                                final isWide = cons.maxWidth >= 860;
                                final colW = isWide ? (cons.maxWidth - 20) / 2 : cons.maxWidth;
                                return Wrap(spacing: 20.0, runSpacing: 14.0, children: [
                                  SizedBox(width: colW, child: _field(label: 'Full name', controller: _nameCtrl, hint: 'e.g. Dr. Jane Doe', prefix: const Icon(Icons.person_outline), validator: (v) => (v == null || v.trim().isEmpty) ? 'Name required' : null)),
                                  SizedBox(width: colW, child: _field(label: 'Designation', controller: _designationCtrl, hint: 'e.g. Cardiologist', prefix: const Icon(Icons.work_outline))),
                                  SizedBox(width: colW, child: _field(label: 'Department', controller: _departmentCtrl, hint: 'e.g. Cardiology', prefix: const Icon(Icons.local_hospital_outlined))),
                                  SizedBox(
                                    width: colW,
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('Staff ID', style: _labelStyle),
                                      const SizedBox(height: 8.0),
                                      Row(children: [
                                        Expanded(
                                          child: DropdownButtonFormField<String>(
                                            decoration: _dec(hintText: 'ID mode'),
                                            value: _useAutoId ? 'Auto' : 'Manual',
                                            items: const [DropdownMenuItem(value: 'Auto', child: Text('Auto-generate')), DropdownMenuItem(value: 'Manual', child: Text('Manual entry'))],
                                            onChanged: (v) {
                                              if (v == null) return;
                                              setState(() {
                                                _useAutoId = v == 'Auto';
                                                if (_useAutoId) _codeCtrl.text = _genAutoId(_designationCtrl.text);
                                              });
                                            },
                                          ),
                                        ),
                                        const SizedBox(width: 12.0),
                                        ElevatedButton.icon(
                                          onPressed: _useAutoId ? () => setState(() => _codeCtrl.text = _genAutoId(_designationCtrl.text)) : null,
                                          icon: const Icon(Icons.refresh, size: 16.0),
                                          label: Text('New', style: GoogleFonts.inter()),
                                          style: ElevatedButton.styleFrom(backgroundColor: Colors.grey.shade100, foregroundColor: Colors.black, elevation: 0),
                                        ),
                                      ]),
                                      const SizedBox(height: 8.0),
                                      TextFormField(controller: _codeCtrl, decoration: _dec(hintText: 'e.g. DOC102'), readOnly: _useAutoId, validator: (v) => (v == null || v.trim().isEmpty) ? 'ID required' : null),
                                    ]),
                                  ),
                                  SizedBox(width: colW, child: _field(label: 'Contact', controller: _contactCtrl, hint: '+91 9XXXXXXXXX', prefix: const Icon(Icons.phone_outlined), keyboardType: TextInputType.phone)),
                                  SizedBox(width: colW, child: _field(label: 'Email', controller: _emailCtrl, hint: 'you@clinic.com', prefix: const Icon(Icons.email_outlined), keyboardType: TextInputType.emailAddress)),
                                  SizedBox(
                                    width: colW,
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('Status', style: _labelStyle),
                                      const SizedBox(height: 6.0),
                                      DropdownButtonFormField<String>(decoration: _dec(hintText: 'Select status'), value: _status, items: _statusOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _status = v ?? 'Available')),
                                    ]),
                                  ),
                                  SizedBox(
                                    width: colW,
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('Shift', style: _labelStyle),
                                      const SizedBox(height: 6.0),
                                      DropdownButtonFormField<String>(decoration: _dec(hintText: 'Select shift'), value: _shift, items: _shiftOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _shift = v ?? 'Morning')),
                                    ]),
                                  ),
                                  SizedBox(
                                    width: colW,
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('Joining date', style: _labelStyle),
                                      const SizedBox(height: 6.0),
                                      InkWell(onTap: () => _pickDate(context, _joinedAt, (d) => _joinedAt = d), child: IgnorePointer(child: TextFormField(decoration: _dec(hintText: 'Select joining date'), controller: TextEditingController(text: _fmtDate(_joinedAt))))),
                                    ]),
                                  ),
                                  SizedBox(
                                    width: colW,
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('Date of Birth', style: _labelStyle),
                                      const SizedBox(height: 6.0),
                                      InkWell(onTap: () => _pickDate(context, _dob, (d) => _dob = d), child: IgnorePointer(child: TextFormField(decoration: _dec(hintText: 'Select DOB'), controller: TextEditingController(text: _fmtDate(_dob))))),
                                    ]),
                                  ),
                                  // NEW: Gender field
                                  SizedBox(
                                    width: colW,
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('Gender', style: _labelStyle),
                                      const SizedBox(height: 6.0),
                                      DropdownButtonFormField<String>(
                                        decoration: _dec(hintText: 'Select gender'),
                                        value: _gender.isNotEmpty ? _gender : null,
                                        items: _genderOptions.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                                        onChanged: (v) => setState(() => _gender = v ?? 'Male'),
                                        validator: (v) {
                                          // optional: allow empty if you prefer, otherwise require selection
                                          if (v == null || v.trim().isEmpty) return 'Please select gender';
                                          return null;
                                        },
                                      ),
                                    ]),
                                  ),
                                  SizedBox(width: colW, child: _field(label: 'Experience (years)', controller: _experienceCtrl, hint: 'e.g. 5', keyboardType: TextInputType.number)),
                                  SizedBox(width: colW, child: _field(label: 'Location / Branch', controller: _locationCtrl, hint: 'e.g. Main Clinic')),
                                  SizedBox(width: cons.maxWidth, child: _rolesSelector()),
                                  SizedBox(width: cons.maxWidth, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text('Qualifications (comma separated)', style: _labelStyle),
                                    const SizedBox(height: 6.0),
                                    TextFormField(controller: _qualCtrl, decoration: _dec(hintText: 'MBBS, MD Cardiology'), maxLines: 2),
                                    const SizedBox(height: 12.0),
                                    Text('Notes', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
                                    const SizedBox(height: 8.0),
                                    TextFormField(controller: _notesCtrl, decoration: _dec(hintText: 'Short notes or remarks'), maxLines: 4),
                                  ])),
                                ]);
                              }),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14.0),
                        Row(children: [
                          TextButton.icon(onPressed: _isSaving ? null : () => Navigator.of(context).maybePop(), icon: const Icon(Icons.close), label: Text('Close', style: GoogleFonts.inter())),
                          const Spacer(),
                          ElevatedButton.icon(
                            onPressed: _isSaving ? null : _submit,
                            icon: const Icon(Icons.save, color: Colors.white), // also make the icon white
                            label: Text(
                              _isSaving ? 'Saving...' : 'Save & Close',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.w700,
                                color: Colors.white, // text explicitly white
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFDC2612),
                              foregroundColor: Colors.white, // <-- ensures text & icon use white
                              padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0),
                            ),
                          )
                        ])
                      ]),
                    ),
                  ),
                ),
                // Floating close button top-right
                Positioned(
                  top: -12.0,
                  right: -12.0,
                  child: Material(
                    shape: const CircleBorder(),
                    elevation: 6.0,
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () => Navigator.of(context).maybePop(),
                      child: Container(padding: const EdgeInsets.all(8.0), decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.close_rounded, size: 20.0)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
