import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:glowhair/providers/app_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../Models/User.dart';
import '../Utils/Api_handler.dart';

// Provider to make the AuthRepository available throughout the app
final authRepositoryProvider = Provider((ref) {
  final apiService = ref.read(apiServiceProvider);
  final prefs = ref.read(sharedPreferencesProvider);
  return AuthRepository(apiService, prefs, ref);
});


/// A repository dedicated to handling all authentication-related logic.
class AuthRepository {
  final ApiService _apiService;
  final SharedPreferences _prefs;
  final Ref _ref;

  AuthRepository(this._apiService, this._prefs, this._ref);

  /// Attempts to log in the user with the provided credentials.
  /// Returns the User object on success. Throws an ApiException on failure.
  Future<User> login(String email, String password) async {
    try {
      // --- STEP 1: Perform the Login API Call ---
      final responseData = await _apiService.post(
        'auth/login',
        body: {'email': email, 'password': password},
      );

      final token = responseData['token'] as String;
      final userData = responseData['user'] as Map<String, dynamic>;

      await _prefs.setString('x-auth-token', token);
      _apiService.setAuthToken(token);

      final user = User.fromMap(userData);

      // --- STEP 2 (On Success): Call "get data" again ---
      // This tells the SplashPage to re-run its main data fetch,
      // which will now find the logged-in user and navigate correctly.
      _ref.invalidate(bootstrapProvider);

      return user;
    } catch (e) {
      // Rethrow the error to be handled by the LoginPage UI.
      rethrow;
    }
  }

  /// Checks for a stored auth token and verifies it with the backend.
  /// Returns a [User] object if the token is valid, otherwise returns null.
  Future<User?> getCurrentUser() async {
    final token = _prefs.getString('x-auth-token');
    if (token == null || token.isEmpty) {
      return null;
    }

    try {
      _apiService.setAuthToken(token);
      final userData = await _apiService.get('auth/me');
      return User.fromMap(userData);
    } catch (e) {
      await _prefs.remove('x-auth-token');
      return null;
    }
  }
}
