# 📋 Appointments Page - Quick Reference

## Key Features Added

| Feature | Status | Details |
|---------|--------|---------|
| AuthService Integration | ✅ | `fetchAppointments()` API calls |
| Refresh Button | ✅ | Manual refresh with visual feedback |
| Column Settings | ✅ | Enterprise popup dialog |
| Skeleton Loading | ✅ | Shimmer effect during fetch |
| Search/Filter | ✅ | Real-time search by name/code/reason |
| Sorting | ✅ | Click column headers to sort |
| Pagination | ✅ | 10 items per page with controls |
| Error Handling | ✅ | User-friendly error messages |
| Empty State | ✅ | Professional empty screen |
| Responsive | ✅ | Works on all screen sizes |

## Code Structure

```
AppointmentsPageNew
├── _loadAppointments()           // Fetch from AuthService
├── _refreshAppointments()         // Manual refresh
├── _filterAppointments()          // Search input
├── _sortAppointments()            // Sort by column
├── _applyFiltersAndSort()         // Core logic
├── _showColumnSettings()          // Column popup
│
├── UI Methods
├── _buildEnterpriseHeader()       // Title + buttons
├── _buildStatsBar()               // Stats summary
├── _buildSkeletonLoader()         // Shimmer loading
├── _buildAppointmentTable()       // Main table
├── _buildTableHeader()            // Column headers
├── _buildTableRow()               // Data rows
├── _buildStatusBadge()            // Status colors
├── _buildPagination()             // Page controls
└── _buildActionButton()           // Icon buttons
```

## Usage

### Start App
```dart
void initState() {
  super.initState();
  _loadAppointments();  // Loads data from AuthService
}
```

### Refresh Data
```dart
// User clicks refresh button
_refreshAppointments();
// OR press button in header
```

### Search
```dart
// User types in search field
_filterAppointments("patient name");
```

### Column Settings
```dart
// User clicks settings icon
_showColumnSettings();
// Toggle columns on/off
// Click Apply
```

## State Variables

```dart
// Data
_appointments          // All data from API
_filteredAppointments  // After search/sort

// UI State
_isLoading             // Initial load
_isRefreshing          // Refresh button state

// Filter/Sort
_searchQuery           // Search text
_sortColumn            // Current sort column
_sortAscending         // Sort direction

// Pagination
_currentPage           // Current page (0-based)
_itemsPerPage          // 10 items per page

// Settings
_columnVisibility      // Which columns to show
```

## Methods Flow

### Load Data
```
initState()
  → _loadAppointments()
    → AuthService.fetchAppointments()
    → setState() _appointments
    → _applyFiltersAndSort()
    → show data
```

### Refresh Data
```
User clicks refresh
  → _refreshAppointments()
    → _isRefreshing = true
    → _loadAppointments(showLoading: false)
    → show success/error
    → _isRefreshing = false
```

### Search/Filter
```
User types in search
  → _filterAppointments(query)
    → _applyFiltersAndSort()
    → _filteredAppointments = results
    → _currentPage = 0
    → rebuild with filtered data
```

## Key Implementation Details

### AuthService Integration
```dart
final appointments = await AuthService.instance.fetchAppointments();
if (mounted) setState(() { _appointments = appointments; });
```

### Refresh Logic
```dart
setState(() => _isRefreshing = true);
await _loadAppointments(showLoading: false);  // No loading screen
setState(() => _isRefreshing = false);
```

### Filter & Sort
```dart
void _applyFiltersAndSort() {
  // Apply search
  // Apply sort
  // Reset pagination
  // Update UI
}
```

### Column Settings Dialog
```dart
_showColumnSettings()
  // Show professional dialog
  // Toggle columns
  // Apply changes
  // Show success message
```

### Skeleton Loader
```dart
_isLoading
  ? _buildSkeletonLoader()      // Show shimmer
  : _buildAppointmentTable()    // Show data
```

## UI Sections

### Header
- Title: "Appointments"
- Subtitle: "Manage all patient appointments"
- Refresh button (colored when active)
- Column settings button
- New Appointment button

### Stats Bar
- Total appointments
- Scheduled count
- Completed count
- Cancelled count

### Search Bar
- Placeholder: "Search by patient name, code, or reason..."
- Auto-clear button
- Active border when focused

### Table
- Headers (sortable by clicking)
- Rows with patient data
- Status badges (color-coded)
- Action buttons (View, Intake)
- Pagination at bottom

## Error Handling

```dart
try {
  final data = await AuthService.instance.fetchAppointments();
  // Update UI
} catch (e) {
  // Show error snackbar
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Failed to load: $e'))
  );
}
```

## Success Feedback

```dart
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: Text('Column settings updated'),
    backgroundColor: AppColors.kSuccess,
    duration: Duration(seconds: 2),
  ),
);
```

## Performance Tips

- ✅ Uses `mounted` check before setState
- ✅ Filters in single pass
- ✅ Pagination prevents large renders
- ✅ Shimmer only shows during initial load
- ✅ Search is instant (no debounce needed for UI)

## Responsive Behavior

- Desktop: All columns visible
- Tablet: Scrollable table
- Mobile: Horizontal scroll

## Testing Commands

```bash
# Run app
flutter run

# Hot reload
r

# Full restart
R

# Check syntax
dart analyze lib/Modules/Doctor/AppointmentsPageNew.dart
```

## Common Tasks

### Add New Status Color
```dart
case 'new_status':
  color = AppColors.newColor;
  icon = Iconsax.icon;
  break;
```

### Change Items Per Page
```dart
final int _itemsPerPage = 20;  // Was 10
```

### Add New Sortable Column
```dart
case 'new_column':
  comparison = a.field.compareTo(b.field);
  break;
```

### Add New Search Field
```dart
appt.newField.toLowerCase().contains(query.toLowerCase())
```

---

**Status**: ✅ Production Ready
**Last Update**: 2025-10-23
