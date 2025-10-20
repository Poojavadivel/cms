import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../Models/Patients.dart';
import '../../../Models/dashboardmodels.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';
import '../../../Widgets/patient_profile_header_card.dart';

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

  // -------- Pharmacy UI (matches write screen columns) ----------
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

    print('INTAKE DEBUG: pharmacy data -> $pharmacy');
    print('INTAKE DEBUG: pharmacy items count = ${items.length}');
    if (items.isEmpty) return const Text('No pharmacy data available', style: TextStyle(color: textSecondaryColor));

    // Match write screen columns: Medicine, Dosage, Frequency, Notes
    final rows = items.map<Map<String, String>>((it) {
      print('INTAKE DEBUG: pharmacy item -> $it');
      final medicine = (it['name'] ?? it['Medicine'] ?? it['medicine'] ?? '').toString().trim();
      final dosage = (it['dosage'] ?? it['Dosage'] ?? '').toString().trim();
      final frequency = (it['frequency'] ?? it['Frequency'] ?? '').toString().trim();
      final notes = (it['notes'] ?? it['Notes'] ?? '').toString().trim();

      return {
        'Medicine': medicine.isEmpty ? '—' : medicine,
        'Dosage': dosage.isEmpty ? '—' : dosage,
        'Frequency': frequency.isEmpty ? '—' : frequency,
        'Notes': notes.isEmpty ? '—' : notes,
      };
    }).toList();

    return _ReadOnlyTable(columns: const ['Medicine', 'Dosage', 'Frequency', 'Notes'], rows: rows);
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
                        PatientProfileHeaderCard(patient: widget.patient, latestIntake: _latestIntake),
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

// ---------------- Read-only Table (matches write screen styling) ----------------
class _ReadOnlyTable extends StatelessWidget {
  final List<String> columns;
  final List<Map<String, String>> rows;

  const _ReadOnlyTable({required this.columns, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          // Header - Blue background to match write screen
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: AppColors.rowAlternate,
            child: Row(
              children: columns
                  .map((c) => Expanded(
                        child: Text(
                          c.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: AppColors.tableHeader,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
          
          // Divider
          Divider(height: 1, color: AppColors.grey200),
          
          // Rows
          if (rows.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text(
                'No data available',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: textSecondaryColor,
                  fontStyle: FontStyle.italic,
                ),
              ),
            )
          else
            ...rows.asMap().entries.map((entry) {
              final index = entry.key;
              final row = entry.value;
              return Container(
                decoration: BoxDecoration(
                  color: index.isEven ? Colors.white : AppColors.rowAlternate.withOpacity(0.6),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: columns
                      .map((col) => Expanded(
                            child: Text(
                              row[col] ?? '—',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: textPrimaryColor,
                              ),
                            ),
                          ))
                      .toList(),
                ),
              );
            }).toList(),
        ],
      ),
    );
  }
}

// ---------------- Existing Widgets ----------------
// Keep your _ProfileHeaderCard, _InfoCard, _CardShell, _ResponsiveScroll
// (from your pasted code above) without change

// ---------------- Widgets ----------------

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
