import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../Providers/app_providers.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import '../Admin/RootPage.dart';
import '../Doctor/RootPage.dart';
import '../Pharmacist/root_page.dart';
import '../Pathologist/root_page.dart';
import 'LoginPage.dart';

// --- App Theme Colors ---


/// SplashPage: The initial loading screen of the application.
///
/// This widget is responsible for determining the user's authentication state
/// and navigating them to the correct initial screen (Login, Admin Home, or Doctor Home).
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  final AuthService _authService = AuthService.instance;


  @override
  void initState() {
    super.initState();
    // Use WidgetsBinding to ensure the context is available for navigation.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAuthStatus();
    });
  }

  /// Checks the user's authentication status and navigates accordingly.
  Future<void> _checkAuthStatus() async {
    // A short delay to ensure the splash screen is visible for a good user experience.
    await Future.delayed(const Duration(seconds: 2));

    // Get the AppProvider without listening for changes, as we only need to call a method.
    final appProvider = Provider.of<AppProvider>(context, listen: false);

    // Attempt to get user data using the stored token.
    final authResult = await _authService.getUserData();

    // Check if the widget is still mounted before navigating.
    if (!mounted) return;

    if (authResult != null) {
      // If we get a result, the user is logged in. Update the provider.
      appProvider.setUser(authResult.user, authResult.token);

      // Navigate based on the user's role.
      if (appProvider.isAdmin) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const AdminRootPage()),
        );
      } else if (appProvider.isDoctor) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const DoctorRootPage()),
        );
      } else if (appProvider.isPharmacist) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const PharmacistRootPage()),
        );
      } else if (appProvider.isPathologist) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const PathologistRootPage()),
        );
      } else {
        // Fallback for an unknown role, navigate to login.
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginPage()),
        );
      }
    } else {
      // If there's no result, the user is not logged in. Navigate to login.
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your App Logo/Name
            Text(
              'Karur Gastro Foundation',
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(
              color: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}


