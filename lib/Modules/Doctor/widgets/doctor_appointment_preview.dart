import 'package:flutter/material.dart';
import 'package:glowhair/Models/Patients.dart';
import 'package:glowhair/Modules/Doctor/widgets/table.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';
import '../../../Widgets/patient_profile_header_card.dart';
import '../../../Services/Authservices.dart';
import '../../../Services/api_constants.dart';
import '../../Admin/widgets/enterprise_patient_form.dart';


class DoctorAppointmentPreview extends StatefulWidget {
  final PatientDetails patient;
  final bool showBillingTab;
  
  const DoctorAppointmentPreview({
    super.key, 
    required this.patient,
    this.showBillingTab = true,
  });

  static Future<void> show(
    BuildContext context, 
    PatientDetails patient, {
    bool showBillingTab = true,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => DoctorAppointmentPreview(
        patient: patient,
        showBillingTab: showBillingTab,
      ),
    );
  }

  @override
  State<DoctorAppointmentPreview> createState() =>
      _DoctorAppointmentPreviewState();
}

class _DoctorAppointmentPreviewState extends State<DoctorAppointmentPreview>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  late final TextStyle baseText;
  late PatientDetails _currentPatient;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _currentPatient = widget.patient;
    // Adjust tab count based on whether billing tab is shown
    _tab = TabController(
      length: widget.showBillingTab ? 5 : 4, 
      vsync: this,
    );
    baseText = GoogleFonts.inter();
  }

  Future<void> _refreshPatientData() async {
    if (_isRefreshing) return;
    
    setState(() {
      _isRefreshing = true;
    });

    try {
      debugPrint('🔄 [APPOINTMENT PREVIEW] Refreshing patient data for: ${_currentPatient.patientId}');
      final freshData = await AuthService.instance.fetchProfileCardData(_currentPatient.patientId);
      if (mounted) {
        setState(() {
          _currentPatient = freshData;
          _isRefreshing = false;
        });
        debugPrint('✅ [APPOINTMENT PREVIEW] Patient data refreshed successfully');
      }
    } catch (e) {
      debugPrint('⚠️ [APPOINTMENT PREVIEW] Failed to refresh patient data: $e');
      if (mounted) {
        setState(() {
          _isRefreshing = false;
        });
      }
    }
  }

  Future<void> _openEditPatientDialog(BuildContext context, PatientDetails patient) async {
    // Import the form dynamically to avoid circular dependencies
    final result = await showDialog<dynamic>(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.9,
            maxHeight: MediaQuery.of(context).size.height * 0.9,
          ),
          child: _buildEditPatientForm(patient),
        ),
      ),
    );

    // Refresh patient data after edit
    if (result != null) {
      debugPrint('✅ [APPOINTMENT PREVIEW] Patient edited, refreshing data...');
      await _refreshPatientData();
    }
  }

  Widget _buildEditPatientForm(PatientDetails patient) {
    return EnterprisePatientForm(initial: patient);
  }
  static const Color kPrimary = Color(0xFFEF4444);
  static const Color kBg = Color(0xFFF9FAFB);
  static const Color kCard = Colors.white;
  static const Color kText = Color(0xFF111827);
  static const Color kMuted = Color(0xFF6B7280);
  static const Color kBorder = Color(0xFFE5E7EB);
  static const double kRadius = 16;


  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return DateFormat('dd MMM yyyy').format(dt);
    } catch (e) {
      return iso.isNotEmpty ? iso : '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final patient = _currentPatient;
    final size = MediaQuery.of(context).size;

    // map patient fields to the names used in the original UI (fallbacks applied)
    final pName = (patient.name.isNotEmpty) ? patient.name : '—';
    final pGender = (patient.gender.isNotEmpty) ? patient.gender : '—';
    
    // Build complete address from patient data (for legacy display in other tabs)
    debugPrint('🏠 Address Debug - HouseNo: "${patient.houseNo}", Street: "${patient.street}"');
    debugPrint('🏠 Address Debug - City: "${patient.city}", State: "${patient.state}"');
    
    final List<String> addressParts = [];
    if (patient.houseNo.isNotEmpty) addressParts.add(patient.houseNo);
    if (patient.street.isNotEmpty) addressParts.add(patient.street);
    if (patient.city.isNotEmpty) addressParts.add(patient.city);
    if (patient.state.isNotEmpty) addressParts.add(patient.state);
    if (patient.pincode.isNotEmpty) addressParts.add(patient.pincode);
    if (patient.country.isNotEmpty) addressParts.add(patient.country);
    final pLoc = addressParts.isNotEmpty ? addressParts.join(', ') : '—';
    
    // final pJob = (patient.occupation.isNotEmpty) ? patient.occupation : '—';
    final pDob = (patient.dateOfBirth.isNotEmpty) ? patient.dateOfBirth : '—';
    final pBMI = (patient.bmi.isNotEmpty) ? patient.bmi : '—';
    final pWt = (patient.weight.isNotEmpty) ? patient.weight : '—';
    final pHt = (patient.height.isNotEmpty) ? patient.height : '—';
    final ownDx = patient.medicalHistory;
    final barriers = patient.allergies;
    final timeline = <Map<String,String>>[]; // PatientDetails has no timeline field in your model
    final medHistory = <String, String>{}; // if you have a map-based history, map it here

    // Emergency contact data from patient
    final pEmergencyName = patient.emergencyContactName.isNotEmpty ? patient.emergencyContactName : '—';
    final pEmergencyPhone = patient.emergencyContactPhone.isNotEmpty ? patient.emergencyContactPhone : '—';
    
    // Insurance data from patient
    final pInsurance = patient.insuranceNumber.isNotEmpty ? patient.insuranceNumber : '—';
    final pInsuranceExpiry = patient.expiryDate.isNotEmpty ? patient.expiryDate : '—';

    // Appointment-specific placeholders (originally from DashboardAppointments)
    final date = patient.lastVisitDate.isNotEmpty ? patient.lastVisitDate : '—';
    final time = '—';
    final reason = patient.notes.isNotEmpty ? patient.notes : '—';
    final status = '—';

    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      backgroundColor: Colors.transparent,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.95,
          maxHeight: size.height * 0.95,
        ),
        child: Stack(
          clipBehavior: Clip.none, // allow floating close button outside
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(kRadius),
              child: Material(
                color: kBg,
                child: Column(
                  children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 16, 12, 12),
                        child: Column(
                          children: [
                            // PATIENT HEADER
                            Container(
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                              child: PatientProfileHeaderCard(
                                patient: patient,
                                onEdit: () async {
                                  debugPrint('📝 [APPOINTMENT PREVIEW] Opening edit patient dialog...');
                                  await _openEditPatientDialog(context, patient);
                                },
                              ),
                            ),

                            const SizedBox(height: 12),

                            // TABS + CONTENT
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  color: kCard,
                                  borderRadius: BorderRadius.circular(kRadius),
                                  border: Border.all(color: kBorder),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(.05),
                                      blurRadius: 12,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // top tab bar
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8),
                                      decoration: BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(color: kBorder),
                                        ),
                                      ),
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
                                          fontWeight: FontWeight.w800,
                                        ),
                                        tabs: [
                                          const Tab(text: 'Profile'),
                                          const Tab(text: 'Medical History'),
                                          const Tab(text: 'Prescription'),
                                          const Tab(text: 'Lab Result'),
                                          if (widget.showBillingTab)
                                            const Tab(text: 'Billings'),
                                        ],
                                      ),
                                    ),

                                    // tab views
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: TabBarView(
                                          controller: _tab,
                                          children: [
                                            _OverviewTab(
                                              text: baseText,
                                              pName: pName,
                                              pGender: pGender,
                                              pLoc: pLoc,
                                              // pJob: pJob,
                                              pDob: pDob,
                                              pBMI: pBMI,
                                              pWt: pWt,
                                              pHt: pHt,
                                              pBp: '—',
                                              ownDx: ownDx,
                                              barriers: barriers,
                                              timeline: timeline,
                                              medHistory: medHistory,
                                              date: date,
                                              time: time,
                                              reason: reason,
                                              status: status,
                                              pEmergencyName: pEmergencyName,
                                              pEmergencyPhone: pEmergencyPhone,
                                              pInsurance: pInsurance,
                                              pInsuranceExpiry: pInsuranceExpiry,
                                              pHouseNo: patient.houseNo,
                                              pStreet: patient.street,
                                              pCity: patient.city,
                                              pState: patient.state,
                                              pPincode: patient.pincode,
                                              pCountry: patient.country.isNotEmpty ? patient.country : 'India',
                                            ),
                                            _PatientProfileTab(
                                              patientId: patient.patientId,
                                              name: pName,
                                              gender: pGender,
                                              dob: pDob,
                                              age: patient.age != 0 ? '${patient.age}' : '—',
                                              phone: patient.phone.isNotEmpty ? patient.phone : '—',
                                              email: '—',
                                              address: pLoc,
                                              doctorName: patient.doctorName.isNotEmpty ? patient.doctorName : '—',
                                              primaryDiagnosis: ownDx.isNotEmpty ? ownDx.first : '—',
                                              diagnoses: ownDx,
                                              allergies: patient.allergies,
                                              chronicConditions: const [],
                                              height: pHt,
                                              weight: pWt,
                                              bmi: pBMI,
                                              bp: '—',
                                              heartRate: '—',
                                              emergencyContactName: patient.emergencyContactName.isNotEmpty ? patient.emergencyContactName : '—',
                                              emergencyContactPhone: patient.emergencyContactPhone.isNotEmpty ? patient.emergencyContactPhone : '—',
                                            ),
                                            _MedicationsTab(patientId: patient.patientId),
                                            _LabsTab(patientId: patient.patientId),
                                            if (widget.showBillingTab)
                                              const _BillingsTab(),
                                          ],
                                        ),
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
                  ],
                ),
              ),
            ),

            // CLOSE BUTTON
            Positioned(
              top: -10,
              right: -10,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(28),
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: kBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(.10),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.close_rounded, size: 20, color: kMuted),
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




class _OverviewTab extends StatelessWidget {
  // Incoming (kept for compatibility)
  final TextStyle text;
  final String pName, pGender, pLoc, pDob, pBMI, pWt, pHt, pBp;
  final List<String> ownDx, barriers;
  final List<Map<String, dynamic>> timeline;
  final Map<String, String> medHistory;
  final String date, time, reason, status;
  final String pEmergencyName, pEmergencyPhone;
  final String pInsurance, pInsuranceExpiry;
  // Direct address fields (no parsing needed)
  final String pHouseNo, pStreet, pCity, pState, pPincode, pCountry;

  const _OverviewTab({
    required this.text,
    required this.pName,
    required this.pGender,
    required this.pLoc,
    // required this.pJob,
    required this.pDob,
    required this.pBMI,
    required this.pWt,
    required this.pHt,
    required this.pBp,
    required this.ownDx,
    required this.barriers,
    required this.timeline,
    required this.medHistory,
    required this.date,
    required this.time,
    required this.reason,
    required this.status,
    required this.pEmergencyName,
    required this.pEmergencyPhone,
    required this.pInsurance,
    required this.pInsuranceExpiry,
    required this.pHouseNo,
    required this.pStreet,
    required this.pCity,
    required this.pState,
    required this.pPincode,
    required this.pCountry,
  });

  // Theme
  static const Color kText   = Color(0xFF0B1324);
  static const Color kMuted  = Color(0xFF64748B);
  static const Color kCard   = Colors.white;
  static const Color kBorder = Color(0xFFE5E7EB);
  static const Color kPrimary= Color(0xFFEF4444);
  static const double kRadius= 16;
  static const double kCardMinH = 156;

  // Samples / placeholders
  static const String kSampleAddress = "94 KR nagar, Dindigul, TamilNadu";
  static const String kSampleEmergencyName = "Sri ram";
  static const String kSampleEmergencyPhone = "+91 6382255960";
  static const String kSampleEmergencyAddress = "98 RM colony, Dinigul, TamilNadu";
  static const String kSampleInsurance = "HealthPlus Insurance, Policy #123456789";

  // Treat these as “no data”
  bool _isMissing(String? s) {
    if (s == null) return true;
    final t = s.trim();
    if (t.isEmpty) return true;
    const invalid = {'—','-','--','na','n/a','null','none'};
    return invalid.contains(t.toLowerCase());
  }

  @override
  Widget build(BuildContext context) {
    final base = GoogleFonts.inter(color: kText, height: 1.35);

    // Use direct address fields (no parsing needed!)
    debugPrint('📍 Display Debug - pHouseNo: "$pHouseNo", pStreet: "$pStreet"');
    debugPrint('📍 Display Debug - pCity: "$pCity", pState: "$pState", pPincode: "$pPincode"');
    
    final addr = _USAddress(
      street1: pHouseNo,
      street2: pStreet,
      city: pCity,
      state: pState,
      zip: pPincode,
      country: pCountry,
    );
    
    debugPrint('📦 _USAddress created - street1: "${addr.street1}", street2: "${addr.street2}"');

    // Use actual update dates if available, or show "Not available"
    const addrUpdated = "Updated: Recently";
    const emgUpdated  = "Last Updated: Recently";
    const insUpdated  = "Verified: Recently";

    return LayoutBuilder(
      builder: (context, c) {
        final isWide = c.maxWidth >= 980;

        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            // Row 1 — Address + Emergency (same height)
            if (isWide)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _addressCard(context, base, addr, addrUpdated)),
                  const SizedBox(width: 14),
                  Expanded(child: _emergencyCard(base, emgUpdated)),
                ],
              )
            else
              Column(
                children: [
                  _addressCard(context, base, addr, addrUpdated),
                  const SizedBox(height: 14),
                  _emergencyCard(base, emgUpdated),
                ],
              ),

            const SizedBox(height: 14),

            // Row 2 — Insurance
            _insuranceCard(base, insUpdated),
          ],
        );
      },
    );
  }

  // ============ EXPERT ADDRESS CARD ============
  Widget _addressCard(
      BuildContext context,
      TextStyle base,
      _USAddress addr,
      String updated,
      ) {
    final fullOneLine = _joinNonEmpty([
      addr.street1,
      addr.street2,
      _joinNonEmpty([addr.city, _joinNonEmpty([addr.state, addr.zip], sep: ' ')], sep: ', '),
      addr.country
    ], sep: ', ');

    return _sectionCard(
      icon: Icons.place_rounded,
      title: 'Address',
      minHeight: kCardMinH,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _labelValue('House No', addr.street1.isNotEmpty ? addr.street1 : 'Not Provided', base),
          _labelValue('Street',   addr.street2.isNotEmpty ? addr.street2 : 'Not Provided', base),
          _labelValue('City',     addr.city.isNotEmpty ? addr.city : 'Not Provided', base),
          _labelValue('State',    addr.state.isNotEmpty ? addr.state : 'Not Provided', base),
          _labelValue('Pincode',  addr.zip.isNotEmpty ? addr.zip : 'Not Provided', base),
          _labelValue('Country',  addr.country.isNotEmpty ? addr.country : 'India', base),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _actionChip(
                context: context,
                icon: Icons.copy_rounded,
                label: 'Copy',
                onTap: () => Clipboard.setData(ClipboardData(text: fullOneLine)),
              ),
              _actionChip(
                context: context,
                icon: Icons.map_rounded,
                label: 'Open in Maps',
                onTap: () {
                  // Hook: integrate url_launcher if needed.
                  // final url = 'https://maps.google.com/?q=${Uri.encodeComponent(fullOneLine)}';
                  // launchUrl(Uri.parse(url));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Map integration hook ready')),
                  );
                },
              ),
              _dateTag(updated),
            ],
          ),
        ],
      ),
    );
  }

  // Emergency (formatted cleanly)
  Widget _emergencyCard(TextStyle base, String updated) {
    final emergencyName = _isMissing(pEmergencyName) ? 'No contact on file' : pEmergencyName;
    final emergencyPhone = _isMissing(pEmergencyPhone) ? 'No phone on file' : pEmergencyPhone;
    
    return _sectionCard(
      icon: Icons.contact_phone_rounded,
      title: 'Emergency Contact',
      minHeight: kCardMinH,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _labelValue('Name', emergencyName, base),
          _labelValue('Phone', emergencyPhone, base),
          const SizedBox(height: 10),
          _dateTag(updated),
        ],
      ),
    );
  }


  // Insurance
  Widget _insuranceCard(TextStyle base, String updated) {
    final insurance = _isMissing(pInsurance) ? 'No insurance on file' : pInsurance;
    final expiry = _isMissing(pInsuranceExpiry) ? 'No expiry date' : pInsuranceExpiry;
    
    return _sectionCard(
      icon: Icons.verified_user_rounded,
      title: 'Insurance',
      minHeight: kCardMinH,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _labelValue('Policy Number', insurance, base),
          _labelValue('Expiry Date', expiry, base),
          const SizedBox(height: 10),
          _dateTag(updated),
        ],
      ),
    );
  }

  // ======= Shared shells / atoms =======

  Widget _labelValue(String label, String value, TextStyle base) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label
          SizedBox(
            width: 110, // slightly wider for alignment
            child: Text(
              label.toUpperCase(), // 🔑 uppercase = professional, subtle
              style: GoogleFonts.inter(
                fontSize: 12,
                letterSpacing: 0.6,
                color: kMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Value
          Expanded(
            child: SelectableText(
              value.isEmpty ? 'Not Provided' : value,
              style: GoogleFonts.inter(
                fontSize: 14.5,
                height: 1.4,
                fontWeight: FontWeight.w700,
                color: kText,
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _actionChip({
    required BuildContext context,
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: kBorder),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: kText),
            const SizedBox(width: 6),
            Text(label,
                style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _dateTag(String date) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: kPrimary.withOpacity(.05),
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        date,
        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: kMuted),
      ),
    );
  }

  Widget _sectionCard({
    required IconData icon,
    required String title,
    required Widget child,
    double minHeight = 0,
  }) {
    return _elevatedCard(
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: minHeight),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [kPrimary.withOpacity(.15), kPrimary.withOpacity(.05)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, size: 18, color: kPrimary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w800,
                        color: kText,
                        fontSize: 14.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // IMPORTANT: no Expanded/Spacer here; safe for ListView
              child,
            ],
          ),
        ),
      ),
    );
  }

  Widget _elevatedCard({required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(kRadius),
        gradient: const LinearGradient(colors: [kCard, kCard]),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(.06), blurRadius: 16, offset: Offset(0, 8)),
        ],
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(kRadius),
          border: Border.all(color: kBorder),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(kRadius),
          child: child,
        ),
      ),
    );
  }

  // ======= Address normalization =======
  _USAddress _normalizeUSAddress(String input) {
    // Light parser for "street, city, state zip, country" patterns.
    String street1 = '', street2 = '', city = '', state = '', zip = '', country = 'India';

    final parts = input.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();

    if (parts.isNotEmpty) street1 = parts[0];
    if (parts.length >= 2) city = parts[1];
    if (parts.length >= 3) {
      final p = parts[2];
      final tokens = p.split(RegExp(r'\s+'));
      if (tokens.length >= 2 && RegExp(r'^\d{5}(-\d{4})?$').hasMatch(tokens.last)) {
        zip = tokens.removeLast();
        state = tokens.join(' ').toUpperCase();
      } else {
        state = p.toUpperCase();
      }
    }
    if (parts.length >= 4) country = parts[3];

    if (country == 'USA' && state.isEmpty && city.contains(' ')) {
      final tokens = city.split(' ');
      if (tokens.length >= 2 && RegExp(r'^\d{5}(-\d{4})?$').hasMatch(tokens.last)) {
        zip = tokens.removeLast();
        state = tokens.removeLast().toUpperCase();
        city = tokens.join(' ');
      }
    }

    return _USAddress(
      street1: street1,
      street2: street2,
      city: city,
      state: state,
      zip: zip,
      country: country,
    );
  }

  String _joinNonEmpty(List<String> items, {String sep = ', '}) =>
      items.where((e) => e.trim().isNotEmpty).join(sep);
}

// Simple address model
class _USAddress {
  final String street1;
  final String street2;
  final String city;
  final String state;
  final String zip;
  final String country;

  const _USAddress({
    required this.street1,
    required this.street2,
    required this.city,
    required this.state,
    required this.zip,
    required this.country,
  });
}

class _PatientProfileTab extends StatefulWidget {
  // -------- Incoming (unchanged props, but not used in this simplified version) --------
  final String patientId,
      name,
      gender,
      dob,
      age,
      phone,
      email,
      address,
      doctorName,
      primaryDiagnosis,
      bmi,
      weight,
      height,
      bp,
      heartRate,
      emergencyContactName,
      emergencyContactPhone;
  final List<String> diagnoses, allergies, chronicConditions;

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

  @override
  State<_PatientProfileTab> createState() => _PatientProfileTabState();
}



class _PatientProfileTabState extends State<_PatientProfileTab> {
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _medicalHistory = [];

  @override
  void initState() {
    super.initState();
    _fetchMedicalHistory();
  }

  Future<void> _fetchMedicalHistory() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      print('📋 [MEDICAL HISTORY] Fetching for patient: ${widget.patientId}');
      
      final history = await AuthService.instance.getMedicalHistory(
        patientId: widget.patientId,
        limit: 100,
        page: 0,
      );

      print('📦 [MEDICAL HISTORY] Received ${history.length} records');

      setState(() {
        _medicalHistory = history;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ [MEDICAL HISTORY] Error: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: primaryColor),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 16),
            Text(
              'Failed to load medical history',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: textSecondaryColor,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchMedicalHistory,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }

    if (_medicalHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No medical history found',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textSecondaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Medical history records will appear here once uploaded',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: textSecondaryColor,
              ),
            ),
          ],
        ),
      );
    }

    return _MedicalHistoryTable(
      history: _medicalHistory,
      patientId: widget.patientId,
      onRefresh: _fetchMedicalHistory,
    );
  }

  TextStyle get _cellStyle => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: const Color(0xFF1F2937),
  );
}

/// Medical History Table Widget
class _MedicalHistoryTable extends StatefulWidget {
  final List<Map<String, dynamic>> history;
  final String patientId;
  final VoidCallback onRefresh;
  
  const _MedicalHistoryTable({
    required this.history,
    required this.patientId,
    required this.onRefresh,
  });

  @override
  State<_MedicalHistoryTable> createState() => _MedicalHistoryTableState();
}

class _MedicalHistoryTableState extends State<_MedicalHistoryTable> {
  String _searchQuery = "";
  String _categoryFilter = "All";
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  String _extractTitle(Map<String, dynamic> record) {
    return record['title']?.toString() ?? 
           record['diagnosis']?.toString() ?? 
           record['condition']?.toString() ?? 
           'Medical Record';
  }

  String _extractDate(Map<String, dynamic> record) {
    try {
      final date = record['reportDate'] ?? record['uploadDate'] ?? record['date'] ?? record['createdAt'];
      if (date == null) return '—';

      final dateTime = DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy').format(dateTime);
    } catch (e) {
      return '—';
    }
  }

  String _extractCategory(Map<String, dynamic> record) {
    return record['category']?.toString() ?? 
           record['type']?.toString() ?? 
           'General';
  }

  String _extractNotes(Map<String, dynamic> record) {
    // Try to extract meaningful notes from various fields
    final extractedData = record['extractedData'];
    if (extractedData is Map) {
      final medHistory = extractedData['medicalHistory']?.toString();
      if (medHistory != null && medHistory.isNotEmpty) {
        return medHistory.length > 100 ? '${medHistory.substring(0, 100)}...' : medHistory;
      }
    }
    
    final notes = record['notes']?.toString() ?? record['description']?.toString();
    if (notes != null && notes.isNotEmpty) {
      return notes.length > 100 ? '${notes.substring(0, 100)}...' : notes;
    }
    
    return '—';
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchQuery.trim().toLowerCase();
    return data.where((r) {
      final category = _extractCategory(r);
      final matchesCategory = _categoryFilter == 'All' || 
                              category.toLowerCase() == _categoryFilter.toLowerCase();
      
      if (q.isEmpty) return matchesCategory;

      final title = _extractTitle(r).toLowerCase();
      final notes = _extractNotes(r).toLowerCase();
      final date = _extractDate(r).toLowerCase();
      
      final matchesQuery = title.contains(q) || 
                          notes.contains(q) || 
                          date.contains(q) ||
                          category.toLowerCase().contains(q);

      return matchesCategory && matchesQuery;
    }).toList();
  }

  void _viewMedicalHistory(Map<String, dynamic> record) {
    final recordId = record['id']?.toString() ?? record['_id']?.toString();
    final pdfId = record['pdfId']?.toString();
    
    if (pdfId != null && pdfId.isNotEmpty) {
      // Show image viewer dialog
      showDialog(
        context: context,
        barrierDismissible: true,
        builder: (context) => _MedicalHistoryImageViewer(
          recordId: recordId ?? '',
          pdfId: pdfId,
          title: _extractTitle(record),
          date: _extractDate(record),
        ),
      );
    } else {
      // Show details dialog with extracted data
      showDialog(
        context: context,
        barrierDismissible: true,
        builder: (context) => _MedicalHistoryDetailsDialog(
          record: record,
          title: _extractTitle(record),
          date: _extractDate(record),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _applyFilters(widget.history);

    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final pageRows = startIndex >= filtered.length
        ? <Map<String, dynamic>>[]
        : filtered.sublist(startIndex, endIndex);

    final rowWidgets = pageRows.map((r) {
      return [
        Text(_extractTitle(r), style: _cellStyle),
        Text(_extractDate(r), style: _cellStyle),
        Text(_extractCategory(r), style: _cellStyle),
        Text(_extractNotes(r), style: _cellStyle),
        r['pdfId'] != null
            ? InkWell(
                onTap: () => _viewMedicalHistory(r),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.picture_as_pdf, size: 16, color: Colors.red),
                    const SizedBox(width: 4),
                    Text('View', style: GoogleFonts.poppins(fontSize: 14, color: Colors.blue)),
                  ],
                ),
              )
            : Text('—', style: GoogleFonts.poppins(fontSize: 14, color: textSecondaryColor)),
      ];
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        return SizedBox(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          child: GenericDataTable(
            title: "Medical History",
            headers: const [
              'Title',
              'Date',
              'Category',
              'Notes',
              'Document'
            ],
            rows: rowWidgets,
            searchQuery: _searchQuery,
            onSearchChanged: (q) => setState(() => _searchQuery = q),
            filters: [
              DropdownButton<String>(
                value: _categoryFilter,
                onChanged: (v) => setState(() {
                  _categoryFilter = v!;
                  _currentPage = 0;
                }),
                items: const [
                  DropdownMenuItem(value: "All", child: Text("All")),
                  DropdownMenuItem(value: "General", child: Text("General")),
                  DropdownMenuItem(value: "Chronic", child: Text("Chronic")),
                  DropdownMenuItem(value: "Acute", child: Text("Acute")),
                ],
              ),
            ],
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: _itemsPerPage,
            onPreviousPage: () =>
                setState(() => _currentPage = (_currentPage - 1).clamp(0, 9999)),
            onNextPage: () => setState(() => _currentPage = _currentPage + 1),
            onView: (i) => _viewMedicalHistory(pageRows[i]),
            onEdit: null,
            onDelete: null,
          ),
        );
      },
    );
  }

  TextStyle get _cellStyle => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: textPrimaryColor,
  );
}

/// Medical History Image Viewer Dialog
class _MedicalHistoryImageViewer extends StatefulWidget {
  final String recordId;
  final String pdfId;
  final String title;
  final String date;

  const _MedicalHistoryImageViewer({
    required this.recordId,
    required this.pdfId,
    required this.title,
    required this.date,
  });

  @override
  State<_MedicalHistoryImageViewer> createState() => _MedicalHistoryImageViewerState();
}

class _MedicalHistoryImageViewerState extends State<_MedicalHistoryImageViewer> {
  bool _isLoading = true;
  String? _error;
  String? _imageUrl;
  String? _token;

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  void _loadImage() async {
    try {
      final token = await AuthService.instance.getToken();
      
      setState(() {
        _isLoading = false;
        _token = token;
        _imageUrl = '${ApiConfig.baseUrl}/api/scanner-enterprise/pdf-public/${widget.pdfId}';
        print('🖼️ [MEDICAL HISTORY VIEWER] Using PDF: $_imageUrl');
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(24),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.9,
          maxHeight: size.height * 0.9,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Icon(Icons.history, color: primaryColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrimaryColor,
                          ),
                        ),
                        Text(
                          widget.date,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: textSecondaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                    color: textPrimaryColor,
                  ),
                ],
              ),
            ),

            // Image Content
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: primaryColor))
                  : _error != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
                              const SizedBox(height: 16),
                              Text(
                                'Failed to load image',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: textPrimaryColor,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: textSecondaryColor,
                                ),
                              ),
                            ],
                          ),
                        )
                      : InteractiveViewer(
                          minScale: 0.5,
                          maxScale: 4.0,
                          child: Center(
                            child: Image.network(
                              _imageUrl!,
                              headers: {
                                if (_token != null) 'x-auth-token': _token!,
                              },
                              loadingBuilder: (context, child, progress) {
                                if (progress == null) return child;
                                return Center(
                                  child: CircularProgressIndicator(
                                    value: progress.expectedTotalBytes != null
                                        ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                        : null,
                                    color: primaryColor,
                                  ),
                                );
                              },
                              errorBuilder: (context, error, stackTrace) {
                                return Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.broken_image, size: 48, color: Colors.grey.shade400),
                                      const SizedBox(height: 16),
                                      Text(
                                        'Image not available',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: textSecondaryColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
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

/// Medical History Details Dialog (for records without PDF)
class _MedicalHistoryDetailsDialog extends StatelessWidget {
  final Map<String, dynamic> record;
  final String title;
  final String date;

  const _MedicalHistoryDetailsDialog({
    required this.record,
    required this.title,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    final extractedData = record['extractedData'] as Map?;
    final medicalHistory = extractedData?['medicalHistory']?.toString() ?? '—';
    final allergies = extractedData?['allergies']?.toString() ?? '—';
    final diagnosis = extractedData?['diagnosis']?.toString() ?? '—';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Icon(Icons.history, color: primaryColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrimaryColor,
                          ),
                        ),
                        Text(
                          date,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: textSecondaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                    color: textPrimaryColor,
                  ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow('Medical History', medicalHistory),
                  const SizedBox(height: 16),
                  _buildDetailRow('Diagnosis', diagnosis),
                  const SizedBox(height: 16),
                  _buildDetailRow('Allergies', allergies),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textSecondaryColor,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: textPrimaryColor,
          ),
        ),
      ],
    );
  }
}


// ---- SAME COLORS AS APPOINTMENTS ----

const Color primaryColor = Color(0xFFEF4444);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _intakeButtonColor = Color(0xFFF87171);


class _MedicationsTab extends StatefulWidget {
  final String patientId;
  const _MedicationsTab({super.key, required this.patientId});

  @override
  State<_MedicationsTab> createState() => _MedicationsTabState();
}

class _MedicationsTabState extends State<_MedicationsTab> {
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _prescriptions = [];

  @override
  void initState() {
    super.initState();
    _fetchPrescriptions();
  }

  Future<void> _fetchPrescriptions() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      print('💊 [PRESCRIPTIONS] Fetching for patient: ${widget.patientId}');
      
      final prescriptions = await AuthService.instance.getPrescriptions(
        patientId: widget.patientId,
        limit: 100,
        page: 0,
      );

      print('📦 [PRESCRIPTIONS] Received ${prescriptions.length} prescriptions');

      setState(() {
        _prescriptions = prescriptions;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ [PRESCRIPTIONS] Error: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: primaryColor),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 16),
            Text(
              'Failed to load prescriptions',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: textSecondaryColor,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchPrescriptions,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }

    if (_prescriptions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.medication_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No prescriptions found',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textSecondaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Prescription records will appear here once uploaded',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: textSecondaryColor,
              ),
            ),
          ],
        ),
      );
    }

    return _MedicationsTable(
      prescriptions: _prescriptions,
      patientId: widget.patientId,
      onRefresh: _fetchPrescriptions,
    );
  }
}

/// Extracted table widget for prescriptions
class _MedicationsTable extends StatefulWidget {
  final List<Map<String, dynamic>> prescriptions;
  final String patientId;
  final VoidCallback onRefresh;
  
  const _MedicationsTable({
    required this.prescriptions,
    required this.patientId,
    required this.onRefresh,
  });

  @override
  State<_MedicationsTable> createState() => _MedicationsTableState();
}

class _MedicationsTableState extends State<_MedicationsTable> {
  // search / filter state
  String _searchQuery = "";
  String _statusFilter = 'All';

  // pagination state
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  String _extractMedicineName(Map<String, dynamic> result) {
    // Backend stores medicine name in 'testName' field (from AI extraction)
    return result['testName']?.toString() ?? 
           result['name']?.toString() ?? 
           result['medicineName']?.toString() ?? 
           result['medicine']?.toString() ?? 
           'Unknown Medicine';
  }

  String _extractValue(Map<String, dynamic> result) {
    // Dosage is stored in 'value' field (from backend mapping)
    return result['value']?.toString() ?? 
           result['dosage']?.toString() ?? 
           result['dose']?.toString() ?? 
           '—';
  }

  String _extractFrequency(Map<String, dynamic> result) {
    // Frequency is stored in 'normalRange' field (from backend mapping)
    return result['normalRange']?.toString() ?? 
           result['frequency']?.toString() ?? 
           result['freq']?.toString() ?? 
           '—';
  }

  String _extractDuration(Map<String, dynamic> result) {
    // Duration is stored in 'flag' field (from backend mapping)
    return result['flag']?.toString() ?? 
           result['duration']?.toString() ?? 
           '—';
  }

  String _extractInstructions(Map<String, dynamic> result) {
    // Instructions are stored in 'notes' field (from backend mapping)
    return result['notes']?.toString() ?? 
           result['instructions']?.toString() ?? 
           '—';
  }

  String _extractDate(Map<String, dynamic> prescription) {
    try {
      // Scanner sends 'prescriptionDate' and 'uploadDate', also check 'date'
      final date = prescription['prescriptionDate'] ?? prescription['uploadDate'] ?? prescription['date'] ?? prescription['createdAt'] ?? prescription['uploadedAt'];
      if (date == null) return '—';

      final dateTime = DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy').format(dateTime);
    } catch (e) {
      return '—';
    }
  }

  String _getStatus(Map<String, dynamic> prescription) {
    // Check if prescription has results (medicines)
    final results = prescription['results'];
    if (results == null || (results is List && results.isEmpty)) {
      return 'Pending';
    }
    
    // Has medicines means completed
    return 'Completed';
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchQuery.trim().toLowerCase();
    return data.where((r) {
      final status = _getStatus(r);
      final matchesStatus = _statusFilter == 'All' || 
                           status.toLowerCase() == _statusFilter.toLowerCase();
      
      if (q.isEmpty) return matchesStatus;
      
      // Search in medicine names, dosages, frequencies from results array
      final results = r['results'];
      if (results is List && results.isNotEmpty) {
        for (var medicine in results) {
          final hay = [
            _extractMedicineName(medicine),
            _extractValue(medicine),
            _extractFrequency(medicine),
            _extractDuration(medicine),
          ].map((e) => e.toLowerCase()).join(' ');
          
          if (hay.contains(q)) {
            return matchesStatus;
          }
        }
      }
      
      return false;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final allPrescriptions = widget.prescriptions;
    final filtered = _applyFilters(allPrescriptions);

    // Pagination
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final pagePrescriptions = startIndex >= filtered.length
        ? <Map<String, dynamic>>[]
        : filtered.sublist(startIndex, endIndex);

    // Convert prescriptions to row widgets - flatten medicines from each prescription
    final List<List<Widget>> rowWidgets = [];
    for (var prescription in pagePrescriptions) {
      final results = prescription['results'];
      final prescriptionDate = _extractDate(prescription);
      final pdfId = prescription['pdfId'];
      
      if (results is List && results.isNotEmpty) {
        // Each medicine gets its own row
        for (var medicine in results) {
          rowWidgets.add([
            Text(_extractMedicineName(medicine), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(_extractValue(medicine), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(_extractFrequency(medicine), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(_extractDuration(medicine), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(_extractInstructions(medicine), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            Text(prescriptionDate, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
            pdfId != null
                ? InkWell(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Opening prescription document')),
                      );
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.picture_as_pdf, size: 16, color: Colors.red),
                        const SizedBox(width: 4),
                        Text('View', style: GoogleFonts.poppins(fontSize: 14, color: Colors.blue)),
                      ],
                    ),
                  )
                : Text('—', style: GoogleFonts.poppins(fontSize: 14, color: textSecondaryColor)),
          ]);
        }
      }
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: SizedBox(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
            child: GenericDataTable(
              title: "Prescriptions",
              headers: const [
                'Medicine',
                'Dosage',
                'Frequency',
                'Duration',
                'Instructions',
                'Date',
                'Document'
              ],
              rows: rowWidgets,
              searchQuery: _searchQuery,
              onSearchChanged: (q) => setState(() => _searchQuery = q),
              filters: [
                DropdownButton<String>(
                  value: _statusFilter,
                  onChanged: (v) => setState(() => _statusFilter = v!),
                  items: const [
                    DropdownMenuItem(value: "All", child: Text("All")),
                    DropdownMenuItem(value: "Completed", child: Text("Completed")),
                    DropdownMenuItem(value: "Pending", child: Text("Pending")),
                  ],
                )
              ],
              currentPage: _currentPage,
              totalItems: filtered.length,
              itemsPerPage: _itemsPerPage,
              onPreviousPage: () => setState(
                    () => _currentPage = (_currentPage - 1).clamp(0, 9999),
              ),
              onNextPage: () => setState(
                    () => _currentPage = _currentPage + 1,
              ),

              onView: (i) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("View prescription details")),
                );
              },
              onEdit: null, // Disable edit for prescriptions
              onDelete: null, // Disable delete for prescriptions
            ),
          ),
        );
      },
    );
  }
}

class _LabsTab extends StatefulWidget {
  final String patientId;
  const _LabsTab({super.key, required this.patientId});

  @override
  State<_LabsTab> createState() => _LabsTabState();
}

class _LabsTabState extends State<_LabsTab> {
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _labReports = [];

  @override
  void initState() {
    super.initState();
    _fetchLabReports();
  }

  Future<void> _fetchLabReports() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      print('🔬 [LAB RESULTS] Fetching for patient: ${widget.patientId}');
      
      final reports = await AuthService.instance.getLabReports(
        patientId: widget.patientId,
        limit: 100,
        page: 0,
      );

      print('📦 [LAB RESULTS] Received ${reports.length} reports');

      setState(() {
        _labReports = reports;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ [LAB RESULTS] Error: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: primaryColor),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 16),
            Text(
              'Failed to load lab reports',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: textSecondaryColor,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchLabReports,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }

    if (_labReports.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.biotech_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No lab reports found',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: textSecondaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Lab results will appear here once tests are uploaded',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: textSecondaryColor,
              ),
            ),
          ],
        ),
      );
    }

    return _LabsTable(
      reports: _labReports,
      patientId: widget.patientId,
      onRefresh: _fetchLabReports,
    );
  }
}

/// Extracted table widget (uses GenericDataTable underneath)
class _LabsTable extends StatefulWidget {
  final List<Map<String, dynamic>> reports;
  final String patientId;
  final VoidCallback onRefresh;
  
  const _LabsTable({
    required this.reports,
    required this.patientId,
    required this.onRefresh,
  });

  @override
  State<_LabsTable> createState() => _LabsTableState();
}

class _LabsTableState extends State<_LabsTable> {
  String _searchQuery = "";
  String _statusFilter = "All";
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  String _extractTestName(Map<String, dynamic> report) {
    // Try multiple fields
    return report['testType']?.toString() ?? 
           report['testName']?.toString() ?? 
           report['name']?.toString() ?? 
           'Lab Test';
  }

  String _extractValue(Map<String, dynamic> report) {
    // Check resultsCount first (from scanner endpoint)
    final resultsCount = report['resultsCount'];
    if (resultsCount != null && resultsCount > 0) {
      return '$resultsCount parameters';
    }
    
    final results = report['results'];
    if (results == null || results == {}) return '—';
    
    if (results is List) {
      // If results is a list
      if ((results as List).isEmpty) return 'Pending';
      return '${results.length} parameters';
    }
    
    if (results is Map) {
      // If results is a map with values
      if (results.isEmpty) return 'Pending';
      
      // Try to extract first meaningful value
      final entries = results.entries.toList();
      if (entries.isNotEmpty) {
        final firstEntry = entries.first;
        return '${firstEntry.key}: ${firstEntry.value}';
      }
    }
    
    return results.toString();
  }

  String _extractDate(Map<String, dynamic> report) {
    try {
      // Try different date fields - scanner sends 'reportDate' and 'uploadDate'
      final date = report['reportDate'] ?? report['uploadDate'] ?? report['date'] ?? report['createdAt'] ?? report['uploadedAt'];
      if (date == null) return '—';
      
      final dateTime = DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy').format(dateTime);
    } catch (e) {
      return '—';
    }
  }

  String _getStatus(Map<String, dynamic> report) {
    // Check resultsCount first (from scanner endpoint)
    final resultsCount = report['resultsCount'];
    if (resultsCount != null && resultsCount > 0) {
      return 'Completed';
    }
    
    final results = report['results'];
    if (results == null || (results is Map && results.isEmpty) || (results is List && results.isEmpty)) {
      return 'Pending';
    }
    
    // Has results means completed
    if (results is List && (results as List).isNotEmpty) {
      return 'Completed';
    }
    if (results is Map && (results as Map).isNotEmpty) {
      return 'Completed';
    }
    
    // Check metadata for status indicators
    final metadata = report['metadata'];
    if (metadata is Map) {
      if (metadata['status'] != null) {
        return metadata['status'].toString();
      }
      
      // Check for abnormal flags
      if (metadata['abnormal'] == true || metadata['flag'] == 'High' || metadata['flag'] == 'Low') {
        return 'Abnormal';
      }
    }
    
    return 'Completed';
  }

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchQuery.trim().toLowerCase();
    return data.where((r) {
      final status = _getStatus(r);
      final matchesStatus = _statusFilter == 'All' || 
                           status.toLowerCase() == _statusFilter.toLowerCase();
      
      if (q.isEmpty) return matchesStatus;

      final testName = _extractTestName(r).toLowerCase();
      final value = _extractValue(r).toLowerCase();
      final date = _extractDate(r).toLowerCase();
      
      final matchesQuery = testName.contains(q) || 
                          value.contains(q) || 
                          date.contains(q);

      return matchesStatus && matchesQuery;
    }).toList();
  }

  void _viewLabReport(Map<String, dynamic> report) {
    // Try both 'id' and '_id' fields
    final reportId = report['id']?.toString() ?? report['_id']?.toString();
    final pdfId = report['pdfId']?.toString(); // Get PDF ID from scanner
    
    if (reportId == null || reportId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Report ID not found')),
      );
      return;
    }

    // Show image viewer dialog
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _LabReportImageViewer(
        reportId: reportId,
        pdfId: pdfId, // Pass PDF ID
        testName: _extractTestName(report),
        date: _extractDate(report),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _applyFilters(widget.reports);

    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final pageRows = startIndex >= filtered.length
        ? <Map<String, dynamic>>[]
        : filtered.sublist(startIndex, endIndex);

    final rowWidgets = pageRows.map((r) {
      final status = _getStatus(r);
      return [
        Text(_extractTestName(r), style: _cellStyle),
        Text(_extractValue(r), style: _cellStyle),
        Text(_extractDate(r), style: _cellStyle),
        _statusChip(status),
      ];
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        return SizedBox(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          child: GenericDataTable(
            title: "Lab Results",
            headers: const [
              'Test Name',
              'Result',
              'Date',
              'Status'
            ],
            rows: rowWidgets,
            searchQuery: _searchQuery,
            onSearchChanged: (q) => setState(() => _searchQuery = q),
            filters: [
              DropdownButton<String>(
                value: _statusFilter,
                onChanged: (v) => setState(() {
                  _statusFilter = v!;
                  _currentPage = 0;
                }),
                items: const [
                  DropdownMenuItem(value: "All", child: Text("All")),
                  DropdownMenuItem(value: "Normal", child: Text("Normal")),
                  DropdownMenuItem(value: "Abnormal", child: Text("Abnormal")),
                  DropdownMenuItem(value: "Pending", child: Text("Pending")),
                ],
              ),
            ],
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: _itemsPerPage,
            onPreviousPage: () =>
                setState(() => _currentPage = (_currentPage - 1).clamp(0, 9999)),
            onNextPage: () => setState(() => _currentPage = _currentPage + 1),
            onView: (i) => _viewLabReport(pageRows[i]),
            onEdit: null, // No edit for lab reports
            onDelete: null, // No delete for lab reports
          ),
        );
      },
    );
  }

  TextStyle get _cellStyle => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: textPrimaryColor,
  );

  Widget _statusChip(String status) {
    Color fg;
    if (status == 'Abnormal') {
      fg = Colors.red;
    } else if (status == 'Pending') {
      fg = Colors.orange;
    } else {
      fg = Colors.green;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: fg.withOpacity(0.12),
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
}

/// Lab Report Image Viewer Dialog
class _LabReportImageViewer extends StatefulWidget {
  final String reportId;
  final String? pdfId; // Add PDF ID field
  final String testName;
  final String date;

  const _LabReportImageViewer({
    required this.reportId,
    this.pdfId,
    required this.testName,
    required this.date,
  });

  @override
  State<_LabReportImageViewer> createState() => _LabReportImageViewerState();
}

class _LabReportImageViewerState extends State<_LabReportImageViewer> {
  bool _isLoading = true;
  String? _error;
  String? _imageUrl;
  String? _token; // Store token

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  void _loadImage() async {
    try {
      // Get the authentication token
      final token = await AuthService.instance.getToken();
      
      setState(() {
        _isLoading = false;
        _token = token; // Store token
        // Use PDF ID if available (scanner storage), otherwise fall back to report ID (old storage)
        if (widget.pdfId != null && widget.pdfId!.isNotEmpty) {
          // Use PUBLIC endpoint (no auth required for Image.network)
          _imageUrl = '${ApiConfig.baseUrl}/api/scanner-enterprise/pdf-public/${widget.pdfId}';
          print('🖼️ [IMAGE VIEWER] Using MongoDB PDF: $_imageUrl');
        } else {
          _imageUrl = AuthService.instance.getLabReportDownloadUrl(widget.reportId);
          print('🖼️ [IMAGE VIEWER] Using old storage: $_imageUrl');
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(24),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.9,
          maxHeight: size.height * 0.9,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Icon(Icons.biotech, color: primaryColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.testName,
                          style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrimaryColor,
                          ),
                        ),
                        Text(
                          widget.date,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: textSecondaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                    color: textPrimaryColor,
                  ),
                ],
              ),
            ),

            // Image Content
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: primaryColor))
                  : _error != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
                              const SizedBox(height: 16),
                              Text(
                                'Failed to load image',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: textPrimaryColor,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: textSecondaryColor,
                                ),
                              ),
                            ],
                          ),
                        )
                      : InteractiveViewer(
                          minScale: 0.5,
                          maxScale: 4.0,
                          child: Center(
                            child: Image.network(
                              _imageUrl!,
                              headers: {
                                if (_token != null) 'x-auth-token': _token!,
                              },
                              loadingBuilder: (context, child, progress) {
                                if (progress == null) return child;
                                return Center(
                                  child: CircularProgressIndicator(
                                    value: progress.expectedTotalBytes != null
                                        ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                        : null,
                                    color: primaryColor,
                                  ),
                                );
                              },
                              errorBuilder: (context, error, stackTrace) {
                                return Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.broken_image, size: 48, color: Colors.grey.shade400),
                                      const SizedBox(height: 16),
                                      Text(
                                        'Image not available',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: textSecondaryColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
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

class _BillingsTab extends StatefulWidget {
  const _BillingsTab({super.key});

  @override
  State<_BillingsTab> createState() => _BillingsTabState();
}

class _BillingsTabState extends State<_BillingsTab> {
  // search/filter/pagination
  String _searchQuery = "";
  String _statusFilter = "All";
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  // sample billing data (min 10)
  final List<Map<String, dynamic>> _billingRows = List.generate(12, (i) {
    return {
      'invoice': 'INV-${1000 + i}',
      'date': '2025-08-${(10 + i).toString().padLeft(2, '0')}',
      'amount': (500 + i * 20).toString(),
      'method': i % 2 == 0 ? 'Credit Card' : 'Cash',
      'due': '2025-09-${(10 + i).toString().padLeft(2, '0')}',
      'status': i % 3 == 0 ? 'Unpaid' : 'Paid',
      'comment': 'Billing for visit ${i + 1}',
    };
  });

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> data) {
    final q = _searchQuery.trim().toLowerCase();
    return data.where((r) {
      final status = (r['status'] ?? '').toString();
      final matchesStatus = _statusFilter == 'All' ||
          status.toLowerCase() == _statusFilter.toLowerCase();

      if (q.isEmpty) return matchesStatus;

      final hay = [
        r['invoice'],
        r['date'],
        r['amount'],
        r['method'],
        r['comment'],
      ].join(' ').toLowerCase();

      return matchesStatus && hay.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _applyFilters(_billingRows);

    // pagination
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, filtered.length);
    final pageRows = startIndex >= filtered.length
        ? <Map<String, dynamic>>[]
        : filtered.sublist(startIndex, endIndex);

    // map billing into temporary headers
    List<List<Widget>> rowWidgets = pageRows.map((r) {
      return [
        Text(r['invoice'] ?? '—'), // Medication → invoice
        Text(r['date'] ?? '—'),    // Dose → date
        Text(r['amount'] ?? '—'),  // Route → amount
        Text(r['method'] ?? '—'),  // Frequency → payment method
        Text(r['due'] ?? '—'),     // Start → due date
        Text(r['comment'] ?? '—'), // End → comment
        _statusChip(r['status']),  // Status → paid/unpaid
      ];
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: SizedBox(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
            child: GenericDataTable(
              title: "Billings",
              headers: const [
                'Medication', // temp → invoice
                'Dose',       // temp → date
                'Route',      // temp → amount
                'Frequency',  // temp → method
                'Start',      // temp → due
                'End',        // temp → comment
                'Status',     // temp → paid/unpaid
              ],
              rows: rowWidgets,
              searchQuery: _searchQuery,
              onSearchChanged: (q) => setState(() => _searchQuery = q),
              filters: [
                DropdownButton<String>(
                  value: _statusFilter,
                  onChanged: (v) => setState(() {
                    _statusFilter = v!;
                    _currentPage = 0;
                  }),
                  items: const [
                    DropdownMenuItem(value: "All", child: Text("All")),
                    DropdownMenuItem(value: "Paid", child: Text("Paid")),
                    DropdownMenuItem(value: "Unpaid", child: Text("Unpaid")),
                  ],
                ),
              ],
              currentPage: _currentPage,
              totalItems: filtered.length,
              itemsPerPage: _itemsPerPage,
              onPreviousPage: () =>
                  setState(() => _currentPage = (_currentPage - 1).clamp(0, 9999)),
              onNextPage: () =>
                  setState(() => _currentPage = _currentPage + 1),

              // ✅ actions
              onView: (i) {
                final r = pageRows[i];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Viewing ${r['invoice']}")),
                );
              },
              onEdit: (i) {
                final r = pageRows[i];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Editing ${r['invoice']}")),
                );
              },
              onDelete: (i) {
                final r = pageRows[i];
                setState(() => _billingRows.remove(r));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Deleted ${r['invoice']}")),
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _statusChip(String? status) {
    final isUnpaid = (status ?? '').toLowerCase() == 'unpaid';
    final fg = isUnpaid ? Colors.red : Colors.green;
    final bg = fg.withOpacity(0.12);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status ?? '—',
        style: GoogleFonts.poppins(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: fg,
        ),
      ),
    );
  }
}

