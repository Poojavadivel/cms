import 'package:flutter/material.dart';
import 'package:glowhair/Modules/Doctor/widgets/Appoimentstable.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../Models/dashboardmodels.dart';
import 'AppoimentsPage.dart';
import 'DashboardPage.dart';
import 'PatientsPage.dart';
import 'SchedulePage.dart';
import 'SettingsPAge.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Main Doctor Root Page Widget ---
class DoctorRootPage extends StatefulWidget {
  const DoctorRootPage({super.key});

  @override
  State<DoctorRootPage> createState() => _DoctorRootPageState();
}

class _DoctorRootPageState extends State<DoctorRootPage> {
  int _selectedIndex = 0;
  bool _isChatbotOpen = false;
  bool _isChatbotMaximized = false;

  String _searchQuery = '';
  int _currentPage = 0;

  late List<Map<String, dynamic>> _navItems;

  final DoctorDashboardData dashboardData = DoctorDashboardData(
    appointments: [
      DashboardAppointments(
        patientName: 'Arthur',
        patientAge: 32,
        date: '05/12/2022',
        time: '9:30 AM',
        reason: 'Fever',
        doctor: 'Dr. John',
        status: 'Completed',
        gender: 'Male',
        patientId: 'P001',
        service: 'General Checkup',
        patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A',
        isSelected: false,
      ),
      DashboardAppointments(patientName: 'Sophia', patientAge: 28, date: '06/12/2022', time: '10:00 AM', reason: 'Cold', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P002', service: 'ENT Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=S', isSelected: false),
      DashboardAppointments(patientName: 'Ethan', patientAge: 45, date: '06/12/2022', time: '11:00 AM', reason: 'Back Pain', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P003', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=E', isSelected: false),
      DashboardAppointments(patientName: 'Olivia', patientAge: 36, date: '06/12/2022', time: '11:30 AM', reason: 'Headache', doctor: 'Dr. John', status: 'Completed', gender: 'Female', patientId: 'P004', service: 'Neurology Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=O', isSelected: false),
      DashboardAppointments(patientName: 'Liam', patientAge: 52, date: '06/12/2022', time: '12:00 PM', reason: 'Follow-up', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Male', patientId: 'P005', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Ava', patientAge: 29, date: '06/12/2022', time: '12:30 PM', reason: 'Routine Check', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P006', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'Noah', patientAge: 39, date: '06/12/2022', time: '1:00 PM', reason: 'Chest Pain', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P007', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=N', isSelected: false),
      DashboardAppointments(patientName: 'Isabella', patientAge: 34, date: '06/12/2022', time: '2:00 PM', reason: 'Skin Rash', doctor: 'Dr. John', status: 'Completed', gender: 'Female', patientId: 'P008', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=I', isSelected: false),
      DashboardAppointments(patientName: 'Mason', patientAge: 40, date: '07/12/2022', time: '9:00 AM', reason: 'Allergy', doctor: 'Dr. Jane', status: 'Completed', gender: 'Male', patientId: 'P009', service: 'Allergy Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=M', isSelected: false),
      DashboardAppointments(patientName: 'Mia', patientAge: 27, date: '07/12/2022', time: '9:30 AM', reason: 'Cough', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Female', patientId: 'P010', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=M', isSelected: false),
      DashboardAppointments(patientName: 'Lucas', patientAge: 50, date: '07/12/2022', time: '10:00 AM', reason: 'Diabetes Check', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Male', patientId: 'P011', service: 'Endocrinology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Charlotte', patientAge: 33, date: '07/12/2022', time: '10:30 AM', reason: 'Eye Pain', doctor: 'Dr. John', status: 'Completed', gender: 'Female', patientId: 'P012', service: 'Ophthalmology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=C', isSelected: false),
      DashboardAppointments(patientName: 'Elijah', patientAge: 42, date: '07/12/2022', time: '11:00 AM', reason: 'Knee Pain', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P013', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=E', isSelected: false),
      DashboardAppointments(patientName: 'Amelia', patientAge: 37, date: '07/12/2022', time: '11:30 AM', reason: 'Fever', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P014', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'James', patientAge: 55, date: '07/12/2022', time: '12:00 PM', reason: 'High BP', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Male', patientId: 'P015', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=J', isSelected: false),
      DashboardAppointments(patientName: 'Harper', patientAge: 30, date: '07/12/2022', time: '12:30 PM', reason: 'Migraine', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Female', patientId: 'P016', service: 'Neurology Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=H', isSelected: false),
      DashboardAppointments(patientName: 'Benjamin', patientAge: 48, date: '07/12/2022', time: '1:00 PM', reason: 'Tooth Pain', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P017', service: 'Dental', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=B', isSelected: false),
      DashboardAppointments(patientName: 'Evelyn', patientAge: 26, date: '07/12/2022', time: '1:30 PM', reason: 'Consultation', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P018', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=E', isSelected: false),
      DashboardAppointments(patientName: 'Henry', patientAge: 31, date: '07/12/2022', time: '2:00 PM', reason: 'Asthma', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Male', patientId: 'P019', service: 'Pulmonology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=H', isSelected: false),
      DashboardAppointments(patientName: 'Abigail', patientAge: 44, date: '07/12/2022', time: '2:30 PM', reason: 'Consultation', doctor: 'Dr. Joel', status: 'Completed', gender: 'Female', patientId: 'P020', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'Jack', patientAge: 29, date: '08/12/2022', time: '9:00 AM', reason: 'Injury', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P021', service: 'Emergency', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=J', isSelected: false),
      DashboardAppointments(patientName: 'Ella', patientAge: 36, date: '08/12/2022', time: '9:30 AM', reason: 'Skin Check', doctor: 'Dr. Jane', status: 'Incomplete', gender: 'Female', patientId: 'P022', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=E', isSelected: false),
      DashboardAppointments(patientName: 'Daniel', patientAge: 47, date: '08/12/2022', time: '10:00 AM', reason: 'Check-up', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P023', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=D', isSelected: false),
      DashboardAppointments(patientName: 'Grace', patientAge: 32, date: '08/12/2022', time: '10:30 AM', reason: 'Throat Pain', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P024', service: 'ENT Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=G', isSelected: false),
      DashboardAppointments(patientName: 'Matthew', patientAge: 54, date: '08/12/2022', time: '11:00 AM', reason: 'Follow-up', doctor: 'Dr. John', status: 'Incomplete', gender: 'Male', patientId: 'P025', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=M', isSelected: false),
      DashboardAppointments(patientName: 'Scarlett', patientAge: 27, date: '08/12/2022', time: '11:30 AM', reason: 'Consultation', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P026', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=S', isSelected: false),
      DashboardAppointments(patientName: 'William', patientAge: 49, date: '08/12/2022', time: '12:00 PM', reason: 'Back Pain', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P027', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=W', isSelected: false),
      DashboardAppointments(patientName: 'Aria', patientAge: 33, date: '08/12/2022', time: '12:30 PM', reason: 'Cough', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Female', patientId: 'P028', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'Logan', patientAge: 38, date: '08/12/2022', time: '1:00 PM', reason: 'Migraine', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P029', service: 'Neurology Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Chloe', patientAge: 35, date: '08/12/2022', time: '1:30 PM', reason: 'Skin Rash', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P030', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=C', isSelected: false),
      DashboardAppointments(patientName: 'Alexander', patientAge: 53, date: '08/12/2022', time: '2:00 PM', reason: 'Chest Pain', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P031', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'Sofia', patientAge: 29, date: '08/12/2022', time: '2:30 PM', reason: 'Cold', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P032', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=S', isSelected: false),
      DashboardAppointments(patientName: 'Michael', patientAge: 46, date: '09/12/2022', time: '9:00 AM', reason: 'Injury', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P033', service: 'Emergency', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=M', isSelected: false),
      DashboardAppointments(patientName: 'Victoria', patientAge: 34, date: '09/12/2022', time: '9:30 AM', reason: 'Consultation', doctor: 'Dr. Jane', status: 'Incomplete', gender: 'Female', patientId: 'P034', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=V', isSelected: false),
      DashboardAppointments(patientName: 'Jackson', patientAge: 41, date: '09/12/2022', time: '10:00 AM', reason: 'Diabetes Check', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P035', service: 'Endocrinology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=J', isSelected: false),
      DashboardAppointments(patientName: 'Luna', patientAge: 25, date: '09/12/2022', time: '10:30 AM', reason: 'Eye Pain', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P036', service: 'Ophthalmology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Sebastian', patientAge: 44, date: '09/12/2022', time: '11:00 AM', reason: 'Back Pain', doctor: 'Dr. John', status: 'Incomplete', gender: 'Male', patientId: 'P037', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=S', isSelected: false),
      DashboardAppointments(patientName: 'Zoe', patientAge: 31, date: '09/12/2022', time: '11:30 AM', reason: 'Cough', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P038', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=Z', isSelected: false),
      DashboardAppointments(patientName: 'Carter', patientAge: 37, date: '09/12/2022', time: '12:00 PM', reason: 'Fever', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P039', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=C', isSelected: false),
      DashboardAppointments(patientName: 'Hannah', patientAge: 28, date: '09/12/2022', time: '12:30 PM', reason: 'Skin Allergy', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Female', patientId: 'P040', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=H', isSelected: false),
      DashboardAppointments(patientName: 'Aiden', patientAge: 33, date: '09/12/2022', time: '1:00 PM', reason: 'Check-up', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P041', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'Lily', patientAge: 26, date: '09/12/2022', time: '1:30 PM', reason: 'Sore Throat', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P042', service: 'ENT Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Wyatt', patientAge: 39, date: '09/12/2022', time: '2:00 PM', reason: 'Follow-up', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P043', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=W', isSelected: false),
      DashboardAppointments(patientName: 'Nora', patientAge: 31, date: '09/12/2022', time: '2:30 PM', reason: 'Allergy', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P044', service: 'Allergy Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=N', isSelected: false),
      DashboardAppointments(patientName: 'Leo', patientAge: 45, date: '10/12/2022', time: '9:00 AM', reason: 'Back Pain', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P045', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Riley', patientAge: 27, date: '10/12/2022', time: '9:30 AM', reason: 'Cough & Cold', doctor: 'Dr. Jane', status: 'Incomplete', gender: 'Female', patientId: 'P046', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=R', isSelected: false),
      DashboardAppointments(patientName: 'Julian', patientAge: 52, date: '10/12/2022', time: '10:00 AM', reason: 'Diabetes Review', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P047', service: 'Endocrinology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=J', isSelected: false),
      DashboardAppointments(patientName: 'Penelope', patientAge: 35, date: '10/12/2022', time: '10:30 AM', reason: 'Eye Irritation', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P048', service: 'Ophthalmology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=P', isSelected: false),
      DashboardAppointments(patientName: 'Hudson', patientAge: 43, date: '10/12/2022', time: '11:00 AM', reason: 'Shoulder Pain', doctor: 'Dr. John', status: 'Incomplete', gender: 'Male', patientId: 'P049', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=H', isSelected: false),
      DashboardAppointments(patientName: 'Layla', patientAge: 30, date: '10/12/2022', time: '11:30 AM', reason: 'Dermatitis', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P050', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Grayson', patientAge: 37, date: '10/12/2022', time: '12:00 PM', reason: 'Follow-up', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P051', service: 'General Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=G', isSelected: false),
      DashboardAppointments(patientName: 'Zoey', patientAge: 28, date: '10/12/2022', time: '12:30 PM', reason: 'Fever', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Female', patientId: 'P052', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=Z', isSelected: false),
      DashboardAppointments(patientName: 'David', patientAge: 33, date: '10/12/2022', time: '1:00 PM', reason: 'Chest Tightness', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P053', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=D', isSelected: false),
      DashboardAppointments(patientName: 'Audrey', patientAge: 42, date: '10/12/2022', time: '1:30 PM', reason: 'Sinusitis', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P054', service: 'ENT Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'Joseph', patientAge: 58, date: '11/12/2022', time: '9:00 AM', reason: 'BP Review', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P055', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=J', isSelected: false),
      DashboardAppointments(patientName: 'Stella', patientAge: 31, date: '11/12/2022', time: '9:30 AM', reason: 'Skin Lesion', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P056', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=S', isSelected: false),
      DashboardAppointments(patientName: 'Owen', patientAge: 36, date: '11/12/2022', time: '10:00 AM', reason: 'Sprain', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P057', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=O', isSelected: false),
      DashboardAppointments(patientName: 'Camila', patientAge: 27, date: '11/12/2022', time: '10:30 AM', reason: 'Allergic Rhinitis', doctor: 'Dr. Jane', status: 'Incomplete', gender: 'Female', patientId: 'P058', service: 'Allergy Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=C', isSelected: false),
      DashboardAppointments(patientName: 'Luke', patientAge: 40, date: '11/12/2022', time: '11:00 AM', reason: 'Tingling Hands', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P059', service: 'Neurology Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=L', isSelected: false),
      DashboardAppointments(patientName: 'Paisley', patientAge: 34, date: '11/12/2022', time: '11:30 AM', reason: 'Conjunctivitis', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P060', service: 'Ophthalmology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=P', isSelected: false),
      DashboardAppointments(patientName: 'Nathan', patientAge: 51, date: '11/12/2022', time: '12:00 PM', reason: 'Cardio Follow-up', doctor: 'Dr. John', status: 'Incomplete', gender: 'Male', patientId: 'P061', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=N', isSelected: false),
      DashboardAppointments(patientName: 'Brooklyn', patientAge: 29, date: '11/12/2022', time: '12:30 PM', reason: 'Rash', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P062', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=B', isSelected: false),
      DashboardAppointments(patientName: 'Isaac', patientAge: 46, date: '11/12/2022', time: '1:00 PM', reason: 'Routine Review', doctor: 'Dr. Joel', status: 'Completed', gender: 'Male', patientId: 'P063', service: 'General Checkup', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=I', isSelected: false),
      DashboardAppointments(patientName: 'Samantha', patientAge: 33, date: '11/12/2022', time: '1:30 PM', reason: 'Ear Pain', doctor: 'Dr. Amelia', status: 'Incomplete', gender: 'Female', patientId: 'P064', service: 'ENT Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=S', isSelected: false),
      DashboardAppointments(patientName: 'Aaron', patientAge: 38, date: '12/12/2022', time: '9:00 AM', reason: 'Lower Back Pain', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P065', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=A', isSelected: false),
      DashboardAppointments(patientName: 'Claire', patientAge: 30, date: '12/12/2022', time: '9:30 AM', reason: 'Acne', doctor: 'Dr. Jane', status: 'Completed', gender: 'Female', patientId: 'P066', service: 'Dermatology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=C', isSelected: false),
      DashboardAppointments(patientName: 'Miles', patientAge: 42, date: '12/12/2022', time: '10:00 AM', reason: 'Hypertension', doctor: 'Dr. Joel', status: 'Incomplete', gender: 'Male', patientId: 'P067', service: 'Cardiology', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=M', isSelected: false),
      DashboardAppointments(patientName: 'Hailey', patientAge: 27, date: '12/12/2022', time: '10:30 AM', reason: 'Allergy Shots', doctor: 'Dr. Amelia', status: 'Completed', gender: 'Female', patientId: 'P068', service: 'Allergy Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=H', isSelected: false),
      DashboardAppointments(patientName: 'Connor', patientAge: 35, date: '12/12/2022', time: '11:00 AM', reason: 'Sprained Ankle', doctor: 'Dr. John', status: 'Completed', gender: 'Male', patientId: 'P069', service: 'Orthopedics', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=C', isSelected: false),
      DashboardAppointments(patientName: 'Elena', patientAge: 28, date: '12/12/2022', time: '11:30 AM', reason: 'Migraine Follow-up', doctor: 'Dr. Jane', status: 'Incomplete', gender: 'Female', patientId: 'P070', service: 'Neurology Consult', patientAvatarUrl: 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=E', isSelected: false),

      // add more if needed...
    ],

  );

  @override
  void initState() {
    super.initState();
    _buildNavItems();
  }

  void _buildNavItems() {
    _navItems = [
      {
        'icon': Iconsax.category,
        'label': 'Dashboard',
        'screen': const DoctorDashboardScreen(),
      },
      {
        'icon': Iconsax.calendar,
        'label': 'Appointments',
        'screen': AppointmentTable(
          appointments: dashboardData.appointments,           // ✅ FIXED
          onShowAppointmentDetails: _showAppointmentDetails,
          onNewAppointmentPressed: _onNewAppointmentPressed,
          searchQuery: _searchQuery,
          onSearchChanged: _updateSearchQuery,
          currentPage: _currentPage,
          onNextPage: _goToNextPage,
          onPreviousPage: _goToPreviousPage,
        ),
      },
      {
        'icon': Iconsax.profile_2user,
        'label': 'Patients',
        'screen': const PatientsScreen(),
      },
      {
        'icon': Iconsax.task,
        'label': 'My Schedule',
        'screen': const DoctorScheduleScreen(),
      },
      {
        'icon': Iconsax.setting_2,
        'label': 'Settings',
        'screen': const DoctorSettingsScreen(),
      },
    ];
  }

  // ========== Appointment Handlers ==========
  void _showAppointmentDetails(DashboardAppointments appt) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('Details for ${appt.patientName}'),
        ),
      ),
    );
  }

  void _onNewAppointmentPressed() {
    debugPrint("New Appointment Pressed");
  }

  void _updateSearchQuery(String value) {
    setState(() {
      _searchQuery = value;
      _currentPage = 0;
      _buildNavItems(); // rebuild appointments nav with new state
    });
  }

  void _goToNextPage() {
    setState(() {
      _currentPage++;
      _buildNavItems();
    });
  }

  void _goToPreviousPage() {
    setState(() {
      if (_currentPage > 0) _currentPage--;
      _buildNavItems();
    });
  }

  // ========== Navigation ==========
  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
  }

  // ========== Chatbot ==========
  void _toggleChatbot() {
    setState(() {
      _isChatbotOpen = !_isChatbotOpen;
      if (!_isChatbotOpen) _isChatbotMaximized = false;
    });
  }

  void _toggleChatbotSize() {
    setState(() => _isChatbotMaximized = !_isChatbotMaximized);
  }

  @override
  Widget build(BuildContext context) {
    final Widget selectedScreen = _navItems[_selectedIndex]['screen'];
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Stack(
        children: [
          Row(
            children: <Widget>[
              DoctorSidebarNavigation(
                selectedIndex: _selectedIndex,
                onItemTapped: _onItemTapped,
                navItems: _navItems,
              ),
              Expanded(child: selectedScreen),
            ],
          ),
          if (_isChatbotOpen)
            Positioned(
              bottom: 32,
              right: 32,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: _isChatbotMaximized ? 800 : 350,
                height: _isChatbotMaximized ? screenSize.height * 0.79 : 500,
                child: ChatbotWidget(
                  onClose: _toggleChatbot,
                  onToggleSize: _toggleChatbotSize,
                  isMaximized: _isChatbotMaximized,
                ),
              ),
            ),
          if (!_isChatbotOpen)
            Positioned(
              bottom: 32,
              right: 32,
              child: GestureDetector(
                onTap: _toggleChatbot,
                child: Column(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: primaryColor,
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/chatbotimg.png',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Ask Movi',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        color: textPrimaryColor,
                      ),
                    )
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// --- Sidebar Navigation for Doctor ---
class DoctorSidebarNavigation extends StatefulWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;
  final List<Map<String, dynamic>> navItems;

  const DoctorSidebarNavigation({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
    required this.navItems,
  });

  @override
  State<DoctorSidebarNavigation> createState() =>
      _DoctorSidebarNavigationState();
}

class _DoctorSidebarNavigationState extends State<DoctorSidebarNavigation>
    with SingleTickerProviderStateMixin {
  bool _isCollapsed = false;
  late AnimationController _animationController;
  late Animation<double> _widthAnimation;

  final double expandedWidth = 256;
  final double collapsedWidth = 72;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _widthAnimation = Tween<double>(
      begin: expandedWidth,
      end: collapsedWidth,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  void _toggleSidebar() {
    setState(() {
      _isCollapsed = !_isCollapsed;
      if (_isCollapsed) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mainNavItems = widget.navItems.take(4).toList();
    final bottomNavItems = widget.navItems.skip(4).toList();

    return AnimatedBuilder(
      animation: _widthAnimation,
      builder: (context, child) {
        return Container(
          width: _widthAnimation.value,
          color: cardBackgroundColor,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hamburger & Logo (overflow-proof)
              Padding(
                padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: _toggleSidebar,
                        child: Container(
                          width: 30,
                          alignment: Alignment.center,
                          child: Icon(
                            _isCollapsed ? Icons.menu_open : Icons.menu,
                            size: 30,
                            color: primaryColor,
                          ),
                        ),
                      ),
                      if (!_isCollapsed) ...[
                        const SizedBox(width: 12),
                        ConstrainedBox(
                          constraints:
                          BoxConstraints(maxWidth: expandedWidth - 60),
                          child: Text(
                            'Glow Skin & Gro Hair',
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.lexend(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: primaryColor,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              Divider(height: 1, color: Colors.grey[200]),
              // Main Nav Items
              Expanded(
                child: ListView.builder(
                  itemCount: mainNavItems.length,
                  itemBuilder: (context, index) {
                    final item = mainNavItems[index];
                    return _buildNavItem(
                      icon: item['icon'] as IconData,
                      label: item['label'] as String,
                      isSelected: widget.selectedIndex == index,
                      onTap: () => widget.onItemTapped(index),
                    );
                  },
                ),
              ),
              Divider(height: 1, color: Colors.grey[200]),
              // Bottom Nav Items
              ...List.generate(bottomNavItems.length, (index) {
                final item = bottomNavItems[index];
                final actualIndex = index + mainNavItems.length;
                return _buildNavItem(
                  icon: item['icon'] as IconData,
                  label: item['label'] as String,
                  isSelected: widget.selectedIndex == actualIndex,
                  onTap: () => widget.onItemTapped(actualIndex),
                );
              }),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final color = isSelected ? primaryColor : textSecondaryColor;

    return Material(
      color: isSelected ? primaryColorLight : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: isSelected
                ? const Border(left: BorderSide(color: primaryColor, width: 4))
                : null,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 22),
              if (!_isCollapsed) ...[
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.lexend(
                      color: color,
                      fontSize: 15,
                      fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.w500,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ],
              if (_isCollapsed) const Spacer(), // center icon when collapsed
            ],
          ),
        ),
      ),
    );
  }
}

// --- Chatbot Widget ---
class ChatbotWidget extends StatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onToggleSize;
  final bool isMaximized;

  const ChatbotWidget({
    super.key,
    required this.onClose,
    required this.onToggleSize,
    required this.isMaximized,
  });

  @override
  State<ChatbotWidget> createState() => _ChatbotWidgetState();
}

class _ChatbotWidgetState extends State<ChatbotWidget> {
  final TextEditingController _controller = TextEditingController();
  final List<String> _messages = [];

  void _sendMessage() {
    if (_controller.text.isNotEmpty) {
      setState(() {
        _messages.add(_controller.text);
        _messages.add('Bot: You said "${_controller.text}"');
        _controller.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 10,
      child: Column(
        children: [
          // Chatbot Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Movi Assistant',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    IconButton(
                      icon: Icon(widget.isMaximized
                          ? Icons.fullscreen_exit
                          : Icons.fullscreen),
                      onPressed: widget.onToggleSize,
                      color: textSecondaryColor,
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: widget.onClose,
                      color: textSecondaryColor,
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Messages
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: ListView.builder(
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final isUserMessage = !_messages[index].startsWith('Bot:');
                  return Align(
                    alignment: isUserMessage
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isUserMessage ? primaryColor : Colors.grey[200],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _messages[index],
                        style: GoogleFonts.poppins(
                          color:
                          isUserMessage ? Colors.white : textPrimaryColor,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          // Input Field
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      filled: true,
                      fillColor: Colors.grey[100],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: primaryColor),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
