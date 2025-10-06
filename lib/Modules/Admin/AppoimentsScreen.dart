import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../Models/Patients.dart';
import '/Modules/Doctor/widgets/Editappoimentspage.dart';
import '../../Models/appointment_draft.dart';
import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import '../Doctor/widgets/Addnewappoiments.dart';
import '../Doctor/widgets/doctor_appointment_preview.dart';
import 'PatientsPage.dart';
import 'widget/generic_data_table.dart';

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

class _NewAppointmentOverlayContentState extends State<_NewAppointmentOverlayContent> {
  bool _isLoading = true;
  List<Patient> _patients = [];
  List<Patient> _filtered = [];
  Patient? _selectedPatient;

  final TextEditingController _searchCtrl = TextEditingController();
  final TextEditingController _reasonCtrl = TextEditingController();
  final TextEditingController _noteCtrl = TextEditingController();

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(_onSearchChanged);
    _loadPatients();
  }

  @override
  void dispose() {
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

  Future<void> _submit() async {
    if (_selectedPatient == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a patient')));
      return;
    }
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a date')));
      return;
    }
    if (_selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a time')));
      return;
    }
    if (_reasonCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter reason/complaint')));
      return;
    }

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
        // return true so parent can refresh automatically (parent should await showDialog and refresh when true)
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Appointment added successfully')));
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add appointment')));
      }
    } catch (e) {
      debugPrint('Failed to create appointment: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add appointment')));
    }
  }

  Widget _buildPatientTile(Patient p) {
    final selected = p.id == _selectedPatient?.id;
    final asset = _genderAsset(p.gender);

    return GestureDetector(
      onTap: () => setState(() => _selectedPatient = p),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        decoration: BoxDecoration(
          color: selected ? Colors.white.withOpacity(0.18) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: selected ? Border.all(color: Colors.white.withOpacity(0.26), width: 1.2) : null,
        ),
        child: Row(
          children: [
            // Avatar circle that *fills* the icon perfectly
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white24,
              ),
              child: ClipOval(
                child: Image.asset(
                  asset,
                  fit: BoxFit.cover, // ensures icon fills circle (zoom/crop)
                  width: 40,
                  height: 40,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p.name ?? '-', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700)),
                // intentionally NOT showing phone/email per your request
              ]),
            ),
            const Icon(Icons.chevron_right, color: Colors.white70),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height;
    return Container(
      height: height * 0.86,
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 12, offset: Offset(0, 6))],
      ),
      child: Row(
        children: [
          // LEFT: patient list (blue)
          Expanded(
            flex: 3,
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.horizontal(left: Radius.circular(14)),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 12, 8),
                    child: Row(
                      children: [
                        const Icon(Icons.people_outline, color: Colors.white, size: 20),
                        const SizedBox(width: 10),
                        Text('Select Patient', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700)),
                        const Spacer(),
                        IconButton(
                          onPressed: _loadPatients,
                          icon: const Icon(Icons.refresh, color: Colors.white70),
                          tooltip: 'Refresh',
                        ),
                      ],
                    ),
                  ),

                  // search box (search by name only)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: Container(
                      decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(8)),
                      child: TextField(
                        controller: _searchCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(
                          prefixIcon: Icon(Icons.search, color: Colors.white70),
                          hintText: 'Search by name',
                          hintStyle: TextStyle(color: Colors.white70),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                        textInputAction: TextInputAction.search,
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  Expanded(
                    child: _isLoading
                        ? const Center(child: CircularProgressIndicator(color: Colors.white))
                        : _filtered.isEmpty
                        ? Center(child: Text('No patients', style: GoogleFonts.inter(color: Colors.white70)))
                        : Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Scrollbar(
                        thumbVisibility: true,
                        child: ListView.separated(
                          itemCount: _filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, i) => _buildPatientTile(_filtered[i]),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // RIGHT: form (white)
          Expanded(
            flex: 5,
            child: Container(
              color: AppColors.cardBackground,
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // header
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          _selectedPatient == null ? 'Add Appointment' : 'Add Appointment for ${_selectedPatient!.name}',
                          style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.kTextPrimary),
                        ),
                      ),
                      if (_selectedPatient != null) ...[
                        // right-header avatar (fills circle)
                        Container(
                          width: 44,
                          height: 44,
                          decoration: const BoxDecoration(color: AppColors.grey200, shape: BoxShape.circle),
                          child: ClipOval(
                            child: Image.asset(
                              _genderAsset(_selectedPatient!.gender),
                              fit: BoxFit.cover, // fills and zooms correctly
                              width: 44,
                              height: 44,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(_selectedPatient!.name ?? '-', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      ],
                    ],
                  ),

                  const SizedBox(height: 18),

                  // date + time
                  Row(children: [
                    Expanded(
                      child: TextFormField(
                        readOnly: true,
                        controller: TextEditingController(text: _formatDateShort(_selectedDate)),
                        onTap: _pickDate,
                        decoration: InputDecoration(
                          labelText: 'Date *',
                          suffixIcon: IconButton(icon: const Icon(Icons.calendar_today_outlined), onPressed: _pickDate),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.grey300)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: TextFormField(
                        readOnly: true,
                        controller: TextEditingController(text: _formatTimeShort(_selectedTime)),
                        onTap: _pickTime,
                        decoration: InputDecoration(
                          labelText: 'Time *',
                          suffixIcon: IconButton(icon: const Icon(Icons.access_time), onPressed: _pickTime),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.grey300)),
                        ),
                      ),
                    ),
                  ]),

                  const SizedBox(height: 14),

                  TextFormField(
                    controller: _reasonCtrl,
                    decoration: InputDecoration(
                      labelText: 'Reason / Complaint *',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.grey300)),
                    ),
                  ),

                  const SizedBox(height: 12),

                  TextFormField(
                    controller: _noteCtrl,
                    maxLines: 4,
                    decoration: InputDecoration(
                      labelText: 'Clinical Notes (optional)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.grey300)),
                    ),
                  ),

                  const Spacer(),

                  Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.grey300)),
                      child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.grey700)),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      onPressed: _submit,
                    // no explicit color here
                      label: Text('Save Appointment', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary600,
                        foregroundColor: Colors.white, // <- ensures icon & text are white
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
