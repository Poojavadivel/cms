import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Adjust these imports to your project structure
import '../../Models/Staff.dart';
import '../../Utils/Colors.dart';
import '../../Services/Authservices.dart';
import 'widget/generic_data_table.dart';

// ---------------------------------------------------------------------

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Data Models ---
class Medicine {
  final String id;
  String name;
  String brand;
  int stock;
  String status;
  double? salePrice;

  Medicine({
    required this.id,
    required this.name,
    required this.brand,
    required this.stock,
    required this.status,
    this.salePrice,
  });

  factory Medicine.fromMap(Map<String, dynamic> map) {
    return Medicine(
      id: map['id'] ?? map['_id']?.toString() ?? '',
      name: map['name'] ?? '',
      brand: map['brand'] ?? '',
      stock: map['stock'] is int ? map['stock'] : int.tryParse(map['stock']?.toString() ?? '0') ?? 0,
      status: map['status'] ?? 'In Stock',
      salePrice: map.containsKey('salePrice')
          ? (map['salePrice'] is num ? (map['salePrice'] as num).toDouble() : double.tryParse(map['salePrice'].toString()))
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'brand': brand,
    'stock': stock,
    'status': status,
    if (salePrice != null) 'salePrice': salePrice,
  };
}

// ----------------------------
// Main screen widget
// ----------------------------
class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({super.key});

  @override
  State<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen> {
  List<Medicine> _allMedicines = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _currentPage = 0;
  final int _limit = 10;
  int _totalItems = 0;
  String _statusFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchMedicines();
  }

  Future<void> _fetchMedicines({int page = 0}) async {
    setState(() {
      _isLoading = true;
    });

    try {
      // AuthService.fetchMedicines returns List<Map<String,dynamic>> (as per provided AuthService)
      final raw = await AuthService.instance.fetchMedicines(
        page: page,
        limit: _limit,
        q: _searchQuery,
        status: _statusFilter == 'All' ? '' : _statusFilter,
      );

      // `raw` expected as List<Map<String,dynamic>>
      final mapped = raw.map((m) => Medicine.fromMap(m)).toList();

      setState(() {
        _allMedicines = mapped;
        _currentPage = page;
        // _totalItems not provided by simple list endpoint; if your server returns meta adjust here
        _totalItems = mapped.length; // fallback
      });
    } catch (e, st) {
      debugPrint('❌ fetchMedicines error: $e\n$st');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load medicines')));
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _onAddPressed() async {
    final created = await _showAddMedicineDialog();
    if (created == true) {
      await _fetchMedicines(page: 0);
    }
  }

  void _onSearchChanged(String q) {
    setState(() {
      _searchQuery = q;
      _currentPage = 0;
    });
    // fetch from server new search results
    _fetchMedicines(page: 0);
  }

  void _nextPage() {
    setState(() => _currentPage++);
    _fetchMedicines(page: _currentPage);
  }

  void _prevPage() {
    if (_currentPage > 0) {
      setState(() => _currentPage--);
      _fetchMedicines(page: _currentPage);
    }
  }

  void _onView(int index, List<Medicine> list) {
    final medicine = list[index];
    // show details or navigate to detail page
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(medicine.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('SKU: ${medicine.id}'),
            const SizedBox(height: 6),
            Text('Brand: ${medicine.brand}'),
            const SizedBox(height: 6),
            Text('Stock: ${medicine.stock}'),
            const SizedBox(height: 6),
            Text('Status: ${medicine.status}'),
            if (medicine.salePrice != null) ...[
              const SizedBox(height: 6),
              Text('Price: ₹${medicine.salePrice!}'),
            ],
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  void _onEdit(int index, List<Medicine> list) {
    final medicine = list[index];
    _showEditDialog(medicine);
  }

  Future<void> _onDelete(int index, List<Medicine> list) async {
    final medicine = list[index];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry'),
        content: Text('Delete ${medicine.name}? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      final ok = await AuthService.instance.deleteMedicine(medicine.id);
      if (ok) {
        await _fetchMedicines(page: _currentPage);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Deleted ${medicine.name}')));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delete failed')));
      }
    } catch (e) {
      debugPrint('Delete error: $e');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delete failed')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // Method to show Add dialog and call createMedicine
  Future<bool?> _showAddMedicineDialog() {
    final _formKey = GlobalKey<FormState>();
    String sku = '';
    String name = '';
    String brand = '';
    String stock = '0';
    String status = 'In Stock';
    String salePrice = '';

    return showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('Add Medicine', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
          content: StatefulBuilder(builder: (ctx2, setStateModal) {
            return SizedBox(
              width: 520,
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    TextFormField(
                      decoration: InputDecoration(labelText: 'SKU', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'SKU required' : null,
                      onChanged: (v) => sku = v.trim(),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: InputDecoration(labelText: 'Name', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Name required' : null,
                      onChanged: (v) => name = v.trim(),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: InputDecoration(labelText: 'Brand', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      onChanged: (v) => brand = v.trim(),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: '0',
                      decoration: InputDecoration(labelText: 'Stock', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Stock required';
                        if (int.tryParse(v) == null) return 'Enter valid number';
                        return null;
                      },
                      onChanged: (v) => stock = v.trim(),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: InputDecoration(labelText: 'Sale Price (optional)', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      onChanged: (v) => salePrice = v.trim(),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: status,
                      items: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued']
                          .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                          .toList(),
                      onChanged: (v) => setStateModal(() => status = v ?? status),
                      decoration: InputDecoration(labelText: 'Status', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                    ),
                  ]),
                ),
              ),
            );
          }),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
              onPressed: () async {
                if (!(_formKey.currentState?.validate() ?? false)) return;

                Navigator.pop(ctx, true); // close while we call backend

                final payload = <String, dynamic>{
                  'sku': sku,
                  'name': name,
                  'brand': brand.isEmpty ? null : brand,
                  'stock': int.tryParse(stock) ?? 0,
                  'status': status,
                };
                if (salePrice.isNotEmpty) {
                  payload['salePrice'] = double.tryParse(salePrice) ?? 0.0;
                }

                setState(() => _isLoading = true);
                try {
                  final created = await AuthService.instance.createMedicine(payload);
                  if (created != null) {
                    await _fetchMedicines(page: 0);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Medicine created')));
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Create failed')));
                  }
                } catch (e) {
                  debugPrint('Create error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Create failed')));
                } finally {
                  setState(() => _isLoading = false);
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  // Show edit dialog and call updateMedicine
  void _showEditDialog(Medicine medicine) {
    final _formKey = GlobalKey<FormState>();
    String name = medicine.name;
    String brand = medicine.brand;
    String status = medicine.status;
    String stock = medicine.stock.toString();
    String salePrice = medicine.salePrice?.toString() ?? '';

    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Edit Medicine', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
          content: StatefulBuilder(builder: (context, setStateModal) {
            return SizedBox(
              width: 520,
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    // SKU read-only
                    TextFormField(
                      initialValue: medicine.id,
                      enabled: false,
                      decoration: InputDecoration(labelText: 'SKU', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: name,
                      decoration: InputDecoration(labelText: 'Name', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Name required' : null,
                      onChanged: (v) => setStateModal(() => name = v),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: brand,
                      decoration: InputDecoration(labelText: 'Brand', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      onChanged: (v) => setStateModal(() => brand = v),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: stock,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: 'Stock', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Stock required';
                        final n = int.tryParse(v);
                        if (n == null || n < 0) return 'Enter valid non-negative integer';
                        return null;
                      },
                      onChanged: (v) => setStateModal(() => stock = v),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: salePrice,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(labelText: 'Sale Price (optional)', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                      validator: (v) {
                        if (v == null || v.isEmpty) return null;
                        final d = double.tryParse(v);
                        if (d == null || d < 0) return 'Enter valid price';
                        return null;
                      },
                      onChanged: (v) => setStateModal(() => salePrice = v),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: status,
                      items: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                      onChanged: (v) => setStateModal(() => status = v ?? status),
                      decoration: InputDecoration(labelText: 'Status', border: OutlineInputBorder(borderRadius: BorderRadius.circular(8))),
                    ),
                  ]),
                ),
              ),
            );
          }),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
              onPressed: () async {
                if (!(_formKey.currentState?.validate() ?? false)) return;

                final parsedStock = int.tryParse(stock) ?? 0;
                final parsedPrice = salePrice.isNotEmpty ? double.tryParse(salePrice) : null;
                final payload = {
                  'name': name.trim(),
                  'brand': brand.trim(),
                  'stock': parsedStock,
                  'status': status,
                };
                if (parsedPrice != null) payload['salePrice'] = parsedPrice;

                Navigator.pop(context);
                setState(() => _isLoading = true);
                try {
                  final ok = await AuthService.instance.updateMedicine(medicine.id, payload);
                  if (ok) {
                    await _fetchMedicines(page: _currentPage);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Medicine updated')));
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Update failed')));
                  }
                } catch (e) {
                  debugPrint('Update error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Update failed')));
                } finally {
                  setState(() => _isLoading = false);
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  // Method to get the filtered list of medicines locally
  // (we still call server on search/filter but keep this as a final filter for UI)
  List<Medicine> _getFilteredMedicines() {
    return _allMedicines.where((m) {
      final q = _searchQuery.trim().toLowerCase();
      final matchesSearch = q.isEmpty || m.name.toLowerCase().contains(q) || m.id.toLowerCase().contains(q) || m.brand.toLowerCase().contains(q);
      final matchesFilter = _statusFilter == 'All' || m.status == _statusFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Widget _statusChip(String status) {
    Color bg;
    Color fg;

    switch (status) {
      case 'In Stock':
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        break;
      case 'Low Stock':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        break;
      case 'Out of Stock':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        break;
      default:
        bg = Colors.grey.withOpacity(0.12);
        fg = Colors.grey;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildStatusFilter() {
    // If you'd like server-provided statuses, call an endpoint — for now keep commonly used ones
    final statuses = {'All', 'In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'};
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list),
      onSelected: (String newValue) {
        setState(() {
          _statusFilter = newValue;
          _currentPage = 0;
        });
        _fetchMedicines(page: 0);
      },
      itemBuilder: (BuildContext context) {
        return statuses.map((String value) {
          return PopupMenuItem<String>(
            value: value,
            child: Text(value, style: GoogleFonts.inter()),
          );
        }).toList();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredMedicines();

    final startIndex = _currentPage * _limit;
    final endIndex = (startIndex + _limit).clamp(0, filtered.length);
    final paginatedMedicines = startIndex >= filtered.length ? <Medicine>[] : filtered.sublist(startIndex, endIndex);

    // Prepare headers and rows for the generic table
    final headers = const ['MEDICINE ID', 'NAME', 'BRAND', 'STOCK', 'STATUS'];
    final rows = paginatedMedicines.map((m) {
      return [
        Text(m.id, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(m.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(m.brand, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        Text(m.stock.toString(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textPrimaryColor)),
        _statusChip(m.status),
      ];
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 6.0),
          child: GenericDataTable(
            title: "Pharmacy Inventory",
            headers: headers,
            rows: rows,
            searchQuery: _searchQuery,
            onSearchChanged: _onSearchChanged,
            currentPage: _currentPage,
            totalItems: _totalItems,
            itemsPerPage: _limit,
            onPreviousPage: _prevPage,
            onNextPage: _nextPage,
            isLoading: _isLoading,
            onAddPressed: _onAddPressed,
            filters: [_buildStatusFilter()],
            hideHorizontalScrollbar: true,
            onView: (i) => _onView(i, paginatedMedicines),
            onEdit: (i) => _onEdit(i, paginatedMedicines),
            onDelete: (i) => _onDelete(i, paginatedMedicines),
          ),
        ),
      ),
    );
  }
}
