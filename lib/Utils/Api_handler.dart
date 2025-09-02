import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../Services/Constants.dart';

/// A custom exception class to handle API-specific errors.
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

/// ApiHandler: A singleton class to manage all network requests.
class ApiHandler {
  // --- Singleton Setup ---
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
        body: body != null ? json.encode(body) : null,
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No Internet connection');
    } catch (e) {
      throw ApiException('An unexpected error occurred: $e');
    }
  }

  /// Performs a PUT request (update).
  Future<dynamic> put(String endpoint, {Map<String, dynamic>? body, String? token}) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: _getHeaders(token),
        body: body != null ? json.encode(body) : null,
      );
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No Internet connection');
    } catch (e) {
      throw ApiException('An unexpected error occurred: $e');
    }
  }

  /// Performs a DELETE request.
  Future<dynamic> delete(String endpoint, {String? token}) async {
    try {
      final response = await http.delete(
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

  // --- Private Helper Methods ---
  Map<String, String> _getHeaders(String? token) {
    Map<String, String> headers = {
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (token != null) {
      headers['x-auth-token'] = token;
    }
    return headers;
  }

  dynamic _handleResponse(http.Response response) {
    if (response.body.isEmpty) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {};
      } else {
        throw ApiException(
            'Received an empty response with status code: ${response.statusCode}');
      }
    }

    final responseBody = json.decode(response.body);

    switch (response.statusCode) {
      case 200:
      case 201:
        return responseBody;
      case 400:
      case 401:
      case 403:
      case 404:
      case 500:
        final errorCode = responseBody['errorCode'] as int?;
        if (errorCode != null) {
          throw ApiException(ApiErrors.getMessage(errorCode));
        } else {
          throw ApiException(responseBody['message'] ??
              'An unknown server error occurred.');
        }
      default:
        throw ApiException(
            'Received an unexpected status code: ${response.statusCode}');
    }
  }
}
