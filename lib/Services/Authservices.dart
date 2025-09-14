import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../Models/Admin.dart';
import '../Models/Doctor.dart';
import '../Models/Patients.dart';
import '../Models/User.dart';
import '../Models/appointment_draft.dart';
import '../Models/dashboardmodels.dart';
import '../Models/staff.dart';
import '../Utils/Api_handler.dart';
import 'constants.dart';

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

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> _clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<T> _withAuth<T>(Future<T> Function(String token) fn) async {
    final token = await _getToken();
    if (token == null) throw ApiException('Not logged in');
    return await fn(token);
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

      final String token = response['token'];
      final Map<String, dynamic> userData = response['user'];

      await _saveToken(token);

      final user = _parseUserRole(userData);

      return AuthResult(user: user, token: token);
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

      final response = await _apiHandler.post(
        ApiEndpoints.validateToken().url,
        token: token,
      );

      final user = _parseUserRole(response);

      return AuthResult(user: user, token: token);
    } catch (e) {
      return null;
    }
  }

  /// Signs the user out by clearing their session token.
  Future<void> signOut() async {
    await _clearToken();
  }

  // -------------------- Appointments (existing methods) --------------------

  /// Creates a new appointment in the backend.
  Future<bool> createAppointment(AppointmentDraft draft) async {
    try {
      final token = await _getToken();

      if (token == null) {
        print("⚠️ No auth token found. User may not be logged in.");
        return false;
      }

      final response = await _apiHandler.post(
        ApiEndpoints.createAppointment().url,
        token: token,
        body: draft.toJson(),
      );

      print("✅ Appointment created successfully: $response");
      return true;
    } on ApiException catch (e) {
      print("❌ API Exception while creating appointment: ${e.message}");
      return false;
    } catch (e) {
      print("💥 Unexpected error creating appointment: $e");
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

      // ✅ handle both `{ appointments: [...] }` and raw `[...]`
      List data;
      if (response is List) {
        data = response;
      } else if (response is Map && response.containsKey('appointments')) {
        data = response['appointments'] as List;
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

      if (response['success'] == true) {
        print("✅ Appointment $appointmentId deleted successfully");
        return true;
      } else {
        print("❌ Failed to delete appointment: ${response['message']}");
        return false;
      }
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

      final response = await _apiHandler.put(
        ApiEndpoints.updateAppointment(draft.id!).url,
        body: draft.toJson(),
        token: token,
      );

      return response["success"] == true || response["status"] == 200;
    } catch (e) {
      print("❌ Failed to edit appointment: $e");
      rethrow;
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

      print("📦 API response for appointment $id: $response");

      // unwrap `{ appointment: {...} }`
      final data = (response is Map && response.containsKey('appointment'))
          ? response['appointment']
          : response;

      return AppointmentDraft.fromJson(data);
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

      return await _withAuth<bool>((token) async {
        final response = await _apiHandler.put(
          ApiEndpoints.updatePharmacyMedicine(id).url,
          token: token,
          body: payload,
        );

        if (response is Map && (response['success'] == true)) {
          return true;
        }

        final data = (response is Map && (response.containsKey('medicine') || response.containsKey('data')))
            ? (response['medicine'] ?? response['data'])
            : response;

        return data != null;
      });
    } catch (e) {
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

  // -------------------- Role parsing --------------------
  dynamic _parseUserRole(Map<String, dynamic> userData) {
    final baseUser = User.fromMap(userData);

    if (baseUser.role == UserRole.admin) {
      return Admin(userProfile: baseUser);
    } else if (baseUser.role == UserRole.doctor) {
      return Doctor.fromMap(userData);
    } else {
      throw ApiException('Invalid user role received from server.');
    }
  }

}
