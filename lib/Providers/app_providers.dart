import 'package:connectivity_plus/connectivity_plus.dart';

import '../Models/Doctor.dart';
import '../Models/User.dart';
import '../Services/Authservices.dart';
import '../Utils/Api_handler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// A simple class to hold all the initial data fetched at startup.
// This mirrors the consolidated response from your server.
class BootstrapData {
  final User? user;
  // final List<News> news; // Future: Add other data here
  // final List<Plan> plans; // Future: Add other data here

  BootstrapData({this.user});
}

// -- Service Providers --

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError();
});

final initialConnectivityProvider = FutureProvider<List<ConnectivityResult>>((ref) {
  return Connectivity().checkConnectivity();
});

final connectivityProvider = StreamProvider<ConnectivityResult>((ref) {
  return Connectivity().onConnectivityChanged.map((results) => results.first);
});

final apiServiceProvider = Provider((ref) => ApiService());

// --- FIX APPLIED HERE ---
final authRepositoryProvider = Provider((ref) {
  final apiService = ref.read(apiServiceProvider);
  final prefs = ref.read(sharedPreferencesProvider);
  // The 'ref' object is now correctly passed as the third argument.
  return AuthRepository(apiService, prefs, ref);
});


// -- Core Bootstrap Provider --

/// This is now our main "get data" call, as you requested.
/// It fetches all necessary data for the app to start in a single, consolidated operation.
final bootstrapProvider = FutureProvider<BootstrapData>((ref) async {
  final authRepository = ref.watch(authRepositoryProvider);

  // 1. Fetch the current user's authentication status.
  final user = await authRepository.getCurrentUser();

  // 2. In the future, fetch other essential data here (e.g., news, plans).
  // final news = await ref.read(newsRepositoryProvider).fetchLatestNews();
  // final plans = await ref.read(plansRepositoryProvider).fetchAllPlans();

  // 3. Return all the data bundled together.
  return BootstrapData(user: user);
});


// -- State Notifier Providers (for UI state) --

final adminProvider = StateNotifierProvider<AdminNotifier, AdminState>((ref) {
  return AdminNotifier();
});

final doctorProvider = StateNotifierProvider<DoctorNotifier, DoctorState>((ref) {
  return DoctorNotifier();
});

// --- State and Notifier Classes ---

class AdminState {
  const AdminState();
}

class AdminNotifier extends StateNotifier<AdminState> {
  AdminNotifier() : super(const AdminState());
}

class DoctorState {
  final List<Doctor> doctors;
  const DoctorState({this.doctors = const []});
}

class DoctorNotifier extends StateNotifier<DoctorState> {
  DoctorNotifier() : super(const DoctorState());

  void setDoctors(List<Doctor> doctors) {
    state = DoctorState(doctors: doctors);
  }
}
