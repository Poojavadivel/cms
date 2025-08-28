import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Models/dashboardmodels.dart';

/// ==================== THEME ====================
const Color primaryColor = Color(0xFFEF4444);
const Color backgroundColor = Color(0xFFF6F7FB);
const Color surfaceColor = Colors.white;
const Color textPrimaryColor = Color(0xFF0F172A);
const Color textSecondaryColor = Color(0xFF64748B);
const Color borderColor = Color(0xFFE2E8F0);
const Color badgeBg = Color(0xFFFFF3C7);
const Color badgeFg = Color(0xFFD97706);

ThemeData _intakeTheme(BuildContext context) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
    scaffoldBackgroundColor: backgroundColor,
    textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
    cardTheme: CardTheme(
      color: surfaceColor,
      elevation: 1,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: borderColor),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF1F5F9),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 1.4),
      ),
      labelStyle: const TextStyle(color: textSecondaryColor),
      hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    ),
    dividerTheme: const DividerThemeData(color: borderColor, thickness: 1),
  );
}

/// ============== DIALOG (headerless + floating close) ==============
Future<void> showIntakeFormDialog(
    BuildContext context,
    DashboardAppointments appt,
    ) {
  return showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) {
      final size = MediaQuery.of(ctx).size;
      final maxW = size.width.clamp(360, 1000).toDouble();
      final maxH = size.height.clamp(520, 860).toDouble();

      return Theme(
        data: _intakeTheme(ctx),
        child: Dialog(
          elevation: 0,
          insetPadding: const EdgeInsets.all(16),
          backgroundColor: Colors.transparent,
          child: SafeArea(
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(.08),
                        blurRadius: 26,
                        offset: const Offset(0, 14),
                      ),
                    ],
                  ),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxW, maxHeight: maxH),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: Material(
                        color: backgroundColor,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: IntakeFormBody(appt: appt, isDialog: true),
                        ),
                      ),
                    ),
                  ),
                ),
                // floating close
                Positioned(
                  right: -8,
                  top: -8,
                  child: Tooltip(
                    message: 'Close',
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => Navigator.of(ctx).pop(),
                        borderRadius: BorderRadius.circular(999),
                        child: Ink(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: borderColor),
                            borderRadius: BorderRadius.circular(999),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(.06),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Padding(
                            padding: EdgeInsets.all(10),
                            child: Icon(Icons.close_rounded, size: 20),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}

/// ============== FULL PAGE (kept) ==============
class IntakeFormPage extends StatelessWidget {
  final DashboardAppointments appt;
  const IntakeFormPage({super.key, required this.appt});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: _intakeTheme(context),
      child: Scaffold(
        backgroundColor: backgroundColor,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: IntakeFormBody(appt: appt, isDialog: false),
          ),
        ),
      ),
    );
  }
}

/// ============== SHARED BODY ==============
class IntakeFormBody extends StatefulWidget {
  final DashboardAppointments appt;
  final bool isDialog;
  const IntakeFormBody({super.key, required this.appt, required this.isDialog});

  @override
  State<IntakeFormBody> createState() => _IntakeFormBodyState();
}

enum _SectionKey { history, symptoms, allergies, pathology, consent }

class _IntakeFormBodyState extends State<IntakeFormBody> {
  final Map<_SectionKey, bool> _completed = {
    _SectionKey.history: false,
    _SectionKey.symptoms: false,
    _SectionKey.allergies: false,
    _SectionKey.pathology: false,
    _SectionKey.consent: false,
  };

  /// saved summaries for the bottom panel
  final Map<_SectionKey, List<String>> _saved = {
    _SectionKey.history: [],
    _SectionKey.symptoms: [],
    _SectionKey.allergies: [],
    _SectionKey.pathology: [],
    _SectionKey.consent: [],
  };

  // selections
  String? chronicCond, surgery, lifestyle;
  String? primaryComplaint, onset, pain;
  String? allergy, medName, medDose, medFreq;

  // pathology + message
  String? testType, testPriority;
  final TextEditingController _labNote = TextEditingController();

  // consent
  bool consent1 = false, consent2 = false;

  int get _doneCount => _completed.values.where((e) => e).length;
  bool get _allRequired =>
      _completed[_SectionKey.history] == true &&
          _completed[_SectionKey.symptoms] == true &&
          _completed[_SectionKey.consent] == true;

  void _markDone(_SectionKey key, List<String> summaryLines) {
    setState(() {
      _completed[key] = true;
      _saved[key] = summaryLines;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Section saved'), behavior: SnackBarBehavior.floating),
    );
  }

  void _saveAndContinue() {
    if (!_allRequired) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Complete required sections (marked with *) to continue.'),
      ));
      return;
    }
    Navigator.of(context).maybePop();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Intake saved')));
  }

  @override
  void dispose() {
    _labNote.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _TopProgressStrip(done: _doneCount, total: _completed.length),
        const SizedBox(height: 10),

        /// HORIZONTAL PROFILE HEADER (replaces vertical card)
        _PatientHeaderBar(appt: widget.appt, saved: _saved),
        const SizedBox(height: 12),

        /// Sections + Saved panel below
        Expanded(
          child: ListView(
            children: [
              _SectionCard(
                icon: Icons.history_edu,
                title: 'Patient History *',
                description: 'Add medical history, surgeries, chronic conditions.',
                required: true,
                completed: _completed[_SectionKey.history] ?? false,
                editor: Column(
                  children: [
                    _SelectField(
                      label: 'Chronic Conditions',
                      value: chronicCond,
                      items: const ['Diabetes', 'Hypertension', 'Asthma', 'Thyroid', 'None', 'Other'],
                      onChanged: (v) => setState(() => chronicCond = v),
                    ),
                    _SelectField(
                      label: 'Past Surgeries',
                      value: surgery,
                      items: const ['Appendectomy', 'C-Section', 'Bypass', 'Fracture Fixation', 'None', 'Other'],
                      onChanged: (v) => setState(() => surgery = v),
                    ),
                    _SelectField(
                      label: 'Lifestyle',
                      value: lifestyle,
                      items: const ['Smoker', 'Alcohol', 'Active', 'Sedentary', 'Other'],
                      onChanged: (v) => setState(() => lifestyle = v),
                    ),
                    _EditorActions(
                      onCancel: () {},
                      onSave: () => _markDone(_SectionKey.history, [
                        if (chronicCond != null) 'Chronic: $chronicCond',
                        if (surgery != null) 'Surgery: $surgery',
                        if (lifestyle != null) 'Lifestyle: $lifestyle',
                      ]),
                    ),
                  ],
                ),
              ),
              _SectionCard(
                icon: Icons.sick,
                title: 'Current Symptoms *',
                description: 'Chief complaint, onset date, pain scale.',
                required: true,
                completed: _completed[_SectionKey.symptoms] ?? false,
                editor: Column(
                  children: [
                    _SelectField(
                      label: 'Primary Complaint',
                      value: primaryComplaint,
                      items: const ['Fever', 'Headache', 'Cough', 'Chest Pain', 'Vomiting', 'Other'],
                      onChanged: (v) => setState(() => primaryComplaint = v),
                    ),
                    _SelectField(
                      label: 'Onset',
                      value: onset,
                      items: const ['Today', 'Yesterday', '1 Week', '2 Weeks', '1 Month', 'Other'],
                      onChanged: (v) => setState(() => onset = v),
                    ),
                    _SelectField(
                      label: 'Pain (0–10)',
                      value: pain,
                      items: const ['0','1','2','3','4','5','6','7','8','9','10'],
                      onChanged: (v) => setState(() => pain = v),
                    ),
                    _EditorActions(
                      onCancel: () {},
                      onSave: () => _markDone(_SectionKey.symptoms, [
                        if (primaryComplaint != null) 'Complaint: $primaryComplaint',
                        if (onset != null) 'Onset: $onset',
                        if (pain != null) 'Pain: $pain/10',
                      ]),
                    ),
                  ],
                ),
              ),
              _SectionCard(
                icon: Icons.medication_liquid,
                title: 'Allergies & Medications',
                description: 'List allergies and current meds.',
                completed: _completed[_SectionKey.allergies] ?? false,
                editor: Column(
                  children: [
                    _SelectField(
                      label: 'Allergies',
                      value: allergy,
                      items: const ['Penicillin', 'Sulfa', 'Peanuts', 'Dust', 'None', 'Other'],
                      onChanged: (v) => setState(() => allergy = v),
                    ),
                    _SelectField(
                      label: 'Medication Name',
                      value: medName,
                      items: const ['Paracetamol', 'Cetirizine', 'Ibuprofen', 'Amoxicillin', 'Other'],
                      onChanged: (v) => setState(() => medName = v),
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: _SelectField(
                            label: 'Dosage',
                            value: medDose,
                            items: const ['125 mg', '250 mg', '500 mg', '1 g', 'Other'],
                            onChanged: (v) => setState(() => medDose = v),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _SelectField(
                            label: 'Frequency',
                            value: medFreq,
                            items: const ['OD', 'BD', 'TID', 'QID', 'HS', 'Other'],
                            onChanged: (v) => setState(() => medFreq = v),
                          ),
                        ),
                      ],
                    ),
                    _EditorActions(
                      onCancel: () {},
                      onSave: () => _markDone(_SectionKey.allergies, [
                        if (allergy != null) 'Allergy: $allergy',
                        if (medName != null) 'Med: $medName ${medDose ?? ''} ${medFreq ?? ''}'.trim(),
                      ]),
                    ),
                  ],
                ),
              ),
              _SectionCard(
                icon: Icons.biotech_outlined,
                title: 'Pathology & Message',
                description: 'Order tests, set priority and add note to lab.',
                completed: _completed[_SectionKey.pathology] ?? false,
                editor: Column(
                  children: [
                    _SelectField(
                      label: 'Test',
                      value: testType,
                      items: const ['CBC', 'CRP', 'LFT', 'RFT', 'Urinalysis', 'X-Ray Chest', 'Other'],
                      onChanged: (v) => setState(() => testType = v),
                    ),
                    _SelectField(
                      label: 'Priority',
                      value: testPriority,
                      items: const ['Routine', 'Urgent', 'STAT'],
                      onChanged: (v) => setState(() => testPriority = v),
                    ),
                    TextField(
                      controller: _labNote,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Message to Lab',
                        hintText: 'Any specific instructions…',
                      ),
                    ),
                    _EditorActions(
                      onCancel: () {},
                      onSave: () => _markDone(_SectionKey.pathology, [
                        if (testType != null) 'Test: $testType',
                        if (testPriority != null) 'Priority: $testPriority',
                        if (_labNote.text.trim().isNotEmpty) 'Note: ${_labNote.text.trim()}',
                      ]),
                    ),
                  ],
                ),
              ),
              _SectionCard(
                icon: Icons.verified_user,
                title: 'Consent *',
                description: 'Required before treatment.',
                required: true,
                completed: _completed[_SectionKey.consent] ?? false,
                editor: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SwitchListTile.adaptive(
                      value: consent1,
                      onChanged: (v) => setState(() => consent1 = v),
                      contentPadding: EdgeInsets.zero,
                      title: const Text('I consent to treatment and data processing.'),
                    ),
                    SwitchListTile.adaptive(
                      value: consent2,
                      onChanged: (v) => setState(() => consent2 = v),
                      contentPadding: EdgeInsets.zero,
                      title: const Text('I agree to receive appointment notifications.'),
                    ),
                    _EditorActions(
                      onCancel: () {},
                      onSave: () {
                        if (!consent1) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Primary consent is required.')),
                          );
                          return;
                        }
                        _markDone(_SectionKey.consent, [
                          'Primary Consent: Yes',
                          'Notify Agreement: ${consent2 ? "Yes" : "No"}',
                        ]);
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),
              _SavedDetailsPanel(saved: _saved),
              const SizedBox(height: 90),
            ],
          ),
        ),

        // sticky footer
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(top: BorderSide(color: borderColor)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(.05), blurRadius: 10, offset: const Offset(0, -2))],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              Icon(Icons.info_outline, size: 18, color: _allRequired ? Colors.green : badgeFg),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _allRequired
                      ? 'All required sections completed.'
                      : 'Complete required sections (marked with *) to continue.',
                  style: TextStyle(color: _allRequired ? Colors.green[800] : textSecondaryColor),
                ),
              ),
              OutlinedButton(
                onPressed: () => Navigator.of(context).maybePop(),
                child: const Text('Cancel'),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: _saveAndContinue,
                icon: const Icon(
                  Icons.check_rounded,
                  color: Colors.white, // ✅ white check icon
                  size: 20,),
                label: const Text('Save & Continue'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// ==================== PARTS ====================

class _TopProgressStrip extends StatelessWidget {
  final int done;
  final int total;
  const _TopProgressStrip({required this.done, required this.total});
  @override
  Widget build(BuildContext context) {
    final value = total == 0 ? 0.0 : done / total;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            const Icon(Icons.assignment_turned_in_outlined, color: primaryColor),
            const SizedBox(width: 10),
            const Text('Intake Progress', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(width: 12),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: value,
                  minHeight: 8,
                  backgroundColor: const Color(0xFFF1F5F9),
                  valueColor: const AlwaysStoppedAnimation(primaryColor),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text('$done/$total', style: const TextStyle(color: textSecondaryColor)),
          ],
        ),
      ),
    );
  }
}

/// HORIZONTAL profile header bar
class _PatientHeaderBar extends StatelessWidget {
  final DashboardAppointments appt;
  final Map<_SectionKey, List<String>> saved;
  const _PatientHeaderBar({required this.appt, required this.saved});

  String _valNum(num? v, {String suffix = ''}) =>
      (v == null || v == 0) ? '—' : '$v$suffix';
  String _valStr(String? v) =>
      (v == null || v.trim().isEmpty) ? '—' : v;

  @override
  Widget build(BuildContext context) {
    final isFemale = appt.gender.toLowerCase() == 'female';
    final avatarAsset = isFemale ? 'assets/girlicon.png' : 'assets/boyicon.png';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Avatar
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFFE4E6), width: 4),
              ),
              child: Container(
                margin: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFF1F5F9),
                ),
                padding: const EdgeInsets.all(6),
                child: ClipOval(
                  child: Image.asset(avatarAsset, fit: BoxFit.contain),
                ),
              ),
            ),
            const SizedBox(width: 16),

            // LEFT: Name + demographics
            Expanded(
              flex: 4,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(appt.patientName,
                      style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: textPrimaryColor)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 12,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      _miniIconLabel(isFemale ? Icons.female : Icons.male, appt.gender),
                      _miniIconLabel(Icons.person, 'Age ${appt.patientAge}'),
                      _miniIconLabel(Icons.badge, _valStr(appt.occupation)),
                      _miniIconLabel(Icons.event, _valStr(appt.dob)),
                    ],
                  ),
                ],
              ),
            ),

            // MIDDLE: vitals
            Expanded(
              flex: 5,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _metric(title: _valNum(appt.bmi), subtitle: 'BMI'),
                  _metric(title: _valNum(appt.weight, suffix: 'kg'), subtitle: 'Weight'),
                  _metric(title: _valNum(appt.height, suffix: 'cm'), subtitle: 'Height'),
                  _metric(title: _valStr(appt.bp), subtitle: 'Blood P. (mmHg)'),
                ],
              ),
            ),

            // RIGHT: Edit button
            Align(
              alignment: Alignment.topRight,
              child: _editGhostButton(
                onTap: () {
                  // open edit sheet here if needed
                },
              ),
            )
          ],
        ),
      ),
    );
  }
}




Widget _miniIconLabel(IconData icon, String text) {
  return Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 14, color: textSecondaryColor),
      const SizedBox(width: 4),
      Text(text, style: const TextStyle(color: textSecondaryColor, fontSize: 12)),
    ],
  );
}

Widget _metric({required String title, required String subtitle, bool emphasize = false}) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: emphasize ? FontWeight.w800 : FontWeight.w700,
          color: textPrimaryColor,
          height: 1.05,
        ),
      ),
      const SizedBox(height: 4),
      Text(subtitle,
          style: const TextStyle(fontSize: 12, color: textSecondaryColor),
          overflow: TextOverflow.ellipsis),
    ],
  );
}

Widget _chip(String text, {required Color bg, required Color fg}) {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(999),
    ),
    child: Text(text, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
  );
}

Widget _editGhostButton({required VoidCallback onTap}) {
  return InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10),
    child: Ink(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFE5E7EB),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Text('Edit', style: TextStyle(color: Color(0xFF374151), fontWeight: FontWeight.w600)),
    ),
  );
}


/// Small reusable fact item (label + bold value)
Widget _factItem(String label, String value) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(label,
          style: const TextStyle(
              fontSize: 12, color: textSecondaryColor, height: 1.2)),
      const SizedBox(height: 2),
      Text(value,
          style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w600, height: 1.2)),
    ],
  );
}


class _Tag extends StatelessWidget {
  final String text;
  const _Tag(this.text);
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: borderColor),
      ),
      child: Text(text, style: const TextStyle(fontSize: 12, color: textSecondaryColor)),
    );
  }
}

Widget _kv(String k, String v) => Row(
  children: [
    Expanded(
      child: Text(k, style: const TextStyle(color: textSecondaryColor)),
    ),
    const SizedBox(width: 6),
    Flexible(child: Text(v, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600))),
  ],
);

/// Expandable section with inline editor
class _SectionCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool required;
  final bool completed;
  final Widget editor;

  const _SectionCard({
    required this.icon,
    required this.title,
    required this.description,
    this.required = false,
    required this.completed,
    required this.editor,
  });

  @override
  State<_SectionCard> createState() => _SectionCardState();
}

class _SectionCardState extends State<_SectionCard> {
  bool open = false;

  @override
  Widget build(BuildContext context) {
    final pillText = widget.completed
        ? 'COMPLETED'
        : widget.required
        ? 'REQUIRED'
        : 'OPTIONAL';
    final pillBg = widget.completed ? Colors.green[50] : badgeBg;
    final pillFg = widget.completed ? Colors.green[800] : badgeFg;

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: AnimatedSize(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeInOut,
        child: Column(
          children: [
            InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => setState(() => open = !open),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(widget.icon, color: primaryColor),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Expanded(
                              child: Text(widget.title,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: pillBg, borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: (widget.completed ? Colors.green[200] : badgeBg)!),
                              ),
                              child: Text(pillText,
                                  style: TextStyle(fontSize: 11, color: pillFg, fontWeight: FontWeight.w700)),
                            ),
                          ]),
                          const SizedBox(height: 4),
                          Text(widget.description, style: const TextStyle(color: textSecondaryColor, fontSize: 13)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton.icon(
                      onPressed: () => setState(() => open = true),
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text('Add / Edit'),
                    ),
                  ],
                ),
              ),
            ),
            if (open) const Divider(height: 1),
            if (open)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: widget.editor,
              ),
          ],
        ),
      ),
    );
  }
}

/// Editor actions
class _EditorActions extends StatelessWidget {
  final VoidCallback onCancel;
  final VoidCallback onSave;
  const _EditorActions({required this.onCancel, required this.onSave});
  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          OutlinedButton(onPressed: onCancel, child: const Text('Cancel')),
          const SizedBox(width: 8),
          ElevatedButton.icon(onPressed: onSave, icon: const Icon(Icons.save_outlined), label: const Text('Save')),
        ],
      ),
    );
  }
}

/// Reusable dropdown with "Other" support
class _SelectField extends StatefulWidget {
  final String label;
  final List<String> items;
  final String? value;
  final ValueChanged<String?> onChanged;
  const _SelectField({
    required this.label,
    required this.items,
    required this.value,
    required this.onChanged,
  });

  @override
  State<_SelectField> createState() => _SelectFieldState();
}

class _SelectFieldState extends State<_SelectField> {
  String? local;
  final _ctrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    local = widget.value;
  }

  @override
  void didUpdateWidget(covariant _SelectField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != local) local = widget.value;
  }

  @override
  Widget build(BuildContext context) {
    final isOther = local == 'Other';
    return Column(
      children: [
        DropdownButtonFormField<String>(
          value: local,
          decoration: InputDecoration(labelText: widget.label),
          items: widget.items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) {
            setState(() => local = v);
            if (v != 'Other') widget.onChanged(v);
          },
        ),
        if (isOther)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: TextField(
              controller: _ctrl,
              decoration: InputDecoration(
                labelText: '${widget.label} (Other)',
                hintText: 'Type value',
              ),
              onChanged: (t) => widget.onChanged(t),
            ),
          ),
      ],
    );
  }
}

/// Saved details summary
class _SavedDetailsPanel extends StatelessWidget {
  final Map<_SectionKey, List<String>> saved;
  const _SavedDetailsPanel({required this.saved});

  @override
  Widget build(BuildContext context) {
    final nonEmpty = saved.entries.where((e) => e.value.isNotEmpty).toList();
    if (nonEmpty.isEmpty) return const SizedBox.shrink();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Saved Details', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...nonEmpty.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${_sectionTitle(e.key)}: ',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Expanded(child: Text(e.value.join(' • '))),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
}

String _sectionTitle(_SectionKey k) {
  switch (k) {
    case _SectionKey.history:
      return 'History';
    case _SectionKey.symptoms:
      return 'Symptoms';
    case _SectionKey.allergies:
      return 'Allergies';
    case _SectionKey.pathology:
      return 'Pathology';
    case _SectionKey.consent:
      return 'Consent';
  }
}
