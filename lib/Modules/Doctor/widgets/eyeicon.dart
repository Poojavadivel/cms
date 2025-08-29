import 'package:flutter/material.dart';
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

class AppointmentDetailPage extends StatelessWidget {
  final DashboardAppointments appt;
  const AppointmentDetailPage({super.key, required this.appt});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Center(
          child: FractionallySizedBox(
            widthFactor: 0.92,
            heightFactor: 0.92,
            child: Container(
              constraints: const BoxConstraints(maxWidth: 1200),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: backgroundColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  // ---- Main content ----
                  _ResponsiveScroll(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // ---- Mythic profile header ----
                        _ProfileHeaderCard(appt: appt),
                        const SizedBox(height: 16),

                        // ---- Content Grid ----
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final isWide = constraints.maxWidth >= 900;
                            final colW = isWide
                                ? (constraints.maxWidth - 16) / 2
                                : constraints.maxWidth;

                            return Wrap(
                              spacing: 16,
                              runSpacing: 16,
                              children: [
                                SizedBox(
                                  width: colW,
                                  child: _InfoCard(
                                    title: 'Patient Info',
                                    children: [
                                      _KeyValueRow('Patient Name', _s(appt.patientName)),
                                      _KeyValueRow('Age', _s(appt.patientAge?.toString())),
                                      _KeyValueRow('Gender', _s(appt.gender)),
                                      _KeyValueRow('Reason', _s(appt.reason)),
                                    ],
                                  ),
                                ),
                                SizedBox(
                                  width: colW,
                                  child: _InfoCard(
                                    title: 'Appointment Info',
                                    children: [
                                      _KeyValueRow('Date', _s(appt.date)),
                                      _KeyValueRow('Time', _s(appt.time)),
                                      _StatusRow('Status', _s(appt.status)),
                                      _KeyValueRow('Service', _s(appt.service)),
                                    ],
                                  ),
                                ),
                                SizedBox(
                                  width: constraints.maxWidth,
                                  child: _InfoCard(
                                    title: 'Notes',
                                    children: [
                                      Text(
                                        _s(appt.notes).isEmpty
                                            ? 'No additional notes'
                                            : _s(appt.notes),
                                        style: const TextStyle(
                                          color: textSecondaryColor,
                                          height: 1.45,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  // ---- Page-level close (NOT inside profile card) ----
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => Navigator.maybePop(context),
                        customBorder: const CircleBorder(),
                        child: Ink(
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFFFFEBEE),
                          ),
                          padding: const EdgeInsets.all(8),
                          child: const Icon(Icons.close, size: 22, color: primaryColor),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------- Helpers ----------------
String _s(String? v) => (v == null) ? '' : v.trim();
String _n(num? v, {String? suffix}) =>
    (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';

// ---------------- Widgets ----------------

class _ProfileHeaderCard extends StatelessWidget {
  final DashboardAppointments appt;
  const _ProfileHeaderCard({required this.appt});

  String _bloodGroup() {
    try {
      final bg = (appt as dynamic).bloodGroup;
      return _s(bg?.toString()).isEmpty ? '—' : _s(bg?.toString());
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFemale = _s(appt.gender).toLowerCase() == 'female';
    final avatar = isFemale ? 'assets/girlicon.png' : 'assets/boyicon.png';

    return _CardShell(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ---- LEFT: Avatar + Name + ID + Meta ----
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Avatar
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB), width: 1.5),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x08000000),
                          blurRadius: 6,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.asset(
                        avatar,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                        const Icon(Icons.person, size: 42, color: textSecondaryColor),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),

                  Flexible(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _s(appt.patientName).isEmpty ? '—' : _s(appt.patientName),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: textPrimaryColor,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // ID pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F2),
                            border: Border.all(color: const Color(0xFFFFE4E6)),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'ID: ${_s((appt as dynamic).patientId?.toString()).isEmpty ? '—' : _s((appt as dynamic).patientId?.toString())}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFB42318),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 10,
                          runSpacing: 8,
                          children: [
                            _MetaChip(icon: Icons.transgender, label: _s(appt.gender).isEmpty ? '—' : _s(appt.gender)),
                            _MetaChip(icon: Icons.cake, label: '${_s(appt.patientAge?.toString()).isEmpty ? '—' : _s(appt.patientAge?.toString())} yrs'),
                            _MetaChip(icon: Icons.event, label: _s(appt.date).isEmpty ? '—' : _s(appt.date)),
                            _MetaChip(icon: Icons.access_time, label: _s(appt.time).isEmpty ? '—' : _s(appt.time)),
                            _StatusChip(status: _s(appt.status).isEmpty ? '—' : _s(appt.status)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 12),

            // ---- RIGHT: KPI GRID + actions top-right ----
            ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 360, maxWidth: 420),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      _ActionBtn(tooltip: 'Preview', icon: Icons.visibility_outlined, onTap: () {}),
                      const SizedBox(width: 8),
                      _ActionBtn(tooltip: 'Edit', icon: Icons.edit_outlined, onTap: () {}),
                      const SizedBox(width: 8),
                      _ActionBtn(tooltip: 'Intake', icon: Icons.assignment_outlined, onTap: () {}),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Table(
                    columnWidths: const {0: FlexColumnWidth(), 1: FlexColumnWidth()},
                    defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                    children: [
                      TableRow(children: [
                        _kpiTile(_Metric(Icons.scale, 'BMI', _n((appt as dynamic).bmi))),
                        _kpiTile(_Metric(Icons.monitor_weight_outlined, 'Weight', _n((appt as dynamic).weight, suffix: ' kg'))),
                      ]),
                      TableRow(children: [
                        _kpiTile(_Metric(Icons.height, 'Height', _n((appt as dynamic).height, suffix: ' cm'))),
                        _kpiTile(_Metric(Icons.bloodtype, 'Blood Group', _bloodGroup())),
                      ]),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpiTile(_Metric m) {
    return Padding(
      padding: const EdgeInsets.all(6),
      child: Container(
        padding: const EdgeInsets.all(12),
        constraints: const BoxConstraints(minHeight: 64),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor),
          boxShadow: const [
            BoxShadow(
              color: Color(0x08000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: const Color(0xFFFFE4E6),
              ),
              child: Icon(m.icon, size: 18, color: primaryColor),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  m.value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: textPrimaryColor,
                  ),
                ),
                Text(
                  m.title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: textSecondaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final EdgeInsetsGeometry padding; // optional, default below
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

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textSecondaryColor),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: textPrimaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final String tooltip;
  final IconData icon;
  final VoidCallback onTap;
  final EdgeInsetsGeometry padding; // optional
  const _ActionBtn({
    required this.tooltip,
    required this.icon,
    required this.onTap,
    this.padding = const EdgeInsets.all(0),
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      preferBelow: false,
      child: Padding(
        padding: padding, // optional external spacing
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Ink(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: cardBackgroundColor,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: borderColor),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, size: 18, color: textPrimaryColor),
          ),
        ),
      ),
    );
  }
}

class _CardShell extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding; // optional external padding (if needed)
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

class _Metric {
  final IconData icon;
  final String title;
  final String value;
  _Metric(this.icon, this.title, this.value);
}
