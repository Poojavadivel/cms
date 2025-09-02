import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

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

// --- Main Settings Screen Widget ---
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String? _patientFileStatus;
  String? _staffFileStatus;
  String? _invoiceFileStatus;

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

  // Simulates picking a file and updating the UI
  void _uploadFile(String category) {
    setState(() {
      // In a real app, you would use a file picker package.
      // For this demo, we'll just update the status text.
      final fileName = '${category.toLowerCase().replaceAll(' ', '_')}_data.csv';
      switch (category) {
        case 'Patient Data':
          _patientFileStatus = 'Uploading $fileName...';
          Future.delayed(const Duration(seconds: 2), () {
            setState(() {
              _patientFileStatus = 'Successfully uploaded $fileName';
            });
          });
          break;
        case 'Staff Data':
          _staffFileStatus = 'Uploading $fileName...';
          Future.delayed(const Duration(seconds: 2), () {
            setState(() {
              _staffFileStatus = 'Successfully uploaded $fileName';
            });
          });
          break;
        case 'Invoice Records':
          _invoiceFileStatus = 'Uploading $fileName...';
          Future.delayed(const Duration(seconds: 2), () {
            setState(() {
              _invoiceFileStatus = 'Successfully uploaded $fileName';
            });
          });
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            _buildDataManagementSection(),
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

  Widget _buildDataManagementSection() {
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
            'Data Management',
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Upload bulk data files for different categories. Please use the specified CSV format.',
            style: GoogleFonts.poppins(color: textSecondaryColor),
          ),
          const SizedBox(height: 24),
          const Divider(),
          _buildUploadCategory(
            icon: Icons.personal_injury_rounded,
            title: 'Patient Data',
            description: 'Upload a CSV file containing a list of all patients.',
            status: _patientFileStatus,
            onUpload: () => _uploadFile('Patient Data'),
          ),
          const Divider(),
          _buildUploadCategory(
            icon: Icons.groups_rounded,
            title: 'Staff Data',
            description: 'Upload a CSV file containing a list of all staff members.',
            status: _staffFileStatus,
            onUpload: () => _uploadFile('Staff Data'),
          ),
          const Divider(),
          _buildUploadCategory(
            icon: Icons.receipt_long_rounded,
            title: 'Invoice Records',
            description: 'Upload a CSV file containing a history of all invoices.',
            status: _invoiceFileStatus,
            onUpload: () => _uploadFile('Invoice Records'),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadCategory({
    required IconData icon,
    required String title,
    required String description,
    String? status,
    required VoidCallback onUpload,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: Row(
        children: [
          Icon(icon, color: primaryColor, size: 32),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.poppins(color: textSecondaryColor),
                ),
                if (status != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    status,
                    style: GoogleFonts.poppins(
                      color: status.startsWith('Success') ? Colors.green : textSecondaryColor,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ]
              ],
            ),
          ),
          const SizedBox(width: 24),
          ElevatedButton(
            onPressed: onUpload,
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColorLight,
              foregroundColor: primaryColor,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: Text('Upload File', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
