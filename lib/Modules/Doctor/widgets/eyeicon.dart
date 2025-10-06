import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../Models/Patients.dart';
import '../../../Models/dashboardmodels.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

// ---- Theme ----

const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color borderColor = Color(0xFFE5E7EB);
const Color successColor = Color(0xFF10B981);
const Color warningColor = Color(0xFFF59E0B);

class AppointmentDetail extends StatefulWidget {
  final PatientDetails patient;
  const AppointmentDetail({super.key, required this.patient});

  static Future<void> show(BuildContext context, PatientDetails patient) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.35),
      builder: (_) => AppointmentDetail(patient: patient),
    );
  }

  @override
  State<AppointmentDetail> createState() => _AppointmentDetailState();
}

class _AppointmentDetailState extends State<AppointmentDetail> {
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _intakes = [];
  Map<String, dynamic>? _latestIntake;

  @override
  void initState() {
    super.initState();
    _loadIntakes();
  }

  String? _resolvePatientId() {
    final id = widget.patient.patientId;
    return (id.trim().isEmpty) ? null : id.trim();
  }

  Future<void> _loadIntakes() async {
    final pid = _resolvePatientId();
    print('INTAKE DEBUG: resolved patientId -> $pid');
    if (pid == null) {
      setState(() => _error = 'Unable to resolve patient id');
      print('INTAKE DEBUG: patient id unresolved; check PatientDetails fields.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      print('INTAKE DEBUG: calling AuthService.getIntakes for patientId=$pid');
      final resp = await AuthService.instance.getIntakes(patientId: pid, limit: 20, skip: 0);
      print('INTAKE DEBUG: raw response -> $resp');

      List<Map<String, dynamic>> intakes = [];

      // defensive shape handling
      if (resp == null) {
        print('INTAKE DEBUG: response is null');
      } else if (resp is List) {
        try {
          intakes = List<Map<String, dynamic>>.from(resp.map((e) => Map<String, dynamic>.from(e)));
        } catch (e) {
          print('INTAKE DEBUG: failed to coerce List items -> $e');
        }
      } else if (resp is Map && resp.containsKey('intakes')) {
        try {
          final list = resp['intakes'] as List;
          intakes = List<Map<String, dynamic>>.from(list.map((e) => Map<String, dynamic>.from(e)));
        } catch (e) {
          print('INTAKE DEBUG: failed to coerce resp["intakes"] -> $e');
        }
      } else if (resp is Map) {
        try {
          intakes = [Map<String, dynamic>.from(resp)];
        } catch (e) {
          print('INTAKE DEBUG: failed to coerce single resp map -> $e');
        }
      } else {
        print('INTAKE DEBUG: unknown response shape: ${resp.runtimeType}');
      }

      print('INTAKE DEBUG: parsed intakes count = ${intakes.length}');
      setState(() {
        _intakes = intakes;
        _latestIntake = intakes.isNotEmpty ? intakes.first : null;
        _loading = false;
      });
    } catch (err, st) {
      print('INTAKE DEBUG: exception while loading intakes -> $err\n$st');
      setState(() {
        _loading = false;
        _error = (err is Exception) ? err.toString() : 'Failed to load intakes';
      });
    }
  }

  // -------- Pharmacy UI (better fallbacks & formatting) ----------
  Widget _buildPharmacySection() {
    if (_loading) return const SizedBox();
    if (_error != null) return Text(_error!, style: const TextStyle(color: Colors.red));
    if (_latestIntake == null) return const Text('No intake records found', style: TextStyle(color: textSecondaryColor));

    final meta = _latestIntake!['meta'] ?? {};
    dynamic pharmacy = _latestIntake!['pharmacy'] ?? _latestIntake!['pharmacyRecord'] ?? meta['pharmacy'];

    if (pharmacy == null && _intakes.isNotEmpty && _intakes.first.containsKey('pharmacy')) {
      pharmacy = _intakes.first['pharmacy'];
    }

    List items = [];
    try {
      if (pharmacy is Map && pharmacy['items'] is List) items = pharmacy['items'];
      else if (pharmacy is List) items = pharmacy;
    } catch (e) {
      print('PHARMACY DEBUG: error extracting items -> $e');
    }

    print('INTAKE DEBUG: pharmacy items count = ${items.length}');
    if (items.isEmpty) return const Text('No pharmacy data available', style: TextStyle(color: textSecondaryColor));

    final rows = items.map<Map<String, String>>((it) {
      final name = (it['name'] ?? it['Medicine'] ?? it['medicine'] ?? '').toString().trim();

      // numeric fallback: show '—' for 0 / null to avoid misleading zeros
      final qtyNum = (it['quantity'] ?? it['Qty'] ?? it['qty']);
      final qtyStr = (qtyNum == null)
          ? '—'
          : ((num.tryParse(qtyNum.toString()) ?? 0) == 0 ? '—' : qtyNum.toString());

      final priceNum = (it['unitPrice'] ?? it['price']);
      final priceStr = (priceNum == null)
          ? '—'
          : ((num.tryParse(priceNum.toString()) ?? 0) == 0 ? '—' : priceNum.toString());

      return {
        'Medicine': name.isEmpty ? '—' : name,
        'Qty': qtyStr,
        'Price': priceStr,
      };
    }).toList();

    return _ReadOnlyTable(columns: const ['Medicine', 'Qty', 'Price'], rows: rows);
  }

  // -------- Pathology UI (render object results nicely) ----------
  Widget _buildPathologySection() {
    if (_loading) return const SizedBox();
    if (_error != null) return Text(_error!, style: const TextStyle(color: Colors.red));
    if (_latestIntake == null) return const Text('No pathology data', style: TextStyle(color: textSecondaryColor));

    final pathologyRaw = _latestIntake!['pathology'] ?? _latestIntake!['labReports'] ?? _latestIntake!['meta']?['labReportIds'];
    print('INTAKE DEBUG: pathologyRaw -> $pathologyRaw');

    if (pathologyRaw == null) return const Text('No pathology data available', style: TextStyle(color: textSecondaryColor));

    if (pathologyRaw is List && pathologyRaw.isNotEmpty && pathologyRaw.first is String) {
      final rows = pathologyRaw.map<Map<String, String>>((id) => {'Test': id.toString(), 'Result': '—'}).toList();
      return _ReadOnlyTable(columns: const ['Test', 'Result'], rows: rows);
    } else if (pathologyRaw is List) {
      final rows = pathologyRaw.map<Map<String, String>>((p) {
        final name = (p['testType'] ?? p['testName'] ?? p['name'] ?? '').toString().trim();
        final results = p['results'];
        final metadata = p['metadata'] ?? p['meta'] ?? {};

        String resultStr;
        if (results == null) {
          resultStr = (metadata is Map && (metadata['notes'] ?? '').toString().trim().isNotEmpty)
              ? metadata['notes'].toString()
              : '—';
        } else if (results is Map) {
          if (results.isEmpty) {
            resultStr = (metadata is Map && (metadata['notes'] ?? '').toString().trim().isNotEmpty)
                ? metadata['notes'].toString()
                : 'Pending';
          } else {
            // render map as "key: value; key2: value2"
            try {
              resultStr = results.entries.map((e) => '${e.key}: ${e.value}').join('; ');
            } catch (_) {
              resultStr = results.toString();
            }
          }
        } else {
          resultStr = results.toString();
        }

        return {'Test': name.isEmpty ? '—' : name, 'Result': resultStr};
      }).toList();
      return _ReadOnlyTable(columns: const ['Test', 'Result'], rows: rows);
    }

    return const Text('No pathology records found', style: TextStyle(color: textSecondaryColor));
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
          maxHeight: size.height * 0.9,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Material(
                color: backgroundColor,
                child: SizedBox(
                  height: size.height * 0.9,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _ProfileHeaderCard(patient: widget.patient),
                        const SizedBox(height: 16),

                        _SectionCard(
                          icon: Icons.note_alt_outlined,
                          title: "Medical Notes",
                          description: "Patient notes",
                          builder: () {
                            if (_loading) return const Center(child: CircularProgressIndicator());
                            if (_error != null) return Text(_error!, style: const TextStyle(color: Colors.red));
                            final notes = widget.patient.notes?.toString() ?? '';
                            return Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                notes.isNotEmpty ? notes : "No notes available",
                                style: const TextStyle(
                                  color: textSecondaryColor,
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                            );
                          },
                        ),

                        const SizedBox(height: 16),

                        _SectionCard(
                          icon: Icons.local_pharmacy_outlined,
                          title: "Pharmacy",
                          description: "Prescribed medicines",
                          builder: () => _buildPharmacySection(),
                        ),

                        const SizedBox(height: 16),

                        _SectionCard(
                          icon: Icons.biotech_outlined,
                          title: "Pathology",
                          description: "Lab investigations",
                          builder: () => _buildPathologySection(),
                        ),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
            ),

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
                    child: const Icon(
                      Icons.close_rounded,
                      color: AppColors.primary700,
                    ),
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
            leading: Icon(widget.icon, color: AppColors.primary700),
            title: Text(widget.title),
            subtitle: Text(widget.description, style: const TextStyle(color: textSecondaryColor)),
            trailing: Icon(open ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down),
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
String _n(num? v, {String? suffix}) => (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';

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
                color: AppColors.primary700,
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
                color: i.isEven ? Colors.white : const Color(0xFFFEF2F2).withOpacity(0.3),
              ),
              children: columns.map((c) {
                return Padding(
                  padding: const EdgeInsets.all(8),
                  child: Text(
                    rows[i][c] ?? "—",
                    style: const TextStyle(fontSize: 13, color: textPrimaryColor),
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

// ---------------- Widgets ----------------

class _ProfileHeaderCard extends StatelessWidget {
  static const double kRadius = 16;
  static const double kAvatar = 128;
  static const Color kTint = Color(0xFFF9FAFB); // subtle tint behind card
  static const Color kTintLine = Color(0xFFF3F4F6);

  final PatientDetails patient;
  const _ProfileHeaderCard({required this.patient});

  String _n(num? v, {String? suffix}) => (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';

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
      bg = AppColors.primary700.withOpacity(.12);
      fg = AppColors.primary700;
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
