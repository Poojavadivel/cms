import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../Providers/app_providers.dart';

/// A visually appealing screen shown when the user has no internet connection.
/// It provides a clear message and a "Retry" button to re-check connectivity.
class NoInternetScreen extends ConsumerStatefulWidget {
  const NoInternetScreen({super.key});

  @override
  ConsumerState<NoInternetScreen> createState() => _NoInternetScreenState();
}

class _NoInternetScreenState extends ConsumerState<NoInternetScreen> {
  bool _isRetrying = false;

  /// This function handles the logic for the "Retry" button.
  Future<void> _handleRetry() async {
    // Set the state to show a loading indicator on the button.
    setState(() {
      _isRetrying = true;
    });

    // Manually check the current connectivity status.
    final connectivityResult = await Connectivity().checkConnectivity();

    // Small delay to make the loading indicator visible and feel responsive.
    await Future.delayed(const Duration(milliseconds: 500));

    // If the device is now online...
    if (connectivityResult.contains(ConnectivityResult.mobile) ||
        connectivityResult.contains(ConnectivityResult.wifi)) {
      // ...we invalidate the connectivityProvider. This is the correct
      // Riverpod way to force it to re-evaluate. The SplashPage is
      // listening to this provider and will automatically rebuild and
      // move the user forward once it gets the new "online" state.
      ref.invalidate(connectivityProvider);
    } else {
      // If still offline, show a feedback message to the user.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Still offline. Please check your connection.'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }

    // Reset the button's loading state.
    if (mounted) {
      setState(() {
        _isRetrying = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // An appealing and universally understood icon for no connection.
              Icon(
                Icons.wifi_off_rounded,
                size: 100,
                color: theme.colorScheme.secondary.withOpacity(0.7),
              ),
              const SizedBox(height: 32),

              // Clear and concise title.
              Text(
                'No Internet Connection',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onBackground,
                ),
              ),
              const SizedBox(height: 12),

              // Helpful instruction for the user.
              Text(
                'You are not connected to the internet. Make sure Wi-Fi or mobile data is on, then try again.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onBackground.withOpacity(0.7),
                ),
              ),
              const SizedBox(height: 48),

              // The primary call-to-action button.
              ElevatedButton.icon(
                onPressed: _isRetrying ? null : _handleRetry,
                icon: _isRetrying
                    ? Container(
                  width: 24,
                  height: 24,
                  padding: const EdgeInsets.all(2.0),
                  child: const CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 3,
                  ),
                )
                    : const Icon(Icons.refresh_rounded),
                label: Text(_isRetrying ? 'Checking...' : 'Retry'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(200, 50),
                  textStyle: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
