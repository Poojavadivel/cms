// lib/Modules/Pharmacist/medicines_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';

class PharmacistMedicinesPage extends StatefulWidget {
  const PharmacistMedicinesPage({super.key});

  @override
  State<PharmacistMedicinesPage> createState() => _PharmacistMedicinesPageState();
}

class _PharmacistMedicinesPageState extends State<PharmacistMedicinesPage> {
  final AuthService _authService = AuthService.instance;
  final _searchController = TextEditingController();
  
  List<Map<String, dynamic>> _medicines = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _filterStatus = 'All';

  @override
  void initState() {
    super.initState();
    _loadMedicines();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMedicines() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔄 [Pharmacist] Loading medicines from API...');
      final medicines = await _authService.fetchMedicines(limit: 100);
      print('✅ [Pharmacist] Received ${medicines.length} medicines');
      
      // Normalize the data
      final normalizedMedicines = medicines.map((med) {
        try {
          return {
            '_id': med['_id'] ?? '',
            'name': med['name'] ?? 'Unknown',
            'sku': med['sku'] ?? '',
            'category': med['category'] ?? '',
            'manufacturer': med['manufacturer'] ?? '',
            'status': med['status'] ?? 'In Stock',
            'availableQty': _toInt(med['availableQty'] ?? med['stock'] ?? 0),
            'reorderLevel': _toInt(med['reorderLevel'] ?? 20),
            'form': med['form'] ?? 'Tablet',
            'strength': med['strength'] ?? '',
          };
        } catch (e) {
          print('⚠️ [Pharmacist] Error normalizing medicine: $e');
          rethrow;
        }
      }).toList();
      
      if (mounted) {
        setState(() {
          _medicines = normalizedMedicines;
          _isLoading = false;
        });
      }
    } catch (e, stackTrace) {
      print('❌ [Pharmacist] Error loading medicines: $e');
      print('Stack trace: $stackTrace');
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load medicines: ${e.toString()}';
          _isLoading = false;
        });
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

  List<Map<String, dynamic>> _getFilteredMedicines() {
    final query = _searchController.text.toLowerCase();
    
    return _medicines.where((med) {
      // Search filter
      final name = (med['name'] ?? '').toString().toLowerCase();
      final sku = (med['sku'] ?? '').toString().toLowerCase();
      final category = (med['category'] ?? '').toString().toLowerCase();
      final matchesSearch = query.isEmpty || 
        name.contains(query) || 
        sku.contains(query) || 
        category.contains(query);
      
      // Stock status filter
      final stock = med['availableQty'] ?? 0;
      final reorderLevel = med['reorderLevel'] ?? 20;
      
      final matchesStatus = _filterStatus == 'All' ||
        (_filterStatus == 'In Stock' && stock > reorderLevel) ||
        (_filterStatus == 'Low Stock' && stock > 0 && stock <= reorderLevel) ||
        (_filterStatus == 'Out of Stock' && stock <= 0);
      
      return matchesSearch && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildSearchAndFilter(),
            const SizedBox(height: 24),
            Expanded(child: _buildMedicinesList()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Icon(Iconsax.health, color: AppColors.primary, size: 28),
        const SizedBox(width: 12),
        Text(
          'Medicine Inventory',
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.kTextPrimary,
          ),
        ),
        const Spacer(),
        _buildStatsCard(),
      ],
    );
  }

  Widget _buildStatsCard() {
    final totalMedicines = _medicines.length;
    final lowStock = _medicines.where((m) {
      final stock = m['availableQty'] ?? 0;
      final reorder = m['reorderLevel'] ?? 20;
      return stock > 0 && stock <= reorder;
    }).length;
    final outOfStock = _medicines.where((m) => (m['availableQty'] ?? 0) <= 0).length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.kMuted),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildStatItem('Total', totalMedicines, AppColors.primary),
          Container(width: 1, height: 30, color: AppColors.kMuted, margin: const EdgeInsets.symmetric(horizontal: 12)),
          _buildStatItem('Low', lowStock, AppColors.kWarning),
          Container(width: 1, height: 30, color: AppColors.kMuted, margin: const EdgeInsets.symmetric(horizontal: 12)),
          _buildStatItem('Out', outOfStock, AppColors.kDanger),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, int count, Color color) {
    return Column(
      children: [
        Text(
          count.toString(),
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.kTextSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildSearchAndFilter() {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by name, SKU, or category...',
              prefixIcon: const Icon(Iconsax.search_normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true,
              fillColor: AppColors.cardBackground,
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(width: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.kMuted),
          ),
          child: DropdownButton<String>(
            value: _filterStatus,
            underline: const SizedBox(),
            items: ['All', 'In Stock', 'Low Stock', 'Out of Stock']
                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                .toList(),
            onChanged: (v) => setState(() => _filterStatus = v ?? 'All'),
          ),
        ),
        const SizedBox(width: 16),
        IconButton(
          icon: const Icon(Iconsax.refresh),
          onPressed: _loadMedicines,
          tooltip: 'Refresh',
          style: IconButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildMedicinesList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Iconsax.warning_2, size: 64, color: AppColors.kDanger),
            const SizedBox(height: 16),
            Text(
              'Error Loading Medicines',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: TextStyle(color: AppColors.kTextSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadMedicines,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final filtered = _getFilteredMedicines();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Iconsax.box, size: 64, color: AppColors.kMuted),
            const SizedBox(height: 16),
            Text(
              'No Medicines Found',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filter',
              style: TextStyle(color: AppColors.kTextSecondary),
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.kMuted),
      ),
      child: Column(
        children: [
          _buildTableHeader(),
          Expanded(
            child: ListView.builder(
              itemCount: filtered.length,
              itemBuilder: (context, index) => _buildMedicineRow(filtered[index], index),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        border: Border(bottom: BorderSide(color: AppColors.kMuted)),
      ),
      child: Row(
        children: [
          Expanded(flex: 3, child: _buildHeaderText('Medicine Name')),
          Expanded(flex: 2, child: _buildHeaderText('Category')),
          Expanded(flex: 2, child: _buildHeaderText('SKU')),
          Expanded(flex: 1, child: _buildHeaderText('Stock', centered: true)),
          Expanded(flex: 2, child: _buildHeaderText('Status', centered: true)),
        ],
      ),
    );
  }

  Widget _buildHeaderText(String text, {bool centered = false}) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.kTextPrimary,
      ),
      textAlign: centered ? TextAlign.center : TextAlign.left,
    );
  }

  Widget _buildMedicineRow(Map<String, dynamic> medicine, int index) {
    final stock = medicine['availableQty'] ?? 0;
    final reorderLevel = medicine['reorderLevel'] ?? 20;
    final isLowStock = stock > 0 && stock <= reorderLevel;
    final isOutOfStock = stock <= 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: index.isEven ? Colors.transparent : AppColors.kBg,
        border: Border(bottom: BorderSide(color: AppColors.kMuted.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          // Medicine Name
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  medicine['name'] ?? 'Unknown',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                if (medicine['strength']?.toString().isNotEmpty ?? false)
                  Text(
                    medicine['strength'],
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.kTextSecondary,
                    ),
                  ),
              ],
            ),
          ),
          
          // Category
          Expanded(
            flex: 2,
            child: Text(
              medicine['category'] ?? 'N/A',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.kTextSecondary,
              ),
            ),
          ),
          
          // SKU
          Expanded(
            flex: 2,
            child: Text(
              medicine['sku'] ?? 'N/A',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.kTextSecondary,
              ),
            ),
          ),
          
          // Stock
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isOutOfStock 
                    ? AppColors.kDanger.withValues(alpha: 0.1)
                    : (isLowStock 
                        ? AppColors.kWarning.withValues(alpha: 0.1)
                        : AppColors.kSuccess.withValues(alpha: 0.1)),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                stock.toString(),
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isOutOfStock 
                      ? AppColors.kDanger
                      : (isLowStock ? AppColors.kWarning : AppColors.kSuccess),
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          
          // Status
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isOutOfStock 
                    ? AppColors.kDanger.withValues(alpha: 0.1)
                    : (isLowStock 
                        ? AppColors.kWarning.withValues(alpha: 0.1)
                        : AppColors.kSuccess.withValues(alpha: 0.1)),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isOutOfStock 
                      ? AppColors.kDanger
                      : (isLowStock ? AppColors.kWarning : AppColors.kSuccess),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isOutOfStock 
                        ? Iconsax.danger
                        : (isLowStock ? Iconsax.warning_2 : Iconsax.tick_circle),
                    size: 16,
                    color: isOutOfStock 
                        ? AppColors.kDanger
                        : (isLowStock ? AppColors.kWarning : AppColors.kSuccess),
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      isOutOfStock 
                          ? 'Out of Stock'
                          : (isLowStock ? 'Low Stock' : 'In Stock'),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isOutOfStock 
                            ? AppColors.kDanger
                            : (isLowStock ? AppColors.kWarning : AppColors.kSuccess),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Old commented code below for reference
//
// class _PharmacistMedicinesPageState extends State<PharmacistMedicinesPage> {
//   final _searchController = TextEditingController();
//
//   @override
//   void dispose() {
//     _searchController.dispose();
//     super.dispose();
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Padding(
//       padding: const EdgeInsets.all(24),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             children: [
//               Expanded(
//                 child: TextField(
//                   controller: _searchController,
//                   decoration: InputDecoration(
//                     hintText: 'Search medicines...',
//                     prefixIcon: const Icon(Iconsax.search_normal),
//                     border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
//                     filled: true,
//                     fillColor: AppColors.cardBackground,
//                   ),
//                 ),
//               ),
//               const SizedBox(width: 16),
//               ElevatedButton.icon(
//                 onPressed: () {},
//                 icon: const Icon(Iconsax.add),
//                 label: const Text('Add Medicine'),
//                 style: ElevatedButton.styleFrom(
//                   backgroundColor: AppColors.primary,
//                   foregroundColor: Colors.white,
//                   padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
//                   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 24),
//           Expanded(child: _buildMedicinesTable()),
//         ],
//       ),
//     );
//   }
//
//   Widget _buildMedicinesTable() {
//     return Container(
//       decoration: BoxDecoration(
//         color: AppColors.cardBackground,
//         borderRadius: BorderRadius.circular(16),
//         border: Border.all(color: AppColors.kMuted),
//       ),
//       child: Column(
//         children: [
//           Container(
//             padding: const EdgeInsets.all(16),
//             decoration: BoxDecoration(
//               border: Border(bottom: BorderSide(color: AppColors.kMuted)),
//             ),
//             child: Row(
//               children: [
//                 Expanded(flex: 3, child: Text('Medicine Name', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 2, child: Text('Category', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 1, child: Text('Stock', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 1, child: Text('Price', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 1, child: Text('Actions', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//               ],
//             ),
//           ),
//           Expanded(
//             child: ListView.builder(
//               itemCount: 10,
//               itemBuilder: (context, index) {
//                 final stock = 50 - (index * 5);
//                 final isLowStock = stock < 20;
//                 return Container(
//                   padding: const EdgeInsets.all(16),
//                   decoration: BoxDecoration(
//                     border: Border(bottom: BorderSide(color: AppColors.kMuted.withValues(alpha: 0.5))),
//                     color: index.isEven ? Colors.transparent : AppColors.kBg,
//                   ),
//                   child: Row(
//                     children: [
//                       Expanded(flex: 3, child: Text('Medicine ${index + 1}', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary))),
//                       Expanded(flex: 2, child: Text('Category ${(index % 3) + 1}', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary))),
//                       Expanded(
//                         flex: 1,
//                         child: Container(
//                           padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
//                           decoration: BoxDecoration(
//                             color: isLowStock ? const Color(0xFFDC2626).withValues(alpha: 0.1) : const Color(0xFF22C55E).withValues(alpha: 0.1),
//                             borderRadius: BorderRadius.circular(6),
//                           ),
//                           child: Text('$stock', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: isLowStock ? const Color(0xFFDC2626) : const Color(0xFF22C55E))),
//                         ),
//                       ),
//                       Expanded(flex: 1, child: Text('\$${(10 + index * 2).toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary))),
//                       Expanded(
//                         flex: 1,
//                         child: Row(
//                           children: [
//                             IconButton(icon: const Icon(Iconsax.edit, size: 18), onPressed: () {}, tooltip: 'Edit'),
//                             IconButton(icon: const Icon(Iconsax.trash, size: 18), onPressed: () {}, tooltip: 'Delete', color: const Color(0xFFDC2626)),
//                           ],
//                         ),
//                       ),
//                     ],
//                   ),
//                 );
//               },
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }
