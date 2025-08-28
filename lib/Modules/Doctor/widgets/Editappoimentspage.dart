import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/appointment_draft.dart';

/// THEME (matches your enterprise red)
const _kPrimary = Color(0xFFEF4444);
const _kPrimary600 = Color(0xFFDC2626);
const _kBorder = Color(0xFFE5E7EB);
const _kCard = Colors.white;
const _kBg = Color(0xFFF9FAFB);
const _kText = Color(0xFF111827);
const _kMuted = Color(0xFF6B7280);
const _kMuted2 = Color(0xFF9CA3AF);

/// Canonical lists
const List<String> kAppointmentTypes = <String>[
  'Consultation',
  'Follow-up',
  'Check-up',
  'General Consult',
  'General Checkup',
  'Emergency',
  'Dermatology',
  'Cardiology',
  'Orthopedics',
  'Neurology Consult',
  'Endocrinology',
  'Ophthalmology',
  'Pediatrics',
  'Dental',
  'Allergy Consult',
  'ENT Consult',
];

const List<String> kAppointmentStatus = <String>[
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
  'No-show',
];

const List<String> kAppointmentModes = <String>['In-clinic', 'Telehealth'];
const List<String> kAppointmentPriority = <String>['Normal', 'Urgent', 'Emergency'];
const List<int> kDurations = <int>[15, 20, 30, 45, 60];

/// Enterprise, sectioned edit form
class EditAppointmentForm extends StatefulWidget {
  const EditAppointmentForm({
    super.key,
    required this.initial,
    required this.onSave,
    required this.onCancel,
    required this.onDelete,
  });

  final AppointmentDraft initial;
  final void Function(AppointmentDraft updated) onSave;
  final VoidCallback onCancel;
  final VoidCallback onDelete;

  @override
  State<EditAppointmentForm> createState() => _EditAppointmentFormState();
}

class _EditAppointmentFormState extends State<EditAppointmentForm> {
  final _formKey = GlobalKey<FormState>();

  // Scroll
  final ScrollController _scroll = ScrollController();

  // Text controllers
  late final TextEditingController _clientCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _locationCtrl;
  late final TextEditingController _chiefComplaintCtrl;
  late final TextEditingController _notesCtrl;
  late final TextEditingController _heightCtrl;
  late final TextEditingController _weightCtrl;
  late final TextEditingController _bpCtrl;
  late final TextEditingController _hrCtrl;
  late final TextEditingController _spo2Ctrl;

  // Pickers / dropdowns
  String? _type;
  String _status = 'Scheduled';
  String _mode = 'In-clinic';
  String _priority = 'Normal';
  int _duration = 20;
  bool _reminder = true;

  late DateTime _date;
  late TimeOfDay _time;

  @override
  void initState() {
    super.initState();
    final i = widget.initial;

    _clientCtrl = TextEditingController(text: i.clientName);
    _phoneCtrl = TextEditingController(text: i.phoneNumber ?? '');
    _locationCtrl = TextEditingController(text: i.location);
    _chiefComplaintCtrl = TextEditingController(text: i.chiefComplaint);
    _notesCtrl = TextEditingController(text: i.notes);
    _heightCtrl = TextEditingController(text: i.heightCm ?? '');
    _weightCtrl = TextEditingController(text: i.weightKg ?? '');
    _bpCtrl = TextEditingController(text: i.bp ?? '');
    _hrCtrl = TextEditingController(text: i.heartRate ?? '');
    _spo2Ctrl = TextEditingController(text: i.spo2 ?? '');

    _type = kAppointmentTypes.contains(i.appointmentType) ? i.appointmentType : null;
    _mode = kAppointmentModes.contains(i.mode) ? i.mode : 'In-clinic';
    _priority = kAppointmentPriority.contains(i.priority) ? i.priority : 'Normal';
    _duration = kDurations.contains(i.durationMinutes) ? i.durationMinutes : 20;
    _reminder = i.reminder;

    // Derive a sensible default status (you can map from your domain later)
    _status = kAppointmentStatus.first;

    _date = i.date;
    _time = i.time;
  }

  @override
  void dispose() {
    _scroll.dispose();
    _clientCtrl.dispose();
    _phoneCtrl.dispose();
    _locationCtrl.dispose();
    _chiefComplaintCtrl.dispose();
    _notesCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _bpCtrl.dispose();
    _hrCtrl.dispose();
    _spo2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final res = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(_date.year - 1),
      lastDate: DateTime(_date.year + 5),
      builder: (c, child) => Theme(
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
      initialTime: _time,
      builder: (c, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: _kPrimary),
        ),
        child: child!,
      ),
    );
    if (res != null) setState(() => _time = res);
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final effectiveType = _type ?? widget.initial.appointmentType;

    widget.onSave(
      AppointmentDraft(
        clientName: _clientCtrl.text.trim(),
        appointmentType: effectiveType.trim(),
        date: _date,
        time: _time,
        location: _locationCtrl.text.trim(),
        notes: _notesCtrl.text.trim(),
        phoneNumber: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        mode: _mode,
        priority: _priority,
        durationMinutes: _duration,
        reminder: _reminder,
        chiefComplaint: _chiefComplaintCtrl.text.trim(),
        heightCm: _heightCtrl.text.trim().isEmpty ? null : _heightCtrl.text.trim(),
        weightKg: _weightCtrl.text.trim().isEmpty ? null : _weightCtrl.text.trim(),
        bp: _bpCtrl.text.trim().isEmpty ? null : _bpCtrl.text.trim(),
        heartRate: _hrCtrl.text.trim().isEmpty ? null : _hrCtrl.text.trim(),
        spo2: _spo2Ctrl.text.trim().isEmpty ? null : _spo2Ctrl.text.trim(),
      ),
    );
  }

  // ---------- UI helpers ----------
  InputDecoration _dec(String hint, {Widget? prefix, Widget? suffix}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(fontSize: 13, color: _kMuted),
      prefixIcon: prefix,
      suffixIcon: suffix,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      enabledBorder:
      OutlineInputBorder(borderSide: const BorderSide(color: _kBorder), borderRadius: BorderRadius.circular(10)),
      focusedBorder:
      OutlineInputBorder(borderSide: const BorderSide(color: _kPrimary), borderRadius: BorderRadius.circular(10)),
      errorBorder:
      OutlineInputBorder(borderSide: const BorderSide(color: _kPrimary600), borderRadius: BorderRadius.circular(10)),
      focusedErrorBorder:
      OutlineInputBorder(borderSide: const BorderSide(color: _kPrimary600), borderRadius: BorderRadius.circular(10)),
    );
  }

  Widget _section(String title, {String? subtitle}) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 8),
      child: Row(
        children: [
          Text(title, style: GoogleFonts.lexend(fontSize: 14, fontWeight: FontWeight.w700, color: _kText)),
          if (subtitle != null) ...[
            const SizedBox(width: 8),
            Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: _kMuted)),
          ]
        ],
      ),
    );
  }

  Widget _fieldLabel(String text) => Text(
    text,
    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF374151)),
  );

  Widget _grid(BuildContext context, List<Widget> children) {
    // Responsive: 2 columns ≥ 860px; else 1 column
    return LayoutBuilder(builder: (context, c) {
      final twoCol = c.maxWidth >= 860;
      final colW = twoCol ? (c.maxWidth - 20) / 2 : c.maxWidth;
      return Wrap(
        spacing: 20,
        runSpacing: 16,
        children: children.map((w) => SizedBox(width: colW, child: w)).toList(),
      );
    });
  }

  // ---------- Build ----------
  @override
  Widget build(BuildContext context) {
    final title = GoogleFonts.lexend(fontSize: 18, fontWeight: FontWeight.w700, color: _kText);

    return Container(
      color: _kBg,
      child: Column(
        children: [
          // HEADER
          Container(
            color: _kCard,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Text('Edit Appointment', style: title),
                const Spacer(),
                TextButton(
                  onPressed: widget.onDelete,
                  style: TextButton.styleFrom(foregroundColor: _kPrimary600),
                  child: const Text('Delete'),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: widget.onCancel,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: _kBorder),
                    foregroundColor: _kText,
                  ),
                  child: const Text('Close'),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _save,
                  icon: const Icon(Icons.save, color: Colors.white, size: 18),
                  label: Text('Save Changes', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _kPrimary600,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: _kBorder),

          // BODY
          Expanded(
            child: ScrollConfiguration(
              behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
              child: SingleChildScrollView(
                controller: _scroll,
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Container(
                    decoration: BoxDecoration(
                      color: _kCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _kBorder),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                    ),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        // ===== Patient & Scheduling =====
                        _section('Patient & Scheduling'),
                        _grid(context, [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Client Name'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _clientCtrl,
                                decoration: _dec('Enter full name'),
                                validator: (v) => (v == null || v.trim().isEmpty) ? 'Client name is required' : null,
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Phone Number'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _phoneCtrl,
                                keyboardType: TextInputType.phone,
                                decoration: _dec('Optional'),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Date'),
                              const SizedBox(height: 6),
                              TextFormField(
                                readOnly: true,
                                controller: TextEditingController(
                                  text:
                                  '${_date.year.toString().padLeft(4, '0')}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}',
                                ),
                                decoration: _dec('Select date', suffix: IconButton(onPressed: _pickDate, icon: const Icon(Icons.event))),
                                onTap: _pickDate,
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Time'),
                              const SizedBox(height: 6),
                              TextFormField(
                                readOnly: true,
                                controller: TextEditingController(
                                  text:
                                  '${_time.hour.toString().padLeft(2, '0')}:${_time.minute.toString().padLeft(2, '0')}',
                                ),
                                decoration: _dec('Select time', suffix: IconButton(onPressed: _pickTime, icon: const Icon(Icons.schedule))),
                                onTap: _pickTime,
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Appointment Type'),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                value: kAppointmentTypes.contains(_type) ? _type : null,
                                items: kAppointmentTypes
                                    .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                                    .toList(),
                                onChanged: (v) => setState(() => _type = v),
                                decoration: _dec('Select type'),
                                validator: (v) => (v == null || v.isEmpty) ? 'Select a type' : null,
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Status'),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                value: _status,
                                items: kAppointmentStatus
                                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                                    .toList(),
                                onChanged: (v) => setState(() => _status = v ?? _status),
                                decoration: _dec('Select status'),
                              ),
                            ],
                          ),
                        ]),

                        const SizedBox(height: 16),
                        const Divider(color: _kBorder),

                        // ===== Logistics =====
                        _section('Logistics'),
                        _grid(context, [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Mode'),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                value: _mode,
                                items: kAppointmentModes
                                    .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                                    .toList(),
                                onChanged: (v) => setState(() => _mode = v ?? _mode),
                                decoration: _dec('Select mode'),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Priority'),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                value: _priority,
                                items: kAppointmentPriority
                                    .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                                    .toList(),
                                onChanged: (v) => setState(() => _priority = v ?? _priority),
                                decoration: _dec('Select priority'),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Duration'),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<int>(
                                value: _duration,
                                items: kDurations
                                    .map((d) => DropdownMenuItem(value: d, child: Text('$d minutes')))
                                    .toList(),
                                onChanged: (v) => setState(() => _duration = v ?? _duration),
                                decoration: _dec('Select duration'),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Location'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _locationCtrl,
                                decoration: _dec('Room / Address / Link'),
                                validator: (v) =>
                                (v == null || v.trim().isEmpty) ? 'Location is required' : null,
                              ),
                            ],
                          ),
                        ]),

                        const SizedBox(height: 16),
                        const Divider(color: _kBorder),

                        // ===== Clinical =====
                        _section('Clinical'),
                        _grid(context, [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Chief Complaint'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _chiefComplaintCtrl,
                                decoration: _dec('Short reason for visit'),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _fieldLabel('Notes'),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _notesCtrl,
                                maxLines: 3,
                                decoration: _dec('Additional context (optional)'),
                              ),
                            ],
                          ),
                        ]),

                        const SizedBox(height: 16),
                        const Divider(color: _kBorder),

                        // ===== Vitals =====
                        _section('Quick Vitals', subtitle: 'Optional but helpful'),
                        _grid(context, [
                          TextFormField(controller: _heightCtrl, decoration: _dec('Height (cm)')),
                          TextFormField(controller: _weightCtrl, decoration: _dec('Weight (kg)')),
                          TextFormField(controller: _bpCtrl, decoration: _dec('Blood Pressure')),
                          TextFormField(controller: _hrCtrl, decoration: _dec('Heart Rate')),
                          TextFormField(controller: _spo2Ctrl, decoration: _dec('SpO₂')),
                          Row(
                            children: [
                              Switch(
                                value: _reminder,
                                onChanged: (v) => setState(() => _reminder = v),
                                activeColor: _kPrimary600,
                              ),
                              const SizedBox(width: 6),
                              Text('Send reminder', style: GoogleFonts.inter(color: _kMuted)),
                            ],
                          ),
                        ]),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // FOOTER SHADOW (nice affordance)
          Container(height: 8, decoration: const BoxDecoration(color: _kBg, boxShadow: [
            BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))
          ])),
        ],
      ),
    );
  }
}
