import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Models/dashboardmodels.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class DoctorAppointmentPreview extends StatefulWidget {
  final DashboardAppointments appointment;
  const DoctorAppointmentPreview({super.key, required this.appointment});

  @override
  State<DoctorAppointmentPreview> createState() =>
      _DoctorAppointmentPreviewState();
}


class _DoctorAppointmentPreviewState extends State<DoctorAppointmentPreview>
    with SingleTickerProviderStateMixin {
  // THEME
  static const Color kPrimary = Color(0xFFEF4444);
  static const Color kBg = Color(0xFFF9FAFB);
  static const Color kCard = Colors.white;
  static const Color kText = Color(0xFF111827);
  static const Color kMuted = Color(0xFF6B7280);
  static const Color kBorder = Color(0xFFE5E7EB);
  static const double kRadius = 16;


  late final TabController _tab;
  late final TextStyle baseText;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
    baseText = GoogleFonts.inter();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appt = widget.appointment;
    final size = MediaQuery.of(context).size;

    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      backgroundColor: Colors.transparent,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.95,
          maxHeight: size.height * 0.95,
        ),
        child: Stack(
          clipBehavior: Clip.none, // allow floating button outside
          children: [
            // ============== ROUNDED DIALOG SURFACE ==============
            ClipRRect(
              borderRadius: BorderRadius.circular(kRadius),
              child: Material(
                color: kBg,
                child: Column(
                  children: [
                    Expanded(
                      child: Padding(
                        // tight top padding so header stays high
                        padding: const EdgeInsets.fromLTRB(12, 16, 12, 12),
                        child: Column(
                          children: [
                            // ---------- CONTAINER 1 : PATIENT HEADER ----------
                            Container(
                              decoration: BoxDecoration(
                                color: kCard,
                                borderRadius: BorderRadius.circular(kRadius),
                                border: Border.all(color: kBorder),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(.06),
                                    blurRadius: 18,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                              child: _ProfileHeaderCard(appt: appt),
                            ),

                            const SizedBox(height: 12),

                            // ---------- CONTAINER 2 : TABS + CONTENT ----------
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  color: kCard,
                                  borderRadius: BorderRadius.circular(kRadius),
                                  border: Border.all(color: kBorder),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(.05),
                                      blurRadius: 12,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // enterprise top bar with divider
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8),
                                      decoration: BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(color: kBorder),
                                        ),
                                      ),
                                      child: TabBar(
                                        controller: _tab,
                                        isScrollable: true,
                                        indicator: const UnderlineTabIndicator(
                                          borderSide: BorderSide(color: kPrimary, width: 3),
                                          insets: EdgeInsets.symmetric(horizontal: 16),
                                        ),
                                        labelColor: kPrimary,
                                        unselectedLabelColor: kMuted,
                                        labelStyle: GoogleFonts.lexend(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        unselectedLabelStyle: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                        ),
                                        tabs: const [
                                          Tab(text: 'Overview'),
                                          Tab(text: 'Patient Profile'),
                                          Tab(text: 'Medications'),
                                          Tab(text: 'Lab Results'),
                                        ],
                                      ),
                                    ),

                                    // content
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: TabBarView(
                                          controller: _tab,
                                          children: [
                                            _OverviewTab(
                                              text: baseText,
                                              pName: appt.patientName,
                                              pGender: appt.gender,
                                              pLoc: appt.location.isEmpty ? '—' : appt.location,
                                              pJob: appt.occupation.isEmpty ? '—' : appt.occupation,
                                              pDob: appt.dob.isEmpty ? '—' : appt.dob,
                                              pBMI: appt.bmi == 0 ? '—' : '${appt.bmi}',
                                              pWt: appt.weight == 0 ? '—' : '${appt.weight}',
                                              pHt: appt.height == 0 ? '—' : '${appt.height}',
                                              pBp: appt.bp.isEmpty ? '—' : appt.bp,
                                              ownDx: appt.diagnosis,
                                              barriers: appt.barriers,
                                              timeline: appt.timeline,
                                              medHistory: appt.history,
                                              date: appt.date,
                                              time: appt.time,
                                              reason: appt.reason,
                                              status: appt.status,
                                            ),
                                            _PatientProfileTab(
                                              patientId: appt.patientId,
                                              name: appt.patientName,
                                              gender: appt.gender,
                                              dob: appt.dob.isEmpty ? '—' : appt.dob,
                                              age: '${appt.patientAge}',
                                              phone: '—',
                                              email: '—',
                                              address: appt.location.isEmpty ? '—' : appt.location,
                                              doctorName: appt.doctor,
                                              primaryDiagnosis: appt.diagnosis.isNotEmpty
                                                  ? appt.diagnosis.first
                                                  : '—',
                                              diagnoses: appt.diagnosis,
                                              allergies: const [],
                                              chronicConditions: const [],
                                              height: appt.height == 0 ? '—' : '${appt.height}',
                                              weight: appt.weight == 0 ? '—' : '${appt.weight}',
                                              bmi: appt.bmi == 0 ? '—' : '${appt.bmi}',
                                              bp: appt.bp.isEmpty ? '—' : appt.bp,
                                              heartRate: '—',
                                              emergencyContactName: '—',
                                              emergencyContactPhone: '—',
                                            ),
                                            const _MedicationsTab(),
                                            _LabsTab(rows: const [], text: baseText),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ============== FLOATING CLOSE BUTTON (OUTSIDE) ==============
            Positioned(
              top: -10,       // negative to sit OUTSIDE the rounded dialog
              right: -10,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(28),
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: kBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(.10),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.close_rounded, size: 20, color: kMuted),
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
/// ===================== PROFILE HEADER CARD =====================
 // for Clipboard




class _ProfileHeaderCard extends StatelessWidget {
  final DashboardAppointments appt;
  const _ProfileHeaderCard({required this.appt});

  // helpers
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

  @override
  Widget build(BuildContext context) {
    final isFemale = (_s(appt.gender)).toLowerCase() == 'female';
    final avatar = isFemale ? 'assets/girlicon.png' : 'assets/boyicon.png';

    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: _DoctorAppointmentPreviewState.kBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- LEFT: Identity Block
            _identityBlock(context, avatar, isFemale),

            const Spacer(),

            // --- RIGHT: KPI Grid (2x2)
            ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 340, maxWidth: 420),
              child: _kpiGrid(items: _kpis()),
            ),

            // --- ACTION: Edit Icon
            // IconButton(
            //   icon: const Icon(Icons.edit, color: Color(0xFF6B7280)),
            //   tooltip: "Edit patient",
            //   onPressed: () {
            //     // wire your edit action
            //   },
            // ),
          ],
        ),
      ),
    );
  }

  /// ---------------- LEFT SIDE: Identity block ----------------
  /// ---------------- LEFT SIDE: Identity block ----------------
  Widget _identityBlock(BuildContext context, String avatar, bool isFemale) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Avatar (square, bigger)
        Container(
          width: 138,
          height: 138,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12), // 👈 square with subtle rounding
            border: Border.all(color: const Color(0xFFE5E7EB), width: 2),
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
              errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 72),
            ),
          ),
        ),
        const SizedBox(width: 20),

        // Patient Info
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _s(appt.patientName),
              style: GoogleFonts.lexend(
                fontSize: 24, // 👈 bump up to match larger avatar
                fontWeight: FontWeight.w700,
                color: _DoctorAppointmentPreviewState.kText,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                border: Border.all(color: const Color(0xFFFFE4E6)),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'ID: ${_s(appt.patientId)}',
                style: GoogleFonts.lexend(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFB42318),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 14,
              runSpacing: 6,
              children: [
                _mini(isFemale ? Icons.female : Icons.male, _s(appt.gender)),
                _mini(Icons.person, 'Age ${appt.patientAge}'),
                _mini(Icons.calendar_month, _s(appt.dob)),
                if (_s(appt.occupation) != '—')
                  _mini(Icons.work_outline, _s(appt.occupation)),
                if (_s(appt.location) != '—')
                  _mini(Icons.place_outlined, _s(appt.location)),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _mini(IconData i, String t) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(i, size: 14, color: _DoctorAppointmentPreviewState.kMuted),
      const SizedBox(width: 4),
      Text(
        t,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: _DoctorAppointmentPreviewState.kMuted,
        ),
      ),
    ],
  );

  /// ---------------- RIGHT SIDE: KPI GRID ----------------
  List<_Metric> _kpis() => [
    _Metric(Icons.scale, 'BMI', _n(appt.bmi)),
    _Metric(Icons.monitor_weight_outlined, 'Weight', _n(appt.weight, suffix: ' kg')),
    _Metric(Icons.height, 'Height', _n(appt.height, suffix: ' cm')),
    _Metric(Icons.bloodtype, 'Blood Group', _bloodGroup()),
  ];

  Widget _kpiGrid({required List<_Metric> items}) {
    return Table(
      columnWidths: const {0: FlexColumnWidth(), 1: FlexColumnWidth()},
      children: [
        TableRow(children: [_kpiTile(items[0]), _kpiTile(items[1])]),
        TableRow(children: [_kpiTile(items[2]), _kpiTile(items[3])]),
      ],
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
          border: Border.all(color: _DoctorAppointmentPreviewState.kBorder),
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
              child: Icon(m.icon, size: 18, color: const Color(0xFFB42318)),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  m.value,
                  style: GoogleFonts.lexend(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: _DoctorAppointmentPreviewState.kText,
                  ),
                ),
                Text(
                  m.title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: _DoctorAppointmentPreviewState.kMuted,
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

class _Metric {
  final IconData icon;
  final String title;
  final String value;
  _Metric(this.icon, this.title, this.value);
}


// metric model



// Simple metric model (unchanged)


/// ===================== TABS (lean, essential only) =====================




class _OverviewTab extends StatelessWidget {
  // ---- Incoming (unchanged) ----
  final TextStyle text;
  final String pName, pGender, pLoc, pJob, pDob, pBMI, pWt, pHt, pBp;
  final List<String> ownDx, barriers;
  final List<Map<String, dynamic>> timeline;
  final Map<String, String> medHistory;
  final String date, time, reason, status;

  const _OverviewTab({
    required this.text,
    required this.pName,
    required this.pGender,
    required this.pLoc,
    required this.pJob,
    required this.pDob,
    required this.pBMI,
    required this.pWt,
    required this.pHt,
    required this.pBp,
    required this.ownDx,
    required this.barriers,
    required this.timeline,
    required this.medHistory,
    required this.date,
    required this.time,
    required this.reason,
    required this.status,
  });

  // ---- Local palette / metrics ----
  static const Color kText = Color(0xFF0B1324);
  static const Color kMuted = Color(0xFF64748B);
  static const Color kCard = Colors.white;
  static const Color kSurface = Color(0xFFF7F8FA);
  static const Color kBorder = Color(0xFFE5E7EB);
  static const Color kPrimary = Color(0xFFEF4444);
  static const Color kSuccess = Color(0xFF16A34A);
  static const Color kWarn = Color(0xFFF59E0B);
  static const Color kInfo = Color(0xFF3B82F6);
  static const double kRadius = 16;

  @override
  Widget build(BuildContext context) {
    final themeText = GoogleFonts.inter(
      textStyle: text.copyWith(color: kText, height: 1.25),
    );

    // ⛔️ Removed the outer Container(color: kSurface)
    // so this widget blends perfectly into the parent card.
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 980;
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            // _heroCard(themeText), // (kept available but not used)
            const SizedBox(height: 14),

            _ResponsiveGrid(
              isWide: isWide,
              children: [
                // 1) Appointment
                _sectionCard(
                  icon: Icons.event_note_rounded,
                  title: 'Appointment',
                  child: _keyValues(themeText, {
                    'Date': date,
                    'Time': time,
                    'Reason': reason,
                    'Status': status,
                  }),
                  trailing: _statusBadge(status),
                ),

                // 2) Address (separate card)
                _sectionCard(
                  icon: Icons.place_rounded,
                  title: 'Address',
                  child: _keyValues(
                    themeText,
                    {
                      'Address': pLoc.isEmpty ? '—' : pLoc,
                    },
                  ),
                ),

                // 3) Diagnosis
                _sectionCard(
                  icon: Icons.coronavirus_rounded,
                  title: 'Diagnosis',
                  child: ownDx.isEmpty
                      ? _emptyLine()
                      : Wrap(
                    spacing: 8,
                    runSpacing: 10,
                    children: ownDx
                        .map((e) => _chip(
                      e,
                      bg: const Color(0xFFFFEEF0),
                      fg: const Color(0xFFB42318),
                      leading: Icons.verified_rounded,
                    ))
                        .toList(),
                  ),
                ),

                // 4) Medical History
                _sectionCard(
                  icon: Icons.history_edu_rounded,
                  title: 'Medical History',
                  child: medHistory.isEmpty
                      ? _emptyLine()
                      : Column(
                    children: medHistory.entries
                        .map((e) => _kv(
                      _titleCase(e.key),
                      e.value,
                      themeText,
                    ))
                        .toList(),
                  ),
                ),

                // 5) Health Barriers
                _sectionCard(
                  icon: Icons.block_rounded,
                  title: 'Health Barriers',
                  child: barriers.isEmpty
                      ? _emptyLine()
                      : Wrap(
                    spacing: 8,
                    runSpacing: 10,
                    children: barriers
                        .map((e) => _chip(
                      e,
                      bg: const Color(0xFFFFF7ED),
                      fg: const Color(0xFFB45309),
                      leading: Icons.warning_amber_rounded,
                    ))
                        .toList(),
                  ),
                ),

                // 6) Timeline
                _sectionCard(
                  icon: Icons.timeline_rounded,
                  title: 'Timeline',
                  child: _timelineView(timeline),
                ),
              ],
            )

          ],
        );
      },
    );
  }

  // ---------------- UI Blocks ----------------

  Widget _heroCard(TextStyle themeText) {
    return _elevatedCard(
      borderGradient: LinearGradient(
        colors: [kPrimary.withOpacity(.15), Colors.transparent],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _avatarSquare(name: pName),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(pName,
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            height: 1.1,
                            fontWeight: FontWeight.w800,
                            color: kText,
                          )),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 12,
                        runSpacing: 6,
                        children: [
                          _metaPill(Icons.person_rounded, pGender),
                          _metaPill(Icons.work_outline_rounded, pJob),
                          _metaPill(Icons.cake_outlined, pDob),
                          _metaPill(Icons.place_outlined, pLoc),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _statusBadge(status),
              ],
            ),
            const SizedBox(height: 16),
            _statsRow(),
          ],
        ),
      ),
    );
  }

  Widget _metaPill(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: kBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: kMuted),
          const SizedBox(width: 6),
          Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              color: kText,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsRow() {
    final items = [
      _statTile('BMI', pBMI, Icons.monitor_weight_rounded,
          gradient: const LinearGradient(
              colors: [Color(0xFFFFE2E5), Color(0xFFFFF1F2)])),
      _statTile('BP', pBp, Icons.favorite_rounded,
          gradient: const LinearGradient(
              colors: [Color(0xFFE0EAFF), Color(0xFFF0F7FF)])),
      _statTile('Height', pHt, Icons.height_rounded,
          gradient: const LinearGradient(
              colors: [Color(0xFFE6F4EA), Color(0xFFF3FAF5)])),
      _statTile('Weight', pWt, Icons.fitness_center_rounded,
          gradient: const LinearGradient(
              colors: [Color(0xFFFFF3D6), Color(0xFFFFF9EC)])),
    ];

    return LayoutBuilder(builder: (_, c) {
      final isTight = c.maxWidth < 640;
      return Wrap(
        spacing: 12,
        runSpacing: 12,
        children: items
            .map((w) => SizedBox(
          width: isTight ? (c.maxWidth) : (c.maxWidth - 36) / 4,
          child: w,
        ))
            .toList(),
      );
    });
  }

  Widget _statTile(String title, String value, IconData icon,
      {Gradient? gradient}) {
    return _elevatedCard(
      background: null,
      borderGradient: gradient,
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(kRadius),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: kBorder),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 18, color: kText),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: GoogleFonts.inter(
                          fontSize: 12,
                          color: kMuted,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(value,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: kText,
                        height: 1.0,
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    final s = (status).toLowerCase();
    Color bg = const Color(0xFFEFF6FF);
    Color fg = kInfo;
    IconData ic = Icons.schedule_rounded;

    if (s.contains('completed')) {
      bg = const Color(0xFFECFDF5);
      fg = kSuccess;
      ic = Icons.verified_rounded;
    } else if (s.contains('cancel')) {
      bg = const Color(0xFFFFF1F2);
      fg = const Color(0xFFDC2626);
      ic = Icons.cancel_rounded;
    } else if (s.contains('resched') || s.contains('pending')) {
      bg = const Color(0xFFFFFBEB);
      fg = kWarn;
      ic = Icons.update_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: bg.withOpacity(.7)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(ic, size: 16, color: fg),
          const SizedBox(width: 8),
          Text(
            _titleCase(status),
            style: GoogleFonts.inter(
                fontWeight: FontWeight.w800, fontSize: 12, color: fg),
          ),
        ],
      ),
    );
  }

  // ---- Section Card ----
  Widget _sectionCard({
    required IconData icon,
    required String title,
    required Widget child,
    Widget? trailing,
  }) {
    return _elevatedCard(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: kPrimary.withOpacity(.07),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, size: 18, color: kPrimary),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w800,
                      color: kText,
                      fontSize: 14.5,
                    ),
                  ),
                ),
                if (trailing != null) trailing,
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }

  // ---- Key/Value Block ----
  Widget _keyValues(TextStyle base, Map<String, String> data) {
    return Column(
      children: data.entries
          .map((e) => _kv(e.key, e.value, base))
          .toList(growable: false),
    );
  }

  Widget _kv(String k, String v, TextStyle base) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      children: [
        Expanded(
          child: Text(k,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: kMuted,
                fontWeight: FontWeight.w600,
              )),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            v.isEmpty ? '—' : v,
            textAlign: TextAlign.right,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
                fontSize: 13.5, color: kText, fontWeight: FontWeight.w800),
          ),
        ),
      ],
    ),
  );

  // ---- Chips ----
  Widget _chip(String label,
      {required Color bg, required Color fg, IconData? leading}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: bg.withOpacity(.7)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leading != null) ...[
            Icon(leading, size: 14, color: fg),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              color: fg,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  // ---- Timeline ----
  Widget _timelineView(List<Map<String, dynamic>> items) {
    if (items.isEmpty) return _emptyLine();

    return Column(
      children: [
        for (int i = 0; i < items.length; i++)
          _timelineTile(
            title: (items[i]['title'] ?? '—').toString(),
            desc: (items[i]['desc'] ?? '').toString(),
            date: (items[i]['date'] ?? '').toString(),
            isFirst: i == 0,
            isLast: i == items.length - 1,
            accent: i == 0 ? kPrimary : kInfo,
          ),
      ],
    );
  }

  Widget _timelineTile({
    required String title,
    required String desc,
    required String date,
    required bool isFirst,
    required bool isLast,
    required Color accent,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: accent, width: 3),
                shape: BoxShape.circle,
              ),
            ),
            if (!isLast)
              Container(width: 2, height: 42, color: kBorder),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.w800, color: kText)),
                if (desc.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                        fontSize: 13, color: kMuted, height: 1.35),
                  ),
                ],
                const SizedBox(height: 6),
                Container(
                  padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: kSurface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: kBorder),
                  ),
                  child: Text(
                    date,
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: kText),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---- Helpers ----
  String _titleCase(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  Widget _emptyLine() => Text('—',
      style: GoogleFonts.inter(
          fontSize: 14, color: kMuted, fontWeight: FontWeight.w600));

  Widget _avatarSquare({required String name}) {
    final initials = name.trim().isEmpty
        ? 'PT'
        : name
        .trim()
        .split(RegExp(r'\s+'))
        .take(2)
        .map((e) => e.isEmpty ? '' : e[0].toUpperCase())
        .join();

    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
            colors: [Color(0xFFFFE4E6), Color(0xFFFFF1F2)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.05),
            blurRadius: 18,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Center(
        child: Text(
          initials,
          style: GoogleFonts.inter(
              fontSize: 18, fontWeight: FontWeight.w900, color: kText),
        ),
      ),
    );
  }

  Widget _elevatedCard({
    required Widget child,
    Gradient? background,
    Gradient? borderGradient,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(kRadius),
        gradient: background ??
            const LinearGradient(colors: [Colors.white, Colors.white]),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.04),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: Colors.black.withOpacity(.03),
            blurRadius: 6,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(kRadius),
          border: Border.all(color: kBorder),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(kRadius),
          child: Stack(
            children: [
              if (borderGradient != null)
                Positioned.fill(
                  child: IgnorePointer(
                    child: DecoratedBox(
                      decoration: BoxDecoration(gradient: borderGradient),
                    ),
                  ),
                ),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

// ---------- Responsive Grid Helper ----------
class _ResponsiveGrid extends StatelessWidget {
  final bool isWide;
  final List<Widget> children;
  const _ResponsiveGrid({required this.isWide, required this.children});

  @override
  Widget build(BuildContext context) {
    if (!isWide) {
      return Column(
        children: [
          for (int i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1) const SizedBox(height: 14),
          ]
        ],
      );
    }
    final left = <Widget>[];
    final right = <Widget>[];
    for (int i = 0; i < children.length; i++) {
      (i.isEven ? left : right).add(children[i]);
    }
    Widget col(List<Widget> c) => Column(
      children: [
        for (int i = 0; i < c.length; i++) ...[
          c[i],
          if (i != c.length - 1) const SizedBox(height: 14),
        ]
      ],
    );
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: col(left)),
        const SizedBox(width: 14),
        Expanded(child: col(right)),
      ],
    );
  }
}

// ------------- Responsive Grid Helper -------------




/// Enterprise version of Patient Tab — same API, better UX


/// Enterprise-grade Patient Tab (same API, sober visuals)
class _PatientProfileTab extends StatelessWidget {
  // -------- Incoming (unchanged) --------
  final String patientId,
      name,
      gender,
      dob,
      age,
      phone,
      email,
      address,
      doctorName,
      primaryDiagnosis,
      bmi,
      weight,
      height,
      bp,
      heartRate,
      emergencyContactName,
      emergencyContactPhone;
  final List<String> diagnoses, allergies, chronicConditions;

  const _PatientProfileTab({
    required this.patientId,
    required this.name,
    required this.gender,
    required this.dob,
    required this.age,
    required this.phone,
    required this.email,
    required this.address,
    required this.doctorName,
    required this.primaryDiagnosis,
    required this.diagnoses,
    required this.allergies,
    required this.chronicConditions,
    required this.height,
    required this.weight,
    required this.bmi,
    required this.bp,
    required this.heartRate,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
  });

  // -------- Enterprise tokens (neutral, high-contrast, low-chrome) --------
  static const _bg = Color(0xFFF9FAFB);        // panel background
  static const _card = Colors.white;            // card surface
  static const _border = Color(0xFFE5E7EB);     // thin dividers
  static const _label = Color(0xFF6B7280);      // secondary text
  static const _text = Color(0xFF111827);       // primary text
  static const _accent = Color(0xFFDC2626);     // restrained red accent
  static const _mutedIcon = Color(0xFF9CA3AF);  // icon gray

  TextStyle get _hSmall => GoogleFonts.inter(
    fontSize: 12,
    letterSpacing: .8,
    color: _label,
    fontWeight: FontWeight.w700,
  );

  TextStyle get _title => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: _text,
  );

  TextStyle get _k => GoogleFonts.inter(
    fontSize: 12,
    color: _label,
  );

  TextStyle get _v => GoogleFonts.inter(
    fontSize: 13,
    color: _text,
    fontWeight: FontWeight.w600,
  );

  TextStyle get _mono => GoogleFonts.ibmPlexMono(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: _text,
  );

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _bg,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          _section(
            header: 'PATIENT OVERVIEW',
            actions: [
              _ghostIcon(
                tooltip: 'Copy Patient ID',
                icon: Icons.content_copy_rounded,
                onTap: () => _copy(context, patientId),
              ),
              _ghostIcon(
                tooltip: 'Copy Phone',
                icon: Icons.call_outlined,
                onTap: () => _copy(context, phone),
              ),
              _ghostIcon(
                tooltip: 'Copy Email',
                icon: Icons.alternate_email_outlined,
                onTap: () => _copy(context, email),
              ),
            ],
            child: _grid(
              items: [
                _kv('Patient ID', patientId, valueStyle: _mono),
                _kv('Name', name),
                _kv('Gender', gender),
                _kv('DOB', dob),
                _kv('Age', age),
                _kv('Doctor', doctorName),
                _kv('Primary Diagnosis', primaryDiagnosis),
                _kv('Phone', phone, copyable: true),
                _kv('Email', email, copyable: true),
              ],
            ),
          ),

          const SizedBox(height: 12),

          _section(
            header: 'ADDRESS',
            child: _addressBlock(context, address),
          ),

          const SizedBox(height: 12),

          _section(
            header: 'VITALS',
            child: _vitals(
              tiles: [
                _metric('Height', height),
                _metric('Weight', weight),
                _metric('BMI', bmi),
                _metric('BP', bp, emphasize: true),
                _metric('Heart Rate', heartRate),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // _section(
          //   header: 'CLINICAL SUMMARY',
          //   child: Column(
          //     children: [
          //       _listBlock('Diagnoses', diagnoses),
          //       _divider(),
          //       _listBlock('Chronic Conditions', chronicConditions),
          //       _divider(),
          //       _listBlock('Allergies', allergies, warning: true),
          //     ],
          //   ),
          // ),

          const SizedBox(height: 12),

          _section(
            header: 'EMERGENCY CONTACT',
            child: _grid(
              items: [
                _kv('Name', emergencyContactName),
                _kv('Phone', emergencyContactPhone, copyable: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------- UI Blocks ----------------

  Widget _section({
    required String header,
    required Widget child,
    List<Widget> actions = const [],
  }) {
    return Container(
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _border),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: _border)),
            ),
            child: Row(
              children: [
                Text(header, style: _hSmall),
                const Spacer(),
                ..._withSpacing(actions, gap: 6),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _grid({required List<Widget> items}) {
    return LayoutBuilder(builder: (_, c) {
      final w = c.maxWidth;
      int cols = 1;
      if (w >= 520) cols = 2;
      if (w >= 960) cols = 3;

      final gap = 16.0;
      final itemW = (w - (gap * (cols - 1))) / cols;

      return Wrap(
        spacing: gap,
        runSpacing: 12,
        children: items.map((e) => SizedBox(width: itemW, child: e)).toList(),
      );
    });
  }

  Widget _kv(String k, String v, {bool copyable = false, TextStyle? valueStyle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(k, style: _k),
        const SizedBox(height: 4),
        Row(
          children: [
            Expanded(
              child: SelectableText(
                v,
                style: valueStyle ?? _v,
                maxLines: 2,
              ),
            ),
            if (copyable) ...[
              const SizedBox(width: 8),
              _ghostIcon(
                tooltip: 'Copy',
                icon: Icons.copy_rounded,
                onTap: () => _copyInline(v),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _addressBlock(BuildContext context, String text) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: _border),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.location_on_outlined, size: 18, color: _mutedIcon),
          const SizedBox(width: 8),
          Expanded(child: SelectableText(text, style: _v)),
          const SizedBox(width: 8),
          _ghostIcon(
            tooltip: 'Copy Address',
            icon: Icons.copy_all_rounded,
            onTap: () => _copy(context, text),
          ),
        ],
      ),
    );
  }

  Widget _vitals({required List<Widget> tiles}) {
    return LayoutBuilder(builder: (_, c) {
      final w = c.maxWidth;
      int cols = 2;
      if (w >= 720) cols = 3;
      if (w >= 1080) cols = 4;

      final gap = 12.0;
      final itemW = (w - (gap * (cols - 1))) / cols;

      return Wrap(
        spacing: gap,
        runSpacing: gap,
        children: tiles.map((e) => SizedBox(width: itemW, child: e)).toList(),
      );
    });
  }

  Widget _metric(String label, String value, {bool emphasize = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        border: Border.all(color: _border),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 16,
            decoration: BoxDecoration(
              color: emphasize ? _accent : _border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: _k)),
          Text(value, style: emphasize ? _mono.copyWith(color: _text) : _v),
        ],
      ),
    );
  }

  Widget _listBlock(String heading, List<String> items, {bool warning = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(heading.toUpperCase(), style: _hSmall),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Text('No data', style: _k)
        else
          Column(
            children: List.generate(items.length, (i) {
              final last = i == items.length - 1;
              return Container(
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: last ? Colors.transparent : _border),
                  ),
                ),
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      warning ? Icons.error_outline : Icons.circle,
                      size: 14,
                      color: warning ? _accent : _mutedIcon,
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: SelectableText(items[i], style: _v)),
                  ],
                ),
              );
            }),
          ),
      ],
    );
  }

  Widget _divider() => const Divider(height: 16, thickness: 1, color: _border);

  Widget _ghostIcon({
    required String tooltip,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Tooltip(
      message: tooltip,
      waitDuration: const Duration(milliseconds: 400),
      child: InkResponse(
        onTap: onTap,
        radius: 20,
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            border: Border.all(color: _border),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 16, color: _mutedIcon),
        ),
      ),
    );
  }

  // ---------------- Utilities ----------------

  List<Widget> _withSpacing(List<Widget> children, {double gap = 8}) {
    if (children.isEmpty) return const [];
    final out = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      out.add(children[i]);
      if (i != children.length - 1) out.add(SizedBox(width: gap));
    }
    return out;
  }

  Future<void> _copy(BuildContext context, String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied', style: GoogleFonts.inter(fontSize: 13)),
        duration: const Duration(milliseconds: 900),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _copyInline(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
  }
}








/// Page wrapper to match your Appointments page (title + search + button + table)


// ---- SAME COLORS AS APPOINTMENTS ----
const Color primaryColor = Color(0xFFEF4444);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _intakeButtonColor = Color(0xFFF87171);

class _MedicationsTab extends StatefulWidget {
  const _MedicationsTab();

  @override
  State<_MedicationsTab> createState() => _MedicationsTabState();
}

class _MedicationsTabState extends State<_MedicationsTab> {
  late Future<List<Map<String, dynamic>>> _futureRows;

  @override
  void initState() {
    super.initState();
    _futureRows = _fetchMedications(); // simulate API fetch
  }

  Future<List<Map<String, dynamic>>> _fetchMedications() async {
    await Future.delayed(const Duration(milliseconds: 600));
    return [
      {
        'name': 'Paracetamol',
        'dose': '500 mg',
        'route': 'PO',
        'freq': 'BID',
        'start': '05/12/2022',
        'end': '10/12/2022',
        'status': 'Completed',
      },
      {
        'name': 'Amoxicillin',
        'dose': '250 mg',
        'route': 'PO',
        'freq': 'TID',
        'start': '19/08/2025',
        'end': '—',
        'status': 'Incomplete',
      },
      {
        'name': 'Atorvastatin',
        'dose': '10 mg',
        'route': 'PO',
        'freq': 'Daily',
        'start': '01/01/2023',
        'end': '—',
        'status': 'Completed',
      },
    ];
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _futureRows,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(
            child: Text('Error: ${snap.error}',
                style: const TextStyle(color: _statusIncompleteColor)),
          );
        }

        final rows = snap.data ?? [];
        if (rows.isEmpty) {
          return const Center(child: Text('No medications recorded.'));
        }

        final headerStyle = GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: _appointmentsHeaderColor, // same deep red as appointments header
        );
        final cellStyle = GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimaryColor,
        );

        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            color: cardBackgroundColor,
            child: Column(
              children: [
                // ------- HEADER ROW + RED RULE (exact like appointments) -------
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: _tableHeaderColor, width: 1.5),
                    ),
                  ),
                  child: Row(
                    children: const [
                      _Th('Medication', flex: 22),
                      _Th('Dose', flex: 12),
                      _Th('Route', flex: 10),
                      _Th('Frequency', flex: 12),
                      _Th('Start', flex: 12),
                      _Th('End', flex: 12),
                      _Th('Status', flex: 10),
                    ],
                  ),
                ),

                // ------- BODY (zebra rows, spacing like image 2) -------
                ...List.generate(rows.length, (i) {
                  final r = rows[i];
                  final bg = i.isOdd ? _rowAlternateColor : Colors.transparent;

                  return Container(
                    color: bg,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    height: 64, // same row height
                    child: Row(
                      children: [
                        _Td(r['name'], flex: 22, style: cellStyle),
                        _Td(r['dose'], flex: 12, style: cellStyle),
                        _Td(r['route'], flex: 10, style: cellStyle),
                        _Td(r['freq'], flex: 12, style: cellStyle),
                        _Td(r['start'], flex: 12, style: cellStyle),
                        _Td(r['end'], flex: 12, style: cellStyle),
                        // Status pill (soft red bg, red text)
                        Expanded(
                          flex: 10,
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: _statusChip((r['status'] ?? 'Ongoing').toString()),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _statusChip(String status) {
    final isIncomplete = status.toLowerCase() == 'incomplete';
    final bg = isIncomplete
        ? _statusIncompleteColor.withOpacity(0.12)
        : primaryColor.withOpacity(0.12);
    final fg = isIncomplete ? _statusIncompleteColor : primaryColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: GoogleFonts.poppins(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: fg,
        ),
      ),
    );
  }
}

// ======= SMALL HEADER/CELL HELPERS (matching appointments spacing) =======

class _Th extends StatelessWidget {
  final String label;
  final int flex;
  const _Th(this.label, {required this.flex});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: _appointmentsHeaderColor,
          ),
        ),
      ),
    );
  }
}

class _Td extends StatelessWidget {
  final dynamic value;
  final int flex;
  final TextStyle style;
  const _Td(this.value, {required this.flex, required this.style});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          (value ?? '—').toString(),
          style: style,
        ),
      ),
    );
  }
}

/// Exact visual structure of your appointments table (header row, zebra rows, chips, actions)

// ---- Top bar widgets (match Appointments) ----





class _LabsTab extends StatelessWidget {
  final List<Map<String, dynamic>> rows;
  final TextStyle text;
  const _LabsTab({required this.rows, required this.text});

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return const Center(child: Text('No lab results.'));
    }
    return ListView.separated(
      padding: EdgeInsets.zero,
      itemCount: rows.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final r = rows[i];
        return Card(
          child: ListTile(
            title: Text(r['name']?.toString() ?? '—'),
            subtitle: Text('Ref: ${r['ref'] ?? '—'}'),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(r['value']?.toString() ?? '—',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(r['date']?.toString() ?? '—',
                    style: const TextStyle(
                        fontSize: 12,
                        color: _DoctorAppointmentPreviewState.kMuted)),
              ],
            ),
          ),
        );
      },
    );
  }
}
