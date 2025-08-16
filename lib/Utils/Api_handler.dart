import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../Services/Constants.dart';
 // Your file with API constants

/// A custom exception class to handle API-specific errors.
/// This allows the UI to catch and display friendly error messages.
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

/// ApiHandler: A singleton class to manage all network requests.
///
/// This class centralizes HTTP logic, including header management,
/// request execution, and response/error handling.
class ApiHandler {
  // --- Singleton Setup ---
  // This ensures that only one instance of ApiHandler exists in the app.
  ApiHandler._privateConstructor();
  static final ApiHandler _instance = ApiHandler._privateConstructor();
  static ApiHandler get instance => _instance;

  // --- Core Methods ---

  /// Performs a GET request.
  Future<dynamic> get(String endpoint, {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: _getHeaders(token),
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No Internet connection');
    } catch (e) {
      throw ApiException('An unexpected error occurred: $e');
    }
  }

  /// Performs a POST request.
  Future<dynamic> post(String endpoint, {Map<String, dynamic>? body, String? token}) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: _getHeaders(token),
        // CORRECTED: Only encode the body if it's not null.
        body: body != null ? json.encode(body) : null,
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No Internet connection');
    } catch (e) {
      throw ApiException('An unexpected error occurred: $e');
    }
  }

  // --- Private Helper Methods ---

  /// Constructs the standard headers for API requests.
  /// Includes the authentication token if one is provided.
  Map<String, String> _getHeaders(String? token) {
    Map<String, String> headers = {
      'Content-Type': 'application/json; charset=UTF-8',
    };
    // In a real app, you would get the token from your AppProvider.
    // For now, we'll pass it in directly.
    if (token != null) {
      headers['x-auth-token'] = token;
    }
    return headers;
  }

  /// Processes the http.Response and handles success or error cases.
  dynamic _handleResponse(http.Response response) {
    // Handle cases where the response body might be empty
    if (response.body.isEmpty) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {}; // Return an empty map for successful but empty responses
      } else {
        throw ApiException('Received an empty response with status code: ${response.statusCode}');
      }
    }

    final responseBody = json.decode(response.body);

    switch (response.statusCode) {
      case 200: // OK
      case 201: // Created
      // The request was successful, return the data.
        return responseBody;
      case 400: // Bad Request
      case 401: // Unauthorized
      case 403: // Forbidden
      case 404: // Not Found
      case 500: // Internal Server Error
      // The server responded with an error. We extract the error code
      // and throw our custom ApiException with a user-friendly message.
        final errorCode = responseBody['errorCode'] as int?;
        if (errorCode != null) {
          throw ApiException(ApiErrors.getMessage(errorCode));
        } else {
          throw ApiException(responseBody['message'] ?? 'An unknown server error occurred.');
        }
      default:
      // Handle other unexpected status codes.
        throw ApiException('Received an unexpected status code: ${response.statusCode}');
    }
  }
}
