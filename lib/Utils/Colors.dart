import 'package:flutter/material.dart';

/// Centralized color system for consistency across the app
/// Keeps semantic tokens and brand colors in one place for easy maintenance.
class AppColors {
  AppColors._();

  // ---------------------------------------------------------------------------
  // Primary palette (Enterprise Blue family)
  // ---------------------------------------------------------------------------
  static const Color primary = Color(0xFF1E3A72);     // enterprise blue
  static const Color primary600 = Color(0xFF2F5BA0);  // medium blue
  static const Color primary700 = Color(0xFF264E86);  // darker blue
  static const Color primary800 = Color(0xFF1A365D);  // deep corporate blue

  // ---------------------------------------------------------------------------
  // Background / surfaces
  // ---------------------------------------------------------------------------
  static const Color background = Color(0xFFF9FAFB); // gray-50
  static const Color kBg = Color(0xFFF8FAFC);        // slate-50
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color kCard = cardBackground;

  // ---------------------------------------------------------------------------
  // Alternates / table rows
  // ---------------------------------------------------------------------------
  static const Color rowAlternate = Color(0xFFEFF6FF); // light blue tint

  // ---------------------------------------------------------------------------
  // Text (slate)
  // ---------------------------------------------------------------------------
  static const Color kTextPrimary = Color(0xFF1E293B);   // slate-800
  static const Color kTextSecondary = Color(0xFF64748B); // slate-500
  static const Color muted = Color(0xFF6B7280);          // gray-500
  static const Color textDark = Color(0xFF1F2937);       // gray-900
  static const Color textLight = Color(0xFF6B7280);      // gray-500
  static const Color bgGray = Color(0xFFF9FAFB);         // gray-50

  // ---------------------------------------------------------------------------
  // Semantic
  // ---------------------------------------------------------------------------
  static const Color kSuccess = Color(0xFF22C55E);   // green-500
  static const Color kDanger = Color(0xFFDC2626);    // red-600
  static const Color kWarning = Color(0xFFF59E0B);   // amber-500
  static const Color kInfo = primary600;             // enterprise blue
  static const Color kMuted = Color(0xFFE2E8F0);     // gray-200

  // ---------------------------------------------------------------------------
  // Brand-specific
  // ---------------------------------------------------------------------------
  static const Color kCFBlue = primary;              // reuse main brand blue

  // ---------------------------------------------------------------------------
  // UI elements
  // ---------------------------------------------------------------------------
  static const Color appointmentsHeader = primary700;
  static const Color tableHeader = primary800;
  static const Color searchBorder = Color(0xFF93C5FD); // blue-300
  static const Color buttonBg = primary600;
  static const Color statusIncomplete = primary600;

  // Accent (kept for specific highlights if needed)
  static const Color accentPink = Color(0xFFFF4081);

  // ---------------------------------------------------------------------------
  // Grey scale explicit constants (non-null)
  // ---------------------------------------------------------------------------
  static const Color grey50 = Color(0xFFF9FAFB);
  static const Color grey100 = Color(0xFFF3F4F6);
  static const Color grey200 = Color(0xFFE5E7EB);
  static const Color grey300 = Color(0xFFD1D5DB);
  static const Color grey400 = Color(0xFF9CA3AF);
  static const Color grey500 = Color(0xFF6B7280);
  static const Color grey600 = Color(0xFF4B5563);
  static const Color grey700 = Color(0xFF374151);
  static const Color grey800 = Color(0xFF1F2937);

  // ---------------------------------------------------------------------------
  // Misc / helpers
  // ---------------------------------------------------------------------------
  static const Color transparent = Colors.transparent;
  static const Color white = Colors.white;
  static const Color white70 = Color(0xB3FFFFFF); // 70% white

  // ---------------------------------------------------------------------------
  // Brand gradient (Enterprise Blue gradient)
  // ---------------------------------------------------------------------------
  static const Gradient brandGradient = LinearGradient(
    colors: [Color(0xFF1E3A72), Color(0xFF2F5BA0)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Small list of greys to pick from for deterministic painters / captcha
  static const List<Color> captchaGreyVariants = [
    grey300,
    grey400,
    grey600,
  ];

  // ---------------------------------------------------------------------------
  // Material color helper for themes / buttons
  // ---------------------------------------------------------------------------
  static MaterialColor toMaterialPrimary() {
    return MaterialColor(primary.value, <int, Color>{
      50: Color(0xFFEFF6FF),
      100: Color(0xFFDBEAFE),
      200: Color(0xFFBFDBFE),
      300: Color(0xFF93C5FD),
      400: Color(0xFF60A5FA),
      500: primary,
      600: primary600,
      700: primary700,
      800: primary800,
      900: Color(0xFF172554),
    });
  }
}
