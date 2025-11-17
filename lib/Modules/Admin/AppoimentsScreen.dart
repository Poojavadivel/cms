import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../Models/Patients.dart';
import '/Modules/Doctor/widgets/Editappoimentspage.dart';
import '../../Models/appointment_draft.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import '../Doctor/widgets/doctor_appointment_preview.dart';
import 'PatientsPage.dart';
import 'widgets/generic_data_table.dart';

// ---------------------------------------------------------------------
// Appointments Screen (supports Admin + Doctor; uses backend `doctor` field)
// - Uses DashboardAppointments model
// - Shows Doctor column (admin-only extra)
// - fetch / delete / edit / view use AuthService.instance
// ---------------------------------------------------------------------

const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

class AdminAppointmentsScreen extends StatefulWidget {
  const AdminAppointmentsScreen({super.key});

  @override
  State<AdminAppointmentsScreen> createState() => _AdminAppointmentsScreenState();
}

class _AdminAppointmentsScreenState extends State<AdminAppointmentsScreen> {
  List<DashboardAppointments> _allAppointments = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _doctorFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchAppointments();
  }

  Future<void> _fetchAppointments() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final appointments = await AuthService.instance.fetchAppointments();
      if (!mounted) return;
      setState(() {
        _allAppointments = appointments;
      });
    } catch (e) {
      debugPrint('❌ fetchAppointments error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed to load appointments: $e'),
        ));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// OPEN "NEW APPOINTMENT" OVERLAY AND RELOAD IF CREATED
  Future<void> _onAddPressed() async {
    if (!mounted) return;

    // Show dialog and wait for returned bool (true => created)
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: SizedBox(
          // large width on web/desktop
          width: 1200,
          child: _NewAppointmentOverlayContent(),
        ),
      ),
    );

    // If overlay returned true, refresh immediately
    if (result == true) {
      await _fetchAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Appointment saved ✅")),
        );
      }
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() {
    if (_currentPage > 0) setState(() => _currentPage--);
  }

  PatientDetails _mapApptToPatient(DashboardAppointments appt) {
    return PatientDetails(
      patientId: appt.patientId,
      name: appt.patientName,
      firstName: null,
      lastName: null,
      age: appt.patientAge,
      gender: appt.gender,
      bloodGroup: '',
      weight: appt.weight == 0 ? '' : appt.weight.toString(),
      height: appt.height == 0 ? '' : appt.height.toString(),
      emergencyContactName: '',
      emergencyContactPhone: '',
      phone: '',
      city: appt.location,
      address: appt.location,
      pincode: '',
      insuranceNumber: '',
      expiryDate: '',
      avatarUrl: appt.patientAvatarUrl,
      dateOfBirth: appt.dob,
      lastVisitDate: appt.date,
      doctorId: appt.doctor,
      doctor: null,
      doctorName: appt.doctor,
      medicalHistory: appt.diagnosis,
      allergies: const [],
      notes: appt.currentNotes ?? appt.previousNotes ?? '',
      oxygen: '',
      bmi: appt.bmi == 0.0 ? '' : appt.bmi.toStringAsFixed(1),
      isSelected: appt.isSelected,
      patientCode: appt.id,
    );
  }

  Future<void> _onView(int index, List<DashboardAppointments> list) async {
    final appointment = list[index];
    try {
      AppointmentDraft? draft;
      try {
        draft = await AuthService.instance.fetchAppointmentById(appointment.id);
      } catch (_) {
        draft = null;
      }

      final patient = _mapApptToPatient(appointment);

      await showDialog(
        context: context,
        builder: (_) => Dialog(
          insetPadding: const EdgeInsets.all(12),
          child: DoctorAppointmentPreview(patient: patient),
        ),
      );
    } catch (e) {
      debugPrint('❌ view error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to open preview: $e')),
        );
      }
    }
  }

  Future<void> _onEdit(int index, List<DashboardAppointments> list) async {
    final appointment = list[index];

    try {
      AppointmentDraft draft;
      try {
        draft = await AuthService.instance.fetchAppointmentById(appointment.id);
      } catch (_) {
        draft = AppointmentDraft(
          id: appointment.id,
          clientName: appointment.patientName,
          appointmentType: appointment.service,
          date: DateTime.tryParse(appointment.date) ?? DateTime.now(),
          time: TimeOfDay(
            hour: int.tryParse(appointment.time.split(':').first) ?? 0,
            minute: appointment.time.contains(':')
                ? int.tryParse(appointment.time.split(':').last.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0
                : 0,
          ),
          location: appointment.location,
          notes: appointment.currentNotes,
          gender: appointment.gender,
          patientId: appointment.patientId,
          phoneNumber: null,
          mode: 'In-clinic',
          priority: 'Normal',
          durationMinutes: 20,
          reminder: true,
          chiefComplaint: appointment.reason,
          status: appointment.status,
        );
      }

      final result = await Navigator.push<AppointmentDraft?>(
        context,
        MaterialPageRoute(
          builder: (_) => ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Material(
              color: Colors.white,
              child: EditAppointmentForm(
                appointmentId: appointment.id,
                onSave: (updatedDraft) {
                  Navigator.pop(context, updatedDraft);
                },
                onCancel: () => Navigator.pop(context, null),
                onDelete: () {
                  Navigator.pop(context, null);
                },
              ),
            ),
          ),
        ),
      );

      if (result != null) {
        if (mounted) setState(() => _isLoading = true);
        try {
          final success = await AuthService.instance.editAppointment(result);
          if (success) {
            await _fetchAppointments(); // refresh instantly after edit
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Appointment updated')));
          } else {
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update appointment')));
          }
        } catch (e) {
          debugPrint('❌ edit API error: $e');
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating: $e')));
        } finally {
          if (mounted) setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      debugPrint('❌ edit error: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to edit: $e')));
    }
  }

  Future<void> _onDelete(int index, List<DashboardAppointments> list) async {
    final appointment = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete appointment for ${appointment.patientName}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      final success = await AuthService.instance.deleteAppointment(appointment.id);
      if (success) {
        await _fetchAppointments(); // refresh instantly after delete
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted appointment for ${appointment.patientName}')));
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete appointment')));
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('❌ delete error: $e');
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deleting: $e')));
    }
  }

  List<DashboardAppointments> _getFilteredAppointments() {
    final q = _searchQuery.trim().toLowerCase();
    return _allAppointments.where((a) {
      final matchesSearch = a.patientName.toLowerCase().contains(q) ||
          a.id.toLowerCase().contains(q) ||
          a.doctor.toLowerCase().contains(q) ||
          a.patientId.toLowerCase().contains(q);
      final matchesFilter = _doctorFilter == 'All' || a.doctor == _doctorFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _statusChip(String status) {
    Color bg;
    Color fg;

    switch (status) {
      case 'Completed':
        bg = Colors.green.withOpacity(0.12);
        fg = Colors.green;
        break;
      case 'Pending':
        bg = Colors.orange.withOpacity(0.12);
        fg = Colors.orange;
        break;
      case 'Cancelled':
        bg = Colors.red.withOpacity(0.12);
        fg = Colors.red;
        break;
      default:
        bg = Colors.grey.withOpacity(0.12);
        fg = Colors.grey;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildDoctorFilter() {
    final doctors = {'All', ..._allAppointments.map((s) => s.doctor).where((d) => d.isNotEmpty).toSet()};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      onSelected: (String newValue) {
        setState(() {
          _doctorFilter = newValue;
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        return doctors.map((String value) {
          return PopupMenuItem<String>(
            value: value,
            child: Text(value, style: GoogleFonts.inter()),
          );
        }).toList();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredAppointments();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedAppointments = startIndex >= filtered.length ? <DashboardAppointments>[] : filtered.sublist(startIndex, endIndex);

    final headers = const ['PATIENT NAME', 'DOCTOR NAME', 'DATE', 'TIME', 'REASON', 'STATUS'];
    final rows = paginatedAppointments.map((a) {
      // robust gender -> asset mapping
      final genderStr = a.gender.toLowerCase().trim();
      String avatarAsset;
      if (genderStr.contains('male') || genderStr.startsWith('m')) {
        avatarAsset = 'assets/boyicon.png';
      } else if (genderStr.contains('female') || genderStr.startsWith('f')) {
        avatarAsset = 'assets/girlicon.png';
      } else {
        avatarAsset = 'assets/boyicon.png';
      }

      return [
        Row(
          children: [
            Image.asset(
              avatarAsset,
              height: 28,
              width: 28,
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.patientName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: textPrimaryColor)),
              ],
            ),
          ],
        ),
        Text(a.doctor, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(a.date, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(a.time, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(a.reason, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        _statusChip(a.status),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Appointments",
            headers: headers,
            rows: rows,
            searchQuery: _searchQuery,
            onSearchChanged: _onSearchChanged,
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: 10,
            onPreviousPage: _prevPage,
            onNextPage: _nextPage,
            isLoading: _isLoading,
            onAddPressed: _onAddPressed,
            filters: [_buildDoctorFilter()],
            hideHorizontalScrollbar: true,
            onView: (i) => _onView(i, paginatedAppointments),
            onEdit: (i) => _onEdit(i, paginatedAppointments),
            onDelete: (i) => _onDelete(i, paginatedAppointments),
          ),
        ),
      ),
    );
  }
}





class _NewAppointmentOverlayContent extends StatefulWidget {
  const _NewAppointmentOverlayContent({super.key});

  @override
  State<_NewAppointmentOverlayContent> createState() => _NewAppointmentOverlayContentState();
}

class _NewAppointmentOverlayContentState extends State<_NewAppointmentOverlayContent> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  bool _isSaving = false;
  List<Patient> _patients = [];
  List<Patient> _filtered = [];
  Patient? _selectedPatient;

  final TextEditingController _searchCtrl = TextEditingController();
  final TextEditingController _reasonCtrl = TextEditingController();
  final TextEditingController _noteCtrl = TextEditingController();

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _searchCtrl.addListener(_onSearchChanged);
    _loadPatients();
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchCtrl.removeListener(_onSearchChanged);
    _searchCtrl.dispose();
    _reasonCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  // <-- UPDATED: search by name ONLY, prefix match (startsWith), case-insensitive
  void _onSearchChanged() {
    final q = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      if (q.isEmpty) {
        _filtered = List.from(_patients);
      } else {
        _filtered = _patients.where((p) {
          final name = (p.name ?? '').toLowerCase();
          return name.startsWith(q); // prefix match only
        }).toList();
      }
    });
  }

  Future<void> _loadPatients() async {
    setState(() => _isLoading = true);
    try {
      final details = await AuthService.instance.fetchPatients(forceRefresh: true);
      final mapped = details.map((d) => Patient.fromDetails(d)).toList();
      if (!mounted) return;
      setState(() {
        _patients = mapped;
        _filtered = List.from(mapped);
      });
    } catch (e) {
      debugPrint('Error fetching patients: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load patients')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 2),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (date != null && mounted) setState(() => _selectedDate = date);
  }

  Future<void> _pickTime() async {
    final t = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (t != null && mounted) setState(() => _selectedTime = t);
  }

  String _formatDateShort(DateTime? d) {
    if (d == null) return '';
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  String _formatTimeShort(TimeOfDay? t) {
    if (t == null) return '';
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  String _genderAsset(String? gender) {
    final g = (gender ?? '').toLowerCase().trim();
    if (g.contains('female') || g.startsWith('f')) return 'assets/girlicon.png';
    return 'assets/boyicon.png';
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Iconsax.warning_2, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.inter(fontWeight: FontWeight.w500))),
          ],
        ),
        backgroundColor: AppColors.kDanger,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Future<void> _submit() async {
    if (_selectedPatient == null) {
      _showError('Please select a patient');
      return;
    }
    if (_selectedDate == null) {
      _showError('Please select a date');
      return;
    }
    if (_selectedTime == null) {
      _showError('Please select a time');
      return;
    }
    if (_reasonCtrl.text.trim().isEmpty) {
      _showError('Please enter reason/complaint');
      return;
    }

    setState(() => _isSaving = true);

    final draft = AppointmentDraft(
      clientName: _selectedPatient!.name,
      appointmentType: 'Consultation',
      date: _selectedDate!,
      time: _selectedTime!,
      location: 'Clinic',
      notes: _noteCtrl.text.trim(),
      patientId: _selectedPatient!.id,
      mode: 'In-clinic',
      priority: 'Normal',
      durationMinutes: 20,
      reminder: true,
      chiefComplaint: _reasonCtrl.text.trim(),
    );

    try {
      final ok = await AuthService.instance.createAppointment(draft);
      if (ok && mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Iconsax.tick_circle, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text('Appointment created successfully', style: GoogleFonts.inter(fontWeight: FontWeight.w500))),
              ],
            ),
            backgroundColor: AppColors.kSuccess,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        );
      } else {
        if (mounted) {
          setState(() => _isSaving = false);
          _showError('Failed to add appointment');
        }
      }
    } catch (e) {
      debugPrint('Failed to create appointment: $e');
      if (mounted) {
        setState(() => _isSaving = false);
        _showError('Failed to add appointment: $e');
      }
    }
  }

  Widget _buildPatientTile(Patient p) {
    final selected = p.id == _selectedPatient?.id;
    final asset = _genderAsset(p.gender);

    return GestureDetector(
      onTap: () => setState(() => _selectedPatient = p),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 2),
        decoration: BoxDecoration(
          color: selected ? Colors.white.withOpacity(0.2) : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: selected ? Border.all(color: Colors.white.withOpacity(0.4), width: 2) : null,
          boxShadow: selected ? [
            BoxShadow(
              color: Colors.white.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ] : null,
        ),
        child: Row(
          children: [
            // Avatar with shadow
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.15),
                boxShadow: selected ? [
                  BoxShadow(
                    color: Colors.white.withOpacity(0.2),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ] : null,
              ),
              child: ClipOval(
                child: Image.asset(
                  asset,
                  fit: BoxFit.cover,
                  width: 46,
                  height: 46,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.name ?? '-',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  if (p.age != null && p.age! > 0) ...[
                    const SizedBox(height: 2),
                    Text(
                      '${p.age} years',
                      style: GoogleFonts.inter(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              selected ? Iconsax.tick_circle5 : Iconsax.arrow_right_3,
              color: selected ? Colors.white : Colors.white.withOpacity(0.6),
              size: selected ? 24 : 20,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height;
    final width = MediaQuery.of(context).size.width;
    
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Container(
          height: height * 0.88,
          constraints: BoxConstraints(maxWidth: width > 1400 ? 1200 : width * 0.95),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.08),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              // LEFT: patient list (gradient blue)
              Expanded(
                flex: 3,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary,
                        AppColors.primary600,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
                  ),
                  child: Column(
                    children: [
                      // Header with icon
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(20),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Iconsax.user_octagon, color: Colors.white, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Select Patient',
                                style: GoogleFonts.poppins(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: IconButton(
                                onPressed: _loadPatients,
                                icon: const Icon(Iconsax.refresh, color: Colors.white),
                                tooltip: 'Refresh patients',
                                iconSize: 20,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Search box
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.2),
                              width: 1.5,
                            ),
                          ),
                          child: TextField(
                            controller: _searchCtrl,
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                            decoration: InputDecoration(
                              prefixIcon: const Icon(Iconsax.search_normal_1, color: Colors.white, size: 20),
                              hintText: 'Search by patient name...',
                              hintStyle: GoogleFonts.inter(
                                color: Colors.white.withOpacity(0.6),
                                fontSize: 14,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            textInputAction: TextInputAction.search,
                          ),
                        ),
                      ),

                      const SizedBox(height: 4),

                      // Patient count indicator
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Text(
                              '${_filtered.length} patient${_filtered.length != 1 ? 's' : ''}',
                              style: GoogleFonts.inter(
                                color: Colors.white.withOpacity(0.8),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 8),

                      // Patient list
                      Expanded(
                        child: _isLoading
                            ? Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 3,
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Loading patients...',
                                      style: GoogleFonts.inter(
                                        color: Colors.white.withOpacity(0.8),
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : _filtered.isEmpty
                                ? Center(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Iconsax.user_search,
                                          color: Colors.white.withOpacity(0.5),
                                          size: 48,
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          'No patients found',
                                          style: GoogleFonts.inter(
                                            color: Colors.white.withOpacity(0.8),
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _searchCtrl.text.isNotEmpty
                                              ? 'Try a different search'
                                              : 'Add patients to get started',
                                          style: GoogleFonts.inter(
                                            color: Colors.white.withOpacity(0.6),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                : Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    child: Scrollbar(
                                      thumbVisibility: true,
                                      radius: const Radius.circular(8),
                                      child: ListView.builder(
                                        padding: const EdgeInsets.only(bottom: 16, right: 4),
                                        itemCount: _filtered.length,
                                        itemBuilder: (context, i) => _buildPatientTile(_filtered[i]),
                                      ),
                                    ),
                                  ),
                      ),
                    ],
                  ),
                ),
              ),

          // RIGHT: appointment form
          Expanded(
            flex: 5,
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.horizontal(right: Radius.circular(20)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header section
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withOpacity(0.08),
                          AppColors.primary.withOpacity(0.03),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.15),
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppColors.primary, AppColors.primary600],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(Iconsax.calendar_add5, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'New Appointment',
                                style: GoogleFonts.poppins(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.kTextPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _selectedPatient == null
                                    ? 'Select a patient to continue'
                                    : 'Creating for ${_selectedPatient!.name}',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: AppColors.kTextSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (_selectedPatient != null)
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: AppColors.grey100,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.primary.withOpacity(0.3),
                                width: 2,
                              ),
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                _genderAsset(_selectedPatient!.gender),
                                fit: BoxFit.cover,
                                width: 50,
                                height: 50,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Date & Time section
                  Text(
                    'Schedule',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.kTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          readOnly: true,
                          controller: TextEditingController(text: _formatDateShort(_selectedDate)),
                          onTap: _pickDate,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                          decoration: InputDecoration(
                            labelText: 'Date *',
                            labelStyle: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.kTextSecondary,
                            ),
                            prefixIcon: const Icon(Iconsax.calendar_1, size: 20),
                            suffixIcon: IconButton(
                              icon: const Icon(Iconsax.arrow_down_1, size: 18),
                              onPressed: _pickDate,
                            ),
                            filled: true,
                            fillColor: AppColors.grey50,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppColors.primary, width: 2),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          readOnly: true,
                          controller: TextEditingController(text: _formatTimeShort(_selectedTime)),
                          onTap: _pickTime,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                          decoration: InputDecoration(
                            labelText: 'Time *',
                            labelStyle: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.kTextSecondary,
                            ),
                            prefixIcon: const Icon(Iconsax.clock, size: 20),
                            suffixIcon: IconButton(
                              icon: const Icon(Iconsax.arrow_down_1, size: 18),
                              onPressed: _pickTime,
                            ),
                            filled: true,
                            fillColor: AppColors.grey50,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppColors.primary, width: 2),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Reason/Complaint
                  Text(
                    'Appointment Details',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.kTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _reasonCtrl,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.kTextPrimary,
                    ),
                    decoration: InputDecoration(
                      labelText: 'Reason / Chief Complaint *',
                      labelStyle: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.kTextSecondary,
                      ),
                      hintText: 'e.g., Fever, Headache, Check-up',
                      hintStyle: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.kTextSecondary.withOpacity(0.6),
                      ),
                      prefixIcon: const Icon(Iconsax.note_text, size: 20),
                      filled: true,
                      fillColor: AppColors.grey50,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppColors.primary, width: 2),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Clinical Notes
                  TextFormField(
                    controller: _noteCtrl,
                    maxLines: 4,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.kTextPrimary,
                    ),
                    decoration: InputDecoration(
                      labelText: 'Clinical Notes (Optional)',
                      labelStyle: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.kTextSecondary,
                      ),
                      hintText: 'Additional notes or observations...',
                      hintStyle: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.kTextSecondary.withOpacity(0.6),
                      ),
                      alignLabelWithHint: true,
                      prefixIcon: const Padding(
                        padding: EdgeInsets.only(bottom: 60),
                        child: Icon(Iconsax.document_text, size: 20),
                      ),
                      filled: true,
                      fillColor: AppColors.grey50,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: AppColors.primary, width: 2),
                      ),
                    ),
                  ),

                  const Spacer(),

                  // Action buttons
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.grey50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.grey200, width: 1.5),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        OutlinedButton.icon(
                          onPressed: _isSaving ? null : () => Navigator.pop(context, false),
                          icon: const Icon(Iconsax.close_circle, size: 18),
                          label: Text(
                            'Cancel',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.kTextSecondary,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                            side: BorderSide(color: AppColors.grey300, width: 1.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: _isSaving ? null : _submit,
                          icon: _isSaving
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Iconsax.tick_circle5, size: 20),
                          label: Text(
                            _isSaving ? 'Saving...' : 'Save Appointment',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            elevation: 0,
                            shadowColor: AppColors.primary.withOpacity(0.3),
                          ),
                        ),
                      ],
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
    );
  }
}
