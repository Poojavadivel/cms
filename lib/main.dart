import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:glowhair/Modules/Common/SplashPage.dart';
import 'package:glowhair/Providers/app_providers.dart';

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
      title: 'Glow Skin & Gro Hair',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFff758c), // Using brand color
          primary: const Color(0xFFff758c),
          secondary: const Color(0xFFff7eb3),
          background: Colors.grey[50],
          error: const Color(0xFFD32F2F),
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontSize: 57.0, fontWeight: FontWeight.bold),
          titleLarge: TextStyle(fontSize: 22.0, fontWeight: FontWeight.w600),
          bodyMedium: TextStyle(fontSize: 14.0),
        ),
      ),
      // The SplashPage is the intelligent entry point for the UI.
      home: const SplashPage(),
    );
  }
}
