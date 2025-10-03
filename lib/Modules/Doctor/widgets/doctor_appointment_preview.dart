import 'package:flutter/material.dart';
import 'package:glowhair/Models/Patients.dart';
import 'package:glowhair/Modules/Doctor/widgets/table.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../Models/dashboardmodels.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Utils/Colors.dart';

class DoctorAppointmentPreview extends StatefulWidget {
  final PatientDetails patient;
  const DoctorAppointmentPreview({super.key, required this.patient});

  static Future<void> show(BuildContext context, PatientDetails patient) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => DoctorAppointmentPreview(patient: patient),
    );
  }

  @override
  State<DoctorAppointmentPreview> createState() =>
      _DoctorAppointmentPreviewState();
}

class _DoctorAppointmentPreviewState extends State<DoctorAppointmentPreview>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  late final TextStyle baseText;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 5, vsync: this);
    baseText = GoogleFonts.inter();
  }
  static const Color kPrimary = Color(0xFFEF4444);
  static const Color kBg = Color(0xFFF9FAFB);
  static const Color kCard = Colors.white;
  static const Color kText = Color(0xFF111827);
  static const Color kMuted = Color(0xFF6B7280);
  static const Color kBorder = Color(0xFFE5E7EB);
  static const double kRadius = 16;


  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return DateFormat('dd MMM yyyy').format(dt);
    } catch (e) {
      return iso.isNotEmpty ? iso : '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final patient = widget.patient;
    final size = MediaQuery.of(context).size;

    // map patient fields to the names used in the original UI (fallbacks applied)
    final pName = (patient.name.isNotEmpty) ? patient.name : '—';
    final pGender = (patient.gender.isNotEmpty) ? patient.gender : '—';
    final pLoc = (patient.city.isNotEmpty) ? patient.city : (patient.address.isNotEmpty ? patient.address : '—');
    // final pJob = (patient.occupation.isNotEmpty) ? patient.occupation : '—';
    final pDob = (patient.dateOfBirth.isNotEmpty) ? patient.dateOfBirth : '—';
    final pBMI = (patient.bmi.isNotEmpty) ? patient.bmi : '—';
    final pWt = (patient.weight.isNotEmpty) ? patient.weight : '—';
    final pHt = (patient.height.isNotEmpty) ? patient.height : '—';
    final ownDx = patient.medicalHistory;
    final barriers = patient.allergies;
    final timeline = <Map<String,String>>[]; // PatientDetails has no timeline field in your model
    final medHistory = <String, String>{}; // if you have a map-based history, map it here

    // Appointment-specific placeholders (originally from DashboardAppointments)
    final date = patient.lastVisitDate.isNotEmpty ? patient.lastVisitDate : '—';
    final time = '—';
    final reason = patient.notes.isNotEmpty ? patient.notes : '—';
    final status = '—';

    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      backgroundColor: Colors.transparent,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.95,
          maxHeight: size.height * 0.95,
        ),
        child: Stack(
          clipBehavior: Clip.none, // allow floating close button outside
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(kRadius),
              child: Material(
                color: kBg,
                child: Column(
                  children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 16, 12, 12),
                        child: Column(
                          children: [
                            // PATIENT HEADER
                            Container(
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                              child: _ProfileHeaderCard(patient: patient),
                            ),

                            const SizedBox(height: 12),

                            // TABS + CONTENT
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
                                    // top tab bar
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
                                          Tab(text: 'Lab Result'),
                                          Tab(text: 'Billings'),
                                        ],
                                      ),
                                    ),

                                    // tab views
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: TabBarView(
                                          controller: _tab,
                                          children: [
                                            _OverviewTab(
                                              text: baseText,
                                              pName: pName,
                                              pGender: pGender,
                                              pLoc: pLoc,
                                              // pJob: pJob,
                                              pDob: pDob,
                                              pBMI: pBMI,
                                              pWt: pWt,
                                              pHt: pHt,
                                              pBp: '—',
                                              ownDx: ownDx,
                                              barriers: barriers,
                                              timeline: timeline,
                                              medHistory: medHistory,
                                              date: date,
                                              time: time,
                                              reason: reason,
                                              status: status,
                                            ),
                                            _PatientProfileTab(
                                              patientId: patient.patientId,
                                              name: pName,
                                              gender: pGender,
                                              dob: pDob,
                                              age: patient.age != 0 ? '${patient.age}' : '—',
                                              phone: patient.phone.isNotEmpty ? patient.phone : '—',
                                              email: '—',
                                              address: pLoc,
                                              doctorName: patient.doctorName.isNotEmpty ? patient.doctorName : '—',
                                              primaryDiagnosis: ownDx.isNotEmpty ? ownDx.first : '—',
                                              diagnoses: ownDx,
                                              allergies: patient.allergies,
                                              chronicConditions: const [],
                                              height: pHt,
                                              weight: pWt,
                                              bmi: pBMI,
                                              bp: '—',
                                              heartRate: '—',
                                              emergencyContactName: patient.emergencyContactName.isNotEmpty ? patient.emergencyContactName : '—',
                                              emergencyContactPhone: patient.emergencyContactPhone.isNotEmpty ? patient.emergencyContactPhone : '—',
                                            ),
                                            const _MedicationsTab(),
                                            const _LabsTab(),
                                            const _BillingsTab(),
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

            // CLOSE BUTTON
            Positioned(
              top: -10,
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


class _ProfileHeaderCard extends StatelessWidget {
  // keep your original tokens so layout stays identical
  static const double kRadius = 16;
  static const double kAvatar = 128;
  static const Color kTint = Color(0xFFF9FAFB); // subtle tint behind card
  static const Color kTintLine = Color(0xFFF3F4F6);

  // <-- updated to use PatientDetails
  final PatientDetails patient;
  const _ProfileHeaderCard({required this.patient});

  // numeric helper (keeps original semantics for numbers)
  String _n(num? v, {String? suffix}) =>
      (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';

  // string helper for height/weight/bmi that are strings in PatientDetails
  String _ns(String? v, {String? suffix}) {
    if (v == null) return '—';
    final s = v.trim();
    if (s.isEmpty) return '—';
    return '${s}${suffix ?? ''}';
  }

  String _ss(String? v) => (v == null || v.trim().isEmpty) ? '—' : v!;

  String _bloodGroup() {
    try {
      final bg = patient.bloodGroup;
      return _ss(bg);
    } catch (_) {
      return '—';
    }
  }

  String _spo2() {
    try {
      final o2raw = patient.oxygen;
      if (o2raw == null || o2raw.trim().isEmpty) return '—';
      final v = num.tryParse(o2raw.toString());
      return v == null ? '—' : '${v.toStringAsFixed(0)}%';
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _ss(patient.name);
    final isFemale = _ss(patient.gender).toLowerCase() == 'female';
    final avatar = isFemale ? 'assets/girlicon.png' : 'assets/boyicon.png';

    return ClipRRect(
      borderRadius: BorderRadius.circular(kRadius),
      child: Container(
        color: kTint,
        child: Stack(
          children: [
            // Card body with subtle border and shadow - enterprise feel
            Container(
              margin: const EdgeInsets.all(0),
              decoration: BoxDecoration(
                color: AppColors.kCard,
                borderRadius: BorderRadius.circular(kRadius),
                border: Border.all(color: kTintLine),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: LayoutBuilder(builder: (context, c) {
                  final isTight = c.maxWidth < 980;
                  return Flex(
                    direction: Axis.horizontal,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Left: big avatar + spacing
                      Flexible(
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

                      // Right: vitals grid - keeps original flex behavior
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
                }),
              ),
            ),

            // Floating edit ghost button at top-right (keeps original placement)
            Positioned(
              right: 12,
              top: 12,
              child: _ghostButton(
                icon: Icons.edit_outlined,
                onTap: () {
                  // leave hook for edit action
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
        color: AppColors.kCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kTintLine),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.025),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.asset(
          asset,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            color: AppColors.rowAlternate,
            child: Center(
              child: Text(
                _initials(_ss(patient.name)),
                style: GoogleFonts.lexend(
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary700,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _initials(String name) {
    if (name.trim().isEmpty || name == '—') return '';
    final parts = name.split(' ');
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  Widget _identityBlock(String name, bool isFemale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Name (large, bold) - matches original font size and weight
        Text(
          name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.lexend(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: AppColors.kTextPrimary,
            height: 1.05,
          ),
        ),
        const SizedBox(height: 8),

        // ID badge: keep original look but use AppColors
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.kCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kTintLine),
          ),
          child: Text(
            'ID: ${patient.patientCodeOrId}',
            style: GoogleFonts.lexend(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: AppColors.primary700,
              letterSpacing: 0.1,
            ),
          ),
        ),

        const SizedBox(height: 12),

        // basic meta row (gender / age / dob) - keep as Wrap like original
        Wrap(
          spacing: 18,
          runSpacing: 10,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _mini(isFemale ? Icons.female : Icons.male, _ss(patient.gender)),
            _mini(Icons.person, 'Age ${patient.age != 0 ? patient.age : '—'}'),
            _mini(Icons.calendar_month, _ss(patient.dateOfBirth)),
          ],
        ),

        const SizedBox(height: 8),

        // Blood group row same as original
        Row(
          children: [
            Icon(Icons.bloodtype, size: 16, color: AppColors.kTextSecondary),
            const SizedBox(width: 6),
            Text(
              'Blood Group: ${_bloodGroup()}',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextSecondary,
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
      Icon(i, size: 16, color: AppColors.kTextSecondary),
      const SizedBox(width: 6),
      Text(
        t,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: AppColors.kTextSecondary,
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
            Expanded(child: _kv(Icons.height, 'Height', _ns(patient.height, suffix: ' cm'))),
            const SizedBox(width: 24),
            Expanded(child: _kv(Icons.monitor_weight_outlined, 'Weight', _ns(patient.weight, suffix: ' kg'))),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _kv(Icons.scale, 'BMI', _ns(patient.bmi))),
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
            gradient: LinearGradient(
              colors: [AppColors.kCFBlue.withOpacity(0.12), AppColors.kCFBlue.withOpacity(0.06)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(color: kTintLine),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary700),
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
                    color: AppColors.kTextPrimary,
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
                  color: AppColors.kTextSecondary,
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
        side: BorderSide(color: kTintLine),
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


class _OverviewTab extends StatelessWidget {
  // Incoming (kept for compatibility)
  final TextStyle text;
  final String pName, pGender, pLoc, pDob, pBMI, pWt, pHt, pBp;
  final List<String> ownDx, barriers;
  final List<Map<String, dynamic>> timeline;
  final Map<String, String> medHistory;
  final String date, time, reason, status;

  const _OverviewTab({
    required this.text,
    required this.pName,
    required this.pGender,
    required this.pLoc,
    // required this.pJob,
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

class _PatientProfileTab extends StatefulWidget {
  // -------- Incoming (unchanged props, but not used in this simplified version) --------
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

  @override
  State<_PatientProfileTab> createState() => _PatientProfileTabState();
}



class _PatientProfileTabState extends State<_PatientProfileTab> {
  String _searchQuery = "";
  int _currentPage = 0;
  final int _itemsPerPage = 5;

  final List<Map<String, String>> _medicalHistory = List.generate(10, (i) {
    return {
      'doctor':
      'Dr. ${["Smith", "Johnson", "Lee", "Kumar", "Patel", "Brown", "Miller", "Taylor", "Davis", "Wilson"][i]}',
      'date': '2025-08-${(i + 10).toString().padLeft(2, "0")}',
      'time': '${9 + i % 3}:30 AM',
      'category': ['Checkup', 'Surgery', 'Therapy', 'Consultation', 'Follow-up'][i % 5],
      'notes': 'Sample note ${i + 1}',
      'document': 'Doc_${i + 1}.pdf',
    };
  });

  @override
  Widget build(BuildContext context) {
    // filter
    final filtered = _medicalHistory.where((row) {
      if (_searchQuery.isEmpty) return true;
      final hay = [
        row['doctor'],
        row['category'],
        row['notes'],
        row['document'],
      ].join(' ').toLowerCase();
      return hay.contains(_searchQuery.toLowerCase());
    }).toList();

    // paginate
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final pageRows = startIndex >= filtered.length
        ? <Map<String, String>>[]
        : filtered.sublist(startIndex, endIndex);

    // rows -> widgets
    final rowWidgets = pageRows.map((r) {
      return [
        Text(r['doctor']!, style: _cellStyle),
        Text(r['date']!, style: _cellStyle),
        Text(r['time']!, style: _cellStyle),
        Text(r['category']!, style: _cellStyle),
        Text(r['notes']!, style: _cellStyle),
        InkWell(
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Opening ${r['document']}')),
            );
          },
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.picture_as_pdf, size: 16, color: Colors.red),
              const SizedBox(width: 4),
              Text(r['document']!, style: _cellStyle.copyWith(color: Colors.blue)),
            ],
          ),
        ),
      ];
    }).toList();

    // fill available height cleanly
    return LayoutBuilder(
      builder: (context, constraints) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: SizedBox(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
            child: GenericDataTable(
              title: 'Medical History',
              headers: const ['Doctor Name', 'Date', 'Time', 'Category', 'Notes', 'Document'],
              rows: rowWidgets,
              searchQuery: _searchQuery,
              onSearchChanged: (q) => setState(() => _searchQuery = q),
              filters: const [],
              currentPage: _currentPage,
              totalItems: filtered.length,
              itemsPerPage: _itemsPerPage,
              onPreviousPage: () {
                setState(() => _currentPage = (_currentPage - 1).clamp(0, 9999));
              },
              onNextPage: () {
                setState(() => _currentPage = _currentPage + 1);
              },

              // actions
              onView: (index) {
                final row = pageRows[index];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Viewing ${row['doctor']}')),
                );
              },
              onEdit: (index) {
                final row = pageRows[index];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Editing ${row['doctor']}')),
                );
              },
              onDelete: (index) {
                final row = pageRows[index];
                setState(() => _medicalHistory.remove(row));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Deleted ${row['doctor']}')),
                );
              },
            ),
          ),
        );
      },
    );
  }

  TextStyle get _cellStyle => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: const Color(0xFF1F2937),
  );
}



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
  String _searchQuery = "";
  String _statusFilter = 'All';

  // pagination state
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _futureRows = _fetchMedications();
  }

  Future<List<Map<String, dynamic>>> _fetchMedications() async {
    await Future.delayed(const Duration(milliseconds: 300));
    // >= 10 sample rows
    return [
      {
        'name': 'Paracetamol', 'dose': '500 mg', 'route': 'PO', 'freq': 'BID',
        'start': '05/12/2022', 'end': '10/12/2022', 'status': 'Completed'
      },
      {
        'name': 'Amoxicillin', 'dose': '250 mg', 'route': 'PO', 'freq': 'TID',
        'start': '19/08/2025', 'end': '—', 'status': 'Incomplete'
      },
      {
        'name': 'Atorvastatin', 'dose': '10 mg', 'route': 'PO', 'freq': 'Daily',
        'start': '01/01/2023', 'end': '—', 'status': 'Ongoing'
      },
      {
        'name': 'Metformin', 'dose': '500 mg', 'route': 'PO', 'freq': 'BID',
        'start': '10/03/2024', 'end': '—', 'status': 'Ongoing'
      },
      {
        'name': 'Ibuprofen', 'dose': '200 mg', 'route': 'PO', 'freq': 'TID',
        'start': '12/07/2025', 'end': '18/07/2025', 'status': 'Completed'
      },
      {
        'name': 'Azithromycin', 'dose': '500 mg', 'route': 'PO', 'freq': 'Daily',
        'start': '22/06/2025', 'end': '26/06/2025', 'status': 'Completed'
      },
      {
        'name': 'Lisinopril', 'dose': '5 mg', 'route': 'PO', 'freq': 'Daily',
        'start': '11/10/2024', 'end': '—', 'status': 'Ongoing'
      },
      {
        'name': 'Prednisone', 'dose': '20 mg', 'route': 'PO', 'freq': 'Daily',
        'start': '05/05/2025', 'end': '12/05/2025', 'status': 'Completed'
      },
      {
        'name': 'Cefixime', 'dose': '200 mg', 'route': 'PO', 'freq': 'BID',
        'start': '15/08/2025', 'end': '—', 'status': 'Incomplete'
      },
      {
        'name': 'Pantoprazole', 'dose': '40 mg', 'route': 'PO', 'freq': 'Daily',
        'start': '09/09/2024', 'end': '—', 'status': 'Ongoing'
      },
      {
        'name': 'Cetirizine', 'dose': '10 mg', 'route': 'PO', 'freq': 'HS',
        'start': '01/02/2025', 'end': '05/02/2025', 'status': 'Completed'
      },
      {
        'name': 'Doxycycline', 'dose': '100 mg', 'route': 'PO', 'freq': 'BID',
        'start': '20/08/2025', 'end': '—', 'status': 'Incomplete'
      },
    ];
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchQuery.trim().toLowerCase();
    return data.where((r) {
      final s = (r['status'] ?? '').toString();
      final matchesStatus =
          _statusFilter == 'All' || s.toLowerCase() == _statusFilter.toLowerCase();

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
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _futureRows,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(
            child: Text(
              'Error: ${snap.error}',
              style: const TextStyle(color: _statusIncompleteColor),
            ),
          );
        }

        final allRows = snap.data ?? [];
        final filtered = _applyFilters(allRows);

        // Pagination
        final startIndex = _currentPage * _itemsPerPage;
        final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
        final pageRows = startIndex >= filtered.length
            ? <Map<String, dynamic>>[]
            : filtered.sublist(startIndex, endIndex);

        // ---- Convert rows into List<List<Widget>> for GenericDataTable ----
        final rowWidgets = pageRows.map((r) {
          return [
            Text(r['name'],  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(r['dose'],  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(r['route'], style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(r['freq'],  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(r['start'], style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(r['end'],   style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            _statusChip(r['status']),
          ];
        }).toList();

        return LayoutBuilder(
          builder: (context, constraints) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              child: SizedBox(
                width: constraints.maxWidth,
                height: constraints.maxHeight,
                child: GenericDataTable(
                  title: "Medications",
                  headers: const [
                    'Medication',
                    'Dose',
                    'Route',
                    'Frequency',
                    'Start',
                    'End',
                    'Status'
                  ],
                  rows: rowWidgets,
                  searchQuery: _searchQuery,
                  onSearchChanged: (q) => setState(() => _searchQuery = q),
                  filters: [
                    DropdownButton<String>(
                      value: _statusFilter,
                      onChanged: (v) => setState(() => _statusFilter = v!),
                      items: const [
                        DropdownMenuItem(value: "All", child: Text("All")),
                        DropdownMenuItem(value: "Completed", child: Text("Completed")),
                        DropdownMenuItem(value: "Incomplete", child: Text("Incomplete")),
                        DropdownMenuItem(value: "Ongoing", child: Text("Ongoing")),
                      ],
                    )
                  ],
                  currentPage: _currentPage,
                  totalItems: filtered.length,
                  itemsPerPage: _itemsPerPage,
                  onPreviousPage: () => setState(
                        () => _currentPage = (_currentPage - 1).clamp(0, 9999),
                  ),
                  onNextPage: () => setState(
                        () => _currentPage = _currentPage + 1,
                  ),

                  // ✅ Action icons will now show
                  onView: (i) {
                    final row = pageRows[i];
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text("Viewing ${row['name']}")),
                    );
                  },
                  onEdit: (i) {
                    final row = pageRows[i];
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text("Editing ${row['name']}")),
                    );
                  },
                  onDelete: (i) {
                    final row = pageRows[i];
                    setState(() => allRows.remove(row));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text("Deleted ${row['name']}")),
                    );
                  },
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _statusChip(String status) {
    final isIncomplete = (status).toLowerCase() == 'incomplete';
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




class _LabsTab extends StatefulWidget {
  const _LabsTab({super.key});

  @override
  State<_LabsTab> createState() => _LabsTabState();
}

class _LabsTabState extends State<_LabsTab> {
  // sample lab data (min 10 rows)
  final List<Map<String, dynamic>> _labRows = List.generate(12, (i) {
    return {
      'name': 'Test ${i + 1}',
      'value': (4.0 + i).toStringAsFixed(1),
      'unit': 'mg/dL',
      'ref': '4.0 - 10.0',
      'date': '2025-08-${(10 + i).toString().padLeft(2, '0')}',
      'comment': 'Auto-generated sample',
      'flag': i % 3 == 0 ? 'High' : (i % 4 == 0 ? 'Low' : 'Normal'),
    };
  });

  @override
  Widget build(BuildContext context) {
    return _LabsTable(rows: _labRows);
  }
}

/// Extracted table widget (uses GenericDataTable underneath)
class _LabsTable extends StatefulWidget {
  final List<Map<String, dynamic>> rows;
  const _LabsTable({required this.rows});

  @override
  State<_LabsTable> createState() => _LabsTableState();
}

class _LabsTableState extends State<_LabsTable> {
  String _searchQuery = "";
  String _statusFilter = "All";
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  String _statusForRow(Map<String, dynamic> r) {
    final flag = (r['flag'] ?? '').toString().toLowerCase();
    if (flag.contains('high')) return 'High';
    if (flag.contains('low')) return 'Low';
    return 'Normal';
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchQuery.trim().toLowerCase();
    return data.where((r) {
      final status = _statusForRow(r);
      final matchesStatus = _statusFilter == 'All' || status == _statusFilter;
      if (q.isEmpty) return matchesStatus;

      final hay = [
        r['name'],
        r['value'],
        r['unit'],
        r['ref'],
        r['date'],
        r['comment'],
      ].join(' ').toLowerCase();

      return matchesStatus && hay.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _applyFilters(widget.rows);

    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final pageRows = startIndex >= filtered.length
        ? <Map<String, dynamic>>[]
        : filtered.sublist(startIndex, endIndex);

    final rowWidgets = pageRows.map((r) {
      final status = _statusForRow(r);
      return [
        Text(r['name'] ?? '—'),
        Text(r['value'] ?? '—'),
        Text(r['unit'] ?? '—'),
        Text(r['ref'] ?? '—'),
        Text(r['date'] ?? '—'),
        Text(r['comment'] ?? '—'),
        _statusChip(status),
      ];
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        return SizedBox(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          child: GenericDataTable(
            title: "Lab Results",
            headers: const [
              'Medication',
              'Dose',
              'Route',
              'Frequency',
              'Start',
              'End',
              'Status'
            ],
            rows: rowWidgets,
            searchQuery: _searchQuery,
            onSearchChanged: (q) => setState(() => _searchQuery = q),
            filters: [
              DropdownButton<String>(
                value: _statusFilter,
                onChanged: (v) => setState(() {
                  _statusFilter = v!;
                  _currentPage = 0;
                }),
                items: const [
                  DropdownMenuItem(value: "All", child: Text("All")),
                  DropdownMenuItem(value: "High", child: Text("High")),
                  DropdownMenuItem(value: "Low", child: Text("Low")),
                  DropdownMenuItem(value: "Normal", child: Text("Normal")),
                ],
              ),
            ],
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: _itemsPerPage,
            onPreviousPage: () =>
                setState(() => _currentPage = (_currentPage - 1).clamp(0, 9999)),
            onNextPage: () => setState(() => _currentPage = _currentPage + 1),
            onView: (i) {
              final r = pageRows[i];
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Viewing ${r['name']}")),
              );
            },
            onEdit: (i) {
              final r = pageRows[i];
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Editing ${r['name']}")),
              );
            },
            onDelete: (i) {
              final r = pageRows[i];
              setState(() => widget.rows.remove(r));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Deleted ${r['name']}")),
              );
            },
          ),
        );
      },
    );
  }

  Widget _statusChip(String status) {
    Color fg;
    if (status == 'High') {
      fg = Colors.red;
    } else if (status == 'Low') {
      fg = Colors.blue;
    } else {
      fg = Colors.green;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: fg.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(status,
          style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600, fontSize: 13, color: fg)),
    );
  }
}

class _BillingsTab extends StatefulWidget {
  const _BillingsTab({super.key});

  @override
  State<_BillingsTab> createState() => _BillingsTabState();
}

class _BillingsTabState extends State<_BillingsTab> {
  // search/filter/pagination
  String _searchQuery = "";
  String _statusFilter = "All";
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  // sample billing data (min 10)
  final List<Map<String, dynamic>> _billingRows = List.generate(12, (i) {
    return {
      'invoice': 'INV-${1000 + i}',
      'date': '2025-08-${(10 + i).toString().padLeft(2, '0')}',
      'amount': (500 + i * 20).toString(),
      'method': i % 2 == 0 ? 'Credit Card' : 'Cash',
      'due': '2025-09-${(10 + i).toString().padLeft(2, '0')}',
      'status': i % 3 == 0 ? 'Unpaid' : 'Paid',
      'comment': 'Billing for visit ${i + 1}',
    };
  });

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchQuery.trim().toLowerCase();
    return data.where((r) {
      final status = (r['status'] ?? '').toString();
      final matchesStatus = _statusFilter == 'All' ||
          status.toLowerCase() == _statusFilter.toLowerCase();

      if (q.isEmpty) return matchesStatus;

      final hay = [
        r['invoice'],
        r['date'],
        r['amount'],
        r['method'],
        r['comment'],
      ].join(' ').toLowerCase();

      return matchesStatus && hay.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _applyFilters(_billingRows);

    // pagination
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final pageRows = startIndex >= filtered.length
        ? <Map<String, dynamic>>[]
        : filtered.sublist(startIndex, endIndex);

    // map billing into temporary headers
    List<List<Widget>> rowWidgets = pageRows.map((r) {
      return [
        Text(r['invoice'] ?? '—'), // Medication → invoice
        Text(r['date'] ?? '—'),    // Dose → date
        Text(r['amount'] ?? '—'),  // Route → amount
        Text(r['method'] ?? '—'),  // Frequency → payment method
        Text(r['due'] ?? '—'),     // Start → due date
        Text(r['comment'] ?? '—'), // End → comment
        _statusChip(r['status']),  // Status → paid/unpaid
      ];
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: SizedBox(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
            child: GenericDataTable(
              title: "Billings",
              headers: const [
                'Medication', // temp → invoice
                'Dose',       // temp → date
                'Route',      // temp → amount
                'Frequency',  // temp → method
                'Start',      // temp → due
                'End',        // temp → comment
                'Status',     // temp → paid/unpaid
              ],
              rows: rowWidgets,
              searchQuery: _searchQuery,
              onSearchChanged: (q) => setState(() => _searchQuery = q),
              filters: [
                DropdownButton<String>(
                  value: _statusFilter,
                  onChanged: (v) => setState(() {
                    _statusFilter = v!;
                    _currentPage = 0;
                  }),
                  items: const [
                    DropdownMenuItem(value: "All", child: Text("All")),
                    DropdownMenuItem(value: "Paid", child: Text("Paid")),
                    DropdownMenuItem(value: "Unpaid", child: Text("Unpaid")),
                  ],
                ),
              ],
              currentPage: _currentPage,
              totalItems: filtered.length,
              itemsPerPage: _itemsPerPage,
              onPreviousPage: () =>
                  setState(() => _currentPage = (_currentPage - 1).clamp(0, 9999)),
              onNextPage: () =>
                  setState(() => _currentPage = _currentPage + 1),

              // ✅ actions
              onView: (i) {
                final r = pageRows[i];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Viewing ${r['invoice']}")),
                );
              },
              onEdit: (i) {
                final r = pageRows[i];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Editing ${r['invoice']}")),
                );
              },
              onDelete: (i) {
                final r = pageRows[i];
                setState(() => _billingRows.remove(r));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Deleted ${r['invoice']}")),
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _statusChip(String? status) {
    final isUnpaid = (status ?? '').toLowerCase() == 'unpaid';
    final fg = isUnpaid ? Colors.red : Colors.green;
    final bg = fg.withOpacity(0.12);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status ?? '—',
        style: GoogleFonts.poppins(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: fg,
        ),
      ),
    );
  }
}

