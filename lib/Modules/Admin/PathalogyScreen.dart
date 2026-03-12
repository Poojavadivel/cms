import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

// Import our new generic table
import '../../Utils/Colors.dart';
import 'Widgets/generic_data_table.dart';
import '../../Services/Authservices.dart';
import '../../Services/api_constants.dart';
import '../../Utils/Api_handler.dart';

// ---------------------------------------------------------------------

// --- Data Models ---
class PathologyReport {
  final String reportId;
  final String patientName;
  final String patientCode;
  final String testName;
  final String collectionDate;
  final String status;
  final String uploaderName;
  final String? fileRef;
  final Map<String, dynamic>? metadata;

  PathologyReport({
    required this.reportId,
    required this.patientName,
    required this.patientCode,
    required this.testName,
    required this.collectionDate,
    required this.status,
    required this.uploaderName,
    this.fileRef,
    this.metadata,
  });

  factory PathologyReport.fromMap(Map<String, dynamic> map) {
    return PathologyReport(
      reportId: map['_id'] ?? map['reportId'] ?? '',
      patientName: map['patientName'] ?? 'Unknown',
      patientCode: map['patientCode'] ?? 'PAT-00',
      testName: map['testType'] ?? map['testName'] ?? 'N/A',
      collectionDate: map['createdAt'] ?? map['collectionDate'] ?? '',
      status: (map['fileRef'] != null) ? 'Completed' : 'Pending',
      uploaderName: map['uploaderName'] ?? 'Admin',
      fileRef: map['fileRef'],
      metadata: map['metadata'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      '_id': reportId,
      'patientName': patientName,
      'patientCode': patientCode,
      'testType': testName,
      'createdAt': collectionDate,
      'fileRef': fileRef,
      'uploaderName': uploaderName,
      'metadata': metadata,
    };
  }
}

// Common test types for dropdown
const List<String> _commonTestTypes = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Thyroid Function Test',
  'Blood Glucose Test',
  'Liver Function Test',
  'Kidney Function Test',
  'Urinalysis',
  'X-Ray',
  'CT Scan',
  'MRI Scan',
  'Ultrasound',
  'ECG/EKG',
  'Biopsy',
  'Hormone Panel',
  'Allergy Test',
  'COVID-19 Test',
  'Other',
];

class PathologyScreen extends StatefulWidget {
  const PathologyScreen({super.key});

  @override
  State<PathologyScreen> createState() => _PathologyScreenState();
}

class _PathologyScreenState extends State<PathologyScreen> {
  List<PathologyReport> _allReports = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  String _statusFilter = 'All';
  String? _errorMessage;
  final AuthService _authService = AuthService.instance;
  String _authToken = '';

  @override
  void initState() {
    super.initState();
    _loadToken();
    _fetchReports();
  }

  Future<void> _loadToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token');
      if (mounted) {
        setState(() {
          _authToken = token ?? '';
        });
      }
    } catch (e) {
      // Error loading token - silent fail
      debugPrint('Error loading token: $e');
    }
  }

  Future<void> _fetchReports() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final data = await _authService.get(ApiEndpoints.getPathologyReports().url);
      
      if (data['success'] == true) {
        final reports = (data['reports'] as List?)?.map((r) => PathologyReport.fromMap(r)).toList() ?? [];
        if (mounted) {
          setState(() {
            _allReports = reports;
            _isLoading = false;
          });
        }
      } else {
        throw ApiException(data['message'] ?? 'Failed to load reports');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _onAddPressed() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _EnterpriseAddReportDialog(),
    );

    if (result != null && mounted) {
      setState(() => _isLoading = true);
      
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('x-auth-token');
        
        if (token == null) {
          throw ApiException('No authentication token found');
        }

        final request = http.MultipartRequest(
          'POST',
          Uri.parse('${ApiConfig.baseUrl}${ApiEndpoints.createPathologyReport().url}'),
        );

        request.headers['Authorization'] = 'Bearer $token';
        request.fields['patientId'] = result['patientId'];
        request.fields['testType'] = result['testName'];
        request.fields['metadata'] = json.encode({'notes': result['notes'] ?? ''});

        if (result['filePath'] != null) {
          request.files.add(await http.MultipartFile.fromPath('file', result['filePath']));
        }

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode == 201) {
          final data = json.decode(response.body);
          if (data['success'] == true) {
            await _fetchReports();
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.white, size: 20),
                      const SizedBox(width: 12),
                      Text('Report created successfully', style: GoogleFonts.inter()),
                    ],
                  ),
                  backgroundColor: const Color(0xFF10B981),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              );
            }
          } else {
            throw ApiException(data['message'] ?? 'Failed to create report');
          }
        } else {
          throw ApiException('Server error: ${response.statusCode}');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error creating report: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() { if (_currentPage > 0) setState(() => _currentPage--); }

  Future<void> _onView(int index, List<PathologyReport> list) async {
    final report = list[index];
    await _viewReportDialog(report);
  }

  Future<void> _viewReportDialog(PathologyReport report) async {
    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: AppColors.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          width: 900,
          constraints: const BoxConstraints(maxHeight: 800),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppColors.kMuted)),
                  gradient: LinearGradient(
                    colors: [AppColors.primary.withValues(alpha: 0.1), AppColors.cardBackground],
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(Iconsax.document_text, color: AppColors.primary, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Test Report Details', style: GoogleFonts.lexend(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.kTextPrimary)),
                          Text(report.patientCode, style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
                        ],
                      ),
                    ),
                    if (report.fileRef != null)
                      IconButton(
                        icon: const Icon(Iconsax.document_download),
                        tooltip: 'Download Report',
                        onPressed: () => _downloadReport(report.reportId),
                      ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Report Information Card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.kBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.kMuted),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Iconsax.user, color: AppColors.primary, size: 20),
                                const SizedBox(width: 8),
                                Text('Patient Information', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow('Patient Name', report.patientName),
                            _buildInfoRow('Patient Code', report.patientCode),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(Iconsax.activity, color: AppColors.primary, size: 20),
                                const SizedBox(width: 8),
                                Text('Test Information', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow('Test Type', report.testName),
                            _buildInfoRow('Collection Date', _formatDate(report.collectionDate)),
                            _buildInfoRow('Uploaded By', report.uploaderName),
                            _buildInfoRow('Status', report.status),
                            if (report.metadata?['notes'] != null) ...[
                              const SizedBox(height: 16),
                              Text('Notes', style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.kMuted),
                                ),
                                child: Text(
                                  report.metadata!['notes'],
                                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      // File Preview Section
                      if (report.fileRef != null) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.kBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.kMuted),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Iconsax.document, color: AppColors.primary, size: 20),
                                  const SizedBox(width: 8),
                                  Text('Report File', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary)),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _buildFilePreview(report),
                            ],
                          ),
                        ),
                      ] else ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: AppColors.kBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.kMuted, style: BorderStyle.solid),
                          ),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Iconsax.document_upload, color: AppColors.kTextSecondary, size: 48),
                                const SizedBox(height: 12),
                                Text('No file uploaded yet', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilePreview(PathologyReport report) {
    final fileUrl = '${ApiConfig.baseUrl}${ApiEndpoints.downloadPathologyReport(report.reportId).url}';
    final fileName = report.metadata?['originalFilename'] ?? 'report';
    final fileExtension = fileName.split('.').last.toLowerCase();

    // Check if it's an image
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].contains(fileExtension)) {
      return Column(
        children: [
          Container(
            constraints: const BoxConstraints(maxHeight: 400),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.kMuted),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                fileUrl,
                headers: {'Authorization': 'Bearer ${_getToken()}'},
                fit: BoxFit.contain,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    height: 300,
                    alignment: Alignment.center,
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                          : null,
                    ),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 300,
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline, size: 48, color: Colors.red),
                        const SizedBox(height: 12),
                        Text('Failed to load image', style: GoogleFonts.inter(color: Colors.red)),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => _downloadReport(report.reportId),
                          child: const Text('Download File'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(fileName, style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary)),
        ],
      );
    }
    
    // For PDF, show preview card with view option
    if (fileExtension == 'pdf') {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Iconsax.document_text,
                    color: AppColors.primary,
                    size: 48,
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        fileName,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kTextPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'PDF Document',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _openFileInNewTab(report.reportId),
                    icon: const Icon(Iconsax.eye, size: 20),
                    label: const Text('View Document'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _downloadReport(report.reportId),
                    icon: const Icon(Iconsax.document_download, size: 20),
                    label: const Text('Download'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }
    
    // For other documents, show a preview card
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Iconsax.document,
              color: AppColors.primary,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fileName,
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Click to view/download ${fileExtension.toUpperCase()} file',
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Row(
            children: [
              IconButton(
                onPressed: () => _openFileInNewTab(report.reportId),
                icon: const Icon(Iconsax.eye, size: 20),
                tooltip: 'View',
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  foregroundColor: AppColors.primary,
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () => _downloadReport(report.reportId),
                icon: const Icon(Iconsax.document_download, size: 18),
                label: const Text('Download'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openFileInNewTab(String reportId) {
    final url = '${ApiConfig.baseUrl}${ApiEndpoints.downloadPathologyReport(reportId).url}';
    // For Flutter web, this would open in a new tab
    // For mobile, you'd use url_launcher
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Opening file...', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(
                url,
                style: GoogleFonts.inter(fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 3),
        ),
      );
      // TODO: For production, implement actual file opening:
      // - For web: use dart:html - html.window.open(url, '_blank');
      // - For mobile: use url_launcher - launchUrl(Uri.parse(url));
    }
  }

  String _getToken() {
    return _authToken;
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary)),
        ],
      ),
    );
  }

  Future<void> _onEdit(int index, List<PathologyReport> list) async {
    final report = list[index];
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _EnterpriseEditReportDialog(report: report),
    );

    if (result != null && mounted) {
      setState(() => _isLoading = true);
      
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('x-auth-token');
        
        if (token == null) {
          throw ApiException('No authentication token found');
        }

        final request = http.MultipartRequest(
          'PUT',
          Uri.parse('${ApiConfig.baseUrl}${ApiEndpoints.updatePathologyReport(report.reportId).url}'),
        );

        request.headers['Authorization'] = 'Bearer $token';
        request.fields['testType'] = result['testName'];
        request.fields['metadata'] = json.encode({'notes': result['notes'] ?? ''});

        if (result['filePath'] != null) {
          request.files.add(await http.MultipartFile.fromPath('file', result['filePath']));
        }

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data['success'] == true) {
            await _fetchReports();
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.white, size: 20),
                      const SizedBox(width: 12),
                      Text('Report updated successfully', style: GoogleFonts.inter()),
                    ],
                  ),
                  backgroundColor: const Color(0xFF10B981),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              );
            }
          } else {
            throw ApiException(data['message'] ?? 'Failed to update report');
          }
        } else {
          throw ApiException('Server error: ${response.statusCode}');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error updating report: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  Future<void> _onDelete(int index, List<PathologyReport> list) async {
    final report = list[index];
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        title: Text('Delete Report', style: GoogleFonts.inter(color: AppColors.kTextPrimary)),
        content: Text('Are you sure you want to delete this pathology report?', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      setState(() => _isLoading = true);
      
      try {
        final data = await _authService.delete(ApiEndpoints.deletePathologyReport(report.reportId).url);
        
        if (data['success'] == true) {
          await _fetchReports();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Report deleted successfully'),
                backgroundColor: Color(0xFF10B981),
              ),
            );
          }
        } else {
          throw ApiException(data['message'] ?? 'Failed to delete report');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error deleting report: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  Future<void> _downloadReport(String reportId) async {
    try {
      final url = '${ApiConfig.baseUrl}${ApiEndpoints.downloadPathologyReport(reportId).url}';
      // For web, open in new tab
      if (mounted) {
        // You can use url_launcher package or html package to open in new tab
        // For now, showing URL - in production, implement proper download
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Iconsax.document_download, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text('Opening file...', style: GoogleFonts.inter())),
              ],
            ),
            backgroundColor: AppColors.primary,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            duration: const Duration(seconds: 2),
          ),
        );
        
        // For Flutter web, use dart:html to open in new tab
        // ignore: avoid_web_libraries_in_flutter
        // html.window.open(url, '_blank');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy').format(dateTime);
    } catch (e) {
      return date.toString();
    }
  }

  // Method to get the filtered list of reports
  List<PathologyReport> _getFilteredReports() {
    return _allReports.where((r) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = r.patientName.toLowerCase().contains(q) || 
                           r.patientCode.toLowerCase().contains(q) || 
                           r.testName.toLowerCase().contains(q);
      final matchesFilter = _statusFilter == 'All' || r.status == _statusFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _statusChip(String status) {
    Color bg;
    Color fg;

    switch (status) {
      case 'Completed':
        bg = Colors.green.withValues(alpha: 0.12);
        fg = Colors.green;
        break;
      case 'Pending':
        bg = Colors.orange.withValues(alpha: 0.12);
        fg = Colors.orange;
        break;
      case 'In Progress':
        bg = Colors.blue.withValues(alpha: 0.12);
        fg = Colors.blue;
        break;
      default:
        bg = Colors.grey.withValues(alpha: 0.12);
        fg = Colors.grey;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildStatusFilter() {
    final statuses = ['All', 'Completed', 'Pending'];
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      tooltip: 'Filter by Status',
      onSelected: (String newValue) {
        setState(() {
          _statusFilter = newValue;
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        return statuses.map((String value) {
          return PopupMenuItem<String>(
            value: value,
            child: Row(
              children: [
                if (value == _statusFilter)
                  const Icon(Icons.check, size: 16, color: Color(0xFF0891B2)),
                if (value == _statusFilter)
                  const SizedBox(width: 8),
                Text(value, style: GoogleFonts.inter()),
              ],
            ),
          );
        }).toList();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Show error message if there's an error
    if (_errorMessage != null && !_isLoading) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Iconsax.warning_2, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    'Error Loading Reports',
                    style: GoogleFonts.lexend(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.kTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _errorMessage!,
                    style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _fetchReports,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final filtered = _getFilteredReports();

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedReports = startIndex >= filtered.length
        ? <PathologyReport>[]
        : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['PATIENT CODE', 'PATIENT NAME', 'TEST NAME', 'DATE', 'UPLOADED BY', 'STATUS'];
    final rows = paginatedReports.map((p) {
      return [
        Text(p.patientCode, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary)),
        Text(p.patientName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        Text(p.testName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        Text(_formatDate(p.collectionDate), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        Text(p.uploaderName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary)),
        _statusChip(p.status),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Pathology Reports",
            headers: headers,
            rows: rows,
            searchQuery: _searchQuery,
            onSearchChanged: _onSearchChanged,
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: 10,
            onPreviousPage: _prevPage,
            onNextPage: _nextPage,
            isLoading: _isLoading,
            onAddPressed: _onAddPressed,
            filters: [_buildStatusFilter()],
            hideHorizontalScrollbar: true,
            onView: (i) => _onView(i, paginatedReports),
            onEdit: (i) => _onEdit(i, paginatedReports),
            onDelete: (i) => _onDelete(i, paginatedReports),
            onRefresh: _fetchReports,
          ),
        ),
      ),
    );
  }
}

// ================================================================
// ENTERPRISE ADD DIALOG - PROFESSIONAL TEAL THEME
// ================================================================
class _EnterpriseAddReportDialog extends StatefulWidget {
  @override
  State<_EnterpriseAddReportDialog> createState() => _EnterpriseAddReportDialogState();
}

class _EnterpriseAddReportDialogState extends State<_EnterpriseAddReportDialog> {
  final _formKey = GlobalKey<FormState>();
  final _patientIdCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _customTestTypeCtrl = TextEditingController();
  String _selectedTestType = _commonTestTypes.first;
  String? _selectedFilePath;
  String? _selectedFileName;
  bool _isSaving = false;

  @override
  void dispose() {
    _patientIdCtrl.dispose();
    _notesCtrl.dispose();
    _customTestTypeCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    );
    
    if (result != null) {
      setState(() {
        _selectedFilePath = result.files.single.path;
        _selectedFileName = result.files.single.name;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_patientIdCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Patient ID')),
      );
      return;
    }

    setState(() => _isSaving = true);
    await Future.delayed(const Duration(milliseconds: 500));

    // Use custom test type if "Other" is selected, otherwise use selected type
    final testName = _selectedTestType == 'Other' && _customTestTypeCtrl.text.isNotEmpty
        ? _customTestTypeCtrl.text.trim()
        : _selectedTestType;

    final result = {
      'patientId': _patientIdCtrl.text.trim(),
      'testName': testName,
      'notes': _notesCtrl.text.trim(),
      'filePath': _selectedFilePath,
    };

    if (mounted) Navigator.of(context).pop(result);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      child: Container(
        width: 600,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0891B2), Color(0xFF0E7490), Color(0xFF155E75)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.add_circle_outline, color: Colors.white, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('New Pathology Report', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
                        const SizedBox(height: 4),
                        Text('Fill in report details', style: GoogleFonts.inter(fontSize: 14, color: Colors.white70)),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Flexible(
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _patientIdCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Patient ID *',
                          hintText: 'Enter patient ID',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Iconsax.user),
                        ),
                        validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _selectedTestType,
                        decoration: const InputDecoration(
                          labelText: 'Test Type *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Iconsax.activity),
                        ),
                        items: _commonTestTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                        onChanged: (v) => setState(() => _selectedTestType = v!),
                      ),
                      const SizedBox(height: 16),
                      // Show custom test type field if "Other" is selected
                      if (_selectedTestType == 'Other') ...[
                        TextFormField(
                          controller: _customTestTypeCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Custom Test Type *',
                            hintText: 'Enter custom test type',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Iconsax.edit),
                          ),
                          validator: (v) => (v?.isEmpty ?? true) ? 'Required when Other is selected' : null,
                        ),
                        const SizedBox(height: 16),
                      ],
                      TextFormField(
                        controller: _notesCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Notes (Optional)',
                          hintText: 'Enter any additional notes',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Iconsax.note_1),
                        ),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: _selectFile,
                        icon: const Icon(Iconsax.document_upload),
                        label: Text(_selectedFileName ?? 'Upload Report File (Optional)'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          minimumSize: const Size(double.infinity, 48),
                        ),
                      ),
                      if (_selectedFileName != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Selected: $_selectedFileName',
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF10B981)),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0891B2),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isSaving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Create Report', style: TextStyle(color: Colors.white, fontSize: 15)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ================================================================
// ENTERPRISE EDIT DIALOG - PROFESSIONAL TEAL THEME
// ================================================================
class _EnterpriseEditReportDialog extends StatefulWidget {
  final PathologyReport report;
  const _EnterpriseEditReportDialog({required this.report});

  @override
  State<_EnterpriseEditReportDialog> createState() => _EnterpriseEditReportDialogState();
}

class _EnterpriseEditReportDialogState extends State<_EnterpriseEditReportDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _notesCtrl;
  late TextEditingController _customTestTypeCtrl;
  String _selectedTestType = 'Other'; // Initialize with default value
  String? _selectedFilePath;
  String? _selectedFileName;
  bool _isSaving = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    // Check if the test type from database exists in the dropdown list
    // If not, set it to "Other"
    final testName = widget.report.testName;
    if (_commonTestTypes.contains(testName)) {
      _selectedTestType = testName;
      _customTestTypeCtrl = TextEditingController();
    } else {
      // If the test type doesn't match our predefined list, use "Other"
      _selectedTestType = 'Other';
      _customTestTypeCtrl = TextEditingController(text: testName);
    }
    _notesCtrl = TextEditingController(text: widget.report.metadata?['notes'] ?? '');
    _isInitialized = true;
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    _customTestTypeCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    );
    
    if (result != null) {
      setState(() {
        _selectedFilePath = result.files.single.path;
        _selectedFileName = result.files.single.name;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    await Future.delayed(const Duration(milliseconds: 500));

    // Use custom test type if "Other" is selected, otherwise use selected type
    final testName = _selectedTestType == 'Other' && _customTestTypeCtrl.text.isNotEmpty
        ? _customTestTypeCtrl.text.trim()
        : _selectedTestType;

    final result = {
      'reportId': widget.report.reportId,
      'testName': testName,
      'notes': _notesCtrl.text.trim(),
      'filePath': _selectedFilePath,
    };

    if (mounted) Navigator.of(context).pop(result);
  }

  @override
  Widget build(BuildContext context) {
    // Don't build until initialization is complete
    if (!_isInitialized) {
      return Dialog(
        child: Container(
          padding: const EdgeInsets.all(40),
          child: const Center(child: CircularProgressIndicator()),
        ),
      );
    }
    
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      child: Container(
        width: 600,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0891B2), Color(0xFF0E7490), Color(0xFF155E75)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.edit_outlined, color: Colors.white, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Edit Pathology Report', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
                        const SizedBox(height: 4),
                        Text('Report ID: ${widget.report.reportId}', style: GoogleFonts.inter(fontSize: 14, color: Colors.white70)),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Flexible(
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      // Show original test type if it doesn't match our list
                      if (!_commonTestTypes.contains(widget.report.testName)) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline, color: Colors.orange, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Original Test Type:',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.orange.shade800,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      widget.report.testName,
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.orange.shade900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      DropdownButtonFormField<String>(
                        value: _selectedTestType,
                        decoration: const InputDecoration(
                          labelText: 'Test Type',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Iconsax.activity),
                        ),
                        items: _commonTestTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                        onChanged: (v) => setState(() => _selectedTestType = v!),
                      ),
                      const SizedBox(height: 16),
                      // Show custom test type field if "Other" is selected
                      if (_selectedTestType == 'Other') ...[
                        TextFormField(
                          controller: _customTestTypeCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Custom Test Type',
                            hintText: 'Enter custom test type',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Iconsax.edit),
                          ),
                          validator: (v) => (v?.isEmpty ?? true) ? 'Required when Other is selected' : null,
                        ),
                        const SizedBox(height: 16),
                      ],
                      TextFormField(
                        controller: _notesCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Notes',
                          hintText: 'Enter any additional notes',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Iconsax.note_1),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (widget.report.fileRef != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF10B981)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Current file uploaded',
                                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF10B981), fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      OutlinedButton.icon(
                        onPressed: _selectFile,
                        icon: const Icon(Iconsax.document_upload),
                        label: Text(_selectedFileName ?? (widget.report.fileRef != null ? 'Upload New File' : 'Upload Report File')),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          minimumSize: const Size(double.infinity, 48),
                        ),
                      ),
                      if (_selectedFileName != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'New file: $_selectedFileName',
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF10B981)),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0891B2),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isSaving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Update Report', style: TextStyle(color: Colors.white, fontSize: 15)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
