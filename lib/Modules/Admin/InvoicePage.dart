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
class Invoice {
  final String id;
  final String patientName;
  final String date;
  final double amount;
  final String status;

  Invoice({
    required this.id,
    required this.patientName,
    required this.date,
    required this.amount,
    required this.status,
  });

  factory Invoice.fromMap(Map<String, dynamic> map) {
    return Invoice(
      id: map['id'],
      patientName: map['patientName'],
      date: map['date'],
      amount: map['amount'],
      status: map['status'],
    );
  }
}

// --- Simulated API Data ---
const List<Map<String, dynamic>> _invoicesApiData = [
  {'id': 'INV-001', 'patientName': 'Arthur', 'date': '2025-08-14', 'amount': 250.00, 'status': 'Paid'},
  {'id': 'INV-002', 'patientName': 'John Philips', 'date': '2025-08-14', 'amount': 175.50, 'status': 'Paid'},
  {'id': 'INV-003', 'patientName': 'Regina', 'date': '2025-08-15', 'amount': 320.00, 'status': 'Pending'},
  {'id': 'INV-004', 'patientName': 'David', 'date': '2025-08-15', 'amount': 80.25, 'status': 'Overdue'},
  {'id': 'INV-005', 'patientName': 'Joseph', 'date': '2025-08-16', 'amount': 500.00, 'status': 'Pending'},
  {'id': 'INV-006', 'patientName': 'Lokesh', 'date': '2025-08-16', 'amount': 120.00, 'status': 'Paid'},
  {'id': 'INV-007', 'patientName': 'Sophia Miller', 'date': '2025-08-17', 'amount': 450.00, 'status': 'Pending'},
  {'id': 'INV-008', 'patientName': 'James Wilson', 'date': '2025-08-17', 'amount': 200.00, 'status': 'Paid'},
  {'id': 'INV-009', 'patientName': 'Olivia Garcia', 'date': '2025-08-18', 'amount': 75.00, 'status': 'Pending'},
  {'id': 'INV-010', 'patientName': 'Liam Martinez', 'date': '2025-08-18', 'amount': 600.00, 'status': 'Overdue'},
  {'id': 'INV-011', 'patientName': 'Emma Anderson', 'date': '2025-08-19', 'amount': 150.00, 'status': 'Paid'},
  {'id': 'INV-012', 'patientName': 'Noah Taylor', 'date': '2025-08-19', 'amount': 220.00, 'status': 'Pending'},
  {'id': 'INV-013', 'patientName': 'Ava Thomas', 'date': '2025-08-20', 'amount': 300.00, 'status': 'Paid'},
  {'id': 'INV-014', 'patientName': 'Isabella White', 'date': '2025-08-20', 'amount': 180.00, 'status': 'Pending'},
  {'id': 'INV-015', 'patientName': 'Mason Harris', 'date': '2025-08-21', 'amount': 400.00, 'status': 'Paid'},
  {'id': 'INV-016', 'patientName': 'Mia Clark', 'date': '2025-08-21', 'amount': 90.00, 'status': 'Overdue'},
  {'id': 'INV-017', 'patientName': 'Ethan Lewis', 'date': '2025-08-22', 'amount': 280.00, 'status': 'Pending'},
  {'id': 'INV-018', 'patientName': 'Abigail Robinson', 'date': '2025-08-22', 'amount': 350.00, 'status': 'Paid'},
  {'id': 'INV-019', 'patientName': 'Michael Walker', 'date': '2025-08-23', 'amount': 160.00, 'status': 'Pending'},
  {'id': 'INV-020', 'patientName': 'Emily Hall', 'date': '2025-08-23', 'amount': 210.00, 'status': 'Paid'},
];

// --- Main Invoice Screen Widget ---
class InvoiceScreen extends StatefulWidget {
  const InvoiceScreen({super.key});

  @override
  State<InvoiceScreen> createState() => _InvoiceScreenState();
}

class _InvoiceScreenState extends State<InvoiceScreen> with SingleTickerProviderStateMixin {
  late Future<List<Invoice>> _invoicesFuture;
  String _searchQuery = '';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _invoicesFuture = _fetchInvoices();
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

  Future<List<Invoice>> _fetchInvoices() async {
    await Future.delayed(const Duration(seconds: 2));
    _animationController.forward();
    return _invoicesApiData.map((data) => Invoice.fromMap(data)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<List<Invoice>>(
        future: _invoicesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: _buildInvoicesContent(context, snapshot.data!),
            );
          } else {
            return const Center(child: Text('No invoices found.'));
          }
        },
      ),
    );
  }

  Widget _buildInvoicesContent(BuildContext context, List<Invoice> invoices) {
    final filteredInvoices = invoices
        .where((i) =>
    i.patientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
        i.id.toLowerCase().contains(_searchQuery.toLowerCase()))
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
                'Invoice Management',
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add, size: 20),
                label: Text('Create Invoice', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
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
              hintText: 'Search by patient name or invoice ID',
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
          _buildInvoicesTable(context, filteredInvoices),
        ],
      ),
    );
  }

  Widget _buildInvoicesTable(BuildContext context, List<Invoice> invoices) {
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
            DataColumn(label: Text('INVOICE ID')),
            DataColumn(label: Text('PATIENT')),
            DataColumn(label: Text('DATE')),
            DataColumn(label: Text('AMOUNT')),
            DataColumn(label: Center(child: Text('STATUS'))),
            DataColumn(label: Center(child: Text('ACTIONS'))),
          ],
          rows: invoices.map((i) => _buildDataRow(context, i)).toList(),
        ),
      ),
    );
  }

  DataRow _buildDataRow(BuildContext context, Invoice invoice) {
    return DataRow(
      cells: [
        DataCell(Text(invoice.id)),
        DataCell(Text(invoice.patientName, style: GoogleFonts.poppins(fontWeight: FontWeight.w500))),
        DataCell(Text(invoice.date)),
        DataCell(Text('\$${invoice.amount.toStringAsFixed(2)}')),
        DataCell(
          Center(
            child: Chip(
              label: Text(invoice.status),
              backgroundColor: invoice.status == 'Paid'
                  ? const Color(0xFFD1FAE5)
                  : invoice.status == 'Pending'
                  ? const Color(0xFFFEF3C7)
                  : const Color(0xFFFEE2E2),
              labelStyle: GoogleFonts.poppins(
                color: invoice.status == 'Paid'
                    ? const Color(0xFF065F46)
                    : invoice.status == 'Pending'
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
                    builder: (context) => InvoiceDetailScreen(invoice: invoice),
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

// --- Invoice Detail Screen ---
class InvoiceDetailScreen extends StatelessWidget {
  final Invoice invoice;

  const InvoiceDetailScreen({super.key, required this.invoice});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text('Invoice Details', style: GoogleFonts.poppins(color: textPrimaryColor)),
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
                    invoice.id,
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: textPrimaryColor,
                    ),
                  ),
                  Chip(
                    label: Text(invoice.status),
                    backgroundColor: invoice.status == 'Paid'
                        ? const Color(0xFFD1FAE5)
                        : invoice.status == 'Pending'
                        ? const Color(0xFFFEF3C7)
                        : const Color(0xFFFEE2E2),
                    labelStyle: GoogleFonts.poppins(
                      color: invoice.status == 'Paid'
                          ? const Color(0xFF065F46)
                          : invoice.status == 'Pending'
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
              _buildDetailRow('Patient Name', invoice.patientName),
              _buildDetailRow('Invoice Date', invoice.date),
              _buildDetailRow('Amount', '\$${invoice.amount.toStringAsFixed(2)}'),
              _buildDetailRow('Due Date', '2025-09-15'),
              const SizedBox(height: 24),
              Text(
                'Services Rendered',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 16),
              _buildServiceRow('Consultation', '\$150.00'),
              _buildServiceRow('X-Ray', '\$75.50'),
              _buildServiceRow('Medication', '\$24.50'),
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

  Widget _buildServiceRow(String service, String amount) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            service,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textSecondaryColor,
            ),
          ),
          Text(
            amount,
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: textPrimaryColor,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
