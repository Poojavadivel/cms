// lib/Modules/Pharmacist/dashboard_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Utils/Colors.dart';
import '../../Services/Authservices.dart';
import '../../Services/api_constants.dart';
import 'dart:convert';

class PharmacistDashboardPage extends StatefulWidget {
  const PharmacistDashboardPage({super.key});

  @override
  State<PharmacistDashboardPage> createState() => _PharmacistDashboardPageState();
}

class _PharmacistDashboardPageState extends State<PharmacistDashboardPage> {
  List<dynamic> _pendingPrescriptions = [];
  Map<String, dynamic> _stats = {
    'totalMedicines': 0,
    'lowStock': 0,
    'pending': 0,
    'completed': 0,
  };
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      setState(() => _isLoading = true);
      
      final response = await AuthService.instance.get(PharmacyEndpoints.getPrescriptions() + '?limit=50');
      
      if (response != null) {
        final data = response is String ? jsonDecode(response) : response;
        List<dynamic> prescriptions = [];
        
        if (data['success'] == true && data['records'] != null) {
          prescriptions = data['records'] as List<dynamic>;
        } else if (data is List) {
          prescriptions = data;
        } else if (data['records'] != null) {
          prescriptions = data['records'] as List<dynamic>;
        }
        
        setState(() {
          _pendingPrescriptions = prescriptions;
          _stats['pending'] = prescriptions.where((p) => p['status'] != 'completed').length;
          _stats['completed'] = prescriptions.where((p) => p['status'] == 'completed').length;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error loading pharmacy records: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(),
              const SizedBox(height: 24),
              
              // Stats Cards
              _buildStatsCards(),
              const SizedBox(height: 24),
              
              // Main Content Grid
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left Column - 65%
                  Expanded(
                    flex: 65,
                    child: Column(
                      children: [
                        _buildRecentPrescriptions(),
                        const SizedBox(height: 20),
                        _buildStockAlerts(),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  
                  // Right Column - 35%
                  Expanded(
                    flex: 35,
                    child: Column(
                      children: [
                        _buildQuickActions(),
                        const SizedBox(height: 20),
                        _buildActivityLog(),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pharmacy Dashboard',
              style: GoogleFonts.lexend(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Manage medicines and prescriptions',
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
              icon: Iconsax.document_download,
              label: 'Export',
              onTap: () {},
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
            Icon(icon, size: 18, color: AppColors.primary),
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
        'value': '245',
        'color': const Color(0xFF3B82F6),
        'trend': '+12%',
        'trendUp': true,
      },
      {
        'icon': Iconsax.danger,
        'label': 'Low Stock Alert',
        'value': '12',
        'color': const Color(0xFFF97316),
        'trend': '-5%',
        'trendUp': false,
      },
      {
        'icon': Iconsax.clock,
        'label': 'Pending Orders',
        'value': _stats['pending'].toString(),
        'color': const Color(0xFFEAB308),
        'trend': '+3%',
        'trendUp': true,
      },
      {
        'icon': Iconsax.tick_circle,
        'label': 'Completed Today',
        'value': _stats['completed'].toString(),
        'color': const Color(0xFF22C55E),
        'trend': '+18%',
        'trendUp': true,
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: (stat['trendUp'] as bool
                                ? const Color(0xFF22C55E)
                                : const Color(0xFFEF4444))
                            .withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            stat['trendUp'] as bool
                                ? Iconsax.arrow_up_3
                                : Iconsax.arrow_down_1,
                            size: 12,
                            color: stat['trendUp'] as bool
                                ? const Color(0xFF22C55E)
                                : const Color(0xFFEF4444),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            stat['trend'] as String,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: stat['trendUp'] as bool
                                  ? const Color(0xFF22C55E)
                                  : const Color(0xFFEF4444),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  stat['value'] as String,
                  style: GoogleFonts.lexend(
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
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRecentPrescriptions() {
    return Container(
      padding: const EdgeInsets.all(24),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Iconsax.note_text, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Recent Prescriptions',
                        style: GoogleFonts.lexend(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.kTextPrimary,
                        ),
                      ),
                      Text(
                        '${_pendingPrescriptions.length} prescriptions',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              TextButton.icon(
                onPressed: _loadDashboardData,
                icon: const Icon(Iconsax.refresh, size: 16),
                label: const Text('Refresh'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _isLoading
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(),
                  ),
                )
              : _pendingPrescriptions.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: [
                            Icon(Iconsax.note_remove, size: 64, color: AppColors.kMuted),
                            const SizedBox(height: 16),
                            Text(
                              'No prescriptions found',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: AppColors.kTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'New prescriptions will appear here',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: AppColors.kTextSecondary.withOpacity(0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _pendingPrescriptions.length > 5 ? 5 : _pendingPrescriptions.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final record = _pendingPrescriptions[index];
                        final items = record['items'] as List<dynamic>? ?? [];
                        final patientId = record['patientId'] ?? 'N/A';
                        final type = record['type'] ?? 'Prescription';
                        final createdAt = record['createdAt'] != null
                            ? _formatDate(DateTime.parse(record['createdAt'].toString()))
                            : 'N/A';

                        return InkWell(
                          onTap: () => _showRecordDetails(record),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF3B82F6).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    Iconsax.health,
                                    color: const Color(0xFF3B82F6),
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Prescription #${record['_id']?.toString().substring(18, 24).toUpperCase() ?? 'N/A'}',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.kTextPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Patient: $patientId • ${items.length} item(s)',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: AppColors.kTextSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(type).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        type,
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: _getStatusColor(type),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      createdAt,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: AppColors.kTextSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ],
      ),
    );
  }

  Color _getStatusColor(String type) {
    switch (type.toLowerCase()) {
      case 'dispense':
        return const Color(0xFF22C55E);
      case 'pending':
        return const Color(0xFFEAB308);
      case 'completed':
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFFF97316);
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  Widget _buildStockAlerts() {
    final alerts = [
      {'medicine': 'Paracetamol 500mg', 'stock': '15', 'reorder': '100', 'status': 'Low'},
      {'medicine': 'Amoxicillin 250mg', 'stock': '5', 'reorder': '50', 'status': 'Critical'},
      {'medicine': 'Ibuprofen 400mg', 'stock': '25', 'reorder': '80', 'status': 'Low'},
      {'medicine': 'Cetirizine 10mg', 'stock': '8', 'reorder': '60', 'status': 'Critical'},
    ];

    return Container(
      padding: const EdgeInsets.all(24),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Iconsax.danger, color: Color(0xFFF97316), size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'Stock Alerts',
                style: GoogleFonts.lexend(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...alerts.map((alert) {
            final isCritical = alert['status'] == 'Critical';
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: (isCritical ? const Color(0xFFDC2626) : const Color(0xFFF97316)).withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: (isCritical ? const Color(0xFFDC2626) : const Color(0xFFF97316)).withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isCritical ? Iconsax.danger : Iconsax.info_circle,
                    color: isCritical ? const Color(0xFFDC2626) : const Color(0xFFF97316),
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          alert['medicine']!,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Stock: ${alert['stock']} • Reorder Level: ${alert['reorder']}',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.kTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isCritical ? const Color(0xFFDC2626) : const Color(0xFFF97316),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      alert['status']!,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
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

  void _showRecordDetails(Map<String, dynamic> record) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Iconsax.note_text, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Text(
              'Prescription Details',
              style: GoogleFonts.lexend(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: 600,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDetailRow('Record ID', record['_id']?.toString().substring(18, 24).toUpperCase() ?? 'N/A'),
                _buildDetailRow('Type', record['type'] ?? 'N/A'),
                _buildDetailRow('Patient ID', record['patientId'] ?? 'N/A'),
                _buildDetailRow('Total', '\$${record['total']?.toString() ?? '0'}'),
                _buildDetailRow('Paid', record['paid'] == true ? 'Yes' : 'No'),
                const SizedBox(height: 20),
                Text(
                  'Medicines:',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                ...(record['items'] as List<dynamic>? ?? []).map((item) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.kMuted.withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['name'] ?? 'Unknown Medicine',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        if (item['dosage'] != null)
                          _buildItemDetail('Dosage', item['dosage']),
                        if (item['frequency'] != null)
                          _buildItemDetail('Frequency', item['frequency']),
                        _buildItemDetail('Quantity', item['quantity'].toString()),
                        _buildItemDetail('Unit Price', '\$${item['unitPrice']}'),
                        if (item['notes'] != null && item['notes'].toString().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'Notes: ${item['notes']}',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppColors.kTextSecondary,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildItemDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.kTextSecondary,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.kTextPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.kTextSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.kTextPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      {
        'icon': Iconsax.add_circle,
        'label': 'Add Medicine',
        'color': const Color(0xFF3B82F6),
        'description': 'Add new medicine to inventory'
      },
      {
        'icon': Iconsax.note_add,
        'label': 'New Prescription',
        'color': const Color(0xFF8B5CF6),
        'description': 'Process new prescription'
      },
      {
        'icon': Iconsax.document_text,
        'label': 'Reports',
        'color': const Color(0xFF22C55E),
        'description': 'View sales reports'
      },
      {
        'icon': Iconsax.box,
        'label': 'Stock Management',
        'color': const Color(0xFFF97316),
        'description': 'Manage inventory'
      },
    ];

    return Container(
      padding: const EdgeInsets.all(24),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Iconsax.flash_1, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'Quick Actions',
                style: GoogleFonts.lexend(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...actions.map((action) {
            return InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(12),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: (action['color'] as Color).withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: (action['color'] as Color).withOpacity(0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: (action['color'] as Color).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        action['icon'] as IconData,
                        color: action['color'] as Color,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            action['label'] as String,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.kTextPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            action['description'] as String,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: AppColors.kTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Iconsax.arrow_right_3,
                      size: 18,
                      color: AppColors.kTextSecondary,
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildActivityLog() {
    final activities = [
      {
        'action': 'Prescription dispensed',
        'user': 'John Doe',
        'time': '5 mins ago',
        'icon': Iconsax.tick_circle,
        'color': const Color(0xFF22C55E),
      },
      {
        'action': 'Stock updated',
        'user': 'System',
        'time': '15 mins ago',
        'icon': Iconsax.box,
        'color': const Color(0xFF3B82F6),
      },
      {
        'action': 'Low stock alert',
        'user': 'System',
        'time': '1 hour ago',
        'icon': Iconsax.danger,
        'color': const Color(0xFFF97316),
      },
      {
        'action': 'New prescription',
        'user': 'Dr. Smith',
        'time': '2 hours ago',
        'icon': Iconsax.note_add,
        'color': const Color(0xFF8B5CF6),
      },
    ];

    return Container(
      padding: const EdgeInsets.all(24),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Iconsax.clock, color: Color(0xFF8B5CF6), size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'Recent Activity',
                style: GoogleFonts.lexend(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...activities.map((activity) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (activity['color'] as Color).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      activity['icon'] as IconData,
                      color: activity['color'] as Color,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          activity['action'] as String,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${activity['user']} • ${activity['time']}',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.kTextSecondary,
                          ),
                        ),
                      ],
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
}
