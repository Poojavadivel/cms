import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../Models/Doctor.dart';
import '../../Providers/app_providers.dart';
import '../../Services/Authservices.dart';
import '../Common/LoginPage.dart';


// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Main Doctor Settings Screen Widget ---
class DoctorSettingsScreen extends StatefulWidget {
  const DoctorSettingsScreen({super.key});

  @override
  State<DoctorSettingsScreen> createState() => _DoctorSettingsScreenState();
}

class _DoctorSettingsScreenState extends State<DoctorSettingsScreen> {
  // State variables for settings
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  String _currentStatus = 'Available';

  final AuthService _authService = AuthService.instance;


  void _handleLogout() async {
    // Clear the token from storage
    await _authService.signOut();

    if (!mounted) return;

    // Clear the user state in the provider
    Provider.of<AppProvider>(context, listen: false).signOut();

    // Navigate to the LoginPage, removing all previous routes
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const LoginPage()),
          (Route<dynamic> route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Access the doctor's profile from the AppProvider
    final doctor = Provider.of<AppProvider>(context).user as Doctor?;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            _buildProfileSection(doctor),
            const SizedBox(height: 32),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildAvailabilitySection()),
                const SizedBox(width: 32),
                Expanded(child: _buildNotificationsSection()),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // --- WIDGET BUILDER METHODS ---

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Settings',
          style: GoogleFonts.poppins(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
        TextButton.icon(
          onPressed: _handleLogout,
          icon: const Icon(Icons.logout_rounded, color: primaryColor),
          label: Text('Logout', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: primaryColor)),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: primaryColorLight),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileSection(Doctor? doctor) {
    return _buildSettingsCard(
      title: 'Professional Profile',
      child: Column(
        children: [
          _buildProfileInfoRow('Full Name', doctor?.userProfile.fullName ?? 'N/A'),
          _buildProfileInfoRow('Specialty', doctor?.specialization ?? 'N/A'),
          _buildProfileInfoRow('Department', doctor?.department ?? 'N/A'),
          _buildProfileInfoRow('License Number', doctor?.licenseNumber ?? 'N/A'),
        ],
      ),
    );
  }

  Widget _buildAvailabilitySection() {
    return _buildSettingsCard(
      title: 'My Status',
      child: DropdownButtonFormField<String>(
        value: _currentStatus,
        onChanged: (String? newValue) {
          if (newValue != null) {
            setState(() {
              _currentStatus = newValue;
            });
          }
        },
        items: <String>['Available', 'In Surgery', 'On Leave', 'Unavailable']
            .map<DropdownMenuItem<String>>((String value) {
          return DropdownMenuItem<String>(
            value: value,
            child: Text(value, style: GoogleFonts.poppins()),
          );
        }).toList(),
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.grey[50],
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationsSection() {
    return _buildSettingsCard(
      title: 'Notification Preferences',
      child: Column(
        children: [
          _buildSwitchTile(
            title: 'Email Notifications',
            value: _emailNotifications,
            onChanged: (value) => setState(() => _emailNotifications = value),
          ),
          const Divider(),
          _buildSwitchTile(
            title: 'Push Notifications',
            value: _pushNotifications,
            onChanged: (value) => setState(() => _pushNotifications = value),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsCard({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 24),
          child,
        ],
      ),
    );
  }

  Widget _buildProfileInfoRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textSecondaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textPrimaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      title: Text(
        title,
        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: textPrimaryColor),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: primaryColor,
      contentPadding: EdgeInsets.zero,
    );
  }
}
