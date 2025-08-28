import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Models/dashboardmodels.dart';

/// DoctorAppointmentPreview
/// - Red theme
/// - Pixel-accurate to your screenshot
/// - Efficient: small widgets, const where safe, no heavy deps
/// - All tabs working: Overview, Patient profile, BGL Analysis, Medications, Lab results, Mini Goals
/// - Accepts DashboardAppointments and maps common field names; swap getters if needed
class DoctorAppointmentPreview extends StatefulWidget {
  final DashboardAppointments appointment;

  const DoctorAppointmentPreview({
    super.key,
    required this.appointment,
  });

  @override
  State<DoctorAppointmentPreview> createState() => _DoctorAppointmentPreviewState();
}

class _DoctorAppointmentPreviewState extends State<DoctorAppointmentPreview>
    with SingleTickerProviderStateMixin {
  // THEME (Enterprise Red)
  static const Color kPrimary = Color(0xFFEF4444); // red-500
  static const Color kPrimary600 = Color(0xFFDC2626); // red-600
  static const Color kBg = Color(0xFFF9FAFB); // gray-50
  static const Color kCard = Colors.white;
  static const Color kText = Color(0xFF111827); // gray-900
  static const Color kMuted = Color(0xFF6B7280); // gray-500
  static const Color kBorder = Color(0xFFE5E7EB); // gray-200
  static const double kRadius = 12;

  late final TabController _tab;
  late final TextStyle baseText;

  // ========= SAFE ACCESSORS (work off toJson/toMap if available) =========
  Map<String, dynamic>? _jsonFrom(dynamic o) {
    try {
      final m = (o as dynamic).toJson?.call();
      if (m is Map<String, dynamic>) return m;
    } catch (_) {}
    return null;
  }

  Map<String, dynamic>? _mapFrom(dynamic o) {
    try {
      final m = (o as dynamic).toMap?.call();
      if (m is Map<String, dynamic>) return m;
    } catch (_) {}
    return null;
  }

  /// Returns first non-null string found in any of the given keys in toJson()/toMap().
  String _getString(List<String> keys, String fallback) {
    final a = widget.appointment;
    final jm = _jsonFrom(a);
    if (jm != null) {
      for (final k in keys) {
        final v = jm[k];
        if (v != null) return v.toString();
      }
    }
    final mm = _mapFrom(a);
    if (mm != null) {
      for (final k in keys) {
        final v = mm[k];
        if (v != null) return v.toString();
      }
    }
    return fallback;
  }

  /// Returns a list of strings for the first matching list key in toJson()/toMap().
  List<String> _getListS(List<String> keys, List<String> fallback) {
    final a = widget.appointment;
    final jm = _jsonFrom(a);
    if (jm != null) {
      for (final k in keys) {
        final v = jm[k];
        if (v is List) return v.map((e) => e.toString()).toList();
      }
    }
    final mm = _mapFrom(a);
    if (mm != null) {
      for (final k in keys) {
        final v = mm[k];
        if (v is List) return v.map((e) => e.toString()).toList();
      }
    }
    return fallback;
  }

  /// Returns a list of maps for the first matching list key in toJson()/toMap().
  List<Map<String, dynamic>> _getListM(
      List<String> keys, List<Map<String, dynamic>> fallback) {
    final a = widget.appointment;
    List<Map<String, dynamic>> _normalize(List src) {
      return src.map<Map<String, dynamic>>((e) {
        if (e is Map<String, dynamic>) return e;
        try {
          final m = (e as dynamic).toJson?.call();
          if (m is Map<String, dynamic>) return m;
        } catch (_) {}
        return <String, dynamic>{};
      }).toList();
    }

    final jm = _jsonFrom(a);
    if (jm != null) {
      for (final k in keys) {
        final v = jm[k];
        if (v is List) return _normalize(v);
      }
    }
    final mm = _mapFrom(a);
    if (mm != null) {
      for (final k in keys) {
        final v = mm[k];
        if (v is List) return _normalize(v);
      }
    }
    return fallback;
  }

  /// Returns a map for the first matching map key in toJson()/toMap().
  Map<String, dynamic> _getMap(
      List<String> keys, Map<String, dynamic> fallback) {
    final a = widget.appointment;
    final jm = _jsonFrom(a);
    if (jm != null) {
      for (final k in keys) {
        final v = jm[k];
        if (v is Map<String, dynamic>) return v;
      }
    }
    final mm = _mapFrom(a);
    if (mm != null) {
      for (final k in keys) {
        final v = mm[k];
        if (v is Map<String, dynamic>) return v;
      }
    }
    return fallback;
  }

  // ================== FIELD GETTERS WITH FALLBACKS ==================
  String get pName => _getString(['patientName', 'name', 'fullName'], 'Ahmed Ali Hussain');
  String get pType => _getString(['type', 'patientType'], 'Type 2');
  String get pGender => _getString(['gender'], 'Male');
  String get pLoc => _getString(['location', 'address'], 'Babesh sayed,Giza');
  String get pJob => _getString(['occupation', 'job'], 'Accountant');
  String get pDob => _getString(['dob', 'birthInfo'], '12 Dec 1997 (28 years)');
  String get pBMI => _getString(['bmi'], '22.4');
  String get pWt => _getString(['weight', 'weightKg'], '92');
  String get pHt => _getString(['height', 'heightCm'], '175');
  String get pBp => _getString(['bloodPressure', 'bp'], '124/80');

  String get dName => _getString(['doctorName'], 'Ahmed Kamal');
  String get dRole => _getString(['doctorRole'], 'Doctor');

  List<String> get ownDx =>
      _getListS(['diagnosis', 'ownDiagnosis'], ['Obesity', 'Uncontrolled Sugar']);
  List<String> get barriers =>
      _getListS(['barriers', 'healthBarriers'], ['Fear of medication', 'Fear of insulin']);

  List<Map<String, dynamic>> get timeline => _getListM(['timeline'], [
    {'date': 'Dec 2022', 'title': 'Pre-Diabetic', 'desc': 'A1c: 10.4'},
    {'date': 'Jan 2022', 'title': 'Type 2', 'desc': 'A1c: 10.4'},
    {'date': 'Jul 2022', 'title': 'Chronic thyroid disorder', 'desc': 'A1c: 10.4'},
    {'date': 'Jul 2022', 'title': 'Angina Pectoris', 'desc': 'A1c: 10.4'},
    {'date': 'Jul 2022', 'title': 'Stroke', 'desc': ''},
  ]);

  Map<String, dynamic> get medHistory => _getMap(['medicalHistory'], {
    'chronic': 'IHD, Obesity, Chronic thyroid disorder',
    'emergencies': 'Diabetic ketoacidosis',
    'surgery': 'Liposuction',
    'family': 'Obesity (Father)',
    'complications':
    'Nephropathy, Neuropathy, Retinopathy, Diabetic feet, Sexual dysfunction',
  });

  List<Map<String, dynamic>> get medications => _getListM(['medications'], []);
  List<Map<String, dynamic>> get labResults => _getListM(['labResults'], [
    {'name': 'HbA1c', 'value': '10.4%', 'date': '2022-12-01', 'ref': '< 5.7%'},
    {'name': 'Fasting Glucose', 'value': '160 mg/dL', 'date': '2022-12-01', 'ref': '70–100'},
  ]);
  List<Map<String, dynamic>> get bglSeries => _getListM(['bglSeries'], [
    {'date': '2022-10-01', 'value': 180},
    {'date': '2022-11-01', 'value': 170},
    {'date': '2022-12-01', 'value': 165},
    {'date': '2023-01-01', 'value': 160},
  ]);
  List<Map<String, dynamic>> get miniGoals => _getListM(['goals'], [
    {'title': 'Walk 30 mins/day', 'progress': 0.6},
    {'title': 'Reduce sugar drinks', 'progress': 0.4},
    {'title': 'Medication adherence', 'progress': 0.8},
  ]);

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 6, vsync: this);
    baseText = GoogleFonts.inter(); // Inter base
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(20),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1280, maxHeight: 780),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Material(
            color: kBg,
            elevation: 4,
            shadowColor: Colors.black26,
            child: Column(
              children: [
                // HEADER
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(IconX.back),
                            color: kMuted,
                            splashRadius: 22,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            "$pName | $pType",
                            style: GoogleFonts.lexend(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: kText,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // TABS
                Container(
                  color: Colors.white,
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
                      Tab(text: "Overview"),
                      Tab(text: "Patient Profile"),
                      Tab(text: "BGL Analysis"),
                      Tab(text: "Medications"),
                      Tab(text: "Lab Results"),
                      // Tab(text: "Mini Goals"),
                    ],
                  ),
                ),
                const Divider(height: 1, thickness: 1, color: kBorder),

                // BODY
                Expanded(
                  child: Container(
                    color: kBg,
                    child: TabBarView(
                      controller: _tab,
                      children: [
                        _OverviewTab(
                          text: baseText,
                          pName: pName,
                          pGender: pGender,
                          pLoc: pLoc,
                          pJob: pJob,
                          pDob: pDob,
                          pBMI: pBMI,
                          pWt: pWt,
                          pHt: pHt,
                          pBp: pBp,
                          ownDx: ownDx,
                          barriers: barriers,
                          timeline: timeline,
                          medHistory: medHistory,
                        ),
                        _PatientProfileTab(
                          patientId: "H23-00987",
                          name: pName,
                          gender: pGender,
                          dob: pDob,
                          age: "28",
                          phone: "+91 9876543210",
                          email: "ahmed@example.com",
                          address: pLoc,
                          doctorName: dName,
                          primaryDiagnosis: "Type 2 Diabetes",
                          diagnoses: ownDx,
                          allergies: ["Penicillin"],
                          chronicConditions: ["IHD", "Thyroid disorder"],
                          height: pHt,
                          weight: pWt,
                          bmi: pBMI,
                          bp: pBp,
                          heartRate: "78",
                          emergencyContactName: "Ali Hussain",
                          emergencyContactPhone: "+91 9988776655",
                        ),
                        _BglTab(series: bglSeries, text: baseText,),
                        _MedicationsTab(rows: medications, text: baseText,),
                        _LabsTab(text: baseText, rows: labResults),
                      ],
                    ),
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

// ================== TABS ==================

class _OverviewTab extends StatelessWidget {
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
  });

  final TextStyle text;
  final String pName, pGender, pLoc, pJob, pDob, pBMI, pWt, pHt, pBp;
  final List<String> ownDx, barriers;
  final List<Map<String, dynamic>> timeline;
  final Map<String, dynamic> medHistory;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _SummaryCard(
            text: text,
            pName: pName,
            pGender: pGender,
            pLoc: pLoc,
            pJob: pJob,
            pDob: pDob,
            pBMI: pBMI,
            pWt: pWt,
            pHt: pHt,
            pBp: pBp,
            ownDx: ownDx,
            barriers: barriers,
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _TimelineCard(text: text, items: timeline)),
              const SizedBox(width: 16),
              Expanded(child: _MedicalHistoryCard(text: text, data: medHistory)),
            ],
          ),
          const SizedBox(height: 16),
          _MedicationsCard(text: text, rows: const []), // empty state like screenshot
        ],
      ),
    );
  }
}

// ==================== MYTHIC-LEVEL PATIENT PROFILE TAB ====================

class _PatientProfileTab extends StatelessWidget {
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

  final String patientId, name, gender, dob, age, phone, email, address;
  final String doctorName, primaryDiagnosis, height, weight, bmi, bp, heartRate;
  final List<String> diagnoses, allergies, chronicConditions;
  final String emergencyContactName, emergencyContactPhone;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: LayoutBuilder(
        builder: (context, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Patient Profile",
                      style: GoogleFonts.lexend(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1F2937), // gray-800
                      ),
                    ),
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        foregroundColor: _DoctorAppointmentPreviewState.kPrimary,
                        textStyle: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onPressed: () {},
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text("Edit"),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // KPI strip
                _KpiStrip(
                  bmi: bmi,
                  bp: bp,
                  hr: heartRate,
                  height: height,
                  weight: weight,
                ),

                const SizedBox(height: 20),
                const _SectionDivider(),

                // Demographics
                _SectionTitle("Demographics"),
                const SizedBox(height: 12),
                _InfoGrid(children: [
                  _InfoTile(icon: Icons.badge_outlined, label: "Patient ID", value: patientId),
                  _InfoTile(icon: Icons.person_outline, label: "Full Name", value: name),
                  _InfoTile(icon: Icons.wc_outlined, label: "Gender", value: gender),
                  _InfoTile(icon: Icons.cake_outlined, label: "Date of Birth", value: "$dob  (Age $age)"),
                  _InfoTile(icon: Icons.call_outlined, label: "Phone", value: phone),
                  _InfoTile(icon: Icons.alternate_email_outlined, label: "Email", value: email),
                  _InfoTile(icon: Icons.location_on_outlined, label: "Address", value: address, wide: true),
                ]),

                const SizedBox(height: 20),
                const _SectionDivider(),

                // Clinical Snapshot
                _SectionTitle("Clinical Snapshot"),
                const SizedBox(height: 12),
                _InfoGrid(children: [
                  _InfoTile(icon: Icons.local_hospital_outlined, label: "Primary Diagnosis", value: primaryDiagnosis, wide: true),
                  _ChipBlock(label: "Other Diagnoses", items: diagnoses, color: _DoctorAppointmentPreviewState.kPrimary),
                  _ChipBlock(label: "Allergies", items: allergies, color: const Color(0xFFF59E0B)), // amber-500
                  _ChipBlock(label: "Chronic Conditions", items: chronicConditions, color: const Color(0xFF2563EB)), // blue-600
                  _InfoTile(icon: Icons.height, label: "Height", value: "$height cm"),
                  _InfoTile(icon: Icons.monitor_weight_outlined, label: "Weight", value: "$weight kg"),
                  _InfoTile(icon: Icons.monitor_heart_outlined, label: "Blood Pressure", value: bp),
                  _InfoTile(icon: Icons.favorite_outline, label: "Heart Rate", value: "$heartRate bpm"),
                  _InfoTile(icon: Icons.calculate_outlined, label: "BMI", value: bmi),
                ]),

                const SizedBox(height: 20),
                const _SectionDivider(),

                // Care context
                _SectionTitle("Care Context"),
                const SizedBox(height: 12),
                _InfoGrid(children: [
                  _InfoTile(icon: Icons.medical_information_outlined, label: "Doctor", value: doctorName),
                  _InfoTile(icon: Icons.groups_2_outlined, label: "Care Team", value: "N/A"),
                  _InfoTile(icon: Icons.event_outlined, label: "Next Appointment", value: "Not Scheduled"),
                ]),

                const SizedBox(height: 20),
                const _SectionDivider(),

                // Emergency
                _SectionTitle("Emergency Contact"),
                const SizedBox(height: 12),
                _InfoGrid(children: [
                  _InfoTile(icon: Icons.contact_emergency_outlined, label: "Contact Name", value: emergencyContactName),
                  _InfoTile(icon: Icons.phone_enabled_outlined, label: "Phone", value: emergencyContactPhone),
                ]),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ==================== SUB-WIDGETS (scoped to Patient Profile) ====================

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.lexend(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: const Color(0xFF374151), // gray-700
      ),
    );
  }
}

class _SectionDivider extends StatelessWidget {
  const _SectionDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(vertical: 2),
      color: _DoctorAppointmentPreviewState.kBorder,
    );
  }
}

class _InfoGrid extends StatelessWidget {
  const _InfoGrid({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    // Responsive 2-column grid that gracefully wraps
    return LayoutBuilder(
      builder: (context, c) {
        final maxW = c.maxWidth;
        final tileW = 320.0; // target width per tile
        final crossAxisCount = (maxW ~/ tileW).clamp(1, 3);
        return GridView.count(
          crossAxisCount: crossAxisCount,
          childAspectRatio: 3.6,
          mainAxisSpacing: 16,
          crossAxisSpacing: 24,
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          children: children,
        );
      },
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    this.wide = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    final tile = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: _DoctorAppointmentPreviewState.kPrimary),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF6B7280), // gray-500
                  )),
              const SizedBox(height: 4),
              SelectableText(
                (value.isEmpty ? "-" : value),
                style: GoogleFonts.lexend(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF111827), // gray-900
                ),
              ),
            ],
          ),
        ),
      ],
    );

    if (!wide) return tile;

    // If wide: span full width by wrapping in GridTile with colspan behavior via SizedBox
    return SizedBox(width: double.infinity, child: tile);
  }
}

class _ChipBlock extends StatelessWidget {
  const _ChipBlock({
    required this.label,
    required this.items,
    required this.color,
  });

  final String label;
  final List<String> items;
  final Color color;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return _InfoTile(icon: Icons.label_outline, label: label, value: "-");
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.label_important_outline, size: 18, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF6B7280),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items
              .map(
                (e) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: color.withOpacity(0.10),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: color.withOpacity(0.25)),
              ),
              child: Text(
                e,
                style: GoogleFonts.lexend(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ),
          )
              .toList(),
        ),
      ],
    );
  }
}

class _KpiStrip extends StatelessWidget {
  const _KpiStrip({
    required this.bmi,
    required this.bp,
    required this.hr,
    required this.height,
    required this.weight,
  });

  final String bmi;
  final String bp;
  final String hr;
  final String height;
  final String weight;

  @override
  Widget build(BuildContext context) {
    Widget kpi(String label, String value, {IconData? icon}) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF1F2), // red-50
          border: Border.all(color: const Color(0xFFFECACA)), // red-200
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 18, color: _DoctorAppointmentPreviewState.kPrimary),
              const SizedBox(width: 8),
            ],
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: GoogleFonts.lexend(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF111827),
                  ),
                ),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        kpi('BMI', bmi, icon: Icons.calculate_outlined),
        kpi('Blood Pressure', bp, icon: Icons.monitor_heart_outlined),
        kpi('Heart Rate', '$hr bpm', icon: Icons.favorite_outline),
        kpi('Height', '$height cm', icon: Icons.height),
        kpi('Weight', '$weight kg', icon: Icons.monitor_weight_outlined),
      ],
    );
  }
}


/// Styled key–value block for patient info
// class _InfoBlock extends StatelessWidget {
//   const _InfoBlock({required this.label, required this.value});
//
//   final String label;
//   final String value;
//
//   @override
//   Widget build(BuildContext context) {
//     return SizedBox(
//       width: 220,
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Text(
//             label,
//             style: GoogleFonts.inter(
//               fontSize: 13,
//               fontWeight: FontWeight.w500,
//               color: const Color(0xFF6B7280), // gray-500
//             ),
//           ),
//           const SizedBox(height: 4),
//           Text(
//             value,
//             style: GoogleFonts.lexend(
//               fontSize: 15,
//               fontWeight: FontWeight.w600,
//               color: const Color(0xFF111827), // gray-900
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }


class _BglTab extends StatelessWidget {
  const _BglTab({required this.series, required TextStyle text});

  final List<Map<String, dynamic>> series;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ===== Header =====
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "BGL Analysis",
                  style: GoogleFonts.lexend(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                const _EditBtn(),
              ],
            ),

            const SizedBox(height: 20),

            // ===== KPI Row =====
            if (series.isNotEmpty)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _Kpi(label: "Latest BGL", value: "${series.last['value']} mg/dL"),
                  _Kpi(label: "First BGL", value: "${series.first['value']} mg/dL"),
                  _Kpi(
                    label: "Change",
                    value:
                    "${((series.last['value'] - series.first['value']) as num).toString()} mg/dL",
                  ),
                ],
              ),

            const SizedBox(height: 24),

            // ===== Chart =====
            SizedBox(
              height: 200,
              child: CustomPaint(
                painter: _SparklinePainter(
                  series.map<double>((e) => ((e['value'] ?? 0) as num).toDouble()).toList(),
                  showDots: true,
                  shade: true,
                ),
                child: const SizedBox.expand(),
              ),
            ),

            const SizedBox(height: 16),

            // ===== Dates under chart =====
            Wrap(
              spacing: 16,
              runSpacing: 6,
              children: series
                  .map(
                    (e) => Text(
                  "${e['date']}: ${e['value']} mg/dL",
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: _DoctorAppointmentPreviewState.kMuted,
                  ),
                ),
              )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

/// ===== KPI Block =====
class _Kpi extends StatelessWidget {
  const _Kpi({required this.label, required this.value});
  final String label, value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2), // red-50
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)), // red-200
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: GoogleFonts.lexend(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF111827),
            ),
          ),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: _DoctorAppointmentPreviewState.kMuted,
            ),
          ),
        ],
      ),
    );
  }
}

/// ===== Edit Button (styled) =====
class _EditBtn extends StatelessWidget {
  const _EditBtn({this.onTap});
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.edit_outlined, size: 16, color: _DoctorAppointmentPreviewState.kPrimary),
      label: Text(
        "Edit",
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: _DoctorAppointmentPreviewState.kPrimary,
        ),
      ),
    );
  }
}

/// ===== Sparkline with dots + shade =====
class _SparklinePainter extends CustomPainter {
  _SparklinePainter(this.values, {this.showDots = false, this.shade = false});
  final List<double> values;
  final bool showDots;
  final bool shade;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty) return;

    final minV = values.reduce((a, b) => a < b ? a : b);
    final maxV = values.reduce((a, b) => a > b ? a : b);
    final range = (maxV - minV) == 0 ? 1.0 : (maxV - minV);

    final points = <Offset>[];
    for (int i = 0; i < values.length; i++) {
      final x = i * size.width / (values.length - 1);
      final y = size.height - ((values[i] - minV) / range) * size.height;
      points.add(Offset(x, y));
    }

    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (var p in points.skip(1)) {
      path.lineTo(p.dx, p.dy);
    }

    // Shade under line
    if (shade) {
      final shadePath = Path.from(path)
        ..lineTo(points.last.dx, size.height)
        ..lineTo(points.first.dx, size.height)
        ..close();
      final shadePaint = Paint()
        ..shader = LinearGradient(
          colors: [
            _DoctorAppointmentPreviewState.kPrimary.withOpacity(0.25),
            Colors.transparent,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
      canvas.drawPath(shadePath, shadePaint);
    }

    // Draw line
    final stroke = Paint()
      ..color = _DoctorAppointmentPreviewState.kPrimary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2;
    canvas.drawPath(path, stroke);

    // Draw dots
    if (showDots) {
      final dotPaint = Paint()..color = _DoctorAppointmentPreviewState.kPrimary;
      for (var p in points) {
        canvas.drawCircle(p, 3, dotPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SparklinePainter old) {
    return old.values != values || old.showDots != showDots || old.shade != shade;
  }
}


class _MedicationsTab extends StatefulWidget {
  const _MedicationsTab({required this.rows, required TextStyle text});

  final List<Map<String, dynamic>> rows;

  @override
  State<_MedicationsTab> createState() => _MedicationsTabState();
}

class _MedicationsTabState extends State<_MedicationsTab> {
  late List<Map<String, dynamic>> _rows;

  @override
  void initState() {
    super.initState();
    _rows = widget.rows;
  }

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // ===== Header =====
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Medications",
                  style: GoogleFonts.lexend(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        // TODO: implement edit logic
                      },
                      icon: const Icon(Icons.edit_outlined,
                          size: 16,
                          color: _DoctorAppointmentPreviewState.kPrimary),
                      label: Text(
                        "Edit",
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: _DoctorAppointmentPreviewState.kPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                        // TODO: implement add note logic
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _DoctorAppointmentPreviewState.kPrimary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      icon: const Icon(Icons.add, size: 16),
                      label: Text("Notes",
                          style: GoogleFonts.inter(
                              fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ===== Table =====
            Expanded(
              child: _rows.isEmpty
                  ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.medical_services_outlined,
                        size: 64,
                        color:
                        _DoctorAppointmentPreviewState.kPrimary.withOpacity(0.3)),
                    const SizedBox(height: 12),
                    Text(
                      "No Medications Assigned",
                      style: GoogleFonts.lexend(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: _DoctorAppointmentPreviewState.kMuted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Click +Notes to add medication details.",
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: _DoctorAppointmentPreviewState.kMuted,
                      ),
                    ),
                  ],
                ),
              )
                  : Scrollbar(
                thumbVisibility: true,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    headingTextStyle: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: const Color(0xFF374151),
                    ),
                    dataTextStyle: GoogleFonts.lexend(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF111827),
                    ),
                    headingRowColor: MaterialStateProperty.all(
                        const Color(0xFFFFF1F2)), // red-50
                    dataRowColor: MaterialStateProperty.resolveWith(
                            (states) => states.contains(MaterialState.selected)
                            ? const Color(0xFFFFE4E6)
                            : Colors.white),
                    columnSpacing: 24,
                    horizontalMargin: 16,
                    columns: const [
                      DataColumn(label: Text("Name")),
                      DataColumn(label: Text("Indication")),
                      DataColumn(label: Text("Status")),
                      DataColumn(label: Text("Sig")),
                      DataColumn(label: Text("Start Date")),
                      DataColumn(label: Text("Assigned By")),
                      DataColumn(label: Text("Note")),
                    ],
                    rows: _rows
                        .map(
                          (r) => DataRow(
                        cells: [
                          DataCell(Text(r['name'] ?? '-')),
                          DataCell(Text(r['indication'] ?? '-')),
                          DataCell(Text(r['status'] ?? '-')),
                          DataCell(Text(r['sig'] ?? '-')),
                          DataCell(Text(r['startDate'] ?? '-')),
                          DataCell(Text(r['assignedBy'] ?? '-')),
                          DataCell(Text(r['note'] ?? '-')),
                        ],
                      ),
                    )
                        .toList(),
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

// -----------------------------------------------------------------------------
// IconX: lightweight alias so you can “use icon from the iconx”
// -----------------------------------------------------------------------------
class IconX {
  static const IconData beaker = Icons.biotech_outlined;
  static const IconData back = Icons.arrow_back_ios;
  static const IconData range = Icons.straighten;
  static const IconData calendar = Icons.event_outlined;
  static const IconData normal = Icons.check_circle_outline;
  static const IconData high = Icons.trending_up_outlined;
  static const IconData low = Icons.trending_down_outlined;
  static const IconData edit = Icons.edit_outlined;
  static const IconData export = Icons.file_download_outlined;
  static const IconData goal = Icons.flag_outlined;
  static const IconData done = Icons.verified_outlined;
  static const IconData progress = Icons.timelapse_outlined;
  static const IconData add = Icons.add;
}

// -----------------------------------------------------------------------------
// MYTHIC-LEVEL LABS TAB (keeps same class name/signature)
// -----------------------------------------------------------------------------
class _LabsTab extends StatelessWidget {
  const _LabsTab({required this.text, required this.rows});
  final TextStyle text;
  final List<Map<String, dynamic>> rows;

  @override
  Widget build(BuildContext context) {
    // Compute KPI counts
    final parsed = rows.map((r) => _LabRow.fromMap(r)).toList();
    int total = parsed.length;
    int high = parsed.where((e) => e.status == _LabStatus.high).length;
    int low = parsed.where((e) => e.status == _LabStatus.low).length;
    int normal = parsed.where((e) => e.status == _LabStatus.normal).length;

    return _Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Lab Results',
                  style: GoogleFonts.lexend(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: () {},
                      icon: Icon(IconX.edit,
                          size: 16, color: _DoctorAppointmentPreviewState.kPrimary),
                      label: Text(
                        'Edit',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: _DoctorAppointmentPreviewState.kPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                        // TODO: hook up export
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _DoctorAppointmentPreviewState.kPrimary,
                        foregroundColor: Colors.white,
                        padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                      icon: const Icon(IconX.export, size: 16),
                      label: Text(
                        'Export',
                        style: GoogleFonts.inter(
                            fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 16),

            // KPI strip
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _LabKpi(
                  icon: IconX.beaker,
                  label: 'Total',
                  value: '$total',
                  bg: const Color(0xFFFFF1F2),
                  border: const Color(0xFFFECACA),
                ),
                _LabKpi(
                  icon: IconX.high,
                  label: 'High',
                  value: '$high',
                  bg: const Color(0xFFFFF1F2),
                  border: const Color(0xFFFECACA),
                ),
                _LabKpi(
                  icon: IconX.low,
                  label: 'Low',
                  value: '$low',
                  bg: const Color(0xFFFFF1F2),
                  border: const Color(0xFFFECACA),
                ),
                _LabKpi(
                  icon: IconX.normal,
                  label: 'Normal',
                  value: '$normal',
                  bg: const Color(0xFFEFF6FF),
                  border: const Color(0xFFBFDBFE),
                  fg: const Color(0xFF2563EB),
                ),
              ],
            ),

            const SizedBox(height: 20),
            _SectionDivider(),

            const SizedBox(height: 8),

            if (rows.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Row(
                  children: [
                    Icon(IconX.beaker,
                        size: 48,
                        color:
                        _DoctorAppointmentPreviewState.kPrimary.withOpacity(0.25)),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('No lab results',
                            style: GoogleFonts.lexend(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: _DoctorAppointmentPreviewState.kMuted)),
                        const SizedBox(height: 4),
                        Text('Add labs to see trends and flags here.',
                            style: GoogleFonts.inter(
                                fontSize: 13,
                                color: _DoctorAppointmentPreviewState.kMuted)),
                      ],
                    ),
                  ],
                ),
              )
            else
            // Table
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Column(
                  children: [
                    Container(
                      height: 44,
                      color: const Color(0xFFFFF1F2),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          _LabTh(icon: IconX.beaker, label: 'Test'),
                          _LabTh(icon: IconX.range, label: 'Value'),
                          _LabTh(icon: IconX.range, label: 'Reference'),
                          _LabTh(icon: IconX.calendar, label: 'Date'),
                          _LabTh(icon: IconX.normal, label: 'Flag'),
                        ],
                      ),
                    ),
                    ...parsed.map((r) => Container(
                      decoration: const BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                              color: _DoctorAppointmentPreviewState.kBorder),
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(
                          vertical: 12, horizontal: 12),
                      child: Row(
                        children: [
                          Expanded(
                              child: Text(r.name,
                                  style: GoogleFonts.lexend(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w600))),
                          Expanded(
                              child: Text(r.valueRaw,
                                  style: GoogleFonts.inter(fontSize: 13))),
                          Expanded(
                              child: Text(r.refRaw,
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color:
                                      _DoctorAppointmentPreviewState.kMuted))),
                          Expanded(
                              child: Text(r.date,
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color:
                                      _DoctorAppointmentPreviewState.kMuted))),
                          Expanded(child: _LabFlag(status: r.status)),
                        ],
                      ),
                    )),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

enum _LabStatus { high, low, normal, unknown }

class _LabRow {
  final String name;
  final String valueRaw;
  final String refRaw;
  final String date;
  final _LabStatus status;

  _LabRow({
    required this.name,
    required this.valueRaw,
    required this.refRaw,
    required this.date,
    required this.status,
  });

  static _LabRow fromMap(Map<String, dynamic> m) {
    final name = (m['name'] ?? '-').toString();
    final valueRaw = (m['value'] ?? '-').toString();
    final refRaw = (m['ref'] ?? '-').toString();
    final date = (m['date'] ?? '-').toString();

    _LabStatus status = _inferStatus(valueRaw, refRaw);
    return _LabRow(
      name: name,
      valueRaw: valueRaw,
      refRaw: refRaw,
      date: date,
      status: status,
    );
  }

  static _LabStatus _inferStatus(String value, String ref) {
    // Simple numeric parser: if ref looks like "70–100" or "70-100"
    final num? val = _tryNum(value);
    if (val == null) return _LabStatus.unknown;

    final range = _tryRange(ref);
    if (range == null) return _LabStatus.unknown;

    if (val < range.$1) return _LabStatus.low;
    if (val > range.$2) return _LabStatus.high;
    return _LabStatus.normal;
  }

  static num? _tryNum(String s) {
    // strip unit suffixes like " mg/dL" or "%"
    final cleaned = s.replaceAll(RegExp(r'[^0-9\.\-]'), '');
    if (cleaned.isEmpty) return null;
    return num.tryParse(cleaned);
  }

  // returns (low, high)
  static (num, num)? _tryRange(String s) {
    final m = RegExp(r'([0-9\.]+)\s*[-–]\s*([0-9\.]+)').firstMatch(s);
    if (m == null) return null;
    final a = num.tryParse(m.group(1)!);
    final b = num.tryParse(m.group(2)!);
    if (a == null || b == null) return null;
    final lo = a < b ? a : b;
    final hi = a < b ? b : a;
    return (lo, hi);
  }
}

class _LabKpi extends StatelessWidget {
  const _LabKpi({
    required this.icon,
    required this.label,
    required this.value,
    required this.bg,
    required this.border,
    this.fg,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color bg;
  final Color border;
  final Color? fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: fg ?? _DoctorAppointmentPreviewState.kPrimary),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value,
                  style: GoogleFonts.lexend(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF111827))),
              Text(label,
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: _DoctorAppointmentPreviewState.kMuted)),
            ],
          ),
        ],
      ),
    );
  }
}

class _LabTh extends StatelessWidget {
  const _LabTh({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF374151)),
          const SizedBox(width: 6),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF374151))),
        ],
      ),
    );
  }
}

class _LabFlag extends StatelessWidget {
  const _LabFlag({required this.status});
  final _LabStatus status;

  @override
  Widget build(BuildContext context) {
    late IconData icon;
    late String text;
    late Color color;
    switch (status) {
      case _LabStatus.high:
        icon = IconX.high;
        text = 'High';
        color = const Color(0xFFB91C1C);
        break;
      case _LabStatus.low:
        icon = IconX.low;
        text = 'Low';
        color = const Color(0xFFB45309);
        break;
      case _LabStatus.normal:
        icon = IconX.normal;
        text = 'Normal';
        color = const Color(0xFF2563EB);
        break;
      default:
        icon = Icons.help_outline;
        text = '—';
        color = _DoctorAppointmentPreviewState.kMuted;
    }

    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Text(text,
            style: GoogleFonts.inter(
                fontSize: 12.5, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// MYTHIC-LEVEL GOALS TAB (keeps same class name/signature)
// -----------------------------------------------------------------------------
// class _GoalsTab extends StatelessWidget {
//   const _GoalsTab({required this.text, required this.goals});
//   final TextStyle text;
//   final List<Map<String, dynamic>> goals;
//
//   @override
//   Widget build(BuildContext context) {
//     return _Card(
//       child: Padding(
//         padding: const EdgeInsets.all(20),
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             // Header
//             Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'Mini Goals',
//                   style: GoogleFonts.lexend(
//                     fontSize: 20,
//                     fontWeight: FontWeight.w700,
//                     color: const Color(0xFF1F2937),
//                   ),
//                 ),
//                 ElevatedButton.icon(
//                   onPressed: () {
//                     // TODO: add goal
//                   },
//                   style: ElevatedButton.styleFrom(
//                     backgroundColor: _DoctorAppointmentPreviewState.kPrimary,
//                     foregroundColor: Colors.white,
//                     padding:
//                     const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
//                     shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(8)),
//                     elevation: 0,
//                   ),
//                   icon: const Icon(IconX.add, size: 16),
//                   label: Text('Add',
//                       style: GoogleFonts.inter(
//                           fontSize: 14, fontWeight: FontWeight.w600)),
//                 ),
//               ],
//             ),
//
//             const SizedBox(height: 16),
//             _SectionDivider(),
//             const SizedBox(height: 12),
//
//             if (goals.isEmpty)
//               Padding(
//                 padding: const EdgeInsets.symmetric(vertical: 24),
//                 child: Row(
//                   children: [
//                     Icon(IconX.goal,
//                         size: 48,
//                         color:
//                         _DoctorAppointmentPreviewState.kPrimary.withOpacity(0.25)),
//                     const SizedBox(width: 12),
//                     Column(
//                       crossAxisAlignment: CrossAxisAlignment.start,
//                       children: [
//                         Text('No goals yet',
//                             style: GoogleFonts.lexend(
//                                 fontSize: 16,
//                                 fontWeight: FontWeight.w600,
//                                 color: _DoctorAppointmentPreviewState.kMuted)),
//                         const SizedBox(height: 4),
//                         Text('Create goals to track patient progress.',
//                             style: GoogleFonts.inter(
//                                 fontSize: 13,
//                                 color: _DoctorAppointmentPreviewState.kMuted)),
//                       ],
//                     ),
//                   ],
//                 ),
//               )
//             else
//               LayoutBuilder(
//                 builder: (context, c) {
//                   final maxW = c.maxWidth;
//                   final cardW = 360.0;
//                   final cols = (maxW ~/ cardW).clamp(1, 3);
//                   return GridView.builder(
//                     shrinkWrap: true,
//                     physics: const NeverScrollableScrollPhysics(),
//                     gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
//                       crossAxisCount: cols,
//                       mainAxisSpacing: 16,
//                       crossAxisSpacing: 16,
//                       childAspectRatio: 1.9,
//                     ),
//                     itemCount: goals.length,
//                     itemBuilder: (_, i) {
//                       final g = goals[i];
//                       return _GoalCard(goal: _GoalModel.fromMap(g));
//                     },
//                   );
//                 },
//               ),
//           ],
//         ),
//       ),
//     );
//   }
// }

// class _GoalModel {
//   final String title;
//   final double progress; // 0..1
//   final String? due;     // ISO or readable
//   final String? category;
//
//   _GoalModel({
//     required this.title,
//     required this.progress,
//     this.due,
//     this.category,
//   });
//
//   factory _GoalModel.fromMap(Map<String, dynamic> m) {
//     return _GoalModel(
//       title: (m['title'] ?? '-').toString(),
//       progress: ((m['progress'] ?? 0.0) as num).toDouble().clamp(0.0, 1.0),
//       due: m['due']?.toString(),
//       category: m['category']?.toString(),
//     );
//   }
// }
//
// class _GoalCard extends StatelessWidget {
//   const _GoalCard({required this.goal});
//   final _GoalModel goal;
//
//   @override
//   Widget build(BuildContext context) {
//     final pct = (goal.progress * 100).round();
//     final statusIcon = pct >= 100
//         ? IconX.done
//         : (pct >= 50 ? IconX.progress : IconX.goal);
//     final statusColor = pct >= 100
//         ? const Color(0xFF059669) // green-600
//         : (pct >= 50 ? const Color(0xFFF59E0B) : _DoctorAppointmentPreviewState.kPrimary);
//
//     return Container(
//       padding: const EdgeInsets.all(16),
//       decoration: BoxDecoration(
//         color: Colors.white,
//         border: Border.all(color: _DoctorAppointmentPreviewState.kBorder),
//         borderRadius: BorderRadius.circular(12),
//         boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0,1))],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           // Title + status
//           Row(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Icon(statusIcon, size: 20, color: statusColor),
//               const SizedBox(width: 8),
//               Expanded(
//                 child: Text(
//                   goal.title,
//                   style: GoogleFonts.lexend(
//                     fontSize: 15.5,
//                     fontWeight: FontWeight.w700,
//                     color: const Color(0xFF111827),
//                   ),
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 10),
//
//           // Progress bar
//           ClipRRect(
//             borderRadius: BorderRadius.circular(999),
//             child: LinearProgressIndicator(
//               value: goal.progress,
//               minHeight: 10,
//               backgroundColor: const Color(0xFFFFE4E6),
//               valueColor: AlwaysStoppedAnimation<Color>(statusColor),
//             ),
//           ),
//           const SizedBox(height: 8),
//
//           // Meta row
//           Row(
//             children: [
//               Text(
//                 '$pct%',
//                 style: GoogleFonts.inter(
//                   fontSize: 12.5,
//                   fontWeight: FontWeight.w700,
//                   color: const Color(0xFF374151),
//                 ),
//               ),
//               const SizedBox(width: 12),
//               if (goal.category != null && goal.category!.isNotEmpty)
//                 _Pill(label: goal.category!, color: const Color(0xFF2563EB)),
//               const Spacer(),
//               if (goal.due != null && goal.due!.isNotEmpty)
//                 Row(
//                   children: [
//                     const Icon(IconX.calendar, size: 16, color: Color(0xFF6B7280)),
//                     const SizedBox(width: 6),
//                     Text(
//                       goal.due!,
//                       style: GoogleFonts.inter(
//                         fontSize: 12.5,
//                         color: const Color(0xFF6B7280),
//                         fontWeight: FontWeight.w500,
//                       ),
//                     ),
//                   ],
//                 ),
//             ],
//           ),
//         ],
//       ),
//     );
//   }
// }

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.25)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

// ================= REUSABLE BLOCKS =================

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _DoctorAppointmentPreviewState.kCard,
        borderRadius: BorderRadius.circular(_DoctorAppointmentPreviewState.kRadius),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1))],
      ),
      child: child,
    );
  }
}

class _SectionHead extends StatelessWidget {
  const _SectionHead({required this.text, required this.title, this.trailing});
  final TextStyle text;
  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: text.copyWith(fontSize: 15, fontWeight: FontWeight.w600)),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
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
  });

  final TextStyle text;
  final String pName, pGender, pLoc, pJob, pDob, pBMI, pWt, pHt, pBp;
  final List<String> ownDx, barriers;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFFFCDD2), width: 4),
              shape: BoxShape.circle,
            ),
            child: const CircleAvatar(
              radius: 44,
              backgroundImage: AssetImage('assets/boyicon.png'),
            ),
          ),
          const SizedBox(width: 16),

          // Identity + vitals
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(pName,
                    style: text.copyWith(fontSize: 18, fontWeight: FontWeight.w700, color: _DoctorAppointmentPreviewState.kText)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 18,
                  runSpacing: 8,
                  children: const [
                    _Info(icon: Icons.male),
                    _Info(icon: Icons.person_outline),
                    _Info(icon: Icons.work_outline),
                    _Info(icon: Icons.cake),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _Vital(value: '22.4', note: 'BMI > 30'),
                    _Vital(value: '92kg', note: 'Weight > 65kg'),
                    _Vital(value: '175cm', note: 'Height'),
                    _Vital(value: '124/80', note: 'Blood P. (mmHg) > 30'),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 16),

          // Actions + Chips
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const _PrimaryBtn(label: 'Edit', onTap: null),
              const SizedBox(height: 10),
              Text('Own diagnosis', style: GoogleFonts.roboto(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: ownDx
                    .map((e) => const _Chip(label: null))
                    .toList()
                    .asMap()
                    .entries
                    .map((entry) => _Chip(
                  label: ownDx[entry.key],
                  bg: const Color(0xFFFFE4E6),
                  fg: _DoctorAppointmentPreviewState.kPrimary600,
                ))
                    .toList(),
              ),
              const SizedBox(height: 10),
              Text('Health barriers', style: GoogleFonts.roboto(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: barriers
                    .map((e) => _Chip(label: e, bg: const Color(0xFFFFF7ED), fg: const Color(0xFFB45309)))
                    .toList(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.text, required this.items});
  final TextStyle text;
  final List<Map<String, dynamic>> items;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        children: [
          _SectionHead(text: text, title: 'Timeline', trailing: _TextBtn(label: 'Edit', onTap: null)),
          const SizedBox(height: 8),
          Column(
            children: items
                .map((t) => _TimelineTile(
              date: t['date']?.toString() ?? '',
              title: t['title']?.toString() ?? '',
              desc: t['desc']?.toString() ?? '',
            ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _MedicalHistoryCard extends StatelessWidget {
  const _MedicalHistoryCard({required this.text, required this.data});
  final TextStyle text;
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionHead(text: text, title: 'Medical History', trailing: _TextBtn(label: 'Edit', onTap: null)),
            const SizedBox(height: 8),
            GridView(
              shrinkWrap: true,
              padding: EdgeInsets.zero,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 24,
                childAspectRatio: 4.2,
              ),
              children: [
                _KV('Chronic disease', data['chronic']?.toString() ?? '-'),
                _KV('Diabetes Emergencies', data['emergencies']?.toString() ?? '-'),
                _KV('Surgery', data['surgery']?.toString() ?? '-'),
                _KV('Family disease', data['family']?.toString() ?? '-'),
                GridTile(
                  header: Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text('Diabetes related complication',
                        style: GoogleFonts.roboto(fontSize: 12, color: _DoctorAppointmentPreviewState.kMuted)),
                  ),
                  child: Text(
                    data['complications']?.toString() ?? '-',
                    style: GoogleFonts.roboto(fontSize: 14, fontWeight: FontWeight.w500),
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

class _MedicationsCard extends StatelessWidget {
  const _MedicationsCard({required this.text, required this.rows});
  final TextStyle text;
  final List<Map<String, dynamic>> rows;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHead(
            text: text,
            title: 'Medications',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                _TextBtn(label: 'Edit', onTap: null),
                SizedBox(width: 8),
                _PrimaryBtn(label: '+ Notes', onTap: null),
              ],
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: _DoctorAppointmentPreviewState.kBorder),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Container(
                    height: 44,
                    color: const Color(0xFFFFF1F2),
                    child: Row(
                      children: const [
                        _Th('NAME'),
                        _Th('IND.'),
                        _Th('STATUS'),
                        _Th('SIG'),
                        _Th('START DATE'),
                        _Th('ASSIGN BY'),
                        _Th('NOTE'),
                      ],
                    ),
                  ),
                  if (rows.isEmpty)
                    Container(
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.all(16),
                      child: Text('No medications yet',
                          style: GoogleFonts.roboto(fontSize: 13, color: _DoctorAppointmentPreviewState.kMuted)),
                    )
                  else
                    ...rows.map((r) => Container(
                      decoration: const BoxDecoration(
                        border: Border(bottom: BorderSide(color: _DoctorAppointmentPreviewState.kBorder)),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        children: [
                          _Td(r['name']),
                          _Td(r['indication']),
                          _Td(r['status']),
                          _Td(r['sig']),
                          _Td(r['startDate']),
                          _Td(r['assignedBy']),
                          _Td(r['note']),
                        ],
                      ),
                    )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// =============== MICRO WIDGETS ===============

// class _SectionHead extends StatelessWidget {
//   const _SectionHead({required this.text, required this.title, this.trailing});
//   final TextStyle text;
//   final String title;
//   final Widget? trailing;
//
//   @override
//   Widget build(BuildContext context) {
//     return Row(
//       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//       children: [
//         Text(title, style: text.copyWith(fontSize: 15, fontWeight: FontWeight.w600)),
//         if (trailing != null) trailing!,
//       ],
//     );
//   }
// }

class _Info extends StatelessWidget {
  const _Info({required this.icon, this.label});
  final IconData icon;
  final String? label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: _DoctorAppointmentPreviewState.kMuted),
        if (label != null) ...[
          const SizedBox(width: 6),
          Text(label!, style: GoogleFonts.roboto(fontSize: 13, color: _DoctorAppointmentPreviewState.kMuted)),
        ],
      ],
    );
  }
}

class _Vital extends StatelessWidget {
  const _Vital({required this.value, required this.note});
  final String value;
  final String note;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: GoogleFonts.roboto(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(note, style: GoogleFonts.roboto(fontSize: 12, color: _DoctorAppointmentPreviewState.kMuted)),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, this.bg, this.fg});
  final String? label;
  final Color? bg;
  final Color? fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg ?? const Color(0xFFFFE4E6), borderRadius: BorderRadius.circular(999)),
      child: Text(label ?? '-', style: GoogleFonts.roboto(fontSize: 11, color: fg ?? _DoctorAppointmentPreviewState.kPrimary600)),
    );
  }
}

class _TextBtn extends StatelessWidget {
  const _TextBtn({required this.label, required this.onTap});
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(foregroundColor: _DoctorAppointmentPreviewState.kPrimary),
      child: Text(label, style: GoogleFonts.roboto(fontSize: 13, fontWeight: FontWeight.w500)),
    );
  }
}

class _PrimaryBtn extends StatelessWidget {
  const _PrimaryBtn({required this.label, required this.onTap});
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: _DoctorAppointmentPreviewState.kPrimary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        elevation: 0,
      ),
      child: Text(label, style: GoogleFonts.roboto(fontSize: 13)),
    );
  }
}

class _TimelineTile extends StatelessWidget {
  const _TimelineTile({required this.date, required this.title, required this.desc});
  final String date, title, desc;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dot + stem
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Column(
              children: [
                const SizedBox(height: 2),
                Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: _DoctorAppointmentPreviewState.kPrimary,
                    shape: BoxShape.circle,
                  ),
                ),
                Container(width: 2, height: 40, color: Color(0xFFFFCDD2)),
              ],
            ),
          ),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(date, style: GoogleFonts.roboto(fontSize: 12, color: _DoctorAppointmentPreviewState.kMuted)),
                Text(title, style: GoogleFonts.roboto(fontSize: 14, fontWeight: FontWeight.w600)),
                if (desc.isNotEmpty)
                  Text(desc, style: GoogleFonts.roboto(fontSize: 12, color: _DoctorAppointmentPreviewState.kMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _KV extends StatelessWidget {
  const _KV(this.k, this.v);
  final String k, v;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 280,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(k, style: GoogleFonts.roboto(fontSize: 12, color: _DoctorAppointmentPreviewState.kMuted)),
          const SizedBox(height: 2),
          Text(v, style: GoogleFonts.roboto(fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _Th extends StatelessWidget {
  const _Th(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Text(
          text,
          style: GoogleFonts.roboto(
            fontSize: 11,
            letterSpacing: 0.5,
            color: _DoctorAppointmentPreviewState.kMuted,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _Td extends StatelessWidget {
  _Td(dynamic value) : _text = value?.toString() ?? '-';
  final String _text;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Text(_text, style: GoogleFonts.roboto(fontSize: 13)),
      ),
    );
  }
}

// =============== SPARKLINE (no extra packages) ===============

// class _SparklinePainter extends CustomPainter {
//   _SparklinePainter(this.values);
//   final List<double> values;
//
//   @override
//   void paint(Canvas canvas, Size size) {
//     if (values.isEmpty) return;
//     final minV = values.reduce((a, b) => a < b ? a : b);
//     final maxV = values.reduce((a, b) => a > b ? a : b);
//     final range = (maxV - minV) == 0 ? 1.0 : (maxV - minV);
//
//     final path = Path();
//     for (int i = 0; i < values.length; i++) {
//       final x = i * size.width / (values.length - 1);
//       final y = size.height - ((values[i] - minV) / range) * size.height;
//       if (i == 0) {
//         path.moveTo(x, y);
//       } else {
//         path.lineTo(x, y);
//       }
//     }
//
//     final stroke = Paint()
//       ..color = _DoctorAppointmentPreviewState.kPrimary
//       ..style = PaintingStyle.stroke
//       ..strokeWidth = 2;
//
//     final grid = Paint()
//       ..color = const Color(0xFFFFE4E6)
//       ..style = PaintingStyle.stroke
//       ..strokeWidth = 1;
//
//     for (int i = 1; i <= 3; i++) {
//       final y = size.height * i / 4;
//       canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
//     }
//
//     canvas.drawPath(path, stroke);
//   }
//
//   @override
//   bool shouldRepaint(covariant _SparklinePainter old) {
//     if (old.values.length != values.length) return true;
//     for (int i = 0; i < values.length; i++) {
//       if (old.values[i] != values[i]) return true;
//     }
//     return false;
//   }
// }