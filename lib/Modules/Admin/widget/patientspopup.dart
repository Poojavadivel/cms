// lib/modules/patients/patient_form_page.dart

import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/Patients.dart';
import '../../../Models/Doctor.dart';
import '../../../Services/Authservices.dart';

class PatientFormPage extends StatefulWidget {
  final PatientDetails? initial;
  const PatientFormPage({super.key, this.initial});

  @override
  State<PatientFormPage> createState() => _PatientFormPageState();
}

class _PatientFormPageState extends State<PatientFormPage> {
  final _formKey = GlobalKey<FormState>();

  // controllers
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _lastNameCtrl;
  late final TextEditingController _nameCtrl; // full name fallback
  late final TextEditingController _ageCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emergencyNameCtrl;
  late final TextEditingController _emergencyPhoneCtrl;
  late final TextEditingController _bloodGroupCtrl;
  late final TextEditingController _heightCtrl;
  late final TextEditingController _weightCtrl;
  late final TextEditingController _bmiCtrl;
  late final TextEditingController _oxygenCtrl;
  late final TextEditingController _cityCtrl;
  late final TextEditingController _addressCtrl;
  late final TextEditingController _pincodeCtrl;
  late final TextEditingController _insuranceNumberCtrl;
  late final TextEditingController _notesCtrl;
  late final TextEditingController _doctorIdCtrl; // kept for backward compatibility but not used for dropdown
  late final TextEditingController _medicalHistoryCtrl;
  late final TextEditingController _allergiesCtrl;

  bool _isSaving = false;
  String _gender = "Male";

  DateTime? _dob;
  DateTime? _insuranceExpiry;
  DateTime? _lastVisit;

  final List<String> _bloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'O+',
    'O-',
    'AB+',
    'AB-'
  ];

  // Doctor dropdown state
  List<Doctor> _doctors = [];
  bool _loadingDoctors = false;
  String? _selectedDoctorId;
  String? _doctorsError;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;

    _firstNameCtrl = TextEditingController(text: initial?.firstName ?? '');
    _lastNameCtrl = TextEditingController(text: initial?.lastName ?? '');
    _nameCtrl = TextEditingController(text: initial?.name ?? '');
    _ageCtrl = TextEditingController(text: (initial?.age ?? 0) > 0 ? initial!.age.toString() : '');
    _phoneCtrl = TextEditingController(text: initial?.phone ?? '');
    _emergencyNameCtrl = TextEditingController(text: initial?.emergencyContactName ?? '');
    _emergencyPhoneCtrl = TextEditingController(text: initial?.emergencyContactPhone ?? '');
    _bloodGroupCtrl = TextEditingController(text: initial?.bloodGroup ?? '');
    _heightCtrl = TextEditingController(text: initial?.height ?? '');
    _weightCtrl = TextEditingController(text: initial?.weight ?? '');
    _bmiCtrl = TextEditingController(text: '');
    _oxygenCtrl = TextEditingController(text: initial?.oxygen ?? '');
    _cityCtrl = TextEditingController(text: initial?.city ?? '');
    _addressCtrl = TextEditingController(text: initial?.address ?? '');
    _pincodeCtrl = TextEditingController(text: initial?.pincode ?? '');
    _insuranceNumberCtrl = TextEditingController(text: initial?.insuranceNumber ?? '');
    _notesCtrl = TextEditingController(text: initial?.notes ?? '');
    _doctorIdCtrl = TextEditingController(text: initial?.doctorId ?? '');
    _medicalHistoryCtrl = TextEditingController(text: initial?.medicalHistory.join(', ') ?? '');
    _allergiesCtrl = TextEditingController(text: initial?.allergies.join(', ') ?? '');

    _gender = (initial?.gender.isNotEmpty == true) ? initial!.gender : "Male";
    _dob = (initial?.dateOfBirth.isNotEmpty == true) ? DateTime.tryParse(initial!.dateOfBirth) : null;
    _insuranceExpiry = (initial?.expiryDate.isNotEmpty == true) ? DateTime.tryParse(initial!.expiryDate) : null;
    _lastVisit = (initial?.lastVisitDate.isNotEmpty == true) ? DateTime.tryParse(initial!.lastVisitDate) : null;

    // set initial selected doctor id from initial if present
    _selectedDoctorId = (initial?.doctorId?.isNotEmpty == true) ? initial!.doctorId : null;

    // listeners to recalc BMI when height/weight change
    _heightCtrl.addListener(_recalcBmi);
    _weightCtrl.addListener(_recalcBmi);

    // load doctors for dropdown
    _loadDoctors();
    // initial BMI calculation
    WidgetsBinding.instance.addPostFrameCallback((_) => _recalcBmi());
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _nameCtrl.dispose();
    _ageCtrl.dispose();
    _phoneCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    _bloodGroupCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _bmiCtrl.dispose();
    _oxygenCtrl.dispose();
    _cityCtrl.dispose();
    _addressCtrl.dispose();
    _pincodeCtrl.dispose();
    _insuranceNumberCtrl.dispose();
    _notesCtrl.dispose();
    _doctorIdCtrl.dispose();
    _medicalHistoryCtrl.dispose();
    _allergiesCtrl.dispose();
    super.dispose();
  }

  TextStyle get _labelStyle => GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: Colors.grey[800]!,
  );

  InputDecoration _dec({required String hintText, Widget? prefixIcon}) {
    return InputDecoration(
      hintText: hintText,
      prefixIcon: prefixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      filled: true,
      fillColor: Colors.grey.shade50,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey.shade200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.3),
      ),
    );
  }

  Future<void> _loadDoctors({bool force = false}) async {
    if (_loadingDoctors) return;
    setState(() {
      _loadingDoctors = true;
      _doctorsError = null;
    });

    try {
      final docs = await AuthService.instance.fetchAllDoctors();
      if (mounted) {
        setState(() {
          _doctors = docs;
          // If there's an initial doctorId, keep it; otherwise default to null
          if (_selectedDoctorId == null && _doctorIdCtrl.text.isNotEmpty) {
            _selectedDoctorId = _doctorIdCtrl.text;
          }
        });
      }
    } catch (e) {
      debugPrint('Failed to load doctors: $e');
      if (mounted) setState(() => _doctorsError = 'Failed to load doctors. Retry.');
    } finally {
      if (mounted) setState(() => _loadingDoctors = false);
    }
  }

  void _recalcBmi() {
    final hText = _heightCtrl.text.trim();
    final wText = _weightCtrl.text.trim();
    final h = double.tryParse(hText);
    final w = double.tryParse(wText);
    if (h == null || h <= 0 || w == null || w <= 0) {
      _bmiCtrl.text = '';
      return;
    }
    // Height is cm -> convert to meters
    final hm = h / 100.0;
    final bmi = w / (hm * hm);
    _bmiCtrl.text = bmi.isFinite ? bmi.toStringAsFixed(1) : '';
  }

  Future<void> _pickDate(BuildContext ctx, DateTime? initial, void Function(DateTime) onPicked) async {
    final now = DateTime.now();
    final res = await showDatePicker(
      context: ctx,
      initialDate: initial ?? now,
      firstDate: DateTime(1900),
      lastDate: DateTime(now.year + 10),
    );
    if (res != null) setState(() => onPicked(res));
  }

  String _fmtDate(DateTime? d) {
    if (d == null) return '';
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  /// Helper to split or build full name from first/last/name fields
  String _buildDisplayName() {
    final full = _nameCtrl.text.trim();
    if (full.isNotEmpty) return full;
    final fn = _firstNameCtrl.text.trim();
    final ln = _lastNameCtrl.text.trim();
    return (fn + (ln.isNotEmpty ? ' $ln' : '')).trim();
  }

  List<String> _splitCsv(String? raw) {
    if (raw == null) return [];
    return raw.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    final isEdit = widget.initial != null;

    final draft = PatientDetails(
      patientId: widget.initial?.patientId ?? 'temp-${Random().nextInt(999999)}',
      name: _buildDisplayName(),
      firstName: _firstNameCtrl.text.trim().isNotEmpty ? _firstNameCtrl.text.trim() : null,
      lastName: _lastNameCtrl.text.trim().isNotEmpty ? _lastNameCtrl.text.trim() : null,
      age: int.tryParse(_ageCtrl.text.trim()) ?? 0,
      gender: _gender,
      bloodGroup: _bloodGroupCtrl.text.trim(),
      weight: _weightCtrl.text.trim(),
      height: _heightCtrl.text.trim(),
      emergencyContactName: _emergencyNameCtrl.text.trim(),
      emergencyContactPhone: _emergencyPhoneCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      city: _cityCtrl.text.trim(),
      address: _addressCtrl.text.trim(),
      pincode: _pincodeCtrl.text.trim(),
      insuranceNumber: _insuranceNumberCtrl.text.trim(),
      expiryDate: _fmtDate(_insuranceExpiry),
      avatarUrl: widget.initial?.avatarUrl ?? '',
      dateOfBirth: _fmtDate(_dob),
      lastVisitDate: _fmtDate(_lastVisit),
      doctorId: _selectedDoctorId ?? _doctorIdCtrl.text.trim(),
      medicalHistory: _splitCsv(_medicalHistoryCtrl.text),
      allergies: _splitCsv(_allergiesCtrl.text),
      notes: _notesCtrl.text.trim(),
      oxygen: _oxygenCtrl.text.trim(),
      bmi: _bmiCtrl.text.trim(),
      isSelected: widget.initial?.isSelected ?? false,
    );

    try {
      if (isEdit) {
        final ok = await AuthService.instance.updatePatient(draft);
        if (ok && mounted) Navigator.of(context).pop(draft);
      } else {
        final created = await AuthService.instance.createPatient(draft);
        if (created != null && mounted) Navigator.of(context).pop(created);
      }
    } catch (e) {
      debugPrint('PatientFormPage save error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.initial != null;
    final width = MediaQuery.of(context).size.width;
    final contentWidth = width * 0.95;

    // SINGLE visible container (no nested Dialog)
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: contentWidth),
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))],
          ),
          child: Stack(
            children: [
              // Floating close icon


              // Form content (space for close icon)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Form(
                  key: _formKey,
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header
                        const SizedBox(height: 6),
                        Text(isEdit ? 'Edit Patient' : 'Add New Patient',
                            style: GoogleFonts.lexend(fontSize: 20, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 6),
                        Text('Patient profile and contact details', style: GoogleFonts.inter(color: Colors.grey[600])),
                        const SizedBox(height: 18),

                        // Responsive two-column grid using Wrap
                        LayoutBuilder(builder: (ctx, cons) {
                          final isWide = cons.maxWidth >= 760;
                          final colW = isWide ? (cons.maxWidth - 20) / 2 : cons.maxWidth;
                          return Wrap(spacing: 20, runSpacing: 14, children: [
                            // First Name
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _firstNameCtrl,
                                decoration: _dec(hintText: 'First Name', prefixIcon: const Icon(Icons.person)),
                                validator: (v) {
                                  // If full name empty and first name empty, require one of them
                                  if ((_nameCtrl.text.trim().isEmpty) && (v == null || v.trim().isEmpty)) {
                                    return 'Either full name or first name required';
                                  }
                                  return null;
                                },
                              ),
                            ),

                            // Last Name
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _lastNameCtrl,
                                decoration: _dec(hintText: 'Last Name', prefixIcon: const Icon(Icons.person_outline)),
                              ),
                            ),

                            // Full name fallback
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _nameCtrl,
                                decoration: _dec(hintText: 'Full Name (optional)', prefixIcon: const Icon(Icons.badge)),
                              ),
                            ),

                            // Age
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _ageCtrl,
                                decoration: _dec(hintText: 'Age', prefixIcon: const Icon(Icons.cake_outlined)),
                                keyboardType: TextInputType.number,
                                validator: (v) => (v == null || v.trim().isEmpty) ? 'Age required' : null,
                              ),
                            ),

                            // Gender radio group (full width small)
                            SizedBox(
                              width: colW,
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('Gender', style: _labelStyle),
                                Row(children: [
                                  Radio<String>(value: 'Male', groupValue: _gender, onChanged: (v) => setState(() => _gender = v!)),
                                  const SizedBox(width: 4),
                                  const Text('Male'),
                                  const SizedBox(width: 12),
                                  Radio<String>(value: 'Female', groupValue: _gender, onChanged: (v) => setState(() => _gender = v!)),
                                  const SizedBox(width: 4),
                                  const Text('Female'),
                                  const SizedBox(width: 12),
                                  Radio<String>(value: 'Other', groupValue: _gender, onChanged: (v) => setState(() => _gender = v!)),
                                  const SizedBox(width: 4),
                                  const Text('Other'),
                                ]),
                              ]),
                            ),

                            // DOB picker
                            SizedBox(
                              width: colW,
                              child: InkWell(
                                onTap: () => _pickDate(context, _dob, (d) => _dob = d),
                                child: IgnorePointer(
                                  child: TextFormField(
                                    decoration: _dec(hintText: 'Date of Birth', prefixIcon: const Icon(Icons.calendar_today)),
                                    controller: TextEditingController(text: _fmtDate(_dob)),
                                  ),
                                ),
                              ),
                            ),

                            // Phone
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _phoneCtrl,
                                decoration: _dec(hintText: 'Phone', prefixIcon: const Icon(Icons.phone_outlined)),
                                keyboardType: TextInputType.phone,
                                validator: (v) => (v == null || v.trim().isEmpty) ? 'Phone required' : null,
                              ),
                            ),

                            // Emergency name
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _emergencyNameCtrl,
                                decoration: _dec(hintText: 'Emergency Contact Name', prefixIcon: const Icon(Icons.contact_emergency)),
                              ),
                            ),

                            // Emergency phone
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _emergencyPhoneCtrl,
                                decoration: _dec(hintText: 'Emergency Contact Phone', prefixIcon: const Icon(Icons.phone)),
                                keyboardType: TextInputType.phone,
                              ),
                            ),

                            // Blood group
                            SizedBox(
                              width: colW,
                              child: DropdownButtonFormField<String>(
                                decoration: _dec(hintText: 'Blood Group'),
                                value: _bloodGroupCtrl.text.isNotEmpty ? _bloodGroupCtrl.text : null,
                                items: _bloodGroups.map((b) => DropdownMenuItem(value: b, child: Text(b))).toList(),
                                onChanged: (v) => setState(() => _bloodGroupCtrl.text = v ?? ''),
                              ),
                            ),

                            // City
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _cityCtrl,
                                decoration: _dec(hintText: 'City', prefixIcon: const Icon(Icons.location_city)),
                              ),
                            ),

                            // Address (spans full width)
                            SizedBox(
                              width: cons.maxWidth,
                              child: TextFormField(
                                controller: _addressCtrl,
                                decoration: _dec(hintText: 'Address', prefixIcon: const Icon(Icons.home)),
                                maxLines: 2,
                              ),
                            ),

                            // Pincode
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _pincodeCtrl,
                                decoration: _dec(hintText: 'Pincode', prefixIcon: const Icon(Icons.numbers)),
                                keyboardType: TextInputType.number,
                              ),
                            ),

                            // Insurance number
                            SizedBox(
                              width: colW,
                              child: TextFormField(
                                controller: _insuranceNumberCtrl,
                                decoration: _dec(hintText: 'Insurance Number', prefixIcon: const Icon(Icons.health_and_safety)),
                              ),
                            ),

                            // Medical history (comma separated)
                            SizedBox(
                              width: cons.maxWidth,
                              child: TextFormField(
                                controller: _medicalHistoryCtrl,
                                decoration: _dec(hintText: 'Medical History (comma separated)', prefixIcon: const Icon(Icons.history_edu)),
                                maxLines: 2,
                              ),
                            ),

                            // Allergies (comma separated)
                            SizedBox(
                              width: cons.maxWidth,
                              child: TextFormField(
                                controller: _allergiesCtrl,
                                decoration: _dec(hintText: 'Allergies (comma separated)', prefixIcon: const Icon(Icons.warning_amber_outlined)),
                                maxLines: 2,
                              ),
                            ),

                            // Insurance expiry + last visit (two columns)
                            SizedBox(
                              width: colW,
                              child: InkWell(
                                onTap: () => _pickDate(context, _insuranceExpiry, (d) => _insuranceExpiry = d),
                                child: IgnorePointer(
                                  child: TextFormField(
                                    decoration: _dec(hintText: 'Insurance Expiry Date', prefixIcon: const Icon(Icons.calendar_month)),
                                    controller: TextEditingController(text: _fmtDate(_insuranceExpiry)),
                                  ),
                                ),
                              ),
                            ),

                            SizedBox(
                              width: colW,
                              child: InkWell(
                                onTap: () => _pickDate(context, _lastVisit, (d) => _lastVisit = d),
                                child: IgnorePointer(
                                  child: TextFormField(
                                    decoration: _dec(hintText: 'Last Visit Date', prefixIcon: const Icon(Icons.history)),
                                    controller: TextEditingController(text: _fmtDate(_lastVisit)),
                                  ),
                                ),
                              ),
                            ),

                            // Doctor dropdown (replaces doctor id textfield)
                            SizedBox(
                              width: colW,
                              child: _loadingDoctors
                                  ? InputDecorator(
                                decoration: _dec(hintText: 'Assign Doctor', prefixIcon: const Icon(Icons.medical_services)),
                                child: const SizedBox(height: 18, child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)))),
                              )
                                  : (_doctorsError != null
                                  ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                                InputDecorator(
                                  decoration: _dec(hintText: 'Assign Doctor', prefixIcon: const Icon(Icons.medical_services)),
                                  child: Text(_doctorsError!, style: GoogleFonts.inter(color: Colors.red, fontSize: 12)),
                                ),
                                const SizedBox(height: 6),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: TextButton.icon(
                                    onPressed: () => _loadDoctors(force: true),
                                    icon: const Icon(Icons.refresh),
                                    label: const Text('Retry'),
                                  ),
                                )
                              ])
                                  : DropdownButtonFormField<String>(
                                decoration: _dec(hintText: 'Assign Doctor', prefixIcon: const Icon(Icons.medical_services)),
                                value: _selectedDoctorId,
                                items: [
                                  const DropdownMenuItem<String>(value: null, child: Text('None')),
                                  ..._doctors.map((d) => DropdownMenuItem<String>(
                                    value: d.userProfile.id,
                                    child: Text(d.userProfile.fullName + (d.specialization.isNotEmpty ? ' — ${d.specialization}' : '')),
                                  )),
                                ],
                                onChanged: (v) => setState(() => _selectedDoctorId = v),
                              )),
                            ),

                            // Notes (full width) - moved above vitals so vitals appear lower
                            SizedBox(
                              width: cons.maxWidth,
                              child: TextFormField(
                                controller: _notesCtrl,
                                decoration: _dec(hintText: 'Notes', prefixIcon: const Icon(Icons.note_outlined)),
                                maxLines: 3,
                              ),
                            ),

                            // VITALS (spans full width but fields in two columns or wrap)
                            SizedBox(
                              width: cons.maxWidth,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Vitals', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 8),
                                  Wrap(spacing: 14, runSpacing: 12, children: [
                                    SizedBox(
                                      width: colW,
                                      child: TextFormField(
                                        controller: _heightCtrl,
                                        decoration: _dec(hintText: 'Height (cm)', prefixIcon: const Icon(Icons.height)),
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                    SizedBox(
                                      width: colW,
                                      child: TextFormField(
                                        controller: _weightCtrl,
                                        decoration: _dec(hintText: 'Weight (kg)', prefixIcon: const Icon(Icons.monitor_weight)),
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                    SizedBox(
                                      width: colW,
                                      child: TextFormField(
                                        controller: _bmiCtrl,
                                        readOnly: true,
                                        decoration: _dec(hintText: 'BMI (auto)', prefixIcon: const Icon(Icons.fitness_center)),
                                      ),
                                    ),
                                    SizedBox(
                                      width: colW,
                                      child: TextFormField(
                                        controller: _oxygenCtrl,
                                        decoration: _dec(hintText: 'Oxygen (%)', prefixIcon: const Icon(Icons.favorite)),
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                  ]),
                                ],
                              ),
                            ),
                          ]);
                        }),

                        const SizedBox(height: 18),

                        // Actions row (aligned right)
                        Row(children: [
                          OutlinedButton.icon(
                            onPressed: _isSaving ? null : () => Navigator.of(context).maybePop(),
                            icon: const Icon(Icons.close),
                            label: Text('Cancel', style: GoogleFonts.inter()),
                          ),
                          const SizedBox(width: 12),
                          const Spacer(),
                          ElevatedButton.icon(
                            onPressed: _isSaving ? null : _submit,
                            icon: const Icon(Icons.save, color: Colors.white),
                            label: Text(
                              _isSaving ? 'Saving...' : 'Save patient',
                              style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFDC2626),
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                            ),
                          ),
                        ]),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
