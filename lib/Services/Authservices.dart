import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../Models/Admin.dart';
import '../Models/Doctor.dart';
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
