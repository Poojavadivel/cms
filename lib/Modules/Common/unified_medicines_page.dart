// lib/Modules/Common/unified_medicines_page.dart
// Unified Medicine Inventory Management for Admin & Pharmacist

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Services/Authservices.dart';
import '../../Services/api_constants.dart';
import '../../Utils/Colors.dart';

class UnifiedMedicinesPage extends StatefulWidget {
  final bool isAdmin;
  
  const UnifiedMedicinesPage({
    super.key,
    this.isAdmin = false,
  });

  @override
  State<UnifiedMedicinesPage> createState() => _UnifiedMedicinesPageState();
}

class _UnifiedMedicinesPageState extends State<UnifiedMedicinesPage> {
  final _searchController = TextEditingController();
  final AuthService _authService = AuthService.instance;
  
  List<Map<String, dynamic>> _allMedicines = [];
  List<Map<String, dynamic>> _filteredMedicines = [];
  bool _isLoading = false;
  String? _errorMessage;
  
  // Filters
  String _filterStatus = 'All'; // All, In Stock, Low Stock, Out of Stock
  String _filterCategory = 'All';
  
  // Pagination
  int _currentPage = 0;
  final int _itemsPerPage = 20;
  int _totalPages = 0;
  
  // View mode
  bool _isGridView = false;
  
  // Categories
  final List<String> _categories = ['All'];

  @override
  void initState() {
    super.initState();
    _loadMedicines();
    _searchController.addListener(_filterMedicines);
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
      final medicines = await _authService.fetchMedicines(
        page: _currentPage,
        limit: 100, // Load more for better filtering
        q: '',
        status: '',
      );
      
      if (mounted) {
        setState(() {
          _allMedicines = medicines;
          _extractCategories();
          _filterMedicines();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load medicines: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _extractCategories() {
    final Set<String> cats = {'All'};
    for (var med in _allMedicines) {
      final category = (med['category'] ?? '').toString().trim();
      if (category.isNotEmpty) {
        cats.add(category);
      }
    }
    _categories.clear();
    _categories.addAll(cats);
  }

  void _filterMedicines() {
    final query = _searchController.text.toLowerCase();
    
    setState(() {
      _filteredMedicines = _allMedicines.where((med) {
        // Search filter
        final name = (med['name'] ?? '').toString().toLowerCase();
        final category = (med['category'] ?? '').toString().toLowerCase();
        final manufacturer = (med['manufacturer'] ?? '').toString().toLowerCase();
        final sku = (med['sku'] ?? '').toString().toLowerCase();
        
        final matchesSearch = query.isEmpty || 
          name.contains(query) || 
          category.contains(query) ||
          manufacturer.contains(query) ||
          sku.contains(query);
        
        // Category filter
        final matchesCategory = _filterCategory == 'All' || 
          category == _filterCategory.toLowerCase();
        
        // Stock status filter
        final stock = med['availableQty'] ?? med['stock'] ?? med['quantity'] ?? 0;
        final reorderLevel = med['reorderLevel'] ?? 20;
        
        final matchesStatus = _filterStatus == 'All' ||
          (_filterStatus == 'In Stock' && stock > reorderLevel) ||
          (_filterStatus == 'Low Stock' && stock > 0 && stock <= reorderLevel) ||
          (_filterStatus == 'Out of Stock' && stock <= 0);
        
        return matchesSearch && matchesCategory && matchesStatus;
      }).toList();
      
      _totalPages = (_filteredMedicines.length / _itemsPerPage).ceil();
    });
  }

  List<Map<String, dynamic>> _getPaginatedMedicines() {
    final start = _currentPage * _itemsPerPage;
    final end = (start + _itemsPerPage).clamp(0, _filteredMedicines.length);
    return _filteredMedicines.sublist(start, end);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          _buildHeader(),
          _buildFiltersBar(),
          _buildStatsBar(),
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _errorMessage != null
                    ? _buildErrorState()
                    : _filteredMedicines.isEmpty
                        ? _buildEmptyState()
                        : _isGridView
                            ? _buildGridView()
                            : _buildListView(),
          ),
          if (_filteredMedicines.isNotEmpty) _buildPagination(),
        ],
      ),
      floatingActionButton: widget.isAdmin
          ? FloatingActionButton.extended(
              onPressed: _showAddMedicineDialog,
              icon: const Icon(Iconsax.add),
              label: const Text('Add Medicine'),
              backgroundColor: AppColors.primary,
            )
          : null,
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Iconsax.health, size: 28, color: AppColors.primary),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Medicine Inventory',
                style: GoogleFonts.lexend(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
              ),
              Text(
                widget.isAdmin ? 'Admin Management' : 'Pharmacy View',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.kTextSecondary,
                ),
              ),
            ],
          ),
          const Spacer(),
          IconButton(
            icon: Icon(
              _isGridView ? Iconsax.row_vertical : Iconsax.element_3,
              color: AppColors.primary,
            ),
            onPressed: () => setState(() => _isGridView = !_isGridView),
            tooltip: _isGridView ? 'List View' : 'Grid View',
          ),
          IconButton(
            icon: Icon(Iconsax.refresh, color: AppColors.primary),
            onPressed: _isLoading ? null : _loadMedicines,
            tooltip: 'Refresh',
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.white,
      child: Column(
        children: [
          // Search bar
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by name, category, manufacturer, or SKU...',
              hintStyle: GoogleFonts.inter(fontSize: 14),
              prefixIcon: Icon(Iconsax.search_normal, color: AppColors.primary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Iconsax.close_circle),
                      onPressed: () {
                        _searchController.clear();
                        _filterMedicines();
                      },
                    )
                  : null,
              filled: true,
              fillColor: AppColors.grey50,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
          const SizedBox(height: 12),
          // Filter chips
          Row(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', _filterStatus == 'All', () {
                        setState(() => _filterStatus = 'All');
                        _filterMedicines();
                      }),
                      const SizedBox(width: 8),
                      _buildFilterChip('In Stock', _filterStatus == 'In Stock', () {
                        setState(() => _filterStatus = 'In Stock');
                        _filterMedicines();
                      }, color: AppColors.kSuccess),
                      const SizedBox(width: 8),
                      _buildFilterChip('Low Stock', _filterStatus == 'Low Stock', () {
                        setState(() => _filterStatus = 'Low Stock');
                        _filterMedicines();
                      }, color: AppColors.kWarning),
                      const SizedBox(width: 8),
                      _buildFilterChip('Out of Stock', _filterStatus == 'Out of Stock', () {
                        setState(() => _filterStatus = 'Out of Stock');
                        _filterMedicines();
                      }, color: AppColors.kDanger),
                      const SizedBox(width: 16),
                      // Category dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: AppColors.grey50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.grey200),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _filterCategory,
                            icon: Icon(Iconsax.arrow_down_1, size: 16, color: AppColors.primary),
                            onChanged: (value) {
                              setState(() => _filterCategory = value!);
                              _filterMedicines();
                            },
                            items: _categories.map((cat) {
                              return DropdownMenuItem(
                                value: cat,
                                child: Text(
                                  cat,
                                  style: GoogleFonts.inter(fontSize: 13),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool selected, VoidCallback onTap, {Color? color}) {
    final chipColor = color ?? AppColors.primary;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? chipColor : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? chipColor : AppColors.grey200,
            width: selected ? 0 : 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.white : AppColors.kTextSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildStatsBar() {
    final inStock = _allMedicines.where((m) {
      final stock = m['availableQty'] ?? m['stock'] ?? m['quantity'] ?? 0;
      return stock > 20;
    }).length;
    
    final lowStock = _allMedicines.where((m) {
      final stock = m['availableQty'] ?? m['stock'] ?? m['quantity'] ?? 0;
      return stock > 0 && stock <= 20;
    }).length;
    
    final outOfStock = _allMedicines.where((m) {
      final stock = m['availableQty'] ?? m['stock'] ?? m['quantity'] ?? 0;
      return stock <= 0;
    }).length;

    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.white,
      child: Row(
        children: [
          _buildStatItem('Total', _allMedicines.length.toString(), AppColors.primary),
          const SizedBox(width: 16),
          _buildStatItem('In Stock', inStock.toString(), AppColors.kSuccess),
          const SizedBox(width: 16),
          _buildStatItem('Low Stock', lowStock.toString(), AppColors.kWarning),
          const SizedBox(width: 16),
          _buildStatItem('Out of Stock', outOfStock.toString(), AppColors.kDanger),
          const Spacer(),
          Text(
            'Showing ${_filteredMedicines.length} medicines',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: AppColors.kTextSecondary,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildListView() {
    final paginatedMedicines = _getPaginatedMedicines();
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: paginatedMedicines.length,
      itemBuilder: (context, index) {
        final medicine = paginatedMedicines[index];
        return _buildMedicineCard(medicine);
      },
    );
  }

  Widget _buildGridView() {
    final paginatedMedicines = _getPaginatedMedicines();
    
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.85,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: paginatedMedicines.length,
      itemBuilder: (context, index) {
        final medicine = paginatedMedicines[index];
        return _buildMedicineGridCard(medicine);
      },
    );
  }

  Widget _buildMedicineCard(Map<String, dynamic> medicine) {
    final name = medicine['name'] ?? 'Unknown';
    final category = medicine['category'] ?? '';
    final manufacturer = medicine['manufacturer'] ?? '';
    final stock = medicine['availableQty'] ?? medicine['stock'] ?? medicine['quantity'] ?? 0;
    final reorderLevel = medicine['reorderLevel'] ?? 20;
    final salePrice = medicine['salePrice'] ?? 0;
    
    Color stockColor = AppColors.kSuccess;
    String stockStatus = 'In Stock';
    if (stock <= 0) {
      stockColor = AppColors.kDanger;
      stockStatus = 'Out of Stock';
    } else if (stock <= reorderLevel) {
      stockColor = AppColors.kWarning;
      stockStatus = 'Low Stock';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.grey200),
      ),
      child: InkWell(
        onTap: () => _showMedicineDetails(medicine),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: stockColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Iconsax.health, color: stockColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.lexend(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.kTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (category.isNotEmpty)
                      Text(
                        category,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                    if (manufacturer.isNotEmpty)
                      Text(
                        manufacturer,
                        style: GoogleFonts.inter(
                          fontSize: 11,
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
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: stockColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: stockColor.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      stockStatus,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: stockColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Stock: $stock',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: stockColor,
                    ),
                  ),
                  if (salePrice > 0)
                    Text(
                      '₹${salePrice.toStringAsFixed(2)}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.kTextSecondary,
                      ),
                    ),
                ],
              ),
              if (widget.isAdmin) ...[
                const SizedBox(width: 12),
                PopupMenuButton(
                  icon: Icon(Iconsax.more, color: AppColors.kTextSecondary),
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      child: Row(
                        children: [
                          Icon(Iconsax.edit, size: 18, color: AppColors.primary),
                          const SizedBox(width: 8),
                          const Text('Edit'),
                        ],
                      ),
                      onTap: () => Future.delayed(
                        Duration.zero,
                        () => _showEditMedicineDialog(medicine),
                      ),
                    ),
                    PopupMenuItem(
                      child: Row(
                        children: [
                          Icon(Iconsax.trash, size: 18, color: AppColors.kDanger),
                          const SizedBox(width: 8),
                          const Text('Delete'),
                        ],
                      ),
                      onTap: () => Future.delayed(
                        Duration.zero,
                        () => _confirmDelete(medicine),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMedicineGridCard(Map<String, dynamic> medicine) {
    final name = medicine['name'] ?? 'Unknown';
    final stock = medicine['availableQty'] ?? medicine['stock'] ?? medicine['quantity'] ?? 0;
    final reorderLevel = medicine['reorderLevel'] ?? 20;
    final salePrice = medicine['salePrice'] ?? 0;
    
    Color stockColor = AppColors.kSuccess;
    if (stock <= 0) {
      stockColor = AppColors.kDanger;
    } else if (stock <= reorderLevel) {
      stockColor = AppColors.kWarning;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.grey200),
      ),
      child: InkWell(
        onTap: () => _showMedicineDetails(medicine),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: stockColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Iconsax.health, color: stockColor, size: 20),
                  ),
                  const Spacer(),
                  if (widget.isAdmin)
                    PopupMenuButton(
                      icon: Icon(Iconsax.more, size: 18, color: AppColors.kTextSecondary),
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          child: const Text('Edit'),
                          onTap: () => Future.delayed(
                            Duration.zero,
                            () => _showEditMedicineDialog(medicine),
                          ),
                        ),
                        PopupMenuItem(
                          child: const Text('Delete'),
                          onTap: () => Future.delayed(
                            Duration.zero,
                            () => _confirmDelete(medicine),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                name,
                style: GoogleFonts.lexend(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const Spacer(),
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Stock: $stock',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: stockColor,
                    ),
                  ),
                  if (salePrice > 0)
                    Text(
                      '₹$salePrice',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.kTextPrimary,
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

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Iconsax.arrow_left_2),
            onPressed: _currentPage > 0
                ? () => setState(() {
                      _currentPage--;
                    })
                : null,
          ),
          const SizedBox(width: 16),
          Text(
            'Page ${_currentPage + 1} of ${_totalPages > 0 ? _totalPages : 1}',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(width: 16),
          IconButton(
            icon: const Icon(Iconsax.arrow_right_3),
            onPressed: _currentPage < _totalPages - 1
                ? () => setState(() {
                      _currentPage++;
                    })
                : null,
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 16),
          Text(
            'Loading medicines...',
            style: GoogleFonts.inter(color: AppColors.kTextSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.danger, size: 64, color: AppColors.kDanger),
          const SizedBox(height: 16),
          Text(
            'Error Loading Medicines',
            style: GoogleFonts.lexend(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              _errorMessage ?? 'Unknown error occurred',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: AppColors.kTextSecondary),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadMedicines,
            icon: const Icon(Iconsax.refresh),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.box_1, size: 80, color: AppColors.kTextSecondary),
          const SizedBox(height: 24),
          Text(
            'No Medicines Found',
            style: GoogleFonts.lexend(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchController.text.isEmpty
                ? 'Start by adding medicines to your inventory'
                : 'Try adjusting your search or filters',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.kTextSecondary,
            ),
          ),
          if (_searchController.text.isNotEmpty) ...[
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () {
                _searchController.clear();
                setState(() {
                  _filterStatus = 'All';
                  _filterCategory = 'All';
                });
                _filterMedicines();
              },
              icon: const Icon(Iconsax.close_circle),
              label: const Text('Clear Filters'),
            ),
          ],
        ],
      ),
    );
  }

  void _showMedicineDetails(Map<String, dynamic> medicine) {
    showDialog(
      context: context,
      builder: (context) => _MedicineDetailsDialog(medicine: medicine),
    );
  }

  void _showAddMedicineDialog() {
    showDialog(
      context: context,
      builder: (context) => _AddEditMedicineDialog(
        onSave: (data) async {
          try {
            await _authService.post(PharmacyEndpoints.createMedicine(), data);
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✅ Medicine added successfully'),
                backgroundColor: Colors.green,
              ),
            );
            _loadMedicines();
          } catch (e) {
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('❌ Error: $e'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
      ),
    );
  }

  void _showEditMedicineDialog(Map<String, dynamic> medicine) {
    showDialog(
      context: context,
      builder: (context) => _AddEditMedicineDialog(
        medicine: medicine,
        onSave: (data) async {
          try {
            final id = medicine['_id'] ?? medicine['id'];
            await _authService.put(PharmacyEndpoints.updateMedicine(id), data);
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✅ Medicine updated successfully'),
                backgroundColor: Colors.green,
              ),
            );
            _loadMedicines();
          } catch (e) {
            if (!context.mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('❌ Error: $e'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
      ),
    );
  }

  void _confirmDelete(Map<String, dynamic> medicine) {
    final scaffoldContext = context;
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: Text('Are you sure you want to delete ${medicine['name']}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              try {
                final id = medicine['_id'] ?? medicine['id'];
                await _authService.delete(PharmacyEndpoints.deleteMedicine(id));
                if (!scaffoldContext.mounted) return;
                ScaffoldMessenger.of(scaffoldContext).showSnackBar(
                  const SnackBar(
                    content: Text('✅ Medicine deleted successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
                _loadMedicines();
              } catch (e) {
                if (!scaffoldContext.mounted) return;
                ScaffoldMessenger.of(scaffoldContext).showSnackBar(
                  SnackBar(
                    content: Text('❌ Error: $e'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.kDanger,
              foregroundColor: AppColors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

// Medicine Details Dialog
class _MedicineDetailsDialog extends StatelessWidget {
  final Map<String, dynamic> medicine;

  const _MedicineDetailsDialog({required this.medicine});

  @override
  Widget build(BuildContext context) {
    final name = medicine['name'] ?? 'Unknown';
    final category = medicine['category'] ?? 'N/A';
    final manufacturer = medicine['manufacturer'] ?? 'N/A';
    final sku = medicine['sku'] ?? 'N/A';
    final stock = medicine['availableQty'] ?? medicine['stock'] ?? medicine['quantity'] ?? 0;
    final reorderLevel = medicine['reorderLevel'] ?? 20;
    final salePrice = medicine['salePrice'] ?? 0;
    final form = medicine['form'] ?? 'N/A';
    final strength = medicine['strength'] ?? 'N/A';

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Iconsax.health, color: AppColors.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    name,
                    style: GoogleFonts.lexend(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.kTextPrimary,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Iconsax.close_circle),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildDetailRow('SKU', sku),
            _buildDetailRow('Category', category),
            _buildDetailRow('Manufacturer', manufacturer),
            _buildDetailRow('Form', form),
            _buildDetailRow('Strength', strength),
            _buildDetailRow('Stock', stock.toString()),
            _buildDetailRow('Reorder Level', reorderLevel.toString()),
            _buildDetailRow('Sale Price', '₹${salePrice.toStringAsFixed(2)}'),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
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
            width: 120,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.kTextSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.kTextPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Add/Edit Medicine Dialog
class _AddEditMedicineDialog extends StatefulWidget {
  final Map<String, dynamic>? medicine;
  final Function(Map<String, dynamic>) onSave;

  const _AddEditMedicineDialog({
    this.medicine,
    required this.onSave,
  });

  @override
  State<_AddEditMedicineDialog> createState() => _AddEditMedicineDialogState();
}

class _AddEditMedicineDialogState extends State<_AddEditMedicineDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _categoryController;
  late TextEditingController _manufacturerController;
  late TextEditingController _skuController;
  late TextEditingController _stockController;
  late TextEditingController _reorderController;
  late TextEditingController _priceController;
  late TextEditingController _formController;
  late TextEditingController _strengthController;

  @override
  void initState() {
    super.initState();
    final med = widget.medicine;
    _nameController = TextEditingController(text: med?['name'] ?? '');
    _categoryController = TextEditingController(text: med?['category'] ?? '');
    _manufacturerController = TextEditingController(text: med?['manufacturer'] ?? '');
    _skuController = TextEditingController(text: med?['sku'] ?? '');
    _stockController = TextEditingController(text: (med?['availableQty'] ?? med?['stock'] ?? 0).toString());
    _reorderController = TextEditingController(text: (med?['reorderLevel'] ?? 20).toString());
    _priceController = TextEditingController(text: (med?['salePrice'] ?? 0).toString());
    _formController = TextEditingController(text: med?['form'] ?? 'Tablet');
    _strengthController = TextEditingController(text: med?['strength'] ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _categoryController.dispose();
    _manufacturerController.dispose();
    _skuController.dispose();
    _stockController.dispose();
    _reorderController.dispose();
    _priceController.dispose();
    _formController.dispose();
    _strengthController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.medicine != null;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600),
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEdit ? 'Edit Medicine' : 'Add New Medicine',
                  style: GoogleFonts.lexend(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Medicine Name *',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _categoryController,
                        decoration: const InputDecoration(
                          labelText: 'Category',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _skuController,
                        decoration: const InputDecoration(
                          labelText: 'SKU',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _manufacturerController,
                  decoration: const InputDecoration(
                    labelText: 'Manufacturer',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _formController,
                        decoration: const InputDecoration(
                          labelText: 'Form',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _strengthController,
                        decoration: const InputDecoration(
                          labelText: 'Strength',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _stockController,
                        decoration: const InputDecoration(
                          labelText: 'Stock *',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _reorderController,
                        decoration: const InputDecoration(
                          labelText: 'Reorder Level',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _priceController,
                        decoration: const InputDecoration(
                          labelText: 'Sale Price',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () {
                        if (_formKey.currentState!.validate()) {
                          final data = {
                            'name': _nameController.text,
                            'category': _categoryController.text,
                            'manufacturer': _manufacturerController.text,
                            'sku': _skuController.text,
                            'stock': int.tryParse(_stockController.text) ?? 0,
                            'reorderLevel': int.tryParse(_reorderController.text) ?? 20,
                            'salePrice': double.tryParse(_priceController.text) ?? 0,
                            'form': _formController.text,
                            'strength': _strengthController.text,
                          };
                          Navigator.pop(context);
                          widget.onSave(data);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                      ),
                      child: Text(isEdit ? 'Update' : 'Add'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
