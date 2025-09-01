import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Models/dashboardmodels.dart';

// ---- Theme ----
const Color primaryColor = Color(0xFFEF4444);
const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color borderColor = Color(0xFFE5E7EB);
const Color successColor = Color(0xFF10B981);
const Color warningColor = Color(0xFFF59E0B);

class AppointmentDetail extends StatelessWidget {
  final DashboardAppointments appt;
  const AppointmentDetail({super.key, required this.appt});

  static Future<void> show(BuildContext context, DashboardAppointments appt) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.35),
      builder: (_) => AppointmentDetail(appt: appt),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(24),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.95,
          maxHeight: size.height * 0.95,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Material(
                color: backgroundColor,
                child: _ResponsiveScroll(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _ProfileHeaderCard(appt: appt),
                        const SizedBox(height: 16),

                        // ---- Dropdown style sections ----
                        _SectionCard(
                          icon: Icons.note_alt_outlined,
                          title: "Medical Notes",
                          description: "Previous & current notes",
                          builder: () => Align(  // 👈 force left
                            alignment: Alignment.centerLeft,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start, // 👈 stack left
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  "Previous Notes",
                                  style: GoogleFonts.lexend(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: textPrimaryColor,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  appt.previousNotes?.isNotEmpty == true
                                      ? appt.previousNotes!
                                      : "No previous notes available",
                                  style: const TextStyle(
                                    color: textSecondaryColor,
                                    fontSize: 13,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  "Current Notes",
                                  style: GoogleFonts.lexend(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: textPrimaryColor,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  appt.currentNotes ?? "No current notes",
                                  style: const TextStyle(
                                    color: textPrimaryColor,
                                    fontSize: 13,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        _SectionCard(
                          icon: Icons.local_pharmacy_outlined,
                          title: "Pharmacy",
                          description: "Prescribed medicines",
                          builder: () => _ReadOnlyTable(
                            columns: const [
                              "Medicine",
                              "Dosage",
                              "Frequency",
                              "Notes"
                            ],
                            rows: appt.pharmacy,
                          ),
                        ),
                        _SectionCard(
                          icon: Icons.biotech_outlined,
                          title: "Pathology",
                          description: "Lab investigations",
                          builder: () => _ReadOnlyTable(
                            columns: const ["Test Name","Category" ,"Priority", "Notes"],
                            rows: appt.pathology,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // ---- Floating close button ----
            Positioned(
              top: -10,
              right: -10,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () => Navigator.of(context).maybePop(),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: borderColor),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(.10),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(8),
                    child: const Icon(Icons.close_rounded,
                        color: primaryColor, size: 20),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
class _SectionCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String description;
  final Widget Function() builder;

  const _SectionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.builder,
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
      color: Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: borderColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          ListTile(
            leading: Icon(widget.icon, color: primaryColor),
            title: Text(widget.title),
            subtitle: Text(widget.description,
                style: const TextStyle(color: textSecondaryColor)),
            trailing: Icon(open
                ? Icons.keyboard_arrow_up
                : Icons.keyboard_arrow_down),
            onTap: () => setState(() => open = !open),
          ),
          if (open)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: widget.builder(),
            ),
        ],
      ),
    );
  }
}


// ---------------- Helpers ----------------
String _s(String? v) => (v == null) ? '' : v.trim();
String _n(num? v, {String? suffix}) =>
    (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';

// ---------------- Read-only Table ----------------
class _ReadOnlyTable extends StatelessWidget {
  final List<String> columns;
  final List<Map<String, String>> rows;

  const _ReadOnlyTable({required this.columns, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Table(
      border: const TableBorder(
        horizontalInside: BorderSide(width: 0.5, color: Color(0xFFE5E7EB)),
      ),
      columnWidths: {
        for (var i = 0; i < columns.length; i++) i: const FlexColumnWidth(),
      },
      children: [
        // Header
        TableRow(
          decoration: const BoxDecoration(color: Color(0xFFFEF2F2)),
          children: columns
              .map((c) => Padding(
            padding: const EdgeInsets.all(8),
            child: Text(
              c,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                color: Color(0xFF991B1B),
                fontSize: 13,
              ),
            ),
          ))
              .toList(),
        ),
        // Rows
        if (rows.isNotEmpty)
          for (int i = 0; i < rows.length; i++)
            TableRow(
              decoration: BoxDecoration(
                color: i.isEven
                    ? Colors.white
                    : const Color(0xFFFEF2F2).withOpacity(0.3),
              ),
              children: columns.map((c) {
                return Padding(
                  padding: const EdgeInsets.all(8),
                  child: Text(
                    rows[i][c] ?? "—",
                    style: const TextStyle(
                        fontSize: 13, color: textPrimaryColor),
                  ),
                );
              }).toList(),
            )
        else
          TableRow(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  "No records found",
                  style: const TextStyle(color: textSecondaryColor),
                ),
              ),
              for (int i = 1; i < columns.length; i++) const SizedBox(),
            ],
          ),
      ],
    );
  }
}

// ---------------- Existing Widgets ----------------
// Keep your _ProfileHeaderCard, _InfoCard, _CardShell, _ResponsiveScroll
// (from your pasted code above) without change

// ---------------- Helpers ----------------
// String _s(String? v) => (v == null) ? '' : v.trim();
// String _n(num? v, {String? suffix}) =>
//     (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';

// ---------------- Widgets ----------------

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

class _InfoCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final EdgeInsetsGeometry padding;
  const _InfoCard({
    required this.title,
    required this.children,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return _CardShell(
      child: Padding(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 8),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _KeyValueRow extends StatelessWidget {
  final String label;
  final String value;
  const _KeyValueRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 160,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: textSecondaryColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 14,
                color: textPrimaryColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final String label;
  final String value;
  const _StatusRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          const SizedBox(
            width: 160,
            child: Text(
              'Status',
              style: TextStyle(
                fontSize: 14,
                color: textSecondaryColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Align(
              alignment: Alignment.centerRight,
              child: _StatusChip(status: value),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final s = status.trim().toLowerCase();
    Color bg;
    Color fg;
    if (s.contains('complete') || s.contains('done')) {
      bg = successColor.withOpacity(.12);
      fg = successColor;
    } else if (s.contains('pending') || s.contains('wait')) {
      bg = warningColor.withOpacity(.12);
      fg = warningColor;
    } else {
      bg = primaryColor.withOpacity(.12);
      fg = primaryColor;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withOpacity(.25)),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: fg,
        ),
      ),
    );
  }
}

class _CardShell extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  const _CardShell({
    required this.child,
    this.padding = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Container(
        decoration: BoxDecoration(
          color: cardBackgroundColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
          boxShadow: const [
            BoxShadow(
              color: Color(0x11000000),
              blurRadius: 16,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}

class _ResponsiveScroll extends StatelessWidget {
  final Widget child;
  const _ResponsiveScroll({required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: child,
          ),
        );
      },
    );
  }
}
