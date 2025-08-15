import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// --- App Theme Colors ---
const Color backgroundColor = Color(0xFFF8FAFC);
const Color textPrimaryColor = Color(0xFF1F2937);

// --- Help & Support Screen Widget ---
class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: Center(
        child: Text(
          'Help & Support Screen',
          style: GoogleFonts.poppins(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
      ),
    );
  }
}
