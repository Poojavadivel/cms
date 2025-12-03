/**
 * api_constants.dart
 * 
 * PURPOSE: Centralized API endpoint definitions
 * USED BY: All modules making backend API calls
 * 
 * BENEFITS:
 *   ✓ Single source of truth for API endpoints
 *   ✓ Easy to update base URL for different environments
 *   ✓ Type-safe endpoint references
 *   ✓ Prevents hardcoded strings across codebase
 * 
 * USAGE:
 *   import 'package:glowhair/Services/api_constants.dart';
 *   
 *   final url = ApiEndpoints.patients.getAll();
 *   final data = await AuthService.instance.get(url);
 */

/// Base API configuration
class ApiConfig {
  // Environment-based base URLs
  static const String _devBaseUrl = 'http://localhost:3000';
  static const String _stagingBaseUrl = 'http://10.230.173.132:3000';
  static const String _prodBaseUrl = 'https://api.karurgastro.com'; // TODO: Update with production URL
  
  // Current environment (change as needed)
  static const _Environment _currentEnv = _Environment.staging;
  
  /// Get base URL for current environment
  //static const  String baseUrl = 'http://10.41.67.132:3000';
    static const  String baseUrl = 'https://hms-dev.onrender.com';
  
  /// API version
  static const String apiVersion = 'v1';
  
  /// Request timeout duration
  static const Duration timeout = Duration(seconds: 30);
}

enum _Environment { development, staging, production }

/// API Constants - HTTP methods and common values
class ApiConstants {
  // Base URL (delegates to ApiConfig for environment switching)
  static String get baseUrl => ApiConfig.baseUrl;
  
  // HTTP Methods
  static const String post = 'POST';
  static const String get = 'GET';
  static const String put = 'PUT';
  static const String delete = 'DELETE';
  static const String patch = 'PATCH';
}

/// Authentication endpoints
class AuthEndpoints {
  static const String _base = '/api/auth';
  
  static const String login = '$_base/login';
  static const String logout = '$_base/logout';
  static const String refreshToken = '$_base/refresh';
  static const String validateToken = '$_base/validate-token'; // Fixed: was '/validate'
  static const String changePassword = '$_base/change-password';
}

/// Patient management endpoints
class PatientEndpoints {
  static const String _base = '/api/patients';
  
  static String getAll({String? doctorId}) => 
      doctorId != null ? '$_base?doctorId=$doctorId' : _base;
  
  static String getById(String id) => '$_base/$id';
  static String create() => _base;
  static String update(String id) => '$_base/$id';
  static String delete(String id) => '$_base/$id';
  static String search(String query) => '$_base/search?q=$query';
  
  // Vitals
  static String getVitals(String patientId) => '$_base/$patientId/vitals';
  static String addVitals(String patientId) => '$_base/$patientId/vitals';
  static String getLatestVitals(String patientId) => '$_base/$patientId/vitals/latest';
  
  // Documents
  static String getDocuments(String patientId) => '$_base/$patientId/documents';
  static String uploadDocument(String patientId) => '$_base/$patientId/documents';
  static String getDocument(String patientId, String docId) => 
      '$_base/$patientId/documents/$docId';
  static String deleteDocument(String patientId, String docId) => 
      '$_base/$patientId/documents/$docId';
}

/// Doctor-specific endpoints
class DoctorEndpoints {
  static const String _base = '/api/doctors';
  
  static String getMyPatients() => '$_base/patients/my';
  static String getAll() => _base;
  static String getDashboard() => '$_base/dashboard';
  static String getSchedule({DateTime? date}) => 
      date != null 
          ? '$_base/schedule?date=${date.toIso8601String().split('T')[0]}'
          : '$_base/schedule';
}

/// Appointment endpoints
class AppointmentEndpoints {
  static const String _base = '/api/appointments';
  
  static String getAll({String? status, String? doctorId, String? date}) {
    final params = <String>[];
    if (status != null) params.add('status=$status');
    if (doctorId != null) params.add('doctorId=$doctorId');
    if (date != null) params.add('date=$date');
    
    return params.isEmpty ? _base : '$_base?${params.join('&')}';
  }
  
  static String getById(String id) => '$_base/$id';
  static String create() => _base;
  static String update(String id) => '$_base/$id';
  static String delete(String id) => '$_base/$id';
  static String updateStatus(String id) => '$_base/$id/status';
}

/// Lab/Pathology endpoints
class LabEndpoints {
  static const String _base = '/api/pathology';
  
  static String getReports({String? patientId}) => 
      patientId != null ? '$_base/reports?patientId=$patientId' : '$_base/reports';
  
  static String getReportById(String id) => '$_base/reports/$id';
  static String downloadReport(String id) => '$_base/reports/$id/download';
  static const String createReport = '$_base/reports';
  static String updateReport(String id) => '$_base/reports/$id';
  static String deleteReport(String id) => '$_base/reports/$id';
  static const String getPendingTests = '$_base/pending-tests';
}

/// Intake form endpoints
class IntakeEndpoints {
  static const String _base = '/api/intake';
  
  static String create(String patientId) => '$_base/$patientId/intake';
  static String get(String patientId) => '$_base/$patientId/intake';
}

/// Scanner/OCR endpoints (LEGACY - Use MedicalDocumentEndpoints for new code)
class ScannerEndpoints {
  static const String _base = '/api/scanner-enterprise';

  static String scan() => '$_base/scan';
  static const String upload = '$_base/upload';
  static String getReports(String patientId) => '$_base/reports/$patientId';
  static String getReportDetails(String reportId) => '$_base/report/$reportId';
  static String getPdf(String pdfId) => '$_base/pdf/$pdfId';
  static String deletePdf(String pdfId) => '$_base/pdf/$pdfId';
  
  // New separate endpoints
  static String getPrescriptions(String patientId) => '$_base/prescriptions/$patientId';
  static String getLabReports(String patientId) => '$_base/lab-reports/$patientId';
  static String getMedicalHistory(String patientId) => '$_base/medical-history/$patientId';
}



/// Pharmacy endpoints
class PharmacyEndpoints {
  static const String _base = '/api/pharmacy';
  
  static String getMedicines({String? search}) => 
      search != null ? '$_base/medicines?search=$search' : '$_base/medicines';
  
  static String getMedicineById(String id) => '$_base/medicines/$id';
  static String createMedicine() => '$_base/medicines';
  static String updateMedicine(String id) => '$_base/medicines/$id';
  static String deleteMedicine(String id) => '$_base/medicines/$id';
  
  static String getPendingPrescriptions() => '$_base/pending-prescriptions';
  static String dispensePrescription(String intakeId) => '$_base/prescriptions/$intakeId/dispense';
  
  static String getPrescriptions({String? patientId}) => 
      patientId != null 
          ? '$_base/prescriptions?patientId=$patientId' 
          : '$_base/prescriptions';
}

/// Staff management endpoints
class StaffEndpoints {
  static const String _base = '/api/staff';
  
  static String getAll() => _base;
  static String getById(String id) => '$_base/$id';
  static String create() => _base;
  static String update(String id) => '$_base/$id';
  static String delete(String id) => '$_base/$id';
}

/// Payroll management endpoints
class PayrollEndpoints {
  static const String _base = '/api/payroll';
  
  static String getAll() => _base;
  static String getById(String id) => '$_base/$id';
  static String create() => _base;
  static String update(String id) => '$_base/$id';
  static String delete(String id) => '$_base/$id';
  static String approve(String id) => '$_base/$id/approve';
  static String reject(String id) => '$_base/$id/reject';
  static String processPayment(String id) => '$_base/$id/process-payment';
  static String markPaid(String id) => '$_base/$id/mark-paid';
  static String calculate(String id) => '$_base/$id/calculate';
  static String bulkGenerate() => '$_base/bulk/generate';
  static String getSummary() => '$_base/summary/stats';
}

/// Chatbot/AI endpoints
class ChatbotEndpoints {
  static const String _base = '/api/bot';
  
  static const String chat = '$_base/chat';
  static const String listChats = '$_base/chats';
  static String getHistory(String userId) => '$_base/chats/$userId';
  static String clearHistory(String userId) => '$_base/chats/$userId';
}

/// Admin dashboard endpoints
class AdminEndpoints {
  static const String _base = '/api/admin';
  
  static String getDashboard() => '$_base/dashboard';
  static String getStats({String? period}) => 
      period != null ? '$_base/stats?period=$period' : '$_base/stats';
  static String getAuditLogs({int? page, int? limit}) {
    final params = <String>[];
    if (page != null) params.add('page=$page');
    if (limit != null) params.add('limit=$limit');
    
    return params.isEmpty ? '$_base/audit-logs' : '$_base/audit-logs?${params.join('&')}';
  }
}

/// Card/Quick data endpoints (optimized queries)
class CardEndpoints {
  static const String _base = '/api/card';
  
  static String getCard(String patientId) => '$_base/$patientId';
  static String getPatientCard(String patientId) => '$_base/patient/$patientId';
  static String getDoctorCard(String doctorId) => '$_base/doctor/$doctorId';
}

/// Helper class for building URLs with query parameters
class UrlBuilder {
  final String _base;
  final Map<String, dynamic> _params = {};
  
  UrlBuilder(this._base);
  
  UrlBuilder addParam(String key, dynamic value) {
    if (value != null) {
      _params[key] = value.toString();
    }
    return this;
  }
  
  String build() {
    if (_params.isEmpty) return _base;
    
    final query = _params.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return '$_base?$query';
  }
}

// ============================================================================
// LEGACY COMPATIBILITY LAYER
// ============================================================================
// The following classes provide backward compatibility with old Constants.dart
// New code should use the endpoint classes above instead

/// Legacy REST API model class (for backward compatibility)
class RestApi {
  final String url;
  final String method;
  
  RestApi({
    required this.url,
    required this.method,
  });
}

/// Legacy ApiEndpoints class matching old Constants.dart structure
/// Use the new endpoint classes (AuthEndpoints, PatientsEndpoints, etc.) for new code
class ApiEndpoints {
  // Auth
  static RestApi login() => RestApi(url: AuthEndpoints.login, method: ApiConstants.post);
  static RestApi validateToken() => RestApi(url: AuthEndpoints.validateToken, method: ApiConstants.post);
  
  // Patients
  static RestApi getDoctorPatients() => RestApi(url: DoctorEndpoints.getMyPatients(), method: ApiConstants.get);
  static RestApi createPatient() => RestApi(url: PatientEndpoints.create(), method: ApiConstants.post);
  static RestApi getPatients() => RestApi(url: PatientEndpoints.getAll(), method: ApiConstants.get);
  static RestApi getPatientById(String id) => RestApi(url: PatientEndpoints.getById(id), method: ApiConstants.get);
  static RestApi updatePatient(String id) => RestApi(url: PatientEndpoints.update(id), method: ApiConstants.put);
  static RestApi deletePatient(String id) => RestApi(url: PatientEndpoints.delete(id), method: ApiConstants.delete);
  static RestApi patchPatientStatus(String id) => RestApi(url: '/api/patients/$id/status', method: ApiConstants.post);
  static RestApi getProfileCardData(String patientId) => RestApi(url: CardEndpoints.getCard(patientId), method: ApiConstants.get);
  
  // Appointments
  static RestApi createAppointment() => RestApi(url: AppointmentEndpoints.create(), method: ApiConstants.post);
  static RestApi getAppointments() => RestApi(url: AppointmentEndpoints.getAll(), method: ApiConstants.get);
  static RestApi deleteAppointment(String id) => RestApi(url: AppointmentEndpoints.delete(id), method: ApiConstants.delete);
  static RestApi updateAppointment(String id) => RestApi(url: AppointmentEndpoints.update(id), method: ApiConstants.put);
  static RestApi getAppointmentById(String id) => RestApi(url: AppointmentEndpoints.getById(id), method: ApiConstants.get);
  
  // Staff
  static RestApi createStaff() => RestApi(url: StaffEndpoints.create(), method: ApiConstants.post);
  static RestApi getStaffs() => RestApi(url: StaffEndpoints.getAll(), method: ApiConstants.get);
  static RestApi getStaffById(String id) => RestApi(url: StaffEndpoints.getById(id), method: ApiConstants.get);
  static RestApi updateStaff(String id) => RestApi(url: StaffEndpoints.update(id), method: ApiConstants.put);
  static RestApi deleteStaff(String id) => RestApi(url: StaffEndpoints.delete(id), method: ApiConstants.delete);
  
  // Payroll
  static RestApi createPayroll() => RestApi(url: PayrollEndpoints.create(), method: ApiConstants.post);
  static RestApi getPayrolls() => RestApi(url: PayrollEndpoints.getAll(), method: ApiConstants.get);
  static RestApi getPayrollById(String id) => RestApi(url: PayrollEndpoints.getById(id), method: ApiConstants.get);
  static RestApi updatePayroll(String id) => RestApi(url: PayrollEndpoints.update(id), method: ApiConstants.put);
  static RestApi deletePayroll(String id) => RestApi(url: PayrollEndpoints.delete(id), method: ApiConstants.delete);
  static RestApi approvePayroll(String id) => RestApi(url: PayrollEndpoints.approve(id), method: ApiConstants.patch);
  static RestApi rejectPayroll(String id) => RestApi(url: PayrollEndpoints.reject(id), method: ApiConstants.patch);
  static RestApi processPayrollPayment(String id) => RestApi(url: PayrollEndpoints.processPayment(id), method: ApiConstants.patch);
  static RestApi markPayrollPaid(String id) => RestApi(url: PayrollEndpoints.markPaid(id), method: ApiConstants.patch);
  static RestApi calculatePayroll(String id) => RestApi(url: PayrollEndpoints.calculate(id), method: ApiConstants.post);
  static RestApi bulkGeneratePayroll() => RestApi(url: PayrollEndpoints.bulkGenerate(), method: ApiConstants.post);
  static RestApi getPayrollSummary() => RestApi(url: PayrollEndpoints.getSummary(), method: ApiConstants.get);
  
  // Doctors
  static RestApi getAllDoctors() => RestApi(url: DoctorEndpoints.getAll(), method: ApiConstants.get);
  
  // Pharmacy
  static RestApi getPharmacyMedicines() => RestApi(url: PharmacyEndpoints.getMedicines(), method: ApiConstants.get);
  static RestApi getPharmacyMedicineById(String id) => RestApi(url: PharmacyEndpoints.getMedicineById(id), method: ApiConstants.get);
  static RestApi createPharmacyMedicine() => RestApi(url: PharmacyEndpoints.createMedicine(), method: ApiConstants.post);
  static RestApi updatePharmacyMedicine(String id) => RestApi(url: PharmacyEndpoints.updateMedicine(id), method: ApiConstants.put);
  static RestApi deletePharmacyMedicine(String id) => RestApi(url: PharmacyEndpoints.deleteMedicine(id), method: ApiConstants.delete);
  
  // Chatbot
  static RestApi chatbot() => RestApi(url: ChatbotEndpoints.chat, method: ApiConstants.post);
  static RestApi getConversations() => RestApi(url: ChatbotEndpoints.listChats, method: ApiConstants.get);
  static RestApi getConversationMessages(String convoId) => RestApi(url: ChatbotEndpoints.getHistory(convoId), method: ApiConstants.get);
  static RestApi createConversation() => RestApi(url: ChatbotEndpoints.chat, method: ApiConstants.post);
  static RestApi deleteConversation(String convoId) => RestApi(url: ChatbotEndpoints.clearHistory(convoId), method: ApiConstants.delete);
  
  // Intake
  static RestApi addIntake(String patientId) => RestApi(url: IntakeEndpoints.create(patientId), method: ApiConstants.post);
  static RestApi getIntakes(String patientId) => RestApi(url: IntakeEndpoints.get(patientId), method: ApiConstants.get);
  
  // Scanner (Legacy)
  static RestApi scannerUpload() => RestApi(url: ScannerEndpoints.upload, method: ApiConstants.post);
  static RestApi scannerGetReports(String patientId) => RestApi(url: ScannerEndpoints.getReports(patientId), method: ApiConstants.get);
  static RestApi scannerGetPdf(String pdfId) => RestApi(url: '/api/scanner/pdf/$pdfId', method: ApiConstants.get);
  
  // Medical Documents (NEW - using ScannerEndpoints)
  static RestApi uploadMedicalDocument() => RestApi(url: ScannerEndpoints.upload, method: ApiConstants.post);
  static RestApi getPatientPrescriptions(String patientId) => RestApi(url: ScannerEndpoints.getPrescriptions(patientId), method: ApiConstants.get);
  static RestApi getPatientLabReports(String patientId) => RestApi(url: ScannerEndpoints.getLabReports(patientId), method: ApiConstants.get);
  static RestApi getMedicalDocumentPdf(String pdfId) => RestApi(url: ScannerEndpoints.getPdf(pdfId), method: ApiConstants.get);
  static RestApi deleteMedicalDocument(String pdfId) => RestApi(url: ScannerEndpoints.deletePdf(pdfId), method: ApiConstants.delete);
  
  // Pathology
  static RestApi getPathologyReports() => RestApi(url: LabEndpoints.getReports(), method: ApiConstants.get);
  static RestApi createPathologyReport() => RestApi(url: LabEndpoints.createReport, method: ApiConstants.post);
  static RestApi getPathologyReportById(String id) => RestApi(url: LabEndpoints.getReportById(id), method: ApiConstants.get);
  static RestApi updatePathologyReport(String id) => RestApi(url: LabEndpoints.updateReport(id), method: ApiConstants.put);
  static RestApi deletePathologyReport(String id) => RestApi(url: LabEndpoints.deleteReport(id), method: ApiConstants.delete);
  static RestApi downloadPathologyReport(String id) => RestApi(url: LabEndpoints.downloadReport(id), method: ApiConstants.get);
  static RestApi getPendingLabTests() => RestApi(url: LabEndpoints.getPendingTests, method: ApiConstants.get);
}

/// Maps backend error codes to user-friendly messages
class ApiErrors {
  static final Map<int, String> _errorMessages = {
    1001: 'An account with this email already exists.',
    1002: 'No account found with this email address.',
    1003: 'The password you entered is incorrect. Please try again.',
    1004: 'Your session has expired. Please log in again.',
    1005: 'This account has been suspended. Please contact support.',
    5000: 'An unexpected error occurred on the server. Please try again later.',
  };

  /// Returns a user-friendly error message for a given backend error code
  static String getMessage(int code) {
    return _errorMessages[code] ?? 
        'A network error occurred. Please check your connection and try again.';
  }
}
