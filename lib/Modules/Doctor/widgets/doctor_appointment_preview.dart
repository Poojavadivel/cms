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
  final String emergencyContactNumber;
  final String phone;
  final String city;
  final String address;
  final String pincode;
  final String assuranceNumber;
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
    required this.emergencyContactNumber,
    required this.phone,
    required this.city,
    required this.address,
    required this.pincode,
    required this.assuranceNumber,
    required this.expiryDate,
    required this.avatarUrl,
  });
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
}

// --- Simulated API Data ---
final _patientDetailsData = PatientDetails(
  patientId: 'PID-66457924',
  name: 'Kanagaraj Shah',
  age: 76,
  gender: 'Male',
  bloodGroup: 'B+',
  weight: '68 kgs',
  height: '168 cms',
  emergencyContactName: 'Amit Shah (Brother)',
  emergencyContactNumber: '947384394',
  phone: '9092215212',
  city: 'Ramanathapuram',
  address: '1/1318, Bharathinagar, ramnad',
  pincode: '490002',
  assuranceNumber: 'AA234-875490',
  expiryDate: '16.09.2020-16.09.2026',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACz4aT0wISH9xwd-s_9yGhuBTVAVzsUh4X9bPP5XoW2D2V5xdy8lrmNFUkZOAzjaw4T9KG1i2TWTHGVEKQ7AndMKZ_HhNJPHdDPgjuGl_qDDIPUBoEM1MOwVi7XlHCHBvhzUuO2CZ6_yytc8sW6m-Ac4W52bOIRBvRltgmmjAY1crJHxVtRTWGXE5b8wJ_CV7QQnH4ByvxtwYqo-3YvjnaSGjPxiIyylMHmPs7CcFUJ0NH9sITENnOm9zhsjzFqeAf4i1ks0AHoxg',
);

final List<CheckupRecord> _checkupRecordsData = [
  CheckupRecord(doctor: 'Dr. John', speciality: 'Oncology', reason: 'Chemotherapy', date: '05/12/2022', reportStatus: 'PDF'),
  CheckupRecord(doctor: 'Dr. Joel', speciality: 'Radiation Oncology', reason: 'Radiation Therapy', date: '05/12/2022', reportStatus: 'PDF'),
  CheckupRecord(doctor: 'Dr. Joel', speciality: 'Psychiatry', reason: 'Counseling', date: '05/12/2022', reportStatus: 'Pending'),
  CheckupRecord(doctor: 'Dr. John', speciality: 'Nutrition', reason: 'Dietary Advice', date: '05/12/2022', reportStatus: 'PDF'),
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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _detailsFuture = _fetchPatientDetails();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<PatientDetails> _fetchPatientDetails() async {
    await Future.delayed(const Duration(seconds: 1));
    return _patientDetailsData;
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
          const SizedBox(height: 16),
          Expanded(
            child: SingleChildScrollView(
              child: _buildCheckupTable(_checkupRecordsData),
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
        Row(
          children: [
            const Icon(Icons.local_hospital, color: red600, size: 28),
            const SizedBox(width: 8),
            Text('GLO SKIN & GRO HAIR', style: GoogleFonts.roboto(fontSize: 22, fontWeight: FontWeight.bold, color: red800)),
          ],
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
              Expanded(flex: 3, child: _buildPatientInfoCard(patient)),
              const SizedBox(width: 24),
              Expanded(flex: 4, child: _buildContactAndInsuranceCard(patient)),
            ],
          ),
        )
            : Column(
          children: [
            _buildPatientInfoCard(patient),
            const SizedBox(height: 24),
            _buildContactAndInsuranceCard(patient),
          ],
        );
      },
    );
  }

  Widget _buildPatientInfoCard(PatientDetails patient) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: red100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Column(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundImage: NetworkImage(patient.avatarUrl),
              ),
              const SizedBox(height: 8),
              Text(patient.patientId, style: GoogleFonts.roboto(fontWeight: FontWeight.bold, color: red800, fontSize: 12)),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildDetailText('Name:', patient.name),
                _buildDetailText('Age:', '${patient.age} years'),
                _buildDetailText('Gender:', patient.gender),
                _buildDetailText('Blood Group:', patient.bloodGroup),
                _buildDetailText('Weight:', patient.weight),
                _buildDetailText('Height:', patient.height),
                const SizedBox(height: 8),
                Text('Emergency contact:', style: GoogleFonts.roboto(fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C), fontSize: 12)),
                Text(patient.emergencyContactName, style: GoogleFonts.roboto(color: const Color(0xFFB91C1C), fontSize: 12)),
                Text(patient.emergencyContactNumber, style: GoogleFonts.roboto(color: const Color(0xFFB91C1C), fontSize: 12)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildContactAndInsuranceCard(PatientDetails patient) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildDetailItem('Phone', patient.phone),
              _buildDetailItem('City', patient.city),
              _buildDetailItem('Address', patient.address),
              _buildDetailItem('Pin Code', patient.pincode),
            ],
          ),
        ),
        const SizedBox(width: 24),
        Expanded(
          flex: 3,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: red600,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                  child: const Center(child: Text('H', style: TextStyle(color: red600, fontSize: 20, fontWeight: FontWeight.bold))),
                ),
                const SizedBox(height: 12),
                Text('Assurance number', style: GoogleFonts.roboto(color: Colors.white70, fontSize: 12)),
                Text(patient.assuranceNumber, style: GoogleFonts.roboto(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const Spacer(),
                Text('EXPIRY DATE', style: GoogleFonts.roboto(color: Colors.white70, fontSize: 10, letterSpacing: 1.1)),
                Text(patient.expiryDate, style: GoogleFonts.roboto(color: Colors.white, fontSize: 12)),
              ],
            ),
          ),
        ),
      ],
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
    return SizedBox(
      width: double.infinity,
      child: DataTable(
        columns: [
          DataColumn(label: Text('Doctor', style: GoogleFonts.roboto(fontWeight: FontWeight.bold, fontSize: 12))),
          DataColumn(label: Text('Speciality', style: GoogleFonts.roboto(fontWeight: FontWeight.bold, fontSize: 12))),
          DataColumn(label: Text('Reason', style: GoogleFonts.roboto(fontWeight: FontWeight.bold, fontSize: 12))),
          DataColumn(label: Text('Date', style: GoogleFonts.roboto(fontWeight: FontWeight.bold, fontSize: 12))),
          DataColumn(label: Text('Report', style: GoogleFonts.roboto(fontWeight: FontWeight.bold, fontSize: 12))),
          DataColumn(label: Text('')),
        ],
        rows: records.map((record) => DataRow(cells: [
          DataCell(Text(record.doctor, style: const TextStyle(fontSize: 12))),
          DataCell(Text(record.speciality, style: const TextStyle(fontSize: 12))),
          DataCell(Text(record.reason, style: const TextStyle(fontSize: 12))),
          DataCell(Text(record.date, style: const TextStyle(fontSize: 12))),
          DataCell(
            record.reportStatus == 'PDF'
                ? ElevatedButton(onPressed: () {}, style: ElevatedButton.styleFrom(backgroundColor: red500, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))), child: const Text('PDF', style: TextStyle(fontSize: 10)))
                : Text(record.reportStatus, style: const TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
          DataCell(IconButton(icon: const Icon(Icons.expand_more, color: red600), onPressed: () {})),
        ])).toList(),
      ),
    );
  }

  Widget _buildDetailText(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.0),
      child: RichText(
        text: TextSpan(
          style: GoogleFonts.roboto(color: const Color(0xFFB91C1C), fontSize: 12),
          children: [
            TextSpan(text: label, style: const TextStyle(fontWeight: FontWeight.bold)),
            TextSpan(text: ' $value'),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailItem(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.roboto(color: textSecondaryColor, fontSize: 12)),
          Text(value, style: GoogleFonts.roboto(fontWeight: FontWeight.w500, fontSize: 14, color: textPrimaryColor)),
        ],
      ),
    );
  }
}
