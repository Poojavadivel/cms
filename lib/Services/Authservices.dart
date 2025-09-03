import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../Models/Admin.dart';
import '../Models/Doctor.dart';
import '../Models/User.dart';
import '../Models/appointment_draft.dart';
import '../Models/dashboardmodels.dart';
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

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('x-auth-token', token);

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
      final prefs = await SharedPreferences.getInstance();
      final String? token = prefs.getString('x-auth-token');

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
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('x-auth-token');
  }

  /// Creates a new appointment in the backend.
  Future<bool> createAppointment(AppointmentDraft draft) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token');

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
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token');

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
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token');

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
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token');

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
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token');

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


  /// Parse role
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
