// lib/Modules/Pathologist/test_reports_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../Utils/Colors.dart';
import '../../Services/Authservices.dart';
import '../../Services/api_constants.dart';
import '../../Utils/Api_handler.dart';
import 'package:shimmer/shimmer.dart';

class PathologistTestReportsPage extends StatefulWidget {
  const PathologistTestReportsPage({super.key});

  @override
  State<PathologistTestReportsPage> createState() => _PathologistTestReportsPageState();
}

class _PathologistTestReportsPageState extends State<PathologistTestReportsPage> {
  final _searchController = TextEditingController();
  final AuthService _authService = AuthService.instance;
  List<dynamic> _reports = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _statusFilter = 'All'; // All, Completed, Pending
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadReports() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _authService.get(ApiEndpoints.getPathologyReports().url);
      
      if (data['success'] == true) {
        if (mounted) {
          setState(() {
            _reports = data['reports'] ?? [];
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

  Future<void> _showAddReportDialog() async {
    final testNameController = TextEditingController();
    final notesController = TextEditingController();
    final patientIdController = TextEditingController();
    String? selectedFile;
    String? selectedFileName;

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.cardBackground,
          title: Text('Add Test Report', style: GoogleFonts.inter(color: AppColors.kTextPrimary)),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: patientIdController,
                    decoration: InputDecoration(
                      labelText: 'Patient ID',
                      hintText: 'Enter patient ID',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      filled: true,
                      fillColor: AppColors.kBg,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: testNameController,
                    decoration: InputDecoration(
                      labelText: 'Test Name',
                      hintText: 'e.g., Blood Test, X-Ray, etc.',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      filled: true,
                      fillColor: AppColors.kBg,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Notes',
                      hintText: 'Enter any additional notes',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      filled: true,
                      fillColor: AppColors.kBg,
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () async {
                      FilePickerResult? result = await FilePicker.platform.pickFiles(
                        type: FileType.custom,
                        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
                      );
                      if (result != null) {
                        setDialogState(() {
                          selectedFile = result.files.single.path;
                          selectedFileName = result.files.single.name;
                        });
                      }
                    },
                    icon: const Icon(Iconsax.document_upload),
                    label: Text(selectedFileName ?? 'Upload File'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    ),
                  ),
                  if (selectedFileName != null) ...[
                    const SizedBox(height: 8),
                    Text('Selected: $selectedFileName', style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary)),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (patientIdController.text.isEmpty || testNameController.text.isEmpty) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please fill required fields')),
                    );
                  }
                  return;
                }

                Navigator.pop(context);
                await _uploadReport(
                  patientIdController.text,
                  testNameController.text,
                  notesController.text,
                  selectedFile,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Add Report'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _uploadReport(String patientId, String testName, String notes, String? filePath) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Get token through SharedPreferences directly
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
      request.fields['patientId'] = patientId;
      request.fields['testType'] = testName;
      request.fields['metadata'] = json.encode({'notes': notes});

      if (filePath != null) {
        request.files.add(await http.MultipartFile.fromPath('file', filePath));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Report added successfully')),
            );
          }
          await _loadReports();
        } else {
          throw ApiException(data['message'] ?? 'Failed to add report');
        }
      } else {
        throw ApiException('Server error: ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _viewReport(dynamic report) async {
    if (!mounted) return;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: AppColors.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          width: 900,
          constraints: const BoxConstraints(maxHeight: 700),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppColors.kMuted)),
                  gradient: LinearGradient(
                    colors: [AppColors.primary.withValues(alpha: 0.1), AppColors.cardBackground],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
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
                          const SizedBox(height: 4),
                          Text('View and manage lab report', style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                      tooltip: 'Close',
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Patient Info Card
                      _buildInfoCard(
                        icon: Iconsax.user,
                        title: 'Patient Information',
                        children: [
                          _buildDetailRow('Patient Name', report['patientName'] ?? 'Unknown'),
                          _buildDetailRow('Patient Code', report['patientCode'] ?? 'PAT-00'),
                          _buildDetailRow('Patient ID', report['patientId'] ?? 'N/A'),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Test Info Card
                      _buildInfoCard(
                        icon: Iconsax.activity,
                        title: 'Test Information',
                        children: [
                          _buildDetailRow('Test Type', report['testType'] ?? 'N/A'),
                          _buildDetailRow('Test Date', _formatDate(report['createdAt'])),
                          _buildDetailRow('Uploaded By', report['uploaderName'] ?? 'Admin'),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Notes Card
                      if (report['metadata'] != null && report['metadata']['notes'] != null)
                        _buildInfoCard(
                          icon: Iconsax.note_1,
                          title: 'Notes',
                          children: [
                            _buildDetailRow('', report['metadata']['notes']),
                          ],
                        ),
                      const SizedBox(height: 16),
                      // File Upload Section
                      _buildInfoCard(
                        icon: Iconsax.document_upload,
                        title: 'Test Report File',
                        children: [
                          if (report['fileRef'] != null) ...[
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.kBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Icon(Iconsax.document, color: AppColors.primary, size: 24),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          report['metadata']?['originalFilename'] ?? report['fileRef'] ?? 'Report File',
                                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Click to download',
                                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.kTextSecondary),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton.icon(
                                    onPressed: () => _downloadReport(report['_id']),
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
                            ),
                          ] else ...[
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.kBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.kMuted, style: BorderStyle.solid),
                              ),
                              child: Column(
                                children: [
                                  Icon(Iconsax.document_upload, color: AppColors.kTextSecondary, size: 48),
                                  const SizedBox(height: 12),
                                  Text('No file uploaded yet', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary)),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () => _uploadFileForReport(report),
                                    icon: const Icon(Iconsax.document_upload, size: 18),
                                    label: const Text('Upload Report File'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              // Footer Actions
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: AppColors.kMuted)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('Close', style: GoogleFonts.inter(fontSize: 15, color: AppColors.kTextSecondary)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard({required IconData icon, required String title, required List<Widget> children}) {
    return Container(
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
              Icon(icon, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary)),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Future<void> _uploadFileForReport(dynamic report) async {
    Navigator.pop(context); // Close view dialog
    
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    );
    
    if (result != null && mounted) {
      setState(() {
        _isLoading = true;
      });
      
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('x-auth-token');
        
        if (token == null) {
          throw ApiException('No authentication token found');
        }

        final request = http.MultipartRequest(
          'PUT',
          Uri.parse('${ApiConfig.baseUrl}${ApiEndpoints.updatePathologyReport(report['_id']).url}'),
        );

        request.headers['Authorization'] = 'Bearer $token';
        request.files.add(await http.MultipartFile.fromPath('file', result.files.single.path!));

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data['success'] == true) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Report file uploaded successfully')),
              );
            }
            await _loadReports();
          } else {
            throw ApiException(data['message'] ?? 'Failed to upload file');
          }
        } else {
          throw ApiException('Server error: ${response.statusCode}');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error uploading file: $e')),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  Widget _buildStatusChip(bool hasFile) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: hasFile 
              ? const Color(0xFF10B981).withValues(alpha: 0.12)
              : const Color(0xFFF59E0B).withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: hasFile ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(width: 7),
            Text(
              hasFile ? 'Done' : 'Pending',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: hasFile ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
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

  Future<void> _downloadReport(String reportId) async {
    try {
      final url = '${ApiConfig.baseUrl}${ApiEndpoints.downloadPathologyReport(reportId).url}';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download URL: $url')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _deleteReport(String reportId) async {
    if (!mounted) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        title: Text('Delete Report', style: GoogleFonts.inter(color: AppColors.kTextPrimary)),
        content: Text('Are you sure you want to delete this report?', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
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
      try {
        final data = await _authService.delete(ApiEndpoints.deletePathologyReport(reportId).url);
        
        if (data['success'] == true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Report deleted successfully')),
            );
          }
          await _loadReports();
        } else {
          throw ApiException(data['message'] ?? 'Failed to delete report');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy').format(dateTime); // Date only, no time
    } catch (e) {
      return date.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Page Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(Iconsax.document_text, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Test Reports',
                    style: GoogleFonts.lexend(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                      letterSpacing: -0.3,
                    ),
                  ),
                  Text(
                    'Manage pathology test reports and results',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Integrated Search Bar with Filter and Add Button
          Container(
            height: 56,
            padding: const EdgeInsets.only(left: 16, right: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Search Icon
                Icon(Iconsax.search_normal_1, color: const Color(0xFF64748B), size: 20),
                const SizedBox(width: 12),
                // Search Field
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _currentPage = 0),
                    decoration: InputDecoration(
                      hintText: 'Search by patient name, code, or test type...',
                      hintStyle: GoogleFonts.inter(
                        fontSize: 14,
                        color: const Color(0xFF94A3B8),
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                    ),
                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF0F172A)),
                  ),
                ),
                const SizedBox(width: 12),
                // Divider
                Container(
                  width: 1,
                  height: 32,
                  color: const Color(0xFFE2E8F0),
                ),
                const SizedBox(width: 8),
                // Status Filter Dropdown - Compact
                PopupMenuButton<String>(
                  initialValue: _statusFilter,
                  offset: const Offset(0, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  onSelected: (String value) {
                    setState(() {
                      _statusFilter = value;
                      _currentPage = 0;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _statusFilter == 'All' ? Iconsax.filter : (_statusFilter == 'Completed' ? Iconsax.tick_circle : Iconsax.clock),
                          size: 16,
                          color: _statusFilter == 'All' ? const Color(0xFF64748B) : (_statusFilter == 'Completed' ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _statusFilter,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.keyboard_arrow_down, color: const Color(0xFF64748B), size: 18),
                      ],
                    ),
                  ),
                  itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                    _buildFilterMenuItem('All', Iconsax.filter, const Color(0xFF64748B)),
                    _buildFilterMenuItem('Completed', Iconsax.tick_circle, const Color(0xFF10B981)),
                    _buildFilterMenuItem('Pending', Iconsax.clock, const Color(0xFFF59E0B)),
                  ],
                ),
                // Divider
                Container(
                  width: 1,
                  height: 32,
                  color: const Color(0xFFE2E8F0),
                ),
                const SizedBox(width: 8),
                // Add Report Button - Compact
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _showAddReportDialog,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Iconsax.add_circle, size: 18, color: AppColors.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Add Report',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Table - Dynamic height
          Expanded(
            child: _buildTestReportsTable(),
          ),
        ],
      ),
    );
  }

  PopupMenuItem<String> _buildFilterMenuItem(String value, IconData icon, Color color) {
    final isSelected = _statusFilter == value;
    return PopupMenuItem<String>(
      value: value,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: isSelected ? color.withValues(alpha: 0.15) : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(icon, size: 16, color: color),
            ),
            const SizedBox(width: 12),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? const Color(0xFF0F172A) : const Color(0xFF64748B),
              ),
            ),
            if (isSelected) ...[
              const Spacer(),
              Icon(Icons.check, size: 16, color: color),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTestReportsTable() {
    if (_isLoading) {
      return _buildTableSkeleton();
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Iconsax.warning_2, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(_errorMessage!, style: GoogleFonts.inter(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadReports,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final allFilteredReports = _reports.where((report) {
      // Apply search filter
      if (_searchController.text.isNotEmpty) {
        final searchLower = _searchController.text.toLowerCase();
        final testType = (report['testType'] ?? '').toString().toLowerCase();
        final patientName = (report['patientName'] ?? '').toString().toLowerCase();
        final patientCode = (report['patientCode'] ?? '').toString().toLowerCase();
        
        final matchesSearch = testType.contains(searchLower) || 
                              patientName.contains(searchLower) || 
                              patientCode.contains(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Apply status filter
      if (_statusFilter != 'All') {
        final hasFile = report['fileRef'] != null;
        if (_statusFilter == 'Completed' && !hasFile) return false;
        if (_statusFilter == 'Pending' && hasFile) return false;
      }
      
      return true;
    }).toList();

    // Apply pagination
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, allFilteredReports.length);
    final filteredReports = startIndex >= allFilteredReports.length
        ? <dynamic>[]
        : allFilteredReports.sublist(startIndex, endIndex);

    if (allFilteredReports.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Iconsax.document, size: 64, color: const Color(0xFF94A3B8)),
            const SizedBox(height: 16),
            Text(
              'No test reports found',
              style: GoogleFonts.lexend(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchController.text.isEmpty 
                  ? 'Click "Add Report" to create one'
                  : 'Try adjusting your search criteria',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Table Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                border: Border(
                  bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1),
                ),
              ),
              child: Row(
                children: [
                  _buildTableHeader('PATIENT CODE', flex: 14),
                  _buildTableHeader('PATIENT NAME', flex: 18),
                  _buildTableHeader('TEST TYPE', flex: 18),
                  _buildTableHeader('DATE', flex: 13),
                  _buildTableHeader('UPLOADED BY', flex: 16, center: true),
                  _buildTableHeader('STATUS', flex: 12, center: true),
                  _buildTableHeader('ACTIONS', flex: 11, center: true),
                ],
              ),
            ),
            // Table Body - Flexible
            Expanded(
              child: filteredReports.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          'No reports to display',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.zero,
                      itemCount: filteredReports.length,
                      itemBuilder: (context, index) {
                        final report = filteredReports[index];
                        final isEven = index.isEven;
                        
                        return InkWell(
                          onTap: () => _viewReport(report),
                          hoverColor: AppColors.primary.withValues(alpha: 0.03),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
                            decoration: BoxDecoration(
                              color: isEven ? Colors.white : const Color(0xFFF8FAFC),
                              border: const Border(
                                bottom: BorderSide(
                                  color: Color(0xFFE2E8F0),
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Row(
                              children: [
                                _buildTableCell(
                                  report['patientCode'] ?? 'PAT-00',
                                  flex: 14,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                                _buildTableCell(
                                  report['patientName'] ?? 'Unknown',
                                  flex: 18,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                _buildTableCell(
                                  report['testType'] ?? 'N/A',
                                  flex: 18,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: const Color(0xFF334155),
                                  ),
                                ),
                                _buildTableCell(
                                  _formatDate(report['createdAt']),
                                  flex: 13,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                _buildTableCell(
                                  report['uploaderName'] ?? 'Admin',
                                  flex: 16,
                                  centered: true,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Expanded(
                                  flex: 12,
                                  child: _buildStatusChip(report['fileRef'] != null),
                                ),
                                Expanded(
                                  flex: 11,
                                  child: Center(
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.08),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: IconButton(
                                            icon: Icon(
                                              Iconsax.eye,
                                              size: 16,
                                              color: AppColors.primary,
                                            ),
                                            onPressed: () => _viewReport(report),
                                            tooltip: 'View Report',
                                            padding: const EdgeInsets.all(6),
                                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                            splashRadius: 18,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Container(
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFEF4444).withValues(alpha: 0.08),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: IconButton(
                                            icon: const Icon(
                                              Iconsax.trash,
                                              size: 16,
                                              color: Color(0xFFEF4444),
                                            ),
                                            onPressed: () => _deleteReport(report['_id']),
                                            tooltip: 'Delete Report',
                                            padding: const EdgeInsets.all(6),
                                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                            splashRadius: 18,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            // Pagination Footer
            _buildPaginationFooter(allFilteredReports.length),
          ],
        ),
      ),
    );
  }

  Widget _buildPaginationFooter(int totalItems) {
    final totalPages = (totalItems / _itemsPerPage).ceil();
    final startItem = totalItems == 0 ? 0 : (_currentPage * _itemsPerPage) + 1;
    final endItem = ((_currentPage + 1) * _itemsPerPage).clamp(0, totalItems);

    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Results Info
          Text(
            'Showing $startItem-$endItem of $totalItems',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF64748B),
              fontWeight: FontWeight.w500,
              letterSpacing: 0.2,
            ),
          ),
          // Pagination Controls
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Previous Button
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _currentPage > 0 ? () => setState(() => _currentPage--) : null,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: _currentPage > 0 ? const Color(0xFFF8FAFC) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _currentPage > 0 
                            ? const Color(0xFFCBD5E1)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Icon(
                      Icons.chevron_left,
                      size: 18,
                      color: _currentPage > 0 ? const Color(0xFF0F172A) : const Color(0xFFCBD5E1),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Page Numbers
              ...List.generate(
                totalPages.clamp(0, 5),
                (index) {
                  int pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = index;
                  } else if (_currentPage < 2) {
                    pageNumber = index;
                  } else if (_currentPage > totalPages - 3) {
                    pageNumber = totalPages - 5 + index;
                  } else {
                    pageNumber = _currentPage - 2 + index;
                  }

                  if (pageNumber >= totalPages) return const SizedBox.shrink();

                  final isCurrentPage = pageNumber == _currentPage;
                  
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => setState(() => _currentPage = pageNumber),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: 34,
                          height: 34,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isCurrentPage ? AppColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isCurrentPage
                                  ? AppColors.primary
                                  : const Color(0xFFE2E8F0),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            '${pageNumber + 1}',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: isCurrentPage ? Colors.white : const Color(0xFF475569),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(width: 10),
              // Next Button
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _currentPage < totalPages - 1 ? () => setState(() => _currentPage++) : null,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: _currentPage < totalPages - 1 ? const Color(0xFFF8FAFC) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _currentPage < totalPages - 1
                            ? const Color(0xFFCBD5E1)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Icon(
                      Icons.chevron_right,
                      size: 18,
                      color: _currentPage < totalPages - 1 ? const Color(0xFF0F172A) : const Color(0xFFCBD5E1),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeader(String label, {required int flex, bool center = false}) {
    return Expanded(
      flex: flex,
      child: Text(
        label,
        textAlign: center ? TextAlign.center : TextAlign.left,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.kTextSecondary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildTableCell(String text, {required int flex, TextStyle? style, bool centered = false}) {
    return Expanded(
      flex: flex,
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        textAlign: centered ? TextAlign.center : TextAlign.left,
        style: style ?? GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary),
      ),
    );
  }

  Widget _buildTableSkeleton() {
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            border: Border(
              bottom: BorderSide(color: const Color(0xFFE2E8F0), width: 1),
            ),
          ),
          child: Row(
            children: [
              _buildSkeletonHeaderCell(2),
              _buildSkeletonHeaderCell(2),
              _buildSkeletonHeaderCell(2),
              _buildSkeletonHeaderCell(2),
              _buildSkeletonHeaderCell(2),
              _buildSkeletonHeaderCell(2),
              _buildSkeletonHeaderCell(1),
            ],
          ),
        ),
        // Rows
        Expanded(
          child: ListView.builder(
            itemCount: 10,
            itemBuilder: (context, index) {
              return Shimmer.fromColors(
                baseColor: const Color(0xFFE2E8F0),
                highlightColor: const Color(0xFFF1F5F9),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      bottom: BorderSide(color: const Color(0xFFE2E8F0), width: 1),
                    ),
                  ),
                  child: Row(
                    children: [
                      _buildSkeletonCell(2),
                      _buildSkeletonCell(2),
                      _buildSkeletonCell(2),
                      _buildSkeletonCell(2),
                      _buildSkeletonCell(2),
                      _buildSkeletonCell(2),
                      _buildSkeletonCell(1),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSkeletonHeaderCell(int flex) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.only(right: 12),
        child: Container(
          height: 14,
          decoration: BoxDecoration(
            color: const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }

  Widget _buildSkeletonCell(int flex) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.only(right: 12),
        child: Container(
          height: 14,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }
}
