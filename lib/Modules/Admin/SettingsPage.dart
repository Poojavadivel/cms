import 'dart:io';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import '../../Services/Authservices.dart';
import '../../Providers/app_providers.dart';
import '../Common/LoginPage.dart';
import 'package:provider/provider.dart';
import 'dart:math' as math;
// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AuthService _authService = AuthService.instance;

  bool _busy = false;
  String _log = '';
  List<_UploadResult> _results = [];

  void _appendLog(String msg) {
    setState(() => _log = '$_log$msg\n');
  }

  Future<void> _handleLogout() async {
    await _authService.signOut();
    if (!mounted) return;
    Provider.of<AppProvider>(context, listen: false).signOut();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const LoginPage()),
          (Route<dynamic> route) => false,
    );
  }

  Future<void> _pickAndUpload() async {
    try {
      // Pick up to 10 JPG/PNG files (images only for scanner)
      final res = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png'],
        withReadStream: false,
      );
      if (res == null || res.files.isEmpty) return;

      final files = res.files.take(10).toList();
      setState(() {
        _busy = true;
        _results = [];
        _log = '';
      });

      _appendLog('📤 Uploading ${files.length} file(s) with scanner...');

      // Get file paths
      final imagePaths = <String>[];
      for (final file in files) {
        if (file.path != null) {
          imagePaths.add(file.path!);
        }
      }

      if (imagePaths.isEmpty) {
        _appendLog('❌ No valid file paths');
        setState(() => _busy = false);
        return;
      }

      // Send to bulk upload with patient matching
      final payload = await _authService.bulkUploadReports(imagePaths);

      final List results = (payload['results'] as List?) ?? [];
      final List failures = (payload['failures'] as List?) ?? [];

      _appendLog('✅ success=${payload['success']} '
          'processed=${results.length} failed=${failures.length}');

      final parsed = <_UploadResult>[];
      for (final r in results) {
        parsed.add(_UploadResult(
          file: r['file']?.toString() ?? '',
          patientId: r['patient']?['id']?.toString() ?? '',
          pdfId: r['report']?['imagePath']?.toString() ?? '',
          labReportId: r['report']?['intent']?.toString() ?? '',
          action: r['patient']?['matchedBy']?.toString() ?? '',
          engine: r['ocr']?['engine']?.toString() ?? '',
          confidence: (r['ocr']?['confidence'] as num?)?.toDouble(),
          resultsCount: 0,
          size: (r['ocr']?['textLength'] as num?)?.toInt() ?? 0,
          mime: 'image/jpeg',
        ));
      }

      setState(() {
        _results = parsed;
      });

      if (failures.isNotEmpty) {
        for (final f in failures) {
          _appendLog('   ✗ ${f['file']}: ${f['error']} (Patient: ${f['extractedName']})');
        }
      }
    } catch (e) {
      _appendLog('💥 Error: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openPdf(String pdfId, {String? suggestedName}) async {
    try {
      final Uint8List? bytes = await _authService.getScannerPdf(pdfId);
      if (bytes == null || bytes.isEmpty) {
        _appendLog('❌ Empty PDF for $pdfId');
        return;
      }

      final tmp = await getTemporaryDirectory();
      final fname = suggestedName ?? 'report_${pdfId.substring(0, 6)}.pdf';
      final path = p.join(tmp.path, fname);
      final file = File(path);
      await file.writeAsBytes(bytes, flush: true);
      await OpenFilex.open(path);
      _appendLog('📂 Opened $fname');
    } catch (e) {
      _appendLog('💥 Open PDF error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            _buildScannerUploadCard(),
            const SizedBox(height: 24),
            _buildResultsTable(),
            const SizedBox(height: 24),
            _buildLogConsole(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Scan Upload',
          style: GoogleFonts.poppins(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
        TextButton.icon(
          onPressed: _busy ? null : _handleLogout,
          icon: const Icon(Icons.logout_rounded, color: primaryColor),
          label: Text('Logout',
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600, color: primaryColor)),
        ),
      ],
    );
  }

  Widget _buildScannerUploadCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Upload Reports (PDF/JPG/PNG)',
              style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor)),
          const SizedBox(height: 8),
          Text(
            'Select up to 10 files. OCR + auto-link to patients.',
            style: GoogleFonts.poppins(color: textSecondaryColor),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: _busy ? null : _pickAndUpload,
                icon: const Icon(Icons.upload_file_rounded),
                label: Text(_busy ? 'Processing…' : 'Select & Upload'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  padding:
                  const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(width: 12),
              if (_busy)
                const SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(strokeWidth: 3),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResultsTable() {
    if (_results.isEmpty) {
      return _emptyTablePlaceholder();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardBoxDecoration(),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingTextStyle: GoogleFonts.poppins(
              fontWeight: FontWeight.w700, color: textPrimaryColor),
          dataTextStyle:
          GoogleFonts.poppins(color: textPrimaryColor, fontSize: 13),
          columns: const [
            DataColumn(label: Text('File')),
            DataColumn(label: Text('Patient ID')),
            DataColumn(label: Text('Lab Report')),
            DataColumn(label: Text('OCR Engine')),
            DataColumn(label: Text('Confidence')),
            DataColumn(label: Text('Results')),
            DataColumn(label: Text('Size')),
            DataColumn(label: Text('PDF')),
          ],
          rows: _results.map((r) {
            return DataRow(cells: [
              DataCell(Text(r.file)),
              DataCell(Text(r.patientId.isEmpty ? '-' : r.patientId)),
              DataCell(Text(r.labReportId.isEmpty ? '-' : r.labReportId)),
              DataCell(Text(r.engine)),
              DataCell(Text(r.confidence?.toStringAsFixed(2) ?? '-')),
              DataCell(Text('${r.resultsCount}')),
              DataCell(Text(_fmtSize(r.size))),
              DataCell(
                r.pdfId.isEmpty
                    ? const Text('-')
                    : TextButton(
                  onPressed: () => _openPdf(
                    r.pdfId,
                    suggestedName: p.setExtension(r.file, '.pdf'),
                  ),
                  child: const Text('Open'),
                ),
              ),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _emptyTablePlaceholder() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardBoxDecoration(),
      child: Text(
        'No results yet. Upload to see processed files.',
        style: GoogleFonts.poppins(color: textSecondaryColor),
      ),
    );
  }

  BoxDecoration _cardBoxDecoration() => BoxDecoration(
    color: cardBackgroundColor,
    borderRadius: BorderRadius.circular(12),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.04),
        blurRadius: 8,
        offset: const Offset(0, 3),
      )
    ],
  );

  Widget _buildLogConsole() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
      ),
      constraints: const BoxConstraints(minHeight: 120),
      child: SingleChildScrollView(
        child: Text(
          _log.isEmpty ? 'logs will appear here…' : _log,
          style: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 12,
            color: Color(0xFF9AE6B4),
          ),
        ),
      ),
    );
  }

  String _fmtSize(int bytes) {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    final i = (math.log(bytes) / math.log(1024)).floor();
    final v = (bytes / math.pow(1024, i)).toStringAsFixed(1);
    return '$v ${units[i]}';
  }
}

// --- Result Model ---
class _UploadResult {
  final String file;
  final String patientId;
  final String pdfId;
  final String labReportId;
  final String action;
  final String engine;
  final double? confidence;
  final int resultsCount;
  final int size;
  final String mime;

  _UploadResult({
    required this.file,
    required this.patientId,
    required this.pdfId,
    required this.labReportId,
    required this.action,
    required this.engine,
    required this.confidence,
    required this.resultsCount,
    required this.size,
    required this.mime,
  });
}
