// lib/Modules/Pharmacist/medicines_page_enterprise.dart
// Enterprise-grade Medicine Inventory Management

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../../Services/Authservices.dart';
import '../../Services/api_constants.dart';
import '../../Utils/Colors.dart';

class PharmacistMedicinesPageEnterprise extends StatefulWidget {
  const PharmacistMedicinesPageEnterprise({super.key});

  @override
  State<PharmacistMedicinesPageEnterprise> createState() => _PharmacistMedicinesPageEnterpriseState();
}

class _PharmacistMedicinesPageEnterpriseState extends State<PharmacistMedicinesPageEnterprise> {
  final _searchController = TextEditingController();
  final AuthService _authService = AuthService.instance;
  
  List<Map<String, dynamic>> _medicines = [];
  List<Map<String, dynamic>> _filteredMedicines = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _filterStatus = 'All'; // All, In Stock, Low Stock, Out of Stock
  int _currentPage = 0;
  final int _itemsPerPage = 10;

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
      print('🔄 [Pharmacist Enterprise] Loading medicines...');
      final medicines = await _authService.fetchMedicines(limit: 100);
      print('✅ [Pharmacist Enterprise] Received ${medicines.length} medicines');
      
      // Normalize the data to ensure consistent field names
      final normalizedMedicines = medicines.map((med) {
        try {
          final stock = _toInt(med['availableQty'] ?? med['stock'] ?? med['quantity'] ?? 0);
          return {
            '_id': med['_id'] ?? '',
            'name': med['name'] ?? 'Unknown',
            'sku': med['sku'] ?? '',
            'category': med['category'] ?? '',
            'manufacturer': med['manufacturer'] ?? '',
            'status': med['status'] ?? 'In Stock',
            'form': med['form'] ?? 'Tablet',
            'strength': med['strength'] ?? '',
            'unit': med['unit'] ?? 'pcs',
            'reorderLevel': _toInt(med['reorderLevel'] ?? 20),
            'stock': stock, // Keep 'stock' for backward compatibility
            'availableQty': stock, // Also set 'availableQty'
            'quantity': stock, // Also set 'quantity'
          };
        } catch (e) {
          print('⚠️ [Pharmacist Enterprise] Error normalizing medicine: $e');
          print('Medicine data: $med');
          rethrow;
        }
      }).toList();
      
      if (mounted) {
        setState(() {
          _medicines = normalizedMedicines;
          _filteredMedicines = List.from(_medicines);
          _isLoading = false;
        });
      }
    } catch (e, stackTrace) {
      print('❌ [Pharmacist Enterprise] Error loading medicines: $e');
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

  void _filterMedicines() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredMedicines = _medicines.where((med) {
        final name = (med['name'] ?? '').toString().toLowerCase();
        final sku = (med['sku'] ?? '').toString().toLowerCase();
        final category = (med['category'] ?? '').toString().toLowerCase();
        final manufacturer = (med['manufacturer'] ?? '').toString().toLowerCase();
        
        final matchesSearch = query.isEmpty || 
          name.contains(query) || 
          sku.contains(query) ||
          category.contains(query) ||
          manufacturer.contains(query);
        
        final stock = _toInt(med['availableQty'] ?? med['stock'] ?? med['quantity'] ?? 0);
        final reorderLevel = _toInt(med['reorderLevel'] ?? 20);
        
        final matchesStatus = _filterStatus == 'All' ||
          (_filterStatus == 'In Stock' && stock > reorderLevel) ||
          (_filterStatus == 'Low Stock' && stock > 0 && stock <= reorderLevel) ||
          (_filterStatus == 'Out of Stock' && stock <= 0);
        
        return matchesSearch && matchesStatus;
      }).toList();
      _currentPage = 0;
    });
  }

  Future<void> _showAddEditDialog({Map<String, dynamic>? medicine}) async {
    final isEdit = medicine != null;
    final nameCtrl = TextEditingController(text: medicine?['name'] ?? '');
    final categoryCtrl = TextEditingController(text: medicine?['category'] ?? '');
    final manufacturerCtrl = TextEditingController(text: medicine?['manufacturer'] ?? '');
    final stockCtrl = TextEditingController(text: (medicine?['stock'] ?? medicine?['quantity'] ?? '').toString());
    final priceCtrl = TextEditingController(text: (medicine?['price'] ?? '').toString());
    final batchCtrl = TextEditingController(text: medicine?['batchNumber'] ?? '');
    final supplierCtrl = TextEditingController(text: medicine?['supplier'] ?? '');
    final descriptionCtrl = TextEditingController(text: medicine?['description'] ?? '');
    DateTime? expiryDate = medicine?['expiryDate'] != null ? DateTime.tryParse(medicine!['expiryDate']) : null;
    
    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Container(
            width: 600,
            constraints: const BoxConstraints(maxHeight: 700),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primary600],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(51),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Iconsax.health, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          isEdit ? 'Edit Medicine' : 'Add New Medicine',
                          style: GoogleFonts.poppins(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                
                // Form
                Expanded(
                  child: Form(
                    key: formKey,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Basic Information'),
                          const SizedBox(height: 16),
                          _buildTextField(
                            controller: nameCtrl,
                            label: 'Medicine Name',
                            hint: 'e.g., Paracetamol 500mg',
                            icon: Iconsax.health,
                            validator: (v) => v!.trim().isEmpty ? 'Required' : null,
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: _buildTextField(
                                  controller: categoryCtrl,
                                  label: 'Category',
                                  hint: 'e.g., Analgesics',
                                  icon: Iconsax.category,
                                  validator: (v) => v!.trim().isEmpty ? 'Required' : null,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: _buildTextField(
                                  controller: manufacturerCtrl,
                                  label: 'Manufacturer',
                                  hint: 'e.g., Cipla Ltd',
                                  icon: Iconsax.building,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          
                          _buildSectionTitle('Stock & Pricing'),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: _buildTextField(
                                  controller: stockCtrl,
                                  label: 'Stock Quantity',
                                  hint: 'e.g., 100',
                                  icon: Iconsax.box,
                                  keyboardType: TextInputType.number,
                                  validator: (v) {
                                    if (v!.trim().isEmpty) return 'Required';
                                    if (int.tryParse(v) == null) return 'Invalid number';
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: _buildTextField(
                                  controller: priceCtrl,
                                  label: 'Price (₹)',
                                  hint: 'e.g., 25.50',
                                  icon: Iconsax.dollar_circle,
                                  keyboardType: TextInputType.number,
                                  validator: (v) {
                                    if (v!.trim().isEmpty) return 'Required';
                                    if (double.tryParse(v) == null) return 'Invalid price';
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          
                          _buildSectionTitle('Batch Details'),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: _buildTextField(
                                  controller: batchCtrl,
                                  label: 'Batch Number',
                                  hint: 'e.g., BATCH2025001',
                                  icon: Iconsax.barcode,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: InkWell(
                                  onTap: () async {
                                    final date = await showDatePicker(
                                      context: context,
                                      initialDate: expiryDate ?? DateTime.now().add(const Duration(days: 365)),
                                      firstDate: DateTime.now(),
                                      lastDate: DateTime.now().add(const Duration(days: 3650)),
                                    );
                                    if (date != null) {
                                      setDialogState(() => expiryDate = date);
                                    }
                                  },
                                  child: InputDecorator(
                                    decoration: InputDecoration(
                                      labelText: 'Expiry Date',
                                      labelStyle: GoogleFonts.inter(fontSize: 14),
                                      prefixIcon: Icon(Iconsax.calendar, color: AppColors.primary),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                      filled: true,
                                      fillColor: AppColors.grey50,
                                    ),
                                    child: Text(
                                      expiryDate != null
                                          ? DateFormat('dd MMM yyyy').format(expiryDate!)
                                          : 'Select date',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: expiryDate != null ? AppColors.kTextPrimary : AppColors.kTextSecondary,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildTextField(
                            controller: supplierCtrl,
                            label: 'Supplier',
                            hint: 'Supplier name',
                            icon: Iconsax.truck,
                          ),
                          const SizedBox(height: 16),
                          _buildTextField(
                            controller: descriptionCtrl,
                            label: 'Description',
                            hint: 'Medicine description, usage, etc.',
                            icon: Iconsax.note_text,
                            maxLines: 3,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Actions
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.grey50,
                    border: Border(top: BorderSide(color: AppColors.grey200)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                        child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () async {
                          if (!formKey.currentState!.validate()) return;
                          
                          final medicineData = {
                            'name': nameCtrl.text.trim(),
                            'category': categoryCtrl.text.trim(),
                            'manufacturer': manufacturerCtrl.text.trim(),
                            'stock': int.parse(stockCtrl.text.trim()),
                            'price': double.parse(priceCtrl.text.trim()),
                            'batchNumber': batchCtrl.text.trim(),
                            'supplier': supplierCtrl.text.trim(),
                            'description': descriptionCtrl.text.trim(),
                            'expiryDate': expiryDate?.toIso8601String(),
                          };
                          
                          try {
                            if (isEdit) {
                              await _authService.put(PharmacyEndpoints.updateMedicine(medicine['_id']), medicineData);
                            } else {
                              await _authService.post(PharmacyEndpoints.createMedicine(), medicineData);
                            }
                            
                            Navigator.pop(context);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(isEdit ? 'Medicine updated successfully' : 'Medicine added successfully'),
                                  backgroundColor: AppColors.kSuccess,
                                ),
                              );
                              _loadMedicines();
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Error: $e'),
                                  backgroundColor: AppColors.kDanger,
                                ),
                              );
                            }
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(isEdit ? 'Update' : 'Add Medicine', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.kTextPrimary,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: GoogleFonts.inter(fontSize: 14),
        hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.kTextSecondary),
        prefixIcon: Icon(icon, color: AppColors.primary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.grey200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.primary, width: 2),
        ),
        filled: true,
        fillColor: AppColors.grey50,
      ),
    );
  }

  Widget _buildStockBadge(int stock, {int reorderLevel = 20}) {
    Color color;
    IconData icon;
    
    if (stock <= 0) {
      color = AppColors.kDanger;
      icon = Iconsax.close_circle;
    } else if (stock <= reorderLevel) {
      color = AppColors.kWarning;
      icon = Iconsax.warning_2;
    } else {
      color = AppColors.kSuccess;
      icon = Iconsax.tick_circle;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(102)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            '$stock units',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final startIdx = _currentPage * _itemsPerPage;
    final endIdx = (startIdx + _itemsPerPage).clamp(0, _filteredMedicines.length);
    final paginatedMedicines = startIdx >= _filteredMedicines.length
        ? <Map<String, dynamic>>[]
        : _filteredMedicines.sublist(startIdx, endIdx);

    return Container(
      color: AppColors.background,
      child: Column(
        children: [
          // Header & Search
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(13),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Iconsax.health, color: AppColors.primary, size: 28),
                    const SizedBox(width: 12),
                    Text(
                      'Medicine Inventory',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: AppColors.kTextPrimary,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Iconsax.refresh),
                      onPressed: _loadMedicines,
                      tooltip: 'Refresh',
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.grey50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.grey200),
                        ),
                        child: TextField(
                          controller: _searchController,
                          style: GoogleFonts.inter(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Search by name, category, or manufacturer...',
                            hintStyle: GoogleFonts.inter(color: AppColors.kTextSecondary),
                            prefixIcon: Icon(Iconsax.search_normal, color: AppColors.kTextSecondary),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    PopupMenuButton<String>(
                      icon: Container(
                        height: 56,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        decoration: BoxDecoration(
                          color: AppColors.grey50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.grey200),
                        ),
                        child: Row(
                          children: [
                            Icon(Iconsax.filter, color: AppColors.kTextSecondary),
                            const SizedBox(width: 8),
                            Text(
                              _filterStatus,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppColors.kTextPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      onSelected: (value) {
                        setState(() => _filterStatus = value);
                        _filterMedicines();
                      },
                      itemBuilder: (context) => [
                        'All',
                        'In Stock',
                        'Low Stock',
                        'Out of Stock',
                      ].map((status) {
                        return PopupMenuItem(
                          value: status,
                          child: Text(status, style: GoogleFonts.inter()),
                        );
                      }).toList(),
                    ),
                    const SizedBox(width: 16),
                    ElevatedButton.icon(
                      onPressed: () => _showAddEditDialog(),
                      icon: const Icon(Iconsax.add, size: 20),
                      label: Text('Add Medicine', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Table
          Expanded(
            child: _isLoading
                ? _buildShimmerLoading()
                : _errorMessage != null
                    ? _buildError()
                    : _filteredMedicines.isEmpty
                        ? _buildEmpty()
                        : _buildTable(paginatedMedicines),
          ),

          // Pagination
          if (_filteredMedicines.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.grey200)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Showing ${startIdx + 1}-$endIdx of ${_filteredMedicines.length} medicines',
                    style: GoogleFonts.inter(color: AppColors.kTextSecondary),
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Iconsax.arrow_left_2),
                        onPressed: _currentPage > 0
                            ? () => setState(() => _currentPage--)
                            : null,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Page ${_currentPage + 1} of ${(_filteredMedicines.length / _itemsPerPage).ceil()}',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Iconsax.arrow_right_3),
                        onPressed: endIdx < _filteredMedicines.length
                            ? () => setState(() => _currentPage++)
                            : null,
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTable(List<Map<String, dynamic>> medicines) {
    return Container(
      margin: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.grey50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text('MEDICINE NAME', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.kTextSecondary, letterSpacing: 0.5)),
                ),
                Expanded(
                  flex: 2,
                  child: Text('CATEGORY', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.kTextSecondary, letterSpacing: 0.5)),
                ),
                Expanded(
                  flex: 2,
                  child: Text('STOCK STATUS', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.kTextSecondary, letterSpacing: 0.5)),
                ),
                Expanded(
                  flex: 1,
                  child: Text('PRICE', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.kTextSecondary, letterSpacing: 0.5)),
                ),
                Expanded(
                  flex: 2,
                  child: Text('EXPIRY', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.kTextSecondary, letterSpacing: 0.5)),
                ),
                const SizedBox(width: 100),
              ],
            ),
          ),
          
          // Table Rows
          Expanded(
            child: ListView.builder(
              itemCount: medicines.length,
              itemBuilder: (context, index) {
                final med = medicines[index];
                final stock = _toInt(med['availableQty'] ?? med['stock'] ?? med['quantity'] ?? 0);
                final reorderLevel = _toInt(med['reorderLevel'] ?? 20);
                final expiryDate = med['expiryDate'] != null ? DateTime.tryParse(med['expiryDate']) : null;
                final isExpiringSoon = expiryDate != null && expiryDate.difference(DateTime.now()).inDays < 30;
                
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(
                    color: index.isEven ? Colors.white : AppColors.grey50.withAlpha(128),
                    border: Border(bottom: BorderSide(color: AppColors.grey200.withAlpha(128))),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
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
                            if (med['manufacturer'] != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                med['manufacturer'],
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: AppColors.kTextSecondary,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          med['category'] ?? '-',
                          style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: _buildStockBadge(stock, reorderLevel: reorderLevel),
                      ),
                      Expanded(
                        flex: 1,
                        child: Text(
                          '₹${(med['price'] ?? 0).toStringAsFixed(2)}',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: expiryDate != null
                            ? Row(
                                children: [
                                  if (isExpiringSoon)
                                    Icon(Iconsax.warning_2, size: 16, color: AppColors.kDanger),
                                  if (isExpiringSoon) const SizedBox(width: 6),
                                  Text(
                                    DateFormat('dd MMM yyyy').format(expiryDate),
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      color: isExpiringSoon ? AppColors.kDanger : AppColors.kTextPrimary,
                                      fontWeight: isExpiringSoon ? FontWeight.w600 : FontWeight.w400,
                                    ),
                                  ),
                                ],
                              )
                            : Text('-', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary)),
                      ),
                      SizedBox(
                        width: 100,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            IconButton(
                              icon: Icon(Iconsax.edit, size: 18, color: AppColors.primary),
                              onPressed: () => _showAddEditDialog(medicine: med),
                              tooltip: 'Edit',
                            ),
                            IconButton(
                              icon: Icon(Iconsax.trash, size: 18, color: AppColors.kDanger),
                              onPressed: () async {
                                final confirm = await showDialog<bool>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: Text('Delete Medicine', style: GoogleFonts.poppins()),
                                    content: Text('Are you sure you want to delete ${med['name']}?', style: GoogleFonts.inter()),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context, false),
                                        child: Text('Cancel'),
                                      ),
                                      ElevatedButton(
                                        onPressed: () => Navigator.pop(context, true),
                                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.kDanger),
                                        child: Text('Delete'),
                                      ),
                                    ],
                                  ),
                                );
                                
                                if (confirm == true) {
                                  try {
                                    await _authService.delete(PharmacyEndpoints.deleteMedicine(med['_id']));
                                    if (mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Medicine deleted'), backgroundColor: AppColors.kSuccess),
                                      );
                                    }
                                    _loadMedicines();
                                  } catch (e) {
                                    if (mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.kDanger),
                                      );
                                    }
                                  }
                                }
                              },
                              tooltip: 'Delete',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: AppColors.grey200,
      highlightColor: AppColors.grey100,
      child: ListView.builder(
        padding: const EdgeInsets.all(24),
        itemCount: 10,
        itemBuilder: (context, index) => Container(
          height: 60,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.close_circle, size: 64, color: AppColors.kDanger),
          const SizedBox(height: 16),
          Text(
            'Error Loading Medicines',
            style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage ?? 'Unknown error',
            style: GoogleFonts.inter(color: AppColors.kTextSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadMedicines,
            icon: const Icon(Iconsax.refresh),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.health, size: 64, color: AppColors.grey300),
          const SizedBox(height: 16),
          Text(
            'No Medicines Found',
            style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'Add your first medicine to get started',
            style: GoogleFonts.inter(color: AppColors.kTextSecondary),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _showAddEditDialog(),
            icon: const Icon(Iconsax.add),
            label: const Text('Add Medicine'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
