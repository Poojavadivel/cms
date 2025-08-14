import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

// A custom exception class for our API errors.
// This allows us to catch specific, meaningful errors in our UI.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);

  @override
  String toString() =>
      'ApiException: $message ${statusCode != null ? "(Status code: $statusCode)" : ""}';
}

/// The core service responsible for all HTTP communication.
/// It handles request creation, response processing, and centralized error handling.
class ApiService {
  // We will use a real base URL for the Node.js server.
  final String _baseUrl = "http://10.0.2.2:3000/api"; // 10.0.2.2 is localhost for Android emulator

  // The http client should be passed in or created internally.
  final http.Client _client;

  // Private constructor for the singleton pattern
  ApiService._internal(this._client);

  // The single instance of the service
  static final ApiService _instance = ApiService._internal(http.Client());

  // Factory constructor to return the same instance
  factory ApiService() {
    return _instance;
  }

  // We can add a method to update the token later
  String _authToken = "";
  void setAuthToken(String token) {
    _authToken = token;
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json; charset=UTF-8',
    'x-auth-token': _authToken,
  };

  /// The primary GET request handler.
  Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('$_baseUrl/$endpoint');
    try {
      final response = await _client.get(uri, headers: _headers);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No Internet connection.');
    } on HttpException {
      throw ApiException('Could not find the resource.');
    } on FormatException {
      throw ApiException('Bad response format.');
    }
  }

  /// The primary POST request handler.
  Future<dynamic> post(String endpoint, {required Map<String, dynamic> body}) async {
    final uri = Uri.parse('$_baseUrl/$endpoint');
    try {
      final response = await _client.post(uri, headers: _headers, body: json.encode(body));
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No Internet connection.');
    } on HttpException {
      throw ApiException('Could not find the resource.');
    } on FormatException {
      throw ApiException('Bad response format.');
    }
  }

  // We can add PUT, DELETE methods here following the same pattern.

  /// Centralized response handler. It checks the status code and throws
  /// an ApiException for any non-successful responses.
  dynamic _handleResponse(http.Response response) {
    final decodedJson = json.decode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      // If the request was successful, return the decoded JSON body.
      return decodedJson;
    } else {
      // If the server returned an error, extract the message from the body
      // and throw our custom exception.
      final errorMessage = decodedJson['message'] ?? 'An unknown error occurred.';
      throw ApiException(errorMessage, response.statusCode);
    }
  }
}
