import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' show MultipartFile;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;
import '../Models/Admin.dart';
import '../Models/Doctor.dart';
import '../Models/Pharmacist.dart';
import '../Models/Pathologist.dart';
import '../Models/Patients.dart';
import '../Models/User.dart';
import '../Models/appointment_draft.dart';
import 'api_constants.dart';
import '../Models/dashboardmodels.dart';
import '../Models/staff.dart';
import '../Models/Payroll.dart';
import '../Utils/Api_handler.dart';

/// A result object to safely return data from authentication methods.
class AuthResult {
  final dynamic user;
  final String token;

  AuthResult({required this.user, required this.token});
}

/// AuthService: Orchestrates the entire authentication flow.
class AuthService {
  // 🔑 Singleton setup

  AuthService._privateConstructor();
  static final AuthService instance = AuthService._privateConstructor();

  final ApiHandler _apiHandler = ApiHandler.instance;

  // -------------------- Token helpers & keys --------------------
  static const String _tokenKey = 'x-auth-token';
  static const String _userDataKey = 'user_data'; // Store user data for faster reload

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    print('🔑 [AUTH] Retrieved token: ${token != null ? "EXISTS (${token.substring(0, 20)}...)" : "NULL"}');
    return token;
  }

  /// Public method to get token for external use (like Image headers)
  Future<String?> getToken() async {
    return await _getToken();
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    final saved = await prefs.setString(_tokenKey, token);
    print('💾 [AUTH] Token saved: $saved (${token.substring(0, 20)}...)');
    // Force commit on web
    await prefs.reload();
  }

  Future<void> _clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userDataKey);
    print('🗑️ [AUTH] Token and user data cleared');
    await prefs.reload();
  }

  Future<T> _withAuth<T>(Future<T> Function(String token) fn) async {
    final token = await _getToken();
    if (token == null) throw ApiException('Not logged in');
    return await fn(token);
  }

  // -------------------- Public API Helper Methods --------------------
  /// Public GET method for making authenticated GET requests
  Future<dynamic> get(String path) async {
    return await _withAuth<dynamic>((token) async {
      return await _apiHandler.get(path, token: token);
    });
  }

  /// Public POST method for making authenticated POST requests
  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    return await _withAuth<dynamic>((token) async {
      return await _apiHandler.post(path, token: token, body: body);
    });
  }

  /// Public PUT method for making authenticated PUT requests
  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    return await _withAuth<dynamic>((token) async {
      return await _apiHandler.put(path, token: token, body: body);
    });
  }

  /// Public DELETE method for making authenticated DELETE requests
  Future<dynamic> delete(String path) async {
    return await _withAuth<dynamic>((token) async {
      return await _apiHandler.delete(path, token: token);
    });
  }

  /// Send feedback for chatbot messages
  Future<bool> sendChatbotFeedback({
    required String messageId,
    required String type,
    required String conversationId,
  }) async {
    try {
      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.post(
          '${ChatbotEndpoints.chat}/feedback',
          token: token,
          body: {
            'messageId': messageId,
            'type': type,
            'conversationId': conversationId,
          },
        );
        return response != null && response['success'] == true;
      });
    } catch (e) {
      print('❌ Error sending chatbot feedback: $e');
      return false;
    }
  }

  // -------------------- Staff cache (kept in AuthService) --------------------
  List<Staff> _staffList = [];
  Staff? _currentStaff;

  List<Staff> get staffList => List.unmodifiable(_staffList);
  Staff? get currentStaff => _currentStaff;

  // ---------------------------------------------------------------------------
  /// Signs in the user with their email and password.
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

      // Backend now returns `accessToken`, `refreshToken`, `sessionId`, and `user`
      final String accessToken = response['accessToken'] as String;
      final Map<String, dynamic> userData = Map<String, dynamic>.from(response['user'] as Map);

      // Save access token (and optionally refresh token if you have a helper)
      await _saveToken(accessToken);

      // If you keep refresh tokens client-side and have a helper, save it:
      // if (response['refreshToken'] != null) await _saveRefreshToken(response['refreshToken']);

      final user = _parseUserRole(userData);

      return AuthResult(user: user, token: accessToken);
    } on ApiException catch (e) {
      print('ApiException caught: ${e.message}');
      rethrow;
    } catch (e) {
      print('An unexpected error occurred: $e');
      throw ApiException('An unexpected error occurred during login.');
    }
  }

  /// Retrieves and validates the user's data using a stored token.
  Future<AuthResult?> getUserData() async {
    try {
      final String? token = await _getToken();

      if (token == null) {
        return null;
      }

      // validate-token endpoint returns the user object directly (id, email, role, ...)
      final response = await _apiHandler.post(
        ApiEndpoints.validateToken().url,
        token: token,
      );

      // response is the user object
      final Map<String, dynamic> userData = Map<String, dynamic>.from(response as Map);

      final user = _parseUserRole(userData);

      return AuthResult(user: user, token: token);
    } catch (e) {
      return null;
    }
  }


  /// Signs the user out by clearing their session token.
  Future<void> signOut() async {
    await _clearToken();
  }


  Future<List<PatientDetails>> fetchDoctorPatients() async {
    try {
      final token = await _getToken();
      if (token == null) throw ApiException("Not logged in");

      final response = await _apiHandler.get(
        ApiEndpoints.getDoctorPatients().url,
        token: token,
      );

      List data;
      if (response is List) {
        data = response;
      } else if (response is Map && response.containsKey('patients')) {
        data = response['patients'] as List;
      } else {
        throw ApiException("Unexpected response format: $response");
      }

      return data.map((json) => PatientDetails.fromMap(json)).toList();
    } catch (e) {
      print("❌ Failed to fetch doctor patients: $e");
      rethrow;
    }
  }




  // -------------------- Appointments (existing methods) --------------------

  /// Creates a new appointment in the backend.
  Future<bool> createAppointment(AppointmentDraft draft) async {
    try {
      final token = await _getToken();

      if (token == null || token.isEmpty) {
        debugPrint("⚠️ [CREATE APPOINTMENT] No auth token found — user not logged in.");
        return false;
      }

      final body = draft.toJson();
      debugPrint("📤 [CREATE APPOINTMENT] Request Body: ${body.toString()}");

      final response = await _apiHandler.post(
        ApiEndpoints.createAppointment().url,
        token: token,
        body: body,
      );

      // Handle backend-standard responses
      if (response is Map<String, dynamic>) {
        if (response['success'] == true) {
          final appointment = response['appointment'];
          debugPrint("✅ [CREATE APPOINTMENT] Success — Appointment Created:\n$appointment");
          return true;
        }

        if (response.containsKey('message')) {
          debugPrint("❌ [CREATE APPOINTMENT] Backend Error: ${response['message']}");
          return false;
        }

        if (response.containsKey('error')) {
          debugPrint("❌ [CREATE APPOINTMENT] Error: ${response['error']}");
          return false;
        }

        // Sometimes backend may directly return appointment object
        if (response.containsKey('_id')) {
          debugPrint("✅ [CREATE APPOINTMENT] Raw appointment object returned:\n$response");
          return true;
        }

        debugPrint("⚠️ [CREATE APPOINTMENT] Unknown response format:\n$response");
        return false;
      }

      // Non-map responses (bad JSON or unexpected backend output)
      debugPrint("⚠️ [CREATE APPOINTMENT] Unexpected response type: ${response.runtimeType}");
      return false;
    } on ApiException catch (e) {
      debugPrint("❌ [CREATE APPOINTMENT] API Exception: ${e.message}");
      return false;
    } catch (e, st) {
      debugPrint("💥 [CREATE APPOINTMENT] Unexpected Error: $e\n$st");
      return false;
    }
  }


  /// Fetch all appointments
  Future<List<DashboardAppointments>> fetchAppointments() async {
    try {
      final token = await _getToken();

      if (token == null) throw ApiException("Not logged in");

      final response = await _apiHandler.get(
        ApiEndpoints.getAppointments().url,
        token: token,
      );

      // handle both `{ appointments: [...] }` and raw `[...]`
      List data;
      if (response is List) {
        data = response;
      } else if (response is Map && response.containsKey('appointments')) {
        data = response['appointments'] as List;
      } else if (response is Map && response.containsKey('data') && response['data'] is List) {
        // Some backends wrap payload under `data`
        data = response['data'] as List;
      } else {
        throw ApiException("Unexpected response format: $response");
      }

      return data.map((json) => DashboardAppointments.fromJson(json)).toList();
    } catch (e) {
      print("❌ Failed to fetch appointments: $e");
      rethrow;
    }
  }

  /// Delete appointment
  Future<bool> deleteAppointment(String appointmentId) async {
    try {
      final token = await _getToken();

      if (token == null) throw ApiException("Not logged in");

      final response = await _apiHandler.delete(
        ApiEndpoints.deleteAppointment(appointmentId).url,
        token: token,
      );

      // Backend returns { success: true, message: '...' }
      if (response is Map && response.containsKey('success')) {
        if (response['success'] == true) {
          print("✅ Appointment $appointmentId deleted successfully");
          return true;
        } else {
          print("❌ Failed to delete appointment: ${response['message']}");
          return false;
        }
      }

      // Some backends return status code only or an empty body; treat non-null as success
      print("⚠️ Unexpected delete response format, treating as success: $response");
      return true;
    } catch (e) {
      print("💥 Error deleting appointment: $e");
      rethrow;
    }
  }

  /// Edit appointment
  Future<bool> editAppointment(AppointmentDraft draft) async {
    try {
      final token = await _getToken();

      if (token == null) throw ApiException("Not logged in");

      print("🔄 Editing appointment: ${draft.id}");
      print("📦 Appointment data being sent:");
      final jsonData = draft.toJson();
      print(jsonData);

      final response = await _apiHandler.put(
        ApiEndpoints.updateAppointment(draft.id!).url,
        body: jsonData,
        token: token,
      );

      print("📥 Backend response for edit appointment:");
      print(response);

      // backend returns { success: true, appointment: {...} } or { success: true }
      if (response is Map) {
        if (response['success'] == true) {
          print("✅ Appointment updated successfully in backend");
          return true;
        }
        // some APIs return HTTP-like status property
        if (response['status'] == 200) {
          print("✅ Appointment updated successfully (status 200)");
          return true;
        }
        print("❌ Failed to edit appointment: ${response['message'] ?? response}");
        return false;
      }

      // unexpected but non-null response -> assume success
      print("⚠️ Unexpected response format, assuming success");
      return true;
    } catch (e) {
      print("❌ Failed to edit appointment: $e");
      print("Stack trace: ${StackTrace.current}");
      rethrow;
    }
  }

  /// Update patient details (name, phone, gender)
  Future<bool> updatePatientDetails({
    required String patientId,
    required String name,
    String? phone,
    String? gender,
  }) async {
    try {
      final token = await _getToken();

      if (token == null) throw ApiException("Not logged in");

      // Split name into firstName and lastName
      final nameParts = name.trim().split(' ');
      final firstName = nameParts.isNotEmpty ? nameParts.first : '';
      final lastName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';

      final body = {
        'firstName': firstName,
        'lastName': lastName,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (gender != null && gender.isNotEmpty) 'gender': gender,
      };

      print("🔄 Updating patient $patientId with: $body");

      final response = await _apiHandler.patch(
        '/patients/$patientId',
        body: body,
        token: token,
      );

      print("✅ Patient update response: $response");

      if (response is Map) {
        if (response['success'] == true) return true;
        if (response['status'] == 200) return true;
        print("❌ Failed to update patient: ${response['message'] ?? response}");
        return false;
      }

      return true;
    } catch (e) {
      print("❌ Failed to update patient: $e");
      return false;
    }
  }

  /// Fetch appointment by ID
  Future<AppointmentDraft> fetchAppointmentById(String id) async {
    try {
      final token = await _getToken();

      if (token == null) throw ApiException("Not logged in");

      final response = await _apiHandler.get(
        ApiEndpoints.getAppointmentById(id).url,
        token: token,
      );

      print("🔍 RAW API response for appointment $id:");
      print(response);

      // unwrap `{ appointment: {...} }` or `{ success: true, appointment: {...} }`
      dynamic data;
      if (response is Map && response.containsKey('appointment')) {
        data = response['appointment'];
        print("📦 Extracted from 'appointment' key");
      } else if (response is Map && response.containsKey('data')) {
        data = response['data'];
        print("📦 Extracted from 'data' key");
      } else {
        data = response;
        print("📦 Using raw response");
      }

      if (data == null) {
        print("❌ Appointment data is null!");
        throw ApiException("Appointment not found in response: $response");
      }

      print("📋 Appointment data being parsed:");
      print(data);

      final draft = AppointmentDraft.fromJson(data);
      
      print("✅ Successfully parsed AppointmentDraft:");
      print("   Client: ${draft.clientName}");
      print("   Date: ${draft.date}");
      print("   Time: ${draft.time}");
      
      return draft;
    } catch (e) {
      print("❌ Failed to fetch appointment by ID: $e");
      rethrow;
    }
  }

  // -------------------- Staff CRUD (inserted into AuthService) --------------------

  /// Fetch all staff (supports raw list or wrapped response)
  Future<List<Staff>> fetchStaffs({bool forceRefresh = false}) async {
    try {
      if (_staffList.isNotEmpty && !forceRefresh) return _staffList;

      return await _withAuth<List<Staff>>((token) async {
        final response = await _apiHandler.get(ApiEndpoints.getStaffs().url, token: token);

        List data;
        if (response is List) {
          data = response;
        } else if (response is Map && (response.containsKey('staff') || response.containsKey('data'))) {
          data = (response['staff'] ?? response['data']) as List;
        } else {
          throw ApiException('Unexpected response format while fetching staff: $response');
        }

        _staffList = data.map((j) => Staff.fromMap(Map<String, dynamic>.from(j))).toList();
        return _staffList;
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch single staff by id
  Future<Staff> fetchStaffById(String id) async {
    try {
      return await _withAuth<Staff>((token) async {
        final response = await _apiHandler.get(ApiEndpoints.getStaffById(id).url, token: token);

        final data = (response is Map && (response.containsKey('staff') || response.containsKey('data')))
            ? (response['staff'] ?? response['data'])
            : response;

        final staff = Staff.fromMap(Map<String, dynamic>.from(data));
        _currentStaff = staff;

        final idx = _staffList.indexWhere((s) => s.id == staff.id);
        if (idx == -1) {
          _staffList.add(staff);
        } else {
          _staffList[idx] = staff;
        }

        return staff;
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Create staff
  Future<Staff?> createStaff(Staff staffDraft) async {
    try {
      return await _withAuth<Staff?>((token) async {
        final response = await _apiHandler.post(
          ApiEndpoints.createStaff().url,
          token: token,
          body: staffDraft.toJson(),
        );

        final data = (response is Map && (response.containsKey('staff') || response.containsKey('data')))
            ? (response['staff'] ?? response['data'])
            : response;

        if (data == null) return null;
        final created = Staff.fromMap(Map<String, dynamic>.from(data));

        _staffList.add(created);
        return created;
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Update staff
  Future<bool> updateStaff(Staff staffDraft) async {
    try {
      if (staffDraft.id.isEmpty) throw ApiException('Staff id is required for update');

      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.put(
          ApiEndpoints.updateStaff(staffDraft.id).url,
          token: token,
          body: staffDraft.toJson(),
        );

        if (response is Map && (response['success'] == true || response['status'] == 200)) {
          final idx = _staffList.indexWhere((s) => s.id == staffDraft.id);
          if (idx != -1) _staffList[idx] = staffDraft;
          if (_currentStaff?.id == staffDraft.id) _currentStaff = staffDraft;
          return true;
        }

        final data = (response is Map && (response.containsKey('staff') || response.containsKey('data')))
            ? (response['staff'] ?? response['data'])
            : response;

        if (data is Map) {
          final updated = Staff.fromMap(Map<String, dynamic>.from(data));
          final idx = _staffList.indexWhere((s) => s.id == updated.id);
          if (idx != -1) {
            _staffList[idx] = updated;
          } else {
            _staffList.add(updated);
          }
          if (_currentStaff?.id == updated.id) _currentStaff = updated;
          return true;
        }

        return false;
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Delete staff
  Future<bool> deleteStaff(String id) async {
    try {
      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.delete(ApiEndpoints.deleteStaff(id).url, token: token);

        if (response is Map && (response['success'] == true || response['status'] == 200)) {
          _staffList.removeWhere((s) => s.id == id);
          if (_currentStaff?.id == id) _currentStaff = null;
          return true;
        }

        if (response is Map && (response['deletedId'] == id || response['id'] == id || response['_id'] == id)) {
          _staffList.removeWhere((s) => s.id == id);
          if (_currentStaff?.id == id) _currentStaff = null;
          return true;
        }

        return false;
      });
    } catch (e) {
      rethrow;
    }
  }

  // -------------------- Staff utilities --------------------

  /// Find staff locally (no network)
  Staff? findLocalStaffById(String id) {
    try {
      return _staffList.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Clear staff cache (useful on logout)
  void clearStaffCache() {
    _staffList = [];
    _currentStaff = null;
  }


  // -------------------- Patients --------------------
  /// Fetch all patients (supports pagination & search)
  Future<List<PatientDetails>> fetchPatients({
    bool forceRefresh = false,
    int page = 0,
    int limit = 50,
    String q = '',
    String status = '',
  }) async {
    try {
      return await _withAuth<List<PatientDetails>>((token) async {
        final uri = ApiEndpoints.getPatients().url +
            '?page=$page&limit=$limit' +
            (q.isNotEmpty ? '&q=${Uri.encodeComponent(q)}' : '') +
            (status.isNotEmpty ? '&status=${Uri.encodeComponent(status)}' : '');

        print('📡 [FETCH PATIENTS] Requesting: $uri');

        final response = await _apiHandler.get(uri, token: token);

        // Debug: print raw response
        print('📥 [FETCH PATIENTS] Raw response: $response');

        List data;
        if (response is Map && response.containsKey('patients')) {
          data = response['patients'] as List;
        } else if (response is List) {
          data = response;
        } else if (response is Map && response.containsKey('data')) {
          data = response['data'] as List;
        } else {
          throw ApiException(
            'Unexpected response format while fetching patients: $response',
          );
        }

        // Debug: print mapped patients count and sample
        print('📦 [FETCH PATIENTS] Parsed ${data.length} patients');
        if (data.isNotEmpty) {
          print('👤 [FETCH PATIENTS] First patient: ${data.first}');
        }

        final patients = data
            .map((j) => PatientDetails.fromMap(Map<String, dynamic>.from(j)))
            .toList();

// Debug: print all patients after mapping
        if (patients.isNotEmpty) {
          print('✅ [FETCH PATIENTS] Total: ${patients.length}');
          for (var i = 0; i < patients.length; i++) {
            final p = patients[i];
            print('👤 Patient ${i + 1}: ${p.name}, id: ${p.patientId}');
          }
        } else {
          print('⚠️ [FETCH PATIENTS] No patients mapped.');
        }


        return patients;
      });
    } catch (e) {
      print('❌ [FETCH PATIENTS] Error: $e');
      rethrow;
    }
  }

  Future<List<Doctor>> fetchAllDoctors() async {
    try {
      print('➡️ Starting fetchAllDoctors');
      return await _withAuth<List<Doctor>>((token) async {
        print('🔑 Auth token available: $token');

        final response = await _apiHandler.get(ApiEndpoints.getAllDoctors().url, token: token);
        print('📥 Response received: $response');

        // Accept either: [{...}, {...}]  OR  { "doctors": [{...}, {...}] }
        final raw = (response is Map && response.containsKey('doctors'))
            ? response['doctors']
            : response;
        print('📦 Raw data extracted: $raw');

        final items = (raw is List) ? raw : <dynamic>[];
        print('📄 Items list: ${items.length} items');

        final mapped = items.map((e) {
          try {
            final doctor = Doctor.fromMap(Map<String, dynamic>.from(e));
            print('✅ Mapped doctor: $doctor');
            return doctor;
          } catch (error) {
            print('⚠️ Failed to map doctor entry: $e, error: $error');
            return null;
          }
        })
            .whereType<Doctor>()
            .toList();

        print('📊 Final mapped doctors count: ${mapped.length}');
        return mapped;
      });
    } catch (e) {
      print('❌ Error in fetchAllDoctors: $e');
      rethrow;
    }
  }





  /// Fetch single patient by id
  Future<PatientDetails> fetchPatientById(String id) async {
    try {
      return await _withAuth<PatientDetails>((token) async {
        final response =
        await _apiHandler.get(ApiEndpoints.getPatientById(id).url, token: token);

        final data = (response is Map && response.containsKey('patient'))
            ? response['patient']
            : response;

        return PatientDetails.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch optimized profile card data for a patient
  /// This is specifically designed for the PatientProfileHeaderCard widget
  Future<PatientDetails> fetchProfileCardData(String patientId) async {
    try {
      return await _withAuth<PatientDetails>((token) async {
        print('🎴 [PROFILE CARD] Fetching card data for patient: $patientId');
        
        final response = await _apiHandler.get(
          ApiEndpoints.getProfileCardData(patientId).url, 
          token: token
        );

        print('🎴 [PROFILE CARD] Response received: ${response.runtimeType}');
        
        final data = (response is Map && response.containsKey('data'))
            ? response['data']
            : response;

        print('🎴 [PROFILE CARD] Parsing data...');
        final patientDetails = PatientDetails.fromMap(Map<String, dynamic>.from(data));
        
        print('🎴 [PROFILE CARD] Success - Height: ${patientDetails.height}, Weight: ${patientDetails.weight}');
        
        return patientDetails;
      });
    } catch (e) {
      print('❌ [PROFILE CARD] Error fetching card data: $e');
      rethrow;
    }
  }

  /// Create patient
  Future<PatientDetails?> createPatient(PatientDetails payload) async {
    try {
      return await _withAuth<PatientDetails?>((token) async {
        final response = await _apiHandler.post(
          ApiEndpoints.createPatient().url,
          token: token,
          body: payload.toJson(),
        );

        final data = (response is Map && response.containsKey('patient'))
            ? response['patient']
            : (response is Map && response.containsKey('data'))
            ? response['data']
            : response;

        if (data == null) return null;
        return PatientDetails.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Update patient
  Future<bool> updatePatient(PatientDetails payload) async {
    try {
      if (payload.patientId.isEmpty) {
        throw ApiException('Patient id is required for update');
      }

      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.put(
          ApiEndpoints.updatePatient(payload.patientId).url,
          token: token,
          body: payload.toJson(),
        );

        if (response is Map && (response['success'] == true)) {
          return true;
        }

        final data = (response is Map && response.containsKey('patient'))
            ? response['patient']
            : (response is Map && response.containsKey('data'))
            ? response['data']
            : response;

        return data != null;
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Delete patient
  Future<bool> deletePatient(String id) async {
    try {
      return await _withAuth<bool>((token) async {
        final response =
        await _apiHandler.delete(ApiEndpoints.deletePatient(id).url, token: token);

        if (response is Map &&
            (response['success'] == true ||
                response['deletedId'] == id ||
                response['id'] == id ||
                response['_id'] == id)) {
          return true;
        }
        return false;
      });
    } catch (e) {
      rethrow;
    }
  }


  // ===============================
// --- Pharmacy Inventory ---
// ===============================

  /// Fetch all medicines (supports pagination & search)
  Future<List<Map<String, dynamic>>> fetchMedicines({
    bool forceRefresh = false,
    int page = 0,
    int limit = 50,
    String q = '',
    String status = '',
  }) async {
    try {
      return await _withAuth<List<Map<String, dynamic>>>((token) async {
        final uri = ApiEndpoints.getPharmacyMedicines().url +
            '?page=$page&limit=$limit' +
            (q.isNotEmpty ? '&q=${Uri.encodeComponent(q)}' : '') +
            (status.isNotEmpty ? '&status=${Uri.encodeComponent(status)}' : '');

        final response = await _apiHandler.get(uri, token: token);

        // Normalize response: support plain list OR { medicines: [...] }
        List data;
        if (response is List) {
          data = response;
        } else if (response is Map && (response.containsKey('medicines') || response.containsKey('data'))) {
          data = (response['medicines'] ?? response['data']) as List;
        } else {
          throw ApiException('Unexpected response format while fetching medicines: $response');
        }

        return data.map((j) => Map<String, dynamic>.from(j)).toList();
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch single medicine by id
  Future<Map<String, dynamic>> fetchMedicineById(String id) async {
    try {
      print("➡️ fetchMedicineById called with id: $id");

      return await _withAuth<Map<String, dynamic>>((token) async {
        print("➡️ Auth token retrieved: $token");

        final url = ApiEndpoints.getPharmacyMedicineById(id).url;
        print("➡️ Making GET request to: $url");

        final response = await _apiHandler.get(url, token: token);
        print("➡️ Response received: $response");

        final data = (response is Map && (response.containsKey('medicine') || response.containsKey('data')))
            ? (response['medicine'] ?? response['data'])
            : response;

        print("➡️ Extracted data: $data");

        final result = Map<String, dynamic>.from(data);
        print("➡️ Final result map: $result");

        return result;
      });
    } catch (e, stackTrace) {
      print("❌ Error occurred: $e");
      print("📜 Stack trace: $stackTrace");
      rethrow;
    }
  }


  /// Create new medicine
  Future<Map<String, dynamic>?> createMedicine(Map<String, dynamic> payload) async {
    try {
      return await _withAuth<Map<String, dynamic>?>((token) async {
        final response = await _apiHandler.post(
          ApiEndpoints.createPharmacyMedicine().url,
          token: token,
          body: payload,
        );

        final data = (response is Map && (response.containsKey('medicine') || response.containsKey('data')))
            ? (response['medicine'] ?? response['data'])
            : response;

        if (data == null) return null;
        return Map<String, dynamic>.from(data);
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Update medicine
  Future<bool> updateMedicine(String id, Map<String, dynamic> payload) async {
    try {
      if (id.isEmpty) {
        throw ApiException('Medicine id is required for update');
      }

      debugPrint('📤 Updating medicine $id with payload: $payload');

      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.put(
          ApiEndpoints.updatePharmacyMedicine(id).url,
          token: token,
          body: payload,
        );

        debugPrint('📥 Update response: $response');

        if (response is Map && (response['success'] == true)) {
          debugPrint('✅ Update successful (success=true)');
          return true;
        }

        final data = (response is Map && (response.containsKey('medicine') || response.containsKey('data')))
            ? (response['medicine'] ?? response['data'])
            : response;

        final success = data != null;
        debugPrint('✅ Update result: $success');
        return success;
      });
    } catch (e) {
      debugPrint('❌ Update error: $e');
      rethrow;
    }
  }

  /// Delete medicine
  Future<bool> deleteMedicine(String id) async {
    try {
      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.delete(ApiEndpoints.deletePharmacyMedicine(id).url, token: token);

        if (response is Map &&
            (response['success'] == true ||
                response['deletedId'] == id ||
                response['id'] == id ||
                response['_id'] == id)) {
          return true;
        }
        return false;
      });
    } catch (e) {
      rethrow;
    }
  }


  // -------------------- Chatbot: send a message --------------------
  /// Sends a message to the chatbot backend and returns the bot reply (string) or null.
  // Updated AuthService methods for chatbot (Dart)
// Assumes _withAuth<T>((token) => ...) wraps API calls and provides token string.
// Assumes _apiHandler.post/get accept (path, token: token, body: payload) and return decoded JSON (Map or List).

  // -------------------- Chatbot: send message --------------------
  // NOTE: Assumes existence of ApiEndpoints class (from your Canvas),
// _withAuth method, _apiHandler, and ApiConstants.

// -------------------- Chatbot: send message --------------------
  /// Sends a chat message to the bot. Returns the bot's reply or null on failure.
  // -------------------- Chatbot: sendChatMessage --------------------
  Future<String?> sendChatMessage(String message, {String? conversationId, Map<String, dynamic>? metadata}) async {
    print('DEBUG: [sendChatMessage] Starting request for user message: "$message"');
    return await _withAuth<String?>((token) async {
      if (token == null) {
        print('ERROR: [sendChatMessage] Authentication token is null. Cannot proceed.');
        return null;
      }
      final payload = <String, dynamic>{
        'message': message,
        if (conversationId != null) 'chatId': conversationId, // send as chatId for new backend
        if (metadata != null) 'metadata': metadata,
      };

      final url = ApiEndpoints.chatbot().url;
      print('DEBUG: [sendChatMessage] Request URL: $url');
      print('DEBUG: [sendChatMessage] Request Payload: $payload');

      final response = await _apiHandler.post(
        url,
        token: token,
        body: payload,
      );

      print('DEBUG: [sendChatMessage] Raw API Response received: $response');

      if (response == null) {
        print('ERROR: [sendChatMessage] API handler returned null response.');
        return null;
      }

      // Start parsing
      if (response is Map<String, dynamic>) {
        if (response.containsKey('success') && response['success'] == false) {
          print('ERROR: [sendChatMessage] API reported failure: ${response['message']}');
        }

        // 1. Direct reply in root
        if (response.containsKey('reply') && response['reply'] != null) {
          final reply = response['reply']?.toString();
          print('DEBUG: [sendChatMessage] Success. Found reply in root.');
          return reply;
        }

        // 2. Direct message in root (used for errors/simple responses)
        if (response.containsKey('message') && response['message'] != null) {
          final reply = response['message']?.toString();
          print('DEBUG: [sendChatMessage] Found reply in "message" key.');
          return reply;
        }

        // 3. Nested in data
        final d = response['data'];
        if (d is Map<String, dynamic>) {
          if (d.containsKey('reply') && d['reply'] != null) {
            final reply = d['reply']?.toString();
            print('DEBUG: [sendChatMessage] Found reply nested in "data".');
            return reply;
          }
          if (d.containsKey('message') && d['message'] != null) {
            final reply = d['message']?.toString();
            print('DEBUG: [sendChatMessage] Found reply in "data.message".');
            return reply;
          }
          // Fallback: try to extract last message from conversation object
          if (d.containsKey('messages') && d['messages'] is List && (d['messages'] as List).isNotEmpty) {
            final last = (d['messages'] as List).last;
            if (last is Map<String, dynamic> && last.containsKey('text')) {
              final reply = last['text']?.toString();
              print('DEBUG: [sendChatMessage] Extracted reply from last message in data object.');
              return reply;
            }
          }
        }

        // 4. Legacy keys
        if (response.containsKey('botReply') && response['botReply'] != null) {
          final reply = response['botReply']?.toString();
          print('DEBUG: [sendChatMessage] Found reply in legacy key "botReply".');
          return reply;
        }

        // 5. Reply inside meta
        final meta = response['meta'];
        if (meta is Map<String, dynamic> && meta.containsKey('reply')) {
          final reply = meta['reply']?.toString();
          print('DEBUG: [sendChatMessage] Found reply nested in "meta".');
          return reply;
        }
      }

      // 6. If server returned a plain string
      if (response is String) {
        print('DEBUG: [sendChatMessage] Server returned a raw string response.');
        return response;
      }

      print('WARN: [sendChatMessage] Failed to parse expected reply format. Falling back to toString(). Response Type: ${response.runtimeType}');
      // Fallback: stringify whatever we got
      return response.toString();
    });
  }

  // -------------------- Chatbot: createConversation --------------------
  /// Creates a new conversation on the server and returns the created conversation object (map) or null.
  Future<Map<String, dynamic>?> createConversation({String? title, Map<String, dynamic>? metadata}) async {
    print('DEBUG: [createConversation] Starting request.');
    return await _withAuth<Map<String, dynamic>?>((token) async {
      if (token == null) {
        print('ERROR: [createConversation] Authentication token is null. Cannot proceed.');
        return null;
      }
      final payload = <String, dynamic>{
        if (title != null) 'title': title,
        if (metadata != null) 'metadata': metadata,
      };

      final url = ApiEndpoints.createConversation().url;
      print('DEBUG: [createConversation] Request URL: $url');
      print('DEBUG: [createConversation] Request Payload: $payload');

      // The client calls /api/bot/chat with only title. The server now handles this gracefully.
      final response = await _apiHandler.post(
        url,
        token: token,
        body: payload,
      );

      print('DEBUG: [createConversation] Raw API Response received: $response');

      if (response == null) {
        print('ERROR: [createConversation] API handler returned null response.');
        return null;
      }

      if (response is Map<String, dynamic>) {
        if (response.containsKey('success') && response['success'] == false) {
          print('ERROR: [createConversation] API reported failure: ${response['message']}');
        }

        // --- UPDATED PARSING LOGIC ---
        // New server response shape for chat creation is: { success: true, chat: {...}, chatId: "..." }
        final conv = response['chat'] ?? response['conversation'] ?? response['data'] ?? response;

        if (conv is Map<String, dynamic>) {
          print('DEBUG: [createConversation] Successfully parsed conversation object.');
          return Map<String, dynamic>.from(conv);
        }
      }

      print('WARN: [createConversation] Failed to parse expected conversation object from response.');
      return null;
    });
  }


  // -------------------- Chatbot: getConversations --------------------
  /// Returns a list of conversation summaries (List<Map>) or empty list.
  Future<List<Map<String, dynamic>>> getConversations() async {
    print('DEBUG: [getConversations] Starting request.');
    return await _withAuth<List<Map<String, dynamic>>>((token) async {
      if (token == null) {
        print('ERROR: [getConversations] Authentication token is null. Cannot proceed.');
        return [];
      }
      final url = ApiEndpoints.getConversations().url;
      print('DEBUG: [getConversations] Request URL: $url');

      final response = await _apiHandler.get(url, token: token);

      print('DEBUG: [getConversations] Raw API Response received: $response');

      if (response == null) {
        print('ERROR: [getConversations] API handler returned null response.');
        return [];
      }

      // Bot backend responses might use "chats", "conversations", "data", or "items"
      if (response is Map<String, dynamic>) {
        final list = response['chats'] ?? response['conversations'] ?? response['data'] ?? response['items'];
        if (list is List) {
          final result = List<Map<String, dynamic>>.from(list.map((e) => Map<String, dynamic>.from(e as Map)));
          print('DEBUG: [getConversations] Successfully parsed ${result.length} chats from Map response.');
          return result;
        }
      } else if (response is List) {
        final result = List<Map<String, dynamic>>.from(response.map((e) => Map<String, dynamic>.from(e as Map)));
        print('DEBUG: [getConversations] Successfully parsed ${result.length} chats from List response.');
        return result;
      }

      print('WARN: [getConversations] Failed to parse expected list format from response.');
      return [];
    });
  }

  // -------------------- Chatbot: getConversationMessages --------------------
  /// Fetches message history for a conversation. Returns list of messages as Map (sender, text, ts, id...).
  Future<List<Map<String, dynamic>>> getConversationMessages(String conversationId, {int limit = 100, int offset = 0}) async {
    if (conversationId.isEmpty) throw Exception('conversationId is required');
    print('DEBUG: [getConversationMessages] Starting request for ID: $conversationId');

    return await _withAuth<List<Map<String, dynamic>>>((token) async {
      if (token == null) {
        print('ERROR: [getConversationMessages] Authentication token is null. Cannot proceed.');
        return [];
      }

      // FIX: Only call the implemented route: /api/bot/chats/:id
      final path = ChatbotEndpoints.getHistory(conversationId);
      print('DEBUG: [getConversationMessages] Attempting path: $path');
      var response = await _apiHandler.get(path, token: token);

      print('DEBUG: [getConversationMessages] Raw API Response received: $response');

      if (response == null) {
        print('ERROR: [getConversationMessages] API path returned null response.');
        return [];
      }

      // Start parsing
      if (response is Map<String, dynamic>) {
        if (response.containsKey('success') && response['success'] == false) {
          print('ERROR: [getConversationMessages] API reported failure: ${response['message']}');
        }

        // Back-end returns { success: true, chat: {...}, messages: [...] }
        final listCandidate = response['messages'] ?? response['data'] ?? response['items'] ?? response['conversation'];

        // 1. Check if the messages list is directly in the 'messages' key
        if (response['messages'] is List) {
          final m = response['messages'] as List;
          print('DEBUG: [getConversationMessages] Found messages directly in "messages" key.');
          return List<Map<String, dynamic>>.from(m.map((e) => Map<String, dynamic>.from(e as Map)));
        }

        // 2. If 'listCandidate' is a Map (like a full chat object) check for nested 'messages'
        if (listCandidate is Map<String, dynamic> && listCandidate.containsKey('messages')) {
          final m = listCandidate['messages'];
          if (m is List) {
            print('DEBUG: [getConversationMessages] Found messages nested in list candidate key.');
            return List<Map<String, dynamic>>.from(m.map((e) => Map<String, dynamic>.from(e as Map)));
          }
        }

      } else if (response is List) {
        print('DEBUG: [getConversationMessages] Response is a bare list of messages.');
        return List<Map<String, dynamic>>.from(response.map((e) => Map<String, dynamic>.from(e as Map)));
      }

      print('WARN: [getConversationMessages] Failed to parse expected list of messages format.');
      return [];
    });
  }

  // -------------------- Chatbot: delete a conversation --------------------
  /// Deletes a conversation by ID. Returns true if successful.
  Future<bool> deleteConversation(String conversationId) async {
    if (conversationId.isEmpty) throw Exception('conversationId is required');
    print('DEBUG: [deleteConversation] Starting request for ID: $conversationId');

    return await _withAuth<bool>((token) async {
      if (token == null) {
        print('ERROR: [deleteConversation] Authentication token is null. Cannot proceed.');
        return false;
      }
      final path = ApiEndpoints.deleteConversation(conversationId).url;
      print('DEBUG: [deleteConversation] Request Path: $path');

      final response = await _apiHandler.delete(path, token: token);

      print('DEBUG: [deleteConversation] Raw API Response received: $response');

      if (response == null) {
        print('WARN: [deleteConversation] Response was null. Assuming success if status code was 204 (No Content).');
        return true; // Often, 204 (No Content) returns null/empty body, indicating success.
      }

      if (response is Map<String, dynamic>) {
        if (response.containsKey('success') && response['success'] == true) {
          print('DEBUG: [deleteConversation] API reported success: true.');
          return true;
        } else if (response.containsKey('success') && response['success'] == false) {
          print('ERROR: [deleteConversation] API reported explicit failure: ${response['message'] ?? 'Unknown error'}.');
          return false;
        }
      }

      if (response is String && response.toLowerCase().contains('success')) {
        print('DEBUG: [deleteConversation] Response string contained "success". Assuming success.');
        return true;
      }

      print('WARN: [deleteConversation] Final check failed. Assuming delete failed.');
      return false;
    });
  }
  // -------------------- Role parsing --------------------
  dynamic _parseUserRole(Map<String, dynamic> userData) {
    final baseUser = User.fromMap(userData);

    if (baseUser.role == UserRole.admin) {
      return Admin(userProfile: baseUser);
    } else if (baseUser.role == UserRole.doctor) {
      return Doctor.fromMap(userData);
    } else if (baseUser.role == UserRole.pharmacist) {
      return Pharmacist.fromMap(userData);
    } else if (baseUser.role == UserRole.pathologist) {
      return Pathologist.fromMap(userData);
    } else {
      // For other roles (reception, superadmin, etc.), return base User
      return baseUser;
    }
  }


  /// Add intake for a specific patient. patientId is required.
  Future<dynamic> addIntake(Map<String, dynamic> payload, {required String patientId}) async {
    if (patientId.trim().isEmpty) throw ApiException('patientId is required');

    return await _withAuth<dynamic>((token) async {
      final api = ApiEndpoints.addIntake(patientId);
      final response = await _apiHandler.post(api.url, token: token, body: payload);

      // Normalize typical response shapes
      if (response is Map && (response.containsKey('data') || response.containsKey('intake'))) {
        return response['data'] ?? response['intake'];
      }
      return response;
    });
  }

  /// Fetch lab reports for a patient
  Future<List<Map<String, dynamic>>> getLabReports({required String patientId, int limit = 50, int page = 0}) async {
    if (patientId.trim().isEmpty) throw ApiException('patientId is required');

    return await _withAuth<List<Map<String, dynamic>>>((token) async {
      // Use new dedicated lab reports endpoint
      try {
        final scannerEndpoint = ScannerEndpoints.getLabReports(patientId);
        print('🔬 [LAB REPORTS] Fetching from dedicated endpoint: $scannerEndpoint');
        
        final scannerResponse = await _apiHandler.get(scannerEndpoint, token: token);
        
        if (scannerResponse is Map && scannerResponse['success'] == true && scannerResponse.containsKey('reports')) {
          final reportsList = scannerResponse['reports'] as List;
          print('✅ [LAB REPORTS] Got ${reportsList.length} lab reports from scanner');
          return reportsList.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        print('⚠️  [LAB REPORTS] Dedicated endpoint failed: $e');
      }
      
      // Fallback to old combined reports endpoint and filter
      try {
        final scannerEndpoint = ScannerEndpoints.getReports(patientId);
        print('🔬 [LAB REPORTS] Trying fallback combined endpoint: $scannerEndpoint');
        
        final scannerResponse = await _apiHandler.get(scannerEndpoint, token: token);
        
        if (scannerResponse is Map && scannerResponse['success'] == true && scannerResponse.containsKey('reports')) {
          final reportsList = scannerResponse['reports'] as List;
          
          // Filter out prescriptions, keep only lab reports
          final labReports = reportsList.where((report) {
            final intent = report['intent']?.toString().toUpperCase();
            final testType = report['testType']?.toString().toUpperCase();
            return intent != 'PRESCRIPTION' && testType != 'PRESCRIPTION';
          }).toList();
          
          print('✅ [LAB REPORTS] Got ${labReports.length} lab reports from combined endpoint');
          return labReports.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        print('⚠️  [LAB REPORTS] Combined endpoint failed: $e');
      }
      
      // Final fallback to old pathology endpoint
      try {
        final endpoint = LabEndpoints.getReports(patientId: patientId) + '&limit=$limit&page=$page';
        print('📡 [LAB REPORTS] Trying legacy pathology endpoint: $endpoint');

        final response = await _apiHandler.get(endpoint, token: token);

        if (response is Map && response['success'] == true && response.containsKey('reports')) {
          final reportsList = response['reports'] as List;
          print('📦 [LAB REPORTS] Received ${reportsList.length} reports from legacy');
          return reportsList.map((e) => Map<String, dynamic>.from(e)).toList();
        } else if (response is List) {
          print('📦 [LAB REPORTS] Received ${response.length} reports (direct list)');
          return response.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        print('❌ [LAB REPORTS] Legacy endpoint failed: $e');
      }
      
      return [];
    });
  }

  /// Get lab report download URL
  String getLabReportDownloadUrl(String reportId) {
    return '${ApiConfig.baseUrl}/api/pathology/reports/$reportId/download';
  }

  /// Fetch prescriptions for a patient (uses dedicated prescription endpoint)
  Future<List<Map<String, dynamic>>> getPrescriptions({required String patientId, int limit = 50, int page = 0}) async {
    if (patientId.trim().isEmpty) throw ApiException('patientId is required');

    return await _withAuth<List<Map<String, dynamic>>>((token) async {
      try {
        // Use new dedicated prescriptions endpoint
        final scannerEndpoint = ScannerEndpoints.getPrescriptions(patientId);
        print('💊 [PRESCRIPTIONS] Fetching from dedicated endpoint: $scannerEndpoint');
        
        final scannerResponse = await _apiHandler.get(scannerEndpoint, token: token);
        
        if (scannerResponse is Map && scannerResponse['success'] == true && scannerResponse.containsKey('prescriptions')) {
          final prescriptionsList = scannerResponse['prescriptions'] as List;
          print('✅ [PRESCRIPTIONS] Found ${prescriptionsList.length} prescriptions');
          return prescriptionsList.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        print('⚠️  [PRESCRIPTIONS] Dedicated endpoint failed: $e');
      }
      
      // Fallback: Try combined reports endpoint and filter
      try {
        final scannerEndpoint = ScannerEndpoints.getReports(patientId);
        print('💊 [PRESCRIPTIONS] Trying fallback combined endpoint: $scannerEndpoint');
        
        final scannerResponse = await _apiHandler.get(scannerEndpoint, token: token);
        
        if (scannerResponse is Map && scannerResponse['success'] == true && scannerResponse.containsKey('reports')) {
          final reportsList = scannerResponse['reports'] as List;
          
          // Filter only PRESCRIPTION type reports
          final prescriptions = reportsList.where((report) {
            final intent = report['intent']?.toString().toUpperCase();
            final testType = report['testType']?.toString().toUpperCase();
            return intent == 'PRESCRIPTION' || testType == 'PRESCRIPTION';
          }).toList();
          
          print('✅ [PRESCRIPTIONS] Found ${prescriptions.length} prescriptions out of ${reportsList.length} total reports');
          return prescriptions.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        print('❌ [PRESCRIPTIONS] Fallback failed: $e');
      }
      
      print('⚠️  [PRESCRIPTIONS] No prescriptions found');
      return [];
    });
  }

  /// Fetch medical history reports for a patient
  Future<List<Map<String, dynamic>>> getMedicalHistory({required String patientId, int limit = 50, int page = 0}) async {
    if (patientId.trim().isEmpty) throw ApiException('patientId is required');

    return await _withAuth<List<Map<String, dynamic>>>((token) async {
      try {
        // Use new dedicated medical history endpoint
        final scannerEndpoint = ScannerEndpoints.getMedicalHistory(patientId);
        print('📋 [MEDICAL HISTORY] Fetching from dedicated endpoint: $scannerEndpoint');
        
        final scannerResponse = await _apiHandler.get(scannerEndpoint, token: token);
        
        if (scannerResponse is Map && scannerResponse['success'] == true && scannerResponse.containsKey('medicalHistory')) {
          final historyList = scannerResponse['medicalHistory'] as List;
          print('✅ [MEDICAL HISTORY] Found ${historyList.length} medical history records');
          return historyList.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        print('⚠️  [MEDICAL HISTORY] Dedicated endpoint failed: $e');
      }
      
      // Fallback: Try combined reports endpoint and filter
      try {
        final scannerEndpoint = ScannerEndpoints.getReports(patientId);
        print('📋 [MEDICAL HISTORY] Trying fallback combined endpoint: $scannerEndpoint');
        
        final scannerResponse = await _apiHandler.get(scannerEndpoint, token: token);
        
        if (scannerResponse is Map && scannerResponse['success'] == true && scannerResponse.containsKey('reports')) {
          final reportsList = scannerResponse['reports'] as List;
          
          // Filter only MEDICAL_HISTORY type reports
          final medicalHistory = reportsList.where((report) {
            final intent = report['intent']?.toString().toUpperCase();
            final testType = report['testType']?.toString().toUpperCase();
            return intent == 'MEDICAL_HISTORY' || testType == 'MEDICAL_HISTORY' || intent == 'MEDICAL HISTORY' || testType == 'MEDICAL HISTORY';
          }).toList();
          
          print('✅ [MEDICAL HISTORY] Found ${medicalHistory.length} medical history records out of ${reportsList.length} total reports');
          return medicalHistory.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        print('❌ [MEDICAL HISTORY] Fallback failed: $e');
      }
      
      print('⚠️  [MEDICAL HISTORY] No medical history found');
      return [];
    });
  }

  /// Scan medical document and extract data with AI (accepts XFile for web compatibility)
  Future<Map<String, dynamic>> scanAndExtractMedicalDataFromXFile(XFile imageFile, {String? patientId}) async {
    return await _withAuth<Map<String, dynamic>>((token) async {
      try {
        print('📸 [SCANNER] Starting image scan: ${imageFile.path}');
        print('📸 [SCANNER] File name: ${imageFile.name}');
        print('📸 [SCANNER] File length: ${await imageFile.length()} bytes');
        if (patientId != null) {
          print('👤 [SCANNER] Patient ID: $patientId - Will save to patient record');
        }

        // Create multipart request
        final url = '${ApiConfig.baseUrl}/api/scanner-enterprise/scan-medical';
        print('📸 [SCANNER] Target URL: $url');
        
        final request = http.MultipartRequest(
          'POST',
          Uri.parse(url),
        );

        // Add auth token
        if (token != null && token.isNotEmpty) {
          request.headers['x-auth-token'] = token;
          print('🔑 [SCANNER] Auth token added');
        } else {
          print('⚠️  [SCANNER] No auth token!');
        }
        
        // Add patientId if provided
        if (patientId != null && patientId.isNotEmpty) {
          request.fields['patientId'] = patientId;
          print('👤 [SCANNER] Added patientId to request: $patientId');
        }

        // Platform-specific file handling
        http.MultipartFile file;
        if (kIsWeb) {
          // Web: Read bytes from XFile
          final bytes = await imageFile.readAsBytes();
          print('📸 [SCANNER] Read ${bytes.length} bytes from XFile');
          print('📸 [SCANNER] File name: ${imageFile.name}');
          print('📸 [SCANNER] XFile mimeType: ${imageFile.mimeType}');
          
          // Determine MIME type - prioritize extension over XFile.mimeType
          // because XFile on web sometimes returns incorrect MIME types
          String mimeType = 'image/jpeg'; // default
          final fileName = imageFile.name.toLowerCase();
          
          if (fileName.endsWith('.png')) {
            mimeType = 'image/png';
          } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
            mimeType = 'image/jpeg';
          } else if (fileName.endsWith('.pdf')) {
            mimeType = 'application/pdf';
          } else if (imageFile.mimeType != null && imageFile.mimeType!.isNotEmpty && !imageFile.mimeType!.contains('text/plain')) {
            // Use XFile mimeType only if valid and not text/plain
            mimeType = imageFile.mimeType!;
          }
          
          print('📸 [SCANNER] Final MIME type: $mimeType');
          
          final mimeTypeParts = mimeType.split('/');
          file = http.MultipartFile.fromBytes(
            'image',
            bytes,
            filename: imageFile.name,
            contentType: MediaType(mimeTypeParts[0], mimeTypeParts[1]),
          );
          print('📸 [SCANNER] Created MultipartFile with contentType: ${file.contentType}');
        } else {
          // Mobile/Desktop: Use fromPath with explicit MIME type
          String? mimeType;
          final fileName = imageFile.name.toLowerCase();
          if (fileName.endsWith('.png')) {
            mimeType = 'image/png';
          } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
            mimeType = 'image/jpeg';
          } else if (fileName.endsWith('.pdf')) {
            mimeType = 'application/pdf';
          }
          
          file = await http.MultipartFile.fromPath(
            'image',
            imageFile.path,
            filename: imageFile.name,
            contentType: mimeType != null ? MediaType(mimeType.split('/')[0], mimeType.split('/')[1]) : null,
          );
          print('📸 [SCANNER] Created MultipartFile from path with contentType: ${file.contentType}');
        }
        request.files.add(file);

        print('📤 [SCANNER] Uploading to: ${request.url}');

        // Send request
        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        print('📥 [SCANNER XFile] Response status: ${response.statusCode}');
        
        // Check if HTML error page
        final responseBody = response.body;
        if (responseBody.trim().startsWith('<!DOCTYPE') || responseBody.trim().startsWith('<html')) {
          print('❌ [SCANNER] ERROR: Server returned HTML instead of JSON!');
          print('📄 [SCANNER] First 300 chars:');
          print(responseBody.substring(0, responseBody.length > 300 ? 300 : responseBody.length));
          throw ApiException('Server error - returned HTML page. Backend may need restart or check logs.');
        }
        
        print('📥 [SCANNER XFile] Response body: $responseBody');

        if (response.statusCode == 200) {
          final data = json.decode(responseBody);
          
          if (data is Map && data['success'] == true) {
            return {
              'medicalHistory': data['extractedData']?['medicalHistory'] ?? '',
              'allergies': data['extractedData']?['allergies'] ?? '',
              'diagnosis': data['extractedData']?['diagnosis'] ?? '',
              'medications': data['extractedData']?['medications'] ?? '',
              'testResults': data['extractedData']?['testResults'] ?? {},
              'intent': data['intent'] ?? '',
              'ocrText': data['ocrText'] ?? '',
            };
          } else {
            throw ApiException(data['message'] ?? 'Scan failed');
          }
        } else {
          try {
            final errorData = json.decode(responseBody);
            throw ApiException(
                errorData['message'] ?? 'Failed to scan document: ${response.statusCode}');
          } catch (e) {
            throw ApiException('Failed to scan document: ${response.statusCode} - $responseBody');
          }
        }
      } catch (e) {
        print('❌ [SCANNER] Error: $e');
        throw ApiException('Scanner error: $e');
      }
    });
  }

  /// Scan medical document and extract data with AI
  Future<Map<String, dynamic>> scanAndExtractMedicalData(String imagePath) async {
    return await _withAuth<Map<String, dynamic>>((token) async {
      try {
        print('📸 [SCANNER] Starting image scan: $imagePath');

        // Create multipart request
        final request = http.MultipartRequest(
          'POST',
          Uri.parse('${ApiConfig.baseUrl}/api/scanner-enterprise/scan-medical'),
        );

        // Add auth token
        if (token != null && token.isNotEmpty) {
          request.headers['x-auth-token'] = token;
        }

        // Add image file
        final file = await http.MultipartFile.fromPath(
          'image',
          imagePath,
          filename: imagePath.split('/').last,
        );
        request.files.add(file);

        print('📤 [SCANNER] Uploading to: ${request.url}');

        // Send request
        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        print('📥 [SCANNER] Response status: ${response.statusCode}');
        print('📥 [SCANNER] Response body: ${response.body}');

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          
          if (data is Map && data['success'] == true) {
            return {
              'medicalHistory': data['extractedData']?['medicalHistory'] ?? '',
              'allergies': data['extractedData']?['allergies'] ?? '',
              'diagnosis': data['extractedData']?['diagnosis'] ?? '',
              'medications': data['extractedData']?['medications'] ?? '',
              'testResults': data['extractedData']?['testResults'] ?? {},
              'intent': data['intent'] ?? '',
              'ocrText': data['ocrText'] ?? '',
            };
          } else {
            throw ApiException(data['message'] ?? 'Scan failed');
          }
        } else {
          final errorData = json.decode(response.body);
          throw ApiException(
              errorData['message'] ?? 'Failed to scan document: ${response.statusCode}');
        }
      } catch (e) {
        print('❌ [SCANNER] Error: $e');
        throw ApiException('Scanner error: $e');
      }
    });
  }

  /// Attach report to existing patient (after patient creation)
  Future<void> attachReportToPatient(String patientId, String imagePath) async {
    return await _withAuth<void>((token) async {
      try {
        final request = http.MultipartRequest(
          'POST',
          Uri.parse('${ApiConfig.baseUrl}/api/scanner-enterprise/attach-report/$patientId'),
        );

        if (token != null && token.isNotEmpty) {
          request.headers['x-auth-token'] = token;
        }

        // Platform-specific file handling
        http.MultipartFile file;
        if (kIsWeb) {
          // Web: Use bytes from picked file (imagePath is actually base64 or URL)
          // For web, we need to handle this differently
          throw ApiException('Web upload not yet supported for this operation. Please use mobile/desktop app.');
        } else {
          // Mobile/Desktop: use fromPath
          file = await http.MultipartFile.fromPath(
            'image',
            imagePath,
            filename: imagePath.split('/').last.split('\\').last,
          );
          request.files.add(file);
        }

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode == 200) {
          print('✅ [ATTACH REPORT] Success');
        } else {
          throw ApiException('Failed to attach report: ${response.body}');
        }
      } catch (e) {
        print('❌ [ATTACH REPORT] Error: $e');
        throw ApiException('Attach report error: $e');
      }
    });
  }

  /// Bulk upload reports with automatic patient matching
  Future<Map<String, dynamic>> bulkUploadReports(List<String> imagePaths) async {
    return await _withAuth<Map<String, dynamic>>((token) async {
      try {
        final request = http.MultipartRequest(
          'POST',
          Uri.parse('${ApiConfig.baseUrl}/api/scanner-enterprise/bulk-upload-with-matching'),
        );

        if (token != null && token.isNotEmpty) {
          request.headers['x-auth-token'] = token;
        }

        // Platform-specific file handling
        if (kIsWeb) {
          throw ApiException('Web upload not yet supported for bulk operations. Please use mobile/desktop app.');
        }
        
        for (final imagePath in imagePaths) {
          // Mobile/Desktop: use fromPath
          final file = await http.MultipartFile.fromPath(
            'images',
            imagePath,
            filename: imagePath.split('/').last.split('\\').last,
          );
          request.files.add(file);
        }

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          print('✅ [BULK UPLOAD] Success: ${data['processed']} processed, ${data['failed']} failed');
          return data;
        } else {
          throw ApiException('Bulk upload failed: ${response.body}');
        }
      } catch (e) {
        print('❌ [BULK UPLOAD] Error: $e');
        throw ApiException('Bulk upload error: $e');
      }
    });
  }

  Future<dynamic> getIntakes({required String patientId, int limit = 20, int skip = 0}) async {
    if (patientId.trim().isEmpty) throw ApiException('patientId is required');

    return await _withAuth<dynamic>((token) async {
      final api = ApiEndpoints.getIntakes(patientId); // -> /api/patients/$patientId/intake
      final url = '${api.url}?limit=$limit&skip=$skip';

      // debug logs
      print('GET INTAKES: patientId="$patientId"');
      print('GET INTAKES: url="$url"');
      print('GET INTAKES: tokenPresent=${token != null && token.toString().isNotEmpty}');

      try {
        final response = await _apiHandler.get(url, token: token);
        print('GET INTAKES: raw response -> $response');

        if (response is Map && response.containsKey('intakes')) {
          print('GET INTAKES: returning response["intakes"] (count=${(response["intakes"] as List).length})');
          return response['intakes']; // Return only the intake list
        }

        // If backend returned a list directly or another shape, return it (and log)
        if (response is List) {
          print('GET INTAKES: response is List (count=${response.length})');
        } else {
          print('GET INTAKES: response shape -> ${response.runtimeType}');
        }

        return response; // Fallback if backend returns full object
      } catch (e, st) {
        print('GET INTAKES: exception -> $e\n$st');
        rethrow;
      }
    });
  }




  /// Unified upload that works on web (bytes) and native (paths).
  Future<Map<String, dynamic>?> uploadScansUnified({
    required List<PlatformFile> platformFiles,
  }) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) {
        debugPrint("⚠️ [SCANNER UPLOAD] No auth token — user not logged in.");
        return null;
      }

      if (platformFiles.isEmpty) {
        debugPrint("⚠️ [SCANNER UPLOAD] No files selected.");
        return null;
      }

      if (platformFiles.length > 10) {
        debugPrint("⚠️ [SCANNER UPLOAD] Max 10 files allowed. Got: ${platformFiles.length}");
        return null;
      }

      debugPrint("📤 [SCANNER UPLOAD] Preparing ${platformFiles.length} files…");

      final List<MultipartFile> parts = [];

      for (final pf in platformFiles) {
        final name = pf.name ?? 'file';
        final filename = p.basename(name);

        Uint8List? bytes;
        if (pf.bytes != null && pf.bytes!.isNotEmpty) {
          bytes = pf.bytes;
        } else if (pf.path != null) {
          // native fallback: read from filesystem
          final file = File(pf.path!);
          if (await file.exists()) {
            bytes = await file.readAsBytes();
          } else {
            debugPrint("⚠️ [SCANNER UPLOAD] File path not found for ${pf.path}");
          }
        }

        if (bytes == null) {
          debugPrint("⚠️ [SCANNER UPLOAD] Skipping $filename (no bytes/path)");
          continue;
        }

        final mime = _guessMimeFromName(filename) ?? 'application/octet-stream';
        final partsMime = mime.split('/');
        final mType = MediaType(partsMime[0], partsMime.length > 1 ? partsMime[1] : 'octet-stream');

        final part = MultipartFile.fromBytes(
          'files',
          bytes,
          filename: filename,
          contentType: mType,
        );
        parts.add(part);
        debugPrint("  • queued file=$filename bytes=${bytes.length} mime=$mime");
      }

      if (parts.isEmpty) {
        debugPrint("⚠️ [SCANNER UPLOAD] No valid file parts to upload.");
        return null;
      }

      final response = await _apiHandler.postMultipart(
        ApiEndpoints.scannerUpload().url,
        token: token,
        filesField: 'files',
        files: parts,
      );

      if (response is Map<String, dynamic>) {
        debugPrint("✅ [SCANNER UPLOAD] ok=${response['ok']} batch=${response['batchId']}");
        return response;
      }

      debugPrint("⚠️ [SCANNER UPLOAD] Unexpected response: ${response.runtimeType}");
      return null;
    } catch (e, st) {
      debugPrint("💥 [SCANNER UPLOAD] $e\n$st");
      return null;
    }
  }



  Future<Map<String, dynamic>?> uploadScans(List<File> files) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) {
        debugPrint("⚠️ [SCANNER UPLOAD] No auth token — user not logged in.");
        return null;
      }

      if (files.isEmpty) {
        debugPrint("⚠️ [SCANNER UPLOAD] No files selected.");
        return null;
      }

      if (files.length > 10) {
        debugPrint("⚠️ [SCANNER UPLOAD] Max 10 files allowed. Got: ${files.length}");
        return null;
      }

      debugPrint("📤 [SCANNER UPLOAD] Uploading ${files.length} files…");

      final List<MultipartFile> parts = [];
      for (final f in files) {
        final bytes = await f.readAsBytes();
        final filename = p.basename(f.path);
        final mime = _guessMimeFromName(filename);
        final part = MultipartFile.fromBytes(
          'files', // ✅ first argument = field name in your backend (upload.array('files', 10))
          bytes,   // ✅ second argument = actual byte data
          filename: filename,
          contentType: mime != null ? MediaType.parse(mime) : null,
        );
        parts.add(part);

        debugPrint("  • added file=$filename bytes=${bytes.length} mime=$mime");
      }

      final response = await _apiHandler.postMultipart(
        ApiEndpoints.scannerUpload().url,
        token: token,
        filesField: 'files',
        files: parts,
      );

      if (response is Map<String, dynamic>) {
        debugPrint("✅ [SCANNER UPLOAD] ok=${response['ok']} batch=${response['batchId']}");
        return response;
      }

      debugPrint("⚠️ [SCANNER UPLOAD] Unexpected response: ${response.runtimeType}");
      return null;
    } catch (e, st) {
      debugPrint("💥 [SCANNER UPLOAD] $e\n$st");
      return null;
    }
  }
  Future<List<Map<String, dynamic>>> getScannerReports(String patientId) async {
    try {
      final token = await _getToken();
      if (token == null) throw ApiException("Not logged in");

      debugPrint("📥 [SCANNER REPORTS] Fetching reports for patient=$patientId");

      final response = await _apiHandler.get(
        ApiEndpoints.scannerGetReports(patientId).url,
        token: token,
      );

      if (response is Map && response['ok'] == true && response['items'] is List) {
        final items = List<Map<String, dynamic>>.from(response['items']);
        debugPrint("✅ [SCANNER REPORTS] Loaded ${items.length} reports");
        return items;
      }

      debugPrint("⚠️ [SCANNER REPORTS] Unexpected response: $response");
      return [];
    } catch (e, st) {
      debugPrint("💥 [SCANNER REPORTS] Error: $e\n$st");
      return [];
    }
  }
  Future<Uint8List?> getScannerPdf(String pdfId) async {
    try {
      final token = await _getToken();
      if (token == null) throw ApiException("Not logged in");

      debugPrint("📥 [SCANNER PDF] Fetching pdfId=$pdfId");

      final response = await _apiHandler.getBytes(
        ApiEndpoints.scannerGetPdf(pdfId).url,
        token: token,
      );

      if (response != null && response.isNotEmpty) {
        debugPrint("✅ [SCANNER PDF] Downloaded ${response.length} bytes");
        return response;
      }

      debugPrint("⚠️ [SCANNER PDF] Empty response for $pdfId");
      return null;
    } catch (e, st) {
      debugPrint("💥 [SCANNER PDF] Error: $e\n$st");
      return null;
    }
  }
  String? _guessMimeFromName(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    return null;
  }

  /// Update patient ID for all scanned documents (from temp ID to real ID)
  Future<void> updatePatientIdForDocuments({
    required String oldPatientId,
    required String newPatientId,
  }) async {
    if (oldPatientId.trim().isEmpty || newPatientId.trim().isEmpty) {
      throw ApiException('oldPatientId and newPatientId are required');
    }

    return await _withAuth<void>((token) async {
      try {
        final endpoint = '/api/scanner-enterprise/update-patient-id';
        print('🔄 [UPDATE PATIENT ID] Updating documents from $oldPatientId to $newPatientId');
        
        final response = await _apiHandler.post(
          endpoint,
          body: {
            'oldPatientId': oldPatientId,
            'newPatientId': newPatientId,
          },
          token: token,
        );
        
        if (response is Map && response['success'] == true) {
          final updated = response['updated'] ?? 0;
          print('✅ [UPDATE PATIENT ID] Updated $updated document(s)');
        } else {
          throw ApiException('Failed to update patient ID for documents');
        }
      } catch (e) {
        print('❌ [UPDATE PATIENT ID] Error: $e');
        rethrow;
      }
    });
  }

  // ===============================
  // --- Payroll Management ---
  // ===============================

  /// Fetch all payroll records (supports pagination & filters)
  Future<List<Payroll>> fetchPayrolls({
    bool forceRefresh = false,
    int page = 0,
    int limit = 50,
    String q = '',
    String department = '',
    String status = '',
    int? month,
    int? year,
    String? staffId,
  }) async {
    try {
      return await _withAuth<List<Payroll>>((token) async {
        final uri = ApiEndpoints.getPayrolls().url +
            '?page=$page&limit=$limit' +
            (q.isNotEmpty ? '&q=${Uri.encodeComponent(q)}' : '') +
            (department.isNotEmpty ? '&department=${Uri.encodeComponent(department)}' : '') +
            (status.isNotEmpty ? '&status=${Uri.encodeComponent(status)}' : '') +
            (month != null ? '&month=$month' : '') +
            (year != null ? '&year=$year' : '') +
            (staffId != null && staffId.isNotEmpty ? '&staffId=${Uri.encodeComponent(staffId)}' : '');

        final response = await _apiHandler.get(uri, token: token);

        List data;
        if (response is List) {
          data = response;
        } else if (response is Map && (response.containsKey('payroll') || response.containsKey('data'))) {
          data = (response['payroll'] ?? response['data']) as List;
        } else {
          throw ApiException('Unexpected response format while fetching payroll: $response');
        }

        return data.map((j) => Payroll.fromMap(Map<String, dynamic>.from(j))).toList();
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch single payroll by id
  Future<Payroll> fetchPayrollById(String id) async {
    try {
      return await _withAuth<Payroll>((token) async {
        final url = ApiEndpoints.getPayrollById(id).url;
        final response = await _apiHandler.get(url, token: token);

        final data = (response is Map && (response.containsKey('payroll') || response.containsKey('data')))
            ? (response['payroll'] ?? response['data'])
            : response;

        return Payroll.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Create new payroll
  Future<Payroll?> createPayroll(Map<String, dynamic> payload) async {
    try {
      return await _withAuth<Payroll?>((token) async {
        final response = await _apiHandler.post(
          ApiEndpoints.createPayroll().url,
          token: token,
          body: payload,
        );

        final data = (response is Map && (response.containsKey('payroll') || response.containsKey('data')))
            ? (response['payroll'] ?? response['data'])
            : response;

        if (data == null) return null;
        return Payroll.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Update payroll
  Future<bool> updatePayroll(String id, Map<String, dynamic> payload) async {
    try {
      if (id.isEmpty) {
        throw ApiException('Payroll id is required for update');
      }

      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.put(
          ApiEndpoints.updatePayroll(id).url,
          token: token,
          body: payload,
        );

        if (response is Map && (response['success'] == true)) {
          return true;
        }

        final data = (response is Map && (response.containsKey('payroll') || response.containsKey('data')))
            ? (response['payroll'] ?? response['data'])
            : response;

        return data != null;
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Delete payroll
  Future<bool> deletePayroll(String id) async {
    try {
      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.delete(ApiEndpoints.deletePayroll(id).url, token: token);

        if (response is Map &&
            (response['success'] == true ||
                response['deletedId'] == id ||
                response['id'] == id ||
                response['_id'] == id)) {
          return true;
        }
        return false;
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Approve payroll
  Future<Payroll> approvePayroll(String id, {String? remarks}) async {
    try {
      return await _withAuth<Payroll>((token) async {
        final payload = remarks != null ? {'approvalRemarks': remarks} : <String, dynamic>{};
        
        final response = await _apiHandler.patch(
          ApiEndpoints.approvePayroll(id).url,
          token: token,
          body: payload,
        );

        final data = (response is Map && (response.containsKey('payroll') || response.containsKey('data')))
            ? (response['payroll'] ?? response['data'])
            : response;

        return Payroll.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Reject payroll
  Future<Payroll> rejectPayroll(String id, {required String reason}) async {
    try {
      return await _withAuth<Payroll>((token) async {
        final response = await _apiHandler.patch(
          ApiEndpoints.rejectPayroll(id).url,
          token: token,
          body: {'reason': reason},
        );

        final data = (response is Map && (response.containsKey('payroll') || response.containsKey('data')))
            ? (response['payroll'] ?? response['data'])
            : response;

        return Payroll.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Process payment for payroll
  Future<Payroll> processPayrollPayment(String id, {String? transactionId, String? chequeNumber, String? paymentMode}) async {
    try {
      return await _withAuth<Payroll>((token) async {
        final payload = <String, dynamic>{};
        if (transactionId != null) payload['transactionId'] = transactionId;
        if (chequeNumber != null) payload['chequeNumber'] = chequeNumber;
        if (paymentMode != null) payload['paymentMode'] = paymentMode;

        final response = await _apiHandler.patch(
          ApiEndpoints.processPayrollPayment(id).url,
          token: token,
          body: payload,
        );

        final data = (response is Map && (response.containsKey('payroll') || response.containsKey('data')))
            ? (response['payroll'] ?? response['data'])
            : response;

        return Payroll.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Mark payroll as paid
  Future<Payroll> markPayrollPaid(String id, {String? remarks}) async {
    try {
      return await _withAuth<Payroll>((token) async {
        final payload = remarks != null ? {'remarks': remarks} : <String, dynamic>{};

        final response = await _apiHandler.patch(
          ApiEndpoints.markPayrollPaid(id).url,
          token: token,
          body: payload,
        );

        final data = (response is Map && (response.containsKey('payroll') || response.containsKey('data')))
            ? (response['payroll'] ?? response['data'])
            : response;

        return Payroll.fromMap(Map<String, dynamic>.from(data));
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Calculate net salary for payroll
  Future<Map<String, dynamic>> calculatePayroll(String id) async {
    try {
      return await _withAuth<Map<String, dynamic>>((token) async {
        final response = await _apiHandler.post(
          ApiEndpoints.calculatePayroll(id).url,
          token: token,
          body: {},
        );

        return Map<String, dynamic>.from(response);
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Bulk generate payroll for multiple staff
  Future<Map<String, dynamic>> bulkGeneratePayroll({
    required int month,
    required int year,
    String? department,
    List<String>? staffIds,
  }) async {
    try {
      return await _withAuth<Map<String, dynamic>>((token) async {
        final payload = <String, dynamic>{
          'month': month,
          'year': year,
        };
        if (department != null) payload['department'] = department;
        if (staffIds != null && staffIds.isNotEmpty) payload['staffIds'] = staffIds;

        final response = await _apiHandler.post(
          ApiEndpoints.bulkGeneratePayroll().url,
          token: token,
          body: payload,
        );

        return Map<String, dynamic>.from(response);
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Get payroll summary/statistics
  Future<Map<String, dynamic>> getPayrollSummary({int? month, int? year, String? department}) async {
    try {
      return await _withAuth<Map<String, dynamic>>((token) async {
        var uri = ApiEndpoints.getPayrollSummary().url;
        final params = <String>[];
        if (month != null) params.add('month=$month');
        if (year != null) params.add('year=$year');
        if (department != null && department.isNotEmpty) params.add('department=${Uri.encodeComponent(department)}');
        
        if (params.isNotEmpty) {
          uri += '?${params.join('&')}';
        }

        final response = await _apiHandler.get(uri, token: token);
        return Map<String, dynamic>.from(response);
      });
    } catch (e) {
      rethrow;
    }
  }
}
