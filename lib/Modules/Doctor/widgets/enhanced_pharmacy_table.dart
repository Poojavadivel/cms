// lib/Modules/Doctor/widgets/enhanced_pharmacy_table.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../../Utils/Colors.dart';
import '../../../Services/Authservices.dart';

class EnhancedPharmacyTable extends StatefulWidget {
  final List<Map<String, dynamic>> pharmacyRows;
  final Function(List<Map<String, dynamic>>) onRowsChanged;

  const EnhancedPharmacyTable({
    super.key,
    required this.pharmacyRows,
    required this.onRowsChanged,
  });

  @override
  State<EnhancedPharmacyTable> createState() => EnhancedPharmacyTableState();
}

class EnhancedPharmacyTableState extends State<EnhancedPharmacyTable> {
  final AuthService _authService = AuthService.instance;
  List<Map<String, dynamic>> _medicines = [];
  bool _loadingMedicines = false;

  @override
  void initState() {
    super.initState();
    _loadMedicines();
  }

  Future<void> _loadMedicines() async {
    setState(() => _loadingMedicines = true);
    try {
      final medicines = await _authService.fetchMedicines(limit: 100);
      if (mounted) {
        setState(() {
          _medicines = medicines.map((m) => Map<String, dynamic>.from(m)).toList();
          _loadingMedicines = false;
        });
        // Debug: Check if salePrice is present
        if (_medicines.isNotEmpty) {
          print('🔍 Sample medicine data: ${_medicines.first}');
          print('💰 Has salePrice? ${_medicines.first.containsKey('salePrice')} = ${_medicines.first['salePrice']}');
        }
      }
    } catch (e) {
      print('Error loading medicines: $e');
      if (mounted) {
        setState(() => _loadingMedicines = false);
      }
    }
  }

  double _calculateRowTotal(Map<String, dynamic> row) {
    final quantity = int.tryParse(row['quantity']?.toString() ?? '1') ?? 1;
    final price = double.tryParse(row['price']?.toString() ?? '0') ?? 0.0;
    return quantity * price;
  }

  double _calculateGrandTotal() {
    return widget.pharmacyRows.fold(0.0, (sum, row) => sum + _calculateRowTotal(row));
  }

  List<Map<String, dynamic>> getStockWarnings() {
    final warnings = <Map<String, dynamic>>[];
    for (final row in widget.pharmacyRows) {
      final medicineName = row['Medicine'] ?? 'Unknown';
      final availableStock = row['availableStock'] ?? 0;
      final quantity = int.tryParse(row['quantity']?.toString() ?? '1') ?? 1;
      
      if (availableStock == 0) {
        warnings.add({
          'medicine': medicineName,
          'type': 'OUT_OF_STOCK',
          'message': '$medicineName is out of stock',
        });
      } else if (quantity > availableStock) {
        warnings.add({
          'medicine': medicineName,
          'type': 'INSUFFICIENT',
          'message': '$medicineName: Only $availableStock units available, but $quantity requested',
        });
      }
    }
    return warnings;
  }

  void _addRow() {
    final newRows = List<Map<String, dynamic>>.from(widget.pharmacyRows);
    newRows.add({
      'medicineId': null,
      'Medicine': '',
      'Dosage': '',
      'Frequency': '',
      'quantity': '1',
      'price': '0',
      'total': '0',
      'Notes': '',
    });
    widget.onRowsChanged(newRows);
  }

  void _deleteRow(int index) {
    final newRows = List<Map<String, dynamic>>.from(widget.pharmacyRows);
    newRows.removeAt(index);
    widget.onRowsChanged(newRows);
  }

  void _updateRow(int index, Map<String, dynamic> updates) {
    final newRows = List<Map<String, dynamic>>.from(widget.pharmacyRows);
    newRows[index] = {...newRows[index], ...updates};
    
    // Auto-calculate total
    final quantity = int.tryParse(newRows[index]['quantity']?.toString() ?? '1') ?? 1;
    final price = double.tryParse(newRows[index]['price']?.toString() ?? '0') ?? 0.0;
    newRows[index]['total'] = (quantity * price).toStringAsFixed(2);
    
    widget.onRowsChanged(newRows);
  }

  int _getMedicineStock(Map<String, dynamic> medicine) {
    // Get available quantity from medicine or calculate from batches
    final availableQty = medicine['availableQty'] ?? medicine['stock'] ?? 0;
    if (availableQty is int) return availableQty;
    if (availableQty is String) return int.tryParse(availableQty) ?? 0;
    return 0;
  }

  Color _getStockColor(int stock) {
    if (stock == 0) return AppColors.kDanger;
    if (stock <= 10) return AppColors.kWarning;
    return AppColors.kSuccess;
  }

  String _getStockLabel(int stock) {
    if (stock == 0) return 'OUT OF STOCK';
    if (stock <= 10) return 'LOW STOCK';
    return 'IN STOCK';
  }

  void _selectMedicine(int rowIndex, Map<String, dynamic> medicine) {
    final salePrice = double.tryParse(medicine['salePrice']?.toString() ?? '0') ?? 0.0;
    final stock = _getMedicineStock(medicine);
    
    _updateRow(rowIndex, {
      'medicineId': medicine['_id'],
      'Medicine': medicine['name'],
      'price': salePrice.toStringAsFixed(2),
      'availableStock': stock,
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingMedicines) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Table
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.kMuted),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(8),
                    topRight: Radius.circular(8),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(flex: 3, child: _buildHeaderText('Medicine')),
                    Expanded(flex: 2, child: _buildHeaderText('Dosage')),
                    Expanded(flex: 2, child: _buildHeaderText('Frequency')),
                    Expanded(flex: 1, child: _buildHeaderText('Qty', centered: true)),
                    Expanded(flex: 2, child: _buildHeaderText('Price (₹)', centered: true)),
                    Expanded(flex: 2, child: _buildHeaderText('Total (₹)', centered: true)),
                    Expanded(flex: 2, child: _buildHeaderText('Notes')),
                    const SizedBox(width: 40), // Actions column
                  ],
                ),
              ),
              
              // Rows
              if (widget.pharmacyRows.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Center(
                    child: Text(
                      'No medicines added yet',
                      style: GoogleFonts.inter(color: AppColors.kTextSecondary),
                    ),
                  ),
                )
              else
                ...widget.pharmacyRows.asMap().entries.map((entry) {
                  final index = entry.key;
                  final row = entry.value;
                  return _buildRow(index, row);
                }).toList(),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Footer with Add button and Total
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            ElevatedButton.icon(
              onPressed: _addRow,
              icon: const Icon(Iconsax.add, size: 18),
              label: const Text('Add Medicine'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
            
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.kSuccess.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.kSuccess),
              ),
              child: Row(
                children: [
                  Icon(Iconsax.money, color: AppColors.kSuccess, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Grand Total:',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.kTextPrimary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '₹${_calculateGrandTotal().toStringAsFixed(2)}',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.kSuccess,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
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

  Widget _buildRow(int index, Map<String, dynamic> row) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.kMuted.withOpacity(0.5)),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Medicine (Dropdown)
          Expanded(
            flex: 3,
            child: Autocomplete<Map<String, dynamic>>(
              optionsBuilder: (textEditingValue) {
                if (textEditingValue.text.isEmpty) {
                  return const Iterable<Map<String, dynamic>>.empty();
                }
                return _medicines.where((medicine) {
                  final name = medicine['name']?.toString().toLowerCase() ?? '';
                  final sku = medicine['sku']?.toString().toLowerCase() ?? '';
                  final search = textEditingValue.text.toLowerCase();
                  return name.contains(search) || sku.contains(search);
                });
              },
              displayStringForOption: (medicine) => medicine['name'] ?? '',
              onSelected: (medicine) => _selectMedicine(index, medicine),
              fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                if (row['Medicine']?.isNotEmpty == true && controller.text.isEmpty) {
                  controller.text = row['Medicine'];
                }
                return TextField(
                  controller: controller,
                  focusNode: focusNode,
                  decoration: InputDecoration(
                    hintText: 'Search medicine...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    isDense: true,
                  ),
                  style: const TextStyle(fontSize: 13),
                );
              },
              optionsViewBuilder: (context, onSelected, options) {
                return Align(
                  alignment: Alignment.topLeft,
                  child: Material(
                    elevation: 8,
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.white,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 2),
                      ),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 300, maxWidth: 450),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Header
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(10),
                                  topRight: Radius.circular(10),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(Iconsax.health, size: 20, color: AppColors.primary),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Select Medicine (${options.length} found)',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.kTextPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Divider(height: 1),
                            // List
                            Flexible(
                              child: ListView.builder(
                                padding: EdgeInsets.zero,
                                itemCount: options.length,
                                shrinkWrap: true,
                                itemBuilder: (context, index) {
                                  final medicine = options.elementAt(index);
                                  final stock = _getMedicineStock(medicine);
                                  final stockColor = _getStockColor(stock);
                                  final stockLabel = _getStockLabel(stock);
                                  final price = medicine['salePrice'] ?? '0';
                                  
                                  return InkWell(
                                    onTap: stock > 0 ? () => onSelected(medicine) : null,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      decoration: BoxDecoration(
                                        color: stock == 0 ? Colors.grey.shade100 : Colors.transparent,
                                        border: Border(
                                          bottom: BorderSide(color: AppColors.kMuted.withOpacity(0.3)),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          // Medicine Icon
                                          Container(
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(
                                              color: stockColor.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Icon(
                                              Iconsax.health,
                                              color: stockColor,
                                              size: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          
                                          // Medicine Details
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  medicine['name'] ?? 'Unknown',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w600,
                                                    color: stock == 0 ? AppColors.kTextSecondary : AppColors.kTextPrimary,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Row(
                                                  children: [
                                                    Text(
                                                      'SKU: ${medicine['sku'] ?? 'N/A'}',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        color: AppColors.kTextSecondary,
                                                      ),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Text(
                                                      '•',
                                                      style: TextStyle(color: AppColors.kTextSecondary),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Icon(Iconsax.money, size: 12, color: AppColors.kInfo),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      '₹$price',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        fontWeight: FontWeight.w600,
                                                        color: AppColors.kInfo,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          
                                          // Stock Badge
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: stockColor.withOpacity(0.1),
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(color: stockColor.withOpacity(0.3)),
                                                ),
                                                child: Text(
                                                  stockLabel,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                    color: stockColor,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '$stock units',
                                                style: GoogleFonts.inter(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                  color: stockColor,
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
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: 8),
          
          // Dosage
          Expanded(
            flex: 2,
            child: TextField(
              controller: TextEditingController(text: row['Dosage'] ?? ''),
              onChanged: (v) => _updateRow(index, {'Dosage': v}),
              decoration: InputDecoration(
                hintText: '500mg',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 13),
            ),
          ),
          const SizedBox(width: 8),
          
          // Frequency
          Expanded(
            flex: 2,
            child: TextField(
              controller: TextEditingController(text: row['Frequency'] ?? ''),
              onChanged: (v) => _updateRow(index, {'Frequency': v}),
              decoration: InputDecoration(
                hintText: '2x daily',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 13),
            ),
          ),
          const SizedBox(width: 8),
          
          // Quantity
          Expanded(
            flex: 1,
            child: TextField(
              controller: TextEditingController(text: row['quantity'] ?? '1'),
              onChanged: (v) => _updateRow(index, {'quantity': v}),
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 13),
            ),
          ),
          const SizedBox(width: 8),
          
          // Price
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.kInfo.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.kInfo.withOpacity(0.3)),
              ),
              child: Text(
                '₹${row['price'] ?? '0'}',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kInfo,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          const SizedBox(width: 8),
          
          // Total
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.kSuccess.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.kSuccess.withOpacity(0.3)),
              ),
              child: Text(
                '₹${_calculateRowTotal(row).toStringAsFixed(2)}',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kSuccess,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          const SizedBox(width: 8),
          
          // Notes
          Expanded(
            flex: 2,
            child: TextField(
              controller: TextEditingController(text: row['Notes'] ?? ''),
              onChanged: (v) => _updateRow(index, {'Notes': v}),
              decoration: InputDecoration(
                hintText: 'After meals',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 13),
            ),
          ),
          const SizedBox(width: 8),
          
          // Delete button
          IconButton(
            icon: Icon(Iconsax.trash, size: 18, color: AppColors.kDanger),
            onPressed: () => _deleteRow(index),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
            tooltip: 'Delete',
          ),
        ],
      ),
    );
  }
}
