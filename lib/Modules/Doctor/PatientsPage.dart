import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../Models/Patients.dart';
import '../Admin/widget/generic_data_table.dart'; // update path if needed

// --- Theme Colors (kept from your original file) ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryHoverColor = Color(0xFFDC2626);
const Color backgroundColor = Color(0xFFF9FAFB);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color borderColor = Color(0xFFE5E7EB);
const Color accentLight = Color(0xFFFEE2E2);
const Color accentDark = Color(0xFFB91C1C);

// ---------------------------
// Embedded sample data (11)
// ---------------------------
final List<PatientDetails> _samplePatients = [
  PatientDetails(
    patientId: '#PTN001',
    name: 'Arthur Penhaligon',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    weight: '75 kgs',
    height: '175 cms',
    emergencyContactName: 'Merlin (Friend)',
    emergencyContactPhone: '9876543210',
    phone: '+91 6382255960',
    city: 'London',
    address: '123 Baker St',
    pincode: 'SW1A 0AA',
    insuranceNumber: 'AA234-875490',
    expiryDate: '2026-09-16',
    avatarUrl: '',
    dateOfBirth: '1990-08-15',
    lastVisitDate: '2022-12-05',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN002',
    name: 'John Doe',
    age: 28,
    gender: 'Male',
    bloodGroup: 'A-',
    weight: '80 kgs',
    height: '180 cms',
    emergencyContactName: 'Jane Doe (Wife)',
    emergencyContactPhone: '9876543211',
    phone: '+91 6382255961',
    city: 'New York',
    address: '456 Main St',
    pincode: '10001',
    insuranceNumber: 'BB567-123456',
    expiryDate: '2025-11-22',
    avatarUrl: '',
    dateOfBirth: '1996-05-22',
    lastVisitDate: '2022-12-05',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN003',
    name: 'Bhavana Sharma',
    age: 22,
    gender: 'Female',
    bloodGroup: 'O+',
    weight: '55 kgs',
    height: '160 cms',
    emergencyContactName: 'Rajesh Sharma (Father)',
    emergencyContactPhone: '9876543212',
    phone: '+91 6382255962',
    city: 'Mumbai',
    address: '789 Ocean View',
    pincode: '400001',
    insuranceNumber: 'CC890-789012',
    expiryDate: '2027-05-01',
    avatarUrl: '',
    dateOfBirth: '2002-11-30',
    lastVisitDate: '2025-08-19',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN004',
    name: 'David Lee',
    age: 40,
    gender: 'Male',
    bloodGroup: 'AB-',
    weight: '70 kgs',
    height: '178 cms',
    emergencyContactName: 'Sarah Lee (Sister)',
    emergencyContactPhone: '9876543213',
    phone: '+91 6382255963',
    city: 'London',
    address: '10 Downing St',
    pincode: 'SW1A 2AA',
    insuranceNumber: 'DD123-456789',
    expiryDate: '2028-03-10',
    avatarUrl: '',
    dateOfBirth: '1985-01-01',
    lastVisitDate: '2022-12-05',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN005',
    name: 'Joseph King',
    age: 78,
    gender: 'Male',
    bloodGroup: 'O-',
    weight: '65 kgs',
    height: '170 cms',
    emergencyContactName: 'Mary King (Daughter)',
    emergencyContactPhone: '9876543214',
    phone: '+91 6382255964',
    city: 'San Francisco',
    address: 'Golden Gate Ave',
    pincode: '94101',
    insuranceNumber: 'EE456-789012',
    expiryDate: '2025-08-05',
    avatarUrl: '',
    dateOfBirth: '1945-06-12',
    lastVisitDate: '2022-12-05',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN006',
    name: 'Lakesh Patel',
    age: 48,
    gender: 'Male',
    bloodGroup: 'A+',
    weight: '82 kgs',
    height: '172 cms',
    emergencyContactName: 'Priya Patel (Wife)',
    emergencyContactPhone: '9876543215',
    phone: '+91 6382255965',
    city: 'Ahmedabad',
    address: '101 Gandhi Rd',
    pincode: '380001',
    insuranceNumber: 'FF789-012345',
    expiryDate: '2027-12-18',
    avatarUrl: '',
    dateOfBirth: '1977-09-18',
    lastVisitDate: '2022-12-05',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN007',
    name: 'Maria Garcia',
    age: 30,
    gender: 'Female',
    bloodGroup: 'B-',
    weight: '60 kgs',
    height: '165 cms',
    emergencyContactName: 'Carlos Garcia (Husband)',
    emergencyContactPhone: '9876543216',
    phone: '+91 6382255966',
    city: 'Madrid',
    address: 'Calle Mayor 1',
    pincode: '28001',
    insuranceNumber: 'GG012-345678',
    expiryDate: '2026-07-20',
    avatarUrl: '',
    dateOfBirth: '1994-03-10',
    lastVisitDate: '2023-11-20',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN008',
    name: 'Chen Wei',
    age: 55,
    gender: 'Male',
    bloodGroup: 'A+',
    weight: '78 kgs',
    height: '170 cms',
    emergencyContactName: 'Li Na (Wife)',
    emergencyContactPhone: '9876543217',
    phone: '+91 6382255967',
    city: 'Beijing',
    address: 'Wangfujing St',
    pincode: '100006',
    insuranceNumber: 'HH345-678901',
    expiryDate: '2025-09-11',
    avatarUrl: '',
    dateOfBirth: '1969-07-01',
    lastVisitDate: '2024-01-15',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN009',
    name: 'Fatima Ahmed',
    age: 29,
    gender: 'Female',
    bloodGroup: 'O+',
    weight: '62 kgs',
    height: '168 cms',
    emergencyContactName: 'Omar Ahmed (Brother)',
    emergencyContactPhone: '9876543218',
    phone: '+91 6382255968',
    city: 'Dubai',
    address: 'Sheikh Zayed Rd',
    pincode: '00000',
    insuranceNumber: 'II678-901234',
    expiryDate: '2027-04-03',
    avatarUrl: '',
    dateOfBirth: '1995-12-01',
    lastVisitDate: '2024-02-28',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN010',
    name: 'Hiroshi Tanaka',
    age: 68,
    gender: 'Male',
    bloodGroup: 'AB+',
    weight: '70 kgs',
    height: '160 cms',
    emergencyContactName: 'Akiko Tanaka (Wife)',
    emergencyContactPhone: '9876543219',
    phone: '+91 6382255969',
    city: 'Tokyo',
    address: 'Shibuya Crossing',
    pincode: '150-0042',
    insuranceNumber: 'JJ901-234567',
    expiryDate: '2026-01-25',
    avatarUrl: '',
    dateOfBirth: '1956-02-10',
    lastVisitDate: '2023-09-01',
    doctorId: '',
  ),
  PatientDetails(
    patientId: '#PTN011',
    name: 'Sophie Dupont',
    age: 42,
    gender: 'Female',
    bloodGroup: 'A-',
    weight: '63 kgs',
    height: '168 cms',
    emergencyContactName: 'Pierre Dupont (Husband)',
    emergencyContactPhone: '9876543220',
    phone: '+91 6382255970',
    city: 'Paris',
    address: 'Champs-Élysées',
    pincode: '75008',
    insuranceNumber: 'KK234-567890',
    expiryDate: '2027-06-14',
    avatarUrl: '',
    dateOfBirth: '1982-04-20',
    lastVisitDate: '2024-03-10',
    doctorId: '',
  ),
];

// ---------------------------
// Mock API (uses embedded list)
// ---------------------------
class MockPatientApi {
  static final List<PatientDetails> _allPatients = _samplePatients;

  /// Simulates a backend endpoint:
  /// GET /patients?page=0&perPage=10&search=foo&gender=Male
  /// Returns a map: {'items': List<PatientDetails>, 'total': int}
  static Future<Map<String, dynamic>> getPatients({
    int page = 0,
    int perPage = 10,
    String search = '',
    String gender = 'All',
    Duration delay = const Duration(milliseconds: 700),
  }) async {
    // Simulate network latency
    await Future.delayed(delay);

    // Apply search + filter on the server side (mock)
    final q = search.trim().toLowerCase();
    final filtered = _allPatients.where((p) {
      final matchesSearch = q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.patientId.toLowerCase().contains(q) ||
          p.phone.toLowerCase().contains(q);
      final matchesGender = gender == 'All' || p.gender == gender;
      return matchesSearch && matchesGender;
    }).toList();

    final total = filtered.length;

    // Pagination
    final start = page * perPage;
    final end = (start + perPage).clamp(0, total);
    final pageItems = (start < end) ? filtered.sublist(start, end) : <PatientDetails>[];

    return {
      'items': pageItems,
      'total': total,
    };
  }

  // Optional helpers: delete/edit in-memory (useful for local testing)
  static Future<void> deletePatient(String patientId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    _allPatients.removeWhere((p) => p.patientId == patientId);
  }

  static Future<void> addPatient(PatientDetails p) async {
    await Future.delayed(const Duration(milliseconds: 300));
    _allPatients.insert(0, p);
  }

  static Future<void> updatePatient(String patientId, PatientDetails updated) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final idx = _allPatients.indexWhere((p) => p.patientId == patientId);
    if (idx >= 0) _allPatients[idx] = updated;
  }
}

// ---------------------------
// PatientsScreen (uses GenericDataTable)
// ---------------------------
class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  String _searchQuery = '';
  int _currentPage = 0;
  final int _itemsPerPage = 10;

  String _genderFilter = 'All';

  bool _isLoading = false;
  List<PatientDetails> _currentPageItems = [];
  int _totalItems = 0;

  @override
  void initState() {
    super.initState();
    _loadPage();
  }

  Future<void> _loadPage() async {
    setState(() => _isLoading = true);
    try {
      final res = await MockPatientApi.getPatients(
        page: _currentPage,
        perPage: _itemsPerPage,
        search: _searchQuery,
        gender: _genderFilter,
      );
      _currentPageItems = List<PatientDetails>.from(res['items'] as List);
      _totalItems = res['total'] as int;
    } catch (e) {
      _currentPageItems = [];
      _totalItems = 0;
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
    _loadPage();
  }

  void _onGenderFilterChanged(String? v) {
    if (v == null) return;
    setState(() {
      _genderFilter = v;
      _currentPage = 0;
    });
    _loadPage();
  }

  void _onAddPatient() {
    // sample add - creates a quick dummy patient (you can replace with a form/navigation)
    final newPatient = PatientDetails(
      patientId: '#PTN${DateTime.now().millisecondsSinceEpoch % 100000}',
      name: 'New Patient',
      age: 30,
      gender: 'Other',
      bloodGroup: 'O+',
      weight: '70 kgs',
      height: '170 cms',
      emergencyContactName: 'Contact',
      emergencyContactPhone: '0000000000',
      phone: '+91 7000000000',
      city: 'Unknown',
      address: 'Unknown',
      pincode: '000000',
      insuranceNumber: 'ZZ000-000000',
      expiryDate: '2026-01-01',
      avatarUrl: '',
      dateOfBirth: '1995-01-01',
      lastVisitDate: DateTime.now().toIso8601String(),
      doctorId: '',
    );
    MockPatientApi.addPatient(newPatient).then((_) => _loadPage());
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added sample patient')));
  }

  void _previousPage() {
    if (_currentPage > 0) {
      setState(() => _currentPage -= 1);
      _loadPage();
    }
  }

  void _nextPage() {
    final totalPages = (_totalItems / _itemsPerPage).ceil();
    if (_currentPage < totalPages - 1) {
      setState(() => _currentPage += 1);
      _loadPage();
    }
  }

  void _showPatientDetails(PatientDetails p) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('View: ${p.name}')));
    // TODO: push to details page
  }

  void _editPatient(PatientDetails p) {
    final updated = PatientDetails(
      patientId: p.patientId,
      name: '${p.name} (edited)',
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      weight: p.weight,
      height: p.height,
      emergencyContactName: p.emergencyContactName,
      emergencyContactPhone: p.emergencyContactPhone,
      phone: p.phone,
      city: p.city,
      address: p.address,
      pincode: p.pincode,
      insuranceNumber: p.insuranceNumber,
      expiryDate: p.expiryDate,
      avatarUrl: p.avatarUrl,
      dateOfBirth: p.dateOfBirth,
      lastVisitDate: p.lastVisitDate,
      doctorId: p.doctorId,
    );
    MockPatientApi.updatePatient(p.patientId, updated).then((_) {
      _loadPage();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Edited: ${p.name}')));
    });
  }

  void _confirmDeletePatient(PatientDetails p) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete ${p.name}?', style: GoogleFonts.inter()),
        content: Text('Are you sure you want to delete this patient?', style: GoogleFonts.inter()),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: Text('Cancel', style: GoogleFonts.inter())),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              MockPatientApi.deletePatient(p.patientId).then((_) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted: ${p.name}')));
                // If deleting last item on page, go back a page if possible
                final remainingOnPage = _totalItems - 1 - (_currentPage * _itemsPerPage);
                if (remainingOnPage <= 0 && _currentPage > 0) {
                  setState(() => _currentPage -= 1);
                }
                _loadPage();
              });
            },
            child: Text('Delete', style: GoogleFonts.inter(color: primaryColor)),
          ),
        ],
      ),
    );
  }

  String _formatDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      return DateFormat('dd/MM/yyyy').format(dt);
    } catch (e) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Table headers
    final headers = ['Patient Name', 'ID', 'Date of Birth', 'Gender', 'Contact No', 'Last Visit'];

    // Filters widgets (gender dropdown)
    final filters = <Widget>[
      SizedBox(
        height: 40,
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: _genderFilter,
            items: const [
              DropdownMenuItem(value: 'All', child: Text('All genders')),
              DropdownMenuItem(value: 'Male', child: Text('Male')),
              DropdownMenuItem(value: 'Female', child: Text('Female')),
              DropdownMenuItem(value: 'Other', child: Text('Other')),
            ],
            onChanged: _onGenderFilterChanged,
          ),
        ),
      ),
      const SizedBox(width: 8),
      SizedBox(
        height: 40,
        width: 40,
        child: OutlinedButton(
          style: OutlinedButton.styleFrom(
            padding: EdgeInsets.zero,
            shape: const CircleBorder(),
          ),
          onPressed: () {
            setState(() {
              _genderFilter = 'All';
              _searchQuery = '';
              _currentPage = 0;
            });
            _loadPage();
          },
          child: const Icon(Icons.close, size: 18, color: primaryColor),
        ),
      ),

    ];

    // Build rows (each row is List<Widget>) — GenericDataTable will append Actions column automatically
    final rows = _currentPageItems.map<List<Widget>>((p) {
      return [
        // Patient name + avatar
        Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: p.avatarUrl.isNotEmpty
                  ? NetworkImage(p.avatarUrl)
                  : const AssetImage('assets/sampledoctor.png') as ImageProvider,
              backgroundColor: Colors.transparent,
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                p.name,
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: textPrimaryColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),

        // ID
        Text(p.patientId, style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),

        // DOB
        Text(
          _formatDate(p.dateOfBirth),
          style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor),
        ),

        // Gender
        Text(p.gender, style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),

        // Contact
        Text(p.phone, style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor)),

        // Last Visit
        Text(
          _formatDate(p.lastVisitDate),
          style: GoogleFonts.inter(fontSize: 13, color: textSecondaryColor),
        ),
      ];
    }).toList();

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Header row (title + user)


            // GenericDataTable usage (fills remaining space)
            Expanded(
              child: GenericDataTable(
                title: 'Patients',
                headers: headers,
                rows: rows,
                searchQuery: _searchQuery,
                onSearchChanged: _onSearchChanged,
                currentPage: _currentPage,
                totalItems: _totalItems,
                itemsPerPage: _itemsPerPage,
                onPreviousPage: _previousPage,
                onNextPage: _nextPage,
                isLoading: _isLoading,
                filters: filters,
                onAddPressed: _onAddPatient,
                onView: (rowIndex) {
                  if (rowIndex >= 0 && rowIndex < _currentPageItems.length) {
                    _showPatientDetails(_currentPageItems[rowIndex]);
                  }
                },
                onEdit: (rowIndex) {
                  if (rowIndex >= 0 && rowIndex < _currentPageItems.length) {
                    _editPatient(_currentPageItems[rowIndex]);
                  }
                },
                onDelete: (rowIndex) {
                  if (rowIndex >= 0 && rowIndex < _currentPageItems.length) {
                    _confirmDeletePatient(_currentPageItems[rowIndex]);
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
