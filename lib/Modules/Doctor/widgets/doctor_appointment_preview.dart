import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../DashboardPage.dart';

// --- App Theme Colors from HTML ---
const Color primaryColor = Color(0xFFCF1717);
const Color backgroundColor = Color(0xFFF8F9FA);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF333333);
const Color textSecondaryColor = Color(0xFF666666);
const Color red100 = Color(0xFFFEE2E2);
const Color red500 = Color(0xFFEF4444);
const Color red600 = Color(0xFFDC2626);
const Color red800 = Color(0xFF991B1B);

// --- Data Models ---
class PatientDetails {
  final String patientId;
  final String name;
  final int age;
  final String gender;
  final String bloodGroup;
  final String weight;
  final String height;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String phone;
  final String city;
  final String address;
  final String pincode;
  final String insuranceNumber;
  final String expiryDate;
  final String avatarUrl;

  PatientDetails({
    required this.patientId,
    required this.name,
    required this.age,
    required this.gender,
    required this.bloodGroup,
    required this.weight,
    required this.height,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.phone,
    required this.city,
    required this.address,
    required this.pincode,
    required this.insuranceNumber,
    required this.expiryDate,
    required this.avatarUrl,
  });

  factory PatientDetails.fromMap(Map<String, dynamic> map) {
    return PatientDetails(
      patientId: map['patientId'],
      name: map['name'],
      age: map['age'],
      gender: map['gender'],
      bloodGroup: map['bloodGroup'],
      weight: map['weight'],
      height: map['height'],
      emergencyContactName: map['emergencyContactName'],
      emergencyContactPhone: map['emergencyContactPhone'],
      phone: map['phone'],
      city: map['city'],
      address: map['address'],
      pincode: map['pincode'],
      insuranceNumber: map['insuranceNumber'],
      expiryDate: map['expiryDate'],
      avatarUrl: map['avatarUrl'],
    );
  }
}

class CheckupRecord {
  final String doctor;
  final String speciality;
  final String reason;
  final String date;
  final String reportStatus;

  CheckupRecord({
    required this.doctor,
    required this.speciality,
    required this.reason,
    required this.date,
    required this.reportStatus,
  });

  factory CheckupRecord.fromMap(Map<String, dynamic> map) {
    return CheckupRecord(
      doctor: map['doctor'],
      speciality: map['speciality'],
      reason: map['reason'],
      date: map['date'],
      reportStatus: map['reportStatus'],
    );
  }
}

// --- API Data Simulation ---
final Map<String, dynamic> _patientApiData = {
  'patientId': 'PID-66457924',
  'name': 'Kanagaraj Shah',
  'age': 76,
  'gender': 'Male',
  'bloodGroup': 'B+',
  'weight': '68 kgs',
  'height': '168 cms',
  'emergencyContactName': 'Amit Shah (Brother)',
  'emergencyContactPhone': '947384394',
  'phone': '9092215212',
  'city': 'Ramanathapuram',
  'address': '1/1318, Bharathinagar, ramnad',
  'pincode': '490002',
  'insuranceNumber': 'AA234-875490',
  'expiryDate': '16.09.2020-16.09.2026',
  'avatarUrl': 'https://lh3.googleusercontent.com/aida-public/AB6AXuACz4aT0wISH9xwd-s_9yGhuBTVAVzsUh4X9bPP5XoW2D2V5xdy8lrmNFUkZOAzjaw4T9KG1i2TWTHGVEKQ7AndMKZ_HhNJPHdDPgjuGl_qDDIPUBoEM1MOwVi7XlHCHBvhzUuO2CZ6_yytc8sW6m-Ac4W52bOIRBvRltgmmjAY1crJHxVtRTWGXE5b8wJ_CV7QQnH4ByvxtwYqo-3YvjnaSGjPxiIyylMHmPs7CcFUJ0NH9sITENnOm9zhsjzFqeAf4i1ks0AHoxg',
};

final List<Map<String, dynamic>> _checkupApiData = [
  {'doctor': 'Dr. John', 'speciality': 'Oncology', 'reason': 'Chemotherapy', 'date': '05/12/2022', 'reportStatus': 'PDF'},
  {'doctor': 'Dr. Joel', 'speciality': 'Radiation Oncology', 'reason': 'Radiation Therapy', 'date': '05/12/2022', 'reportStatus': 'PDF'},
  {'doctor': 'Dr. Joel', 'speciality': 'Psychiatry', 'reason': 'Counseling', 'date': '05/12/2022', 'reportStatus': 'Pending'},
  {'doctor': 'Dr. John', 'speciality': 'Nutrition', 'reason': 'Dietary Advice', 'date': '05/12/2022', 'reportStatus': 'PDF'},
];


// --- Main Preview Widget ---
class DoctorAppointmentPreview extends StatefulWidget {
  final DashboardAppointment appointment;
  const DoctorAppointmentPreview({super.key, required this.appointment});

  @override
  State<DoctorAppointmentPreview> createState() => _DoctorAppointmentPreviewState();
}

class _DoctorAppointmentPreviewState extends State<DoctorAppointmentPreview> with TickerProviderStateMixin {
  late Future<PatientDetails> _detailsFuture;
  late TabController _tabController;
  List<CheckupRecord> _currentRecords = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _detailsFuture = _fetchPatientDetails();
    _tabController.addListener(_handleTabSelection);
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    super.dispose();
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) {
      // In a real app, you would fetch data for the selected tab here.
      // For this demo, we'll just reload the same data.
      setState(() {
        _currentRecords = _checkupApiData.map((data) => CheckupRecord.fromMap(data)).toList()..shuffle();
      });
    }
  }

  Future<PatientDetails> _fetchPatientDetails() async {
    await Future.delayed(const Duration(seconds: 1));
    final patient = PatientDetails.fromMap(_patientApiData);
    setState(() {
      _currentRecords = _checkupApiData.map((data) => CheckupRecord.fromMap(data)).toList();
    });
    return patient;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1400),
        child: FutureBuilder<PatientDetails>(
          future: _detailsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox(height: 700, child: Center(child: CircularProgressIndicator(color: primaryColor)));
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            } else if (snapshot.hasData) {
              return _buildContent(context, snapshot.data!);
            } else {
              return const Center(child: Text('No details found.'));
            }
          },
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, PatientDetails patient) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _buildHeader(context),
          const SizedBox(height: 24),
          _buildPatientSummary(patient),
          const SizedBox(height: 24),
          _buildTabs(),
          Expanded(
            child: SingleChildScrollView(
              child: _buildCheckupTable(_currentRecords),
            ),
          ),
        ],
      ),
    );
  }

  // --- WIDGET BUILDER METHODS ---
  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          "Glow Skin & Gro Hair",
          style: GoogleFonts.lexend(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: const Color.fromRGBO(213, 84, 55, 1),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.close, color: textSecondaryColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ],
    );
  }

  Widget _buildPatientSummary(PatientDetails patient) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isWide = constraints.maxWidth > 800;

        return isWide
            ? IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 1,
                child: DefaultTextStyle.merge(
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF111827),
                  ),
                  child: _buildPatientInfoCard(patient),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                flex: 2,
                child: DefaultTextStyle.merge(
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF111827),
                  ),
                  child: _buildContactAndInsuranceCard(patient),
                ),
              ),
            ],
          ),
        )
            : Column(
          children: [
            DefaultTextStyle.merge(
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF111827),
              ),
              child: _buildPatientInfoCard(patient),
            ),
            const SizedBox(height: 24),
            DefaultTextStyle.merge(
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF111827),
              ),
              child: _buildContactAndInsuranceCard(patient),
            ),
          ],
        );
      },
    );
  }


  Widget _buildPatientInfoCard(PatientDetails patient) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: red100,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 70,
                height: 90,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  image: DecorationImage(
                    image: NetworkImage(patient.avatarUrl),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Name: ${patient.name}", style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                    Text("Age: ${patient.age} yrs", style: const TextStyle(fontSize: 13)),
                    Text("Gender: ${patient.gender}", style: const TextStyle(fontSize: 13)),
                    Text("Blood Group: ${patient.bloodGroup}", style: const TextStyle(fontSize: 13)),
                    Text("Weight: ${patient.weight}", style: const TextStyle(fontSize: 13)),
                    Text("Height: ${patient.height}", style: const TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text("Emergency contact", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          Text(patient.emergencyContactName, style: const TextStyle(fontSize: 12)),
          Text(patient.emergencyContactPhone, style: const TextStyle(color: Colors.green, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildContactAndInsuranceCard(PatientDetails patient) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Phone: ${patient.phone}"),
                const SizedBox(height: 6),
                Text("City: ${patient.city}"),
                const SizedBox(height: 6),
                Text("Address: ${patient.address}"),
                const SizedBox(height: 6),
                Text("Pin Code: ${patient.pincode}"),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                gradient: const LinearGradient(
                  colors: [Color(0xFF42A5F5), Color(0xFF90CAF9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: Colors.green,
                        child: Icon(Icons.local_hospital, size: 14, color: Colors.white),
                      ),
                      SizedBox(width: 8),
                      Text("Assurance number", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(patient.insuranceNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 12),
                  Text("Expiry Date: ${patient.expiryDate}", style: const TextStyle(color: Colors.white, fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return TabBar(
      controller: _tabController,
      labelStyle: GoogleFonts.roboto(fontWeight: FontWeight.bold, fontSize: 13),
      unselectedLabelStyle: GoogleFonts.roboto(fontSize: 13),
      labelColor: primaryColor,
      unselectedLabelColor: textSecondaryColor,
      indicatorColor: primaryColor,
      isScrollable: true,
      tabs: const [
        Tab(text: 'DOCTOR CHECK UP'),
        Tab(text: 'PATHOLOGY'),
        Tab(text: 'PRESCRIPTION'),
        Tab(text: 'ANALYTICS'),
        Tab(text: 'BILLING'),
      ],
    );
  }



  Widget _buildCheckupTable(List<CheckupRecord> records) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        child: DataTable(
          columnSpacing: 24,
          headingRowColor: MaterialStateProperty.all(const Color(0xFFF5F6FA)),
          headingTextStyle: GoogleFonts.roboto(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
          dataRowHeight: 52,
          border: TableBorder(
            horizontalInside: BorderSide(color: Colors.grey.shade300, width: 0.6),
          ),
          columns: [
            DataColumn(label: Text('Doctor', style: GoogleFonts.roboto())),
            DataColumn(label: Text('Speciality', style: GoogleFonts.roboto())),
            DataColumn(label: Text('Reason', style: GoogleFonts.roboto())),
            DataColumn(label: Text('Date', style: GoogleFonts.roboto())),
            DataColumn(label: Text('Report', style: GoogleFonts.roboto())),
            const DataColumn(label: Text('')),
          ],
          rows: records.map((record) {
            return DataRow(
              cells: [
                DataCell(Text(record.doctor,
                    style: GoogleFonts.roboto(fontSize: 12))),
                DataCell(Text(record.speciality,
                    style: GoogleFonts.roboto(fontSize: 12))),
                DataCell(Text(record.reason,
                    style: GoogleFonts.roboto(fontSize: 12))),
                DataCell(Text(record.date,
                    style: GoogleFonts.roboto(fontSize: 12))),
                DataCell(
                  record.reportStatus == 'PDF'
                      ? ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: red500,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 6),
                      textStyle: GoogleFonts.roboto(
                          fontSize: 11, fontWeight: FontWeight.w500),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                      elevation: 0,
                    ),
                    child: const Text('PDF'),
                  )
                      : Text(record.reportStatus,
                      style: GoogleFonts.roboto(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: primaryColor,
                      )),
                ),
                DataCell(
                  IconButton(
                    icon: const Icon(Icons.expand_more, size: 20),
                    color: red600,
                    splashRadius: 20,
                    onPressed: () {},
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }


}
