import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'Modules/Common/SplashPage.dart';
import 'Modules/Common/no_internet_screen.dart';
import 'Providers/app_providers.dart';
import 'dart:async';


void main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Pre-initialize SharedPreferences to avoid issues on web
  await SharedPreferences.getInstance();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: MaterialApp(
        title: 'Karur Gastro Foundation',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: const ConnectivityWrapper(),
      ),
    );
  }
}

/// A wrapper widget that handles connectivity status for the entire app.
class ConnectivityWrapper extends StatefulWidget {
  const ConnectivityWrapper({super.key});

  @override
  State<ConnectivityWrapper> createState() => _ConnectivityWrapperState();
}

class _ConnectivityWrapperState extends State<ConnectivityWrapper> {
  // Use a key to force the SplashPage to rebuild when connectivity is restored.
  Key _splashPageKey = UniqueKey();
  // Store the current connectivity status.
  ConnectivityResult _connectivityResult = ConnectivityResult.none;
  // A subscription to listen for network changes.
  late StreamSubscription<List<ConnectivityResult>> _connectivitySubscription;

  @override
  void initState() {
    super.initState();
    // Check the initial connectivity status.
    _checkInitialConnectivity();
    // Listen for subsequent changes.
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(_updateConnectionStatus);
  }

  @override
  void dispose() {
    // It's crucial to cancel the subscription to prevent memory leaks.
    _connectivitySubscription.cancel();
    super.dispose();
  }

  /// Checks the initial network state when the widget is first built.
  Future<void> _checkInitialConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    _updateConnectionStatus(result);
  }

  /// Updates the state based on the new connectivity status.
  void _updateConnectionStatus(List<ConnectivityResult> result) {
    // The package returns a list, check if 'none' is present.
    final hasConnection = !result.contains(ConnectivityResult.none);
    setState(() {
      _connectivityResult = hasConnection ? ConnectivityResult.wifi : ConnectivityResult.none;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_connectivityResult == ConnectivityResult.none) {
      // If there is no connection, show the NoInternetPage.
      return NoInternetPage(
        onRetry: () {
          // When connection is back, this will be called from the timer in NoInternetPage.
          setState(() {
            // Changing the key forces the SplashPage to be recreated.
            _splashPageKey = UniqueKey();
          });
        },
      );
    } else {
      // If there is a connection, show the SplashPage.
      return SplashPage(key: _splashPageKey);
    }
  }
}
