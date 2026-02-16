// lib/Modules/Pathologist/patients_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../Utils/Colors.dart';

class PathologistPatientsPage extends StatefulWidget {
  const PathologistPatientsPage({super.key});

  @override
  State<PathologistPatientsPage> createState() => _PathologistPatientsPageState();
}

class _PathologistPatientsPageState extends State<PathologistPatientsPage> {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people, size: 64, color: AppColors.kTextSecondary),
          const SizedBox(height: 16),
          Text('Patient Test History', style: GoogleFonts.lexend(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.kTextPrimary)),
          const SizedBox(height: 8),
          Text('Coming Soon', style: GoogleFonts.inter(fontSize: 16, color: AppColors.kTextSecondary)),
        ],
      ),
    );
  }
}
