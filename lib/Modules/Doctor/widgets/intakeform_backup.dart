import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Models/dashboardmodels.dart';
import '../../../Models/Patients.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Api_handler.dart';
import '../../../Utils/Colors.dart';
import '../../../Widgets/patient_profile_header_card.dart';
import 'enhanced_pharmacy_table.dart';

ThemeData _intakeTheme(BuildContext context) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
    scaffoldBackgroundColor: AppColors.background,
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
                        color: AppColors.white,
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
                            color: AppColors.white,
                            border: Border.all(color: AppColors.grey200),
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
        backgroundColor: AppColors.background,
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

// Helper function to convert DashboardAppointments to PatientDetails for ProfileCard
PatientDetails _convertApptToPatient(DashboardAppointments appt) {
  return PatientDetails(
    patientId: appt.patientId,
    name: appt.patientName,
    gender: appt.gender,
    age: appt.patientAge,
    phone: '',
    address: appt.location,
    city: appt.location,
    pincode: '',
    dateOfBirth: appt.dob,
    bloodGroup: appt.bloodGroup ?? 'O+',
    height: appt.height.toString(),
    weight: appt.weight.toString(),
    bmi: appt.bmi.toString(),
    oxygen: '',
    lastVisitDate: appt.date,
    notes: appt.currentNotes ?? '',
    medicalHistory: const [],
    allergies: const [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    patientCode: appt.patientCode,
    insuranceNumber: '',
    expiryDate: '',
    avatarUrl: appt.patientAvatarUrl,
    doctorId: '',
  );
}

/// ============== SHARED BODY ==============
class IntakeFormBody extends StatefulWidget {
  final DashboardAppointments appt;
  const IntakeFormBody({super.key, required this.appt});

  @override
  State<IntakeFormBody> createState() => _IntakeFormBodyState();
}

class _IntakeFormBodyState extends State<IntakeFormBody> {
  final TextEditingController _currentNotesCtrl = TextEditingController();
  final TextEditingController _heightCtrl = TextEditingController();
  final TextEditingController _weightCtrl = TextEditingController();
  final TextEditingController _bmiCtrl = TextEditingController();
  final TextEditingController _spo2Ctrl = TextEditingController();

  final List<Map<String, String>> _pharmacyRows = [];
  final List<Map<String, String>> _pathologyRows = [];

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();

    // If appointment already contains vitals, prefill controllers
    final appt = widget.appt;
    try {
      final vitals = (appt as dynamic).vitals;
      if (vitals != null && vitals is Map) {
        final height = vitals['height_cm']?.toString() ?? vitals['height']?.toString();
        final weight = vitals['weight_kg']?.toString() ?? vitals['weight']?.toString();
        final bmi = vitals['bmi']?.toString();

        if (height != null && height.isNotEmpty) _heightCtrl.text = height;
        if (weight != null && weight.isNotEmpty) _weightCtrl.text = weight;
        if (bmi != null && bmi.isNotEmpty) _bmiCtrl.text = bmi;
      } else {
        // fallback fields on appt
        if ((appt as dynamic).height != null) _heightCtrl.text = (appt.height ?? '').toString();
        if ((appt as dynamic).weight != null) _weightCtrl.text = (appt.weight ?? '').toString();
        if ((appt as dynamic).bmi != null) _bmiCtrl.text = (appt.bmi ?? '').toString();
      }

      if ((appt as dynamic).currentNotes != null) {
        _currentNotesCtrl.text = (appt.currentNotes ?? '').toString();
      }

     
    } catch (_) {
      // ignore if appt structure is different
    }

    // Auto-calc BMI when height or weight changes
    _heightCtrl.addListener(_maybeComputeBmi);
    _weightCtrl.addListener(_maybeComputeBmi);
  }

  void _maybeComputeBmi() {
    final hText = _heightCtrl.text.trim();
    final wText = _weightCtrl.text.trim();
    if (hText.isEmpty || wText.isEmpty) return;

    final h = double.tryParse(hText);
    final w = double.tryParse(wText);
    if (h == null || w == null || h <= 0) return;

    // height is in cm => convert to meters
    final hMeters = h / 100.0;
    final bmi = w / (hMeters * hMeters);
    // keep 1 decimal place
    _bmiCtrl.text = bmi.isFinite ? bmi.toStringAsFixed(1) : _bmiCtrl.text;
  }

  @override
  void dispose() {
    _currentNotesCtrl.dispose();
    _heightCtrl.removeListener(_maybeComputeBmi);
    _heightCtrl.dispose();
    _weightCtrl.removeListener(_maybeComputeBmi);
    _weightCtrl.dispose();
    _bmiCtrl.dispose();
    _spo2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _saveForm() async {
    // Prevent double submission
    if (_isSaving) return;

    setState(() => _isSaving = true);

    final appt = widget.appt;
    final pid = appt.patientId?.toString() ?? '';
    if (pid.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Missing patient id — cannot save intake.')),
        );
        setState(() => _isSaving = false);
      }
      return;
    }

    final payload = {
      'patientId': pid,
      'patientName': appt.patientName,
      'vitals': {
        'heightCm': _heightCtrl.text.trim(),
        'height_cm': _heightCtrl.text.trim(), // backward compatibility
        'weightKg': _weightCtrl.text.trim(),
        'weight_kg': _weightCtrl.text.trim(), // backward compatibility
        'bmi': _bmiCtrl.text.trim(),
        'spo2': _spo2Ctrl.text.trim(),
      },
      'currentNotes': _currentNotesCtrl.text.trim(),
      'pharmacy': _pharmacyRows.map((r) => {
        'name': r['Medicine'] ?? '',
        'Medicine': r['Medicine'] ?? '',
        'dosage': r['Dosage'] ?? '',
        'Dosage': r['Dosage'] ?? '',
        'frequency': r['Frequency'] ?? '',
        'Frequency': r['Frequency'] ?? '',
        'notes': r['Notes'] ?? '',
        'Notes': r['Notes'] ?? '',
      }).toList(),
      'pathology': _pathologyRows.map((r) => Map.of(r)).toList(),
      'updatedAt': DateTime.now().toIso8601String(),
    };

    // Debug: Log what we're sending
    print('💾 [INTAKE SAVE] Sending vitals: ${payload['vitals']}');

    try {
      final result = await AuthService.instance.addIntake(payload, patientId: pid);

      if (!mounted) return;
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Intake saved successfully'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );

      // Close the dialog/page and return the saved object
      Navigator.of(context).pop(result);

    } on ApiException catch (apiErr) {
      if (!mounted) return;
      debugPrint('API error saving intake: ${apiErr.message}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Save failed: ${apiErr.message}')),
      );
    } catch (e, st) {
      if (!mounted) return;
      debugPrint('Unexpected error saving intake: $e\n$st');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Save failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appt = widget.appt;
    final patientDetails = _convertApptToPatient(appt);

    return Column(
      children: [
        const SizedBox(height: 10),
        PatientProfileHeaderCard(patient: patientDetails),
        const SizedBox(height: 12),
        Expanded(
          child: ListView(
            children: [
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
                            color: AppColors.kTextPrimary)),
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
                  ],
                ),
              ),

              /// Pharmacy
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
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.buttonBg,
                          foregroundColor: AppColors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              /// Pathology
              _SectionCard(
                icon: Icons.biotech_outlined,
                title: 'Pathology',
                description: 'Order and track lab investigations.',
                editorBuilder: (_) => Column(
                  children: [
                    CustomEditableTable(
                      rows: _pathologyRows,
                      columns: const ['Test Name', 'Category', 'Priority', 'Notes'],
                      onDelete: (i) => setState(() => _pathologyRows.removeAt(i)),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _pathologyRows.add({
                              'Test Name': '',
                              'Category': '',
                              'Priority': '',
                              'Notes': '',
                            });
                          });
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Add Test'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.buttonBg,
                          foregroundColor: AppColors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 90),
            ],
          ),
        ),

        /// Save Bar
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            border: Border(
              top: BorderSide(color: AppColors.grey200, width: 1),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 6,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _saveForm,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                  backgroundColor: AppColors.transparent,
                ),
                child: Ink(
                  decoration: BoxDecoration(
                    gradient: AppColors.brandGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: _isSaving
                        ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                        : Text(
                      "Save Intake Form",
                      style: GoogleFonts.lexend(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        )
      ],
    );
  }
}

/// ============== SectionCard (unchanged except colors) ==============
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
      color: AppColors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.grey200.withOpacity(0.6)),
      ),
      child: Column(
        children: [
          ListTile(
            leading: Icon(widget.icon, color: AppColors.primary),
            title: Text(widget.title,
                style: TextStyle(color: AppColors.kTextPrimary)),
            subtitle: Text(widget.description,
                style: const TextStyle(color: AppColors.kTextSecondary)),
            trailing: Icon(
              open ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
              color: AppColors.primary600,
            ),
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

/// ============== Editable Table ==============
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

  Future<void> _confirmDelete(BuildContext context, int index) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm delete'),
        content: const Text('Are you sure you want to delete this row?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.kDanger,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok == true) onDelete(index);
  }

  @override
  Widget build(BuildContext context) {
    // computed widths
    final actionColWidth = 84.0;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
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
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: AppColors.rowAlternate,
            child: Row(
              children: [
                for (var col in columns)
                  Expanded(
                    child: Text(
                      col.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.tableHeader,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                SizedBox(
                  width: actionColWidth,
                  child: Center(
                    child: Text(
                      'ACTION',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.tableHeader,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Divider
          Divider(height: 1, color: AppColors.grey200),

          // Rows
          if (rows.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'No items — add one using the Add button.',
                      style: GoogleFonts.inter(
                        color: AppColors.kTextSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            Column(
              children: List.generate(rows.length, (i) {
                final even = i.isEven;
                final row = rows[i];
                return Container(
                  color: even ? AppColors.white : AppColors.rowAlternate.withOpacity(0.6),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      for (var col in columns)
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(minHeight: 40),
                              child: TextFormField(
                                initialValue: row[col] ?? '',
                                onChanged: (v) => row[col] = v,
                                style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextPrimary),
                                decoration: InputDecoration(
                                  isDense: true,
                                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
                                  hintText: col,
                                  hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary),
                                  filled: true,
                                  fillColor: Colors.transparent,
                                  border: OutlineInputBorder(
                                    borderSide: BorderSide.none,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                      // Action column
                      SizedBox(
                        width: actionColWidth,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // compact outlined delete "pill"
                            Tooltip(
                              message: 'Delete row',
                              child: SizedBox(
                                height: 34,
                                child: OutlinedButton.icon(
                                  onPressed: () => _confirmDelete(context, i),
                                  icon: const Icon(Icons.delete_outline, size: 16),
                                  label: const Text('Delete', style: TextStyle(fontSize: 12)),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.kDanger,
                                    side: BorderSide(color: AppColors.kDanger.withOpacity(0.12)),
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }
}


/// ============== Profile Header ==============


