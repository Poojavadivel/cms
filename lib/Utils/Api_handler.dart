import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // for MediaType (multipart)
import 'package:path/path.dart' as p;          // optional helper for filenames
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

  /// Performs a GET request (JSON).
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

  /// Performs a POST request (JSON).
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

  /// Performs a PUT request (JSON).
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

  /// Performs a DELETE request (JSON).
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

  // ============ NEW ============

  /// Multipart POST (for /scanner/upload).
  /// - `filesField` should be "files" (backend expects upload.array('files', 10))
  /// - `files` is a list of http.MultipartFile
  /// - Optional `fields` for extra form fields
  Future<dynamic> postMultipart(
      String endpoint, {
        required String filesField,
        required List<http.MultipartFile> files,
        Map<String, String>? fields,
        String? token,
      }) async {
    try {
      final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
      final request = http.MultipartRequest('POST', uri);

      // IMPORTANT: don't set Content-Type here; MultipartRequest sets boundary.
      if (token != null && token.isNotEmpty) {
        request.headers['x-auth-token'] = token;
      }

      // Add text fields (if any)
      if (fields != null && fields.isNotEmpty) {
        request.fields.addAll(fields);
      }

      // Add files
      // (The field name is the same for each file — that's correct for arrays)
      for (final f in files) {
        request.files.add(http.MultipartFile(
          filesField,            // "files"
          f.finalize(),          // stream
          f.length,
          filename: f.filename,
          contentType: f.contentType,
        ));
      }

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No Internet connection');
    } catch (e) {
      throw ApiException('An unexpected error occurred: $e');
    }
  }

  /// GET bytes (for /scanner/pdf/:id).
  /// Returns Uint8List; caller decides how to display/save.
  Future<Uint8List> getBytes(String endpoint, {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}$endpoint'),
        headers: _getBinaryHeaders(token),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.bodyBytes;
      }

      // Try parse error JSON if possible
      try {
        final body = response.body.isNotEmpty ? json.decode(response.body) : null;
        final errorCode = (body is Map) ? body['errorCode'] as int? : null;
        if (errorCode != null) {
          throw ApiException(ApiErrors.getMessage(errorCode));
        } else {
          throw ApiException((body is Map ? body['message'] : null) ??
              'Unexpected status code: ${response.statusCode}');
        }
      } catch (_) {
        throw ApiException('Unexpected status code: ${response.statusCode}');
      }
    } on SocketException {
      throw ApiException('No Internet connection');
    } catch (e) {
      throw ApiException('An unexpected error occurred: $e');
    }
  }

  // --- Private Helper Methods ---
  Map<String, String> _getHeaders(String? token) {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (token != null) headers['x-auth-token'] = token;
    return headers;
  }

  // For binary GET (don’t force JSON content-type)
  Map<String, String> _getBinaryHeaders(String? token) {
    final headers = <String, String>{};
    if (token != null) headers['x-auth-token'] = token;
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

    dynamic responseBody;
    try {
      responseBody = json.decode(response.body);
    } catch (_) {
      // Not JSON; treat non-2xx as error
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.body; // raw string
      }
      throw ApiException('Unexpected non-JSON response: ${response.statusCode}');
    }

    switch (response.statusCode) {
      case 200:
      case 201:
        return responseBody;
      case 400:
      case 401:
      case 403:
      case 404:
      case 500:
        final errorCode = (responseBody is Map) ? responseBody['errorCode'] as int? : null;
        if (errorCode != null) {
          throw ApiException(ApiErrors.getMessage(errorCode));
        } else {
          throw ApiException(
            (responseBody is Map ? responseBody['message'] : null) ??
                'An unknown server error occurred.',
          );
        }
      default:
        throw ApiException(
            'Received an unexpected status code: ${response.statusCode}');
    }
  }

  // ---------- OPTIONAL helpers (if you want to build MultipartFile here) ----------

  /// Convenience: turn a dart:io File into a MultipartFile for postMultipart.
  Future<http.MultipartFile> fileToPart(File file, {String fieldName = 'files'}) async {
    final bytes = await file.readAsBytes();
    final filename = p.basename(file.path);
    final mime = _guessMimeFromName(filename);
    return http.MultipartFile.fromBytes(
      fieldName,
      bytes,
      filename: filename,
      contentType: mime != null ? MediaType.parse(mime) : null,
    );
  }

  String? _guessMimeFromName(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    return null;
  }
}
