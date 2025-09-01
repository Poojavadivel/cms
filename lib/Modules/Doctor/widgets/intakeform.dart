import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Models/dashboardmodels.dart';

/// ==================== THEME ====================
const Color primaryColor = Color(0xFFEF4444);
const Color backgroundColor = Color(0xFFF6F7FB);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color borderColor = Color(0xFFE2E8F0);

// Match your appointment table theme
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _statusIncompleteColor = Color(0xFFDC2626);

ThemeData _intakeTheme(BuildContext context) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
    scaffoldBackgroundColor: backgroundColor,
    textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
  );
}

/// ============== DIALOG (floating intake form) ==============
Future<void> showIntakeFormDialog(
    BuildContext context, DashboardAppointments appt) {
  return showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) {
      final size = MediaQuery.of(ctx).size;
      final maxW = size.width.clamp(1060, 1350).toDouble();
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
                    constraints:
                    BoxConstraints(maxWidth: maxW, maxHeight: maxH),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: Material(
                        color: Colors.white, // 🔴 changed from backgroundColor
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: IntakeFormBody(appt: appt),
                        ),
                      ),
                    ),
                  ),
                ),
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


/// ============== FULL PAGE ==============
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
            child: IntakeFormBody(appt: appt),
          ),
        ),
      ),
    );
  }
}

/// ============== SHARED BODY ==============
class IntakeFormBody extends StatefulWidget {
  final DashboardAppointments appt;
  const IntakeFormBody({super.key, required this.appt});

  @override
  State<IntakeFormBody> createState() => _IntakeFormBodyState();
}

class _IntakeFormBodyState extends State<IntakeFormBody> {
  // Notes controllers
  final TextEditingController _currentNotesCtrl = TextEditingController();
  final TextEditingController _heightCtrl = TextEditingController();
  final TextEditingController _weightCtrl = TextEditingController();
  final TextEditingController _bmiCtrl = TextEditingController();
  final TextEditingController _spo2Ctrl = TextEditingController();

  // Pharmacy + Pathology dynamic tables
  final List<Map<String, String>> _pharmacyRows = [];
  final List<Map<String, String>> _pathologyRows = [];

  @override
  void dispose() {
    _currentNotesCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _bmiCtrl.dispose();
    _spo2Ctrl.dispose();
    super.dispose();
  }

  void _saveForm() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Form saved successfully ✅")),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appt = widget.appt;

    return Column(
      children: [
        const SizedBox(height: 10),
        _ProfileHeaderCard(appt: appt),
        const SizedBox(height: 12),
        Expanded(
          child: ListView(
            children: [
              /// --- MEDICAL NOTES ---
              /// --- MEDICAL NOTES ---
              _SectionCard(
                icon: Icons.note_alt_outlined,
                title: 'Medical Notes',
                description: 'Overview, vitals, and notes history.',
                editorBuilder: (_) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Edit Vitals',
                        style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrimaryColor)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _heightCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Height (cm)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _weightCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Weight (kg)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _bmiCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'BMI',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _spo2Ctrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'SpO₂ (%)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),
                    Text('Previous Notes',
                        style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrimaryColor)),
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor),
                      ),
                      child: Text(
                        widget.appt.previousNotes?.isNotEmpty == true
                            ? widget.appt.previousNotes!
                            : "No previous notes available.",
                        style: const TextStyle(color: textSecondaryColor, fontSize: 14),
                      ),
                    ),

                    const SizedBox(height: 12),
                    Text('Current Notes',
                        style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrimaryColor)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _currentNotesCtrl,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Enter today\'s medical notes…',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),

              /// --- PHARMACY ---
              _SectionCard(
                icon: Icons.local_pharmacy_outlined,
                title: 'Pharmacy',
                description: 'Prescribe and manage medications.',
                editorBuilder: (_) => Column(
                  children: [
                    CustomEditableTable(
                      rows: _pharmacyRows,
                      columns: const ['Medicine', 'Dosage', 'Frequency', 'Notes'],
                      onDelete: (i) => setState(() => _pharmacyRows.removeAt(i)),
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _pharmacyRows.add({
                              'Medicine': '',
                              'Dosage': '',
                              'Frequency': '',
                              'Notes': '',
                            });
                          });
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Add Medicine'),
                      ),
                    ),
                  ],
                ),
              ),

              /// --- PATHOLOGY ---
              _SectionCard(
                icon: Icons.biotech_outlined,
                title: 'Pathology',
                description: 'Order and track lab investigations.',
                editorBuilder: (_) => Column(
                  children: [
                    CustomEditableTable(
                      rows: _pathologyRows,
                      columns: const ['Test Name', 'Category','Priority', 'Notes'],
                      onDelete: (i) => setState(() => _pathologyRows.removeAt(i)),
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _pathologyRows.add({
                              'Test Name': '',
                              'Priority': '',
                              'Notes': '',
                            });
                          });
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Add Test'),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 90),
            ],
          ),
        ),

        /// --- Bottom Save Bar ---
      ],
    );
  }
}

/// ============== SECTION CARD ==============
class _SectionCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String description;
  final Widget Function(void Function(List<String>) saveCallback) editorBuilder;

  const _SectionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.editorBuilder,
  });

  @override
  State<_SectionCard> createState() => _SectionCardState();
}

class _SectionCardState extends State<_SectionCard> {
  bool open = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      color: Colors.white, // 👈 force white background
      elevation: 2,        // 👌 slight shadow for card feel
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: borderColor.withOpacity(0.3)), // subtle border
      ),
      child: Column(
        children: [
          ListTile(
            leading: Icon(widget.icon, color: primaryColor),
            title: Text(widget.title),
            subtitle: Text(
              widget.description,
              style: const TextStyle(color: textSecondaryColor),
            ),
            trailing: Icon(open
                ? Icons.keyboard_arrow_up
                : Icons.keyboard_arrow_down),
            onTap: () => setState(() => open = !open),
          ),
          if (open)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: widget.editorBuilder((_) {}),
            ),
        ],
      ),
    );
  }
}


/// ============== Custom Editable Table ==============
class CustomEditableTable extends StatelessWidget {
  final List<Map<String, String>> rows;
  final List<String> columns;
  final void Function(int index) onDelete;

  const CustomEditableTable({
    super.key,
    required this.rows,
    required this.columns,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: _tableHeaderColor, width: 1),
        borderRadius: BorderRadius.circular(10), // rounded corners
      ),
      child: Table(
        border: TableBorder.symmetric(
          inside: BorderSide(color: _tableHeaderColor.withOpacity(0.4), width: 0.6),
        ),
        columnWidths: {
          for (var i = 0; i < columns.length; i++) i: const FlexColumnWidth(),
          columns.length: const FixedColumnWidth(80), // 👈 Actions column fixed small width
        },
        defaultVerticalAlignment: TableCellVerticalAlignment.middle,
        children: [
          // Header Row
          TableRow(
            decoration: BoxDecoration(color: _rowAlternateColor.withOpacity(0.5)),
            children: [
              for (var col in columns)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                  child: Text(
                    col,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      color: _tableHeaderColor,
                      fontSize: 13,
                    ),
                  ),
                ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                child: Text(
                  "Actions",
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _tableHeaderColor,
                      fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),

          // Data Rows
          for (int i = 0; i < rows.length; i++)
            TableRow(
              decoration: BoxDecoration(
                color: i.isEven ? Colors.white : _rowAlternateColor.withOpacity(0.2),
              ),
              children: [
                for (var col in columns)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 6),
                    child: TextFormField(
                      initialValue: rows[i][col],
                      onChanged: (v) => rows[i][col] = v,
                      style: const TextStyle(fontSize: 13),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 6, horizontal: 6),
                      ),
                    ),
                  ),

                // Actions Cell (small + centered)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.check_circle, color: Colors.green, size: 18),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Row saved ✅")),
                          );
                        },
                      ),
                      const SizedBox(width: 6),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red, size: 18),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => onDelete(i),
                      ),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}


/// ============== Dummy Profile Header ==============
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
  static const Color kTint = Color(0xFFFFF1F2);
  static const Color kTintLine = Color(0xFFFFE4E6);
  static const double kAvatar = 128;

  String _n(num? v, {String? suffix}) =>
      (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';
  String _ss(String? v) => (v == null || v.trim().isEmpty) ? '—' : v;

  String _bloodGroup() {
    try {
      final bg = (appt as dynamic).bloodGroup;
      return _ss(bg?.toString());
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
    final name = _ss(appt.patientName);
    final isFemale = _ss(appt.gender).toLowerCase() == 'female';
    final avatar = isFemale ? 'assets/girlicon.png' : 'assets/boyicon.png';

    return ClipRRect(
      borderRadius: BorderRadius.circular(kRadius),
      child: Container(
        decoration: BoxDecoration(
          color: kTint,
          borderRadius: BorderRadius.circular(kRadius),
          border: Border.all(color: kTintLine),
        ),
        child: Stack(
          children: [
            Positioned(
              top: 8,
              right: 8,
              child: _ghostButton(
                icon: Icons.edit_outlined,
                onTap: () {},
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
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kTintLine),
          ),
          child: Text(
            'ID: ${_ss(appt.patientId)}',
            style: GoogleFonts.lexend(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: const Color(0xFFB42318),
              letterSpacing: 0.1,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 18,
          runSpacing: 10,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _mini(isFemale ? Icons.female : Icons.male, _ss(appt.gender)),
            _mini(Icons.person, 'Age ${appt.patientAge ?? '—'}'),
            _mini(Icons.calendar_month, _ss(appt.dob)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.bloodtype, size: 16, color: _ProfileHeaderCard.kMuted),
            const SizedBox(width: 6),
            Text(
              'Blood Group: ${_bloodGroup()}',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _ProfileHeaderCard.kMuted,
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

  Widget _vitalsGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: _kv(Icons.height, 'Height', _n(appt.height, suffix: ' cm'))),
            const SizedBox(width: 24),
            Expanded(child: _kv(Icons.monitor_weight_outlined, 'Weight', _n(appt.weight, suffix: ' kg'))),
          ],
        ),
        const SizedBox(height: 20),
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

  Widget _kv(IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
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
