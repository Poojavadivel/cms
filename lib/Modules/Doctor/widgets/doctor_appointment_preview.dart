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
                            // simplest: just drop the decoration
                            Container(
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
                                          fontWeight: FontWeight.w800,
                                        ),
                                        tabs: const [
                                          Tab(text: 'Profile'),
                                          Tab(text: 'Medical History'),
                                          Tab(text: 'Prescription'),
                                          Tab(text: 'Pathalogy'),
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

  // ---- Tokens
  static const Color kTint = Color(0xFFFFF1F2);      // unified bg
  static const Color kTintLine = Color(0xFFFFE4E6);  // hairlines on tint
  static const double kRadius = 16;
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
            color: _DoctorAppointmentPreviewState.kText,
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
            const Icon(Icons.bloodtype, size: 16, color: _DoctorAppointmentPreviewState.kMuted),
            const SizedBox(width: 6),
            Text(
              'Blood Group: ${_bloodGroup()}',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _DoctorAppointmentPreviewState.kMuted,
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
      Icon(i, size: 16, color: _DoctorAppointmentPreviewState.kMuted),
      const SizedBox(width: 6),
      Text(
        t,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: _DoctorAppointmentPreviewState.kMuted,
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
                    color: _DoctorAppointmentPreviewState.kText,
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
                  color: _DoctorAppointmentPreviewState.kMuted,
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
  // Incoming (kept for compatibility)
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

  // Theme
  static const Color kText   = Color(0xFF0B1324);
  static const Color kMuted  = Color(0xFF64748B);
  static const Color kCard   = Colors.white;
  static const Color kBorder = Color(0xFFE5E7EB);
  static const Color kPrimary= Color(0xFFEF4444);
  static const double kRadius= 16;
  static const double kCardMinH = 156;

  // Samples / placeholders
  static const String kSampleAddress = "94 KR nagar, Dindigul, TamilNadu";
  static const String kSampleEmergencyName = "Sri ram";
  static const String kSampleEmergencyPhone = "+91 6382255960";
  static const String kSampleEmergencyAddress = "98 RM colony, Dinigul, TamilNadu";
  static const String kSampleInsurance = "HealthPlus Insurance, Policy #123456789";

  // Treat these as “no data”
  bool _isMissing(String? s) {
    if (s == null) return true;
    final t = s.trim();
    if (t.isEmpty) return true;
    const invalid = {'—','-','--','na','n/a','null','none'};
    return invalid.contains(t.toLowerCase());
  }

  @override
  Widget build(BuildContext context) {
    final base = GoogleFonts.inter(color: kText, height: 1.35);

    // Address fallback and normalization
    final rawAddress = _isMissing(pLoc) ? kSampleAddress : pLoc.trim();
    final addr = _normalizeUSAddress(rawAddress);

    const addrUpdated = "Updated: Jan 15, 2025";
    const emgUpdated  = "Last Updated: Jan 10, 2025";
    const insUpdated  = "Verified: Jan 12, 2025";

    return LayoutBuilder(
      builder: (context, c) {
        final isWide = c.maxWidth >= 980;

        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            // Row 1 — Address + Emergency (same height)
            if (isWide)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _addressCard(context, base, addr, addrUpdated)),
                  const SizedBox(width: 14),
                  Expanded(child: _emergencyCard(base, emgUpdated)),
                ],
              )
            else
              Column(
                children: [
                  _addressCard(context, base, addr, addrUpdated),
                  const SizedBox(height: 14),
                  _emergencyCard(base, emgUpdated),
                ],
              ),

            const SizedBox(height: 14),

            // Row 2 — Insurance
            _insuranceCard(base, insUpdated),
          ],
        );
      },
    );
  }

  // ============ EXPERT ADDRESS CARD ============
  Widget _addressCard(
      BuildContext context,
      TextStyle base,
      _USAddress addr,
      String updated,
      ) {
    final fullOneLine = _joinNonEmpty([
      addr.street1,
      addr.street2,
      _joinNonEmpty([addr.city, _joinNonEmpty([addr.state, addr.zip], sep: ' ')], sep: ', '),
      addr.country
    ], sep: ', ');

    return _sectionCard(
      icon: Icons.place_rounded,
      title: 'Address',
      minHeight: kCardMinH,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _labelValue('Street',  _joinNonEmpty([addr.street1, addr.street2], sep: ', '), base),
          _labelValue('City',    addr.city, base),
          _labelValue('State',   addr.state, base),
          _labelValue('ZIP',     addr.zip, base),
          _labelValue('Country', addr.country, base),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _actionChip(
                context: context,
                icon: Icons.copy_rounded,
                label: 'Copy',
                onTap: () => Clipboard.setData(ClipboardData(text: fullOneLine)),
              ),
              _actionChip(
                context: context,
                icon: Icons.map_rounded,
                label: 'Open in Maps',
                onTap: () {
                  // Hook: integrate url_launcher if needed.
                  // final url = 'https://maps.google.com/?q=${Uri.encodeComponent(fullOneLine)}';
                  // launchUrl(Uri.parse(url));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Map integration hook ready')),
                  );
                },
              ),
              _dateTag(updated),
            ],
          ),
        ],
      ),
    );
  }

  // Emergency (formatted cleanly)
  Widget _emergencyCard(TextStyle base, String updated) {
    return _sectionCard(
      icon: Icons.contact_phone_rounded,
      title: 'Emergency Contact',
      minHeight: kCardMinH,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _labelValue('Name', kSampleEmergencyName, base),
          _labelValue('Relationship', 'Brother', base), // ✅ new field
          _labelValue('Phone', kSampleEmergencyPhone, base),
          _labelValue('Email', 'doctor12@hms.com', base), // ✅ new field
          _labelValue('Address', kSampleEmergencyAddress, base),
          const SizedBox(height: 10),
          _dateTag(updated),
        ],
      ),
    );
  }


  // Insurance
  Widget _insuranceCard(TextStyle base, String updated) {
    return _sectionCard(
      icon: Icons.verified_user_rounded,
      title: 'Insurance',
      minHeight: kCardMinH,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SelectableText(
            kSampleInsurance,
            style: base.copyWith(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          _dateTag(updated),
        ],
      ),
    );
  }

  // ======= Shared shells / atoms =======

  Widget _labelValue(String label, String value, TextStyle base) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label
          SizedBox(
            width: 110, // slightly wider for alignment
            child: Text(
              label.toUpperCase(), // 🔑 uppercase = professional, subtle
              style: GoogleFonts.inter(
                fontSize: 12,
                letterSpacing: 0.6,
                color: kMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Value
          Expanded(
            child: SelectableText(
              value.isEmpty ? 'Not Provided' : value,
              style: GoogleFonts.inter(
                fontSize: 14.5,
                height: 1.4,
                fontWeight: FontWeight.w700,
                color: kText,
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _actionChip({
    required BuildContext context,
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: kBorder),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: kText),
            const SizedBox(width: 6),
            Text(label,
                style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _dateTag(String date) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: kPrimary.withOpacity(.05),
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        date,
        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: kMuted),
      ),
    );
  }

  Widget _sectionCard({
    required IconData icon,
    required String title,
    required Widget child,
    double minHeight = 0,
  }) {
    return _elevatedCard(
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: minHeight),
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
                      gradient: LinearGradient(
                        colors: [kPrimary.withOpacity(.15), kPrimary.withOpacity(.05)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
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
                ],
              ),
              const SizedBox(height: 12),
              // IMPORTANT: no Expanded/Spacer here; safe for ListView
              child,
            ],
          ),
        ),
      ),
    );
  }

  Widget _elevatedCard({required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(kRadius),
        gradient: const LinearGradient(colors: [kCard, kCard]),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(.06), blurRadius: 16, offset: Offset(0, 8)),
        ],
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(kRadius),
          border: Border.all(color: kBorder),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(kRadius),
          child: child,
        ),
      ),
    );
  }

  // ======= Address normalization =======
  _USAddress _normalizeUSAddress(String input) {
    // Light parser for "street, city, state zip, country" patterns.
    String street1 = '', street2 = '', city = '', state = '', zip = '', country = 'India';

    final parts = input.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();

    if (parts.isNotEmpty) street1 = parts[0];
    if (parts.length >= 2) city = parts[1];
    if (parts.length >= 3) {
      final p = parts[2];
      final tokens = p.split(RegExp(r'\s+'));
      if (tokens.length >= 2 && RegExp(r'^\d{5}(-\d{4})?$').hasMatch(tokens.last)) {
        zip = tokens.removeLast();
        state = tokens.join(' ').toUpperCase();
      } else {
        state = p.toUpperCase();
      }
    }
    if (parts.length >= 4) country = parts[3];

    if (country == 'USA' && state.isEmpty && city.contains(' ')) {
      final tokens = city.split(' ');
      if (tokens.length >= 2 && RegExp(r'^\d{5}(-\d{4})?$').hasMatch(tokens.last)) {
        zip = tokens.removeLast();
        state = tokens.removeLast().toUpperCase();
        city = tokens.join(' ');
      }
    }

    return _USAddress(
      street1: street1,
      street2: street2,
      city: city,
      state: state,
      zip: zip,
      country: country,
    );
  }

  String _joinNonEmpty(List<String> items, {String sep = ', '}) =>
      items.where((e) => e.trim().isNotEmpty).join(sep);
}

// Simple address model
class _USAddress {
  final String street1;
  final String street2;
  final String city;
  final String state;
  final String zip;
  final String country;

  const _USAddress({
    required this.street1,
    required this.street2,
    required this.city,
    required this.state,
    required this.zip,
    required this.country,
  });
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

// ---------- Responsive Grid Helper ----------

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

  // search / filter state
  final TextEditingController _searchCtrl = TextEditingController();
  bool _showFilters = false;
  String _statusFilter = 'All';

  @override
  void initState() {
    super.initState();
    _futureRows = _fetchMedications(); // simulate API fetch
    _searchCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
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
        'status': 'Ongoing',
      },
    ];
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchCtrl.text.trim().toLowerCase();
    return data.where((r) {
      final s = (r['status'] ?? '').toString();
      final matchesStatus = _statusFilter == 'All' || s.toLowerCase() == _statusFilter.toLowerCase();

      if (q.isEmpty) return matchesStatus;

      final hay = [
        r['name'],
        r['dose'],
        r['route'],
        r['freq'],
      ].map((e) => (e ?? '').toString().toLowerCase()).join(' ');

      return matchesStatus && hay.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final headerStyle = GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: FontWeight.w700,
      color: _appointmentsHeaderColor,
    );
    final cellStyle = GoogleFonts.poppins(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: textPrimaryColor,
    );

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

        final allRows = snap.data ?? [];
        var rows = _applyFilters(allRows);

        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            color: cardBackgroundColor,
            child: Column(
              children: [
                // ======= TOP BAR: Filter button + Search field =======
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Row(
                    children: [
                      // Filter icon button (enterprise look)
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: cardBackgroundColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _searchBorderColor),
                          boxShadow: [
                            BoxShadow(
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                              color: Colors.black.withOpacity(0.06),
                            ),
                          ],
                        ),
                        child: IconButton(
                          tooltip: 'Filter',
                          onPressed: () => setState(() => _showFilters = !_showFilters),
                          icon: const Icon(Icons.tune_rounded, color: _buttonBgColor),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Search field
                      Expanded(
                        child: TextField(
                          controller: _searchCtrl,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: textPrimaryColor,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Search medication, dose, route…',
                            hintStyle: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: textSecondaryColor,
                            ),
                            prefixIcon: const Icon(Icons.search, color: _buttonBgColor),
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            filled: true,
                            fillColor: cardBackgroundColor,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: _searchBorderColor),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: _searchBorderColor),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: _buttonBgColor, width: 1.5),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ======= FILTER PANEL (collapsible) =======
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 180),
                  child: !_showFilters
                      ? const SizedBox(height: 8)
                      : Padding(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                    child: Container(
                      decoration: BoxDecoration(
                        color: cardBackgroundColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _searchBorderColor),
                      ),
                      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                      child: Row(
                        children: [
                          // Status dropdown
                          Expanded(
                            child: _LabeledDropdown(
                              label: 'Status',
                              value: _statusFilter,
                              items: const ['All', 'Completed', 'Incomplete', 'Ongoing'],
                              onChanged: (v) => setState(() => _statusFilter = v!),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Clear filters
                          SizedBox(
                            height: 44,
                            child: OutlinedButton.icon(
                              onPressed: () {
                                setState(() {
                                  _statusFilter = 'All';
                                  _searchCtrl.clear();
                                });
                              },
                              icon: const Icon(Icons.refresh, size: 18, color: _buttonBgColor),
                              label: Text(
                                'Reset',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w600,
                                  color: _buttonBgColor,
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: _buttonBgColor),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // ------- HEADER ROW + RED RULE -------
                Container(
                  margin: const EdgeInsets.only(top: 8),
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

                // ------- BODY (zebra rows) -------
                if (rows.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text('No medications match your filters.',
                        style: GoogleFonts.poppins(color: textSecondaryColor)),
                  )
                else
                  ...List.generate(rows.length, (i) {
                    final r = rows[i];
                    final bg = i.isOdd ? _rowAlternateColor : Colors.transparent;

                    return Container(
                      color: bg,
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      height: 64,
                      child: Row(
                        children: [
                          _Td(r['name'], flex: 22, style: cellStyle),
                          _Td(r['dose'], flex: 12, style: cellStyle),
                          _Td(r['route'], flex: 10, style: cellStyle),
                          _Td(r['freq'], flex: 12, style: cellStyle),
                          _Td(r['start'], flex: 12, style: cellStyle),
                          _Td(r['end'], flex: 12, style: cellStyle),
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

// ======= SMALL HEADER/CELL/FORM HELPERS =======

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
        child: Text((value ?? '—').toString(), style: style),
      ),
    );
  }
}

class _LabeledDropdown extends StatelessWidget {
  final String label;
  final String? value;
  final List<String> items;
  final ValueChanged<String?> onChanged;

  const _LabeledDropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: textSecondaryColor,
            )),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          items: items
              .map((e) => DropdownMenuItem<String>(
            value: e,
            child: Text(e, style: GoogleFonts.poppins(fontSize: 14)),
          ))
              .toList(),
          onChanged: onChanged,
          isDense: true,
          decoration: InputDecoration(
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            filled: true,
            fillColor: cardBackgroundColor,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: _searchBorderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: _searchBorderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: _buttonBgColor, width: 1.5),
            ),
          ),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: _buttonBgColor),
        ),
      ],
    );
  }
}


// ======= SMALL HEADER/CELL HELPERS (matching appointments spacing) =======



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
