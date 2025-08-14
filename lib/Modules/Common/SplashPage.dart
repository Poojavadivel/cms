import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../Providers/app_providers.dart';
import 'no_internet_screen.dart';

// This will be our real login screen file.
// import 'package:hms_project/screens/auth/login_screen.dart';

/// An intelligent and visually appealing splash screen that acts as the
/// main gatekeeper for the application.
class SplashPage extends ConsumerWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Listen to the connectivity status to react in real-time.
    final connectivityStatus = ref.watch(connectivityProvider);

    // The .when() builder provides a clean way to handle the different
    // states of our async connectivity check.
    return connectivityStatus.when(
      data: (status) {
        // If there is no network connection, block the UI with our dedicated screen.
        if (status == ConnectivityResult.none) {
          return const NoInternetScreen();
        }
        // If connection exists, proceed to the data loading phase.
        return const InitialDataGate();
      },
      loading: () => const _LoadingScreen(message: 'Checking Connectivity...'),
      error: (err, stack) => _ErrorScreen(message: 'Connectivity Error: $err'),
    );
  }
}

/// This widget handles the state of the initial data fetch.
/// It is only shown after a successful connectivity check.
class InitialDataGate extends ConsumerWidget {
  const InitialDataGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // This is the "get data" call. We watch the provider to trigger it.
    final initialDataAsync = ref.watch(initialDataLoadProvider);

    return initialDataAsync.when(
      // State 1: Data has been successfully loaded.
      // This is where we will add the routing logic based on user role.
      data: (_) => const Scaffold(body: Center(child: Text("Login Screen Placeholder"))),
      // TODO: Replace with the actual LoginScreen when it's built.
      // data: (_) => const LoginScreen(),

      // State 2: An error occurred during the data fetch.
      error: (err, stack) => _ErrorScreen(message: 'Failed to load application data: $err'),

      // State 3: We are currently fetching the data. Show the loading UI.
      loading: () => const _LoadingScreen(message: 'Initializing HMS...'),
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
            // Placeholder for the hospital logo.
            // Replace with your actual logo asset.
            Icon(
              Icons.local_hospital_rounded,
              size: 80,
              color: theme.colorScheme.primary,
            ),
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
              Icon(
                Icons.error_outline_rounded,
                size: 80,
                color: theme.colorScheme.error,
              ),
              const SizedBox(height: 24),
              Text(
                'An Error Occurred',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
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
