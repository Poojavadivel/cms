// import 'package:flutter/material.dart';
// import 'package:google_fonts/google_fonts.dart';
// import 'dart:math';
// import 'dart:ui'; // For BackdropFilter (glassmorphism effect)
// import 'package:intl/intl.dart';
//
// // --- Centralized Data Models ---
// // These classes MUST be defined in 'lib/models/dashboard_models.dart'
// // and then imported here. This file should NOT contain their definitions.
//
// import '../../Models/dashboardmodels.dart';
// import 'widgets/doctor_appointment_preview.dart';
//
// // --- App Theme Colors (Aligned with HTML's Tailwind variables) ---
// const Color primaryColor = Color(0xFFEF4444); // Tailwind's red-500
// const Color primaryHoverColor = Color(0xFFDC2626); // Tailwind's red-600
// const Color backgroundColor = Color(0xFFF9FAFB); // Tailwind's gray-50
// const Color cardBackgroundColor = Color(0xFFFFFFFF);
// const Color textPrimaryColor = Color(0xFF1F2937); // Tailwind's gray-900
// const Color textSecondaryColor = Color(0xFF6B7280); // Tailwind's gray-500
// const Color borderColor = Color(0xFFE5E7EB); // Tailwind's gray-200
// const Color accentLight = Color(0xFFFEE2E2); // Tailwind's red-100
// const Color accentDark = Color(0xFFB91C1C); // Tailwind's red-700
//
//
// // --- Simulated API Data (Adapted from HTML examples and your previous Flutter data) ---
// // Now with 20 sample appointments
// final _dashboardApiData = DoctorDashboardData(
//   appointments: [
//     DashboardAppointments(
//       patientName: 'Arthur Penhaligon', patientAge: 32, date: 'May 12, 2024', time: '09:30 AM',
//       reason: 'Fever', doctor: 'Dr. Emily Carter', status: 'Completed', gender: 'Male',
//       patientId: 'P00123', service: 'Laser Hair Removal',
//       patientAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAqhOaeMzulKR2rRn6ngVhrBM2PkuRMgmME2p-jHYVvTkyfAWiQunhsaBdCldtD9q82WJ30iYV0ZmMzxUFKOwTXdWQ90gC4RENq5NX1bZgPDpqkNkR1NCM_I8nA2zgv9tSbC5wQzko-B4V1I-et3t5Qix2rpcR2zDdLv1dbJfb9rE8g9sEbRdCe9XnurSNfTWjOvsa7dlwAiau_9Rft6Covx_s8C34Fbl9eX6PmMnA3gkwhgeBYN5V09Y-JNIKhR_5xPvPKZAlLPY',
//     ),
//     DashboardAppointments(
//       patientName: 'Bhavana Mistry', patientAge: 20, date: 'Aug 19, 2024', time: '10:30 AM',
//       reason: 'Head Ache', doctor: 'Dr. John Smith', status: 'Scheduled', gender: 'Female',
//       patientId: 'P00456', service: 'Chemical Peel',
//       patientAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_OaLgwY-2hFFYoQCU6sYIPrvZ1KIGywtW9DYWdG7_RgpLwJEh5zA_2395IjBXA8WipSMkK0AhzInmC7Dp8Ie5_FFcIzVjYG-iS7DH3e_EHTkZ41UWCQXMtm5NY-acJep6_uMSrtCeAz98hfIHlgURwvm5W6Y5WOnITC2VvhrHIbRHWiA9MhoAjOOIBqXJbbwr3CtcRX64OP5Jc5EdmeaAPo5DMulzu2jKylOhdZcw7JLslhhyNCBTDY0PCY3scyaJKFwr2tS46fY',
//     ),
//     DashboardAppointments(
//       patientName: 'Joseph Miller', patientAge: 77, date: 'May 12, 2024', time: '11:30 AM',
//       reason: 'Throat pain', doctor: 'Dr. Emily Carter', status: 'Cancelled', gender: 'Male',
//       patientId: 'P00789', service: 'Acne Treatment',
//       patientAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqzFC8h7TdlhfQ6XNW9AsgMRihj1h4mP0oKyS-VdpTwsoKSw-6s-3mWQk4gYzfktA2psUhhvSHUA6d-Of873OajLQtwZsZHFTmigkB2F-vMYFUunA-QKBQXqmPsj-Fe4cQK-z0JLSevwVwuaRbcjGSXL5pt6VYrpmcrayCET7iYl9z2I0RU9PNw1iRJQ3to-ZjV-T8Sjcr2euIVfKEdn8jhTan08MoF1xTRdDCr_CNJJWBUsSD3g0Is94Ba7IqNS3FfRSP6cDvMnk',
//     ),
//     DashboardAppointments(
//       patientName: 'David Chen', patientAge: 26, date: 'May 12, 2024', time: '11:00 AM',
//       reason: 'Fever', doctor: 'Dr. John Smith', status: 'No Show', gender: 'Male',
//       patientId: 'P01122', service: 'Hair Growth Therapy',
//       patientAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwzdMbvpLPbZVefTU51-8Hljc-WdwxI4Szk7kwi5iILIxouRGCk68sYkj_ojMd-HrtiNcor03_0qA73LwhBXL2baPYXF6UHtxsm110ewuHSLU5abuyXNr006J6DAHYh-zbEtXKCeBlj0qsLBybjQrqwcznz0dd9ddLlCrdyO6bstFACNNBhEFhhViJYqW86cEeCyenwGq8pV2_xfKEdn8jhTan08MoF1xTRdDCr_CNJJWBUsSD3g0Is94Ba7IqNS3FfRSP6cDvMnk',
//     ),
//     DashboardAppointments(
//       patientName: 'Sophia Lee', patientAge: 38, date: 'May 12, 2022', time: '12:30 PM',
//       reason: 'Check-up', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female',
//       patientId: 'P01123', service: 'Regular Checkup',
//     ),
//     DashboardAppointments(
//       patientName: 'Ethan White', patientAge: 52, date: 'May 12, 2022', time: '01:00 PM',
//       reason: 'Follow-up', doctor: 'Dr. Amelia', status: 'Scheduled', gender: 'Male',
//       patientId: 'P01124', service: 'Post-Surgery Follow-up',
//     ),
//     DashboardAppointments(
//       patientName: 'Olivia Green', patientAge: 29, date: 'May 12, 2022', time: '02:00 PM',
//       reason: 'Consultation', doctor: 'Dr. John', status: 'Completed', gender: 'Female',
//       patientId: 'P01125', service: 'Initial Consultation',
//     ),
//     DashboardAppointments(
//       patientName: 'Liam Brown', patientAge: 35, date: 'May 12, 2022', time: '02:30 PM',
//       reason: 'Headache', doctor: 'Dr. Joel', status: 'Scheduled', gender: 'Male',
//       patientId: 'P01126', service: 'Migraine Consultation',
//     ),
//     DashboardAppointments(
//       patientName: 'Ava Black', patientAge: 41, date: 'May 12, 2022', time: '03:00 PM',
//       reason: 'Back Pain', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female',
//       patientId: 'P01127', service: 'Physiotherapy',
//     ),
//     DashboardAppointments(
//       patientName: 'Noah Davis', patientAge: 60, date: 'June 01, 2024', time: '09:00 AM',
//       reason: 'Annual Checkup', doctor: 'Dr. John Smith', status: 'Scheduled', gender: 'Male',
//       patientId: 'P01128', service: 'General Health Check',
//     ),
//     DashboardAppointments(
//       patientName: 'Isabella Garcia', patientAge: 24, date: 'June 01, 2024', time: '09:45 AM',
//       reason: 'Skin Rash', doctor: 'Dr. Emily Carter', status: 'Scheduled', gender: 'Female',
//       patientId: 'P01129', service: 'Dermatology Consult',
//     ),
//     DashboardAppointments(
//       patientName: 'Jackson Rodriguez', patientAge: 45, date: 'June 01, 2024', time: '10:30 AM',
//       reason: 'Knee Pain', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male',
//       patientId: 'P01130', service: 'Orthopedic Review',
//     ),
//     DashboardAppointments(
//       patientName: 'Mia Martinez', patientAge: 30, date: 'June 01, 2024', time: '11:15 AM',
//       reason: 'Pregnancy Check', doctor: 'Dr. Amelia', status: 'Scheduled', gender: 'Female',
//       patientId: 'P01131', service: 'Maternity Checkup',
//     ),
//     DashboardAppointments(
//       patientName: 'Aiden Hernandez', patientAge: 18, date: 'June 02, 2024', time: '01:00 PM',
//       reason: 'Sports Injury', doctor: 'Dr. John', status: 'No Show', gender: 'Male',
//       patientId: 'P01132', service: 'Physiotherapy',
//     ),
//     DashboardAppointments(
//       patientName: 'Charlotte Lopez', patientAge: 70, date: 'June 02, 2024', time: '02:00 PM',
//       reason: 'Blood Pressure', doctor: 'Dr. Emily Carter', status: 'Completed', gender: 'Female',
//       patientId: 'P01133', service: 'Cardiology Consult',
//     ),
//     DashboardAppointments(
//       patientName: 'Lucas Perez', patientAge: 55, date: 'June 02, 2024', time: '03:00 PM',
//       reason: 'Diabetes Review', doctor: 'Dr. John Smith', status: 'Scheduled', gender: 'Male',
//       patientId: 'P01134', service: 'Endocrinology Check',
//     ),
//     DashboardAppointments(
//       patientName: 'Amelia Wilson', patientAge: 28, date: 'June 03, 2024', time: '09:30 AM',
//       reason: 'Acne Issues', doctor: 'Dr. Emily Carter', status: 'Completed', gender: 'Female',
//       patientId: 'P01135', service: 'Dermatology Follow-up',
//     ),
//     DashboardAppointments(
//       patientName: 'Harper Moore', patientAge: 40, date: 'June 03, 2024', time: '10:15 AM',
//       reason: 'Stress Management', doctor: 'Dr. Joel', status: 'Scheduled', gender: 'Female',
//       patientId: 'P01136', service: 'Psychiatry Session',
//     ),
//     DashboardAppointments(
//       patientName: 'Evelyn Taylor', patientAge: 33, date: 'June 03, 2024', time: '11:00 AM',
//       reason: 'Dental Pain', doctor: 'Dr. John', status: 'Cancelled', gender: 'Female',
//       patientId: 'P01137', service: 'Dental Checkup',
//     ),
//     DashboardAppointments(
//       patientName: 'Benjamin King', patientAge: 65, date: 'June 04, 2024', time: '09:00 AM',
//       reason: 'Eye Exam', doctor: 'Dr. Amelia', status: 'Scheduled', gender: 'Male',
//       patientId: 'P01138', service: 'Ophthalmology Consult',
//     ),
//   ],
// );
//
// // --- Main Appointments Screen Widget ---
// class AppointmentsScreen extends StatefulWidget {
//   const AppointmentsScreen({super.key});
//
//   @override
//   State<AppointmentsScreen> createState() => _AppointmentsScreenState();
// }
//
// class _AppointmentsScreenState extends State<AppointmentsScreen> with SingleTickerProviderStateMixin {
//   late Future<DoctorDashboardData> _dashboardFuture;
//   String _searchQuery = '';
//   String? _selectedStatusFilter;
//   String? _selectedProviderFilter;
//   DateTime? _selectedDateFilter;
//   int _currentPage = 0; // Current page for pagination
//   final int _itemsPerPage = 10; // Max items per page
//
//   // Animation controllers for various UI elements
//   late AnimationController _notificationController;
//   late Animation<double> _notificationAnimation;
//   late TextEditingController _dateFilterController;
//
//
//   @override
//   void initState() {
//     super.initState();
//     _dashboardFuture = _fetchDashboardData();
//     _dateFilterController = TextEditingController();
//
//     _notificationController = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 800),
//     )..repeat(reverse: true);
//     _notificationAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
//       CurvedAnimation(parent: _notificationController, curve: Curves.easeInOut),
//     );
//   }
//
//   @override
//   void dispose() {
//     _notificationController.dispose();
//     _dateFilterController.dispose();
//     super.dispose();
//   }
//
//   // Simulate API call
//   Future<DoctorDashboardData> _fetchDashboardData() async {
//     await Future.delayed(const Duration(seconds: 1)); // Simulate network delay
//     return _dashboardApiData;
//   }
//
//   // Changed to call the internal modal widget
//   void _showAppointmentDetails(DashboardAppointments appointment) {
//     showDialog(
//       context: context,
//       builder: (BuildContext context) {
//         return _AppointmentDetailsModal(appointment: appointment); // Using the internal modal
//       },
//     );
//   }
//
//   // Method to toggle checkbox selection
//   void _toggleAppointmentSelection(String patientId, bool? isSelected) {
//     setState(() {
//       final index = _dashboardApiData.appointments.indexWhere((appt) => appt.patientId == patientId);
//       if (index != -1 && isSelected != null) {
//         _dashboardApiData.appointments[index] =
//             _dashboardApiData.appointments[index].copyWith(isSelected: isSelected);
//       }
//     });
//   }
//
//   // Method to navigate to a specific page
//   void _goToPage(int page) {
//     setState(() {
//       _currentPage = page;
//     });
//   }
//
//
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: backgroundColor,
//       body: FutureBuilder<DoctorDashboardData>(
//         future: _dashboardFuture,
//         builder: (context, snapshot) {
//           if (snapshot.connectionState == ConnectionState.waiting) {
//             return const Center(child: CircularProgressIndicator(color: primaryColor));
//           } else if (snapshot.hasError) {
//             return Center(child: Text('Error: ${snapshot.error}'));
//           } else if (snapshot.hasData) {
//             final allFilteredAppointments = snapshot.data!.appointments.where((appt) {
//               final matchesSearch = appt.patientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
//                   appt.reason.toLowerCase().contains(_searchQuery.toLowerCase());
//               final matchesStatus = _selectedStatusFilter == null || _selectedStatusFilter == 'Filter by Status' || appt.status == _selectedStatusFilter;
//               final matchesProvider = _selectedProviderFilter == null || _selectedProviderFilter == 'Filter by Provider' || appt.doctor == _selectedProviderFilter;
//
//               // Parse appt.date for a more robust date comparison
//               DateTime? apptDate;
//               try {
//                 // Attempt to parse date in 'MMM dd, yyyy' or 'MM/dd/yyyy' format
//                 apptDate = DateFormat('MMM dd, yyyy').parse(appt.date);
//               } catch (_) {
//                 try {
//                   apptDate = DateFormat('MM/dd/yyyy').parse(appt.date);
//                 } catch (e) {
//                   // Handle parsing error, e.g., log it or set apptDate to null
//                   print('Error parsing date ${appt.date}: $e');
//                 }
//               }
//
//               final matchesDate = _selectedDateFilter == null ||
//                   (apptDate != null && apptDate.year == _selectedDateFilter!.year &&
//                       apptDate.month == _selectedDateFilter!.month &&
//                       apptDate.day == _selectedDateFilter!.day);
//
//               return matchesSearch && matchesStatus && matchesProvider && matchesDate;
//             }).toList();
//
//             // Apply pagination to the filtered list
//             final startIndex = _currentPage * _itemsPerPage;
//             final endIndex = (_currentPage * _itemsPerPage + _itemsPerPage).clamp(0, allFilteredAppointments.length);
//             final paginatedAppointments = allFilteredAppointments.sublist(startIndex, endIndex);
//
//
//             // The main content column should not scroll, distribute space wisely
//             return Padding(
//               padding: const EdgeInsets.all(24.0),
//               child: Column(
//                 children: [
//                   _buildHeader(context),
//                   const SizedBox(height: 24),
//                   _buildFilterAndSearchCard(context, snapshot.data!),
//                   const SizedBox(height: 24),
//                   _buildActionButtons(context),
//                   const SizedBox(height: 2),
//                   // Expanded ensures the list takes remaining space and allows its own scrolling
//                   Expanded(
//                     child: _buildAppointmentsListAndPagination(context, paginatedAppointments, allFilteredAppointments.length),
//                   ),
//                 ],
//               ),
//             );
//           } else {
//             return const Center(child: Text('Could not load dashboard data.'));
//           }
//         },
//       ),
//     );
//   }
//
//   // --- WIDGET BUILDER METHODS ---
//
//   Widget _buildHeader(BuildContext context) {
//     return  Row(
//       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//       children: [
//         Text(
//           'Appointments',
//           style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C)),
//         ),
//         Row(
//           children: [
//             // const Icon(Icons.notifications, color: Color(0xFFDC2626)),
//             const SizedBox(width: 16),
//             Container(
//               padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
//               decoration: BoxDecoration(
//                 border: Border.all(color: const Color(0xFFFCA5A5)),
//                 borderRadius: BorderRadius.circular(999),
//               ),
//               child: Row(
//                 children: [
//                   const CircleAvatar(
//                     radius: 14,
//                     backgroundImage: AssetImage('assets/sampledoctor.png'),
//                     backgroundColor: Colors.transparent, // optional
//                   ),
//                   const SizedBox(width: 8),
//                   Text(
//                     'Renvord Atkin',
//                     style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF991B1B), fontSize: 14),
//                   ),
//                 ],
//               ),
//             ),
//           ],
//         )
//       ],
//     );
//   }
//
//   Widget _buildFilterAndSearchCard(BuildContext context, DoctorDashboardData data) {
//     final allProviders = data.appointments.map((e) => e.doctor).toSet().toList();
//     allProviders.sort(); // Sort providers alphabetically
//
//     return AnimatedContainer(
//       duration: const Duration(milliseconds: 300),
//       padding: const EdgeInsets.all(24),
//       decoration: BoxDecoration(
//         color: cardBackgroundColor,
//         borderRadius: BorderRadius.circular(16),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.black.withOpacity(0.08),
//             blurRadius: 15,
//             offset: const Offset(0, 8),
//           ),
//         ],
//       ),
//       child: LayoutBuilder(
//         builder: (context, constraints) {
//           // Determine grid layout based on available width
//           int crossAxisCount;
//           if (constraints.maxWidth > 1200) {
//             crossAxisCount = 4;
//           } else if (constraints.maxWidth > 800) {
//             crossAxisCount = 2;
//           } else {
//             crossAxisCount = 1;
//           }
//
//           double itemWidth = (constraints.maxWidth - (crossAxisCount - 1) * 24) / crossAxisCount;
//
//           return Wrap(
//             spacing: 24.0, // Horizontal spacing between items
//             runSpacing: 24.0, // Vertical spacing between lines
//             alignment: WrapAlignment.start,
//             children: [
//               // Search Input
//               SizedBox(
//                 width: crossAxisCount > 1 ? itemWidth : double.infinity,
//                 child: TextField(
//                   onChanged: (value) {
//                     setState(() {
//                       _searchQuery = value;
//                     });
//                   },
//                   style: GoogleFonts.inter(fontSize: 14, color: textPrimaryColor),
//                   decoration: InputDecoration(
//                     hintText: 'Search by name, reason...',
//                     hintStyle: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
//                     prefixIcon: const Icon(Icons.search, size: 20, color: textSecondaryColor),
//                     isDense: true,
//                     contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
//                     border: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: borderColor),
//                     ),
//                     focusedBorder: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: primaryColor, width: 2),
//                     ),
//                     enabledBorder: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: borderColor),
//                     ),
//                   ),
//                 ),
//               ),
//
//               // Filter by Status
//               SizedBox(
//                 width: crossAxisCount > 1 ? itemWidth : double.infinity,
//                 child: DropdownButtonFormField<String>(
//                   value: _selectedStatusFilter ?? 'Filter by Status',
//                   icon: const Icon(Icons.keyboard_arrow_down, color: textSecondaryColor),
//                   style: GoogleFonts.inter(fontSize: 14, color: textPrimaryColor),
//                   decoration: InputDecoration(
//                     isDense: true,
//                     contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
//                     border: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: borderColor),
//                     ),
//                     focusedBorder: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: primaryColor, width: 2),
//                     ),
//                     enabledBorder: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: borderColor),
//                     ),
//                   ),
//                   onChanged: (String? newValue) {
//                     setState(() {
//                       _selectedStatusFilter = newValue;
//                     });
//                   },
//                   items: <String>['Filter by Status', 'Completed', 'Scheduled', 'Cancelled', 'No Show']
//                       .map<DropdownMenuItem<String>>((String value) {
//                     return DropdownMenuItem<String>(
//                       value: value,
//                       child: Text(value),
//                     );
//                   }).toList(),
//                 ),
//               ),
//
//               // Date Input
//               SizedBox(
//                 width: crossAxisCount > 1 ? itemWidth : double.infinity,
//                 child: GestureDetector(
//                   onTap: () async {
//                     DateTime? picked = await showDatePicker(
//                       context: context,
//                       initialDate: _selectedDateFilter ?? DateTime.now(),
//                       firstDate: DateTime(2000),
//                       lastDate: DateTime(2101),
//                       builder: (context, child) {
//                         return Theme(
//                           data: ThemeData.light().copyWith(
//                             colorScheme: const ColorScheme.light(
//                               primary: primaryColor, // Header background color
//                               onPrimary: Colors.white, // Header text color
//                               onSurface: textPrimaryColor, // Body text color
//                             ),
//                             textButtonTheme: TextButtonThemeData(
//                               style: TextButton.styleFrom(foregroundColor: primaryColor),
//                             ),
//                           ),
//                           child: child!,
//                         );
//                       },
//                     );
//                     if (picked != null && picked != _selectedDateFilter) {
//                       setState(() {
//                         _selectedDateFilter = picked;
//                         _dateFilterController.text = DateFormat('MMM dd, yyyy').format(picked); // Consistent date format
//                       });
//                     }
//                   },
//                   child: AbsorbPointer(
//                     child: TextField(
//                       controller: _dateFilterController,
//                       style: GoogleFonts.inter(fontSize: 14, color: textPrimaryColor),
//                       decoration: InputDecoration(
//                         hintText: 'Select Date',
//                         hintStyle: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
//                         prefixIcon: const Icon(Icons.calendar_today, size: 20, color: textSecondaryColor),
//                         isDense: true,
//                         contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
//                         border: OutlineInputBorder(
//                           borderRadius: BorderRadius.circular(10),
//                           borderSide: const BorderSide(color: borderColor),
//                         ),
//                         focusedBorder: OutlineInputBorder(
//                           borderRadius: BorderRadius.circular(10),
//                           borderSide: const BorderSide(color: primaryColor, width: 2),
//                         ),
//                         enabledBorder: OutlineInputBorder(
//                           borderRadius: BorderRadius.circular(10),
//                           borderSide: const BorderSide(color: borderColor),
//                         ),
//                       ),
//                     ),
//                   ),
//                 ),
//               ),
//
//               // Filter by Provider
//               SizedBox(
//                 width: crossAxisCount > 1 ? itemWidth : double.infinity,
//                 child: DropdownButtonFormField<String>(
//                   value: _selectedProviderFilter ?? 'Filter by Provider',
//                   icon: const Icon(Icons.keyboard_arrow_down, color: textSecondaryColor),
//                   style: GoogleFonts.inter(fontSize: 14, color: textPrimaryColor),
//                   decoration: InputDecoration(
//                     isDense: true,
//                     contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
//                     border: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: borderColor),
//                     ),
//                     focusedBorder: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: primaryColor, width: 2),
//                     ),
//                     enabledBorder: OutlineInputBorder(
//                       borderRadius: BorderRadius.circular(10),
//                       borderSide: const BorderSide(color: borderColor),
//                     ),
//                   ),
//                   onChanged: (String? newValue) {
//                     setState(() {
//                       _selectedProviderFilter = newValue;
//                     });
//                   },
//                   items: <String>['Filter by Provider', ...allProviders]
//                       .map<DropdownMenuItem<String>>((String value) {
//                     return DropdownMenuItem<String>(
//                       value: value,
//                       child: Text(value),
//                     );
//                   }).toList(),
//                 ),
//               ),
//             ],
//           );
//         },
//       ),
//     );
//   }
//
//   Widget _buildActionButtons(BuildContext context) {
//     // This section is now empty as batch actions are removed and New Appointment is moved
//     return const SizedBox.shrink(); // Replaced with an empty widget
//   }
//
//   Widget _buildAppointmentsListAndPagination(BuildContext context, List<DashboardAppointments> appointments, int totalFilteredCount) {
//     final totalPages = (totalFilteredCount / _itemsPerPage).ceil();
//     // The startIndex and endIndex for displaying the current page's items
//     final startIndex = _currentPage * _itemsPerPage;
//     final endIndex = (_currentPage * _itemsPerPage + _itemsPerPage).clamp(0, totalFilteredCount);
//
//     return Container(
//       decoration: BoxDecoration(
//         color: cardBackgroundColor,
//         borderRadius: BorderRadius.circular(16),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.black.withOpacity(0.08),
//             blurRadius: 15,
//             offset: const Offset(0, 8),
//           ),
//         ],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Padding(
//             padding: const EdgeInsets.all(24.0),
//             child: Row( // Changed to Row to include New Appointment button
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 Text(
//                   'APPOINTMENTS',
//                   style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C)), // Updated font and color
//                 ),
//                 TweenAnimationBuilder<double>( // New Appointment Button
//                   tween: Tween<double>(begin: 1.0, end: 1.05),
//                   duration: const Duration(milliseconds: 300),
//                   builder: (context, scale, child) {
//                     return Transform.scale(
//                       scale: scale,
//                       child: ElevatedButton.icon(
//                         onPressed: () { /* Handle new appointment */ },
//                         icon: const Icon(Icons.add, size: 18, color: Colors.white),
//                         label: Text(
//                           'New Appointment',
//                           style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
//                         ),
//                         style: ElevatedButton.styleFrom(
//                           backgroundColor: primaryColor,
//                           foregroundColor: Colors.white,
//                           shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
//                           padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
//                           elevation: 8,
//                           shadowColor: primaryColor.withOpacity(0.4),
//                         ),
//                       ),
//                     );
//                   },
//                 ),
//               ],
//             ),
//           ),
//           const Divider(height: 1, color: borderColor),
//           // Expanded to allow the ListView.builder to scroll vertically
//           Expanded(
//             child: ListView.builder(
//               itemCount: appointments.length,
//               itemBuilder: (context, index) {
//                 final appt = appointments[index];
//                 return _AppointmentCard(
//                   appointment: appt,
//                   isEvenRow: index % 2 == 0,
//                   onViewDetails: () => _showAppointmentDetails(appt),
//                   onEdit: () { /* Handle edit */ },
//                   onDelete: () { /* Handle delete */ },
//                   onIntake: () { /* Handle intake */ },
//                   onToggleSelection: (isSelected) => _toggleAppointmentSelection(appt.patientId, isSelected),
//                 );
//               },
//             ),
//           ),
//           const Divider(height: 1, color: borderColor),
//           _buildPagination(context, totalFilteredCount, totalPages),
//         ],
//       ),
//     );
//   }
//
//   Widget _buildPagination(BuildContext context, int totalFilteredCount, int totalPages) {
//     final startItem = (_currentPage * _itemsPerPage) + 1;
//     final endItem = min((_currentPage * _itemsPerPage + _itemsPerPage), totalFilteredCount); // Corrected endItem calculation
//
//     return Padding(
//       padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
//       child: Row(
//         mainAxisAlignment: MainAxisAlignment.spaceBetween,
//         children: [
//           Text(
//             'Showing $startItem to $endItem of $totalFilteredCount results',
//             style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
//           ),
//           Row(
//             children: [
//               IconButton(
//                 icon: const Icon(Icons.chevron_left, color: textSecondaryColor),
//                 onPressed: _currentPage > 0 ? () => _goToPage(_currentPage - 1) : null,
//               ),
//               const SizedBox(width: 8),
//               // Dynamically generate page buttons
//               ...List.generate(totalPages, (index) {
//                 return Padding(
//                   padding: const EdgeInsets.symmetric(horizontal: 4.0),
//                   child: _PaginationButton(
//                     label: (index + 1).toString(),
//                     isActive: _currentPage == index,
//                     onPressed: () => _goToPage(index),
//                   ),
//                 );
//               }),
//               const SizedBox(width: 8),
//               IconButton(
//                 icon: const Icon(Icons.chevron_right, color: textSecondaryColor),
//                 onPressed: _currentPage < totalPages - 1 ? () => _goToPage(_currentPage + 1) : null,
//               ),
//             ],
//           ),
//         ],
//       ),
//     );
//   }
// }
//
// // --- Custom Widgets for Reusability and Specific Styling ---
//
// class _BatchActionButton extends StatelessWidget {
//   final IconData icon;
//   final String label;
//   final VoidCallback onPressed;
//   final Color? color;
//
//   const _BatchActionButton({
//     required this.icon,
//     required this.label,
//     required this.onPressed,
//     this.color,
//   });
//
//   @override
//   Widget build(BuildContext context) {
//     return TextButton.icon(
//       onPressed: onPressed,
//       icon: Icon(icon, size: 20, color: color ?? textSecondaryColor),
//       label: Text(
//         label,
//         style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: color ?? textSecondaryColor),
//       ),
//       style: TextButton.styleFrom(
//         padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
//         alignment: Alignment.centerLeft,
//       ),
//     );
//   }
// }
//
// class _StatusBadge extends StatelessWidget {
//   final String status;
//
//   const _StatusBadge({required this.status});
//
//   Color _getBackgroundColor() {
//     switch (status) {
//       case 'Completed': return Colors.green.shade100;
//       case 'Scheduled': return Colors.blue.shade100;
//       case 'Cancelled': return Colors.red.shade100;
//       case 'No Show': return Colors.yellow.shade100;
//       default: return Colors.grey.shade100;
//     }
//   }
//
//   Color _getTextColor() {
//     switch (status) {
//       case 'Completed': return Colors.green.shade800;
//       case 'Scheduled': return Colors.blue.shade800;
//       case 'Cancelled': return Colors.red.shade800;
//       case 'No Show': return Colors.yellow.shade800;
//       default: return Colors.grey.shade800;
//     }
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
//       decoration: BoxDecoration(
//         color: _getBackgroundColor(),
//         borderRadius: BorderRadius.circular(999),
//         // Subtle glow effect
//         boxShadow: [
//           BoxShadow(
//             color: _getBackgroundColor().withOpacity(0.4),
//             blurRadius: 5,
//             spreadRadius: 1,
//             offset: const Offset(0, 2),
//           ),
//         ],
//       ),
//       child: Text(
//         status,
//         style: GoogleFonts.inter(
//           fontSize: 12,
//           fontWeight: FontWeight.w600,
//           color: _getTextColor(),
//         ),
//         maxLines: 1, // Prevent text from wrapping
//         overflow: TextOverflow.ellipsis, // Add ellipsis if it still overflows
//       ),
//     );
//   }
// }
//
// class _AppointmentCard extends StatefulWidget {
//   final DashboardAppointments appointment;
//   final bool isEvenRow;
//   final VoidCallback onViewDetails;
//   final VoidCallback onEdit;
//   final VoidCallback onDelete;
//   final VoidCallback onIntake;
//   final Function(bool?) onToggleSelection; // Callback for checkbox
//
//   const _AppointmentCard({
//     super.key,
//     required this.appointment,
//     required this.isEvenRow,
//     required this.onViewDetails,
//     required this.onEdit,
//     required this.onDelete,
//     required this.onIntake,
//     required this.onToggleSelection,
//   });
//
//   @override
//   State<_AppointmentCard> createState() => _AppointmentCardState();
// }
//
// class _AppointmentCardState extends State<_AppointmentCard> {
//   bool _isHovering = false;
//
//   @override
//   Widget build(BuildContext context) {
//     return MouseRegion( // For hover effects on web/desktop
//       onEnter: (_) => setState(() => _isHovering = true),
//       onExit: (_) => setState(() => _isHovering = false),
//       child: GestureDetector(
//         onTap: widget.onViewDetails, // Tap anywhere on the card to view details
//         child: AnimatedContainer(
//           duration: const Duration(milliseconds: 200),
//           decoration: BoxDecoration(
//             color: widget.isEvenRow ? cardBackgroundColor : accentLight.withOpacity(0.3), // Alternating row color
//             boxShadow: _isHovering
//                 ? [
//               BoxShadow(
//                 color: primaryColor.withOpacity(0.2),
//                 blurRadius: 10,
//                 spreadRadius: 2,
//                 offset: const Offset(0, 4),
//               ),
//             ]
//                 : [],
//           ),
//           padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
//           child: LayoutBuilder(
//             builder: (context, constraints) {
//               // Adjust layout for smaller screens to avoid horizontal scroll
//               if (constraints.maxWidth < 800) {
//                 return _buildCompactAppointmentCard();
//               } else {
//                 return _buildWideAppointmentCard();
//               }
//             },
//           ),
//         ),
//       ),
//     );
//   }
//
//   // Layout for wider screens (replicates HTML table row more closely)
//   Widget _buildWideAppointmentCard() {
//     return Row(
//       children: [
//         // Checkbox
//         // SizedBox(
//         //   width: 24,
//         //   child: Checkbox(
//         //     value: widget.appointment.isSelected,
//         //     onChanged: widget.onToggleSelection,
//         //     activeColor: primaryColor,
//         //   ),
//         // ),
//         // const SizedBox(width: 16),
//
//         // Patient Info
//         Expanded(
//           flex: 3,
//           child: Row(
//             children: [
//               CircleAvatar(
//                 radius: 20,
//                 backgroundImage: AssetImage(widget.appointment.gender == 'Male' ? 'assets/boyicon.png' : 'assets/girlicon.png'),
//                 backgroundColor: Colors.transparent,
//               ),
//               const SizedBox(width: 12),
//               Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Text(
//                     widget.appointment.patientName,
//                     style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15, color: textPrimaryColor),
//                   ),
//                   Text(
//                     'ID: ${widget.appointment.patientId}',
//                     style: GoogleFonts.inter(fontSize: 12, color: textSecondaryColor),
//                   ),
//                 ],
//               ),
//             ],
//           ),
//         ),
//
//         // Provider
//         Expanded(
//           flex: 2,
//           child: Text(
//             widget.appointment.doctor,
//             style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
//             overflow: TextOverflow.ellipsis,
//           ),
//         ),
//
//         // Date & Time
//         Expanded(
//           flex: 2,
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Text(
//                 widget.appointment.date,
//                 style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
//                 maxLines: 1,
//                 overflow: TextOverflow.ellipsis,
//               ),
//               Text(
//                 widget.appointment.time,
//                 style: GoogleFonts.inter(fontSize: 12, color: textSecondaryColor),
//                 maxLines: 1,
//                 overflow: TextOverflow.ellipsis,
//               ),
//             ],
//           ),
//         ),
//
//         // Service
//         Expanded(
//           flex: 2,
//           child: Text(
//             widget.appointment.service,
//             style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor),
//             overflow: TextOverflow.ellipsis,
//           ),
//         ),
//
//         // Status
//         Expanded(
//           flex: 12 ~/ 5, // Increased flex to give more space, e.g., 2.4
//           child: Align(
//             alignment: Alignment.center,
//             child: _StatusBadge(status: widget.appointment.status),
//           ),
//         ),
//
//         // Actions
//         Expanded(
//           flex: 2,
//           child: Row(
//             mainAxisAlignment: MainAxisAlignment.end,
//             children: [
//               _ActionButton(
//                 icon: Icons.remove_red_eye_outlined,
//                 tooltip: 'View Details',
//                 onPressed: widget.onViewDetails,
//               ),
//               _ActionButton(
//                 icon: Icons.edit,
//                 tooltip: 'Edit',
//                 onPressed: widget.onEdit,
//               ),
//               _ActionButton(
//                 icon: Icons.delete,
//                 tooltip: 'Delete',
//                 onPressed: widget.onDelete,
//                 color: primaryColor, // Red for delete icon
//               ),
//             ],
//           ),
//         ),
//       ],
//     );
//   }
//
//   // Layout for compact screens (e.g., mobile)
//   Widget _buildCompactAppointmentCard() {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Row(
//           mainAxisAlignment: MainAxisAlignment.spaceBetween,
//           children: [
//             Row(
//               children: [
//                 Checkbox(
//                   value: widget.appointment.isSelected,
//                   onChanged: widget.onToggleSelection,
//                   activeColor: primaryColor,
//                 ),
//                 CircleAvatar(
//                   radius: 20,
//                   backgroundImage: AssetImage(widget.appointment.gender == 'Male' ? 'assets/boyicon.png' : 'assets/girlicon.png'),
//                   backgroundColor: Colors.transparent,
//                 ),
//                 const SizedBox(width: 12),
//                 Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     Text(
//                       widget.appointment.patientName,
//                       style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16, color: textPrimaryColor),
//                     ),
//                     Text(
//                       'ID: ${widget.appointment.patientId}',
//                       style: GoogleFonts.inter(fontSize: 12, color: textSecondaryColor),
//                     ),
//                   ],
//                 ),
//               ],
//             ),
//             _StatusBadge(status: widget.appointment.status),
//           ],
//         ),
//         const SizedBox(height: 12),
//         Padding(
//           padding: const EdgeInsets.only(left: 16.0), // Align with patient info
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Text('Provider: ${widget.appointment.doctor}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor)),
//               Text('Service: ${widget.appointment.service}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor)),
//               Row(
//                 children: [
//                   Text('Date: ${widget.appointment.date}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor)),
//                   const SizedBox(width: 16),
//                   Text('Time: ${widget.appointment.time}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor)),
//                 ],
//               ),
//             ],
//           ),
//         ),
//         const SizedBox(height: 12),
//         Row(
//           mainAxisAlignment: MainAxisAlignment.end,
//           children: [
//             ElevatedButton(
//               onPressed: widget.onIntake,
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: const Color(0xFFF87171), // Red-400 from your previous Flutter code
//                 foregroundColor: Colors.white,
//                 shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
//                 padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
//                 minimumSize: const Size(0, 32),
//                 elevation: 4,
//               ),
//               child: Text('Intake', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
//             ),
//             const SizedBox(width: 8),
//             _ActionButton(icon: Icons.remove_red_eye_outlined, tooltip: 'View Details', onPressed: widget.onViewDetails),
//             _ActionButton(icon: Icons.edit, tooltip: 'Edit', onPressed: widget.onEdit),
//             _ActionButton(icon: Icons.delete, tooltip: 'Delete', onPressed: widget.onDelete, color: primaryColor),
//           ],
//         ),
//       ],
//     );
//   }
// }
//
// class _ActionButton extends StatelessWidget {
//   final IconData icon;
//   final String tooltip;
//   final VoidCallback onPressed;
//   final Color? color;
//
//   const _ActionButton({
//     required this.icon,
//     required this.tooltip,
//     required this.onPressed,
//     this.color,
//   });
//
//   @override
//   Widget build(BuildContext context) {
//     return IconButton(
//       tooltip: tooltip,
//       icon: Icon(icon, size: 22, color: color ?? textSecondaryColor),
//       onPressed: onPressed,
//       visualDensity: VisualDensity.compact,
//       splashRadius: 24,
//       hoverColor: color?.withOpacity(0.1) ?? textSecondaryColor.withOpacity(0.1),
//     );
//   }
// }
//
// class _PaginationButton extends StatelessWidget {
//   final String label;
//   final bool isActive;
//   final VoidCallback onPressed;
//
//   const _PaginationButton({
//     required this.label,
//     required this.isActive,
//     required this.onPressed,
//   });
//
//   @override
//   Widget build(BuildContext context) {
//     return AnimatedContainer(
//       duration: const Duration(milliseconds: 200),
//       decoration: BoxDecoration(
//         color: isActive ? primaryColor : Colors.transparent,
//         borderRadius: BorderRadius.circular(8),
//       ),
//       child: TextButton(
//         onPressed: onPressed,
//         style: TextButton.styleFrom(
//           foregroundColor: isActive ? Colors.white : textSecondaryColor,
//           padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
//           minimumSize: const Size(40, 40),
//         ),
//         child: Text(
//           label,
//           style: GoogleFonts.inter(
//             fontSize: 14,
//             fontWeight: FontWeight.w500,
//             color: isActive ? Colors.white : textSecondaryColor,
//           ),
//         ),
//       ),
//     );
//   }
// }
//
// /// A custom modal dialog to display detailed information about an appointment.
// /// This replaces the external DoctorAppointmentPreview widget.
// class _AppointmentDetailsModal extends StatefulWidget { // Changed to StatefulWidget
//   final DashboardAppointments appointment;
//
//   const _AppointmentDetailsModal({
//     super.key, // Added super.key
//     required this.appointment,
//   });
//
//   @override
//   State<_AppointmentDetailsModal> createState() => _AppointmentDetailsModalState();
// }
//
// class _AppointmentDetailsModalState extends State<_AppointmentDetailsModal> with TickerProviderStateMixin {
//   late Future<PatientDetails> _detailsFuture;
//   late TabController _tabController;
//   List<CheckupRecord> _currentRecords = [];
//
//   // --- API Data Simulation for PatientDetails and CheckupRecords ---
//   // These should ideally be moved to a centralized data service or models file
//   final Map<String, dynamic> _patientApiData = {
//     'patientId': 'PID-66457924',
//     'name': 'Kanagaraj Shah',
//     'age': 76,
//     'gender': 'Male',
//     'bloodGroup': 'B+',
//     'weight': '68 kgs',
//     'height': '168 cms',
//     'emergencyContactName': 'Amit Shah (Brother)',
//     'emergencyContactPhone': '947384394',
//     'phone': '9092215212',
//     'city': 'Ramanathapuram',
//     'address': '1/1318, Bharathinagar, ramnad',
//     'pincode': '490002',
//     'insuranceNumber': 'AA234-875490',
//     'expiryDate': '16.09.2020-16.09.2026',
//     'avatarUrl': 'https://lh3.googleusercontent.com/aida-public/AB6AXuACz4aT0wISH9xwd-s_9yGhuBTVAVzsUh4X9bPP5XoW2D2V5xdy8lrmNFUkZOAzjaw4T9KG1i2TWTHGVEKQ7AndMKZ_HhNJPHdDPgjuGl_qDDIPUBoEM1MOwVi7XlHCHBvhzUuO2CZ6_yytc8sW6m-Ac4W52bOIRBvRltgmmjAY1crJHxVtRTWGXE5b8wJ_CV7QQnH4ByvxtwYqo-3YvjnaSGjPxiIyylMHmPs7CcFUJ0NH9sITENnOm9zhsjzFqeAf4i1ks0AHoxg',
//   };
//
//   final List<Map<String, dynamic>> _checkupApiData = [
//     {'doctor': 'Dr. John', 'speciality': 'Oncology', 'reason': 'Chemotherapy', 'date': '05/12/2022', 'reportStatus': 'PDF'},
//     {'doctor': 'Dr. Joel', 'speciality': 'Radiation Oncology', 'reason': 'Radiation Therapy', 'date': '05/12/2022', 'reportStatus': 'PDF'},
//     {'doctor': 'Dr. Joel', 'speciality': 'Psychiatry', 'reason': 'Counseling', 'date': '05/12/2022', 'reportStatus': 'Pending'},
//     {'doctor': 'Dr. John', 'speciality': 'Nutrition', 'reason': 'Dietary Advice', 'date': '05/12/2022', 'reportStatus': 'PDF'},
//   ];
//
//   @override
//   void initState() {
//     super.initState();
//     _tabController = TabController(length: 5, vsync: this);
//     _detailsFuture = _fetchPatientDetails();
//     _tabController.addListener(_handleTabSelection);
//   }
//
//   @override
//   void dispose() {
//     _tabController.removeListener(_handleTabSelection);
//     _tabController.dispose();
//     super.dispose();
//   }
//
//   void _handleTabSelection() {
//     if (_tabController.indexIsChanging) {
//       // In a real app, you would fetch data for the selected tab here.
//       // For this demo, we'll just reload the same data.
//       setState(() {
//         _currentRecords = _checkupApiData.map((data) => CheckupRecord.fromMap(data)).toList()..shuffle();
//       });
//     }
//   }
//
//   Future<PatientDetails> _fetchPatientDetails() async {
//     await Future.delayed(const Duration(seconds: 1));
//     final patient = PatientDetails.fromMap(_patientApiData);
//     setState(() {
//       _currentRecords = _checkupApiData.map((data) => CheckupRecord.fromMap(data)).toList();
//     });
//     return patient;
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Dialog(
//       insetPadding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
//       shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
//       child: ConstrainedBox(
//         constraints: const BoxConstraints(maxWidth: 1400),
//         child: FutureBuilder<PatientDetails>(
//           future: _detailsFuture,
//           builder: (context, snapshot) {
//             if (snapshot.connectionState == ConnectionState.waiting) {
//               return const SizedBox(height: 700, child: Center(child: CircularProgressIndicator(color: primaryColor)));
//             } else if (snapshot.hasError) {
//               return Center(child: Text('Error: ${snapshot.error}'));
//             } else if (snapshot.hasData) {
//               return _buildContent(context, snapshot.data!);
//             } else {
//               return const Center(child: Text('No details found.'));
//             }
//           },
//         ),
//       ),
//     );
//   }
//
//   Widget _buildContent(BuildContext context, PatientDetails patient) {
//     return Container(
//       padding: const EdgeInsets.all(24),
//       decoration: BoxDecoration(
//         color: cardBackgroundColor,
//         borderRadius: BorderRadius.circular(12),
//       ),
//       child: Column(
//         children: [
//           _buildModalHeader(context), // Changed to _buildModalHeader
//           const SizedBox(height: 24),
//           _buildPatientSummary(patient),
//           const SizedBox(height: 24),
//           _buildTabs(),
//           Expanded(
//             child: SingleChildScrollView(
//               child: _buildCheckupTable(_currentRecords),
//             ),
//           ),
//         ],
//       ),
//     );
//   }
//
//   // --- WIDGET BUILDER METHODS FOR MODAL ---
//   Widget _buildModalHeader(BuildContext context) { // Renamed from _buildHeader to avoid conflict
//     return Row(
//       mainAxisAlignment: MainAxisAlignment.spaceBetween,
//       children: [
//         Text(
//           "Glow Skin & Gro Hair",
//           style: GoogleFonts.urbanist( // Using Urbanist for modal title
//             fontSize: 22,
//             fontWeight: FontWeight.w700,
//             color: textPrimaryColor, // Consistent with app's textPrimaryColor
//           ),
//         ),
//         IconButton(
//           icon: const Icon(Icons.close, color: textSecondaryColor),
//           onPressed: () => Navigator.of(context).pop(),
//         ),
//       ],
//     );
//   }
//
//   Widget _buildPatientSummary(PatientDetails patient) {
//     return LayoutBuilder(
//       builder: (context, constraints) {
//         bool isWide = constraints.maxWidth > 800;
//
//         return isWide
//             ? IntrinsicHeight(
//           child: Row(
//             crossAxisAlignment: CrossAxisAlignment.stretch,
//             children: [
//               Expanded(
//                 flex: 1,
//                 child: DefaultTextStyle.merge(
//                   style: GoogleFonts.inter( // Consistent with app's Inter font
//                     fontSize: 14,
//                     fontWeight: FontWeight.w500,
//                     color: textPrimaryColor, // Consistent with app's textPrimaryColor
//                   ),
//                   child: _buildPatientInfoCard(patient),
//                 ),
//               ),
//               const SizedBox(width: 24),
//               Expanded(
//                 flex: 2,
//                 child: DefaultTextStyle.merge(
//                   style: GoogleFonts.inter( // Consistent with app's Inter font
//                     fontSize: 14,
//                     fontWeight: FontWeight.w500,
//                     color: textPrimaryColor, // Consistent with app's textPrimaryColor
//                   ),
//                   child: _buildContactAndInsuranceCard(patient),
//                 ),
//               ),
//             ],
//           ),
//         )
//             : Column(
//           children: [
//             DefaultTextStyle.merge(
//               style: GoogleFonts.inter( // Consistent with app's Inter font
//                 fontSize: 14,
//                 fontWeight: FontWeight.w500,
//                 color: textPrimaryColor, // Consistent with app's textPrimaryColor
//               ),
//               child: _buildPatientInfoCard(patient),
//             ),
//             const SizedBox(height: 24),
//             DefaultTextStyle.merge(
//               style: GoogleFonts.inter( // Consistent with app's Inter font
//                 fontSize: 14,
//                 fontWeight: FontWeight.w500,
//                 color: textPrimaryColor, // Consistent with app's textPrimaryColor
//               ),
//               child: _buildContactAndInsuranceCard(patient),
//             ),
//           ],
//         );
//       },
//     );
//   }
//
//
//   Widget _buildPatientInfoCard(PatientDetails patient) {
//     return Container(
//       padding: const EdgeInsets.all(16),
//       decoration: BoxDecoration(
//         color: accentLight, // Consistent with app's accentLight
//         borderRadius: BorderRadius.circular(8),
//         boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, 4))],
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Container(
//                 width: 70,
//                 height: 90,
//                 decoration: BoxDecoration(
//                   color: Colors.grey.shade300,
//                   image: DecorationImage(
//                     image: NetworkImage(patient.avatarUrl),
//                     fit: BoxFit.cover,
//                   ),
//                 ),
//               ),
//               const SizedBox(width: 12),
//               Expanded(
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     Text("Name: ${patient.name}", style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: textPrimaryColor)),
//                     Text("Age: ${patient.age} yrs", style: GoogleFonts.inter(fontSize: 13, color: textPrimaryColor)),
//                     Text("Gender: ${patient.gender}", style: GoogleFonts.inter(fontSize: 13, color: textPrimaryColor)),
//                     Text("Blood Group: ${patient.bloodGroup}", style: GoogleFonts.inter(fontSize: 13, color: textPrimaryColor)),
//                     Text("Weight: ${patient.weight}", style: GoogleFonts.inter(fontSize: 13, color: textPrimaryColor)),
//                     Text("Height: ${patient.height}", style: GoogleFonts.inter(fontSize: 13, color: textPrimaryColor)),
//                   ],
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 12),
//           Text("Emergency contact", style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: textPrimaryColor)),
//           Text(patient.emergencyContactName, style: GoogleFonts.inter(fontSize: 12, color: textPrimaryColor)),
//           Text(patient.emergencyContactPhone, style: GoogleFonts.inter(color: Colors.green, fontSize: 12)),
//         ],
//       ),
//     );
//   }
//
//   Widget _buildContactAndInsuranceCard(PatientDetails patient) {
//     return Container(
//       padding: const EdgeInsets.all(16),
//       decoration: BoxDecoration(
//         borderRadius: BorderRadius.circular(8),
//         color: cardBackgroundColor, // Consistent with app's cardBackgroundColor
//         boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, 4))],
//       ),
//       child: Row(
//         children: [
//           Expanded(
//             flex: 2,
//             child: Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 Text("Phone: ${patient.phone}", style: GoogleFonts.inter(color: textPrimaryColor)),
//                 const SizedBox(height: 6),
//                 Text("City: ${patient.city}", style: GoogleFonts.inter(color: textPrimaryColor)),
//                 const SizedBox(height: 6),
//                 Text("Address: ${patient.address}", style: GoogleFonts.inter(color: textPrimaryColor)),
//                 const SizedBox(height: 6),
//                 Text("Pin Code: ${patient.pincode}", style: GoogleFonts.inter(color: textPrimaryColor)),
//               ],
//             ),
//           ),
//           const SizedBox(width: 16),
//           Expanded(
//             flex: 1,
//             child: Container(
//               padding: const EdgeInsets.all(16),
//               decoration: BoxDecoration(
//                 borderRadius: BorderRadius.circular(8),
//                 gradient: const LinearGradient(
//                   colors: [Color(0xFF42A5F5), Color(0xFF90CAF9)], // Keep original gradient for visual distinction
//                   begin: Alignment.topLeft,
//                   end: Alignment.bottomRight,
//                 ),
//               ),
//               child: Column(
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   Row(
//                     children: [
//                       const CircleAvatar(
//                         radius: 12,
//                         backgroundColor: Colors.green,
//                         child: Icon(Icons.local_hospital, size: 14, color: Colors.white),
//                       ),
//                       const SizedBox(width: 8),
//                       Text("Assurance number", style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)), // Consistent font
//                     ],
//                   ),
//                   const SizedBox(height: 8),
//                   Text(patient.insuranceNumber, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)), // Consistent font
//                   const SizedBox(height: 12),
//                   Text("Expiry Date: ${patient.expiryDate}", style: GoogleFonts.inter(color: Colors.white, fontSize: 12)), // Consistent font
//                 ],
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }
//
//   Widget _buildTabs() {
//     return TabBar(
//       controller: _tabController,
//       labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13), // Changed to Inter
//       unselectedLabelStyle: GoogleFonts.inter(fontSize: 13), // Changed to Inter
//       labelColor: primaryColor,
//       unselectedLabelColor: textSecondaryColor,
//       indicatorColor: primaryColor,
//       isScrollable: true,
//       tabs: const [
//         Tab(text: 'DOCTOR CHECK UP'),
//         Tab(text: 'PATHOLOGY'),
//         Tab(text: 'PRESCRIPTION'),
//         Tab(text: 'ANALYTICS'),
//         Tab(text: 'BILLING'),
//       ],
//     );
//   }
//
//
//   Widget _buildCheckupTable(List<CheckupRecord> records) {
//     return Container(
//       margin: const EdgeInsets.symmetric(vertical: 12),
//       padding: const EdgeInsets.all(12),
//       decoration: BoxDecoration(
//         color: cardBackgroundColor, // Consistent with app's cardBackgroundColor
//         borderRadius: BorderRadius.circular(12),
//         boxShadow: [
//           BoxShadow(
//             color: Colors.black.withOpacity(0.05),
//             blurRadius: 6,
//             offset: const Offset(0, 3),
//           ),
//         ],
//       ),
//       child: SizedBox(
//         width: double.infinity,
//         child: DataTable(
//           columnSpacing: 24,
//           headingRowColor: MaterialStateProperty.all(const Color(0xFFF5F6FA)), // Consistent with a light background
//           headingTextStyle: GoogleFonts.inter( // Changed to Inter
//             fontSize: 13,
//             fontWeight: FontWeight.w600,
//             color: textPrimaryColor, // Consistent with app's textPrimaryColor
//           ),
//           dataRowHeight: 52,
//           border: TableBorder(
//             horizontalInside: BorderSide(color: borderColor, width: 0.6), // Consistent with app's borderColor
//           ),
//           columns: [
//             DataColumn(label: Text('Doctor', style: GoogleFonts.inter())), // Changed to Inter
//             DataColumn(label: Text('Speciality', style: GoogleFonts.inter())), // Changed to Inter
//             DataColumn(label: Text('Reason', style: GoogleFonts.inter())), // Changed to Inter
//             DataColumn(label: Text('Date', style: GoogleFonts.inter())), // Changed to Inter
//             DataColumn(label: Text('Report', style: GoogleFonts.inter())), // Changed to Inter
//             const DataColumn(label: Text('')),
//           ],
//           rows: records.map((record) {
//             return DataRow(
//               cells: [
//                 DataCell(Text(record.doctor,
//                     style: GoogleFonts.inter(fontSize: 12, color: textPrimaryColor))), // Consistent font and color
//                 DataCell(Text(record.speciality,
//                     style: GoogleFonts.inter(fontSize: 12, color: textPrimaryColor))), // Consistent font and color
//                 DataCell(Text(record.reason,
//                     style: GoogleFonts.inter(fontSize: 12, color: textPrimaryColor))), // Consistent font and color
//                 DataCell(Text(record.date,
//                     style: GoogleFonts.inter(fontSize: 12, color: textPrimaryColor))), // Consistent font and color
//                 DataCell(
//                   record.reportStatus == 'PDF'
//                       ? ElevatedButton(
//                     onPressed: () {},
//                     style: ElevatedButton.styleFrom(
//                       backgroundColor: primaryColor, // Consistent with app's primaryColor
//                       foregroundColor: Colors.white,
//                       padding: const EdgeInsets.symmetric(
//                           horizontal: 16, vertical: 6),
//                       textStyle: GoogleFonts.inter( // Changed to Inter
//                           fontSize: 11, fontWeight: FontWeight.w500),
//                       shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(18),
//                       ),
//                       elevation: 0,
//                     ),
//                     child: const Text('PDF'),
//                   )
//                       : Text(record.reportStatus,
//                       style: GoogleFonts.inter( // Changed to Inter
//                         fontSize: 12,
//                         fontWeight: FontWeight.w600,
//                         color: primaryColor, // Consistent with app's primaryColor
//                       )),
//                 ),
//                 DataCell(
//                   IconButton(
//                     icon: const Icon(Icons.expand_more, size: 20),
//                     color: primaryHoverColor, // Consistent with app's primaryHoverColor
//                     splashRadius: 20,
//                     onPressed: () {},
//                   ),
//                 ),
//               ],
//             );
//           }).toList(),
//         ),
//       ),
//     );
//   }
// }
