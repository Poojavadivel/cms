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
    // make sure you have this in scope; adapt if your field is named differently
    final appt = widget.appt;

    return Column(
      children: [
        const SizedBox(height: 10),

        /// HORIZONTAL PROFILE HEADER (replaces vertical card)
        _ProfileHeaderCard(appt: appt),
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
                icon: const Icon(Icons.check_rounded, color: Colors.white, size: 20),
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



/// HORIZONTAL profile header bar
class _ProfileHeaderCard extends StatelessWidget {
  static const Color kPrimary = Color(0xFFEF4444);
  static const Color kBg = Color(0xFFF9FAFB);
  static const Color kCard = Colors.white;
  static const Color kText = Color(0xFF111827);
  static const Color kMuted = Color(0xFF6B7280);
  static const Color kBorder = Color(0xFFE5E7EB);
  static const double kRadius = 16;
  final DashboardAppointments appt;
  const _ProfileHeaderCard({required this.appt});

  // ---- Tokens
  static const Color kTint = Color(0xFFFFF1F2);      // unified bg
  static const Color kTintLine = Color(0xFFFFE4E6);  // hairlines on tint

  static const double kAvatar = 128;

  // ---- Helpers
  String _n(num? v, {String? suffix}) =>
      (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';
  String _s(String? v) => (v == null || v.trim().isEmpty) ? '—' : v;

  String _bloodGroup() {
    try {
      final bg = (appt as dynamic).bloodGroup;
      return _s(bg?.toString());
    } catch (_) {
      return '—';
    }
  }

  String _spo2() {
    try {
      final o2 = (appt as dynamic).spo2 ?? (appt as dynamic).oxygen ?? (appt as dynamic).oxygenLevel;
      if (o2 == null) return '—';
      final v = (o2 is num) ? o2 : num.tryParse(o2.toString());
      return v == null ? '—' : '${v.toStringAsFixed(0)}%';
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _s(appt.patientName);
    final isFemale = _s(appt.gender).toLowerCase() == 'female';
    final avatar = isFemale ? 'assets/girlicon.png' : 'assets/boyicon.png';

    return ClipRRect(
      borderRadius: BorderRadius.circular(kRadius),
      child: Container(
        decoration: BoxDecoration(
          color: kTint,                                   // ← unified tint
          borderRadius: BorderRadius.circular(kRadius),
          border: Border.all(color: kTintLine),          // hairline border
        ),
        child: Stack(
          children: [
            // Edit button (ghost)
            Positioned(
              top: 8,
              right: 8,
              child: _ghostButton(
                icon: Icons.edit_outlined,
                onTap: () {
                  // TODO: wire edit
                },
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: LayoutBuilder(
                builder: (context, c) {
                  final isTight = c.maxWidth < 980;
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // LEFT: Identity + Demographics
                      Expanded(
                        flex: isTight ? 10 : 6,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            _avatar(avatar),
                            const SizedBox(width: 16),
                            Expanded(child: _identityBlock(name, isFemale)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),

                      // RIGHT: Vitals (unified background, no inner boxes)
                      if (!isTight)
                        Expanded(flex: 5, child: _vitalsGrid())
                      else
                        Expanded(
                          flex: 10,
                          child: Padding(
                            padding: const EdgeInsets.only(top: 16),
                            child: _vitalsGrid(),
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- UI atoms

  Widget _avatar(String asset) {
    return Container(
      width: kAvatar,
      height: kAvatar,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kTintLine),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.asset(
          asset,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 72),
        ),
      ),
    );
  }

  Widget _identityBlock(String name, bool isFemale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.lexend(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kText,
            height: 1.05,
          ),
        ),
        const SizedBox(height: 8),

        // ID pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kTintLine),
          ),
          child: Text(
            'ID: ${_s(appt.patientId)}',
            style: GoogleFonts.lexend(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: const Color(0xFFB42318),
              letterSpacing: 0.1,
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Demographics line
        Wrap(
          spacing: 18,
          runSpacing: 10,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _mini(isFemale ? Icons.female : Icons.male, _s(appt.gender)),
            _mini(Icons.person, 'Age ${appt.patientAge ?? '—'}'),
            _mini(Icons.calendar_month, _s(appt.dob)),
          ],
        ),
        const SizedBox(height: 8),

        // Blood Group on its own line
        Row(
          children: [
            const Icon(Icons.bloodtype, size: 16, color: kMuted),
            const SizedBox(width: 6),
            Text(
              'Blood Group: ${_bloodGroup()}',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: kMuted,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _mini(IconData i, String t) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(i, size: 16, color: kMuted),
      const SizedBox(width: 6),
      Text(
        t,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: kMuted,
        ),
      ),
    ],
  );

  // --- Vitals: unified bg, 2x2 grid, hairlines (no tiles)
  Widget _vitalsGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: _kv(Icons.height, 'Height', _n(appt.height, suffix: ' cm'))),
            const SizedBox(width: 24), // spacing instead of line
            Expanded(child: _kv(Icons.monitor_weight_outlined, 'Weight', _n(appt.weight, suffix: ' kg'))),
          ],
        ),
        const SizedBox(height: 20), // vertical gap instead of line
        Row(
          children: [
            Expanded(child: _kv(Icons.scale, 'BMI', _n(appt.bmi))),
            const SizedBox(width: 24),
            Expanded(child: _kv(Icons.monitor_heart_outlined, 'Oxygen (SpO₂)', _spo2())),
          ],
        ),
      ],
    );
  }


  Widget _vRow({required Widget left, required Widget right}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(child: left),
        _vLine(),
        Expanded(child: right),
      ],
    );
  }

  Widget _hLine() => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Container(height: 1, color: kTintLine),
  );

  Widget _vLine() => Container(width: 1, height: 40, color: kTintLine);

  Widget _kv(IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // tone-on-tone capsule (keeps enterprise feel w/o boxes)
        Container(
          width: 34,
          height: 34,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0x26FFFFFF), Color(0x14FFFFFF)],
            ),
            border: Border.all(color: kTintLine),
          ),
          child: Icon(icon, size: 18, color: const Color(0xFFB42318)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Baseline(
                baseline: 18,
                baselineType: TextBaseline.alphabetic,
                child: Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.lexend(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: kText,
                    height: 1.0,
                  ),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: kMuted,
                  letterSpacing: 0.1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _ghostButton({required IconData icon, required VoidCallback onTap}) {
    return Material(
      color: kTint,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: kTintLine),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: const Padding(
          padding: EdgeInsets.all(8.0),
          child: Icon(Icons.edit_outlined, size: 18, color: Color(0xFF6B7280)),
        ),
      ),
    );
  }
}

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
