import 'dart:convert';
import 'package:dio/dio.dart';
import 'dio_client.dart';
import '../Services/api_constants.dart';

/// DioApiHandler: Drop-in replacement for ApiHandler using Dio
/// Provides the same interface as ApiHandler but with Dio's performance benefits
class DioApiHandler {
  // Singleton Setup
  DioApiHandler._privateConstructor();
  static final DioApiHandler _instance = DioApiHandler._privateConstructor();
  static DioApiHandler get instance => _instance;

  final DioClient _dioClient = DioClient.instance;

  // ==================== Core Methods ====================

  /// Performs a GET request
  Future<dynamic> get(String endpoint, {String? token}) async {
    try {
      final response = await _dioClient.get(
        endpoint,
        options: token != null ? Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      rethrow;
    }
  }

  /// Performs a POST request
  Future<dynamic> post(
    String endpoint, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    try {
      final response = await _dioClient.post(
        endpoint,
        data: body,
        options: token != null ? Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      rethrow;
    }
  }

  /// Performs a PUT request
  Future<dynamic> put(
    String endpoint, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    try {
      final response = await _dioClient.put(
        endpoint,
        data: body,
        options: token != null ? Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      rethrow;
    }
  }

  /// Performs a DELETE request
  Future<dynamic> delete(String endpoint, {String? token}) async {
    try {
      final response = await _dioClient.delete(
        endpoint,
        options: token != null ? Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      rethrow;
    }
  }

  /// Performs a PATCH request
  Future<dynamic> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    try {
      final response = await _dioClient.patch(
        endpoint,
        data: body,
        options: token != null ? Options(headers: {'x-auth-token': token}) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      rethrow;
    }
  }

  // ==================== File Upload ====================

  /// Multipart POST for file uploads
  Future<dynamic> postMultipart(
    String endpoint, {
    required String filesField,
    required List<MultipartFile> files,
    Map<String, String>? fields,
    String? token,
  }) async {
    try {
      final response = await _dioClient.uploadFiles(
        endpoint,
        files: files,
        fieldName: filesField,
        data: fields,
      );
      return _handleResponse(response);
    } catch (e) {
      rethrow;
    }
  }

  /// Single file upload with Dio MultipartFile
  Future<dynamic> uploadSingleFile(
    String endpoint, {
    required MultipartFile file,
    String fieldName = 'file',
    Map<String, String>? fields,
    String? token,
  }) async {
    return await postMultipart(
      endpoint,
      filesField: fieldName,
      files: [file],
      fields: fields,
      token: token,
    );
  }

  // ==================== Response Handling ====================

  dynamic _handleResponse(Response response) {
    final statusCode = response.statusCode ?? 0;

    if (statusCode >= 200 && statusCode < 300) {
      // Success - return data directly
      return response.data;
    } else if (statusCode >= 400 && statusCode < 500) {
      // Client error
      final errorMsg = _extractErrorMessage(response.data);
      throw ApiException(errorMsg);
    } else if (statusCode >= 500) {
      // Server error
      throw ApiException('Server error occurred. Please try again later.');
    } else {
      throw ApiException('Unexpected error: Status $statusCode');
    }
  }

  String _extractErrorMessage(dynamic data) {
    if (data == null) return 'An error occurred';
    
    if (data is Map) {
      return data['error']?.toString() ??
             data['message']?.toString() ??
             data['msg']?.toString() ??
             'Request failed';
    }
    
    if (data is String) {
      try {
        final decoded = json.decode(data);
        if (decoded is Map) {
          return decoded['error']?.toString() ??
                 decoded['message']?.toString() ??
                 'Request failed';
        }
      } catch (_) {
        return data;
      }
    }
    
    return data.toString();
  }

  // ==================== Download ====================

  /// Download file to specified path
  Future<void> downloadFile(
    String endpoint,
    String savePath, {
    ProgressCallback? onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      await _dioClient.downloadFile(
        endpoint,
        savePath,
        onReceiveProgress: onProgress,
        cancelToken: cancelToken,
      );
    } catch (e) {
      rethrow;
    }
  }

  // ==================== Utility Methods ====================

  /// Cancel token for cancellable requests
  CancelToken createCancelToken() => CancelToken();

  /// Check if request was cancelled
  bool isCancelled(dynamic error) {
    return error is DioException && error.type == DioExceptionType.cancel;
  }
}

/// Re-export ApiException for consistency
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}
