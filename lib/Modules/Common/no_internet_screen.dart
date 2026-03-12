import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

/// A screen that is displayed when the user has no internet connection.
/// It automatically checks for connectivity periodically and navigates
/// back once the connection is restored.
class NoInternetPage extends StatefulWidget {
  final VoidCallback onRetry;
  const NoInternetPage({super.key, required this.onRetry});

  @override
  State<NoInternetPage> createState() => _NoInternetPageState();
}

class _NoInternetPageState extends State<NoInternetPage> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Start a periodic timer to check for connectivity every 2.5 seconds.
    _timer = Timer.periodic(const Duration(milliseconds: 2500), (timer) async {
      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult != ConnectivityResult.none) {
        // If connection is found, stop the timer and trigger the retry callback.
        _timer?.cancel();
        widget.onRetry();
      }
    });
  }

  @override
  void dispose() {
    // It's crucial to cancel the timer when the widget is disposed
    // to prevent memory leaks.
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.wifi_off_rounded,
                size: 80,
                color: textSecondaryColor,
              ),
              const SizedBox(height: 24),
              Text(
                'No Internet Connection',
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Please check your connection. We are automatically trying to reconnect.',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  color: textSecondaryColor,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              const CircularProgressIndicator(
                color: primaryColor,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
