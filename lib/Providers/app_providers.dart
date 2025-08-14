import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../Models/Doctor.dart';

// -- Service Providers --

/// Provider for SharedPreferences.
/// It's initialized in main.dart, so it will never throw this exception.
/// This allows other providers to read from SharedPreferences.
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('SharedPreferences provider was not overridden');
});

/// Provider for Connectivity.
/// This uses a StreamProvider to continuously listen for and broadcast
/// network connectivity changes throughout the app.
final connectivityProvider = StreamProvider<ConnectivityResult>((ref) {
  // .map() is used to ensure we always get a single result from the list.
  return Connectivity().onConnectivityChanged.map((results) => results.first);
});


// -- Data Fetching Providers --

/// Provider for the initial data load.
/// This is where we will fetch essential data like doctor lists, services, etc.
/// when the app starts. It returns 'true' on success.
final initialDataLoadProvider = FutureProvider<bool>((ref) async {
  // In a real app, you would call your API services here:
  // final doctorList = await ref.read(doctorApiServiceProvider).fetchDoctors();
  // ref.read(doctorProvider.notifier).setDoctors(doctorList);

  // We simulate a network call for 2 seconds.
  await Future.delayed(const Duration(seconds: 2));

  print("Initial data loaded successfully.");
  return true;
});


// -- State Notifier Providers (for UI state) --

/// Provider for managing Admin-related state.
/// This could hold lists of all users, system settings, etc.
final adminProvider = StateNotifierProvider<AdminNotifier, AdminState>((ref) {
  return AdminNotifier();
});

/// Provider for managing Doctor-related state.
/// This will hold the list of all doctors in the system.
final doctorProvider = StateNotifierProvider<DoctorNotifier, DoctorState>((ref) {
  return DoctorNotifier();
});

// --- State and Notifier Classes ---

// A simple state class for the Admin provider.
class AdminState {
  // Add properties here, e.g., list of all users
  const AdminState();
}

// The Notifier for the Admin state.
class AdminNotifier extends StateNotifier<AdminState> {
  AdminNotifier() : super(const AdminState());

// Add methods here to update the state, e.g., fetchAllUsers()
}

// A state class for the Doctor provider.
class DoctorState {
  final List<Doctor> doctors;
  const DoctorState({this.doctors = const []});
}

// The Notifier for the Doctor state.
class DoctorNotifier extends StateNotifier<DoctorState> {
  DoctorNotifier() : super(const DoctorState());

  // Method to update the list of doctors
  void setDoctors(List<Doctor> doctors) {
    state = DoctorState(doctors: doctors);
  }
}
