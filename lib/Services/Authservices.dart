
import 'package:shared_preferences/shared_preferences.dart';

import '../Models/User.dart';
import '../Utils/Api_handler.dart';

/// A repository dedicated to handling all authentication-related logic.
class AuthRepository {
  final ApiService _apiService;
  final SharedPreferences _prefs;

  AuthRepository(this._apiService, this._prefs);

  /// Attempts to log in the user with the provided credentials.
  /// Returns the User object on success. Throws an ApiException on failure.
  Future<User> login(String email, String password) async {
    try {
      // 1. Make the API call to the /login endpoint.
      final responseData = await _apiService.post(
        'auth/login',
        body: {
          'email': email,
          'password': password,
        },
      );

      // 2. Extract the token and user data from the response.
      final token = responseData['token'] as String;
      final userData = responseData['user'] as Map<String, dynamic>;

      // 3. Save the authentication token securely to the device's storage.
      await _prefs.setString('x-auth-token', token);

      // 4. Update the ApiService with the new token for subsequent requests.
      _apiService.setAuthToken(token);

      // 5. Parse and return the User object.
      return User.fromMap(userData);
    } catch (e) {
      // If the ApiService throws an ApiException, we re-throw it so the UI can handle it.
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
