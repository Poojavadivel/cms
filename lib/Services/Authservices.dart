import 'package:shared_preferences/shared_preferences.dart';

import '../Models/User.dart';
import '../Utils/Api_handler.dart';

/// A repository dedicated to handling all authentication-related logic,
/// such as logging in, logging out, and fetching the current user's data.
class AuthRepository {
  final ApiService _apiService;
  final SharedPreferences _prefs;
  AuthRepository(this._apiService, this._prefs);
  /// Checks for a stored auth token and verifies it with the backend.
  /// Returns a [User] object if the token is valid, otherwise returns null.
  Future<User?> getCurrentUser() async {
    // 1. Check for a token in local storage.
    final token = _prefs.getString('x-auth-token');
    if (token == null || token.isEmpty) {
      return null; // No token, so no user is logged in.
    }

    try {
      // 2. Set the token for the ApiService to use in its headers for this request.
      _apiService.setAuthToken(token);

      // 3. Make the API call to a new endpoint to verify the token and get user data.
      //    This endpoint should be created on your Node.js server.
      final userData = await _apiService.get('auth/me');

      // 4. If successful, parse the user data and return a User object.
      return User.fromMap(userData);
    } catch (e) {
      // 5. If the token is invalid or any other API error occurs,
      //    the user is not authenticated.
      print('Token verification failed: $e');
      // It's good practice to clear an invalid token so we don't retry with it.
      await _prefs.remove('x-auth-token');
      return null;
    }
  }


}
