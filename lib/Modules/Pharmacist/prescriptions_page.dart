// lib/Modules/Pharmacist/prescriptions_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../Utils/Colors.dart';

class PharmacistPrescriptionsPage extends StatefulWidget {
  const PharmacistPrescriptionsPage({super.key});

  @override
  State<PharmacistPrescriptionsPage> createState() => _PharmacistPrescriptionsPageState();
}

class _PharmacistPrescriptionsPageState extends State<PharmacistPrescriptionsPage> {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment, size: 64, color: AppColors.kTextSecondary),
          const SizedBox(height: 16),
          Text('Prescriptions Management', style: GoogleFonts.lexend(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.kTextPrimary)),
          const SizedBox(height: 8),
          Text('Coming Soon', style: GoogleFonts.inter(fontSize: 16, color: AppColors.kTextSecondary)),
        ],
      ),
    );
  }
}
