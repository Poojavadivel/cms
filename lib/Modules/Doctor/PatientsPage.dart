import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math';
import 'dart:ui'; // For BackdropFilter (glassmorphism effect)
import 'package:intl/intl.dart';

// --- Centralized Data Models ---
// These classes MUST be defined in 'lib/models/patient_models.dart'
// and then imported here.

import '../../Models/Patients.dart'; // Corrected import path

// --- App Theme Colors (Aligned with HTML's Tailwind variables) ---
const Color primaryColor = Color(0xFFEF4444); // Tailwind's red-500
const Color primaryHoverColor = Color(0xFFDC2626); // Tailwind's red-600
const Color backgroundColor = Color(0xFFF9FAFB); // Tailwind's gray-50
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937); // Tailwind's gray-900
const Color textSecondaryColor = Color(0xFF6B7280); // Tailwind's gray-500
const Color borderColor = Color(0xFFE5E7EB); // Tailwind's gray-200
const Color accentLight = Color(0xFFFEE2E2); // Tailwind's red-100
const Color accentDark = Color(0xFFB91C1C); // Tailwind's red-700


// --- Simulated API Data for Patients ---
final _patientApiData = PatientDashboardData(
  patients: [
    PatientDetails(
      patientId: '#PTN001', name: 'Arthur Penhaligon', age: 34, gender: 'Male',
      bloodGroup: 'B+', weight: '75 kgs', height: '175 cms',
      emergencyContactName: 'Merlin (Friend)', emergencyContactPhone: '9876543210',
      phone: '+91 6382255960', city: 'London', address: '123 Baker St', pincode: 'SW1A 0AA',
      insuranceNumber: 'AA234-875490', expiryDate: '16.09.2026',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4mvEgM4k-gfOz9apSQFT7ySJ3xYpQefFrN4Qnn6CrPXXLca2wQ2Hy38Gf9WQkN4HNTrLk4usF2EgOtUKx_rlmphLhpUs-hCm9tYCyKjxdF66dLbtiCviBysuTv-KbLAAzN_KUIIMSx1UlKxrT2ZafD-FmZA_fpXxj6bQCBUnSJNb5jnyySYyslom4WXLMk3Lj5zDgYmHIdJ2-L0e5ycjqcUZZbHYLR_maoiZ5qQQCetseFehIktghS3y3_nq2Jtq6U9JMNsGYzf4A',
      dateOfBirth: '1990-08-15', lastVisitDate: '2022-12-05',
    ),
    PatientDetails(
      patientId: '#PTN002', name: 'John Doe', age: 28, gender: 'Male',
      bloodGroup: 'A-', weight: '80 kgs', height: '180 cms',
      emergencyContactName: 'Jane Doe (Wife)', emergencyContactPhone: '9876543211',
      phone: '+91 6382255960', city: 'New York', address: '456 Main St', pincode: '10001',
      insuranceNumber: 'BB567-123456', expiryDate: '22.11.2025',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe6hXNS2HpqQn7YkbB-pUVflFRpqFkOXW7bENE83NCZJ-U6m5ixkO1RAU_YcjxqCDi4-qA4TcovvoNdLv6MAgNES0_yUJ7W05kd7vPz-l_rCLbokB638oNokMGNY4QImoYxHH83cMR8mKWKodHG4mD_M6YV5MqdU1xIieXcmxqg_dB9kzodcjmvEp2rYqT5FomcQk1wPyK_i_24jtTk761yGgGBydNZhrWVJUIMUHV-bII1VHrz_tHjzep1tgjWw5GWZuT1778Irx5',
      dateOfBirth: '1994-05-22', lastVisitDate: '2022-12-05',
    ),
    PatientDetails(
      patientId: '#PTN003', name: 'Bhavana Sharma', age: 22, gender: 'Female',
      bloodGroup: 'O+', weight: '55 kgs', height: '160 cms',
      emergencyContactName: 'Rajesh Sharma (Father)', emergencyContactPhone: '9876543212',
      phone: '+91 6382255960', city: 'Mumbai', address: '789 Ocean View', pincode: '400001',
      insuranceNumber: 'CC890-789012', expiryDate: '01.05.2027',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2jHBBSTdPIFBjw7fp3GXQiQzTkMG7AKnlRzMUjkUnnHSUtnshRDkv8Fy1B7RTF28v0Qbv_alfAmQMj7cNEMX85CuAMuZc-Sr5JKCiIk3EY82tDUthlbKzY8S4vlRJp4wrWDeGK7lY7Ro0T280s8E-ry2I7VOUgLLHFtLnXSeE1kvYWEH1pIpqTZCDp_92VE98DZfD1O4zt4_gZSo38ly7gekgdJmLKv68Ly88BiB8xfKKaAAKxM9eUvcSnNkc6lDQTryjOcrNsOIL',
      dateOfBirth: '2002-11-30', lastVisitDate: '2025-08-19',
    ),
    PatientDetails(
      patientId: '#PTN004', name: 'David Lee', age: 40, gender: 'Male',
      bloodGroup: 'AB-', weight: '70 kgs', height: '178 cms',
      emergencyContactName: 'Sarah Lee (Sister)', emergencyContactPhone: '9876543213',
      phone: '+91 6382255960', city: 'London', address: '10 Downing St', pincode: 'SW1A 2AA',
      insuranceNumber: 'DD123-456789', expiryDate: '10.03.2028',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAhShsj_sjsFP8yqmRAwdcWbYW61IWCk8Y9y8zTdK2A3HYqbXyRekqrj0rmwMd5VWCVLDRXfh8vMxcigzVCUFTRrMW43jyj86M9cnXvVRCNFQZnoWHZYsVlppW0oTjlwBrbFLxBKe3pMDd3mm6SD_BRVNb1it0eV_VJ_vDBWd0VSSZCnHD03ErqsjLPc_FjAJW3aj8ScUdSdOiDebY7VrZtk_GDy9nA0z2irr6iT20DpnxFZAvQM1i9ewkd_O2aQPg0f0kd_-LzXBD',
      dateOfBirth: '1996-01-01', lastVisitDate: '2022-12-05',
    ),
    PatientDetails(
      patientId: '#PTN005', name: 'Joseph King', age: 78, gender: 'Male',
      bloodGroup: 'O-', weight: '65 kgs', height: '170 cms',
      emergencyContactName: 'Mary King (Daughter)', emergencyContactPhone: '9876543214',
      phone: '+91 6382255960', city: 'San Francisco', address: 'Golden Gate Ave', pincode: '94101',
      insuranceNumber: 'EE456-789012', expiryDate: '05.08.2025',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgN1WEjGylzuwySvo6RPwP6q8eGUmCQzgvAvkNpHQIdLlm2luVjRD0GpeGbj9qi7WwU7T3cZayQPcsqyyA1ksPG6obZ0tdbYRShdlVXemxy-XdT2RAMN4Z4IBGVAB-fK8uE75Phu2lSBKu-oFQsOI4xWUm-5xLW7JYTWJM0_UBx6npQ9PjoWDWb8GXgG7DdTYuR0kyZRg08vJ4riXKqSiDh54vFfjSK9qYdZp1QVPgRa2SHP4S2c77vp5P3NSIxt4jAY2Me3m3MQIT',
      dateOfBirth: '1945-06-12', lastVisitDate: '2022-12-05',
    ),
    PatientDetails(
      patientId: '#PTN006', name: 'Lakesh Patel', age: 48, gender: 'Male',
      bloodGroup: 'A+', weight: '82 kgs', height: '172 cms',
      emergencyContactName: 'Priya Patel (Wife)', emergencyContactPhone: '9876543215',
      phone: '+91 6382255960', city: 'Ahmedabad', address: '101 Gandhi Rd', pincode: '380001',
      insuranceNumber: 'FF789-012345', expiryDate: '18.12.2027',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG1aJkNbuPWmDs1QFIpfW2KQByEl-QqBnC9GyeU3JveDWSveLHh-THzaFIlW_FPjUBUcExOPt-xi0hA-5rhEmT9uNtR_Ide8IOvuJvu6Issur4u_SGfsv-pqHxNgqiyvUscYMk9EFE7-5jeD04xXxu5ENG2rkXxguK4rjSliln75B0PHS2u769pAXx08ddZYVWWH2TWVJSPoK0sm9HbW0_2faFHaPyz2--ZvNPuHe8lfMbUKja1dfKvdE6SFrzST_WbK-f8tomHoN_',
      dateOfBirth: '1977-09-18', lastVisitDate: '2022-12-05',
    ),
    PatientDetails(
      patientId: '#PTN007', name: 'Maria Garcia', age: 30, gender: 'Female',
      bloodGroup: 'B-', weight: '60 kgs', height: '165 cms',
      emergencyContactName: 'Carlos Garcia (Husband)', emergencyContactPhone: '9876543216',
      phone: '+91 6382255960', city: 'Madrid', address: 'Calle Mayor 1', pincode: '28001',
      insuranceNumber: 'GG012-345678', expiryDate: '20.07.2026',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1994-03-10', lastVisitDate: '2023-11-20',
    ),
    PatientDetails(
      patientId: '#PTN008', name: 'Chen Wei', age: 55, gender: 'Male',
      bloodGroup: 'A+', weight: '78 kgs', height: '170 cms',
      emergencyContactName: 'Li Na (Wife)', emergencyContactPhone: '9876543217',
      phone: '+91 6382255960', city: 'Beijing', address: 'Wangfujing St', pincode: '100006',
      insuranceNumber: 'HH345-678901', expiryDate: '11.09.2025',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1969-07-01', lastVisitDate: '2024-01-15',
    ),
    PatientDetails(
      patientId: '#PTN009', name: 'Fatima Ahmed', age: 29, gender: 'Female',
      bloodGroup: 'O+', weight: '62 kgs', height: '168 cms',
      emergencyContactName: 'Omar Ahmed (Brother)', emergencyContactPhone: '9876543218',
      phone: '+91 6382255960', city: 'Dubai', address: 'Sheikh Zayed Rd', pincode: '00000',
      insuranceNumber: 'II678-901234', expiryDate: '03.04.2027',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1995-12-01', lastVisitDate: '2024-02-28',
    ),
    PatientDetails(
      patientId: '#PTN010', name: 'Hiroshi Tanaka', age: 68, gender: 'Male',
      bloodGroup: 'AB+', weight: '70 kgs', height: '160 cms',
      emergencyContactName: 'Akiko Tanaka (Wife)', emergencyContactPhone: '9876543219',
      phone: '+91 6382255960', city: 'Tokyo', address: 'Shibuya Crossing', pincode: '150-0042',
      insuranceNumber: 'JJ901-234567', expiryDate: '25.01.2026',
      avatarUrl: 'https://images.unsplash.com/photo-1552058544-ab7967980206?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1956-02-10', lastVisitDate: '2023-09-01',
    ),
    PatientDetails(
      patientId: '#PTN011', name: 'Sophie Dupont', age: 42, gender: 'Female',
      bloodGroup: 'A-', weight: '63 kgs', height: '168 cms',
      emergencyContactName: 'Pierre Dupont (Husband)', emergencyContactPhone: '9876543220',
      phone: '+91 6382255960', city: 'Paris', address: 'Champs-Élysées', pincode: '75008',
      insuranceNumber: 'KK234-567890', expiryDate: '14.06.2027',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1982-04-20', lastVisitDate: '2024-03-10',
    ),
    PatientDetails(
      patientId: '#PTN012', name: 'Carlos Santos', age: 60, gender: 'Male',
      bloodGroup: 'O+', weight: '85 kgs', height: '175 cms',
      emergencyContactName: 'Ana Santos (Wife)', emergencyContactPhone: '9876543221',
      phone: '+91 6382255960', city: 'São Paulo', address: 'Av. Paulista', pincode: '01310-000',
      insuranceNumber: 'LL567-890123', expiryDate: '08.02.2026',
      avatarUrl: 'https://images.unsplash.com/photo-1564564321837-a57b7070acf7?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1964-09-05', lastVisitDate: '2024-05-01',
    ),
    PatientDetails(
      patientId: '#PTN013', name: 'Elena Petrova', age: 31, gender: 'Female',
      bloodGroup: 'B+', weight: '58 kgs', height: '163 cms',
      emergencyContactName: 'Dmitry Petrov (Brother)', emergencyContactPhone: '9876543222',
      phone: '+91 6382255960', city: 'Moscow', address: 'Red Square', pincode: '109012',
      insuranceNumber: 'MM890-123456', expiryDate: '19.03.2028',
      avatarUrl: 'https://images.unsplash.com/photo-1546484497-cc5273760456?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1993-11-11', lastVisitDate: '2023-12-25',
    ),
    PatientDetails(
      patientId: '#PTN014', name: 'Hans Müller', age: 67, gender: 'Male',
      bloodGroup: 'A-', weight: '72 kgs', height: '170 cms',
      emergencyContactName: 'Gretel Müller (Wife)', emergencyContactPhone: '9876543223',
      phone: '+91 6382255960', city: 'Berlin', address: 'Brandenburg Gate', pincode: '10117',
      insuranceNumber: 'NN123-456789', expiryDate: '07.10.2025',
      avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1957-01-01', lastVisitDate: '2024-04-01',
    ),
    PatientDetails(
      patientId: '#PTN015', name: 'Aisha Khan', age: 25, gender: 'Female',
      bloodGroup: 'B+', weight: '52 kgs', height: '160 cms',
      emergencyContactName: 'Zahid Khan (Father)', emergencyContactPhone: '9876543224',
      phone: '+91 6382255960', city: 'Karachi', address: 'Clifton Beach', pincode: '75600',
      insuranceNumber: 'OO456-789012', expiryDate: '28.02.2027',
      avatarUrl: 'https://images.unsplash.com/photo-1508214751196-edcd4a317245?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1999-06-15', lastVisitDate: '2024-01-01',
    ),
    PatientDetails(
      patientId: '#PTN016', name: 'Giovanni Rossi', age: 50, gender: 'Male',
      bloodGroup: 'O-', weight: '88 kgs', height: '182 cms',
      emergencyContactName: 'Sofia Rossi (Wife)', emergencyContactPhone: '9876543225',
      phone: '+91 6382255960', city: 'Rome', address: 'Colosseum', pincode: '00184',
      insuranceNumber: 'PP789-012345', expiryDate: '04.09.2026',
      avatarUrl: 'https://images.unsplash.com/photo-1547425260-76bc422930b2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1974-03-20', lastVisitDate: '2023-10-10',
    ),
    PatientDetails(
      patientId: '#PTN017', name: 'Kimiko Sato', age: 38, gender: 'Female',
      bloodGroup: 'A+', weight: '57 kgs', height: '162 cms',
      emergencyContactName: 'Kenji Sato (Husband)', emergencyContactPhone: '9876543226',
      phone: '+91 6382255960', city: 'Kyoto', address: 'Fushimi Inari', pincode: '612-0882',
      insuranceNumber: 'QQ012-345678', expiryDate: '17.11.2027',
      avatarUrl: 'https://images.unsplash.com/photo-1544725176-7c4095c52c6f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1986-07-07', lastVisitDate: '2024-02-01',
    ),
    PatientDetails(
      patientId: '#PTN018', name: 'Mohammed Ali', age: 70, gender: 'Male',
      bloodGroup: 'AB-', weight: '70 kgs', height: '170 cms',
      emergencyContactName: 'Aisha Ali (Wife)', emergencyContactPhone: '9876543227',
      phone: '+91 6382255960', city: 'Cairo', address: 'Pyramids Rd', pincode: '12556',
      insuranceNumber: 'RR345-678901', expiryDate: '09.01.2026',
      avatarUrl: 'https://images.unsplash.com/photo-1531427186611-ad02f06b4640?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1954-09-10', lastVisitDate: '2024-04-20',
    ),
    PatientDetails(
      patientId: '#PTN019', name: 'Chloe Dubois', age: 28, gender: 'Female',
      bloodGroup: 'O-', weight: '59 kgs', height: '167 cms',
      emergencyContactName: 'Marc Dubois (Brother)', emergencyContactPhone: '9876543228',
      phone: '+91 6382255960', city: 'Marseille', address: 'Vieux-Port', pincode: '13001',
      insuranceNumber: 'SS678-901234', expiryDate: '21.05.2027',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1996-03-01', lastVisitDate: '2023-11-01',
    ),
    PatientDetails(
      patientId: '#PTN020', name: 'David Smith', age: 45, gender: 'Male',
      bloodGroup: 'A+', weight: '80 kgs', height: '178 cms',
      emergencyContactName: 'Emily Smith (Wife)', emergencyContactPhone: '9876543229',
      phone: '+91 6382255960', city: 'Sydney', address: 'Opera House', pincode: '2000',
      insuranceNumber: 'TT901-234567', expiryDate: '13.08.2026',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      dateOfBirth: '1979-01-01', lastVisitDate: '2024-03-15',
    ),
  ],
);

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> with SingleTickerProviderStateMixin {
  late Future<PatientDashboardData> _patientsFuture;
  String _searchQuery = '';
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  late AnimationController _notificationController;
  late Animation<double> _notificationAnimation;

  @override
  void initState() {
    super.initState();
    _patientsFuture = _fetchPatientData();
    _notificationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    _notificationAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _notificationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _notificationController.dispose();
    super.dispose();
  }

  Future<PatientDashboardData> _fetchPatientData() async {
    await Future.delayed(const Duration(seconds: 1)); // Simulate network delay
    return _patientApiData;
  }

  void _goToPage(int page) {
    setState(() {
      _currentPage = page;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<PatientDashboardData>(
        future: _patientsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            final allFilteredPatients = snapshot.data!.patients.where((patient) {
              final matchesSearch = patient.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                  patient.patientId.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                  patient.phone.toLowerCase().contains(_searchQuery.toLowerCase());
              return matchesSearch;
            }).toList();

            final startIndex = _currentPage * _itemsPerPage;
            final endIndex = (_currentPage * _itemsPerPage + _itemsPerPage).clamp(0, allFilteredPatients.length);
            final paginatedPatients = allFilteredPatients.sublist(startIndex, endIndex);

            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  _buildHeader(context), // This header is stationary
                  const SizedBox(height: 24),
                  _buildActionAndSearchSection(context), // This section is stationary
                  const SizedBox(height: 24),
                  Expanded( // This Expanded widget contains the scrollable list of patients
                    child: Container( // Added Container for the outer border
                      decoration: BoxDecoration(
                        color: cardBackgroundColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borderColor, width: 1.0), // Outer border
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 15,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column( // Inner column to hold fixed table headers and scrollable rows
                        children: [
                          _buildPatientsTableHeader(context), // Fixed table headers
                          const Divider(height: 1, color: borderColor),
                          Expanded( // This Expanded makes the ListView fill remaining space and allows it to scroll
                            child: ListView.builder(
                              itemCount: paginatedPatients.length,
                              itemBuilder: (context, index) {
                                final patient = paginatedPatients[index];
                                return _PatientCard(
                                  patient: patient,
                                  isEvenRow: index % 2 == 0,
                                  onEdit: () { /* Handle edit */ },
                                  onDelete: () { /* Handle delete */ },
                                  onViewDetails: () { /* Handle view details */ },
                                );
                              },
                            ),
                          ),
                          const Divider(height: 1, color: borderColor),
                          _buildPagination(context, allFilteredPatients.length, (allFilteredPatients.length / _itemsPerPage).ceil()), // Pagination is also stationary
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          } else {
            return const Center(child: Text('No patient data found.'));
          }
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Patients',
          style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C)),
        ),
        Row(
          children: [
            // const Icon(Icons.notifications, color: Color(0xFFDC2626)),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFFCA5A5)),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 14,
                    backgroundImage: AssetImage('assets/sampledoctor.png'),
                    backgroundColor: Colors.transparent, // optional
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Renvord Atkin',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF991B1B), fontSize: 14),
                  ),
                ],
              ),
            ),
          ],
        )
      ],
    );
  }

  Widget _buildActionAndSearchSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Container( // Added Container for the search field's elevated look
              decoration: BoxDecoration(
                color: cardBackgroundColor,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03), // Subtle shadow for elevation
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
                style: GoogleFonts.inter(fontSize: 14, color: textPrimaryColor),
                decoration: InputDecoration(
                  hintText: 'Search patient name, ID, or phone...',
                  hintStyle: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
                  prefixIcon: const Icon(Icons.search, size: 20, color: textSecondaryColor),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: borderColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: primaryColor, width: 2),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: borderColor),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 24),
          ElevatedButton.icon(
            onPressed: () { /* Handle Add New Patient */ },
            icon: const Icon(Icons.add, size: 18, color: Colors.white),
            label: Text(
              'Add New Patient',
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              elevation: 8,
              shadowColor: primaryColor.withOpacity(0.4),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildPatientsTableHeader(BuildContext context) {
    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F6FA), // Light grey background for header
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
          boxShadow: [ // Added shadow for the header to make it pop
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 5,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Patient Name
            Expanded(
              flex: 3,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12),
                child: Text(
                  'Patient Name',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16),
                  textAlign: TextAlign.left,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Age
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12),
                child: Text(
                  ' ID',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            SizedBox(width: 20),
            // Date
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12),
                child: Text(
                  'Date of Birth',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Time
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12),
                child: Text(
                  'Gender',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16),

                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Reason
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12),
                child: Text(
                  'Contact No',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16),

                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Status
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12),
                child: Text(
                  'Last Visit',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Actions
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12),
                child: Text(
                  'Actions',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: const Color(0xFF991B1B), fontSize: 16),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        )
    );
  }



  Widget _buildPagination(BuildContext context, int totalFilteredCount, int totalPages) {
    final startItem = (_currentPage * _itemsPerPage) + 1;
    final endItem = min((_currentPage * _itemsPerPage + _itemsPerPage), totalFilteredCount);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Showing $startItem to $endItem of $totalFilteredCount entries',
            style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, color: textSecondaryColor),
                onPressed: _currentPage > 0 ? () => _goToPage(_currentPage - 1) : null,
              ),
              const SizedBox(width: 8),
              ...List.generate(totalPages, (index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: _PaginationButton(
                    label: (index + 1).toString(),
                    isActive: _currentPage == index,
                    onPressed: () => _goToPage(index),
                  ),
                );
              }),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.chevron_right, color: textSecondaryColor),
                onPressed: _currentPage < totalPages - 1 ? () => _goToPage(_currentPage + 1) : null,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// --- Custom Widgets for Reusability and Specific Styling ---

class _PatientCard extends StatefulWidget {
  final PatientDetails patient;
  final bool isEvenRow;
  final VoidCallback onViewDetails;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _PatientCard({
    super.key,
    required this.patient,
    required this.isEvenRow,
    required this.onViewDetails,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  State<_PatientCard> createState() => _PatientCardState();
}

class _PatientCardState extends State<_PatientCard> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovering = true),
      onExit: (_) => setState(() => _isHovering = false),
      child: GestureDetector(
        onTap: widget.onViewDetails,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: widget.isEvenRow ? cardBackgroundColor : accentLight.withOpacity(0.3),
            boxShadow: _isHovering
                ? [
              BoxShadow(
                color: primaryColor.withOpacity(0.2),
                blurRadius: 10,
                spreadRadius: 2,
                offset: const Offset(0, 4),
              ),
            ]
                : [],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < 800) {
                return _buildCompactPatientCard();
              } else {
                return _buildWidePatientCard();
              }
            },
          ),
        ),
      ),
    );
  }

  Widget _buildWidePatientCard() {
    return Row(
      children: [
        Expanded(
          flex: 3, // Adjusted flex
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundImage: AssetImage(widget.patient.gender == 'Male' ? 'assets/boyicon.png' : 'assets/girlicon.png'), // Gender-specific icon
                backgroundColor: Colors.transparent,
              ),
              const SizedBox(width: 12),
              Text(
                widget.patient.name,
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15, color: textPrimaryColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Expanded(
          flex: 2, // Adjusted flex
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0), // adjust values as needed
            child: Text(
              widget.patient.patientId,
              style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),

        ),
        Expanded(
          flex: 2, // Adjusted flex
          child: Align(
            alignment: Alignment.center, // aligns text to the start
            child: Padding(
              padding: const EdgeInsets.only(right: 68.0), // adjust left padding
              child: Text(
                DateFormat('dd/MM/yyyy').format(DateTime.parse(widget.patient.dateOfBirth)),
                style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
                maxLines: 1,
                overflow: TextOverflow.visible,
              ),
            ),
          ),

        ),
        Expanded(
          flex: 1, // Adjusted flex
          child: Align(
            alignment: Alignment.centerLeft, // aligns text to the left
            child: Padding(
              padding: const EdgeInsets.only(right: 8.0), // optional spacing from the edge
              child: Text(
                widget.patient.gender,
                style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ),
        Expanded(
          flex: 2, // Adjusted flex
          child: Align(
            alignment: Alignment.centerLeft, // aligns text to the left
            child: Padding(
              padding: const EdgeInsets.only(left: 8.0), // optional left spacing
              child: Text(
                widget.patient.phone,
                style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ),
        Expanded(
          flex: 2, // Adjusted flex
          child: Align(
            alignment: Alignment.center, // aligns text to the right
            child: Padding(
              padding: const EdgeInsets.only(left: 2), // optional spacing from the edge
              child: Text(
                DateFormat('dd/MM/yyyy').format(DateTime.parse(widget.patient.lastVisitDate)), // Corrected Last Visit
                style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ),
        // Removed Status column
        Expanded(
          flex: 2, // Adjusted flex for actions to take remaining space
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              _ActionButton(
                icon: Icons.edit,
                tooltip: 'Edit',
                onPressed: widget.onEdit,
              ),
              _ActionButton(
                icon: Icons.delete,
                tooltip: 'Delete',
                onPressed: widget.onDelete,
                color: primaryColor,
              ),
              _ActionButton(
                icon: Icons.visibility,
                tooltip: 'View Details',
                onPressed: widget.onViewDetails,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCompactPatientCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: AssetImage(widget.patient.gender == 'Male' ? 'assets/boyicon.png' : 'assets/girlicon.png'), // Gender-specific icon
                  backgroundColor: Colors.transparent,
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.patient.name,
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16, color: textPrimaryColor),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'ID: ${widget.patient.patientId}',
                      style: GoogleFonts.inter(fontSize: 12, color: textSecondaryColor),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
            // Removed Status badge from compact card
          ],
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('DOB: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(widget.patient.dateOfBirth))}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor), maxLines: 1, overflow: TextOverflow.ellipsis,),
              Text('Gender: ${widget.patient.gender}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor), maxLines: 1, overflow: TextOverflow.ellipsis,),
              Text('Contact: ${widget.patient.phone}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor), maxLines: 1, overflow: TextOverflow.ellipsis,),
              Text('Last Visit: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(widget.patient.lastVisitDate))}', style: GoogleFonts.inter(fontSize: 14, color: textSecondaryColor), maxLines: 1, overflow: TextOverflow.ellipsis,),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            _ActionButton(icon: Icons.edit, tooltip: 'Edit', onPressed: widget.onEdit),
            _ActionButton(icon: Icons.delete, tooltip: 'Delete', onPressed: widget.onDelete, color: primaryColor),
            _ActionButton(icon: Icons.visibility, tooltip: 'View Details', onPressed: widget.onViewDetails),
          ],
        ),
      ],
    );
  }
}


class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;
  final Color? color;

  const _ActionButton({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      icon: Icon(icon, size: 22, color: color ?? textSecondaryColor),
      onPressed: onPressed,
      visualDensity: VisualDensity.compact,
      splashRadius: 24,
      hoverColor: color?.withOpacity(0.1) ?? textSecondaryColor.withOpacity(0.1),
    );
  }
}

class _PaginationButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onPressed;

  const _PaginationButton({
    super.key,
    required this.label,
    required this.isActive,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: isActive ? primaryColor : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          foregroundColor: isActive ? Colors.white : textSecondaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          minimumSize: const Size(40, 40),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isActive ? Colors.white : textSecondaryColor,
          ),
        ),
      ),
    );
  }
}
