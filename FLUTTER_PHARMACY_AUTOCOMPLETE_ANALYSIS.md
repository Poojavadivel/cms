# Flutter Pharmacy Autocomplete Analysis

## Overview
This document analyzes how the Flutter intake form implements medicine search/autocomplete functionality in the pharmacy section.

---

## 1. Component Structure

**File:** `lib/Modules/Doctor/widgets/enhanced_pharmacy_table.dart`

### Key Components:
1. **EnhancedPharmacyTable** - Main stateful widget
2. **Medicine List** - Fetched from backend on initialization
3. **Autocomplete Widget** - Flutter's built-in Autocomplete component
4. **Custom Dropdown UI** - Enhanced options view with stock info

---

## 2. Data Loading (Lines 28-54)

### Medicine Fetch on Init
```dart
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
    }
  } catch (e) {
    print('Error loading medicines: $e');
    if (mounted) {
      setState(() => _loadingMedicines = false);
    }
  }
}
```

**What Happens:**
- Loads all medicines from backend when component mounts
- Fetches up to 100 medicines
- Stores in `_medicines` list for local filtering
- Shows loading indicator while fetching

---

## 3. Autocomplete Implementation (Lines 302-505)

### 3.1 Autocomplete Widget Structure

```dart
Autocomplete<Map<String, dynamic>>(
  optionsBuilder: (textEditingValue) { ... },
  displayStringForOption: (medicine) => medicine['name'] ?? '',
  onSelected: (medicine) => _selectMedicine(index, medicine),
  fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) { ... },
  optionsViewBuilder: (context, onSelected, options) { ... },
)
```

### 3.2 Options Builder - Filtering Logic (Lines 303-313)

```dart
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
}
```

**Filter Logic:**
- Returns empty if search text is empty
- Searches through loaded medicines list
- Matches against **medicine name** OR **SKU code**
- Case-insensitive search using `toLowerCase()`
- Uses `contains()` for partial matching

### 3.3 Display String (Line 314)

```dart
displayStringForOption: (medicine) => medicine['name'] ?? ''
```

Shows medicine name in the input field after selection.

### 3.4 On Selection Handler (Line 315)

```dart
onSelected: (medicine) => _selectMedicine(index, medicine)
```

Calls `_selectMedicine()` when user picks a medicine from dropdown.

---

## 4. Field View Builder - Input Field (Lines 316-331)

```dart
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
}
```

**Features:**
- Custom text field with search placeholder
- Pre-fills with existing medicine name if row already has data
- Compact design with dense padding
- Rounded border styling

---

## 5. Custom Dropdown UI (Lines 332-504)

### 5.1 Dropdown Container Structure

```dart
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
          child: Column(...),
        ),
      ),
    ),
  );
}
```

**Design:**
- Material design with elevation shadow
- 300px max height, 450px max width
- Rounded corners with primary color border
- Scrollable if results exceed height

### 5.2 Dropdown Header (Lines 348-374)

```dart
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
)
```

**Features:**
- Shows count of matching medicines
- Health icon
- Primary color background

### 5.3 Medicine List Items (Lines 377-497)

Each medicine item displays:

#### Medicine Info Row Structure:
```dart
Row(
  children: [
    // 1. Medicine Icon with Stock Color
    Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: stockColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(Iconsax.health, color: stockColor, size: 20),
    ),
    
    // 2. Medicine Details (Name, SKU, Price)
    Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(medicine['name'] ?? 'Unknown'),
          Row(
            children: [
              Text('SKU: ${medicine['sku'] ?? 'N/A'}'),
              Text('•'),
              Icon(Iconsax.money),
              Text('₹$price'),
            ],
          ),
        ],
      ),
    ),
    
    // 3. Stock Badge
    Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Container(
          // Stock label badge
          child: Text(stockLabel), // OUT OF STOCK / LOW STOCK / IN STOCK
        ),
        Text('$stock units'),
      ],
    ),
  ],
)
```

#### Stock Status Logic (Lines 131-141):

```dart
Color _getStockColor(int stock) {
  if (stock == 0) return AppColors.kDanger;      // Red
  if (stock <= 10) return AppColors.kWarning;    // Orange
  return AppColors.kSuccess;                      // Green
}

String _getStockLabel(int stock) {
  if (stock == 0) return 'OUT OF STOCK';
  if (stock <= 10) return 'LOW STOCK';
  return 'IN STOCK';
}
```

#### Item States:
- **Out of Stock**: Grey background, disabled (can't select)
- **Low Stock (≤10)**: Orange badge
- **In Stock**: Green badge

---

## 6. Medicine Selection Flow (Lines 143-153)

```dart
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
```

**When User Selects Medicine:**
1. Extracts sale price from medicine data
2. Gets available stock quantity
3. Updates the row with:
   - Medicine ID (for backend reference)
   - Medicine name
   - Sale price (auto-filled)
   - Available stock (for validation)

---

## 7. Stock Calculation (Lines 123-129)

```dart
int _getMedicineStock(Map<String, dynamic> medicine) {
  final availableQty = medicine['availableQty'] ?? medicine['stock'] ?? 0;
  if (availableQty is int) return availableQty;
  if (availableQty is String) return int.tryParse(availableQty) ?? 0;
  return 0;
}
```

**Handles Multiple Stock Field Names:**
- Checks `availableQty` field first
- Falls back to `stock` field
- Handles both int and string types
- Returns 0 if no stock found

---

## 8. Stock Warnings System (Lines 66-88)

```dart
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
```

**Validation Logic:**
- Called before saving prescription
- Checks each medicine row
- Two types of warnings:
  1. **OUT_OF_STOCK**: Medicine has 0 stock
  2. **INSUFFICIENT**: Requested quantity exceeds available stock

---

## 9. Auto-Calculation Features

### 9.1 Row Total Calculation (Lines 56-60)

```dart
double _calculateRowTotal(Map<String, dynamic> row) {
  final quantity = int.tryParse(row['quantity']?.toString() ?? '1') ?? 1;
  final price = double.tryParse(row['price']?.toString() ?? '0') ?? 0.0;
  return quantity * price;
}
```

**Auto-calculates:** `Quantity × Price = Total`

### 9.2 Grand Total Calculation (Lines 62-64)

```dart
double _calculateGrandTotal() {
  return widget.pharmacyRows.fold(0.0, (sum, row) => sum + _calculateRowTotal(row));
}
```

**Sums all row totals** for prescription grand total.

### 9.3 Update Row Handler (Lines 111-121)

```dart
void _updateRow(int index, Map<String, dynamic> updates) {
  final newRows = List<Map<String, dynamic>>.from(widget.pharmacyRows);
  newRows[index] = {...newRows[index], ...updates};
  
  // Auto-calculate total
  final quantity = int.tryParse(newRows[index]['quantity']?.toString() ?? '1') ?? 1;
  final price = double.tryParse(newRows[index]['price']?.toString() ?? '0') ?? 0.0;
  newRows[index]['total'] = (quantity * price).toStringAsFixed(2);
  
  widget.onRowsChanged(newRows);
}
```

**Auto-updates total** whenever quantity or price changes.

---

## 10. Data Flow Diagram

```
[Component Init]
      ↓
[Fetch All Medicines (limit: 100)]
      ↓
[Store in _medicines List]
      ↓
[User Adds Row]
      ↓
[User Types in Medicine Field]
      ↓
[Autocomplete Filters _medicines]
      ↓
[Show Dropdown with Matches]
      ↓
[Display: Name, SKU, Price, Stock Status]
      ↓
[User Clicks Medicine (if stock > 0)]
      ↓
[_selectMedicine() Called]
      ↓
[Auto-fill: Name, Price, Stock]
      ↓
[User Enters: Dosage, Frequency, Quantity, Notes]
      ↓
[Auto-calculate Row Total]
      ↓
[Auto-calculate Grand Total]
      ↓
[Validate Stock on Save]
      ↓
[Show Warnings if Needed]
```

---

## 11. Key Features

### ✅ Smart Search
- Searches by medicine **name** OR **SKU**
- Case-insensitive
- Partial matching (contains)
- Instant filtering as user types

### ✅ Rich Dropdown UI
- Shows **stock status** with color coding
- Displays **price** upfront
- Shows **SKU** for identification
- **Disabled** out-of-stock items
- Count of matching results

### ✅ Auto-Fill
- Medicine name
- Sale price
- Available stock (for validation)

### ✅ Stock Management
- Visual stock indicators (colors/badges)
- Prevents selection of out-of-stock items
- Warns about insufficient stock before save
- Shows exact available quantity

### ✅ Auto-Calculations
- Row total = quantity × price
- Grand total = sum of all rows
- Updates in real-time

### ✅ User Experience
- Fast local filtering (no API calls per keystroke)
- Loading indicator during initial fetch
- Compact, responsive design
- Clear visual feedback
- Error handling

---

## 12. Medicine Data Structure

### Expected Medicine Object:
```dart
{
  '_id': 'medicine_id_123',
  'name': 'Paracetamol',
  'sku': 'MED-001',
  'salePrice': 50.00,
  'availableQty': 100,  // or 'stock'
  'batches': [...],     // Optional batch info
}
```

### Row Data Structure:
```dart
{
  'medicineId': 'medicine_id_123',  // Backend reference
  'Medicine': 'Paracetamol',        // Display name
  'Dosage': '500mg',                // User input
  'Frequency': '2x daily',          // User input
  'quantity': '10',                 // User input
  'price': '50.00',                 // Auto-filled from medicine
  'total': '500.00',                // Auto-calculated
  'Notes': 'After meals',           // User input
  'availableStock': 100,            // For validation
}
```

---

## 13. API Integration

### Fetch Medicines API:
```dart
await _authService.fetchMedicines(limit: 100)
```

**Expected Response:**
```json
[
  {
    "_id": "med123",
    "name": "Paracetamol",
    "sku": "MED-001",
    "salePrice": 50.00,
    "availableQty": 100
  },
  ...
]
```

---

## 14. Performance Optimizations

### ✅ Load Once Strategy
- Fetches medicines **once** on component mount
- No repeated API calls during typing
- Local filtering is instant

### ✅ Lazy Rendering
- Dropdown only shows when user types
- ListView.builder for efficient rendering
- ConstrainedBox prevents overflow

### ✅ Debouncing Not Needed
- Since filtering is local (not API calls)
- Flutter's Autocomplete handles efficiently

---

## 15. Comparison with React Implementation

| Feature | Flutter | React (Current) |
|---------|---------|-----------------|
| **Search Type** | Autocomplete with dropdown | Basic input field |
| **Medicine Loading** | Fetch all on init | Not implemented |
| **Filtering** | Local, instant | None |
| **Dropdown UI** | Custom rich UI | None |
| **Stock Display** | Visual badges, colors | Not shown |
| **Stock Validation** | Real-time + pre-save | Pre-save only |
| **Auto-fill Price** | Yes, from medicine | Manual input |
| **Auto-calculate Total** | Yes | Partial |
| **UX** | Type & select | Manual entry |

---

## Summary

The Flutter pharmacy autocomplete is a **fully-featured medicine search system** with:

1. **One-time medicine fetch** on component load
2. **Local instant filtering** by name or SKU
3. **Rich dropdown UI** with stock info, prices, and visual indicators
4. **Smart stock management** with color-coded badges
5. **Auto-fill** of medicine name, price, and stock data
6. **Real-time calculations** for totals
7. **Pre-save validation** with stock warnings
8. **Excellent UX** with disabled out-of-stock items

This provides a professional, user-friendly experience compared to manual medicine entry.
