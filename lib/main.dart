import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'Modules/Common/SplashPage.dart';
import 'Providers/app_providers.dart';

void main() async {
  // Ensure the Flutter engine is initialized before we run any async code.
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize SharedPreferences once at startup.
  final prefs = await SharedPreferences.getInstance();

  runApp(
    // This ProviderScope is our "provider switchboard".
    // It is the root that makes all providers available to the entire app.
    ProviderScope(
      overrides: [
        // We inject the SharedPreferences instance into our provider.
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const MyApp(),
    ),
  );
}

/// The root widget of the Hospital Management System application.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Hospital Management System',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF005A9C),
          primary: const Color(0xFF005A9C),
          secondary: const Color(0xFF1E88E5),
          background: const Color(0xFFF4F6F8),
          error: const Color(0xFFD32F2F),
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontSize: 57.0, fontWeight: FontWeight.bold),
          titleLarge: TextStyle(fontSize: 22.0, fontWeight: FontWeight.w600),
          bodyMedium: TextStyle(fontSize: 14.0),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF005A9C),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8.0),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          ),
        ),
      ),
      // The SplashPage is the intelligent entry point for the UI.
      home: const SplashPage(),
    );
  }
}
