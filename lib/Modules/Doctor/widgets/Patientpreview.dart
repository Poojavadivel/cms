import 'package:flutter/material.dart';

// ======================= THEME =======================
// --- App Theme Colors ---
const Color primaryColor = Color(0xFFCF1717);
const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF333333);
const Color textSecondaryColor = Color(0xFF666666);

// Specific colors used in the table
const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _intakeButtonColor = Color(0xFFF87171);

// ======================= MODEL (lightweight, adapt to your own) =======================
class PrescriptionRow {
  final String medicine;
  final String dosage;
  final String duration;
  final String frequency;
  final String notes;

  PrescriptionRow({
    required this.medicine,
    required this.dosage,
    required this.duration,
    required this.frequency,
    required this.notes,
  });
}

class AppointmentPreviewData {
  final String patientName;
  final String avatarUrl; // can be blank to show placeholder
  final String gender; // ♂ / ♀ / Other
  final int age;
  final double bmi;
  final double weightKg;
  final double heightCm;
  final String bloodPressure; // e.g., 124/80
  final List<String> diagnoses; // chips (red)
  final List<String> barriers; // chips (orange)
  final List<PrescriptionRow> prescriptions;

  AppointmentPreviewData({
    required this.patientName,
    this.avatarUrl = '',
    required this.gender,
    required this.age,
    required this.bmi,
    required this.weightKg,
    required this.heightCm,
    required this.bloodPressure,
    this.diagnoses = const [],
    this.barriers = const [],
    this.prescriptions = const [],
  });
}

// ======================= ENTRY POINT =======================
Future<void> showDoctorAppointmentPreview(
    BuildContext context, {
      required AppointmentPreviewData data,
    }) async {
  await showDialog(
    context: context,
    barrierDismissible: true,
    builder: (_) => _AppointmentPreviewDialog(data: data),
  );
}

// ======================= DIALOG =======================
class _AppointmentPreviewDialog extends StatefulWidget {
  final AppointmentPreviewData data;
  const _AppointmentPreviewDialog({required this.data});

  @override
  State<_AppointmentPreviewDialog> createState() =>
      _AppointmentPreviewDialogState();
}

class _AppointmentPreviewDialogState extends State<_AppointmentPreviewDialog>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 5, vsync: this, initialIndex: 2); // Prescription default
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final maxDialogWidth = w < 720 ? w - 24 : 1100.0;

    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxDialogWidth, maxHeight: 700),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Material(
            color: backgroundColor,
            child: Column(
              children: [
                _HeaderBar(onClose: () => Navigator.of(context).pop()),
                const SizedBox(height: 8),
                // ======= SINGLE PROFILE CARD (like your 2nd image) =======
                _ProfileSummaryCard(data: widget.data),
                const SizedBox(height: 8),
                // ======= TABS =======
                _Tabs(controller: _tab),
                const Divider(height: 1),
                Expanded(
                  child: TabBarView(
                    controller: _tab,
                    children: [
                      _DoctorCheckupTab(),
                      _PathologyTab(),
                      _PrescriptionTab(rows: widget.data.prescriptions),
                      _AnalyticsTab(),
                      _BillingTab(),
                    ],
                  ),
                ),
                // Bottom actions
                Container(
                  decoration: const BoxDecoration(
                    color: cardBackgroundColor,
                    border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Close'),
                      ),
                      const Spacer(),
                      OutlinedButton.icon(
                        onPressed: () {
                          // TODO: wire up print prescription
                        },
                        icon: const Icon(Icons.print_outlined),
                        label: const Text('Print prescription'),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: _searchBorderColor),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: () {
                          // TODO: Save/continue flow
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _buttonBgColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 18, vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Save & Continue'),
                      ),
                    ],
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

// ======================= HEADER BAR =======================
class _HeaderBar extends StatelessWidget {
  final VoidCallback onClose;
  const _HeaderBar({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: cardBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(Icons.local_hospital_outlined, color: primaryColor),
          const SizedBox(width: 8),
          const Text(
            'Appointment Preview',
            style: TextStyle(
              color: textPrimaryColor,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          IconButton(
            onPressed: onClose,
            splashRadius: 20,
            icon: const Icon(Icons.close_rounded, color: textSecondaryColor),
          ),
        ],
      ),
    );
  }
}

// ======================= PROFILE SUMMARY (matches 2nd image style) =======================
class _ProfileSummaryCard extends StatelessWidget {
  final AppointmentPreviewData data;
  const _ProfileSummaryCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(
            color: Color(0x11000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      child: LayoutBuilder(
        builder: (ctx, c) {
          final isNarrow = c.maxWidth < 680;
          final avatar = CircleAvatar(
            radius: 32,
            backgroundColor: const Color(0xFFF1F5F9),
            backgroundImage: data.avatarUrl.isEmpty ? null : NetworkImage(data.avatarUrl),
            child: data.avatarUrl.isEmpty
                ? const Icon(Icons.person, size: 36, color: textSecondaryColor)
                : null,
          );

          final title = Text(
            data.patientName,
            style: const TextStyle(
              color: textPrimaryColor,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          );

          final vitals = Wrap(
            spacing: 28,
            runSpacing: 10,
            children: [
              _VitalStat(value: '${data.bmi}', label: 'BMI'),
              _VitalStat(value: '${data.weightKg.toStringAsFixed(0)}kg', label: 'Weight > 65kg'),
              _VitalStat(value: '${data.heightCm.toStringAsFixed(0)}cm', label: 'Height'),
              _VitalStat(value: data.bloodPressure, label: 'Blood P. (mmHg) > 30'),
            ],
          );

          final chips = Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ...data.diagnoses
                  .map((e) => _chip(e, bg: const Color(0xFFFFE2E2), fg: const Color(0xFFB42318))),
              ...data.barriers
                  .map((e) => _chip(e, bg: const Color(0xFFFFF1D6), fg: const Color(0xFFB26B14))),
            ],
          );

          final editBtn = OutlinedButton(
            onPressed: () {
              // TODO: Navigate to edit patient header
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: textSecondaryColor,
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            child: const Text('Edit'),
          );

          if (isNarrow) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [avatar, const SizedBox(width: 12), Expanded(child: title), editBtn]),
                const SizedBox(height: 16),
                vitals,
                const SizedBox(height: 10),
                chips,
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              avatar,
              const SizedBox(width: 16),
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    title,
                    const SizedBox(height: 8),
                    vitals,
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(flex: 2, child: chips),
              const SizedBox(width: 12),
              editBtn,
            ],
          );
        },
      ),
    );
  }

  Widget _chip(String text, {required Color bg, required Color fg}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

class _VitalStat extends StatelessWidget {
  final String value;
  final String label;
  const _VitalStat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style: const TextStyle(
                fontWeight: FontWeight.w800, color: textPrimaryColor, fontSize: 18)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: textSecondaryColor, fontSize: 12)),
      ],
    );
  }
}

// ======================= TABS HEADER =======================
class _Tabs extends StatelessWidget {
  final TabController controller;
  const _Tabs({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: backgroundColor,
      padding: const EdgeInsets.only(left: 24, right: 24, top: 6),
      child: TabBar(
        controller: controller,
        isScrollable: true,
        labelPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        indicator: UnderlineTabIndicator(
          borderSide: const BorderSide(color: primaryColor, width: 3),
          insets: const EdgeInsets.only(bottom: 4),
        ),
        labelColor: primaryColor,
        unselectedLabelColor: textSecondaryColor,
        tabs: const [
          Tab(text: 'DOCTOR CHECK UP'),
          Tab(text: 'PATHOLOGY'),
          Tab(text: 'PRESCRIPTION'),
          Tab(text: 'ANALYTICS'),
          Tab(text: 'BILLING'),
        ],
      ),
    );
  }
}

// ======================= TAB PAGES =======================
class _DoctorCheckupTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _BlankCard(
      child: Center(
        child: Text(
          'Doctor notes & vitals will appear here.',
          style: TextStyle(color: textSecondaryColor.withOpacity(0.9)),
        ),
      ),
    );
  }
}

class _PathologyTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _BlankCard(
      child: Center(
        child: Text(
          'Pathology reports placeholder.',
          style: TextStyle(color: textSecondaryColor.withOpacity(0.9)),
        ),
      ),
    );
  }
}

class _AnalyticsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _BlankCard(
      child: Center(
        child: Text(
          'Longitudinal analytics placeholder.',
          style: TextStyle(color: textSecondaryColor.withOpacity(0.9)),
        ),
      ),
    );
  }
}

class _BillingTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _BlankCard(
      child: Center(
        child: Text(
          'Billing details & invoices placeholder.',
          style: TextStyle(color: textSecondaryColor.withOpacity(0.9)),
        ),
      ),
    );
  }
}

// ======================= PRESCRIPTION TABLE =======================
class _PrescriptionTab extends StatelessWidget {
  final List<PrescriptionRow> rows;
  const _PrescriptionTab({required this.rows});

  @override
  Widget build(BuildContext context) {
    return _BlankCard(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        children: [
          _PrescriptionHeader(),
          const Divider(height: 1),
          Expanded(
            child: Scrollbar(
              thumbVisibility: true,
              child: ListView.separated(
                itemCount: rows.isEmpty ? 1 : rows.length,
                separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                itemBuilder: (context, index) {
                  if (rows.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Center(
                        child: Text(
                          'No prescriptions added.',
                          style: TextStyle(color: textSecondaryColor.withOpacity(0.9)),
                        ),
                      ),
                    );
                  }
                  final r = rows[index];
                  return Container(
                    color: index.isEven ? Colors.white : _rowAlternateColor,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        _cell(flex: 22, child: Text(r.medicine, style: _rowText)),
                        _cell(flex: 16, child: Text(r.dosage, style: _rowText)),
                        _cell(flex: 16, child: Text(r.duration, style: _rowText)),
                        _cell(flex: 18, child: Text(r.frequency, style: _rowText)),
                        _cell(flex: 28, child: Text(r.notes, style: _rowText)),
                        IconButton(
                          onPressed: () {},
                          icon: const Icon(Icons.keyboard_arrow_down_rounded,
                              color: textSecondaryColor),
                          tooltip: 'More',
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  static const TextStyle _rowText =
  TextStyle(color: textPrimaryColor, fontSize: 13, fontWeight: FontWeight.w500);

  Widget _cell({required int flex, required Widget child}) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: child,
      ),
    );
  }
}

class _PrescriptionHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final headerStyle = const TextStyle(
      color: _tableHeaderColor,
      fontWeight: FontWeight.w700,
      fontSize: 12,
      letterSpacing: .2,
    );

    Widget col(String text, {int flex = 1}) => Expanded(
      flex: flex,
      child: Row(
        children: [
          Text(text.toUpperCase(), style: headerStyle),
          const SizedBox(width: 4),
          const Icon(Icons.arrow_drop_up, size: 18, color: _appointmentsHeaderColor),
        ],
      ),
    );

    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      color: const Color(0xFFFFF7F7),
      child: Row(
        children: [
          col('Medicine', flex: 22),
          col('Dosage', flex: 16),
          col('Duration', flex: 16),
          col('Frequency', flex: 18),
          col('Notes', flex: 28),
          const SizedBox(width: 34), // space for dropdown icon
        ],
      ),
    );
  }
}

// ======================= SHARED =======================
class _BlankCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  const _BlankCard({required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(color: Color(0x0F000000), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: padding ?? const EdgeInsets.all(0),
        child: child,
      ),
    );
  }
}
