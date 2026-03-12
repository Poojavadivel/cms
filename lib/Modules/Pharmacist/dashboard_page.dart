// lib/Modules/Pharmacist/dashboard_page_complete.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Utils/Colors.dart';
import '../../Services/Authservices.dart';
import 'package:intl/intl.dart';

class PharmacistDashboardPage extends StatefulWidget {
  const PharmacistDashboardPage({super.key});

  @override
  State<PharmacistDashboardPage> createState() => _PharmacistDashboardPageState();
}

class _PharmacistDashboardPageState extends State<PharmacistDashboardPage> {
  final AuthService _authService = AuthService.instance;
  
  bool _isLoading = true;
  List<Map<String, dynamic>> _medicines = [];
  List<Map<String, dynamic>> _batches = [];
  List<Map<String, dynamic>> _recentPrescriptions = [];
  
  Map<String, dynamic> _stats = {
    'totalMedicines': 0,
    'lowStock': 0,
    'outOfStock': 0,
    'expiringBatches': 0,
    'totalValue': 0.0,
  };

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    
    try {
      // Load medicines
      final medicines = await _authService.fetchMedicines(limit: 100);
      
      // Load batches
      final batchResponse = await _authService.get('/api/pharmacy/batches?limit=100');
      List<dynamic> batchList = [];
      if (batchResponse is List) {
        batchList = batchResponse;
      } else if (batchResponse is Map) {
        batchList = batchResponse['batches'] ?? [];
      }
      
      final batches = batchList.map((b) => Map<String, dynamic>.from(b)).toList();
      
      // Calculate stats
      int lowStock = 0;
      int outOfStock = 0;
      double totalValue = 0.0;
      
      for (var med in medicines) {
        final stock = _toInt(med['availableQty'] ?? med['stock'] ?? 0);
        final reorderLevel = _toInt(med['reorderLevel'] ?? 20);
        
        if (stock == 0) {
          outOfStock++;
        } else if (stock <= reorderLevel) {
          lowStock++;
        }
      }
      
      // Count expiring batches (within 90 days)
      int expiringBatches = 0;
      final now = DateTime.now();
      for (var batch in batches) {
        final expiryStr = batch['expiryDate']?.toString();
        if (expiryStr != null && expiryStr.isNotEmpty) {
          try {
            final expiryDate = DateTime.parse(expiryStr);
            final daysUntilExpiry = expiryDate.difference(now).inDays;
            if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
              expiringBatches++;
            }
            
            // Calculate total value
            final quantity = _toInt(batch['quantity'] ?? 0);
            final salePrice = _toDouble(batch['salePrice'] ?? 0);
            totalValue += quantity * salePrice;
          } catch (e) {
            // Skip invalid dates
          }
        }
      }
      
      if (mounted) {
        setState(() {
          _medicines = medicines.map((m) => Map<String, dynamic>.from(m)).toList();
          _batches = batches;
          _stats = {
            'totalMedicines': medicines.length,
            'lowStock': lowStock,
            'outOfStock': outOfStock,
            'expiringBatches': expiringBatches,
            'totalValue': totalValue,
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Error loading dashboard: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(),
                  const SizedBox(height: 24),
                  _buildStatsCards(),
                  const SizedBox(height: 24),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 2,
                        child: Column(
                          children: [
                            _buildLowStockAlert(),
                            const SizedBox(height: 20),
                            _buildExpiringBatches(),
                          ],
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        flex: 1,
                        child: Column(
                          children: [
                            _buildQuickActions(),
                            const SizedBox(height: 20),
                            _buildRecentActivity(),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader() {
    final now = DateTime.now();
    final timeOfDay = now.hour < 12 ? 'Morning' : (now.hour < 18 ? 'Afternoon' : 'Evening');
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Good $timeOfDay, Pharmacist',
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormat('EEEE, MMMM d, yyyy').format(now),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.kTextSecondary,
              ),
            ),
          ],
        ),
        Row(
          children: [
            _buildHeaderButton(
              icon: Iconsax.refresh,
              label: 'Refresh',
              onTap: _loadDashboardData,
            ),
            const SizedBox(width: 12),
            _buildHeaderButton(
              icon: Iconsax.notification,
              label: 'Alerts',
              onTap: () {},
              badge: _stats['expiringBatches'] + _stats['outOfStock'],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeaderButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    int? badge,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.kMuted),
        ),
        child: Row(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(icon, size: 18, color: AppColors.primary),
                if (badge != null && badge > 0)
                  Positioned(
                    right: -8,
                    top: -8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.kDanger,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      child: Text(
                        badge > 99 ? '99+' : badge.toString(),
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCards() {
    final stats = [
      {
        'icon': Iconsax.health,
        'label': 'Total Medicines',
        'value': _stats['totalMedicines'].toString(),
        'color': const Color(0xFF3B82F6),
        'subtitle': '${_medicines.length} items',
      },
      {
        'icon': Iconsax.warning_2,
        'label': 'Low Stock',
        'value': _stats['lowStock'].toString(),
        'color': const Color(0xFFF97316),
        'subtitle': 'Need reorder',
      },
      {
        'icon': Iconsax.danger,
        'label': 'Out of Stock',
        'value': _stats['outOfStock'].toString(),
        'color': const Color(0xFFEF4444),
        'subtitle': 'Urgent action',
      },
      {
        'icon': Iconsax.calendar,
        'label': 'Expiring Soon',
        'value': _stats['expiringBatches'].toString(),
        'color': const Color(0xFFEAB308),
        'subtitle': 'Within 90 days',
      },
    ];

    return Row(
      children: stats.asMap().entries.map((entry) {
        final stat = entry.value;
        final isLast = entry.key == stats.length - 1;
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: isLast ? 0 : 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.kMuted.withOpacity(0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (stat['color'] as Color).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    stat['icon'] as IconData,
                    color: stat['color'] as Color,
                    size: 24,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  stat['value'] as String,
                  style: GoogleFonts.inter(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  stat['label'] as String,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.kTextSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  stat['subtitle'] as String,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLowStockAlert() {
    final lowStockMeds = _medicines.where((med) {
      final stock = _toInt(med['availableQty'] ?? med['stock'] ?? 0);
      final reorderLevel = _toInt(med['reorderLevel'] ?? 20);
      return stock > 0 && stock <= reorderLevel;
    }).take(5).toList();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.kMuted.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.warning_2, color: AppColors.kWarning, size: 24),
              const SizedBox(width: 12),
              Text(
                'Low Stock Alert',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
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
                  '${lowStockMeds.length} items',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kWarning,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (lowStockMeds.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'No low stock items',
                  style: GoogleFonts.inter(color: AppColors.kTextSecondary),
                ),
              ),
            )
          else
            ...lowStockMeds.map((med) {
              final stock = _toInt(med['availableQty'] ?? med['stock'] ?? 0);
              final reorderLevel = _toInt(med['reorderLevel'] ?? 20);
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.kWarning.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.kWarning.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.kWarning.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Iconsax.health, color: AppColors.kWarning, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            med['name'] ?? 'Unknown',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.kTextPrimary,
                            ),
                          ),
                          Text(
                            'SKU: ${med['sku'] ?? 'N/A'}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppColors.kTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.kWarning.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$stock units',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kWarning,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }

  Widget _buildExpiringBatches() {
    final now = DateTime.now();
    final expiringBatches = _batches.where((batch) {
      final expiryStr = batch['expiryDate']?.toString();
      if (expiryStr == null || expiryStr.isEmpty) return false;
      try {
        final expiryDate = DateTime.parse(expiryStr);
        final daysUntilExpiry = expiryDate.difference(now).inDays;
        return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
      } catch (e) {
        return false;
      }
    }).take(5).toList();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.kMuted.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Iconsax.calendar, color: AppColors.kDanger, size: 24),
              const SizedBox(width: 12),
              Text(
                'Expiring Batches',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
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
                  '${expiringBatches.length} batches',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kDanger,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (expiringBatches.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'No expiring batches',
                  style: GoogleFonts.inter(color: AppColors.kTextSecondary),
                ),
              ),
            )
          else
            ...expiringBatches.map((batch) {
              final expiryStr = batch['expiryDate']?.toString() ?? '';
              DateTime? expiryDate;
              int daysLeft = 0;
              try {
                expiryDate = DateTime.parse(expiryStr);
                daysLeft = expiryDate.difference(now).inDays;
              } catch (e) {
                // Skip
              }
              
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.kDanger.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.kDanger.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.kDanger.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Iconsax.box, color: AppColors.kDanger, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            batch['medicineName'] ?? 'Unknown',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.kTextPrimary,
                            ),
                          ),
                          Text(
                            'Batch: ${batch['batchNumber'] ?? 'N/A'}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppColors.kTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.kDanger.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$daysLeft days',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kDanger,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      {'icon': Iconsax.add_circle, 'label': 'Add Medicine', 'color': AppColors.primary},
      {'icon': Iconsax.box, 'label': 'Add Batch', 'color': AppColors.kSuccess},
      {'icon': Iconsax.document_text, 'label': 'New Prescription', 'color': AppColors.kWarning},
      {'icon': Iconsax.search_normal, 'label': 'Search Medicine', 'color': AppColors.kInfo},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.kMuted.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 16),
          ...actions.map((action) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: () {},
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: (action['color'] as Color).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: (action['color'] as Color).withOpacity(0.1),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          action['icon'] as IconData,
                          color: action['color'] as Color,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          action['label'] as String,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                        const Spacer(),
                        Icon(
                          Iconsax.arrow_right_3,
                          size: 16,
                          color: AppColors.kTextSecondary,
                        ),
                      ],
                    ),
                  ),
                ),
              )).toList(),
        ],
      ),
    );
  }

  Widget _buildRecentActivity() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.kMuted.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'System Status',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 16),
          _buildStatusItem(
            'Database',
            'Connected',
            Icons.check_circle,
            AppColors.kSuccess,
          ),
          _buildStatusItem(
            'API Status',
            'Operational',
            Icons.check_circle,
            AppColors.kSuccess,
          ),
          _buildStatusItem(
            'Inventory Value',
            '₹${_stats['totalValue'].toStringAsFixed(2)}',
            Iconsax.money,
            AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildStatusItem(String label, String value, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.kTextSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
