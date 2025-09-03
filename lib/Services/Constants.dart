import 'package:flutter/material.dart';

/// A simple model class to represent a REST API endpoint,
/// containing its URL and HTTP method.
class RestApi {
  final String url;
  final String method;

  RestApi({
    required this.url,
    required this.method,
  });
}

/// A centralized class for application-wide constants.
class ApiConstants {
  // --- Base URL ---
  /// The base URL for the backend API.
  /// Change this to your actual server address during development/production.
   //static const String baseUrl = "http://10.40.68.132:3000";
 static const String baseUrl = "https://glowhair-skin.onrender.com";// <-- IMPORTANT: Replace with your actual backend URL

  // --- HTTP Methods ---
  static const String post = 'POST';
  static const String get = 'GET';
  static const String put = 'PUT';
  static const String delete = 'DELETE';
}

/// Contains all API endpoint definitions.
class ApiEndpoints {
  /// Endpoint for user login.
  static RestApi login() => RestApi(url: '/api/auth/login', method: ApiConstants.post);

  /// Endpoint to validate an existing authentication token.
  static RestApi validateToken() => RestApi(url: '/api/auth/validate-token', method: ApiConstants.post);


  static RestApi createAppointment() =>
      RestApi(url: '/api/appointments', method: ApiConstants.post);
  static RestApi getAppointments() =>
      RestApi(url: '/api/appointments', method: ApiConstants.get);
  static RestApi deleteAppointment(String id) =>
      RestApi(url: '/api/appointments/$id', method: ApiConstants.delete);


}

/// Maps backend error codes to user-friendly messages.
class ApiErrors {
  static final Map<int, String> _errorMessages = {
    1001: 'An account with this email already exists.',
    1002: 'No account found with this email address.',
    1003: 'The password you entered is incorrect. Please try again.',
    1004: 'Your session has expired. Please log in again.',
    1005: 'This account has been suspended. Please contact support.',
    5000: 'An unexpected error occurred on the server. Please try again later.',
  };

  /// Returns a user-friendly error message for a given backend error code.
  static String getMessage(int code) {
    return _errorMessages[code] ?? 'A network error occurred. Please check your connection and try again.';
  }
}
