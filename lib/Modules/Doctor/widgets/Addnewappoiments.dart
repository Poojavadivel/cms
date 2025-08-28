import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/appointment_draft.dart';

/// ---------------------------------------------------------------------------
/// IconX (enterprise aliases) — still mapping to Material to avoid extra deps.
/// ---------------------------------------------------------------------------
class IconX {
  static const IconData user = Icons.person_outline;
  static const IconData list = Icons.list_alt_outlined;
  static const IconData calendar = Icons.event_outlined;
  static const IconData clock = Icons.schedule_outlined;
  static const IconData mapPin = Icons.location_on_outlined;
  static const IconData note = Icons.notes_outlined;
  static const IconData add = Icons.add;
  static const IconData phone = Icons.phone_outlined;
  static const IconData video = Icons.videocam_outlined;
  static const IconData hospital = Icons.local_hospital_outlined;
  static const IconData priority = Icons.priority_high_outlined;
  static const IconData timer = Icons.timer_outlined;
  static const IconData bell = Icons.notifications_active_outlined;
  static const IconData bp = Icons.monitor_heart_outlined;
  static const IconData weight = Icons.monitor_weight_outlined;
  static const IconData height = Icons.height;
  static const IconData heart = Icons.favorite_border;
  static const IconData o2 = Icons.bloodtype_outlined;
  static const IconData cancel = Icons.close;
  static const IconData save = Icons.check;
}

/// ---------------------------------------------------------------------------
/// Theme constants (enterprise red)
/// ---------------------------------------------------------------------------
const _kPrimary = Color(0xFFEF4444); // red-500
const _kPrimary600 = Color(0xFFDC2626); // red-600
const _kBorder = Color(0xFFE5E7EB);
const _kMuted = Color(0xFF6B7280);
const _kCard = Colors.white;

/// ---------------------------------------------------------------------------
/// Data model for draft appointment  (ENHANCED FOR CLINICAL USE)
/// ---------------------------------------------------------------------------

/// ---------------------------------------------------------------------------
/// AddAppointmentForm — Enterprise + vertical scrolling
/// ---------------------------------------------------------------------------
class AddAppointmentForm extends StatefulWidget {
  const AddAppointmentForm({
    super.key,
    this.initialTypes = const ['Consultation', 'Follow-up', 'Check-up'],
    this.onSubmit,
  });

  final List<String> initialTypes;
  final void Function(AppointmentDraft draft)? onSubmit;

  @override
  State<AddAppointmentForm> createState() => _AddAppointmentFormState();
}

class _AddAppointmentFormState extends State<AddAppointmentForm> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _clientNameCtrl = TextEditingController();
  final _patientIdCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _complaintCtrl = TextEditingController();

  // vitals
  final _heightCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  final _bpCtrl = TextEditingController();
  final _hrCtrl = TextEditingController();
  final _spo2Ctrl = TextEditingController();

  // selects
  String? _type;
  String _mode = 'In-clinic';
  String _priority = 'Normal';
  int _duration = 20;

  DateTime? _date;
  TimeOfDay? _time;
  bool _reminder = true;

  @override
  void dispose() {
    _clientNameCtrl.dispose();
    _patientIdCtrl.dispose();
    _phoneCtrl.dispose();
    _locationCtrl.dispose();
    _notesCtrl.dispose();
    _complaintCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _bpCtrl.dispose();
    _hrCtrl.dispose();
    _spo2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final res = await showDatePicker(
      context: context,
      initialDate: _date ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 5),
      helpText: 'Select appointment date',
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: _kPrimary),
        ),
        child: child!,
      ),
    );
    if (res != null) setState(() => _date = res);
  }

  Future<void> _pickTime() async {
    final res = await showTimePicker(
      context: context,
      initialTime: _time ?? TimeOfDay.now(),
      helpText: 'Select appointment time',
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: _kPrimary),
        ),
        child: child!,
      ),
    );
    if (res != null) setState(() => _time = res);
  }

  String _fmtDate(DateTime? d) =>
      d == null ? '' : '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  String _fmtTime(TimeOfDay? t) =>
      t == null ? '' : '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final draft = AppointmentDraft(
      clientName: _clientNameCtrl.text.trim(),
      appointmentType: _type!.trim(),
      date: _date!,
      time: _time!,
      location: _locationCtrl.text.trim(),
      notes: _notesCtrl.text.trim(),
      // extras
      patientId: _patientIdCtrl.text.trim().isEmpty ? null : _patientIdCtrl.text.trim(),
      phoneNumber: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      mode: _mode,
      priority: _priority,
      durationMinutes: _duration,
      reminder: _reminder,
      chiefComplaint: _complaintCtrl.text.trim(),
      heightCm: _heightCtrl.text.trim().isEmpty ? null : _heightCtrl.text.trim(),
      weightKg: _weightCtrl.text.trim().isEmpty ? null : _weightCtrl.text.trim(),
      bp: _bpCtrl.text.trim().isEmpty ? null : _bpCtrl.text.trim(),
      heartRate: _hrCtrl.text.trim().isEmpty ? null : _hrCtrl.text.trim(),
      spo2: _spo2Ctrl.text.trim().isEmpty ? null : _spo2Ctrl.text.trim(),
    );

    widget.onSubmit?.call(draft);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Appointment added', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: _kPrimary600,
      ),
    );

    // reset
    _formKey.currentState!.reset();
    setState(() {
      _type = null;
      _mode = 'In-clinic';
      _priority = 'Normal';
      _duration = 20;
      _reminder = true;
      _date = null;
      _time = null;
    });
    for (final c in [
      _clientNameCtrl,
      _patientIdCtrl,
      _phoneCtrl,
      _locationCtrl,
      _notesCtrl,
      _complaintCtrl,
      _heightCtrl,
      _weightCtrl,
      _bpCtrl,
      _hrCtrl,
      _spo2Ctrl,
    ]) {
      c.clear();
    }
  }

  InputDecoration _dec({
    required String hintText,
    Widget? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: GoogleFonts.inter(fontSize: 13, color: _kMuted, fontWeight: FontWeight.w500),
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      enabledBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: _kBorder),
        borderRadius: BorderRadius.circular(10),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: _kPrimary),
        borderRadius: BorderRadius.circular(10),
      ),
      errorBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: _kPrimary600),
        borderRadius: BorderRadius.circular(10),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: _kPrimary600),
        borderRadius: BorderRadius.circular(10),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final labelStyle = GoogleFonts.inter(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: const Color(0xFF374151),
    );
    final inputText = GoogleFonts.lexend(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: const Color(0xFF111827),
    );

    return Container(
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _kBorder),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Form(
        key: _formKey,
        child: Scrollbar(
          thumbVisibility: true,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Header
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon(IconX.add, color: _kPrimary, size: 22),
                    // const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Add New Appointment',
                              style: GoogleFonts.lexend(fontSize: 20, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text('Schedule with clinical context. Fields marked * are required.',
                              style: GoogleFonts.inter(fontSize: 13, color: _kMuted)),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Patient & Visit Section
                _Section(
                  title: 'Patient & Visit',
                  child: LayoutBuilder(builder: (context, c) {
                    final isWide = c.maxWidth >= 840;
                    final colW = isWide ? (c.maxWidth - 24) / 2 : c.maxWidth;
                    return Wrap(
                      spacing: 24,
                      runSpacing: 16,
                      children: [
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Client Name *',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _clientNameCtrl,
                              style: inputText,
                              decoration: _dec(
                                hintText: 'Enter client name',
                                prefixIcon: const Icon(IconX.user),
                              ),
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Client name is required'
                                  : null,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Patient ID',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _patientIdCtrl,
                              style: inputText,
                              decoration: _dec(
                                hintText: 'Optional',
                                prefixIcon: const Icon(IconX.hospital),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Appointment Type *',
                            labelStyle: labelStyle,
                            child: DropdownButtonFormField<String>(
                              value: _type,
                              items: [
                                const DropdownMenuItem(value: null, child: Text('Select type')),
                                ...widget.initialTypes.map(
                                      (t) => DropdownMenuItem(value: t, child: Text(t, style: inputText)),
                                ),
                              ].whereType<DropdownMenuItem<String>>().toList(),
                              onChanged: (v) => setState(() => _type = v),
                              decoration: _dec(
                                hintText: 'Select type',
                                prefixIcon: const Icon(IconX.list),
                              ),
                              validator: (v) => (v == null || v.isEmpty) ? 'Select a type' : null,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Reason / Chief Complaint',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _complaintCtrl,
                              style: inputText,
                              decoration: _dec(
                                hintText: 'e.g., Chest pain, follow-up for labs',
                                prefixIcon: const Icon(IconX.note),
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  }),
                ),

                const SizedBox(height: 18),

                // Schedule Section
                _Section(
                  title: 'Schedule',
                  child: LayoutBuilder(builder: (context, c) {
                    final isWide = c.maxWidth >= 840;
                    final colW = isWide ? (c.maxWidth - 24) / 2 : c.maxWidth;
                    return Wrap(
                      spacing: 24,
                      runSpacing: 16,
                      children: [
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Date *',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              readOnly: true,
                              controller: TextEditingController(text: _fmtDate(_date)),
                              style: inputText,
                              decoration: _dec(
                                hintText: 'Select date',
                                prefixIcon: const Icon(IconX.calendar),
                                suffixIcon: IconButton(
                                  icon: const Icon(IconX.calendar),
                                  onPressed: _pickDate,
                                ),
                              ),
                              onTap: _pickDate,
                              validator: (_) => _date == null ? 'Select a date' : null,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Time *',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              readOnly: true,
                              controller: TextEditingController(text: _fmtTime(_time)),
                              style: inputText,
                              decoration: _dec(
                                hintText: 'Select time',
                                prefixIcon: const Icon(IconX.clock),
                                suffixIcon: IconButton(
                                  icon: const Icon(IconX.clock),
                                  onPressed: _pickTime,
                                ),
                              ),
                              onTap: _pickTime,
                              validator: (_) => _time == null ? 'Select a time' : null,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Mode',
                            labelStyle: labelStyle,
                            child: DropdownButtonFormField<String>(
                              value: _mode,
                              items: const [
                                DropdownMenuItem(value: 'In-clinic', child: Text('In-clinic')),
                                DropdownMenuItem(value: 'Telehealth', child: Text('Telehealth')),
                              ],
                              onChanged: (v) => setState(() => _mode = v ?? 'In-clinic'),
                              decoration: _dec(
                                hintText: 'Mode',
                                prefixIcon: Icon(_mode == 'Telehealth' ? IconX.video : IconX.mapPin),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Duration (mins)',
                            labelStyle: labelStyle,
                            child: DropdownButtonFormField<int>(
                              value: _duration,
                              items: const [15, 20, 30, 45, 60]
                                  .map((m) => DropdownMenuItem(value: m, child: Text('$m')))
                                  .toList(),
                              onChanged: (v) => setState(() => _duration = v ?? 20),
                              decoration: _dec(
                                hintText: 'Select duration',
                                prefixIcon: const Icon(IconX.timer),
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  }),
                ),

                const SizedBox(height: 18),

                // Contact & Location
                _Section(
                  title: 'Contact & Location',
                  child: LayoutBuilder(builder: (context, c) {
                    final isWide = c.maxWidth >= 840;
                    final colW = isWide ? (c.maxWidth - 24) / 2 : c.maxWidth;
                    return Wrap(
                      spacing: 24,
                      runSpacing: 16,
                      children: [
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Phone',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _phoneCtrl,
                              keyboardType: TextInputType.phone,
                              style: inputText,
                              decoration: _dec(
                                hintText: '+91 9XXXXXXXXX',
                                prefixIcon: const Icon(IconX.phone),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Location *',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _locationCtrl,
                              style: inputText,
                              decoration: _dec(
                                hintText: 'Clinic / Address / Meeting link',
                                prefixIcon: const Icon(IconX.mapPin),
                              ),
                              validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Location is required' : null,
                            ),
                          ),
                        ),
                      ],
                    );
                  }),
                ),

                const SizedBox(height: 18),

                // Vitals (optional quick capture)
                _Section(
                  title: 'Quick Vitals (optional)',
                  child: LayoutBuilder(builder: (context, c) {
                    final isWide = c.maxWidth >= 1000;
                    final colW = isWide ? (c.maxWidth - 24 * 2) / 3 : (c.maxWidth - 24) / 2;
                    return Wrap(
                      spacing: 24,
                      runSpacing: 16,
                      children: [
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Height (cm)',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _heightCtrl,
                              keyboardType: TextInputType.number,
                              style: inputText,
                              decoration:
                              _dec(hintText: 'e.g., 175', prefixIcon: const Icon(IconX.height)),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Weight (kg)',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _weightCtrl,
                              keyboardType: TextInputType.number,
                              style: inputText,
                              decoration:
                              _dec(hintText: 'e.g., 72', prefixIcon: const Icon(IconX.weight)),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Blood Pressure',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _bpCtrl,
                              style: inputText,
                              decoration: _dec(
                                  hintText: 'e.g., 120/80', prefixIcon: const Icon(IconX.bp)),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'Heart Rate (bpm)',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _hrCtrl,
                              keyboardType: TextInputType.number,
                              style: inputText,
                              decoration:
                              _dec(hintText: 'e.g., 78', prefixIcon: const Icon(IconX.heart)),
                            ),
                          ),
                        ),
                        SizedBox(
                          width: colW,
                          child: _Labeled(
                            label: 'SpO₂ (%)',
                            labelStyle: labelStyle,
                            child: TextFormField(
                              controller: _spo2Ctrl,
                              keyboardType: TextInputType.number,
                              style: inputText,
                              decoration:
                              _dec(hintText: 'e.g., 98', prefixIcon: const Icon(IconX.o2)),
                            ),
                          ),
                        ),
                      ],
                    );
                  }),
                ),

                const SizedBox(height: 18),

                // Notes & Flags
                _Section(
                  title: 'Notes & Flags',
                  child: Column(
                    children: [
                      _Labeled(
                        label: 'Clinical Notes',
                        labelStyle: labelStyle,
                        child: TextFormField(
                          controller: _notesCtrl,
                          style: inputText,
                          maxLines: 4,
                          decoration:
                          _dec(hintText: 'Any relevant notes'),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _Labeled(
                              label: 'Priority',
                              labelStyle: labelStyle,
                              child: DropdownButtonFormField<String>(
                                value: _priority,
                                items: const [
                                  DropdownMenuItem(value: 'Normal', child: Text('Normal')),
                                  DropdownMenuItem(value: 'Urgent', child: Text('Urgent')),
                                  DropdownMenuItem(value: 'Emergency', child: Text('Emergency')),
                                ],
                                onChanged: (v) => setState(() => _priority = v ?? 'Normal'),
                                decoration: _dec(
                                  hintText: 'Priority',
                                  prefixIcon: const Icon(IconX.priority),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _Labeled(
                              label: 'Reminder',
                              labelStyle: labelStyle,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(color: _kBorder),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                padding:
                                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Row(
                                  children: [
                                    Icon(IconX.bell,
                                        size: 20, color: _reminder ? _kPrimary600 : _kMuted),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        _reminder
                                            ? 'Send reminder to patient'
                                            : 'No reminder',
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF374151),
                                        ),
                                      ),
                                    ),
                                    Switch(
                                      value: _reminder,
                                      activeColor: _kPrimary600,
                                      onChanged: (v) => setState(() => _reminder = v),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Actions
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => Navigator.maybePop(context),
                      icon: const Icon(IconX.cancel),
                      label: Text('Cancel',
                          style: GoogleFonts.inter(
                              fontSize: 14, fontWeight: FontWeight.w700, color: _kMuted)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: _kBorder),
                        padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const Spacer(),
                    ElevatedButton.icon(
                      onPressed: _submit,
                      icon: const Icon(
                        IconX.save,
                        size: 18,
                        color: Colors.white, // ✅ force white
                      ),
                      label: Text(
                        'Save Appointment',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.white, // ✅ text white
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _kPrimary600,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Section with title and body box spacing
class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: GoogleFonts.lexend(
                fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFF111827))),
        const SizedBox(height: 10),
        child,
      ],
    );
  }
}

/// Small labeled wrapper
class _Labeled extends StatelessWidget {
  const _Labeled({required this.label, required this.child, required this.labelStyle});
  final String label;
  final TextStyle labelStyle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: labelStyle),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
