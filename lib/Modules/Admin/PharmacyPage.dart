import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Data Models ---
class Medicine {
  final String id;
  final String name;
  final String brand;
  final int stock;
  final String status;

  Medicine({
    required this.id,
    required this.name,
    required this.brand,
    required this.stock,
    required this.status,
  });

  factory Medicine.fromMap(Map<String, dynamic> map) {
    return Medicine(
      id: map['id'],
      name: map['name'],
      brand: map['brand'],
      stock: map['stock'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _pharmacyApiData = [
  {'id': 'MED-001', 'name': 'Paracetamol', 'brand': 'Cipla', 'stock': 150, 'status': 'In Stock'},
  {'id': 'MED-002', 'name': 'Amoxicillin', 'brand': 'Sun Pharma', 'stock': 80, 'status': 'In Stock'},
  {'id': 'MED-003', 'name': 'Ibuprofen', 'brand': 'Dr. Reddy\'s', 'stock': 20, 'status': 'Low Stock'},
  {'id': 'MED-004', 'name': 'Aspirin', 'brand': 'Lupin', 'stock': 0, 'status': 'Out of Stock'},
  {'id': 'MED-005', 'name': 'Metformin', 'brand': 'Cipla', 'stock': 120, 'status': 'In Stock'},
  {'id': 'MED-006', 'name': 'Atorvastatin', 'brand': 'Sun Pharma', 'stock': 90, 'status': 'In Stock'},
  {'id': 'MED-007', 'name': 'Omeprazole', 'brand': 'Dr. Reddy\'s', 'stock': 15, 'status': 'Low Stock'},
  {'id': 'MED-008', 'name': 'Losartan', 'brand': 'Lupin', 'stock': 200, 'status': 'In Stock'},
  {'id': 'MED-009', 'name': 'Amlodipine', 'brand': 'Cipla', 'stock': 0, 'status': 'Out of Stock'},
  {'id': 'MED-010', 'name': 'Gabapentin', 'brand': 'Sun Pharma', 'stock': 60, 'status': 'In Stock'},
  {'id': 'MED-011', 'name': 'Hydrochlorothiazide', 'brand': 'Dr. Reddy\'s', 'stock': 25, 'status': 'Low Stock'},
  {'id': 'MED-012', 'name': 'Sertraline', 'brand': 'Lupin', 'stock': 180, 'status': 'In Stock'},
  {'id': 'MED-013', 'name': 'Tamsulosin', 'brand': 'Cipla', 'stock': 50, 'status': 'In Stock'},
  {'id': 'MED-014', 'name': 'Furosemide', 'brand': 'Sun Pharma', 'stock': 10, 'status': 'Low Stock'},
  {'id': 'MED-015', 'name': 'Alprazolam', 'brand': 'Dr. Reddy\'s', 'stock': 0, 'status': 'Out of Stock'},
  {'id': 'MED-016', 'name': 'Citalopram', 'brand': 'Lupin', 'stock': 100, 'status': 'In Stock'},
  {'id': 'MED-017', 'name': 'Insulin Glargine', 'brand': 'Cipla', 'stock': 30, 'status': 'In Stock'},
  {'id': 'MED-018', 'name': 'Levothyroxine', 'brand': 'Sun Pharma', 'stock': 5, 'status': 'Low Stock'},
  {'id': 'MED-019', 'name': 'Rosuvastatin', 'brand': 'Dr. Reddy\'s', 'stock': 130, 'status': 'In Stock'},
  {'id': 'MED-020', 'name': 'Zolpidem', 'brand': 'Lupin', 'stock': 40, 'status': 'In Stock'},
];

// --- Main Pharmacy Screen Widget ---
class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({super.key});

  @override
  State<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen> with SingleTickerProviderStateMixin {
  late Future<List<Medicine>> _medicinesFuture;
  String _searchQuery = '';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _medicinesFuture = _fetchMedicines();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<List<Medicine>> _fetchMedicines() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _pharmacyApiData.map((data) => Medicine.fromMap(data)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<Medicine>>(
        future: _medicinesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildPharmacyContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('No medicines found.'));
          }
        },
      ),
    );
  }

  Widget _buildPharmacyContent(BuildContext context, List<Medicine> medicines) {
    final filteredMedicines = medicines
        .where((m) =>
    m.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        m.id.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Pharmacy Inventory',
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add, size: 20),
                label: Text('Add Medicine', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  elevation: 2,
                  shadowColor: primaryColor.withOpacity(0.4),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            onChanged: (value) => setState(() => _searchQuery = value),
            decoration: InputDecoration(
              hintText: 'Search by name, brand, or ID',
              hintStyle: GoogleFonts.poppins(color: textSecondaryColor),
              prefixIcon: const Icon(Icons.search, color: textSecondaryColor),
              filled: true,
              fillColor: Colors.grey[50],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            ),
          ),
          const SizedBox(height: 24),
          _buildMedicinesTable(context, filteredMedicines),
        ],
      ),
    );
  }

  Widget _buildMedicinesTable(BuildContext context, List<Medicine> medicines) {
    return Container(
      width: double.infinity,
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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(Colors.grey[50]),
          headingTextStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: textSecondaryColor),
          dataTextStyle: GoogleFonts.poppins(color: textPrimaryColor),
          columnSpacing: 20,
          dataRowHeight: 64,
          columns: const [
            DataColumn(label: Text('MEDICINE ID')),
            DataColumn(label: Text('NAME')),
            DataColumn(label: Text('BRAND')),
            DataColumn(label: Text('STOCK')),
            DataColumn(label: Center(child: Text('STATUS'))),
            DataColumn(label: Center(child: Text('ACTIONS'))),
          ],
          rows: medicines.map((m) => _buildDataRow(context, m)).toList(),
        ),
      ),
    );
  }

  DataRow _buildDataRow(BuildContext context, Medicine medicine) {
    return DataRow(
      cells: [
        DataCell(Text(medicine.id)),
        DataCell(Text(medicine.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w500))),
        DataCell(Text(medicine.brand)),
        DataCell(Text(medicine.stock.toString())),
        DataCell(
          Center(
            child: Chip(
              label: Text(medicine.status),
              backgroundColor: medicine.status == 'In Stock'
                  ? const Color(0xFFD1FAE5)
                  : medicine.status == 'Low Stock'
                  ? const Color(0xFFFEF3C7)
                  : const Color(0xFFFEE2E2),
              labelStyle: GoogleFonts.poppins(
                color: medicine.status == 'In Stock'
                    ? const Color(0xFF065F46)
                    : medicine.status == 'Low Stock'
                    ? const Color(0xFF92400E)
                    : const Color(0xFF991B1B),
                fontWeight: FontWeight.w600,
              ),
              side: BorderSide.none,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
        ),
        DataCell(
          Center(
            child: TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => MedicineDetailScreen(medicine: medicine),
                  ),
                );
              },
              child: Text(
                'View Details',
                style: GoogleFonts.poppins(
                  color: primaryColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// --- Medicine Detail Screen ---
class MedicineDetailScreen extends StatelessWidget {
  final Medicine medicine;

  const MedicineDetailScreen({super.key, required this.medicine});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text('Medicine Details', style: GoogleFonts.poppins(color: textPrimaryColor)),
        backgroundColor: cardBackgroundColor,
        elevation: 1,
        iconTheme: const IconThemeData(color: textPrimaryColor),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Container(
          padding: const EdgeInsets.all(32.0),
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    medicine.name,
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: textPrimaryColor,
                    ),
                  ),
                  Chip(
                    label: Text(medicine.status),
                    backgroundColor: medicine.status == 'In Stock'
                        ? const Color(0xFFD1FAE5)
                        : medicine.status == 'Low Stock'
                        ? const Color(0xFFFEF3C7)
                        : const Color(0xFFFEE2E2),
                    labelStyle: GoogleFonts.poppins(
                      color: medicine.status == 'In Stock'
                          ? const Color(0xFF065F46)
                          : medicine.status == 'Low Stock'
                          ? const Color(0xFF92400E)
                          : const Color(0xFF991B1B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 24),
              _buildDetailRow('Medicine ID', medicine.id),
              _buildDetailRow('Brand', medicine.brand),
              _buildDetailRow('Stock', medicine.stock.toString()),
              _buildDetailRow('Last Updated', '2025-08-24'),
              const SizedBox(height: 24),
              Text(
                'Description',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'A common pain reliever and fever reducer. Used to treat many conditions such as headache, muscle aches, arthritis, backache, toothaches, colds, and fevers.',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  color: textSecondaryColor,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textSecondaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textPrimaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
