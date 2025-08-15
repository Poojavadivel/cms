import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../Models/User.dart';
import '../../Providers/app_providers.dart';
import 'LoginPage.dart';
import 'no_internet_screen.dart';

// TODO: Import your actual screen files
// import 'package:hms_project/screens/auth/login_page.dart';
// import 'package:hms_project/screens/admin/admin_home_page.dart';
// import 'package:hms_project/screens/doctor/doctor_home_page.dart';
// import 'package:hms_project/screens/patient/patient_home_page.dart';


/// An intelligent and visually appealing splash screen that acts as the
/// main gatekeeper for the application.
class SplashPage extends ConsumerWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // We now use the more reliable one-time future provider for the initial check.
    final initialConnectivity = ref.watch(initialConnectivityProvider);

    return initialConnectivity.when(
      data: (status) {
        // Check if the list of results contains mobile or wifi.
        final isOnline = status.contains(ConnectivityResult.mobile) ||
            status.contains(ConnectivityResult.wifi);

        if (!isOnline) {
          return const NoInternetScreen();
        }
        // If connection exists, proceed to the authentication phase.
        return const InitialDataGate();
      },
      loading: () => const _LoadingScreen(message: 'Checking Connectivity...'),
      error: (err, stack) => _ErrorScreen(message: 'Connectivity Error: $err'),
    );
  }
}

/// This widget handles the state of the authentication check.
/// It is only shown after a successful connectivity check.
class InitialDataGate extends ConsumerWidget {
  const InitialDataGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // We now watch our new, consolidated bootstrapProvider.
    // This is the single "get data" call.
    final bootstrapAsync = ref.watch(bootstrapProvider);

    return bootstrapAsync.when(
      data: (bootstrapData) {
        final user = bootstrapData.user;
        if (user != null) {
          // Role-based redirection logic based on the bootstrapped data.
          switch (user.role) {
            case UserRole.admin:
            // return const AdminHomePage();
              return const Scaffold(body: Center(child: Text("Admin Home Page")));
            case UserRole.doctor:
            // return const DoctorHomePage();
              return const Scaffold(body: Center(child: Text("Doctor Home Page")));
            case UserRole.patient:
            // return const PatientHomePage();
              return const Scaffold(body: Center(child: Text("Patient Home Page")));
            default:
            return const LoginPage();
          }
        }
        // If user is null, they are not logged in.
         return const LoginPage();
      },
      error: (err, stack) => _ErrorScreen(message: 'Failed to load application: $err'),
      loading: () => const _LoadingScreen(message: 'Initializing...'),
    );
  }
}

// --- Visually Enhanced Helper Widgets ---

class _LoadingScreen extends StatelessWidget {
  final String message;
  const _LoadingScreen({required this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_hospital_rounded, size: 80, color: theme.colorScheme.primary),
            const SizedBox(height: 40),
            SizedBox(
              width: 200,
              child: LinearProgressIndicator(
                color: theme.colorScheme.primary,
                backgroundColor: theme.colorScheme.primary.withOpacity(0.2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              message,
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.onBackground.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorScreen extends StatelessWidget {
  final String message;
  const _ErrorScreen({required this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 80, color: theme.colorScheme.error),
              const SizedBox(height: 24),
              Text('An Error Occurred', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onBackground.withOpacity(0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
