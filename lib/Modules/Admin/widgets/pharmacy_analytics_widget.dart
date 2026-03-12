// lib/Modules/Admin/widgets/pharmacy_analytics_widget.dart
// Pharmacy Analytics and Reports Dashboard

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

class PharmacyAnalyticsWidget extends StatefulWidget {
  const PharmacyAnalyticsWidget({super.key});

  @override
  State<PharmacyAnalyticsWidget> createState() => _PharmacyAnalyticsWidgetState();
}

class _PharmacyAnalyticsWidgetState extends State<PharmacyAnalyticsWidget> {
  bool _isLoading = true;
  Map<String, dynamic> _analytics = {};
  List<Map<String, dynamic>> _topSellingMedicines = [];
  List<Map<String, dynamic>> _lowStockAlerts = [];
  List<Map<String, dynamic>> _expiringMedicines = [];

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);

    try {
      final medicines = await AuthService.instance.fetchMedicines();

      // Calculate analytics
      int totalMedicines = medicines.length;
      int inStock = 0;
      int lowStock = 0;
      int outOfStock = 0;
      double totalValue = 0.0;
      double totalCost = 0.0;
      List<Map<String, dynamic>> lowStockList = [];
      List<Map<String, dynamic>> expiringList = [];

      final now = DateTime.now();
      final threeMonthsLater = now.add(const Duration(days: 90));

      for (var med in medicines) {
        final stock = med['stock'] ?? med['availableQty'] ?? 0;
        final price = (med['salePrice'] ?? med['price'] ?? 0.0) as num;
        final cost = (med['costPrice'] ?? 0.0) as num;

        if (stock > 20) {
          inStock++;
        } else if (stock > 0) {
          lowStock++;
          lowStockList.add(med);
        } else {
          outOfStock++;
        }

        totalValue += (stock * price.toDouble());
        totalCost += (stock * cost.toDouble());

        // Check expiry
        final expiryStr = med['expiryDate']?.toString() ?? '';
        if (expiryStr.isNotEmpty) {
          try {
            final expiryDate = DateTime.parse(expiryStr);
            if (expiryDate.isBefore(threeMonthsLater) && expiryDate.isAfter(now)) {
              expiringList.add(med);
            }
          } catch (e) {
            // Invalid date format
          }
        }
      }

      // Sort by stock for top selling (simplified - in real world use sales data)
      final topSelling = List<Map<String, dynamic>>.from(medicines);
      topSelling.sort((a, b) {
        final stockA = a['stock'] ?? a['availableQty'] ?? 0;
        final stockB = b['stock'] ?? b['availableQty'] ?? 0;
        return stockB.compareTo(stockA);
      });

      if (mounted) {
        setState(() {
          _analytics = {
            'total': totalMedicines,
            'inStock': inStock,
            'lowStock': lowStock,
            'outOfStock': outOfStock,
            'totalValue': totalValue,
            'totalCost': totalCost,
            'profit': totalValue - totalCost,
            'profitMargin': totalValue > 0 ? ((totalValue - totalCost) / totalValue * 100) : 0,
          };
          _topSellingMedicines = topSelling.take(10).toList();
          _lowStockAlerts = lowStockList.take(10).toList();
          _expiringMedicines = expiringList.take(10).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('❌ Error loading analytics: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFinancialSummary(),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildLowStockAlerts()),
              const SizedBox(width: 24),
              Expanded(child: _buildExpiringMedicines()),
            ],
          ),
          const SizedBox(height: 24),
          _buildTopSellingMedicines(),
        ],
      ),
    );
  }

  Widget _buildFinancialSummary() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.chart5, color: AppColors.primary, size: 28),
              const SizedBox(width: 12),
              Text(
                'Financial Summary',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _buildFinancialCard(
                'Total Inventory Value',
                '₹${NumberFormat('#,##,###').format(_analytics['totalValue'] ?? 0)}',
                Iconsax.wallet_35,
                AppColors.kSuccess,
              )),
              const SizedBox(width: 16),
              Expanded(child: _buildFinancialCard(
                'Total Cost',
                '₹${NumberFormat('#,##,###').format(_analytics['totalCost'] ?? 0)}',
                Iconsax.money_35,
                AppColors.kInfo,
              )),
              const SizedBox(width: 16),
              Expanded(child: _buildFinancialCard(
                'Potential Profit',
                '₹${NumberFormat('#,##,###').format(_analytics['profit'] ?? 0)}',
                Iconsax.chart_success5,
                AppColors.primary,
              )),
              const SizedBox(width: 16),
              Expanded(child: _buildFinancialCard(
                'Profit Margin',
                '${(_analytics['profitMargin'] ?? 0).toStringAsFixed(1)}%',
                Iconsax.percentage_square5,
                AppColors.kWarning,
              )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.kTextSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.kTextPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLowStockAlerts() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.kWarning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Iconsax.warning_25, color: AppColors.kWarning, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'Low Stock Alerts',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.kTextPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.kWarning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_lowStockAlerts.length}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.kWarning,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_lowStockAlerts.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Iconsax.tick_circle, size: 48, color: AppColors.kSuccess),
                    const SizedBox(height: 12),
                    Text(
                      'All stocks are healthy!',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppColors.kTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ...List.generate(_lowStockAlerts.length, (index) {
              final med = _lowStockAlerts[index];
              return _buildAlertItem(
                med['name'] ?? 'Unknown',
                'Stock: ${med['stock'] ?? 0} units',
                AppColors.kWarning,
              );
            }),
        ],
      ),
    );
  }

  Widget _buildExpiringMedicines() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.kDanger.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Iconsax.calendar_remove5, color: AppColors.kDanger, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'Expiring Soon',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.kTextPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.kDanger.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_expiringMedicines.length}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.kDanger,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_expiringMedicines.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Iconsax.tick_circle, size: 48, color: AppColors.kSuccess),
                    const SizedBox(height: 12),
                    Text(
                      'No expiring medicines!',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppColors.kTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ...List.generate(_expiringMedicines.length, (index) {
              final med = _expiringMedicines[index];
              return _buildAlertItem(
                med['name'] ?? 'Unknown',
                'Expiry: ${med['expiryDate']}',
                AppColors.kDanger,
              );
            }),
        ],
      ),
    );
  }

  Widget _buildAlertItem(String title, String subtitle, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2), width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopSellingMedicines() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.crown5, color: AppColors.primary, size: 24),
              const SizedBox(width: 12),
              Text(
                'Top Medicines by Stock',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_topSellingMedicines.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Text(
                  'No data available',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ),
            )
          else
            Table(
              columnWidths: const {
                0: FlexColumnWidth(1),
                1: FlexColumnWidth(3),
                2: FlexColumnWidth(2),
                3: FlexColumnWidth(2),
                4: FlexColumnWidth(2),
              },
              children: [
                TableRow(
                  decoration: BoxDecoration(
                    color: AppColors.grey50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  children: [
                    _buildTableHeader('#'),
                    _buildTableHeader('Medicine'),
                    _buildTableHeader('Category'),
                    _buildTableHeader('Stock'),
                    _buildTableHeader('Price'),
                  ],
                ),
                ...List.generate(_topSellingMedicines.length, (index) {
                  final med = _topSellingMedicines[index];
                  return TableRow(
                    children: [
                      _buildTableCell('${index + 1}'),
                      _buildTableCell(med['name'] ?? 'Unknown'),
                      _buildTableCell(med['category'] ?? 'N/A'),
                      _buildTableCell('${med['stock'] ?? 0}'),
                      _buildTableCell('₹${(med['salePrice'] ?? 0.0).toStringAsFixed(2)}'),
                    ],
                  );
                }),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildTableHeader(String text) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.kTextPrimary,
        ),
      ),
    );
  }

  Widget _buildTableCell(String text) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 13,
          color: AppColors.kTextSecondary,
        ),
      ),
    );
  }
}
