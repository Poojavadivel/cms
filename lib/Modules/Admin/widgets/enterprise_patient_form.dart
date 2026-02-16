// lib/Modules/Admin/widget/enterprise_patient_form.dart
// Enterprise-grade patient registration form with multi-step wizard

import 'dart:math';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

import '../../../Models/Patients.dart';
import '../../../Models/Doctor.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

class EnterprisePatientForm extends StatefulWidget {
  final PatientDetails? initial;
  const EnterprisePatientForm({super.key, this.initial});

  @override
  State<EnterprisePatientForm> createState() => _EnterprisePatientFormState();
}

class _EnterprisePatientFormState extends State<EnterprisePatientForm> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;

  // Text controllers
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _lastNameCtrl;
  late final TextEditingController _ageCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _emergencyNameCtrl;
  late final TextEditingController _emergencyPhoneCtrl;
  late final TextEditingController _houseNoCtrl;
  late final TextEditingController _streetCtrl;
  late final TextEditingController _cityCtrl;
  late final TextEditingController _stateCtrl;
  late final TextEditingController _pincodeCtrl;
  late final TextEditingController _countryCtrl;
  late final TextEditingController _bloodGroupCtrl;
  late final TextEditingController _heightCtrl;
  late final TextEditingController _weightCtrl;
  late final TextEditingController _bmiCtrl;
  late final TextEditingController _bpCtrl;
  late final TextEditingController _pulseCtrl;
  late final TextEditingController _oxygenCtrl;
  late final TextEditingController _medicalHistoryCtrl;
  late final TextEditingController _allergiesCtrl;
  late final TextEditingController _insuranceNumberCtrl;
  late final TextEditingController _notesCtrl;

  String _gender = "Male";
  DateTime? _dob;
  DateTime? _insuranceExpiry;
  DateTime? _lastVisit;

  bool _isSaving = false;

  // Doctor dropdown
  List<Doctor> _doctors = [];
  bool _loadingDoctors = false;
  String? _selectedDoctorId;
  String? _doctorsError;

  // Medical reports/history image upload
  final ImagePicker _imagePicker = ImagePicker();
  List<File> _uploadedImages = [];
  bool _isProcessingImages = false;
  String? _scannerError;
  Map<String, dynamic>? _lastScannedData; // Store last scanned data
  
  // Temp patient ID for linking scanned documents during creation
  late final String _tempPatientId;

  final List<String> _bloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'O+',
    'O-',
    'AB+',
    'AB-',
    'Unknown'
  ];

  final List<StepSection> _sections = [
    StepSection(
      title: 'Personal Information',
      icon: Iconsax.user,
      description: 'Basic patient details',
    ),
    StepSection(
      title: 'Contact Details',
      icon: Iconsax.call,
      description: 'Contact and emergency info',
    ),
    StepSection(
      title: 'Medical History',
      icon: Iconsax.health,
      description: 'Medical history and allergies',
    ),
    StepSection(
      title: 'Vitals',
      icon: Iconsax.activity,
      description: 'Vital signs',
    ),
  ];

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    
    // Generate temp patient ID for new patients (for linking scanned documents)
    _tempPatientId = 'temp-${Random().nextInt(999999)}';

    _firstNameCtrl = TextEditingController(text: initial?.firstName ?? '');
    _lastNameCtrl = TextEditingController(text: initial?.lastName ?? '');
    _ageCtrl = TextEditingController(
        text: (initial?.age ?? 0) > 0 ? initial!.age.toString() : '');
    _phoneCtrl = TextEditingController(text: initial?.phone ?? '');
    _emailCtrl = TextEditingController(text: '');
    _emergencyNameCtrl =
        TextEditingController(text: initial?.emergencyContactName ?? '');
    _emergencyPhoneCtrl =
        TextEditingController(text: initial?.emergencyContactPhone ?? '');
    _houseNoCtrl = TextEditingController(text: initial?.houseNo ?? '');
    _streetCtrl = TextEditingController(text: initial?.street ?? '');
    _cityCtrl = TextEditingController(text: initial?.city ?? '');
    _stateCtrl = TextEditingController(text: initial?.state ?? '');
    _pincodeCtrl = TextEditingController(text: initial?.pincode ?? '');
    _countryCtrl = TextEditingController(text: initial?.country ?? 'India');
    _bloodGroupCtrl = TextEditingController(text: initial?.bloodGroup ?? '');
    _heightCtrl = TextEditingController(text: initial?.height ?? '');
    _weightCtrl = TextEditingController(text: initial?.weight ?? '');
    _bmiCtrl = TextEditingController(text: initial?.bmi ?? '');
    _bpCtrl = TextEditingController(text: '');
    _pulseCtrl = TextEditingController(text: '');
    _oxygenCtrl = TextEditingController(text: initial?.oxygen ?? '');
    _medicalHistoryCtrl =
        TextEditingController(text: (initial?.medicalHistory ?? []).join(', '));
    _allergiesCtrl =
        TextEditingController(text: (initial?.allergies ?? []).join(', '));
    _insuranceNumberCtrl =
        TextEditingController(text: initial?.insuranceNumber ?? '');
    _notesCtrl = TextEditingController(text: initial?.notes ?? '');

    _gender = (initial?.gender.isNotEmpty == true) ? initial!.gender : "Male";
    _dob = (initial?.dateOfBirth.isNotEmpty == true)
        ? DateTime.tryParse(initial!.dateOfBirth)
        : null;
    _insuranceExpiry = (initial?.expiryDate.isNotEmpty == true)
        ? DateTime.tryParse(initial!.expiryDate)
        : null;
    _lastVisit = (initial?.lastVisitDate.isNotEmpty == true)
        ? DateTime.tryParse(initial!.lastVisitDate)
        : null;
    
    // Handle doctorId - can be String ID or Map (doctor object)
    _selectedDoctorId = null; // Default
    
    if (initial?.doctorId != null) {
      try {
        final doctorIdValue = initial!.doctorId;
        debugPrint('🔷 [FORM INIT] Raw doctorId type: ${doctorIdValue.runtimeType}');
        debugPrint('🔷 [FORM INIT] Raw doctorId value: $doctorIdValue');
        
        if (doctorIdValue is String) {
          // Already a string
          _selectedDoctorId = doctorIdValue.isNotEmpty ? doctorIdValue : null;
        } else if (doctorIdValue is Map) {
          // Backend returned doctor object - extract ID
          // Cast to Map<String, dynamic> to avoid type inference issues
          final map = doctorIdValue as Map<dynamic, dynamic>;
          final id = map['_id'] ?? map['id'];
          final extractedId = (id ?? '').toString();
          _selectedDoctorId = extractedId.isNotEmpty && extractedId != 'null' ? extractedId : null;
          debugPrint('🔷 [FORM INIT] Extracted ID from Map: $_selectedDoctorId');
        } else {
          // Fallback: convert to string
          final stringValue = doctorIdValue.toString();
          _selectedDoctorId = stringValue.isNotEmpty && stringValue != 'null' ? stringValue : null;
        }
        
        debugPrint('🔷 [FORM INIT] Final _selectedDoctorId: $_selectedDoctorId (${_selectedDoctorId.runtimeType})');
      } catch (e) {
        debugPrint('🔴 [FORM INIT] Error parsing doctorId: $e');
        _selectedDoctorId = null;
      }
    }

    _heightCtrl.addListener(_recalcBmi);
    _weightCtrl.addListener(_recalcBmi);

    _loadDoctors();
    WidgetsBinding.instance.addPostFrameCallback((_) => _recalcBmi());
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _ageCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    _houseNoCtrl.dispose();
    _streetCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _countryCtrl.dispose();
    _bloodGroupCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _bmiCtrl.dispose();
    _bpCtrl.dispose();
    _pulseCtrl.dispose();
    _oxygenCtrl.dispose();
    _medicalHistoryCtrl.dispose();
    _allergiesCtrl.dispose();
    _insuranceNumberCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDoctors() async {
    if (_loadingDoctors) return;
    debugPrint('🔵 [DOCTOR DROPDOWN] Starting to load doctors...');
    setState(() {
      _loadingDoctors = true;
      _doctorsError = null;
    });

    try {
      debugPrint('🔵 [DOCTOR DROPDOWN] Calling fetchAllDoctors API...');
      final docs = await AuthService.instance.fetchAllDoctors();
      debugPrint('🟢 [DOCTOR DROPDOWN] Received ${docs.length} doctors');
      if (mounted) {
        setState(() {
          _doctors = docs;
        });
        debugPrint('🟢 [DOCTOR DROPDOWN] State updated with ${_doctors.length} doctors');
      }
    } catch (e, stackTrace) {
      debugPrint('🔴 [DOCTOR DROPDOWN] Failed to load doctors: $e');
      debugPrint('🔴 [DOCTOR DROPDOWN] Stack trace: $stackTrace');
      if (mounted) {
        setState(() => _doctorsError = 'Failed to load doctors: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _loadingDoctors = false);
        debugPrint('🔵 [DOCTOR DROPDOWN] Loading complete. _loadingDoctors=$_loadingDoctors, _doctorsError=$_doctorsError, doctors count=${_doctors.length}');
      }
    }
  }

  void _recalcBmi() {
    final h = double.tryParse(_heightCtrl.text.trim());
    final w = double.tryParse(_weightCtrl.text.trim());
    if (h == null || h <= 0 || w == null || w <= 0) {
      _bmiCtrl.text = '';
      return;
    }
    final hm = h / 100.0;
    final bmi = w / (hm * hm);
    _bmiCtrl.text = bmi.isFinite ? bmi.toStringAsFixed(1) : '';
  }

  Future<void> _pickDate(
      DateTime? initial, void Function(DateTime) onPicked) async {
    final now = DateTime.now();
    final res = await showDatePicker(
      context: context,
      initialDate: initial ?? now,
      firstDate: DateTime(1900),
      lastDate: DateTime(now.year + 10),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: AppColors.kTextPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (res != null) setState(() => onPicked(res));
  }

  String _fmtDate(DateTime? d) {
    if (d == null) return '';
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  String? _validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final cleaned = value.replaceAll(RegExp(r'[^\d+]'), '');
    if (cleaned.length < 10) {
      return 'Phone must be at least 10 digits';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  String? _validateAge(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Age is required';
    }
    final age = int.tryParse(value);
    if (age == null || age < 1 || age > 120) {
      return 'Age must be between 1 and 120';
    }
    return null;
  }

  InputDecoration _buildInputDecoration({
    required String label,
    required IconData icon,
    String? hint,
    String? helperText,
    Widget? suffix,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      helperText: helperText,
      helperStyle:
          GoogleFonts.inter(fontSize: 11, color: AppColors.kTextSecondary),
      prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
      suffixIcon: suffix,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      filled: true,
      fillColor: AppColors.grey50,
      labelStyle: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.kTextSecondary,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.kDanger, width: 1.5),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.kDanger, width: 2),
      ),
      errorStyle: GoogleFonts.inter(fontSize: 11, color: AppColors.kDanger),
    );
  }

  List<String> _splitCsv(String? raw) {
    if (raw == null) return [];
    return raw
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    final isEdit = widget.initial != null;

    // Ensure doctorId is always a string
    String finalDoctorId = '';
    if (_selectedDoctorId != null) {
      if (_selectedDoctorId is String) {
        finalDoctorId = _selectedDoctorId as String;
      } else {
        debugPrint('⚠️ [SUBMIT] _selectedDoctorId is not a String: ${_selectedDoctorId.runtimeType}');
        finalDoctorId = _selectedDoctorId.toString();
      }
    }
    debugPrint('🔵 [SUBMIT] Final doctorId being sent: $finalDoctorId');

    final draft = PatientDetails(
      patientId:
          widget.initial?.patientId ?? 'temp-${Random().nextInt(999999)}',
      name: '${_firstNameCtrl.text} ${_lastNameCtrl.text}'.trim(),
      firstName: _firstNameCtrl.text.trim(),
      lastName: _lastNameCtrl.text.trim(),
      age: int.tryParse(_ageCtrl.text.trim()) ?? 0,
      gender: _gender,
      bloodGroup: _bloodGroupCtrl.text.trim(),
      weight: _weightCtrl.text.trim(),
      height: _heightCtrl.text.trim(),
      emergencyContactName: _emergencyNameCtrl.text.trim(),
      emergencyContactPhone: _emergencyPhoneCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      houseNo: _houseNoCtrl.text.trim(),
      street: _streetCtrl.text.trim(),
      city: _cityCtrl.text.trim(),
      state: _stateCtrl.text.trim(),
      pincode: _pincodeCtrl.text.trim(),
      country: _countryCtrl.text.trim(),
      insuranceNumber: _insuranceNumberCtrl.text.trim(),
      expiryDate: _fmtDate(_insuranceExpiry),
      avatarUrl: widget.initial?.avatarUrl ?? '',
      dateOfBirth: _fmtDate(_dob),
      lastVisitDate: _fmtDate(_lastVisit),
      doctorId: finalDoctorId,
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
        if (ok && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Patient updated successfully'),
              backgroundColor: AppColors.kSuccess,
            ),
          );
          Navigator.of(context).pop(draft);
        }
      } else {
        final created = await AuthService.instance.createPatient(draft);
        if (created != null && mounted) {
          debugPrint('✅ Patient created with ID: ${created.patientId}');
          
          // Update scanned documents from temp ID to real patient ID
          if (_uploadedImages.isNotEmpty) {
            debugPrint('📝 Updating ${_uploadedImages.length} scanned documents from temp ID ($_tempPatientId) to real ID (${created.patientId})');
            try {
              await AuthService.instance.updatePatientIdForDocuments(
                oldPatientId: _tempPatientId,
                newPatientId: created.patientId,
              );
              debugPrint('✅ Successfully updated patient ID for all scanned documents');
            } catch (e) {
              debugPrint('❌ Failed to update patient ID for documents: $e');
              // Non-fatal error - patient is created, just documents aren't linked
            }
          }
          
          // Attach uploaded reports to the newly created patient (only on mobile/desktop)
          if (_uploadedImages.isNotEmpty && !kIsWeb) {
            debugPrint('📎 Attaching ${_uploadedImages.length} reports to patient ${created.patientId}');
            for (final imageFile in _uploadedImages) {
              try {
                await AuthService.instance.attachReportToPatient(
                  created.patientId,
                  imageFile.path,
                );
                debugPrint('✅ Report attached: ${imageFile.path}');
              } catch (e) {
                debugPrint('❌ Failed to attach report: $e');
              }
            }
          }
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Patient added successfully${_uploadedImages.isNotEmpty ? ' with ${_uploadedImages.length} document(s)' : ''}'),
              backgroundColor: AppColors.kSuccess,
            ),
          );
          Navigator.of(context).pop(created);
        }
      }
    } catch (e) {
      debugPrint('Error saving patient: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _nextStep() {
    if (_validateCurrentStep()) {
      setState(() => _currentStep++);
    }
  }

  bool _validateCurrentStep() {
    switch (_currentStep) {
      case 0: // Personal
        if (_firstNameCtrl.text.trim().isEmpty) {
          _showError('Please enter first name');
          return false;
        }
        if (_validateAge(_ageCtrl.text) != null) {
          _showError('Please enter a valid age');
          return false;
        }
        return true;
      case 1: // Contact
        if (_validatePhone(_phoneCtrl.text) != null) {
          _showError('Please enter a valid phone number');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.kDanger,
      ),
    );
  }

  // Image upload and scanner processing methods
  Future<void> _pickAndUploadImage(ImageSource source) async {
    try {
      setState(() {
        _isProcessingImages = true;
        _scannerError = null;
      });

      final XFile? pickedFile = await _imagePicker.pickImage(
        source: source,
        imageQuality: 85,
      );

      if (pickedFile == null) {
        setState(() => _isProcessingImages = false);
        return;
      }

      // Process with scanner API (pass XFile directly)
      final scanResult = await _processImageWithScanner(pickedFile);

      if (scanResult != null) {
        // Store scanned data for display
        setState(() {
          _lastScannedData = scanResult;
        });

        // Auto-fill medical history if extracted
        if (scanResult['medicalHistory'] != null &&
            (scanResult['medicalHistory'] as String).isNotEmpty) {
          final currentHistory = _medicalHistoryCtrl.text.trim();
          final newHistory = scanResult['medicalHistory'] as String;
          _medicalHistoryCtrl.text = currentHistory.isEmpty
              ? newHistory
              : '$currentHistory, $newHistory';
        }

        // Auto-fill allergies if extracted
        if (scanResult['allergies'] != null &&
            (scanResult['allergies'] as String).isNotEmpty) {
          final currentAllergies = _allergiesCtrl.text.trim();
          final newAllergies = scanResult['allergies'] as String;
          _allergiesCtrl.text = currentAllergies.isEmpty
              ? newAllergies
              : '$currentAllergies, $newAllergies';
        }

        // Store XFile for later upload
        setState(() {
          if (!kIsWeb) {
            _uploadedImages.add(File(pickedFile.path));
          }
          // For web, we'll handle file upload differently in _submit
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Document scanned and processed successfully!',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.kSuccess,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('❌ Error uploading image: $e');
      setState(() => _scannerError = 'Failed to process image: $e');
    } finally {
      setState(() => _isProcessingImages = false);
    }
  }

  Future<Map<String, dynamic>?> _processImageWithScanner(XFile imageFile) async {
    try {
      print('📸 Processing image with scanner: ${imageFile.path}');

      // Use temp ID for new patients, real ID for editing
      final String patientId = widget.initial?.patientId ?? _tempPatientId;
      
      print('📋 Using patientId for scanner: $patientId');
      
      // Call scanner API with XFile (handles both web and mobile)
      final result = await AuthService.instance.scanAndExtractMedicalDataFromXFile(
        imageFile,
        patientId: patientId,
      );

      print('✅ Scanner result: $result');
      
      // Check if image was saved to patient record
      if (result['savedToPatient'] != null && result['savedToPatient']['saved'] == true) {
        print('💾 Image saved to patient record: ${result['savedToPatient']}');
      }
      
      return result;
    } catch (e) {
      debugPrint('❌ Scanner processing error: $e');
      rethrow;
    }
  }

  // PDF upload and scanner processing
  Future<void> _pickAndUploadPDF() async {
    try {
      setState(() {
        _isProcessingImages = true;
        _scannerError = null;
      });

      // Pick PDF file
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) {
        setState(() => _isProcessingImages = false);
        return;
      }

      final pickedFile = result.files.first;
      
      // Create XFile from picked file
      XFile pdfFile;
      if (kIsWeb) {
        // For web, use bytes
        if (pickedFile.bytes != null) {
          pdfFile = XFile.fromData(
            pickedFile.bytes!,
            name: pickedFile.name,
            mimeType: 'application/pdf',
          );
        } else {
          throw Exception('Failed to read PDF file');
        }
      } else {
        // For mobile/desktop, use path
        if (pickedFile.path != null) {
          pdfFile = XFile(
            pickedFile.path!,
            name: pickedFile.name,
            mimeType: 'application/pdf',
          );
        } else {
          throw Exception('Failed to read PDF file');
        }
      }

      debugPrint('📄 PDF picked: ${pickedFile.name}, size: ${pickedFile.size} bytes');

      // Process with scanner API
      final scanResult = await _processImageWithScanner(pdfFile);

      if (scanResult != null) {
        // Check if there's a warning (e.g., scanned PDF with no text)
        final warning = scanResult['warning'] as String?;
        final hasData = scanResult['medicalHistory'] != null && 
                       (scanResult['medicalHistory'] as String).isNotEmpty;
        
        // Store scanned data for display
        setState(() {
          _lastScannedData = scanResult;
        });

        // Auto-fill medical history if extracted
        if (scanResult['medicalHistory'] != null &&
            (scanResult['medicalHistory'] as String).isNotEmpty) {
          final currentHistory = _medicalHistoryCtrl.text.trim();
          final newHistory = scanResult['medicalHistory'] as String;
          _medicalHistoryCtrl.text = currentHistory.isEmpty
              ? newHistory
              : '$currentHistory, $newHistory';
        }

        // Auto-fill allergies if extracted
        if (scanResult['allergies'] != null &&
            (scanResult['allergies'] as String).isNotEmpty) {
          final currentAllergies = _allergiesCtrl.text.trim();
          final newAllergies = scanResult['allergies'] as String;
          _allergiesCtrl.text = currentAllergies.isEmpty
              ? newAllergies
              : '$currentAllergies, $newAllergies';
        }

        // Store file reference for later upload (for mobile only)
        if (!kIsWeb && pickedFile.path != null) {
          setState(() {
            _uploadedImages.add(File(pickedFile.path!));
          });
        }

        if (mounted) {
          // Show warning or success message
          if (warning != null && warning.isNotEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.warning_amber, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        warning,
                        style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
                backgroundColor: Colors.orange,
                duration: const Duration(seconds: 6),
                action: SnackBarAction(
                  label: 'OK',
                  textColor: Colors.white,
                  onPressed: () {},
                ),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        hasData 
                            ? 'PDF scanned and processed successfully!'
                            : 'PDF uploaded successfully!',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
                backgroundColor: AppColors.kSuccess,
                duration: const Duration(seconds: 3),
              ),
            );
          }
        }
      }
    } catch (e) {
      debugPrint('❌ Error uploading PDF: $e');
      setState(() => _scannerError = 'Failed to process PDF: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Failed to process PDF: $e',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      setState(() => _isProcessingImages = false);
    }
  }

  void _removeUploadedImage(int index) {
    setState(() {
      _uploadedImages.removeAt(index);
      // Clear scanned data when all images are removed
      if (_uploadedImages.isEmpty) {
        _lastScannedData = null;
      }
    });
  }

  Widget _buildScannedDataItem(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.kTextSecondary, size: 14),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.kTextSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.initial != null;
    final width = MediaQuery.of(context).size.width;
    final contentWidth = min(width * 0.95, 1200.0);

    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: contentWidth,
          maxHeight: MediaQuery.of(context).size.height * 0.92,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.grey200, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.08),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildHeader(isEdit),
              _buildStepIndicator(),
              Expanded(
                child: Form(
                  key: _formKey,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: _buildCurrentStepContent(),
                  ),
                ),
              ),
              _buildActionButtons(isEdit),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isEdit) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.05),
            AppColors.primary.withOpacity(0.02)
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        border:
            Border(bottom: BorderSide(color: AppColors.grey200, width: 1.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primary600],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              isEdit ? Iconsax.edit5 : Iconsax.user_add5,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEdit ? 'Edit Patient Record' : 'Add New Patient',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.kTextPrimary,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Complete patient information and medical records',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.kTextSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
            icon: const Icon(Iconsax.close_circle),
            color: AppColors.kTextSecondary,
            iconSize: 30,
            tooltip: 'Close',
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        border:
            Border(bottom: BorderSide(color: AppColors.grey200, width: 1.5)),
      ),
      child: Row(
        children: List.generate(_sections.length, (index) {
          final section = _sections[index];
          final isActive = index == _currentStep;
          final isCompleted = index < _currentStep;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              gradient: isCompleted || isActive
                                  ? LinearGradient(
                                      colors: isCompleted
                                          ? [
                                              AppColors.kSuccess,
                                              AppColors.kSuccess
                                                  .withOpacity(0.8)
                                            ]
                                          : [
                                              AppColors.primary,
                                              AppColors.primary600
                                            ],
                                    )
                                  : null,
                              color: isCompleted || isActive
                                  ? null
                                  : AppColors.grey200,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: isActive
                                  ? [
                                      BoxShadow(
                                        color:
                                            AppColors.primary.withOpacity(0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Center(
                              child: isCompleted
                                  ? const Icon(Iconsax.tick_circle5,
                                      color: Colors.white, size: 20)
                                  : Icon(
                                      section.icon,
                                      color: isActive
                                          ? Colors.white
                                          : AppColors.kTextSecondary,
                                      size: 18,
                                    ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  section.title,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: isActive
                                        ? FontWeight.w700
                                        : FontWeight.w600,
                                    color: isActive
                                        ? AppColors.primary
                                        : AppColors.kTextSecondary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (isActive)
                                  Text(
                                    section.description,
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      color: AppColors.kTextSecondary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (index < _sections.length - 1)
                        Container(
                          margin: const EdgeInsets.only(top: 10),
                          height: 3,
                          decoration: BoxDecoration(
                            color: isCompleted
                                ? AppColors.kSuccess
                                : AppColors.grey200,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                    ],
                  ),
                ),
                if (index < _sections.length - 1) const SizedBox(width: 10),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildPersonalInfoStep();
      case 1:
        return _buildContactStep();
      case 2:
        return _buildMedicalHistoryStep();
      case 3:
        return _buildVitalsAndDoctorStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildPersonalInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Personal Information',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.kTextPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Enter the patient\'s basic demographic information',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppColors.kTextSecondary,
          ),
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 700;
            final colWidth =
                isWide ? (constraints.maxWidth - 20) / 2 : constraints.maxWidth;

            return Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                // First Name
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _firstNameCtrl,
                    decoration: _buildInputDecoration(
                      label: 'First Name',
                      icon: Iconsax.user,
                      hint: 'Enter first name',
                    ),
                    textCapitalization: TextCapitalization.words,
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'First name is required'
                        : null,
                  ),
                ),
                // Last Name
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _lastNameCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Last Name',
                      icon: Iconsax.user_tag,
                      hint: 'Enter last name',
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                ),
                // Age
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _ageCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Age',
                      icon: Iconsax.cake,
                      hint: 'Enter age',
                      helperText: 'Age must be between 1-120',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    validator: _validateAge,
                  ),
                ),
                // Gender
                SizedBox(
                  width: colWidth,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Gender',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.grey50,
                          borderRadius: BorderRadius.circular(12),
                          border:
                              Border.all(color: AppColors.grey200, width: 1.5),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: _buildGenderOption('Male', Iconsax.man),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child:
                                  _buildGenderOption('Female', Iconsax.woman),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: _buildGenderOption('Other', Iconsax.user),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Date of Birth
                SizedBox(
                  width: colWidth,
                  child: InkWell(
                    onTap: () => _pickDate(_dob, (d) => _dob = d),
                    child: IgnorePointer(
                      child: TextFormField(
                        decoration: _buildInputDecoration(
                          label: 'Date of Birth',
                          icon: Iconsax.calendar_1,
                          hint: 'Select date',
                          suffix: const Icon(Iconsax.arrow_down_1, size: 18),
                        ),
                        controller: TextEditingController(
                          text: _dob != null ? _fmtDate(_dob) : '',
                        ),
                      ),
                    ),
                  ),
                ),
                // Blood Group
                SizedBox(
                  width: colWidth,
                  child: DropdownButtonFormField<String>(
                    decoration: _buildInputDecoration(
                      label: 'Blood Group',
                      icon: Iconsax.health,
                      hint: 'Select blood group',
                    ),
                    value: _bloodGroupCtrl.text.isNotEmpty
                        ? _bloodGroupCtrl.text
                        : null,
                    items: _bloodGroups
                        .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                        .toList(),
                    onChanged: (v) =>
                        setState(() => _bloodGroupCtrl.text = v ?? ''),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildGenderOption(String value, IconData icon) {
    final isSelected = _gender == value;
    return InkWell(
      onTap: () => setState(() => _gender = value),
      borderRadius: BorderRadius.circular(8),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : AppColors.kTextSecondary,
              size: 22,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.kTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Contact & Emergency Details',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.kTextPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Patient contact information and emergency contacts',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppColors.kTextSecondary,
          ),
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 700;
            final colWidth =
                isWide ? (constraints.maxWidth - 20) / 2 : constraints.maxWidth;

            return Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                // Phone
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _phoneCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Phone Number',
                      icon: Iconsax.call,
                      hint: '+91 XXXXX XXXXX',
                      helperText: 'Primary contact number',
                    ),
                    keyboardType: TextInputType.phone,
                    validator: _validatePhone,
                  ),
                ),
                // Email
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _emailCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Email Address',
                      icon: Iconsax.sms,
                      hint: 'example@email.com',
                      helperText: 'Optional',
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: _validateEmail,
                  ),
                ),
                // Emergency Contact Name
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _emergencyNameCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Emergency Contact Name',
                      icon: Iconsax.user_octagon,
                      hint: 'Enter emergency contact',
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                ),
                // Emergency Contact Phone
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _emergencyPhoneCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Emergency Contact Phone',
                      icon: Iconsax.call_calling,
                      hint: '+91 XXXXX XXXXX',
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                ),
                // House No
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _houseNoCtrl,
                    decoration: _buildInputDecoration(
                      label: 'House No / Flat No',
                      icon: Iconsax.home,
                      hint: 'Enter house/flat number',
                    ),
                  ),
                ),
                // Street
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _streetCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Street Name',
                      icon: Iconsax.location,
                      hint: 'Enter street name',
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                ),
                // City
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _cityCtrl,
                    decoration: _buildInputDecoration(
                      label: 'City',
                      icon: Iconsax.building,
                      hint: 'Enter city',
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                ),
                // State
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _stateCtrl,
                    decoration: _buildInputDecoration(
                      label: 'State',
                      icon: Iconsax.map,
                      hint: 'Enter state',
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                ),
                // Pincode
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _pincodeCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Pincode',
                      icon: Iconsax.card_pos,
                      hint: 'Enter pincode',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  ),
                ),
                // Country
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _countryCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Country',
                      icon: Iconsax.global,
                      hint: 'Enter country',
                    ),
                    textCapitalization: TextCapitalization.words,
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildMedicalHistoryStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Medical History & Allergies',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.kTextPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Document the patient\'s medical history, allergies, and insurance',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppColors.kTextSecondary,
          ),
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 700;
            final colWidth =
                isWide ? (constraints.maxWidth - 20) / 2 : constraints.maxWidth;

            return Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                // Medical History
                SizedBox(
                  width: constraints.maxWidth,
                  child: TextFormField(
                    controller: _medicalHistoryCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Medical History',
                      icon: Iconsax.health,
                      hint: 'Enter medical history (comma separated)',
                      helperText: 'Example: Diabetes, Hypertension',
                    ),
                    maxLines: 3,
                  ),
                ),
                // Allergies
                SizedBox(
                  width: constraints.maxWidth,
                  child: TextFormField(
                    controller: _allergiesCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Allergies',
                      icon: Iconsax.warning_2,
                      hint: 'Enter allergies (comma separated)',
                      helperText: 'Example: Penicillin, Peanuts',
                    ),
                    maxLines: 3,
                  ),
                ),
                // Insurance Number
                SizedBox(
                  width: colWidth,
                  child: TextFormField(
                    controller: _insuranceNumberCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Insurance Number',
                      icon: Iconsax.shield_tick,
                      hint: 'Enter insurance number',
                    ),
                  ),
                ),
                // Insurance Expiry
                SizedBox(
                  width: colWidth,
                  child: InkWell(
                    onTap: () => _pickDate(
                        _insuranceExpiry, (d) => _insuranceExpiry = d),
                    child: IgnorePointer(
                      child: TextFormField(
                        decoration: _buildInputDecoration(
                          label: 'Insurance Expiry',
                          icon: Iconsax.calendar_remove,
                          hint: 'Select expiry date',
                          suffix: const Icon(Iconsax.arrow_down_1, size: 18),
                        ),
                        controller: TextEditingController(
                          text: _insuranceExpiry != null
                              ? _fmtDate(_insuranceExpiry)
                              : '',
                        ),
                      ),
                    ),
                  ),
                ),
                // Notes (full width)
                SizedBox(
                  width: constraints.maxWidth,
                  child: TextFormField(
                    controller: _notesCtrl,
                    decoration: _buildInputDecoration(
                      label: 'Additional Notes',
                      icon: Iconsax.note_text,
                      hint: 'Enter any additional information',
                    ),
                    maxLines: 4,
                  ),
                ),
                // Medical reports/history upload section
                Container(
                  width: constraints.maxWidth,
                  margin: const EdgeInsets.only(top: 20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.kInfo.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.kInfo.withOpacity(0.2), width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Icon(Iconsax.document_upload,
                              color: AppColors.kInfo, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Upload Medical Reports',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.kTextPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Upload lab reports or medical history documents (images will be scanned automatically)',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Upload buttons
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          ElevatedButton.icon(
                            onPressed: _isProcessingImages
                                ? null
                                : () => _pickAndUploadImage(ImageSource.gallery),
                            icon: const Icon(Iconsax.gallery, size: 18),
                            label: const Text('Choose Image'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _isProcessingImages
                                ? null
                                : _pickAndUploadPDF,
                            icon: const Icon(Iconsax.document, size: 18),
                            label: const Text('Choose PDF'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.deepOrange,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                          if (!kIsWeb)
                            ElevatedButton.icon(
                              onPressed: _isProcessingImages
                                  ? null
                                  : () => _pickAndUploadImage(ImageSource.camera),
                              icon: const Icon(Iconsax.camera, size: 18),
                              label: const Text('Take Photo'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.kSuccess,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                        ],
                      ),
                      if (_isProcessingImages) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Processing image with scanner...',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: AppColors.kTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (_scannerError != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.kDanger.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: AppColors.kDanger.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Iconsax.warning_2,
                                  color: AppColors.kDanger, size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _scannerError!,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: AppColors.kDanger,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      if (_uploadedImages.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text(
                          'Uploaded Documents (${_uploadedImages.length})',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _uploadedImages.asMap().entries.map((entry) {
                            final index = entry.key;
                            final file = entry.value;
                            return Stack(
                              children: [
                                Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                        color: AppColors.grey200, width: 2),
                                    image: DecorationImage(
                                      image: FileImage(file),
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: -8,
                                  right: -8,
                                  child: InkWell(
                                    onTap: () => _removeUploadedImage(index),
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: AppColors.kDanger,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.2),
                                            blurRadius: 4,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: const Icon(Icons.close,
                                          color: Colors.white, size: 16),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                      ],
                      // Display scanned data
                      if (_lastScannedData != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.kSuccess.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: AppColors.kSuccess.withOpacity(0.3),
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Iconsax.scan,
                                      color: AppColors.kSuccess, size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Scanned Data',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.kSuccess,
                                    ),
                                  ),
                                  const Spacer(),
                                  InkWell(
                                    onTap: () {
                                      setState(() {
                                        _lastScannedData = null;
                                      });
                                    },
                                    child: Tooltip(
                                      message: 'Clear scanned data',
                                      child: Icon(
                                        Icons.close,
                                        size: 18,
                                        color: AppColors.kTextSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              if (_lastScannedData!['medicalHistory'] != null &&
                                  (_lastScannedData!['medicalHistory'] as String)
                                      .isNotEmpty)
                                _buildScannedDataItem(
                                  'Medical History',
                                  _lastScannedData!['medicalHistory'] as String,
                                  Iconsax.health,
                                ),
                              if (_lastScannedData!['allergies'] != null &&
                                  (_lastScannedData!['allergies'] as String)
                                      .isNotEmpty)
                                _buildScannedDataItem(
                                  'Allergies',
                                  _lastScannedData!['allergies'] as String,
                                  Iconsax.danger,
                                ),
                              if (_lastScannedData!['medications'] != null &&
                                  (_lastScannedData!['medications'] as String)
                                      .isNotEmpty)
                                _buildScannedDataItem(
                                  'Medications',
                                  _lastScannedData!['medications'] as String,
                                  Iconsax.hospital,
                                ),
                              if (_lastScannedData!['diagnosis'] != null &&
                                  (_lastScannedData!['diagnosis'] as String)
                                      .isNotEmpty)
                                _buildScannedDataItem(
                                  'Diagnosis',
                                  _lastScannedData!['diagnosis'] as String,
                                  Iconsax.clipboard_text,
                                ),
                              if (_lastScannedData!['testResults'] != null &&
                                  (_lastScannedData!['testResults'] is List) &&
                                  (_lastScannedData!['testResults'] as List)
                                      .isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Icon(Iconsax.activity,
                                        color: AppColors.kInfo, size: 16),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Test Results (${(_lastScannedData!['testResults'] as List).length})',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.kTextPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                ...(_lastScannedData!['testResults'] as List)
                                    .take(3)
                                    .map((test) => Padding(
                                          padding: const EdgeInsets.only(
                                              left: 22, top: 4),
                                          child: Text(
                                            '• ${test['testName']}: ${test['value']} ${test['unit'] ?? ''}',
                                            style: GoogleFonts.inter(
                                              fontSize: 11,
                                              color: AppColors.kTextSecondary,
                                            ),
                                          ),
                                        )),
                                if ((_lastScannedData!['testResults'] as List)
                                        .length >
                                    3)
                                  Padding(
                                    padding: const EdgeInsets.only(left: 22, top: 4),
                                    child: Text(
                                      '... and ${(_lastScannedData!['testResults'] as List).length - 3} more',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontStyle: FontStyle.italic,
                                        color: AppColors.kTextSecondary,
                                      ),
                                    ),
                                  ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                // Doctor Assignment Section - MOVED TO MEDICAL HISTORY
                Container(
                  width: constraints.maxWidth,
                  margin: const EdgeInsets.only(top: 20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.primary.withOpacity(0.2),
                        width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Icon(Iconsax.hospital,
                              color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Assign to Doctor',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_loadingDoctors)
                        const Padding(
                          padding: EdgeInsets.all(20.0),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (_doctorsError != null)
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _doctorsError!,
                              style: GoogleFonts.inter(color: AppColors.kDanger),
                            ),
                            const SizedBox(height: 8),
                            TextButton.icon(
                              onPressed: _loadDoctors,
                              icon: const Icon(Iconsax.refresh),
                              label: const Text('Retry'),
                            ),
                          ],
                        )
                      else if (_doctors.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Iconsax.info_circle,
                                  size: 40, color: AppColors.kWarning),
                              const SizedBox(height: 8),
                              Text(
                                'No doctors available',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.kTextSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Please add doctors in Staff Management first',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: AppColors.kTextSecondary,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      else
                        Builder(
                          builder: (context) {
                            // CRITICAL FIX: Ensure _selectedDoctorId is ALWAYS a String
                            String? safeValue;
                            if (_selectedDoctorId is String) {
                              safeValue = _selectedDoctorId as String?;
                            } else if (_selectedDoctorId is Map) {
                              // Extract ID from Map
                              final map = _selectedDoctorId as Map;
                              safeValue = (map['_id'] ?? map['id'] ?? '').toString();
                              if (safeValue!.isEmpty || safeValue == 'null') safeValue = null;
                            } else if (_selectedDoctorId != null) {
                              safeValue = _selectedDoctorId.toString();
                              if (safeValue == 'null') safeValue = null;
                            }
                            
                            debugPrint('🔶 [DROPDOWN RENDER] _selectedDoctorId type: ${_selectedDoctorId.runtimeType}');
                            debugPrint('🔶 [DROPDOWN RENDER] _selectedDoctorId value: $_selectedDoctorId');
                            debugPrint('🔶 [DROPDOWN RENDER] Safe value: $safeValue');
                            
                            return DropdownButtonFormField<String?>(
                              decoration: _buildInputDecoration(
                                label: 'Select Doctor',
                                icon: Iconsax.personalcard,
                                hint: 'Choose a doctor',
                              ),
                              // Use the safe String value
                              value: safeValue,
                              items: [
                            const DropdownMenuItem<String?>(
                              value: null,
                              child: Text('None'),
                            ),
                            // Remove duplicates by doctor ID and ensure unique IDs
                            ...() {
                              final uniqueDoctors = <String, dynamic>{};
                              for (var d in _doctors) {
                                final id = d.userProfile.id;
                                if (id != null && id.isNotEmpty && !uniqueDoctors.containsKey(id)) {
                                  uniqueDoctors[id] = d;
                                }
                              }
                              
                              debugPrint('🔷 [DROPDOWN] Total doctors: ${_doctors.length}');
                              debugPrint('🔷 [DROPDOWN] Unique doctors: ${uniqueDoctors.length}');
                              debugPrint('🔷 [DROPDOWN] Selected ID: $_selectedDoctorId');
                              debugPrint('🔷 [DROPDOWN] Unique IDs: ${uniqueDoctors.keys.toList()}');
                              
                              final items = uniqueDoctors.entries.map((entry) {
                                final id = entry.key;
                                final doctor = entry.value;
                                final name = doctor.userProfile.fullName ?? '';
                                debugPrint('🔷 [DROPDOWN] Item - ID: $id, Name: $name');
                                return DropdownMenuItem<String?>(
                                  value: id,
                                  child: Text(name.isNotEmpty ? name : 'Doctor'),
                                );
                              }).toList();
                              
                              debugPrint('🔷 [DROPDOWN] Total items created: ${items.length}');
                              return items;
                            }(),
                          ],
                          onChanged: (v) {
                            debugPrint('🔷 [DROPDOWN] Value changed to: $v (${v.runtimeType})');
                            setState(() => _selectedDoctorId = v);
                          },
                        );
                          },
                        ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildVitalsAndDoctorStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Vitals',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.kTextPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Record patient vital signs',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppColors.kTextSecondary,
          ),
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 700;
            final colWidth =
                isWide ? (constraints.maxWidth - 20) / 2 : constraints.maxWidth;

            return Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                // Vitals Section
                SizedBox(
                  width: constraints.maxWidth,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.grey50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.grey200, width: 1.5),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Iconsax.activity,
                                color: AppColors.primary, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Vital Signs',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 20,
                          runSpacing: 20,
                          children: [
                            // Height
                            SizedBox(
                              width: colWidth,
                              child: TextFormField(
                                controller: _heightCtrl,
                                decoration: _buildInputDecoration(
                                  label: 'Height (cm)',
                                  icon: Iconsax.arrow_up_3,
                                  hint: 'Enter height',
                                ),
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            // Weight
                            SizedBox(
                              width: colWidth,
                              child: TextFormField(
                                controller: _weightCtrl,
                                decoration: _buildInputDecoration(
                                  label: 'Weight (kg)',
                                  icon: Iconsax.weight,
                                  hint: 'Enter weight',
                                ),
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            // BMI (auto-calculated)
                            SizedBox(
                              width: colWidth,
                              child: TextFormField(
                                controller: _bmiCtrl,
                                decoration: _buildInputDecoration(
                                  label: 'BMI',
                                  icon: Iconsax.chart_square,
                                  hint: 'Auto-calculated',
                                  helperText: 'Automatically calculated',
                                ),
                                readOnly: true,
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                            // Blood Pressure
                            SizedBox(
                              width: colWidth,
                              child: TextFormField(
                                controller: _bpCtrl,
                                decoration: _buildInputDecoration(
                                  label: 'Blood Pressure',
                                  icon: Iconsax.heart_circle,
                                  hint: '120/80',
                                ),
                              ),
                            ),
                            // Pulse
                            SizedBox(
                              width: colWidth,
                              child: TextFormField(
                                controller: _pulseCtrl,
                                decoration: _buildInputDecoration(
                                  label: 'Pulse (bpm)',
                                  icon: Iconsax.heart,
                                  hint: 'Enter pulse',
                                ),
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            // Oxygen Saturation
                            SizedBox(
                              width: colWidth,
                              child: TextFormField(
                                controller: _oxygenCtrl,
                                decoration: _buildInputDecoration(
                                  label: 'Oxygen Saturation (%)',
                                  icon: Iconsax.status_up,
                                  hint: 'Enter SpO2',
                                ),
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildActionButtons(bool isEdit) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        border: Border(top: BorderSide(color: AppColors.grey200, width: 1.5)),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Row(
        children: [
          // Skip button - LEFT CORNER (only show if not on last step)
          if (_currentStep < _sections.length - 1)
            OutlinedButton.icon(
              onPressed: _isSaving ? null : () => setState(() => _currentStep++),
              icon: const Icon(Iconsax.forward),
              label: Text('Skip',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.kTextSecondary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                side: BorderSide(color: AppColors.grey200, width: 1.5),
              ),
            ),
          if (_currentStep > 0 && _currentStep < _sections.length - 1)
            const SizedBox(width: 12),
          if (_currentStep > 0)
            OutlinedButton.icon(
              onPressed:
                  _isSaving ? null : () => setState(() => _currentStep--),
              icon: const Icon(Iconsax.arrow_left_2),
              label: Text('Previous',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                side: BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
          const Spacer(),
          OutlinedButton.icon(
            onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
            icon: const Icon(Iconsax.close_square),
            label: Text('Cancel',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.kTextSecondary,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton.icon(
            onPressed: _isSaving
                ? null
                : (_currentStep < _sections.length - 1 ? _nextStep : _submit),
            icon: _isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : Icon(_currentStep < _sections.length - 1
                    ? Iconsax.arrow_right_3
                    : Iconsax.tick_circle5),
            label: Text(
              _isSaving
                  ? 'Saving...'
                  : (_currentStep < _sections.length - 1
                      ? 'Next Step'
                      : (isEdit ? 'Update Patient' : 'Save Patient')),
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: Colors.white,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }
}

class StepSection {
  final String title;
  final IconData icon;
  final String description;

  StepSection({
    required this.title,
    required this.icon,
    required this.description,
  });
}
