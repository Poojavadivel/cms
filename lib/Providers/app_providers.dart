import 'package:flutter/material.dart';
import '../Models/Admin.dart';
import '../Models/Doctor.dart';
import '../Models/Pharmacist.dart';
import '../Models/Pathologist.dart';


/// AppProvider: The central state management class for the application.
///
/// This class extends ChangeNotifier, allowing it to broadcast changes to any
/// widget that is listening. It holds the authentication state and the profile
/// of the currently logged-in user.
class AppProvider extends ChangeNotifier {
  // The user object can be an Admin, a Doctor, Pharmacist, Pathologist, or null if logged out.
  // Using 'dynamic' allows for this flexibility.
  dynamic _user;

  // The authentication token received from the backend.
  String? _token;

  // --- Getters ---
  // These provide a safe, read-only way for the UI to access the current state.

  /// Returns the current user object (Admin, Doctor, Pharmacist, or Pathologist).
  /// Returns null if no user is logged in.
  dynamic get user => _user;

  /// Returns the authentication token.
  String? get token => _token;

  /// A quick boolean check to see if a user is currently logged in.
  bool get isLoggedIn => _user != null && _token != null;

  /// A type-safe check to determine if the current user is an Admin.
  bool get isAdmin => _user is Admin;

  /// A type-safe check to determine if the current user is a Doctor.
  bool get isDoctor => _user is Doctor;

  /// A type-safe check to determine if the current user is a Pharmacist.
  bool get isPharmacist => _user is Pharmacist;

  /// A type-safe check to determine if the current user is a Pathologist.
  bool get isPathologist => _user is Pathologist;

  // --- Methods ---
  // These methods are used to modify the state.

  /// Updates the provider with the logged-in user's data and token.
  ///
  /// This method should be called by the AuthService after a successful
  /// login or when validating an existing session. It triggers a UI update.
  void setUser(dynamic user, String token) {
    _user = user;
    _token = token;
    // This is the most important call. It tells all listening widgets
    // that the state has changed and they need to rebuild.
    notifyListeners();
  }

  /// Clears the user session data.
  ///
  /// This should be called on logout. It resets the state and triggers a
  /// UI update, which will typically navigate the user to the login screen.
  void signOut() {
    _user = null;
    _token = null;
    notifyListeners();
  }
}
