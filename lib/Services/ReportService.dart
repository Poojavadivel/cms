// lib/Services/ReportService.dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:html' as html;
import 'api_constants.dart';
import 'Authservices.dart';

class ReportService {
  static final ReportService _instance = ReportService._internal();
  factory ReportService() => _instance;
  ReportService._internal();

  final AuthService _authService = AuthService.instance;

  /// Download Patient Report PDF
  Future<Map<String, dynamic>> downloadPatientReport(String patientId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Authentication token not found. Please login again.'
        };
      }

      final url = '${ApiConstants.baseUrl}/api/reports-proper/patient/$patientId';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        // Get filename from header or create default
        String filename = 'Patient_Report_${DateTime.now().millisecondsSinceEpoch}.pdf';
        
        final contentDisposition = response.headers['content-disposition'];
        if (contentDisposition != null) {
          final filenameMatch = RegExp(r'filename="?([^"]+)"?').firstMatch(contentDisposition);
          if (filenameMatch != null) {
            filename = filenameMatch.group(1) ?? filename;
          }
        }

        if (kIsWeb) {
          // Web platform - trigger download
          final blob = html.Blob([response.bodyBytes]);
          final url = html.Url.createObjectUrlFromBlob(blob);
          final anchor = html.AnchorElement(href: url)
            ..setAttribute('download', filename)
            ..click();
          html.Url.revokeObjectUrl(url);

          return {
            'success': true,
            'message': 'Patient report downloaded successfully',
            'filename': filename
          };
        } else {
          // Mobile/Desktop platform - save to file
          final directory = await getApplicationDocumentsDirectory();
          final file = File('${directory.path}/$filename');
          await file.writeAsBytes(response.bodyBytes);

          // Try to open the file
          try {
            await OpenFilex.open(file.path);
          } catch (e) {
            print('Could not open file: $e');
          }

          return {
            'success': true,
            'message': 'Patient report saved successfully',
            'path': file.path,
            'filename': filename
          };
        }
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'message': 'Patient not found'
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to generate patient report: ${response.statusCode}'
        };
      }
    } catch (e) {
      print('Error downloading patient report: $e');
      return {
        'success': false,
        'message': 'Error downloading patient report: $e'
      };
    }
  }

  /// Download Doctor Report PDF
  Future<Map<String, dynamic>> downloadDoctorReport(String doctorId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Authentication token not found. Please login again.'
        };
      }

      final url = '${ApiConstants.baseUrl}/api/reports-proper/doctor/$doctorId';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        // Get filename from header or create default
        String filename = 'Doctor_Report_${DateTime.now().millisecondsSinceEpoch}.pdf';
        
        final contentDisposition = response.headers['content-disposition'];
        if (contentDisposition != null) {
          final filenameMatch = RegExp(r'filename="?([^"]+)"?').firstMatch(contentDisposition);
          if (filenameMatch != null) {
            filename = filenameMatch.group(1) ?? filename;
          }
        }

        if (kIsWeb) {
          // Web platform - trigger download
          final blob = html.Blob([response.bodyBytes]);
          final url = html.Url.createObjectUrlFromBlob(blob);
          final anchor = html.AnchorElement(href: url)
            ..setAttribute('download', filename)
            ..click();
          html.Url.revokeObjectUrl(url);

          return {
            'success': true,
            'message': 'Doctor report downloaded successfully',
            'filename': filename
          };
        } else {
          // Mobile/Desktop platform - save to file
          final directory = await getApplicationDocumentsDirectory();
          final file = File('${directory.path}/$filename');
          await file.writeAsBytes(response.bodyBytes);

          // Try to open the file
          try {
            await OpenFilex.open(file.path);
          } catch (e) {
            print('Could not open file: $e');
          }

          return {
            'success': true,
            'message': 'Doctor report saved successfully',
            'path': file.path,
            'filename': filename
          };
        }
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'message': 'Doctor not found'
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to generate doctor report: ${response.statusCode}'
        };
      }
    } catch (e) {
      print('Error downloading doctor report: $e');
      return {
        'success': false,
        'message': 'Error downloading doctor report: $e'
      };
    }
  }

  /// Download Staff Report PDF
  Future<Map<String, dynamic>> downloadStaffReport(String staffId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Authentication token not found. Please login again.'
        };
      }

      final url = '${ApiConstants.baseUrl}/api/reports-proper/staff/$staffId';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        // Get filename from header or create default
        String filename = 'Staff_Report_${DateTime.now().millisecondsSinceEpoch}.pdf';
        
        final contentDisposition = response.headers['content-disposition'];
        if (contentDisposition != null) {
          final filenameMatch = RegExp(r'filename="?([^"]+)"?').firstMatch(contentDisposition);
          if (filenameMatch != null) {
            filename = filenameMatch.group(1) ?? filename;
          }
        }

        if (kIsWeb) {
          // Web platform - trigger download
          final blob = html.Blob([response.bodyBytes]);
          final url = html.Url.createObjectUrlFromBlob(blob);
          final anchor = html.AnchorElement(href: url)
            ..setAttribute('download', filename)
            ..click();
          html.Url.revokeObjectUrl(url);

          return {
            'success': true,
            'message': 'Staff report downloaded successfully',
            'filename': filename
          };
        } else {
          // Mobile/Desktop platform - save to file
          final directory = await getApplicationDocumentsDirectory();
          final file = File('${directory.path}/$filename');
          await file.writeAsBytes(response.bodyBytes);

          // Try to open the file
          try {
            await OpenFilex.open(file.path);
          } catch (e) {
            print('Could not open file: $e');
          }

          return {
            'success': true,
            'message': 'Staff report saved successfully',
            'path': file.path,
            'filename': filename
          };
        }
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'message': 'Staff member not found'
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to generate staff report: ${response.statusCode}'
        };
      }
    } catch (e) {
      print('Error downloading staff report: $e');
      return {
        'success': false,
        'message': 'Error downloading staff report: $e'
      };
    }
  }
}
