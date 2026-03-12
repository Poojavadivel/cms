// lib/Modules/Pharmacist/settings_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Utils/Colors.dart';

class PharmacistSettingsPage extends StatefulWidget {
  const PharmacistSettingsPage({super.key});

  @override
  State<PharmacistSettingsPage> createState() => _PharmacistSettingsPageState();
}

class _PharmacistSettingsPageState extends State<PharmacistSettingsPage> {
  bool _lowStockAlerts = true;
  bool _prescriptionNotifications = true;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProfileSection(),
          const SizedBox(height: 24),
          _buildNotificationSettings(),
        ],
      ),
    );
  }

  Widget _buildProfileSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.kMuted),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Profile Settings', style: GoogleFonts.lexend(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.kTextPrimary)),
          const SizedBox(height: 24),
          Row(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Icon(Iconsax.user, size: 40, color: AppColors.primary),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Pharmacist', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.kTextPrimary)),
                    const SizedBox(height: 4),
                    Text('pharmacist@hms.com', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary)),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Iconsax.edit, size: 18),
                      label: const Text('Edit Profile'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationSettings() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.kMuted),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Notification Preferences', style: GoogleFonts.lexend(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.kTextPrimary)),
          const SizedBox(height: 24),
          SwitchListTile(
            title: Text('Low Stock Alerts', style: GoogleFonts.inter(fontSize: 15, color: AppColors.kTextPrimary)),
            subtitle: Text('Get notified when medicine stock is low', style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
            value: _lowStockAlerts,
            onChanged: (value) => setState(() => _lowStockAlerts = value),
            activeColor: AppColors.primary,
          ),
          const Divider(height: 32),
          SwitchListTile(
            title: Text('New Prescriptions', style: GoogleFonts.inter(fontSize: 15, color: AppColors.kTextPrimary)),
            subtitle: Text('Get notified about new prescriptions', style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
            value: _prescriptionNotifications,
            onChanged: (value) => setState(() => _prescriptionNotifications = value),
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }
}
