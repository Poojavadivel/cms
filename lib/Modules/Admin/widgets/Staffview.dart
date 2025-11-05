// lib/modules/staff/staff_detail_page.dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';

import '../../../Models/staff.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

/// Enterprise-level Staff detail drawer/page
/// Usage:
///   // open drawer (desktop/tablet) or full page (mobile)
///   await showStaffDetail(context, staffId: staff.id, initial: staff);
Future<Staff?> showStaffDetail(
    BuildContext context, {
      required String staffId,
      Staff? initial,
    }) {
  final screenWidth = MediaQuery.of(context).size.width;

  if (screenWidth < 900) {
    // Mobile / tablet view → fullscreen
    return Navigator.of(context).push<Staff>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => StaffDetailPage(staffId: staffId, initial: initial),
      ),
    );
  } else {
    // Desktop / large screen view → 95% width enterprise modal (wider)
    return showDialog<Staff>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        final screenW = MediaQuery.of(ctx).size.width;
        final screenH = MediaQuery.of(ctx).size.height;

        // 95% width / 90% height dialog (wider)
        final maxW = screenW * 0.95;
        final maxH = screenH * 0.9;

        return Dialog(
          elevation: 12,
          backgroundColor: Colors.transparent,
          insetPadding: EdgeInsets.symmetric(
            horizontal: screenW * 0.025, // ensures 95% visible width
            vertical: screenH * 0.05,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: maxW,
                maxHeight: maxH,
              ),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 25,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: StaffDetailPage(
                  staffId: staffId,
                  initial: initial,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class StaffDetailPage extends StatefulWidget {
  final String staffId;
  final Staff? initial;
  const StaffDetailPage({super.key, required this.staffId, this.initial});

  @override
  State<StaffDetailPage> createState() => _StaffDetailPageState();
}

class _StaffDetailPageState extends State<StaffDetailPage> with TickerProviderStateMixin {
  late TabController _tabController;
  bool _loading = true;
  bool _saving = false;
  Staff? _staff;
  String? _error;

  // Edit controllers
  final _nameCtrl = TextEditingController();
  final _designationCtrl = TextEditingController();
  final _departmentCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  bool _editing = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadStaff();
  }

  Future<void> _loadStaff() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (widget.initial != null && widget.initial!.id == widget.staffId) {
        _staff = widget.initial;
      } else {
        // attempt to fetch authoritative staff by id from AuthService
        try {
          _staff = await AuthService.instance.fetchStaffById(widget.staffId);
        } catch (_) {
          // fallback to initial (if any)
          _staff = widget.initial;
        }
      }

      if (_staff == null) {
        throw Exception('Staff not found');
      }

      _fillControllers(_staff!);
    } catch (e) {
      _error = 'Failed to load staff: $e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _fillControllers(Staff s) {
    _nameCtrl.text = s.name;
    _designationCtrl.text = s.designation;
    _departmentCtrl.text = s.department;
    _contactCtrl.text = s.contact;
    _emailCtrl.text = s.email;
    _locationCtrl.text = s.location;
    _notesCtrl.text = (s.notes.isNotEmpty) ? s.notes.values.join('\n') : '';
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameCtrl.dispose();
    _designationCtrl.dispose();
    _departmentCtrl.dispose();
    _contactCtrl.dispose();
    _emailCtrl.dispose();
    _locationCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _copyStaffCode() async {
    final code = _staff?.patientFacingId ?? '';
    if (code.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: code));
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Staff code copied')));
  }

  Future<void> _toggleEdit() async {
    setState(() => _editing = !_editing);
    if (!_editing && _staff != null) {
      // discard edits -> refill
      _fillControllers(_staff!);
    }
  }

  Future<void> _save({bool closeAfter = false}) async {
    if (_staff == null) return;
    setState(() => _saving = true);

    final draft = _staff!.copyWith(
      name: _nameCtrl.text.trim(),
      designation: _designationCtrl.text.trim(),
      department: _departmentCtrl.text.trim(),
      contact: _contactCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      location: _locationCtrl.text.trim(),
      notes: _notesCtrl.text.trim().isNotEmpty ? {'notes': _notesCtrl.text.trim()} : _staff!.notes,
    );

    try {
      final ok = await AuthService.instance.updateStaff(draft);
      if (ok) {
        // attempt to fetch fresh
        try {
          final fresh = await AuthService.instance.fetchStaffById(draft.id);
          if (fresh != null) _staff = fresh;
        } catch (_) {
          _staff = draft;
        }
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved successfully')));
        if (closeAfter) {
          if (mounted) Navigator.of(context).pop(_staff);
          return;
        } else {
          setState(() {
            _editing = false;
          });
        }
      } else {
        // fallback: try fetch
        final fresh = await AuthService.instance.fetchStaffById(draft.id);
        if (fresh != null) {
          _staff = fresh;
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved (server returned object)')));
          if (closeAfter && mounted) Navigator.of(context).pop(_staff);
        } else {
          throw Exception('Update returned failure');
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  // Helper to build CircleAvatar using avatarUrl -> gender asset -> initials fallback
  CircleAvatar _buildAvatarSmall(Staff? s, {double radius = 34}) {
    if (s == null) {
      return CircleAvatar(radius: radius, backgroundColor: Colors.grey.shade200);
    }

    // if network avatar present, use it
    if (s.avatarUrl.isNotEmpty) {
      return CircleAvatar(radius: radius, backgroundImage: NetworkImage(s.avatarUrl));
    }

    // no network avatar — use gender-specific asset if available
    final gender = (s.gender ?? '').toLowerCase();
    if (gender == 'male' || gender == 'm') {
      return CircleAvatar(radius: radius, backgroundImage: const AssetImage('assets/boyicon.png'));
    } else if (gender == 'female' || gender == 'f' || gender == 'girl') {
      return CircleAvatar(radius: radius, backgroundImage: const AssetImage('assets/girlicon.png'));
    }

    // fallback — initials
    final initials = s.name.split(' ').map((p) => p.isNotEmpty ? p[0] : '').take(2).join();
    return CircleAvatar(radius: radius, backgroundColor: Colors.grey.shade200, child: Text(initials, style: GoogleFonts.inter(fontWeight: FontWeight.w700)));
  }

  Widget _buildHeader(BuildContext ctx) {
    final s = _staff;

    // Use helper for avatar so logic is consistent
    final avatar = _buildAvatarSmall(s, radius: 34);

    final subtitle = (s != null)
        ? '${s.designation.isNotEmpty ? s.designation : '-'}${s.department.isNotEmpty ? ' • ${s.department}' : ''}'
        : '';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // avatar + quick badge
        Stack(children: [
          avatar,
          if (s != null)
            Positioned(
              right: -2,
              bottom: -2,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: (s.status.toLowerCase() == 'available') ? Colors.green : Colors.grey,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
        ]),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(
                  s?.name ?? '—',
                  style: GoogleFonts.lexend(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.kTextPrimary),
                ),
              ),
              // Action buttons
              Row(children: [
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Edit',
                  onPressed: _staff == null ? null : _toggleEdit,
                ),
                IconButton(
                  icon: const Icon(Icons.more_vert),
                  tooltip: 'More actions',
                  onPressed: () {
                    // TODO: contextual menu (deactivate, reset password, audit)
                  },
                ),
              ]),
            ]),
            const SizedBox(height: 6),
            Text(subtitle, style: GoogleFonts.inter(color: Colors.grey[700], fontSize: 14)),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
              // staff code chip
              InputChip(
                avatar: CircleAvatar(child: Icon(Icons.badge, size: 16, color: Colors.white), backgroundColor: AppColors.primary600),
                label: Text(s?.patientFacingId.isNotEmpty == true ? s!.patientFacingId : 'Unassigned'),
                onPressed: s?.patientFacingId.isNotEmpty == true ? _copyStaffCode : null,
              ),
              // department
              if (s?.department.isNotEmpty == true) Chip(label: Text(s!.department)),
              if (s?.location.isNotEmpty == true) Chip(label: Text(s!.location)),
              if (s != null && s.roles.isNotEmpty) ...s.roles.map((r) => Chip(label: Text(r))).toList(),
            ]),
          ]),
        ),
      ]),
    );
  }

  Widget _primaryActions() {
    final s = _staff;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(children: [
        _actionSquare(icon: Icons.call, label: 'Call', onTap: s?.contact.isNotEmpty == true ? () => _launchTel(s!.contact) : null),
        const SizedBox(width: 12),
        _actionSquare(icon: Icons.message, label: 'Message', onTap: s?.contact.isNotEmpty == true ? () => _launchSms(s!.contact) : null),
        const SizedBox(width: 12),
        _actionSquare(icon: Icons.email, label: 'Email', onTap: s?.email.isNotEmpty == true ? () => _launchEmail(s!.email) : null),
        const SizedBox(width: 12),
        _actionSquare(icon: Icons.calendar_today, label: 'Schedule', onTap: () {}),
        const Spacer(),
        // status
        if (s != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: AppColors.primary600.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
            child: Text(s.status, style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.primary600)),
          ),
      ]),
    );
  }

  Widget _actionSquare({required IconData icon, required String label, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 88,
        height: 64,
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 20),
          ),
          const SizedBox(height: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12)),
        ]),
      ),
    );
  }

  void _launchTel(String number) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Call: $number')));
  }

  void _launchSms(String number) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Message: $number')));
  }

  void _launchEmail(String email) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Email: $email')));
  }

  Widget _overviewTab() {
    final s = _staff;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: s == null
          ? const SizedBox.shrink()
          : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _kvpRow('Staff ID', s.patientFacingId.isNotEmpty ? s.patientFacingId : 'Unassigned', copyable: s.patientFacingId.isNotEmpty, onCopy: _copyStaffCode),
        const SizedBox(height: 8),
        _kvpRow('Name', s.name),
        const SizedBox(height: 8),
        _kvpRow('Designation', s.designation),
        const SizedBox(height: 8),
        _kvpRow('Department', s.department),
        const SizedBox(height: 8),
        _kvpRow('Contact', s.contact),
        const SizedBox(height: 8),
        _kvpRow('Email', s.email),
        const SizedBox(height: 8),
        _kvpRow('Location', s.location),
        const SizedBox(height: 12),
        Text('Notes', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade100)),
          child: Text(s.notes.isNotEmpty ? s.notes.values.join('\n') : '-', style: GoogleFonts.inter()),
        )
      ]),
    );
  }

  Widget _kvpRow(String k, String v, {bool copyable = false, VoidCallback? onCopy}) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 160, child: Text(k, style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.grey[700]))),
      Expanded(child: Text(v.isNotEmpty ? v : '-', style: GoogleFonts.inter())),
      if (copyable)
        IconButton(
          icon: const Icon(Icons.copy, size: 18),
          tooltip: 'Copy',
          onPressed: onCopy,
        )
    ]);
  }

  Widget _tabs() {
    return Expanded(
      child: Column(
        children: [
          TabBar(
            controller: _tabController,
            labelColor: AppColors.primary600,
            unselectedLabelColor: Colors.grey[700],
            indicatorColor: AppColors.primary600,
            tabs: const [
              Tab(text: 'Overview'),
              Tab(text: 'Schedule'),
              Tab(text: 'Credentials'),
              Tab(text: 'Activity'),
              Tab(text: 'Files'),
            ],
          ),
          Expanded(
            child: TabBarView(controller: _tabController, children: [
              _overviewTab(),
              SingleChildScrollView(padding: const EdgeInsets.all(20), child: Text('Schedule — upcoming items', style: GoogleFonts.inter())),
              SingleChildScrollView(padding: const EdgeInsets.all(20), child: Text('Credentials — qualifications & docs', style: GoogleFonts.inter())),
              SingleChildScrollView(padding: const EdgeInsets.all(20), child: Text('Activity — audit / timeline', style: GoogleFonts.inter())),
              SingleChildScrollView(padding: const EdgeInsets.all(20), child: Text('Files — uploaded documents', style: GoogleFonts.inter())),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _editHeaderActions() {
    return Row(children: [
      OutlinedButton.icon(
        onPressed: _saving ? null : () => _toggleEdit(),
        icon: const Icon(Icons.close),
        label: Text('Cancel', style: GoogleFonts.inter()),
      ),
      const SizedBox(width: 12),
      const Spacer(),
      ElevatedButton.icon(
        onPressed: _saving ? null : () => _save(),
        icon: const Icon(Icons.save, color: Colors.white),
        label: Text(_saving ? 'Saving...' : 'Save', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0)),
      ),
      const SizedBox(width: 10),
      ElevatedButton.icon(
        onPressed: _saving ? null : () => _save(closeAfter: true),
        icon: const Icon(Icons.save, color: Colors.white),
        label: Text(_saving ? 'Saving...' : 'Save & Close', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0)),
      ),
    ]);
  }

  Widget _viewFooter() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(children: [
        OutlinedButton.icon(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.close),
          label: Text('Close', style: GoogleFonts.inter()),
        ),
        const SizedBox(width: 12),
        const Spacer(),
        ElevatedButton.icon(
          onPressed: _staff == null ? null : _toggleEdit,
          icon: const Icon(Icons.edit, color: Colors.white),
          label: Text('Edit', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626), padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0)),
        ),
      ]),
    );
  }

  Widget _editForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Editing', style: GoogleFonts.lexend(fontSize: 18, fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        Wrap(spacing: 12, runSpacing: 12, children: [
          SizedBox(width: 360, child: TextFormField(controller: _nameCtrl, decoration: _inputDec('Full name'))),
          SizedBox(width: 260, child: TextFormField(controller: _designationCtrl, decoration: _inputDec('Designation'))),
          SizedBox(width: 260, child: TextFormField(controller: _departmentCtrl, decoration: _inputDec('Department'))),
          SizedBox(width: 260, child: TextFormField(controller: _contactCtrl, decoration: _inputDec('Contact'), keyboardType: TextInputType.phone)),
          SizedBox(width: 360, child: TextFormField(controller: _emailCtrl, decoration: _inputDec('Email'), keyboardType: TextInputType.emailAddress)),
          SizedBox(width: 360, child: TextFormField(controller: _locationCtrl, decoration: _inputDec('Location'))),
          SizedBox(width: 720, child: TextFormField(controller: _notesCtrl, decoration: _inputDec('Notes'), maxLines: 3)),
        ])
      ]),
    );
  }

  InputDecoration _inputDec(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.grey.shade50,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: AppColors.primary600)),
    );
  }

  @override
  Widget build(BuildContext context) {
    // main card — rely on parent dialog constraints (so use double.infinity)
    return Material(
      color: Colors.transparent,
      child: SafeArea(
        child: Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
          child: SizedBox(
            width: double.infinity,
            height: MediaQuery.of(context).size.height * 0.9,
            child: Stack(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                // header area
                if (_loading)
                  const Padding(padding: EdgeInsets.all(24), child: LinearProgressIndicator())
                else if (_error != null)
                  Padding(padding: const EdgeInsets.all(24), child: Text(_error!, style: GoogleFonts.inter(color: Colors.red)))
                else
                  _buildHeader(context),

                // primary actions
                if (!_loading && _error == null) _primaryActions(),

                const SizedBox(height: 8),
                const Divider(height: 1),
                // body: tabs or edit form
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : (_error != null)
                      ? Center(child: Text(_error!, style: GoogleFonts.inter(color: Colors.red)))
                      : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    child: Column(
                      children: [
                        // tabs (left column visually)
                        Expanded(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // left column narrow (scrollable only here)
                              ConstrainedBox(
                                constraints: const BoxConstraints(maxWidth: 400, minWidth: 300),
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // small profile card
                                      Row(children: [
                                        // use same helper so gender assets used here too
                                        _buildAvatarSmall(_staff, radius: 34),
                                        const SizedBox(width: 12),
                                        Expanded(
                                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                              Text(_staff?.name ?? '-', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                                              const SizedBox(height: 6),
                                              Text(_staff?.designation ?? '-', style: GoogleFonts.inter(color: Colors.grey[700])),
                                            ])),
                                      ]),
                                      const SizedBox(height: 12),
                                      // contact summary
                                      Text('Contact', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                                      const SizedBox(height: 6),
                                      Text(_staff?.contact ?? '-'),
                                      const SizedBox(height: 6),
                                      Text(_staff?.email ?? '-'),
                                      const SizedBox(height: 12),
                                      Text('Quick stats', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                                      const SizedBox(height: 8),
                                      Row(children: [
                                        _miniStat('Experience', '${_staff?.experienceYears ?? 0}y'),
                                        const SizedBox(width: 8),
                                        _miniStat('Appts', '${_staff?.appointmentsCount ?? 0}'),
                                      ]),
                                      const SizedBox(height: 12),
                                      // left column scroll area
                                      Expanded(
                                        child: SingleChildScrollView(
                                          child: _metadataExtraSection(),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const VerticalDivider(width: 1),
                              // right column tabs + content (scroll handled inside each tab)
                              Expanded(
                                child: Column(
                                  children: [
                                    // either edit form top or tabs
                                    if (_editing) _editHeaderActions(),
                                    if (_editing) const SizedBox(height: 6),
                                    Expanded(child: _editing ? _editForm() : _tabs()),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // footer with actions
                const Divider(height: 1),
                _editing ? const SizedBox.shrink() : _viewFooter(),
              ]),

              // floating close button top-right
              Positioned(
                right: 14,
                top: 14,
                child: GestureDetector(
                  onTap: () => Navigator.of(context).maybePop(),
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10)],
                    ),
                    child: const Icon(Icons.close, size: 20),
                  ),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _miniStat(String title, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
      child: Column(children: [Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w700)), const SizedBox(height: 4), Text(title, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700]))]),
    );
  }

  Widget _metadataExtraSection() {
    final s = _staff;
    if (s == null) return const SizedBox.shrink();
    // show any extra keys that are not in main fields
    final meta = <MapEntry<String, String>>[];
    // attempt to extract from notes/other fields
    if (s.notes.isNotEmpty) {
      meta.addAll(s.notes.entries.map((e) => MapEntry('note:${e.key}', e.value)));
    }
    // if there are other tags show them
    if (s.tags.isNotEmpty) {
      meta.add(MapEntry('tags', s.tags.join(', ')));
    }

    if (meta.isEmpty) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Extra details', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Text('No extra metadata available.', style: GoogleFonts.inter(color: Colors.grey[600])),
      ]);
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Extra details', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      ...meta.map((e) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 110, child: Text(e.key, style: GoogleFonts.inter(color: Colors.grey[700]))),
          Expanded(child: Text(e.value, style: GoogleFonts.inter())),
        ]),
      )),
    ]);
  }
}
