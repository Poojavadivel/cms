import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
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
      final maxH = size.height * 0.9; // Use 90% of screen height instead of fixed max

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
                MouseRegion(
                  cursor: SystemMouseCursors.basic,
                  child: Container(
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
    height: appt.height?.toString() ?? '',
    weight: appt.weight?.toString() ?? '',
    bmi: appt.bmi?.toString() ?? '',
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
  final GlobalKey<EnhancedPharmacyTableState> _pharmacyTableKey = GlobalKey<EnhancedPharmacyTableState>();

  List<Map<String, dynamic>> _pharmacyRows = [];
  List<Map<String, String>> _pathologyRows = [];
  Map<String, dynamic> _followUpData = {};

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

    // Check stock warnings if pharmacy items exist
    if (_pharmacyRows.isNotEmpty && _pharmacyTableKey.currentState != null) {
      final warnings = _pharmacyTableKey.currentState!.getStockWarnings();
      if (warnings.isNotEmpty) {
        final shouldContinue = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Row(
              children: [
                Icon(Iconsax.warning_2, color: AppColors.kWarning, size: 28),
                const SizedBox(width: 12),
                const Text('Stock Warning'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'The following medicines have stock issues:',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                ...warnings.map((w) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        w['type'] == 'OUT_OF_STOCK' ? Iconsax.close_circle : Iconsax.warning_2,
                        size: 16,
                        color: w['type'] == 'OUT_OF_STOCK' ? AppColors.kDanger : AppColors.kWarning,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          w['message'],
                          style: GoogleFonts.inter(fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                )).toList(),
                const SizedBox(height: 12),
                Text(
                  'Do you want to continue anyway?',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.kWarning,
                ),
                child: const Text('Continue Anyway'),
              ),
            ],
          ),
        );
        
        if (shouldContinue != true) {
          return; // User cancelled
        }
      }
    }

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
      'appointmentId': appt.id, // ✨ CRITICAL: Include appointment ID so follow-up data is saved to appointment
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
      'followUp': _followUpData, // Include follow-up planning data
      'updatedAt': DateTime.now().toIso8601String(),
    };

    // Debug: Log what we're sending
    print('💾 [INTAKE SAVE] Sending vitals: ${payload['vitals']}');
    print('💾 [INTAKE SAVE] Appointment ID: ${appt.id}');
    print('💾 [INTAKE SAVE] Follow-Up Data: ${_followUpData.keys.toList()}');
    if (_followUpData['isRequired'] == true) {
      print('💾 [INTAKE SAVE] ✅ Follow-up IS required - will be saved to appointment');
    } else {
      print('💾 [INTAKE SAVE] ⚠️ Follow-up NOT required - will not show in follow-up list');
    }

    try {
      final result = await AuthService.instance.addIntake(payload, patientId: pid);

      if (!mounted) return;
      
      // If there are pharmacy items, create prescription and reduce stock
      if (_pharmacyRows.isNotEmpty) {
        try {
          final prescriptionPayload = {
            'patientId': pid,
            'patientName': appt.patientName,
            'appointmentId': appt.id,
            'intakeId': result['_id'],
            'items': _pharmacyRows.map((row) {
              final quantity = row['quantity'] ?? '1';
              final price = row['price'] ?? '0';
              print('💊 Row data: ${row['Medicine']} | Qty: $quantity | Price: $price');
              return {
                'medicineId': row['medicineId'],
                'Medicine': row['Medicine'] ?? '',
                'Dosage': row['Dosage'] ?? '',
                'Frequency': row['Frequency'] ?? '',
                'Notes': row['Notes'] ?? '',
                'quantity': quantity,
                'price': price,
              };
            }).toList(),
            'paid': false,
            'paymentMethod': 'Cash',
          };

          print('📝 Creating prescription with ${prescriptionPayload['items']?.length ?? 0} items...');
          final prescriptionResult = await AuthService.instance.post(
            '/api/pharmacy/prescriptions/create-from-intake',
            prescriptionPayload,
          );
          
          if (prescriptionResult != null) {
            final total = prescriptionResult['total'] ?? 0.0;
            final reductions = prescriptionResult['stockReductions'] ?? [];
            print('✅ Prescription created! Total: ₹$total');
            print('📦 Stock reduced from ${reductions.length} batch(es)');
          }
        } catch (e) {
          print('⚠️ Warning: Failed to create prescription: $e');
          // Don't fail the entire save if prescription creation fails
        }
      }
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_pharmacyRows.isEmpty 
              ? '✅ Intake saved successfully' 
              : '✅ Intake saved & prescription created with stock reduction'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
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
          child: SingleChildScrollView(
            key: const ValueKey('intakeFormScroll'),
            padding: const EdgeInsets.symmetric(horizontal: 4),
            physics: const BouncingScrollPhysics(),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
              _SectionCard(
                key: const ValueKey('medical_notes_section'),
                icon: Icons.note_alt_outlined,
                title: 'Medical Notes',
                description: 'Overview, vitals, and notes history.',
                initiallyExpanded: false,
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
                key: const ValueKey('pharmacy_section'),
                icon: Icons.local_pharmacy_outlined,
                title: 'Pharmacy',
                description: 'Prescribe and manage medications with auto-calculation.',
                initiallyExpanded: false,
                editorBuilder: (_) => EnhancedPharmacyTable(
                  key: _pharmacyTableKey,
                  pharmacyRows: _pharmacyRows,
                  onRowsChanged: (newRows) {
                    if (mounted) {
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted) {
                          setState(() => _pharmacyRows = newRows);
                        }
                      });
                    }
                  },
                ),
              ),

              /// Pathology
              _SectionCard(
                key: const ValueKey('pathology_section'),
                icon: Icons.biotech_outlined,
                title: 'Pathology',
                description: 'Order and track lab investigations.',
                initiallyExpanded: false,
                editorBuilder: (_) => Column(
                  children: [
                    CustomEditableTable(
                      rows: _pathologyRows,
                      columns: const ['Test Name', 'Category', 'Priority', 'Notes'],
                      onDelete: (i) {
                        if (mounted) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            if (mounted) {
                              setState(() => _pathologyRows.removeAt(i));
                            }
                          });
                        }
                      },
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

              /// Follow-Up Planning Section
              _FollowUpPlanningSection(
                key: const ValueKey('followup_section'),
                pathologyRows: _pathologyRows,
                onFollowUpDataChanged: (data) {
                  if (mounted) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted) {
                        setState(() => _followUpData = data);
                      }
                    });
                  }
                },
              ),

              const SizedBox(height: 90),
              ],
            ),
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
  final bool initiallyExpanded;

  const _SectionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.editorBuilder,
    this.initiallyExpanded = true,
  });

  @override
  State<_SectionCard> createState() => _SectionCardState();
}

class _SectionCardState extends State<_SectionCard> {
  late bool open;
  
  @override
  void initState() {
    super.initState();
    open = widget.initiallyExpanded; // Use initiallyExpanded parameter
  }

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
        mainAxisSize: MainAxisSize.min,
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
            onTap: () {
              if (mounted) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    setState(() => open = !open);
                  }
                });
              }
            },
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

    // Safety check - ensure no null rows
    final safeRows = rows.where((row) => row != null).toList();

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
          if (safeRows.isEmpty)
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
              children: List.generate(safeRows.length, (i) {
                final even = i.isEven;
                final row = safeRows[i];
                return Container(
                  key: ValueKey('row_$i'),
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
                                key: ValueKey('field_${i}_$col'),
                                initialValue: row[col]?.toString() ?? '',
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


/// ============== Follow-Up Planning Section ==============
class _FollowUpPlanningSection extends StatefulWidget {
  final Function(Map<String, dynamic>) onFollowUpDataChanged;
  final List<Map<String, String>> pathologyRows;
  
  const _FollowUpPlanningSection({
    super.key, 
    required this.onFollowUpDataChanged,
    required this.pathologyRows,
  });

  @override
  State<_FollowUpPlanningSection> createState() => _FollowUpPlanningSectionState();
}

class _FollowUpPlanningSectionState extends State<_FollowUpPlanningSection> {
  bool _followUpRequired = false;
  String _priority = 'Routine';
  DateTime? _recommendedDate;
  final TextEditingController _reasonCtrl = TextEditingController();
  final TextEditingController _instructionsCtrl = TextEditingController();
  final TextEditingController _diagnosisCtrl = TextEditingController();
  final TextEditingController _treatmentPlanCtrl = TextEditingController();
  
  // Lab tests
  List<Map<String, dynamic>> _labTests = [];
  
  // Imaging
  List<Map<String, dynamic>> _imaging = [];
  
  // Procedures
  List<Map<String, dynamic>> _procedures = [];
  
  bool _prescriptionReview = false;
  String _medicationCompliance = 'Unknown';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _updateParent();
      }
    });
  }
  
  void _autoFillLabTestsFromPathology() {
    // Auto-fill lab tests from pathology section when follow-up is enabled
    if (widget.pathologyRows.isNotEmpty && _labTests.isEmpty) {
      setState(() {
        _labTests = widget.pathologyRows.map((pathTest) {
          return {
            'testName': pathTest['Test Name'] ?? '',
            'ordered': false,
            'orderedDate': null,
            'completed': false,
            'completedDate': null,
            'results': '',
            'resultStatus': 'Pending',
          };
        }).toList();
        _updateParent();
      });
    }
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _instructionsCtrl.dispose();
    _diagnosisCtrl.dispose();
    _treatmentPlanCtrl.dispose();
    super.dispose();
  }

  void _updateParent() {
    widget.onFollowUpDataChanged({
      'isRequired': _followUpRequired,
      'priority': _priority,
      'recommendedDate': _recommendedDate?.toIso8601String(),
      'reason': _reasonCtrl.text,
      'instructions': _instructionsCtrl.text,
      'diagnosis': _diagnosisCtrl.text,
      'treatmentPlan': _treatmentPlanCtrl.text,
      'labTests': _labTests,
      'imaging': _imaging,
      'procedures': _procedures,
      'prescriptionReview': _prescriptionReview,
      'medicationCompliance': _medicationCompliance,
    });
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _recommendedDate ?? DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _recommendedDate = picked;
        _updateParent();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      icon: Iconsax.calendar_tick,
      title: 'Follow-Up Planning',
      description: 'Plan next appointment, tests, and monitoring',
      initiallyExpanded: false, // Initially closed
      editorBuilder: (_) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Follow-up Required Toggle
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _followUpRequired ? AppColors.primary.withOpacity(0.08) : AppColors.grey50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _followUpRequired ? AppColors.primary : AppColors.grey200,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Iconsax.calendar_tick,
                  color: _followUpRequired ? AppColors.primary : AppColors.kTextSecondary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Follow-Up Required',
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kTextPrimary,
                        ),
                      ),
                      Text(
                        'Enable to plan follow-up appointment and tests',
                        style: GoogleFonts.roboto(
                          fontSize: 12,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _followUpRequired,
                  onChanged: (value) {
                    setState(() {
                      _followUpRequired = value;
                      if (value) {
                        // Auto-fill lab tests from pathology when enabled
                        _autoFillLabTestsFromPathology();
                      }
                      _updateParent();
                    });
                  },
                  activeColor: AppColors.primary,
                ),
              ],
            ),
          ),

          if (_followUpRequired) ...[
            const SizedBox(height: 20),

            // Priority Selection
            Text(
              'Priority Level',
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: ['Routine', 'Important', 'Urgent', 'Critical'].map((priority) {
                final isSelected = _priority == priority;
                Color getColor() {
                  switch (priority) {
                    case 'Routine': return AppColors.kInfo;
                    case 'Important': return AppColors.kWarning;
                    case 'Urgent': return AppColors.accentPink;
                    case 'Critical': return AppColors.kDanger;
                    default: return AppColors.kInfo;
                  }
                }
                return FilterChip(
                  selected: isSelected,
                  label: Text(priority),
                  onSelected: (selected) {
                    setState(() {
                      _priority = priority;
                      _updateParent();
                    });
                  },
                  selectedColor: getColor().withOpacity(0.2),
                  checkmarkColor: getColor(),
                  labelStyle: GoogleFonts.roboto(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: isSelected ? getColor() : AppColors.kTextSecondary,
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 20),

            // Recommended Follow-Up Date
            Text(
              'Recommended Follow-Up Date',
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: _selectDate,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.grey200, width: 1.5),
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.white,
                ),
                child: Row(
                  children: [
                    Icon(Iconsax.calendar_1, color: AppColors.primary, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _recommendedDate != null
                            ? 'In ${_recommendedDate!.difference(DateTime.now()).inDays} days (${_recommendedDate!.day}/${_recommendedDate!.month}/${_recommendedDate!.year})'
                            : 'Select date',
                        style: GoogleFonts.roboto(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: _recommendedDate != null
                              ? AppColors.kTextPrimary
                              : AppColors.kTextSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Quick date buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                {'label': '1 Week', 'days': 7},
                {'label': '2 Weeks', 'days': 14},
                {'label': '1 Month', 'days': 30},
                {'label': '3 Months', 'days': 90},
              ].map((option) {
                return OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _recommendedDate = DateTime.now().add(Duration(days: option['days'] as int));
                      _updateParent();
                    });
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(color: AppColors.primary.withOpacity(0.5)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  ),
                  child: Text(option['label'] as String),
                );
              }).toList(),
            ),

            const SizedBox(height: 20),

            // Reason
            TextField(
              controller: _reasonCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'Follow-Up Reason *',
                hintText: 'e.g., Monitor treatment response, review lab results',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (_) => _updateParent(),
            ),

            const SizedBox(height: 16),

            // Patient Instructions
            TextField(
              controller: _instructionsCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'Patient Instructions',
                hintText: 'e.g., Continue medication, avoid strenuous activity',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (_) => _updateParent(),
            ),

            const SizedBox(height: 16),

            // Diagnosis
            TextField(
              controller: _diagnosisCtrl,
              decoration: InputDecoration(
                labelText: 'Diagnosis/Condition',
                hintText: 'Primary diagnosis requiring follow-up',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (_) => _updateParent(),
            ),

            const SizedBox(height: 16),

            // Treatment Plan
            TextField(
              controller: _treatmentPlanCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'Treatment Plan',
                hintText: 'Current treatment being monitored',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (_) => _updateParent(),
            ),

            const SizedBox(height: 24),

            // Lab Tests Section
            _buildTestSection(
              title: 'Lab Tests to Order',
              icon: Iconsax.health,
              items: _labTests,
              onAdd: () {
                setState(() {
                  _labTests.add({
                    'testName': '',
                    'ordered': false,
                    'completed': false,
                  });
                  _updateParent();
                });
              },
              onRemove: (index) {
                setState(() {
                  _labTests.removeAt(index);
                  _updateParent();
                });
              },
              onEdit: (index, key, value) {
                setState(() {
                  _labTests[index][key] = value;
                  _updateParent();
                });
              },
            ),

            const SizedBox(height: 20),

            // Imaging Section
            _buildTestSection(
              title: 'Imaging/Radiology',
              icon: Iconsax.scan,
              items: _imaging,
              onAdd: () {
                setState(() {
                  _imaging.add({
                    'imagingType': '',
                    'ordered': false,
                    'completed': false,
                  });
                  _updateParent();
                });
              },
              onRemove: (index) {
                setState(() {
                  _imaging.removeAt(index);
                  _updateParent();
                });
              },
              onEdit: (index, key, value) {
                setState(() {
                  _imaging[index][key] = value;
                  _updateParent();
                });
              },
            ),

            const SizedBox(height: 20),

            // Procedures Section
            _buildTestSection(
              title: 'Procedures to Schedule',
              icon: Iconsax.clipboard_tick,
              items: _procedures,
              onAdd: () {
                setState(() {
                  _procedures.add({
                    'procedureName': '',
                    'scheduled': false,
                    'completed': false,
                  });
                  _updateParent();
                });
              },
              onRemove: (index) {
                setState(() {
                  _procedures.removeAt(index);
                  _updateParent();
                });
              },
              onEdit: (index, key, value) {
                setState(() {
                  _procedures[index][key] = value;
                  _updateParent();
                });
              },
            ),

            const SizedBox(height: 20),

            // Medication Review
            CheckboxListTile(
              value: _prescriptionReview,
              onChanged: (value) {
                setState(() {
                  _prescriptionReview = value ?? false;
                  _updateParent();
                });
              },
              title: Text(
                'Prescription Review Required',
                style: GoogleFonts.roboto(fontSize: 14, fontWeight: FontWeight.w500),
              ),
              subtitle: Text(
                'Review and adjust medications at follow-up',
                style: GoogleFonts.roboto(fontSize: 12, color: AppColors.kTextSecondary),
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),

            const SizedBox(height: 12),

            // Medication Compliance
            Text(
              'Medication Compliance Assessment',
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: ['Good', 'Fair', 'Poor', 'Unknown'].map((compliance) {
                final isSelected = _medicationCompliance == compliance;
                return ChoiceChip(
                  label: Text(compliance),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _medicationCompliance = compliance;
                      _updateParent();
                    });
                  },
                  selectedColor: AppColors.primary.withOpacity(0.2),
                  labelStyle: GoogleFonts.roboto(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: isSelected ? AppColors.primary : AppColors.kTextSecondary,
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTestSection({
    required String title,
    required IconData icon,
    required List<Map<String, dynamic>> items,
    required VoidCallback onAdd,
    required Function(int) onRemove,
    required Function(int, String, dynamic) onEdit,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              title,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
            const Spacer(),
            IconButton(
              onPressed: onAdd,
              icon: Icon(Icons.add_circle, color: AppColors.primary),
              tooltip: 'Add',
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.grey50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.grey200),
            ),
            child: Center(
              child: Text(
                'No items added',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  color: AppColors.kTextSecondary,
                ),
              ),
            ),
          )
        else
          ...List.generate(items.length, (index) {
            final item = items[index];
            if (item == null) return const SizedBox.shrink();
            final nameKey = item.containsKey('testName') ? 'testName' : 
                           item.containsKey('imagingType') ? 'imagingType' : 'procedureName';
            return Container(
              key: ValueKey('test_item_$index'),
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.grey200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      key: ValueKey('${nameKey}_$index'),
                      initialValue: item[nameKey]?.toString() ?? '',
                      decoration: InputDecoration(
                        hintText: 'Enter name...',
                        border: InputBorder.none,
                        isDense: true,
                      ),
                      onChanged: (value) => onEdit(index, nameKey, value),
                    ),
                  ),
                  IconButton(
                    onPressed: () => onRemove(index),
                    icon: Icon(Icons.delete, color: AppColors.kDanger, size: 20),
                    tooltip: 'Remove',
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}

/// ============== Profile Header ==============


