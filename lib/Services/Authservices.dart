import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../Models/Admin.dart';
import '../Models/Doctor.dart';
import '../Models/User.dart';
import '../Utils/Api_handler.dart';
import 'constants.dart';


/// A result object to safely return data from authentication methods.
class AuthResult {
  final dynamic user;
  final String token;

  AuthResult({required this.user, required this.token});
}

/// AuthService: Orchestrates the entire authentication flow.
///
/// This service acts as a bridge between the UI and the low-level ApiHandler.
/// It contains the business logic for signing in, signing out, and validating
/// a user's session on app startup.
class AuthService {
  final ApiHandler _apiHandler = ApiHandler.instance;

  /// Signs in the user with their email and password.
  ///
  /// On success, it saves the auth token and returns an [AuthResult]
  /// containing the user's profile (Admin or Doctor) and the token.
  /// On failure, it throws an [ApiException] with a user-friendly message.
  Future<AuthResult> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiHandler.post(
        ApiEndpoints.login().url,
        body: {
          'email': email,
          'password': password,
        },
      );

      // Extract token and user data from the successful response
      final String token = response['token'];
      final Map<String, dynamic> userData = response['user'];

      // Save the token to persistent storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('x-auth-token', token);

      // Create the appropriate user model based on the role
      final user = _parseUserRole(userData);

      return AuthResult(user: user, token: token);
    } on ApiException catch (e) {
      // --- ADDED FOR DEBUGGING ---
      // This will print the user-friendly error message from your ApiHandler.
      print('ApiException caught: ${e.message}');
      // Re-throw the API exception to be handled by the UI
      rethrow;
    } catch (e) {
      // --- ADDED FOR DEBUGGING ---
      // This will print any other unexpected errors (network issues, parsing errors, etc.).
      print('An unexpected error occurred: $e');
      // Catch any other unexpected errors
      throw ApiException('An unexpected error occurred during login.');
    }
  }

  /// Retrieves and validates the user's data using a stored token.
  ///
  /// This is called on the SplashPage to check if a user is already logged in.
  /// Returns an [AuthResult] if the token is valid, otherwise returns null.
  Future<AuthResult?> getUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? token = prefs.getString('x-auth-token');

      // If no token is found, the user is not logged in.
      if (token == null) {
        return null;
      }

      // Validate the token with the backend
      final response = await _apiHandler.post(
        ApiEndpoints.validateToken().url,
        token: token,
      );

      // The token is valid, create the user model from the response
      final user = _parseUserRole(response);

      return AuthResult(user: user, token: token);
    } catch (e) {
      // Any exception (ApiException for invalid token, network error, etc.)
      // means the session is not valid.
      return null;
    }
  }

  /// Signs the user out by clearing their session token.
  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('x-auth-token');
  }

  /// A private helper to parse the user data map and create the correct
  /// Admin or Doctor model based on the 'role' field.
  dynamic _parseUserRole(Map<String, dynamic> userData) {
    // First, create a base User to safely check the role
    final baseUser = User.fromMap(userData);

    if (baseUser.role == UserRole.admin) {
      return Admin(userProfile: baseUser);
    } else if (baseUser.role == UserRole.doctor) {
      return Doctor.fromMap(userData);
    } else {
      // This should not happen with a well-formed API, but it's a safe fallback.
      throw ApiException('Invalid user role received from server.');
    }
  }
}
