// lib/Modules/Admin/PharmacyPage.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';

class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({super.key});

  @override
  State<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen> with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService.instance;
  late TabController _tabController;
  
  List<Map<String, dynamic>> _medicines = [];
  List<Map<String, dynamic>> _batches = [];
  bool _isLoading = false;
  String? _errorMessage;
  
  final _searchController = TextEditingController();
  String _filterStatus = 'All';
  String _filterCategory = 'All';
  
  // Pagination
  int _currentPage = 0;
  int _itemsPerPage = 20;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔄 Loading medicines from API...');
      final medicines = await _authService.fetchMedicines(limit: 100);
      print('✅ Received ${medicines.length} medicines from API');
      
      // Also load batches
      await _loadBatches();
      
      // Normalize the data - ensure numeric fields are properly typed
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
          };
        } catch (e) {
          print('⚠️ Error normalizing medicine: $e');
          print('Medicine data: $med');
          rethrow;
        }
      }).toList();
      
      print('✅ Normalized ${normalizedMedicines.length} medicines');
      
      if (mounted) {
        setState(() {
          _medicines = normalizedMedicines;
          _isLoading = false;
        });
      }
    } catch (e, stackTrace) {
      print('❌ Error loading medicines: $e');
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
    if (value is String) {
      final parsed = int.tryParse(value);
      if (parsed == null) {
        print('⚠️ Could not parse "$value" to int, using 0');
      }
      return parsed ?? 0;
    }
    if (value is double) return value.toInt();
    print('⚠️ Unexpected type for numeric value: ${value.runtimeType}, using 0');
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          _buildHeader(),
          TabBar(
            controller: _tabController,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.kTextSecondary,
            indicatorColor: AppColors.primary,
            tabs: const [
              Tab(text: 'Medicine Inventory'),
              Tab(text: 'Batches'),
              Tab(text: 'Analytics'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildInventoryTab(),
                _buildBatchesTab(),
                _buildAnalyticsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        border: Border(bottom: BorderSide(color: AppColors.kMuted)),
      ),
      child: Row(
        children: [
          Icon(Iconsax.health, color: AppColors.primary, size: 32),
          const SizedBox(width: 16),
          Text(
            'Pharmacy Management',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: _showAddMedicineDialog,
            icon: const Icon(Iconsax.add),
            label: const Text('Add Medicine'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInventoryTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!, style: TextStyle(color: AppColors.kDanger)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          _buildSearchAndFilters(),
          const SizedBox(height: 24),
          Expanded(child: _buildMedicinesList()),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search medicines by name, SKU, or category...',
              prefixIcon: const Icon(Iconsax.search_normal),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true,
              fillColor: AppColors.cardBackground,
            ),
            onChanged: (_) => setState(() => _currentPage = 0), // Reset to first page on search
          ),
        ),
        const SizedBox(width: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
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
            onChanged: (v) => setState(() {
              _filterStatus = v ?? 'All';
              _currentPage = 0; // Reset to first page on filter change
            }),
          ),
        ),
        const SizedBox(width: 16),
        IconButton(
          icon: const Icon(Iconsax.refresh),
          onPressed: _loadData,
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
    final query = _searchController.text.toLowerCase();
    final filtered = _medicines.where((med) {
      final name = (med['name'] ?? '').toString().toLowerCase();
      final sku = (med['sku'] ?? '').toString().toLowerCase();
      final category = (med['category'] ?? '').toString().toLowerCase();
      final matchesSearch = query.isEmpty || name.contains(query) || sku.contains(query) || category.contains(query);
      
      final stock = med['availableQty'] ?? med['stock'] ?? 0;
      final reorderLevel = med['reorderLevel'] ?? 20;
      final matchesStatus = _filterStatus == 'All' ||
          (_filterStatus == 'In Stock' && stock > reorderLevel) ||
          (_filterStatus == 'Low Stock' && stock > 0 && stock <= reorderLevel) ||
          (_filterStatus == 'Out of Stock' && stock <= 0);
      
      return matchesSearch && matchesStatus;
    }).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Text(
          'No medicines found',
          style: TextStyle(color: AppColors.kTextSecondary),
        ),
      );
    }

    // Calculate pagination
    final totalItems = filtered.length;
    final totalPages = (totalItems / _itemsPerPage).ceil();
    final startIndex = _currentPage * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, totalItems);
    final paginatedList = filtered.sublist(startIndex, endIndex);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.kMuted),
      ),
      child: Column(
        children: [
          _buildTableHeader(),
          Expanded(
            child: ListView.builder(
              itemCount: paginatedList.length,
              itemBuilder: (context, index) {
                return _buildTableRow(paginatedList[index], index);
              },
            ),
          ),
          _buildPaginationControls(totalPages, totalItems, startIndex, endIndex),
        ],
      ),
    );
  }

  Widget _buildPaginationControls(int totalPages, int totalItems, int startIndex, int endIndex) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.kMuted)),
        color: AppColors.background,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Items info
          Text(
            'Showing ${startIndex + 1}-$endIndex of $totalItems medicines',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.kTextSecondary,
            ),
          ),
          
          // Items per page selector
          Row(
            children: [
              Text(
                'Rows per page:',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.kTextSecondary,
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<int>(
                value: _itemsPerPage,
                underline: const SizedBox(),
                items: [10, 20, 50, 100].map((value) {
                  return DropdownMenuItem(
                    value: value,
                    child: Text(value.toString()),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _itemsPerPage = value ?? 20;
                    _currentPage = 0; // Reset to first page
                  });
                },
              ),
            ],
          ),
          
          // Page navigation
          Row(
            children: [
              Text(
                'Page ${_currentPage + 1} of $totalPages',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.kTextSecondary,
                ),
              ),
              const SizedBox(width: 16),
              IconButton(
                icon: const Icon(Iconsax.arrow_left_2, size: 18),
                onPressed: _currentPage > 0
                    ? () => setState(() => _currentPage--)
                    : null,
                tooltip: 'Previous page',
              ),
              IconButton(
                icon: const Icon(Iconsax.arrow_right_3, size: 18),
                onPressed: _currentPage < totalPages - 1
                    ? () => setState(() => _currentPage++)
                    : null,
                tooltip: 'Next page',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        border: Border(bottom: BorderSide(color: AppColors.kMuted)),
      ),
      child: Row(
        children: [
          Expanded(flex: 3, child: _buildHeaderText('Medicine Name')),
          Expanded(flex: 2, child: _buildHeaderText('SKU')),
          Expanded(flex: 2, child: _buildHeaderText('Category')),
          Expanded(flex: 2, child: _buildHeaderText('Manufacturer')),
          Expanded(flex: 1, child: _buildHeaderText('Stock', centered: true)),
          Expanded(flex: 2, child: _buildHeaderText('Status', centered: true)),
          Expanded(flex: 1, child: _buildHeaderText('Actions', centered: true)),
        ],
      ),
    );
  }

  Widget _buildHeaderText(String text, {bool centered = false}) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.kTextPrimary,
      ),
      textAlign: centered ? TextAlign.center : TextAlign.left,
    );
  }

  Widget _buildTableRow(Map<String, dynamic> medicine, int index) {
    final stock = medicine['availableQty'] ?? medicine['stock'] ?? 0;
    final reorderLevel = medicine['reorderLevel'] ?? 20;
    final isLowStock = stock > 0 && stock <= reorderLevel;
    final isOutOfStock = stock <= 0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
          
          // SKU
          Expanded(
            flex: 2,
            child: Text(
              medicine['sku'] ?? 'N/A',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary),
            ),
          ),
          
          // Category
          Expanded(
            flex: 2,
            child: Text(
              medicine['category'] ?? 'N/A',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary),
            ),
          ),
          
          // Manufacturer
          Expanded(
            flex: 2,
            child: Text(
              medicine['manufacturer'] ?? 'N/A',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary),
            ),
          ),
          
          // Stock
          Expanded(
            flex: 1,
            child: Center(
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
                ),
              ),
            ),
          ),
          
          // Status
          Expanded(
            flex: 2,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isOutOfStock 
                      ? AppColors.kDanger.withValues(alpha: 0.1)
                      : (isLowStock 
                          ? AppColors.kWarning.withValues(alpha: 0.1)
                          : AppColors.kSuccess.withValues(alpha: 0.1)),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isOutOfStock 
                        ? AppColors.kDanger
                        : (isLowStock ? AppColors.kWarning : AppColors.kSuccess),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isOutOfStock 
                          ? Iconsax.danger
                          : (isLowStock ? Iconsax.warning_2 : Iconsax.tick_circle),
                      size: 14,
                      color: isOutOfStock 
                          ? AppColors.kDanger
                          : (isLowStock ? AppColors.kWarning : AppColors.kSuccess),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isOutOfStock 
                          ? 'Out'
                          : (isLowStock ? 'Low' : 'In Stock'),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isOutOfStock 
                            ? AppColors.kDanger
                            : (isLowStock ? AppColors.kWarning : AppColors.kSuccess),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Actions
          Expanded(
            flex: 1,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Iconsax.edit, size: 18),
                  onPressed: () => _showEditMedicineDialog(medicine),
                  tooltip: 'Edit',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(Iconsax.trash, size: 18, color: AppColors.kDanger),
                  onPressed: () => _deleteMedicine(medicine['_id']),
                  tooltip: 'Delete',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _loadBatches() async {
    try {
      print('🔄 Loading batches from API...');
      final response = await _authService.get('/api/pharmacy/batches');
      print('✅ Batches response: $response');
      
      if (response != null) {
        List<dynamic> batchList = [];
        if (response is List) {
          batchList = response;
        } else if (response is Map) {
          batchList = response['batches'] ?? response['data'] ?? [];
        }
        
        // Create a map of medicine IDs to names for quick lookup
        final medicineMap = <String, String>{};
        for (var med in _medicines) {
          final id = med['_id']?.toString();
          final name = med['name']?.toString();
          if (id != null && name != null) {
            medicineMap[id] = name;
          }
        }
        
        final normalizedBatches = batchList.map((batch) {
          final medicineId = batch['medicineId']?.toString() ?? '';
          String medicineName = 'Unknown';
          
          // Try different ways to get medicine name
          if (batch['medicineName'] != null) {
            medicineName = batch['medicineName'].toString();
          } else if (batch['medicine'] != null && batch['medicine']['name'] != null) {
            medicineName = batch['medicine']['name'].toString();
          } else if (medicineId.isNotEmpty && medicineMap.containsKey(medicineId)) {
            medicineName = medicineMap[medicineId]!;
          }
          
          return {
            '_id': batch['_id'] ?? '',
            'batchNumber': batch['batchNumber'] ?? 'N/A',
            'medicineId': medicineId,
            'medicineName': medicineName,
            'quantity': _toInt(batch['quantity'] ?? 0),
            'salePrice': _toDouble(batch['salePrice'] ?? 0),
            'purchasePrice': _toDouble(batch['purchasePrice'] ?? 0),
            'supplier': batch['supplier'] ?? 'N/A',
            'location': batch['location'] ?? 'Main Store',
            'expiryDate': batch['expiryDate'] ?? '',
            'createdAt': batch['createdAt'] ?? '',
          };
        }).toList();
        
        if (mounted) {
          setState(() {
            _batches = normalizedBatches;
          });
        }
        print('✅ Loaded ${normalizedBatches.length} batches');
        print('Medicine map has ${medicineMap.length} entries');
      }
    } catch (e) {
      print('❌ Error loading batches: $e');
    }
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  Widget _buildBatchesTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          _buildBatchHeader(),
          const SizedBox(height: 24),
          Expanded(child: _buildBatchesList()),
        ],
      ),
    );
  }

  Widget _buildBatchHeader() {
    return Row(
      children: [
        Icon(Iconsax.box, color: AppColors.primary, size: 28),
        const SizedBox(width: 12),
        Text(
          'Batch Management',
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.kTextPrimary,
          ),
        ),
        const Spacer(),
        ElevatedButton.icon(
          onPressed: _showAddBatchDialog,
          icon: const Icon(Iconsax.add),
          label: const Text('Add Batch'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildBatchesList() {
    if (_batches.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Iconsax.box, size: 64, color: AppColors.kMuted),
            const SizedBox(height: 16),
            Text(
              'No batches found',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.kTextPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add your first batch to get started',
              style: TextStyle(color: AppColors.kTextSecondary),
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.kMuted),
      ),
      child: Column(
        children: [
          _buildBatchTableHeader(),
          Expanded(
            child: ListView.builder(
              itemCount: _batches.length,
              itemBuilder: (context, index) {
                return _buildBatchTableRow(_batches[index], index);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBatchTableHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        border: Border(bottom: BorderSide(color: AppColors.kMuted)),
      ),
      child: Row(
        children: [
          Expanded(flex: 2, child: _buildHeaderText('Batch Number')),
          Expanded(flex: 3, child: _buildHeaderText('Medicine Name')),
          Expanded(flex: 2, child: _buildHeaderText('Supplier')),
          Expanded(flex: 1, child: _buildHeaderText('Quantity', centered: true)),
          Expanded(flex: 2, child: _buildHeaderText('Sale Price', centered: true)),
          Expanded(flex: 2, child: _buildHeaderText('Cost Price', centered: true)),
          Expanded(flex: 2, child: _buildHeaderText('Expiry Date', centered: true)),
          Expanded(flex: 1, child: _buildHeaderText('Actions', centered: true)),
        ],
      ),
    );
  }

  Widget _buildBatchTableRow(Map<String, dynamic> batch, int index) {
    final expiryDate = batch['expiryDate']?.toString() ?? '';
    final isExpiring = _isExpiringSoon(expiryDate);
    final isExpired = _isExpired(expiryDate);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: index.isEven ? Colors.transparent : AppColors.kBg,
        border: Border(bottom: BorderSide(color: AppColors.kMuted.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          // Batch Number
          Expanded(
            flex: 2,
            child: Text(
              batch['batchNumber'] ?? 'N/A',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
          ),
          
          // Medicine Name
          Expanded(
            flex: 3,
            child: Text(
              batch['medicineName'] ?? 'Unknown',
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary),
            ),
          ),
          
          // Supplier
          Expanded(
            flex: 2,
            child: Text(
              batch['supplier'] ?? 'N/A',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary),
            ),
          ),
          
          // Quantity
          Expanded(
            flex: 1,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  batch['quantity'].toString(),
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          ),
          
          // Sale Price
          Expanded(
            flex: 2,
            child: Center(
              child: Text(
                '₹${batch['salePrice']?.toStringAsFixed(2) ?? '0.00'}',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kSuccess,
                ),
              ),
            ),
          ),
          
          // Cost Price
          Expanded(
            flex: 2,
            child: Center(
              child: Text(
                '₹${batch['purchasePrice']?.toStringAsFixed(2) ?? '0.00'}',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.kTextSecondary,
                ),
              ),
            ),
          ),
          
          // Expiry Date
          Expanded(
            flex: 2,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isExpired
                      ? AppColors.kDanger.withValues(alpha: 0.1)
                      : (isExpiring
                          ? AppColors.kWarning.withValues(alpha: 0.1)
                          : Colors.transparent),
                  borderRadius: BorderRadius.circular(6),
                  border: isExpired || isExpiring
                      ? Border.all(
                          color: isExpired ? AppColors.kDanger : AppColors.kWarning,
                        )
                      : null,
                ),
                child: Text(
                  _formatDate(expiryDate),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: isExpired || isExpiring ? FontWeight.w600 : FontWeight.normal,
                    color: isExpired
                        ? AppColors.kDanger
                        : (isExpiring ? AppColors.kWarning : AppColors.kTextSecondary),
                  ),
                ),
              ),
            ),
          ),
          
          // Actions
          Expanded(
            flex: 1,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Iconsax.edit, size: 18),
                  onPressed: () => _showEditBatchDialog(batch),
                  tooltip: 'Edit',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(Iconsax.trash, size: 18, color: AppColors.kDanger),
                  onPressed: () => _deleteBatch(batch['_id']),
                  tooltip: 'Delete',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _isExpiringSoon(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return false;
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = date.difference(now).inDays;
      return difference > 0 && difference <= 90; // Expiring within 90 days
    } catch (e) {
      return false;
    }
  }

  bool _isExpired(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return false;
    try {
      final date = DateTime.parse(dateStr);
      return date.isBefore(DateTime.now());
    } catch (e) {
      return false;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (e) {
      return 'Invalid';
    }
  }

  void _showAddBatchDialog() {
    final batchNumberController = TextEditingController();
    final quantityController = TextEditingController();
    final salePriceController = TextEditingController();
    final costPriceController = TextEditingController();
    final supplierController = TextEditingController();
    final locationController = TextEditingController(text: 'Main Pharmacy Store');
    
    String? selectedMedicineId;
    DateTime selectedExpiryDate = DateTime.now().add(const Duration(days: 730)); // 2 years default

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Row(
            children: [
              Icon(Iconsax.box, color: AppColors.primary),
              const SizedBox(width: 12),
              const Text('Add New Batch'),
            ],
          ),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Batch Information', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 12),
                  
                  // Medicine Selection
                  DropdownButtonFormField<String>(
                    value: selectedMedicineId,
                    decoration: InputDecoration(
                      labelText: 'Select Medicine *',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      prefixIcon: const Icon(Iconsax.health),
                    ),
                    items: _medicines.map<DropdownMenuItem<String>>((med) {
                      return DropdownMenuItem<String>(
                        value: med['_id'] as String?,
                        child: Text(med['name'] ?? 'Unknown'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setDialogState(() => selectedMedicineId = value);
                    },
                  ),
                  const SizedBox(height: 12),
                  
                  TextField(
                    controller: batchNumberController,
                    decoration: InputDecoration(
                      labelText: 'Batch Number *',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      prefixIcon: const Icon(Iconsax.barcode),
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: quantityController,
                          decoration: InputDecoration(
                            labelText: 'Quantity *',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            prefixIcon: const Icon(Iconsax.box),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: supplierController,
                          decoration: InputDecoration(
                            labelText: 'Supplier',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            prefixIcon: const Icon(Iconsax.building),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  Text('Pricing', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 12),
                  
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: costPriceController,
                          decoration: InputDecoration(
                            labelText: 'Cost Price (₹) *',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            prefixIcon: const Icon(Iconsax.money_recive),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: salePriceController,
                          decoration: InputDecoration(
                            labelText: 'Sale Price (₹) *',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            prefixIcon: const Icon(Iconsax.money),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  Text('Storage & Expiry', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 12),
                  
                  TextField(
                    controller: locationController,
                    decoration: InputDecoration(
                      labelText: 'Storage Location',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      prefixIcon: const Icon(Iconsax.location),
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: selectedExpiryDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 3650)),
                      );
                      if (picked != null) {
                        setDialogState(() => selectedExpiryDate = picked);
                      }
                    },
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: 'Expiry Date',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        prefixIcon: const Icon(Iconsax.calendar),
                      ),
                      child: Text(
                        '${selectedExpiryDate.day}/${selectedExpiryDate.month}/${selectedExpiryDate.year}',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (selectedMedicineId == null || batchNumberController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please select medicine and enter batch number')),
                  );
                  return;
                }
                
                try {
                  await _authService.post('/api/pharmacy/batches', {
                    'medicineId': selectedMedicineId,
                    'batchNumber': batchNumberController.text,
                    'quantity': int.parse(quantityController.text.isEmpty ? '0' : quantityController.text),
                    'salePrice': double.parse(salePriceController.text.isEmpty ? '0' : salePriceController.text),
                    'purchasePrice': double.parse(costPriceController.text.isEmpty ? '0' : costPriceController.text),
                    'supplier': supplierController.text.isEmpty ? 'N/A' : supplierController.text,
                    'location': locationController.text,
                    'expiryDate': selectedExpiryDate.toIso8601String(),
                  });
                  
                  Navigator.pop(context);
                  _loadData();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Batch added successfully'), backgroundColor: Colors.green),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Add Batch'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditBatchDialog(Map<String, dynamic> batch) {
    // Similar to add dialog but with pre-filled values
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Edit batch functionality coming soon')),
    );
  }

  Future<void> _deleteBatch(String batchId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Batch'),
        content: const Text('Are you sure you want to delete this batch? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.kDanger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _authService.delete('/api/pharmacy/batches/$batchId');
        _loadData();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Batch deleted successfully')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting batch: $e')),
        );
      }
    }
  }

  Widget _buildAnalyticsTab() {
    final totalMedicines = _medicines.length;
    final lowStock = _medicines.where((m) {
      final stock = m['availableQty'] ?? m['stock'] ?? 0;
      final reorder = m['reorderLevel'] ?? 20;
      return stock > 0 && stock <= reorder;
    }).length;
    final outOfStock = _medicines.where((m) => (m['availableQty'] ?? m['stock'] ?? 0) <= 0).length;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Inventory Analytics',
            style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              _buildStatCard('Total Medicines', totalMedicines.toString(), Iconsax.health, AppColors.primary),
              const SizedBox(width: 16),
              _buildStatCard('Low Stock', lowStock.toString(), Iconsax.warning_2, AppColors.kWarning),
              const SizedBox(width: 16),
              _buildStatCard('Out of Stock', outOfStock.toString(), Iconsax.danger, AppColors.kDanger),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(value, style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: AppColors.kTextSecondary)),
          ],
        ),
      ),
    );
  }

  void _showAddMedicineDialog() {
    final nameController = TextEditingController();
    final skuController = TextEditingController();
    final categoryController = TextEditingController();
    final formController = TextEditingController(text: 'Tablet');
    final strengthController = TextEditingController();
    final manufacturerController = TextEditingController();
    final stockController = TextEditingController();
    final salePriceController = TextEditingController();
    final costPriceController = TextEditingController();
    final supplierController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Iconsax.health, color: AppColors.primary),
            const SizedBox(width: 12),
            const Text('Add New Medicine'),
          ],
        ),
        content: SizedBox(
          width: 500,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Basic Information', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 12),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: 'Medicine Name *',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Iconsax.health),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: skuController,
                        decoration: InputDecoration(
                          labelText: 'SKU Code',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          prefixIcon: const Icon(Iconsax.barcode),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: categoryController,
                        decoration: InputDecoration(
                          labelText: 'Category',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          prefixIcon: const Icon(Iconsax.category),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: formController,
                        decoration: InputDecoration(
                          labelText: 'Form (Tablet/Capsule/Syrup)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: strengthController,
                        decoration: InputDecoration(
                          labelText: 'Strength (e.g., 500mg)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: manufacturerController,
                  decoration: InputDecoration(
                    labelText: 'Manufacturer',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    prefixIcon: const Icon(Iconsax.building),
                  ),
                ),
                const SizedBox(height: 20),
                Text('Stock & Pricing', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: stockController,
                        decoration: InputDecoration(
                          labelText: 'Initial Stock Quantity',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          prefixIcon: const Icon(Iconsax.box),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: supplierController,
                        decoration: InputDecoration(
                          labelText: 'Supplier',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: costPriceController,
                        decoration: InputDecoration(
                          labelText: 'Cost Price (₹)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          prefixIcon: const Icon(Iconsax.money_recive),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: salePriceController,
                        decoration: InputDecoration(
                          labelText: 'Sale Price (₹)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          prefixIcon: const Icon(Iconsax.money),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Medicine name is required')),
                );
                return;
              }
              
              try {
                await _authService.post('/api/pharmacy/medicines', {
                  'name': nameController.text,
                  'sku': skuController.text.isEmpty ? null : skuController.text,
                  'category': categoryController.text.isEmpty ? null : categoryController.text,
                  'form': formController.text,
                  'strength': strengthController.text.isEmpty ? null : strengthController.text,
                  'manufacturer': manufacturerController.text.isEmpty ? null : manufacturerController.text,
                  'stock': stockController.text.isEmpty ? 0 : int.parse(stockController.text),
                  'salePrice': salePriceController.text.isEmpty ? 0 : double.parse(salePriceController.text),
                  'costPrice': costPriceController.text.isEmpty ? 0 : double.parse(costPriceController.text),
                  'supplier': supplierController.text.isEmpty ? null : supplierController.text,
                });
                
                Navigator.pop(context);
                _loadData();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Medicine added successfully'), backgroundColor: Colors.green),
                );
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Add Medicine'),
          ),
        ],
      ),
    );
  }

  void _showEditMedicineDialog(Map<String, dynamic> medicine) {
    final nameController = TextEditingController(text: medicine['name']);
    final skuController = TextEditingController(text: medicine['sku']);
    final categoryController = TextEditingController(text: medicine['category']);
    final stockController = TextEditingController(text: (medicine['availableQty'] ?? medicine['stock'] ?? 0).toString());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Medicine'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Medicine Name *')),
              TextField(controller: skuController, decoration: const InputDecoration(labelText: 'SKU')),
              TextField(controller: categoryController, decoration: const InputDecoration(labelText: 'Category')),
              TextField(controller: stockController, decoration: const InputDecoration(labelText: 'Stock'), keyboardType: TextInputType.number),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              try {
                await _authService.put('/api/pharmacy/medicines/${medicine['_id']}', {
                  'name': nameController.text,
                  'sku': skuController.text.isEmpty ? null : skuController.text,
                  'category': categoryController.text.isEmpty ? null : categoryController.text,
                  'stock': int.parse(stockController.text),
                });
                
                Navigator.pop(context);
                _loadData();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Medicine updated successfully')));
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteMedicine(String? id) async {
    if (id == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: const Text('Are you sure you want to delete this medicine?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.kDanger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _authService.delete('/api/pharmacy/medicines/$id');
        _loadData();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Medicine deleted successfully')));
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }
}
