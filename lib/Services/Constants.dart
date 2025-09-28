import 'package:flutter/material.dart';

/// A simple model class to represent a REST API endpoint,
/// containing its URL and HTTP method.
class RestApi {
  final String url;
  final String method;
  RestApi({
    required this.url,
    required this.method,
  });
}

/// A centralized class for application-wide constants.
class ApiConstants {
  // --- Base URL ---
  /// The base URL for the backend API.
  /// Change this to your actual server address during development/production.
  // static const String baseUrl = "http://10.57.158.132:3000";
   static const String baseUrl = "https://karur-gastro-foundation.onrender.com";// <-- IMPORTANT: Replace with your actual backend URL

  // --- HTTP Methods ---
  static const String post = 'POST';
  static const String get = 'GET';
  static const String put = 'PUT';
  static const String delete = 'DELETE';
}

/// Contains all API endpoint definitions.
class ApiEndpoints {
  /// Endpoint for user login.
  static RestApi login() => RestApi(url: '/api/auth/login', method: ApiConstants.post);

  /// Endpoint to validate an existing authentication token.
  static RestApi validateToken() => RestApi(url: '/api/auth/validate-token', method: ApiConstants.post);


  static RestApi createAppointment() =>
      RestApi(url: '/api/appointments', method: ApiConstants.post);
  static RestApi getAppointments() =>
      RestApi(url: '/api/appointments', method: ApiConstants.get);
  static RestApi deleteAppointment(String id) =>
      RestApi(url: '/api/appointments/$id', method: ApiConstants.delete);
  static RestApi updateAppointment(String id) =>
      RestApi(url: '/api/appointments/$id', method: ApiConstants.put);
  static RestApi getAppointmentById(String id) =>
      RestApi(url: '/api/appointments/$id', method: ApiConstants.get);

  // --- Staff endpoints (add inside ApiEndpoints) ---
  // ----------------- Staff Endpoints -----------------
  static RestApi createStaff() =>
      RestApi(url: '/api/staff', method: ApiConstants.post);

  static RestApi getStaffs() =>
      RestApi(url: '/api/staff', method: ApiConstants.get);

  static RestApi getStaffById(String id) =>
      RestApi(url: '/api/staff/$id', method: ApiConstants.get);

  static RestApi updateStaff(String id) =>
      RestApi(url: '/api/staff/$id', method: ApiConstants.put);

  static RestApi deleteStaff(String id) =>
      RestApi(url: '/api/staff/$id', method: ApiConstants.delete);

// Patients endpoints
  static RestApi createPatient() =>
      RestApi(url: '/api/patients', method: ApiConstants.post);

  static RestApi getPatients() =>
      RestApi(url: '/api/patients', method: ApiConstants.get);

  static RestApi getPatientById(String id) =>
      RestApi(url: '/api/patients/$id', method: ApiConstants.get);

  static RestApi updatePatient(String id) =>
      RestApi(url: '/api/patients/$id', method: ApiConstants.put);

  static RestApi deletePatient(String id) =>
      RestApi(url: '/api/patients/$id', method: ApiConstants.delete);

  static RestApi patchPatientStatus(String id) =>
      RestApi(url: '/api/patients/$id/status', method: ApiConstants.post);

  static RestApi getAllDoctors() =>
      RestApi(url: '/api/doctors', method: ApiConstants.get);

  // Pharmacy endpoints
  static RestApi getPharmacyMedicines() => RestApi(url: '/api/pharmacy/medicines', method: ApiConstants.get);
  static RestApi getPharmacyMedicineById(String id) => RestApi(url: '/api/pharmacy/medicines/$id', method: ApiConstants.get);
  static RestApi createPharmacyMedicine() => RestApi(url: '/api/pharmacy/medicines', method: ApiConstants.post);
  static RestApi updatePharmacyMedicine(String id) => RestApi(url: '/api/pharmacy/medicines/$id', method: ApiConstants.put);
  static RestApi deletePharmacyMedicine(String id) => RestApi(url: '/api/pharmacy/medicines/$id', method: ApiConstants.delete);

// Chatbot endpoints
  // --- FIXED Client-Side API Definitions ---
// URLs have been updated from '/conversations' to '/chats' to match the Node.js backend routes.

  static RestApi chatbot() =>
      RestApi(url: '/api/bot/chat', method: ApiConstants.post);

// FIX: Changed '/conversations' to '/chats' to match backend's GET /api/bot/chats
  static RestApi getConversations() =>
      RestApi(url: '/api/bot/chats', method: ApiConstants.get);

// FIX: Changed '/conversations' to '/chats'.
// NOTE: The backend still needs a specific route (e.g., GET /api/bot/chats/:id/messages)
// implemented to handle fetching the full message history.
  static RestApi getConversationMessages(String convoId) =>
      RestApi(url: '/api/bot/chats/$convoId/messages', method: ApiConstants.get);

// FIX: Changed '/conversations' to '/chats'.
// NOTE: This route is currently redundant, as the backend handles chat creation
// implicitly via the POST /api/bot/chat endpoint if no chatId is provided.
  static RestApi createConversation() =>
      RestApi(url: '/api/bot/chats', method: ApiConstants.post);

// FIX: Changed '/conversations' to '/chats' to match backend's DELETE /api/bot/chats/:id
  static RestApi deleteConversation(String convoId) =>
      RestApi(url: '/api/bot/chats/$convoId', method: ApiConstants.delete);

}






/// Maps backend error codes to user-friendly messages.
class ApiErrors {
  static final Map<int, String> _errorMessages = {
    1001: 'An account with this email already exists.',
    1002: 'No account found with this email address.',
    1003: 'The password you entered is incorrect. Please try again.',
    1004: 'Your session has expired. Please log in again.',
    1005: 'This account has been suspended. Please contact support.',
    5000: 'An unexpected error occurred on the server. Please try again later.',
  };

  /// Returns a user-friendly error message for a given backend error code.
  static String getMessage(int code) {
    return _errorMessages[code] ?? 'A network error occurred. Please check your connection and try again.';
  }
}

