# Generic Enterprise Table - Usage Guide

## 📚 Overview

The **GenericEnterpriseTable** is a fully reusable, enterprise-grade table widget that can be used across any page by simply passing configuration and data. No need to rewrite table logic!

---

## 🎯 Key Features

✅ **Plug & Play**: Just configure columns and pass data
✅ **Search**: Built-in search with custom filters
✅ **Sort**: Column sorting with custom comparators
✅ **Paginate**: Automatic pagination
✅ **Stats Bar**: Optional statistics display
✅ **Actions**: Configurable row actions
✅ **Skeleton Loading**: Professional loading states
✅ **Column Toggle**: Show/hide columns
✅ **Responsive**: Works on all screen sizes
✅ **Customizable**: Colors, icons, labels

---

## 📦 Installation

```dart
import 'package:yourapp/Widgets/generic_enterprise_table.dart';
```

---

## 🚀 Quick Start Examples

### Example 1: Appointments Page

```dart
import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import '../Widgets/generic_enterprise_table.dart';
import '../Models/dashboardmodels.dart';
import '../Services/Authservices.dart';
import '../Utils/Colors.dart';

class AppointmentsPageGeneric extends StatelessWidget {
  const AppointmentsPageGeneric({super.key});

  @override
  Widget build(BuildContext context) {
    return GenericEnterpriseTable<DashboardAppointments>(
      // Header
      title: 'Appointments',
      subtitle: 'Manage all patient appointments',
      titleIcon: Iconsax.calendar_1,
      searchPlaceholder: 'Search by patient name, code, or reason...',
      
      // Data
      fetchData: () => AuthService.instance.fetchAppointments(),
      
      // Add Button
      onAdd: () => _showAddAppointmentDialog(context),
      addButtonLabel: 'New Appointment',
      
      // Stats
      showStats: true,
      stats: [
        StatConfig<DashboardAppointments>(
          label: 'Total',
          icon: Iconsax.calendar_2,
          color: AppColors.primary,
          calculator: (items) => items.length,
        ),
        StatConfig<DashboardAppointments>(
          label: 'Scheduled',
          icon: Iconsax.clock,
          color: AppColors.kInfo,
          calculator: (items) => items
              .where((a) => a.status.toLowerCase() == 'scheduled')
              .length,
        ),
        StatConfig<DashboardAppointments>(
          label: 'Completed',
          icon: Iconsax.tick_circle,
          color: AppColors.kSuccess,
          calculator: (items) => items
              .where((a) => a.status.toLowerCase() == 'completed')
              .length,
        ),
        StatConfig<DashboardAppointments>(
          label: 'Cancelled',
          icon: Iconsax.close_circle,
          color: AppColors.kDanger,
          calculator: (items) => items
              .where((a) => a.status.toLowerCase() == 'cancelled')
              .length,
        ),
      ],
      
      // Columns
      columns: [
        TableColumnConfig<DashboardAppointments>(
          key: 'patient',
          label: 'Patient',
          flex: 2,
          sortable: true,
          sortComparator: (a, b) => a.patientName.compareTo(b.patientName),
          builder: (appt) => _buildPatientCell(appt),
        ),
        TableColumnConfig<DashboardAppointments>(
          key: 'age',
          label: 'Age',
          flex: 1,
          sortable: true,
          sortComparator: (a, b) => a.patientAge.compareTo(b.patientAge),
          builder: (appt) => Text(
            '${appt.patientAge} yrs',
            style: const TextStyle(fontSize: 13),
          ),
        ),
        TableColumnConfig<DashboardAppointments>(
          key: 'gender',
          label: 'Gender',
          flex: 1,
          builder: (appt) => Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                appt.gender.toLowerCase() == 'male'
                    ? Iconsax.man
                    : Iconsax.woman,
                size: 18,
                color: appt.gender.toLowerCase() == 'male'
                    ? AppColors.kInfo
                    : AppColors.accentPink,
              ),
              const SizedBox(width: 6),
              Text(appt.gender, style: const TextStyle(fontSize: 13)),
            ],
          ),
        ),
        TableColumnConfig<DashboardAppointments>(
          key: 'date',
          label: 'Date',
          flex: 2,
          sortable: true,
          sortComparator: (a, b) => a.date.compareTo(b.date),
          builder: (appt) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Iconsax.calendar_1, size: 14, color: AppColors.textLight),
                  const SizedBox(width: 6),
                  Text(appt.date, style: const TextStyle(fontSize: 13)),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Iconsax.clock, size: 14, color: AppColors.textLight),
                  const SizedBox(width: 6),
                  Text(appt.time, style: TextStyle(fontSize: 12, color: AppColors.textLight)),
                ],
              ),
            ],
          ),
        ),
        TableColumnConfig<DashboardAppointments>(
          key: 'reason',
          label: 'Reason',
          flex: 2,
          builder: (appt) => Text(
            appt.reason,
            style: const TextStyle(fontSize: 13),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        TableColumnConfig<DashboardAppointments>(
          key: 'status',
          label: 'Status',
          flex: 1,
          builder: (appt) => _buildStatusBadge(appt.status),
        ),
      ],
      
      // Search Filter
      searchFilter: (appt, query) {
        final q = query.toLowerCase();
        return appt.patientName.toLowerCase().contains(q) ||
            (appt.patientCode?.toLowerCase().contains(q) ?? false) ||
            appt.reason.toLowerCase().contains(q);
      },
      
      // Actions
      actions: [
        ActionConfig<DashboardAppointments>(
          icon: Iconsax.eye,
          color: AppColors.kInfo,
          tooltip: 'View Details',
          onTap: (appt) => _showAppointmentDetails(context, appt),
        ),
        ActionConfig<DashboardAppointments>(
          icon: Iconsax.clipboard_text,
          color: AppColors.kSuccess,
          tooltip: 'Intake Form',
          onTap: (appt) => _showIntakeForm(context, appt),
        ),
      ],
      
      // Row Click
      onRowTap: (appt) => _showAppointmentDetails(context, appt),
    );
  }
  
  Widget _buildPatientCell(DashboardAppointments appt) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [
                AppColors.primary.withOpacity(0.2),
                AppColors.accentPink.withOpacity(0.2),
              ],
            ),
            border: Border.all(
              color: AppColors.primary.withOpacity(0.3),
              width: 2,
            ),
            image: appt.patientAvatarUrl.isNotEmpty
                ? DecorationImage(
                    image: NetworkImage(appt.patientAvatarUrl),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: appt.patientAvatarUrl.isEmpty
              ? Center(
                  child: Text(
                    appt.patientName[0].toUpperCase(),
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                )
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                appt.patientName,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                appt.patientCode ?? 'N/A',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textLight,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildStatusBadge(String status) {
    Color color;
    IconData icon;
    
    switch (status.toLowerCase()) {
      case 'completed':
        color = AppColors.kSuccess;
        icon = Iconsax.tick_circle;
        break;
      case 'scheduled':
        color = AppColors.kInfo;
        icon = Iconsax.clock;
        break;
      case 'cancelled':
        color = AppColors.kDanger;
        icon = Iconsax.close_circle;
        break;
      default:
        color = AppColors.textLight;
        icon = Iconsax.info_circle;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            status,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
  
  // Helper methods
  void _showAddAppointmentDialog(BuildContext context) {
    // Your add appointment dialog
  }
  
  void _showAppointmentDetails(BuildContext context, DashboardAppointments appt) {
    // Your details dialog
  }
  
  void _showIntakeForm(BuildContext context, DashboardAppointments appt) {
    // Your intake form
  }
}
```

---

### Example 2: Patients Page

```dart
class PatientsPageGeneric extends StatelessWidget {
  const PatientsPageGeneric({super.key});

  @override
  Widget build(BuildContext context) {
    return GenericEnterpriseTable<PatientDetails>(
      title: 'Patients',
      subtitle: 'Manage patient records',
      titleIcon: Iconsax.profile_2user,
      searchPlaceholder: 'Search patients by name, phone, or ID...',
      
      fetchData: () => AuthService.instance.fetchPatients(),
      
      onAdd: () => _showAddPatientDialog(context),
      addButtonLabel: 'Add Patient',
      
      showStats: true,
      stats: [
        StatConfig<PatientDetails>(
          label: 'Total',
          icon: Iconsax.people,
          color: AppColors.primary,
          calculator: (items) => items.length,
        ),
        StatConfig<PatientDetails>(
          label: 'Male',
          icon: Iconsax.man,
          color: AppColors.kInfo,
          calculator: (items) => items
              .where((p) => p.gender.toLowerCase() == 'male')
              .length,
        ),
        StatConfig<PatientDetails>(
          label: 'Female',
          icon: Iconsax.woman,
          color: AppColors.accentPink,
          calculator: (items) => items
              .where((p) => p.gender.toLowerCase() == 'female')
              .length,
        ),
      ],
      
      columns: [
        TableColumnConfig<PatientDetails>(
          key: 'patient',
          label: 'Patient',
          flex: 2,
          sortable: true,
          sortComparator: (a, b) => a.name.compareTo(b.name),
          builder: (patient) => Text(patient.name),
        ),
        TableColumnConfig<PatientDetails>(
          key: 'age',
          label: 'Age',
          flex: 1,
          sortable: true,
          sortComparator: (a, b) => a.age.compareTo(b.age),
          builder: (patient) => Text('${patient.age}'),
        ),
        TableColumnConfig<PatientDetails>(
          key: 'phone',
          label: 'Phone',
          flex: 2,
          builder: (patient) => Text(patient.phone),
        ),
        TableColumnConfig<PatientDetails>(
          key: 'lastVisit',
          label: 'Last Visit',
          flex: 2,
          sortable: true,
          sortComparator: (a, b) => a.lastVisitDate.compareTo(b.lastVisitDate),
          builder: (patient) => Text(patient.lastVisitDate),
        ),
      ],
      
      searchFilter: (patient, query) {
        final q = query.toLowerCase();
        return patient.name.toLowerCase().contains(q) ||
            patient.phone.toLowerCase().contains(q) ||
            (patient.patientCode?.toLowerCase().contains(q) ?? false);
      },
      
      actions: [
        ActionConfig<PatientDetails>(
          icon: Iconsax.eye,
          color: AppColors.kInfo,
          tooltip: 'View',
          onTap: (patient) => _viewPatient(context, patient),
        ),
        ActionConfig<PatientDetails>(
          icon: Iconsax.edit,
          color: AppColors.kWarning,
          tooltip: 'Edit',
          onTap: (patient) => _editPatient(context, patient),
        ),
        ActionConfig<PatientDetails>(
          icon: Iconsax.trash,
          color: AppColors.kDanger,
          tooltip: 'Delete',
          onTap: (patient) => _deletePatient(context, patient),
        ),
      ],
    );
  }
  
  void _showAddPatientDialog(BuildContext context) {}
  void _viewPatient(BuildContext context, PatientDetails patient) {}
  void _editPatient(BuildContext context, PatientDetails patient) {}
  void _deletePatient(BuildContext context, PatientDetails patient) {}
}
```

---

### Example 3: Simple List (No Stats, No Actions)

```dart
class SimpleDoctorsPage extends StatelessWidget {
  const SimpleDoctorsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return GenericEnterpriseTable<Doctor>(
      title: 'Doctors',
      subtitle: 'View all doctors',
      titleIcon: Iconsax.health,
      searchPlaceholder: 'Search doctors...',
      
      // Use static data instead of API
      initialData: _getDoctors(),
      
      // Disable features
      showStats: false,
      showRefresh: false,
      showColumnSettings: false,
      
      columns: [
        TableColumnConfig<Doctor>(
          key: 'name',
          label: 'Doctor Name',
          flex: 2,
          builder: (doc) => Text(doc.name),
        ),
        TableColumnConfig<Doctor>(
          key: 'specialization',
          label: 'Specialization',
          flex: 2,
          builder: (doc) => Text(doc.specialization),
        ),
        TableColumnConfig<Doctor>(
          key: 'phone',
          label: 'Phone',
          flex: 1,
          builder: (doc) => Text(doc.phone),
        ),
      ],
      
      searchFilter: (doc, query) =>
          doc.name.toLowerCase().contains(query.toLowerCase()),
      
      onRowTap: (doc) => print('Clicked: ${doc.name}'),
    );
  }
  
  List<Doctor> _getDoctors() {
    return [
      Doctor(name: 'Dr. Smith', specialization: 'Cardiology', phone: '123-456'),
      // ... more doctors
    ];
  }
}
```

---

### Example 4: Custom Color Theme

```dart
class CustomThemedTable extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GenericEnterpriseTable<YourDataType>(
      title: 'Custom Table',
      subtitle: 'With custom colors',
      
      // Custom primary color
      primaryColor: Colors.purple,
      
      // ... rest of config
    );
  }
}
```

---

## 🔧 Configuration Options

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | String | Page title |
| `subtitle` | String | Page subtitle |
| `columns` | List<TableColumnConfig> | Column definitions |
| `fetchData` OR `initialData` | Function OR List | Data source |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `titleIcon` | IconData | Iconsax.document | Header icon |
| `searchPlaceholder` | String | 'Search...' | Search hint text |
| `onAdd` | VoidCallback | null | Add button callback |
| `addButtonLabel` | String | 'Add New' | Add button text |
| `searchFilter` | Function | null | Custom search logic |
| `stats` | List<StatConfig> | null | Statistics cards |
| `actions` | List<ActionConfig> | null | Row action buttons |
| `onRowTap` | Function | null | Row click handler |
| `itemsPerPage` | int | 10 | Pagination size |
| `primaryColor` | Color | AppColors.primary | Theme color |
| `showRefresh` | bool | true | Show refresh button |
| `showColumnSettings` | bool | true | Show column toggle |
| `showStats` | bool | true | Show stats bar |

---

## 📊 Column Configuration

```dart
TableColumnConfig<YourType>(
  key: 'unique_key',          // Unique identifier
  label: 'Column Header',      // Display label
  flex: 2,                     // Flex width (1-10)
  sortable: true,              // Enable sorting
  sortComparator: (a, b) => a.field.compareTo(b.field),
  visible: true,               // Initial visibility
  builder: (item) => Widget,   // Cell widget builder
)
```

---

## 📈 Stats Configuration

```dart
StatConfig<YourType>(
  label: 'Stat Name',
  icon: Iconsax.icon_name,
  color: Colors.blue,
  calculator: (items) => items.length,  // Custom calculation
)
```

---

## ⚡ Action Configuration

```dart
ActionConfig<YourType>(
  icon: Iconsax.eye,
  color: AppColors.kInfo,
  tooltip: 'View Details',
  onTap: (item) {
    // Handle action
  },
)
```

---

## 🎨 Customization Examples

### Custom Cell Widgets

```dart
builder: (item) => Row(
  children: [
    CircleAvatar(
      backgroundImage: NetworkImage(item.avatar),
    ),
    const SizedBox(width: 8),
    Text(item.name),
  ],
)
```

### Complex Status Badges

```dart
builder: (item) => Container(
  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  decoration: BoxDecoration(
    color: _getStatusColor(item.status).withOpacity(0.1),
    borderRadius: BorderRadius.circular(8),
  ),
  child: Text(item.status),
)
```

### Clickable Links

```dart
builder: (item) => InkWell(
  onTap: () => _openLink(item.url),
  child: Text(
    item.email,
    style: TextStyle(
      color: Colors.blue,
      decoration: TextDecoration.underline,
    ),
  ),
)
```

---

## 🚀 Advanced Usage

### With State Management (Provider)

```dart
class AppointmentsPageWithProvider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GenericEnterpriseTable<DashboardAppointments>(
      // ... config
      fetchData: () async {
        final provider = Provider.of<AppointmentProvider>(context, listen: false);
        return provider.getAppointments();
      },
    );
  }
}
```

### With Filtering

```dart
searchFilter: (item, query) {
  final q = query.toLowerCase();
  
  // Multiple field search
  return item.name.toLowerCase().contains(q) ||
      item.code.toLowerCase().contains(q) ||
      item.email.toLowerCase().contains(q) ||
      item.phone.contains(q);
}
```

### Dynamic Columns

```dart
columns: _buildDynamicColumns(userRole),

List<TableColumnConfig<T>> _buildDynamicColumns(String role) {
  final cols = <TableColumnConfig<T>>[];
  
  // Always show
  cols.add(TableColumnConfig(...));
  
  // Admin only
  if (role == 'admin') {
    cols.add(TableColumnConfig(...));
  }
  
  return cols;
}
```

---

## ✅ Benefits

1. **Reusable**: Write once, use everywhere
2. **Consistent**: Same UX across all pages
3. **Maintainable**: Update one file, fix all tables
4. **Type Safe**: Generic type support
5. **Performant**: Built-in optimizations
6. **Flexible**: Highly configurable
7. **Enterprise-Ready**: Professional UI

---

## 📝 Migration Guide

### Before (Old Appointments Page)
```dart
class AppointmentsPage extends StatefulWidget {
  // 1500 lines of table logic...
}
```

### After (New Generic Table)
```dart
class AppointmentsPage extends StatelessWidget {
  Widget build(context) => GenericEnterpriseTable<DashboardAppointments>(
    // 50 lines of configuration
  );
}
```

**Result**: 1450 lines saved! 🎉

---

## 🎓 Best Practices

1. **Use Type Parameters**: Always specify the data type
2. **Keep Builders Simple**: Extract complex widgets to methods
3. **Handle Null**: Always check for null values
4. **Use Const**: Make widgets const when possible
5. **Test Search**: Verify search works with all fields
6. **Customize Colors**: Use theme colors for consistency

---

## 🐛 Troubleshooting

### Issue: Data not loading
**Solution**: Ensure `fetchData` returns `Future<List<T>>` or `initialData` is provided

### Issue: Search not working
**Solution**: Implement `searchFilter` function

### Issue: Columns not visible
**Solution**: Check `visible: true` in TableColumnConfig

### Issue: Actions not showing
**Solution**: Ensure `actions` list is not empty

---

## 📚 Complete Working Example

See `AppointmentsPageGeneric` in the examples above for a complete, production-ready implementation.

---

*Happy coding! 🚀*
