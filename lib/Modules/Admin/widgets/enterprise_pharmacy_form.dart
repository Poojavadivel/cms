// lib/Modules/Admin/widgets/enterprise_pharmacy_form.dart
// Enterprise-grade Medicine Form with validation

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../../Services/Authservices.dart';
import '../../../Utils/Colors.dart';

class EnterprisePharmacyForm extends StatefulWidget {
  final Map<String, dynamic>? medicine;

  const EnterprisePharmacyForm({super.key, this.medicine});

  @override
  State<EnterprisePharmacyForm> createState() => _EnterprisePharmacyFormState();
}

class _EnterprisePharmacyFormState extends State<EnterprisePharmacyForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _skuCtrl;
  late final TextEditingController _nameCtrl;
  late final TextEditingController _brandCtrl;
  late final TextEditingController _categoryCtrl;
  late final TextEditingController _stockCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _costPriceCtrl;
  late final TextEditingController _expiryCtrl;
  late final TextEditingController _batchCtrl;
  late final TextEditingController _descriptionCtrl;
  late final TextEditingController _manufacturerCtrl;
  late final TextEditingController _dosageCtrl;
  late final TextEditingController _minStockCtrl;

  String _status = 'In Stock';
  bool _requiresPrescription = false;
  bool _isSaving = false;

  final List<String> _statusOptions = [
    'In Stock',
    'Low Stock',
    'Out of Stock',
    'Discontinued',
  ];

  final List<String> _categoryOptions = [
    'Antibiotics',
    'Pain Relief',
    'Diabetes',
    'Cardiovascular',
    'Respiratory',
    'Gastrointestinal',
    'Dermatology',
    'Vitamins & Supplements',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    final medicine = widget.medicine;

    _skuCtrl = TextEditingController(text: medicine?['id'] ?? medicine?['_id'] ?? '');
    _nameCtrl = TextEditingController(text: medicine?['name'] ?? '');
    _brandCtrl = TextEditingController(text: medicine?['brand'] ?? medicine?['manufacturer'] ?? '');
    _categoryCtrl = TextEditingController(text: medicine?['category'] ?? 'Other');
    _stockCtrl = TextEditingController(
      text: (medicine?['stock'] ?? medicine?['availableQty'] ?? 0).toString(),
    );
    _priceCtrl = TextEditingController(
      text: (medicine?['salePrice'] ?? medicine?['price'] ?? 0.0).toString(),
    );
    _costPriceCtrl = TextEditingController(
      text: (medicine?['costPrice'] ?? 0.0).toString(),
    );
    _expiryCtrl = TextEditingController(text: medicine?['expiryDate'] ?? '');
    _batchCtrl = TextEditingController(text: medicine?['batchNumber'] ?? '');
    _descriptionCtrl = TextEditingController(text: medicine?['description'] ?? '');
    _manufacturerCtrl = TextEditingController(text: medicine?['manufacturer'] ?? '');
    _dosageCtrl = TextEditingController(text: medicine?['dosage'] ?? '');
    _minStockCtrl = TextEditingController(
      text: (medicine?['minStockLevel'] ?? 10).toString(),
    );

    _status = medicine?['status'] ?? 'In Stock';
    _requiresPrescription = medicine?['requiresPrescription'] ?? false;
  }

  @override
  void dispose() {
    _skuCtrl.dispose();
    _nameCtrl.dispose();
    _brandCtrl.dispose();
    _categoryCtrl.dispose();
    _stockCtrl.dispose();
    _priceCtrl.dispose();
    _costPriceCtrl.dispose();
    _expiryCtrl.dispose();
    _batchCtrl.dispose();
    _descriptionCtrl.dispose();
    _manufacturerCtrl.dispose();
    _dosageCtrl.dispose();
    _minStockCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final isEdit = widget.medicine != null;
    final payload = {
      'name': _nameCtrl.text.trim(),
      'brand': _brandCtrl.text.trim(),
      'category': _categoryCtrl.text.trim(),
      'stock': int.tryParse(_stockCtrl.text.trim()) ?? 0,
      'salePrice': double.tryParse(_priceCtrl.text.trim()) ?? 0.0,
      'costPrice': double.tryParse(_costPriceCtrl.text.trim()) ?? 0.0,
      'status': _status,
      'requiresPrescription': _requiresPrescription,
      'expiryDate': _expiryCtrl.text.trim(),
      'batchNumber': _batchCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim(),
      'manufacturer': _manufacturerCtrl.text.trim(),
      'dosage': _dosageCtrl.text.trim(),
      'minStockLevel': int.tryParse(_minStockCtrl.text.trim()) ?? 10,
    };

    if (!isEdit) {
      payload['sku'] = _skuCtrl.text.trim();
    }

    try {
      if (isEdit) {
        final id = widget.medicine!['id'] ?? widget.medicine!['_id'];
        debugPrint('🔄 Updating medicine: $id with payload: $payload');
        final success = await AuthService.instance.updateMedicine(id, payload);
        debugPrint('✅ Update result: $success');
        if (success && mounted) {
          // Return the complete updated medicine data
          final updatedMedicine = {
            ...widget.medicine!,
            ...payload,
            'id': id,
            '_id': id,
          };
          debugPrint('🎉 Returning updated medicine: $updatedMedicine');
          Navigator.of(context).pop(updatedMedicine);
        } else {
          throw Exception('Update failed');
        }
      } else {
        final created = await AuthService.instance.createMedicine(payload);
        debugPrint('✅ Created medicine: $created');
        if (created != null && mounted) {
          Navigator.of(context).pop(created);
        } else {
          throw Exception('Create failed');
        }
      }
    } catch (e) {
      debugPrint('❌ Error saving medicine: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  InputDecoration _buildInputDecoration({
    required String label,
    required IconData icon,
    String? hint,
    String? helperText,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      helperText: helperText,
      helperStyle: GoogleFonts.inter(fontSize: 11, color: AppColors.kTextSecondary),
      prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      filled: true,
      fillColor: AppColors.grey50,
      labelStyle: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.kTextSecondary,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.grey200, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.kDanger, width: 1.5),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.kDanger, width: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.medicine != null;
    final width = MediaQuery.of(context).size.width;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: width * 0.6,
        constraints: const BoxConstraints(maxWidth: 900, maxHeight: 800),
        child: Column(
          children: [
            _buildHeader(isEdit),
            Expanded(
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionHeader('Basic Information'),
                      const SizedBox(height: 16),
                      _buildTwoColumnRow(
                        _buildTextField(
                          controller: _skuCtrl,
                          label: 'SKU / Product Code',
                          icon: Iconsax.barcode,
                          enabled: !isEdit,
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'SKU is required'
                              : null,
                        ),
                        _buildTextField(
                          controller: _nameCtrl,
                          label: 'Medicine Name',
                          icon: Iconsax.health,
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Name is required'
                              : null,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildTwoColumnRow(
                        _buildTextField(
                          controller: _brandCtrl,
                          label: 'Brand',
                          icon: Iconsax.tag,
                        ),
                        _buildDropdown(
                          value: _categoryCtrl.text,
                          label: 'Category',
                          icon: Iconsax.category,
                          items: _categoryOptions,
                          onChanged: (v) => setState(() => _categoryCtrl.text = v!),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _manufacturerCtrl,
                        label: 'Manufacturer',
                        icon: Iconsax.building,
                      ),
                      const SizedBox(height: 24),
                      _buildSectionHeader('Inventory & Pricing'),
                      const SizedBox(height: 16),
                      _buildTwoColumnRow(
                        _buildTextField(
                          controller: _stockCtrl,
                          label: 'Stock Quantity',
                          icon: Iconsax.box,
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Stock is required';
                            }
                            if (int.tryParse(v) == null) {
                              return 'Enter valid number';
                            }
                            return null;
                          },
                        ),
                        _buildTextField(
                          controller: _minStockCtrl,
                          label: 'Minimum Stock Level',
                          icon: Iconsax.warning_2,
                          keyboardType: TextInputType.number,
                          helperText: 'Alert when stock falls below this',
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildTwoColumnRow(
                        _buildTextField(
                          controller: _costPriceCtrl,
                          label: 'Cost Price',
                          icon: Iconsax.money,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          prefix: '₹',
                        ),
                        _buildTextField(
                          controller: _priceCtrl,
                          label: 'Sale Price',
                          icon: Iconsax.wallet,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          prefix: '₹',
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Price is required';
                            }
                            if (double.tryParse(v) == null) {
                              return 'Enter valid price';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                      _buildSectionHeader('Additional Details'),
                      const SizedBox(height: 16),
                      _buildTwoColumnRow(
                        _buildTextField(
                          controller: _batchCtrl,
                          label: 'Batch Number',
                          icon: Iconsax.code,
                        ),
                        _buildTextField(
                          controller: _expiryCtrl,
                          label: 'Expiry Date',
                          icon: Iconsax.calendar,
                          hint: 'YYYY-MM-DD',
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _dosageCtrl,
                        label: 'Dosage',
                        icon: Iconsax.activity,
                        hint: 'e.g., 500mg, 10ml',
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _descriptionCtrl,
                        label: 'Description',
                        icon: Iconsax.note_text,
                        maxLines: 3,
                      ),
                      const SizedBox(height: 24),
                      _buildSectionHeader('Status & Settings'),
                      const SizedBox(height: 16),
                      _buildDropdown(
                        value: _status,
                        label: 'Status',
                        icon: Iconsax.status,
                        items: _statusOptions,
                        onChanged: (v) => setState(() => _status = v!),
                      ),
                      const SizedBox(height: 16),
                      _buildCheckbox(
                        'Requires Prescription',
                        _requiresPrescription,
                        (v) => setState(() => _requiresPrescription = v!),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            _buildActions(isEdit),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isEdit) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary.withOpacity(0.05), AppColors.primary.withOpacity(0.02)],
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        border: Border(bottom: BorderSide(color: AppColors.grey200, width: 1.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primary600],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              isEdit ? Iconsax.edit5 : Iconsax.add_circle5,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEdit ? 'Edit Medicine' : 'Add New Medicine',
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.kTextPrimary,
                  ),
                ),
                Text(
                  'Enter medicine details and inventory information',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
            icon: const Icon(Iconsax.close_circle),
            color: AppColors.kTextSecondary,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.kTextPrimary,
      ),
    );
  }

  Widget _buildTwoColumnRow(Widget left, Widget right) {
    return Row(
      children: [
        Expanded(child: left),
        const SizedBox(width: 16),
        Expanded(child: right),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    String? helperText,
    String? prefix,
    TextInputType? keyboardType,
    int maxLines = 1,
    bool enabled = true,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: _buildInputDecoration(
        label: label,
        icon: icon,
        hint: hint,
        helperText: helperText,
      ).copyWith(
        prefixText: prefix,
        enabled: enabled,
      ),
      keyboardType: keyboardType,
      maxLines: maxLines,
      enabled: enabled,
      validator: validator,
    );
  }

  Widget _buildDropdown({
    required String value,
    required String label,
    required IconData icon,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: _buildInputDecoration(label: label, icon: icon),
      items: items.map((item) {
        return DropdownMenuItem(value: item, child: Text(item));
      }).toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildCheckbox(String label, bool value, void Function(bool?) onChanged) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200, width: 1.5),
      ),
      child: Row(
        children: [
          Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.kTextPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(bool isEdit) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        border: Border(top: BorderSide(color: AppColors.grey200, width: 1.5)),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          OutlinedButton(
            onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton.icon(
            onPressed: _isSaving ? null : _submit,
            icon: _isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Icon(isEdit ? Iconsax.tick_circle5 : Iconsax.add_circle5),
            label: Text(
              _isSaving ? 'Saving...' : (isEdit ? 'Update Medicine' : 'Add Medicine'),
              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}
