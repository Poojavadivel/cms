import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../Models/Patients.dart';
import '../Services/Authservices.dart';
import '../Utils/Colors.dart';

/// Common reusable patient profile header card
/// Displays patient info, vitals, and blood group
/// Fetches fresh data from backend when displayed
class PatientProfileHeaderCard extends StatefulWidget {
  final PatientDetails patient;
  final Map<String, dynamic>? latestIntake;
  final VoidCallback? onEdit;

  const PatientProfileHeaderCard({
    super.key,
    required this.patient,
    this.latestIntake,
    this.onEdit,
  });

  @override
  State<PatientProfileHeaderCard> createState() => _PatientProfileHeaderCardState();
}

class _PatientProfileHeaderCardState extends State<PatientProfileHeaderCard> {
  // Constants
  static const double kRadius = 16;
  static const double kAvatar = 128;
  static const Color kTint = Color(0xFFF9FAFB);
  static const Color kTintLine = Color(0xFFF3F4F6);
  
  PatientDetails? _freshPatientData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFreshData();
  }

  @override
  void didUpdateWidget(PatientProfileHeaderCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Refresh data if patient ID changed OR if patient object reference changed
    if (oldWidget.patient.patientId != widget.patient.patientId ||
        oldWidget.patient != widget.patient) {
      print('🔄 [PROFILE CARD] Patient data changed, refreshing...');
      setState(() {
        _isLoading = true;
      });
      _fetchFreshData();
    }
  }

  Future<void> _fetchFreshData() async {
    try {
      print('🔄 [PROFILE CARD] Fetching fresh data for patient: ${widget.patient.patientId}');
      final freshData = await AuthService.instance.fetchProfileCardData(widget.patient.patientId);
      if (mounted) {
        // Debug: Print what we received
        print('📊 [PROFILE CARD] Received data:');
        print('   Name: ${freshData.name}');
        print('   Age: ${freshData.age}');
        print('   Gender: ${freshData.gender}');
        print('   Blood Group: ${freshData.bloodGroup}');
        print('   Height: ${freshData.height}');
        print('   Weight: ${freshData.weight}');
        
        setState(() {
          _freshPatientData = freshData;
          _isLoading = false;
        });
        print('✅ [PROFILE CARD] Fresh data loaded successfully');
      }
    } catch (e) {
      print('⚠️ [PROFILE CARD] Failed to fetch fresh data, using provided patient data: $e');
      if (mounted) {
        setState(() {
          _freshPatientData = widget.patient;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        height: 150,
        decoration: BoxDecoration(
          color: kTint,
          borderRadius: BorderRadius.circular(kRadius),
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final patient = _freshPatientData ?? widget.patient;
    
    return _PatientProfileHeaderCardContent(
      patient: patient,
      latestIntake: widget.latestIntake,
      onEdit: widget.onEdit,
    );
  }
}

class _PatientProfileHeaderCardContent extends StatelessWidget {
  // Constants
  static const double kRadius = 16;
  static const double kAvatar = 128;
  static const Color kTint = Color(0xFFF9FAFB);
  static const Color kTintLine = Color(0xFFF3F4F6);
  
  final PatientDetails patient;
  final Map<String, dynamic>? latestIntake;
  final VoidCallback? onEdit;

  const _PatientProfileHeaderCardContent({
    required this.patient,
    this.latestIntake,
    this.onEdit,
  });

  String _n(num? v, {String? suffix}) => (v == null || v == 0) ? '—' : '${v}${suffix ?? ''}';

  String _ns(dynamic v, {String? suffix}) {
    if (v == null) return '—';
    // Handle both String and Number types
    if (v is num) {
      if (v == 0) return '—';
      return '${v}${suffix ?? ''}';
    }
    final s = v.toString().trim();
    if (s.isEmpty || s == '0') return '—';
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

  String _getAgeDisplay() {
    try {
      final age = patient.age;
      if (age == null || age == 0) {
        return 'Age: —';
      }
      return '$age yrs';
    } catch (_) {
      return 'Age: —';
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
            if (onEdit != null)
              Positioned(
                right: 12,
                top: 12,
                child: _ghostButton(
                  icon: Icons.edit_outlined,
                  onTap: onEdit!,
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
        
        // Patient Code Badge - Prominent Display
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.primary700.withOpacity(0.15), AppColors.primary700.withOpacity(0.05)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary700.withOpacity(0.3), width: 1.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.badge_outlined, size: 16, color: AppColors.primary700),
              const SizedBox(width: 8),
              Text(
                patient.patientCodeOrId,
                style: GoogleFonts.lexend(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary700,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 14),
        
        // Key Patient Info - Blood Group, Gender, Age in Pills
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            _infoPill(Icons.bloodtype, 'Blood: ${_bloodGroup()}', AppColors.kDanger),
            _infoPill(
              isFemale ? Icons.female : Icons.male, 
              _ss(patient.gender), 
              isFemale ? Colors.pink.shade400 : Colors.blue.shade400
            ),
            _infoPill(Icons.calendar_today, _getAgeDisplay(), AppColors.kInfo),
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
              fontWeight: FontWeight.w600,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      );

  /// Info pill badge for prominent display (Blood Group, Gender, Age)
  Widget _infoPill(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: color.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _vitalsGrid() {
    // Priority: 1) Latest intake vitals, 2) Patient fields (which now include vitals from backend)
    final Map<String, dynamic>? intakeVitals = latestIntake?['triage']?['vitals'];

    String heightValue;
    String weightValue;
    String bmiValue;
    String spo2Value;

    if (intakeVitals != null) {
      // Use intake vitals first (most recent from current session)
      heightValue = _ns(intakeVitals['heightCm'], suffix: ' cm');
      weightValue = _ns(intakeVitals['weightKg'], suffix: ' kg');
      bmiValue = _ns(intakeVitals['bmi']);
      spo2Value = _ns(intakeVitals['spo2'], suffix: '%');
    } else {
      // Use patient fields (already extracted from backend vitals or legacy fields)
      heightValue = _ns(patient.height, suffix: ' cm');
      weightValue = _ns(patient.weight, suffix: ' kg');
      bmiValue = _ns(patient.bmi);
      spo2Value = _spo2();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: _kv(Icons.height, 'Height', heightValue)),
            const SizedBox(width: 24),
            Expanded(child: _kv(Icons.monitor_weight_outlined, 'Weight', weightValue)),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _kv(Icons.scale, 'BMI', bmiValue)),
            const SizedBox(width: 24),
            Expanded(child: _kv(Icons.monitor_heart_outlined, 'Oxygen (SpO₂)', spo2Value)),
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
