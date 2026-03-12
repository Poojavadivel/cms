import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart' as dio;
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // for MediaType (multipart)
import 'package:path/path.dart' as p;          // optional helper for filenames
import '../Services/api_constants.dart';
import 'dio_client.dart';

/// A custom exception class to handle API-specific errors.
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

/// ApiHandler: A singleton class to manage all network requests using Dio for speed.
/// Maintains backward compatibility with existing http-based code.
class ApiHandler {
  // --- Singleton Setup ---
  ApiHandler._privateConstructor();
  static final ApiHandler _instance = ApiHandler._privateConstructor();
  static ApiHandler get instance => _instance;
  
  // Use Dio for faster requests
  final DioClient _dioClient = DioClient.instance;

  // --- Core Methods (Now powered by Dio for speed) ---

  /// Performs a GET request (JSON).
  Future<dynamic> get(String endpoint, {String? token}) async {
    try {
      final response = await _dioClient.get(
        endpoint,
        options: token != null ? dio.Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleDioResponse(response);
    } catch (e) {
      throw _convertToDioException(e);
    }
  }

  /// Performs a POST request (JSON).
  Future<dynamic> post(String endpoint, {Map<String, dynamic>? body, String? token}) async {
    try {
      final response = await _dioClient.post(
        endpoint,
        data: body,
        options: token != null ? dio.Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleDioResponse(response);
    } catch (e) {
      throw _convertToDioException(e);
    }
  }

  /// Performs a PUT request (JSON).
  Future<dynamic> put(String endpoint, {Map<String, dynamic>? body, String? token}) async {
    try {
      final response = await _dioClient.put(
        endpoint,
        data: body,
        options: token != null ? dio.Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleDioResponse(response);
    } catch (e) {
      throw _convertToDioException(e);
    }
  }

  /// Performs a DELETE request (JSON).
  Future<dynamic> delete(String endpoint, {String? token}) async {
    try {
      final response = await _dioClient.delete(
        endpoint,
        options: token != null ? dio.Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleDioResponse(response);
    } catch (e) {
      throw _convertToDioException(e);
    }
  }

  /// Performs a PATCH request (JSON).
  Future<dynamic> patch(String endpoint, {Map<String, dynamic>? body, String? token}) async {
    try {
      final response = await _dioClient.patch(
        endpoint,
        data: body,
        options: token != null ? dio.Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleDioResponse(response);
    } catch (e) {
      throw _convertToDioException(e);
    }
  }

  // ============ FILE UPLOAD (Using Dio for speed) ============

  /// Multipart POST (for /scanner/upload).
  /// - `filesField` should be "files" (backend expects upload.array('files', 10))
  /// - `files` is a list of http.MultipartFile (converted internally to Dio)
  /// - Optional `fields` for extra form fields
  Future<dynamic> postMultipart(
      String endpoint, {
        required String filesField,
        required List<http.MultipartFile> files,
        Map<String, String>? fields,
        String? token,
      }) async {
    try {
      // Convert http.MultipartFile to Dio MultipartFile
      final dioFiles = await Future.wait(files.map((f) async {
        final bytes = await f.finalize().toBytes();
        return dio.MultipartFile.fromBytes(
          bytes,
          filename: f.filename,
          contentType: f.contentType != null 
            ? dio.DioMediaType(f.contentType!.mimeType, f.contentType!.subtype)
            : null,
        );
      }));

      final response = await _dioClient.uploadFiles(
        endpoint,
        files: dioFiles,
        fieldName: filesField,
        data: fields,
      );
      return _handleDioResponse(response);
    } catch (e) {
      throw _convertToDioException(e);
    }
  }

  /// GET bytes (for /scanner/pdf/:id).
  /// Returns Uint8List; caller decides how to display/save.
  Future<Uint8List> getBytes(String endpoint, {String? token}) async {
    try {
      final response = await _dioClient.get(
        endpoint,
        options: dio.Options(
          responseType: dio.ResponseType.bytes,
          headers: token != null ? {'x-auth-token': token} : null,
        ),
      );

      if (response.statusCode! >= 200 && response.statusCode! < 300) {
        if (response.data is Uint8List) {
          return response.data as Uint8List;
        } else if (response.data is List<int>) {
          return Uint8List.fromList(response.data as List<int>);
        }
        throw ApiException('Unexpected response type for binary data');
      }

      throw ApiException('Failed to fetch binary data: ${response.statusCode}');
    } catch (e) {
      throw _convertToDioException(e);
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

  // --- Dio Response Handling ---
  
  dynamic _handleDioResponse(dio.Response response) {
    final statusCode = response.statusCode ?? 0;

    if (statusCode >= 200 && statusCode < 300) {
      return response.data ?? {};
    }

    // Handle error responses
    final responseBody = response.data;
    if (responseBody is Map) {
      final errorCode = responseBody['errorCode'] as int?;
      if (errorCode != null) {
        throw ApiException(ApiErrors.getMessage(errorCode));
      }
      final errorMsg = responseBody['error'] ?? responseBody['message'] ?? responseBody['msg'];
      if (errorMsg != null) {
        throw ApiException(errorMsg.toString());
      }
    }

    throw ApiException('Request failed with status: $statusCode');
  }

  ApiException _convertToDioException(dynamic error) {
    if (error is ApiException) return error;
    
    if (error is dio.DioException) {
      switch (error.type) {
        case dio.DioExceptionType.connectionTimeout:
        case dio.DioExceptionType.sendTimeout:
        case dio.DioExceptionType.receiveTimeout:
          return ApiException('Connection timeout. Please check your internet.');
        case dio.DioExceptionType.connectionError:
          return ApiException('No Internet connection');
        case dio.DioExceptionType.badResponse:
          final data = error.response?.data;
          if (data is Map) {
            final msg = data['error'] ?? data['message'] ?? data['msg'];
            if (msg != null) return ApiException(msg.toString());
          }
          return ApiException('Request failed: ${error.response?.statusCode}');
        default:
          return ApiException('An unexpected error occurred: ${error.message}');
      }
    }
    
    return ApiException('An unexpected error occurred: $error');
  }
}
