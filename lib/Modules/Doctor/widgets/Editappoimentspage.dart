import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../../Models/appointment_draft.dart';
import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

/// ===========================================================================
/// ENTERPRISE GRADE EDIT APPOINTMENT FORM - 95% POPUP WITH CLOSE ICON
/// ===========================================================================

class EditAppointmentForm extends StatefulWidget {
  const EditAppointmentForm({
    super.key,
    required this.appointmentId,
    required this.onSave,
    required this.onCancel,
    required this.onDelete,
  });

  final String appointmentId;
  final void Function(AppointmentDraft updated) onSave;
  final VoidCallback onCancel;
  final VoidCallback onDelete;

  static Future<void> show(
    BuildContext context, {
    required String appointmentId,
    required void Function(AppointmentDraft) onSave,
    required VoidCallback onDelete,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black.withOpacity(0.7),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.symmetric(
          horizontal: MediaQuery.of(context).size.width * 0.025,
          vertical: MediaQuery.of(context).size.height * 0.025,
        ),
        child: EditAppointmentForm(
          appointmentId: appointmentId,
          onSave: onSave,
          onCancel: () => Navigator.of(context).pop(),
          onDelete: onDelete,
        ),
      ),
    );
  }

  @override
  State<EditAppointmentForm> createState() => _EditAppointmentFormState();
}

class _EditAppointmentFormState extends State<EditAppointmentForm> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  bool _loading = true;
  bool _saving = false;
  AppointmentDraft? _appointment;
  late AnimationController _animController;

  // Controllers
  final _clientNameCtrl = TextEditingController();
  final _patientIdCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _complaintCtrl = TextEditingController();
  final _heightCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  final _bpCtrl = TextEditingController();
  final _hrCtrl = TextEditingController();
  final _spo2Ctrl = TextEditingController();

  // Dropdowns & flags
  String? _type;
  String _status = 'Scheduled';
  String _mode = 'In-clinic';
  String _priority = 'Normal';
  int _duration = 20;
  DateTime? _date;
  TimeOfDay? _time;
  bool _reminder = true;
  String _gender = 'Male';

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _fetchAppointment();
  }

  @override
  void dispose() {
    _animController.dispose();
    _clientNameCtrl.dispose();
    _patientIdCtrl.dispose();
    _phoneCtrl.dispose();
    _locationCtrl.dispose();
    _notesCtrl.dispose();
    _complaintCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _bpCtrl.dispose();
    _hrCtrl.dispose();
    _spo2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _fetchAppointment() async {
    try {
      final data = await AuthService.instance.fetchAppointmentById(widget.appointmentId);
      
      // DEBUG: Print the loaded data
      debugPrint('🔍 Loaded appointment data:');
      debugPrint('  - Client Name: ${data.clientName}');
      debugPrint('  - Patient ID: ${data.patientId}');
      debugPrint('  - Phone: ${data.phoneNumber}');
      debugPrint('  - Gender: ${data.gender}');
      debugPrint('  - Date: ${data.date}');
      debugPrint('  - Time: ${data.time}');
      debugPrint('  - Location: ${data.location}');
      debugPrint('  - Type: ${data.appointmentType}');
      debugPrint('  - Mode: ${data.mode}');
      debugPrint('  - Priority: ${data.priority}');
      debugPrint('  - Status: ${data.status}');
      debugPrint('  - Duration: ${data.durationMinutes}');
      debugPrint('  - Chief Complaint: ${data.chiefComplaint}');
      debugPrint('  - Notes: ${data.notes}');
      debugPrint('  - Vitals: H=${data.heightCm}, W=${data.weightKg}, BP=${data.bp}, HR=${data.heartRate}, SpO2=${data.spo2}');
      
      setState(() {
        _appointment = data;
        _clientNameCtrl.text = data.clientName;
        _patientIdCtrl.text = data.patientId ?? '';
        _phoneCtrl.text = data.phoneNumber ?? '';
        _locationCtrl.text = data.location;
        _complaintCtrl.text = data.chiefComplaint;
        _notesCtrl.text = data.notes ?? '';
        _heightCtrl.text = data.heightCm ?? '';
        _weightCtrl.text = data.weightKg ?? '';
        _bpCtrl.text = data.bp ?? '';
        _hrCtrl.text = data.heartRate ?? '';
        _spo2Ctrl.text = data.spo2 ?? '';
        _type = data.appointmentType;
        _mode = data.mode;
        _priority = data.priority;
        _duration = data.durationMinutes;
        _reminder = data.reminder;
        _status = data.status;
        _gender = data.gender ?? 'Male';
        _date = data.date;
        _time = data.time;
        _loading = false;
      });
      
      debugPrint('✅ All fields populated successfully');
    } catch (e) {
      debugPrint('❌ Error fetching appointment: $e');
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Failed to load appointment: $e'),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    }
  }

  String _fmtDate(DateTime? d) => d == null
      ? ''
      : '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  
  String _fmtTime(TimeOfDay? t) => t == null
      ? ''
      : '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _pickDate() async {
    final res = await showDatePicker(
      context: context,
      initialDate: _date ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (res != null) setState(() => _date = res);
  }

  Future<void> _pickTime() async {
    final res = await showTimePicker(
      context: context,
      initialTime: _time ?? TimeOfDay.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (res != null) setState(() => _time = res);
  }

  void _save() async {
    if (!_formKey.currentState!.validate() || _appointment == null || _saving) return;

    setState(() => _saving = true);

    try {
      // Check if patient details have changed
      final patientId = _appointment!.patientId;
      bool patientUpdated = false;

      if (patientId != null && patientId.isNotEmpty) {
        // Detect patient field changes
        final originalClientName = _appointment!.clientName;
        final originalPhone = _appointment!.phoneNumber;
        final originalGender = _appointment!.gender;
        
        final newClientName = _clientNameCtrl.text.trim();
        final newPhone = _phoneCtrl.text.trim();
        final newGender = _gender;

        // Check if patient details changed
        if (originalClientName != newClientName ||
            originalPhone != newPhone ||
            originalGender != newGender) {
          
          debugPrint('🔄 Patient details changed, updating patient record...');
          debugPrint('   Patient ID: $patientId');
          debugPrint('   Name: $originalClientName → $newClientName');
          debugPrint('   Phone: $originalPhone → $newPhone');
          debugPrint('   Gender: $originalGender → $newGender');

          // Update patient record
          patientUpdated = await AuthService.instance.updatePatientDetails(
            patientId: patientId,
            name: newClientName,
            phone: newPhone.isEmpty ? null : newPhone,
            gender: newGender,
          );

          if (patientUpdated) {
            debugPrint('✅ Patient record updated successfully');
          } else {
            debugPrint('⚠️ Failed to update patient record, continuing with appointment update');
          }
        }
      }

      // Update appointment
      final updated = _appointment!.copyWith(
        clientName: _clientNameCtrl.text.trim(),
        patientId: _patientIdCtrl.text.trim().isEmpty ? null : _patientIdCtrl.text.trim(),
        appointmentType: _type ?? _appointment!.appointmentType,
        date: _date ?? DateTime.now(),
        time: _time ?? TimeOfDay.now(),
        location: _locationCtrl.text.trim(),
        notes: _notesCtrl.text.trim(),
        phoneNumber: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        mode: _mode,
        priority: _priority,
        durationMinutes: _duration,
        reminder: _reminder,
        chiefComplaint: _complaintCtrl.text.trim(),
        heightCm: _heightCtrl.text.trim().isEmpty ? null : _heightCtrl.text.trim(),
        weightKg: _weightCtrl.text.trim().isEmpty ? null : _weightCtrl.text.trim(),
        bp: _bpCtrl.text.trim().isEmpty ? null : _bpCtrl.text.trim(),
        heartRate: _hrCtrl.text.trim().isEmpty ? null : _hrCtrl.text.trim(),
        spo2: _spo2Ctrl.text.trim().isEmpty ? null : _spo2Ctrl.text.trim(),
        status: _status,
        gender: _gender,
      );

      debugPrint('📤 Sending appointment update:');
      debugPrint('   ID: ${updated.id}');
      debugPrint('   Client: ${updated.clientName}');
      debugPrint('   Date: ${updated.date}');
      debugPrint('   Status: ${updated.status}');
      debugPrint('   Location: ${updated.location}');

      final appointmentSuccess = await AuthService.instance.editAppointment(updated);
      
      debugPrint('📥 Appointment update result: $appointmentSuccess');
      
      setState(() => _saving = false);

      if (appointmentSuccess) {
        widget.onSave(updated);
        if (mounted) {
          String message = 'Appointment updated successfully';
          if (patientUpdated) {
            message = 'Appointment and patient details updated successfully';
          }
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Iconsax.tick_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(child: Text(message)),
                ],
              ),
              backgroundColor: AppColors.kSuccess,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Iconsax.close_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  const Text('Failed to update appointment'),
                ],
              ),
              backgroundColor: AppColors.kDanger,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('❌ Error saving appointment: $e');
      setState(() => _saving = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Iconsax.close_circle, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text('Error: $e')),
              ],
            ),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    }
  }

  InputDecoration _dec({
    required String hintText,
    Widget? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: GoogleFonts.inter(
        fontSize: 13,
        color: AppColors.kTextSecondary,
        fontWeight: FontWeight.w500,
      ),
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
        borderRadius: BorderRadius.circular(12),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.primary, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      errorBorder: OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.kDanger, width: 1.5),
        borderRadius: BorderRadius.circular(12),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.kDanger, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final labelStyle = GoogleFonts.inter(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: AppColors.kTextPrimary,
      letterSpacing: 0.3,
    );
    final inputText = GoogleFonts.lexend(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: AppColors.kTextPrimary,
    );

    return Container(
      width: screenSize.width * 0.95,
      height: screenSize.height * 0.95,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.2),
            blurRadius: 50,
            offset: const Offset(0, 20),
            spreadRadius: 0,
          ),
        ],
      ),
      child: _loading
          ? _buildLoadingState()
          : _appointment == null
              ? _buildErrorState()
              : Column(
                  children: [
                    _buildHeader(context),
                    Divider(height: 1, color: AppColors.grey200),
                    Expanded(
                      child: Form(
                        key: _formKey,
                        child: RawScrollbar(
                          thumbColor: AppColors.primary.withOpacity(0.3),
                          radius: const Radius.circular(8),
                          thickness: 6,
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildPatientSection(labelStyle, inputText),
                                const SizedBox(height: 24),
                                _buildScheduleSection(labelStyle, inputText),
                                const SizedBox(height: 24),
                                _buildContactSection(labelStyle, inputText),
                                const SizedBox(height: 24),
                                _buildVitalsSection(labelStyle, inputText),
                                const SizedBox(height: 24),
                                _buildNotesSection(labelStyle, inputText),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    Divider(height: 1, color: AppColors.grey200),
                    _buildFooter(context),
                  ],
                ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary,
            AppColors.primary.withOpacity(0.85),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Iconsax.edit, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Edit Appointment',
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Update appointment details and save changes',
                  style: GoogleFonts.roboto(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: Colors.white.withOpacity(0.9),
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: widget.onCancel,
            icon: const Icon(Icons.close, color: Colors.white, size: 28),
            tooltip: 'Close',
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 60,
            height: 60,
            child: CircularProgressIndicator(
              strokeWidth: 4,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Loading Appointment...',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.kTextPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.kDanger.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Iconsax.close_circle,
              size: 64,
              color: AppColors.kDanger,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Failed to Load Appointment',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Please try again later',
            style: GoogleFonts.roboto(
              fontSize: 14,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPatientSection(TextStyle labelStyle, TextStyle inputText) {
    return _EnterpriseSection(
      icon: Iconsax.user,
      title: 'Patient Information',
      subtitle: 'Basic patient details and demographics',
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'Client Name *',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _clientNameCtrl,
                    style: inputText,
                    decoration: _dec(
                      hintText: 'Enter client name',
                      prefixIcon: Icon(Iconsax.user, size: 20, color: AppColors.primary),
                    ),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Client name is required' : null,
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: _Labeled(
                  label: 'Patient ID',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _patientIdCtrl,
                    style: inputText,
                    decoration: _dec(
                      hintText: 'Optional patient ID',
                      prefixIcon: Icon(Iconsax.card, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'Gender',
                  labelStyle: labelStyle,
                  child: _buildGenderSelector(),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: _Labeled(
                  label: 'Phone Number',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    style: inputText,
                    decoration: _dec(
                      hintText: '+91 9XXXXXXXXX',
                      prefixIcon: Icon(Iconsax.call, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGenderSelector() {
    return Row(
      children: [
        Expanded(
          child: _GenderChip(
            label: 'Male',
            icon: Iconsax.man,
            isSelected: _gender == 'Male',
            onTap: () => setState(() => _gender = 'Male'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _GenderChip(
            label: 'Female',
            icon: Iconsax.woman,
            isSelected: _gender == 'Female',
            onTap: () => setState(() => _gender = 'Female'),
          ),
        ),
      ],
    );
  }

  Widget _buildScheduleSection(TextStyle labelStyle, TextStyle inputText) {
    return _EnterpriseSection(
      icon: Iconsax.calendar,
      title: 'Appointment Schedule',
      subtitle: 'Date, time, and appointment details',
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'Date *',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    readOnly: true,
                    controller: TextEditingController(text: _fmtDate(_date)),
                    style: inputText,
                    decoration: _dec(
                      hintText: 'Select date',
                      prefixIcon: Icon(Iconsax.calendar_1, size: 20, color: AppColors.primary),
                      suffixIcon: IconButton(
                        icon: Icon(Iconsax.calendar_1, color: AppColors.primary),
                        onPressed: _pickDate,
                      ),
                    ),
                    onTap: _pickDate,
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: _Labeled(
                  label: 'Time *',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    readOnly: true,
                    controller: TextEditingController(text: _fmtTime(_time)),
                    style: inputText,
                    decoration: _dec(
                      hintText: 'Select time',
                      prefixIcon: Icon(Iconsax.clock, size: 20, color: AppColors.primary),
                      suffixIcon: IconButton(
                        icon: Icon(Iconsax.clock, color: AppColors.primary),
                        onPressed: _pickTime,
                      ),
                    ),
                    onTap: _pickTime,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'Mode',
                  labelStyle: labelStyle,
                  child: DropdownButtonFormField<String>(
                    value: _mode,
                    items: const [
                      DropdownMenuItem(value: 'In-clinic', child: Text('In-clinic')),
                      DropdownMenuItem(value: 'Telehealth', child: Text('Telehealth')),
                    ],
                    onChanged: (v) => setState(() => _mode = v ?? 'In-clinic'),
                    decoration: _dec(
                      hintText: 'Select mode',
                      prefixIcon: Icon(Iconsax.location, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: _Labeled(
                  label: 'Duration',
                  labelStyle: labelStyle,
                  child: DropdownButtonFormField<int>(
                    value: _duration,
                    items: const [15, 20, 30, 45, 60]
                        .map((m) => DropdownMenuItem(value: m, child: Text('$m minutes')))
                        .toList(),
                    onChanged: (v) => setState(() => _duration = v ?? 20),
                    decoration: _dec(
                      hintText: 'Duration',
                      prefixIcon: Icon(Iconsax.timer_1, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'Priority',
                  labelStyle: labelStyle,
                  child: DropdownButtonFormField<String>(
                    value: _priority,
                    items: const [
                      DropdownMenuItem(value: 'Normal', child: Text('Normal')),
                      DropdownMenuItem(value: 'Urgent', child: Text('Urgent')),
                      DropdownMenuItem(value: 'Emergency', child: Text('Emergency')),
                    ],
                    onChanged: (v) => setState(() => _priority = v ?? 'Normal'),
                    decoration: _dec(
                      hintText: 'Priority',
                      prefixIcon: Icon(Iconsax.flag, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: _Labeled(
                  label: 'Status',
                  labelStyle: labelStyle,
                  child: DropdownButtonFormField<String>(
                    value: _status,
                    items: const [
                      DropdownMenuItem(value: 'Scheduled', child: Text('Scheduled')),
                      DropdownMenuItem(value: 'Completed', child: Text('Completed')),
                      DropdownMenuItem(value: 'Cancelled', child: Text('Cancelled')),
                      DropdownMenuItem(value: 'Incomplete', child: Text('Incomplete')),
                    ],
                    onChanged: (v) => setState(() => _status = v ?? 'Scheduled'),
                    decoration: _dec(
                      hintText: 'Status',
                      prefixIcon: Icon(Iconsax.status, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContactSection(TextStyle labelStyle, TextStyle inputText) {
    return _EnterpriseSection(
      icon: Iconsax.location,
      title: 'Location & Contact',
      subtitle: 'Appointment venue and contact details',
      child: Column(
        children: [
          _Labeled(
            label: 'Location *',
            labelStyle: labelStyle,
            child: TextFormField(
              controller: _locationCtrl,
              style: inputText,
              decoration: _dec(
                hintText: 'Clinic address or meeting link',
                prefixIcon: Icon(Iconsax.map, size: 20, color: AppColors.primary),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Location is required' : null,
            ),
          ),
          const SizedBox(height: 20),
          _Labeled(
            label: 'Chief Complaint',
            labelStyle: labelStyle,
            child: TextFormField(
              controller: _complaintCtrl,
              maxLines: 2,
              style: inputText,
              decoration: _dec(
                hintText: 'Primary reason for visit',
                prefixIcon: Icon(Iconsax.note_1, size: 20, color: AppColors.primary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVitalsSection(TextStyle labelStyle, TextStyle inputText) {
    return _EnterpriseSection(
      icon: Iconsax.health,
      title: 'Quick Vitals',
      subtitle: 'Optional health measurements',
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'Height (cm)',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _heightCtrl,
                    keyboardType: TextInputType.number,
                    style: inputText,
                    decoration: _dec(
                      hintText: 'e.g., 175',
                      prefixIcon: Icon(Iconsax.ruler, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: _Labeled(
                  label: 'Weight (kg)',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _weightCtrl,
                    keyboardType: TextInputType.number,
                    style: inputText,
                    decoration: _dec(
                      hintText: 'e.g., 72',
                      prefixIcon: Icon(Iconsax.weight, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'Blood Pressure',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _bpCtrl,
                    style: inputText,
                    decoration: _dec(
                      hintText: 'e.g., 120/80',
                      prefixIcon: Icon(Iconsax.activity, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: _Labeled(
                  label: 'Heart Rate (bpm)',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _hrCtrl,
                    keyboardType: TextInputType.number,
                    style: inputText,
                    decoration: _dec(
                      hintText: 'e.g., 78',
                      prefixIcon: Icon(Iconsax.heart, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _Labeled(
                  label: 'SpO₂ (%)',
                  labelStyle: labelStyle,
                  child: TextFormField(
                    controller: _spo2Ctrl,
                    keyboardType: TextInputType.number,
                    style: inputText,
                    decoration: _dec(
                      hintText: 'e.g., 98',
                      prefixIcon: Icon(Iconsax.fatrows, size: 20, color: AppColors.primary),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(child: Container()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNotesSection(TextStyle labelStyle, TextStyle inputText) {
    return _EnterpriseSection(
      icon: Iconsax.note_text,
      title: 'Clinical Notes & Preferences',
      subtitle: 'Additional information and reminders',
      child: Column(
        children: [
          _Labeled(
            label: 'Clinical Notes',
            labelStyle: labelStyle,
            child: TextFormField(
              controller: _notesCtrl,
              maxLines: 4,
              style: inputText,
              decoration: _dec(
                hintText: 'Add any relevant clinical notes or observations',
                prefixIcon: Icon(Iconsax.document_text, size: 20, color: AppColors.primary),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.2),
                width: 1.5,
              ),
            ),
            child: SwitchListTile(
              value: _reminder,
              onChanged: (v) => setState(() => _reminder = v),
              title: Text(
                'Send Reminder',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
              ),
              subtitle: Text(
                'Notify patient before appointment',
                style: GoogleFonts.roboto(
                  fontSize: 12,
                  color: AppColors.kTextSecondary,
                ),
              ),
              activeColor: AppColors.primary,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Row(
        children: [
          OutlinedButton.icon(
            onPressed: _saving ? null : widget.onCancel,
            icon: const Icon(Iconsax.close_circle, size: 18),
            label: Text(
              'Cancel',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.kTextSecondary,
              side: BorderSide(color: AppColors.grey200, width: 1.5),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(width: 12),
          OutlinedButton.icon(
            onPressed: _saving
                ? null
                : () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: Row(
                          children: [
                            Icon(Iconsax.warning_2, color: AppColors.kDanger),
                            const SizedBox(width: 12),
                            const Text('Confirm Delete'),
                          ],
                        ),
                        content: const Text(
                          'Are you sure you want to delete this appointment? This action cannot be undone.',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancel'),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              widget.onDelete();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.kDanger,
                            ),
                            child: const Text('Delete'),
                          ),
                        ],
                      ),
                    );
                  },
            icon: const Icon(Iconsax.trash, size: 18),
            label: Text(
              'Delete',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.kDanger,
              side: BorderSide(color: AppColors.kDanger.withOpacity(0.3), width: 1.5),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Iconsax.tick_circle, size: 18),
            label: Text(
              _saving ? 'Saving...' : 'Save Changes',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              elevation: 2,
              shadowColor: AppColors.primary.withOpacity(0.3),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ===========================================================================
// HELPER WIDGETS
// ===========================================================================

class _EnterpriseSection extends StatelessWidget {
  const _EnterpriseSection({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.04),
            AppColors.accentPink.withOpacity(0.04),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.15),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withOpacity(0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.kTextPrimary,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.roboto(
                        fontSize: 12,
                        color: AppColors.kTextSecondary,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }
}

class _Labeled extends StatelessWidget {
  const _Labeled({
    required this.label,
    required this.labelStyle,
    required this.child,
  });

  final String label;
  final TextStyle labelStyle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: labelStyle),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _GenderChip extends StatelessWidget {
  const _GenderChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          gradient: isSelected
              ? LinearGradient(
                  colors: [
                    AppColors.primary,
                    AppColors.primary.withOpacity(0.85),
                  ],
                )
              : null,
          color: isSelected ? null : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.grey200,
            width: isSelected ? 2 : 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? Colors.white : AppColors.kTextSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.kTextPrimary,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
