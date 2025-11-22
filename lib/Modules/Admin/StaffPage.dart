// lib/modules/staff/staff_screen.dart
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Adjust these imports to your project structure
import '../../Models/staff.dart';
import '../../Services/Authservices.dart';
import '../../Services/ReportService.dart';
import '../../Utils/Colors.dart';
import 'Widgets/Staffview.dart';
import 'Widgets/generic_data_table.dart';
import 'Widgets/staffpopup.dart'; // should export StaffFormPage

// ---------------------------------------------------------------------

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  List<Staff> _allStaff = [];
  bool _isLoading = true;
  bool _isDownloading = false;
  String _searchQuery = '';
  int _currentPage = 0;
  String _departmentFilter = 'All';
  final ReportService _reportService = ReportService();

  @override
  void initState() {
    super.initState();
    _fetchStaff();
  }

  // ---------------- Helper: dedupe ----------------
  List<Staff> _dedupeById(List<Staff> input) {
    final seen = <String>{};
    final out = <Staff>[];
    for (final s in input) {
      final key = (s.id.isNotEmpty) ? s.id : '\$tmp-${s.hashCode}';
      if (!seen.contains(key)) {
        seen.add(key);
        out.add(s);
      }
    }
    return out;
  }

  // ---------------- Fetch from API ----------------
  Future<void> _fetchStaff({bool forceRefresh = false}) async {
    if (mounted) setState(() => _isLoading = true);
    try {
      final fetched = await AuthService.instance.fetchStaffs(forceRefresh: forceRefresh);
      // dedupe server list to avoid duplicates
      final unique = _dedupeById(fetched);
      if (mounted) {
        setState(() {
          _allStaff = unique;
          if (_currentPage < 0) _currentPage = 0;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to fetch staff: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ---------------- Search / Pagination ----------------
  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
  }

  void _nextPage() => setState(() => _currentPage++);
  void _prevPage() {
    if (_currentPage > 0) setState(() => _currentPage--);
  }

  // ---------------- Utilities ----------------
  List<Staff> _getFilteredStaff() {
    final q = _searchQuery.trim().toLowerCase();
    return _allStaff.where((s) {
      final matchesSearch = q.isEmpty ||
          s.name.toLowerCase().contains(q) ||
          s.id.toLowerCase().contains(q) ||
          s.department.toLowerCase().contains(q) ||
          s.designation.toLowerCase().contains(q) ||
          s.contact.toLowerCase().contains(q) ||
          _staffCode(s).toLowerCase().contains(q);
      final matchesFilter = _departmentFilter == 'All' || s.department == _departmentFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  // Return staff code from model - check multiple possible locations
  String _staffCode(Staff s) {
    // prefer explicit patientFacingId (existing field)
    final pf = (s.patientFacingId ?? '').toString().trim();
    if (pf.isNotEmpty) return pf;

    // some server payloads may have metadata.staffCode or metadata.staff_code
    // and if that landed inside notes (Map<String,String>) it may be accessible:
    try {
      final notes = s.notes;
      if (notes != null && notes.isNotEmpty) {
        final v1 = notes['staffCode'] ?? notes['staff_code'] ?? notes['code'] ?? notes['patientFacingId'];
        if (v1 != null && v1.toString().trim().isNotEmpty) return v1.toString().trim();
      }
    } catch (_) {}

    // last fallback: tags or id short
    if (s.tags.isNotEmpty) {
      final maybe = s.tags.firstWhere((t) => t.startsWith('STF-') || t.startsWith('STF'), orElse: () => '');
      if (maybe.isNotEmpty) return maybe;
    }

    return '-';
  }

  Widget _statusChip(String status) {
    final isAvailable = status.toLowerCase() == 'available';
    final bg = isAvailable ? Colors.green.withOpacity(0.12) : AppColors.primary600.withOpacity(0.12);
    final fg = isAvailable ? Colors.green : AppColors.primary600;

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

  Widget _buildDepartmentFilter() {
    final departments = {'All', ..._allStaff.map((s) => s.department).where((d) => d.isNotEmpty).toSet()};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      onSelected: (String newValue) {
        setState(() {
          _departmentFilter = newValue;
          _currentPage = 0;
        });
      },
      itemBuilder: (BuildContext context) {
        return departments.map((String value) {
          return PopupMenuItem<String>(
            value: value,
            child: Text(value, style: GoogleFonts.inter()),
          );
        }).toList();
      },
    );
  }

  // ---------------- Staff form dialog (popup) ----------------
  Future<void> _onAddPressed() async {
    try {
      // showStaffFormPopup is defined at bottom of this file (or exported from widget/staffpopup.dart)
      final created = await showStaffFormPopup(context);
      if (created == null) return;

      // optimistic insert OR replace existing (prevent duplicates)
      setState(() {
        final idx = _allStaff.indexWhere((s) => s.id == created.id);
        if (idx == -1) {
          _allStaff.insert(0, created);
        } else {
          _allStaff[idx] = created;
        }
      });

      // If temp id, try to resync so server id replaces temp
      if (created.id.startsWith('temp-')) {
        try {
          await _fetchStaff(forceRefresh: true);
        } catch (_) {}
      }

      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Staff created')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Create failed: $e')));
      await _fetchStaff(forceRefresh: true);
    }
  }

  Future<void> _onEdit(int index, List<Staff> list) async {
    final original = list[index];

    try {
      final updated = await showStaffFormPopup(context, initial: original);
      if (updated == null) return;

      setState(() {
        final idx = _allStaff.indexWhere((s) => s.id == original.id);
        if (idx != -1) {
          _allStaff[idx] = updated;
        } else {
          final insertAt = index.clamp(0, _allStaff.length);
          _allStaff.insert(insertAt, updated);
        }
      });

      // authoritative fetch when possible
      if (!updated.id.startsWith('temp-')) {
        try {
          final fresh = await AuthService.instance.fetchStaffById(updated.id);
          if (mounted) {
            setState(() {
              final i = _allStaff.indexWhere((s) => s.id == updated.id);
              if (i != -1) _allStaff[i] = fresh;
            });
          }
        } catch (_) {}
      }

      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Staff updated')));
    } catch (e) {
      // revert
      setState(() {
        final idx = _allStaff.indexWhere((s) => s.id == original.id);
        if (idx != -1) _allStaff[idx] = original;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Update failed: $e')));
        await _fetchStaff(forceRefresh: true);
      }
    }
  }

  // ---------------- Delete (optimistic) ----------------
  Future<void> _onDelete(int index, List<Staff> list) async {
    final staffMember = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete ${staffMember.name}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;

    final removedIndex = _allStaff.indexWhere((s) => s.id == staffMember.id);
    Staff? removed;
    if (removedIndex != -1) {
      removed = _allStaff.removeAt(removedIndex);
      setState(() {});
    }

    if (mounted) setState(() => _isLoading = true);
    try {
      final ok = await AuthService.instance.deleteStaff(staffMember.id);
      if (ok) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted ${staffMember.name}')));
        final filteredItems = _getFilteredStaff();
        if (_currentPage * 10 >= filteredItems.length && _currentPage > 0) {
          setState(() => _currentPage = 0);
        }
      } else {
        if (removed != null) setState(() => _allStaff.insert(removedIndex, removed!));
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delete failed')));
      }
    } catch (e) {
      if (removed != null) setState(() => _allStaff.insert(removedIndex, removed!));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ---------------- Download Report (for all staff) ----------------
  Future<void> _onDownloadReport(int index, List<Staff> list) async {
    if (index < 0 || index >= list.length) return;
    
    final staffMember = list[index];
    
    // Check if staff has 'doctor' role for specialized report
    final isDoctor = staffMember.roles.any((role) => role.toLowerCase() == 'doctor') ||
                     staffMember.designation.toLowerCase().contains('doctor');
    
    setState(() => _isDownloading = true);
    
    try {
      Map<String, dynamic> result;
      
      if (isDoctor) {
        // Generate doctor-specific report with appointments and patients
        result = await _reportService.downloadDoctorReport(staffMember.id);
      } else {
        // Generate general staff report
        result = await _reportService.downloadStaffReport(staffMember.id);
      }
      
      if (mounted) {
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Report downloaded successfully'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to download report'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
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
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  // ---------------- View (simple) ----------------
  Future<void> _onView(int index, List<Staff> list) async {
    final staffMember = list[index];

    try {
      // open enterprise-level detail drawer/page; showStaffDetail must be imported
      final updated = await showStaffDetail(context, staffId: staffMember.id, initial: staffMember);

      // If the detail page returned an updated Staff, replace in local list
      if (updated != null && mounted) {
        setState(() {
          final i = _allStaff.indexWhere((s) => s.id == updated.id);
          if (i != -1) {
            _allStaff[i] = updated;
          } else {
            // if not found, insert near the original index (safe-guard)
            final insertAt = index.clamp(0, _allStaff.length);
            _allStaff.insert(insertAt, updated);
          }
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Updated ${updated.name}')));
        return;
      }

      // If no update came back, show a simple toast that the details were opened
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Opened details for ${staffMember.name}')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to open details: $e')));
      }
    }
  }

  // ---------------- NEW: small avatar/gender icon helper for list ----------------
  Widget _smallAvatarForList(Staff s, {double size = 28}) {
    // prefer network avatar
    if (s.avatarUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: Image.network(s.avatarUrl, width: size, height: size, fit: BoxFit.cover, errorBuilder: (_, __, ___) {
          // fallback to gender asset if network fails
          return _genderAssetOrInitials(s, size);
        }),
      );
    }

    // no network avatar -> gender asset or initials
    return _genderAssetOrInitials(s, size);
  }

  Widget _genderAssetOrInitials(Staff s, double size) {
    final gender = (s.gender ?? '').toLowerCase();
    if (gender == 'male' || gender == 'm') {
      return Image.asset('assets/boyicon.png', width: size, height: size, fit: BoxFit.cover);
    } else if (gender == 'female' || gender == 'f' || gender == 'girl') {
      return Image.asset('assets/girlicon.png', width: size, height: size, fit: BoxFit.cover);
    }

    // initials fallback
    final initials = s.name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).map((p) => p[0]).take(2).join().toUpperCase();
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(size / 2)),
      alignment: Alignment.center,
      child: Text(initials.isEmpty ? '-' : initials, style: GoogleFonts.inter(fontSize: size * 0.45, fontWeight: FontWeight.w700)),
    );
  }

  @override
  Widget build(BuildContext context) {
    // ensure we use a deduped filtered list for pagination and rendering
    final filtered = _dedupeById(_getFilteredStaff());

    final startIndex = _currentPage * 10;
    final endIndex = (startIndex + 10).clamp(0, filtered.length);
    final paginatedStaff = startIndex >= filtered.length ? <Staff>[] : filtered.sublist(startIndex, endIndex);

    // Now show STAFF CODE as first header
    final headers = const ['STAFF CODE', 'STAFF NAME', 'DESIGNATION', 'DEPARTMENT', 'CONTACT', 'STATUS'];

    final cellStyle = GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.kTextPrimary ?? Colors.black);

    Widget _cell(String txt, {double width = 140}) {
      return SizedBox(
        width: width,
        child: Text(
          txt,
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          maxLines: 1,
          style: cellStyle,
        ),
      );
    }

    final rows = paginatedStaff.map((s) {
      final code = _staffCode(s);
      final name = s.name.isNotEmpty ? s.name : '-';
      final designation = s.designation.isNotEmpty ? s.designation : '-';
      final department = s.department.isNotEmpty ? s.department : '-';
      final contact = s.contact.isNotEmpty ? s.contact : '-';
      final status = s.status.isNotEmpty ? s.status : '-';

      // STAFF CODE cell now shows small avatar/icon + code
      final staffCodeCell = SizedBox(
        width: 160,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // avatar/icon
            _smallAvatarForList(s),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                code,
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
                style: cellStyle,
              ),
            ),
          ],
        ),
      );

      return [
        staffCodeCell,
        _cell(name, width: 200),
        _cell(designation, width: 160),
        _cell(department, width: 140),
        _cell(contact, width: 150),
        SizedBox(width: 120, child: _statusChip(status)),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Staff",
            headers: headers,
            rows: rows,
            searchQuery: _searchQuery,
            onSearchChanged: _onSearchChanged,
            currentPage: _currentPage,
            totalItems: filtered.length,
            itemsPerPage: 10,
            onPreviousPage: _prevPage,
            onNextPage: _nextPage,
            isLoading: _isLoading || _isDownloading,
            onAddPressed: _onAddPressed,
            filters: [_buildDepartmentFilter()],
            hideHorizontalScrollbar: true,
            onDownload: (i) => _onDownloadReport(i, paginatedStaff),
            onView: (i) => _onView(i, paginatedStaff),
            onEdit: (i) => _onEdit(i, paginatedStaff),
            onDelete: (i) => _onDelete(i, paginatedStaff),
          ),
        ),
      ),
    );
  }
}

// ================= StaffFormPopup helper =================

// Reusable function that shows StaffFormPage. If your 'widget/staffpopup.dart'
// already exports a showStaffFormPopup function, you can remove this helper.
// This helper assumes 'StaffFormPage' is exported from 'widget/staffpopup.dart'.
Future<Staff?> showStaffFormPopup(BuildContext context, {Staff? initial}) {
  final width = MediaQuery.of(context).size.width;
  // On narrow screens open full-screen route
  if (width < 900) {
    return Navigator.of(context).push<Staff>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => StaffFormPage(initial: initial), // StaffFormPage should be exported from widget/staffpopup.dart
      ),
    );
  } else {
    // For wide screens: show centered dialog card
    return showDialog<Staff>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        final maxW = MediaQuery.of(ctx).size.width * 0.95;
        final maxH = MediaQuery.of(ctx).size.height * 0.9;
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxW, maxHeight: maxH),
            child: StaffFormPage(initial: initial),
          ),
        );
      },
    );
  }
}
