# Generic Enterprise Table - Architecture & Flow

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GenericEnterpriseTable                    │
│                     (Reusable Widget)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Receives Configuration
                              ▼
        ┌────────────────────────────────────────┐
        │        Configuration Objects            │
        ├────────────────────────────────────────┤
        │  • TableColumnConfig<T>                │
        │  • StatConfig<T>                       │
        │  • ActionConfig<T>                     │
        │  • Search Filter Function              │
        │  • Data Fetch Function                 │
        └────────────────────────────────────────┘
                              │
                              │ Used by
                              ▼
        ┌─────────────────────────────────────────┐
        │         Your Page Implementation         │
        │  (AppointmentsPage, PatientsPage, etc.) │
        └─────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────┐
│  User    │
│ Action   │
└────┬─────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│              GenericEnterpriseTable                     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │           1. HEADER SECTION                   │     │
│  │  ┌──────────────────────────────────────┐   │     │
│  │  │  Icon │ Title & Subtitle              │   │     │
│  │  │  🔄   │ ⚙️  ➕ Add Button            │   │     │
│  │  └──────────────────────────────────────┘   │     │
│  │  ┌──────────────────────────────────────┐   │     │
│  │  │  🔍 Search Bar (Real-time filter)   │   │     │
│  │  └──────────────────────────────────────┘   │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │         2. STATS BAR (Optional)              │     │
│  │  ┌─────┬─────┬─────┬─────┐                  │     │
│  │  │Total│Sche │Comp │Canc │                  │     │
│  │  │ 45  │ 12  │ 28  │  5  │                  │     │
│  │  └─────┴─────┴─────┴─────┘                  │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │           3. TABLE SECTION                   │     │
│  │  ┌────────────────────────────────────────┐ │     │
│  │  │ Header Row (Sortable Columns)         │ │     │
│  │  ├────────────────────────────────────────┤ │     │
│  │  │ Row 1  │ Cell │ Cell │ Cell │ Actions │ │     │
│  │  │ Row 2  │ Cell │ Cell │ Cell │ Actions │ │     │
│  │  │ Row 3  │ Cell │ Cell │ Cell │ Actions │ │     │
│  │  │   ...                                  │ │     │
│  │  └────────────────────────────────────────┘ │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │          4. PAGINATION                       │     │
│  │  Showing 1-10 of 45   [◀] 1/5 [▶]          │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
             │                    │
             │ API Call           │ User Action
             ▼                    ▼
    ┌─────────────┐      ┌──────────────┐
    │   Backend   │      │  Dialog /    │
    │     API     │      │  Navigation  │
    └─────────────┘      └──────────────┘
```

---

## 📊 State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Widget State                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  _isLoading ──────────► Show Skeleton Loader           │
│                                                          │
│  _isRefreshing ────────► Disable Refresh Button         │
│                                                          │
│  _items ────────────────► Raw Data List                 │
│     │                                                    │
│     ├──► Filter ──────► _filteredItems                  │
│     │                      │                             │
│     │                      ├──► Sort ──────────────┐    │
│     │                      │                       │    │
│     │                      ▼                       ▼    │
│     └──► Stats Calculator  Paginate ──► _paginatedItems│
│                                              │           │
│  _searchQuery ──────► Trigger Filter         │           │
│                                              │           │
│  _sortColumn ───────► Trigger Sort           │           │
│  _sortAscending                              │           │
│                                              │           │
│  _currentPage ──────► Control Pagination     │           │
│                                              │           │
│  _columnVisibility ─► Control Column Display │           │
│                                              │           │
│                                              ▼           │
│                                        Render UI         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

```
Scaffold
 └─── SafeArea
       └─── Column
             ├─── Header Widget
             │     ├─── Title Row
             │     │     ├─── Icon + Title + Subtitle
             │     │     ├─── Refresh Button
             │     │     ├─── Settings Button
             │     │     └─── Add Button
             │     └─── Search Bar
             │
             ├─── Stats Bar (Optional)
             │     └─── Row
             │           ├─── Stat Card 1
             │           ├─── Divider
             │           ├─── Stat Card 2
             │           ├─── Divider
             │           └─── Stat Card N
             │
             └─── Expanded
                   └─── Conditional
                         ├─── Skeleton Loader (if loading)
                         │     └─── Shimmer Effects
                         │
                         └─── Table Container (if loaded)
                               ├─── Header Row
                               │     └─── Row
                               │           └─── [Column Headers]
                               │
                               ├─── Expanded
                               │     ├─── Empty State (if no data)
                               │     │     └─── Icon + Message
                               │     │
                               │     └─── ListView (if has data)
                               │           └─── [Table Rows]
                               │                 ├─── Row 1
                               │                 │     ├─── [Cells]
                               │                 │     └─── Actions
                               │                 ├─── Row 2
                               │                 └─── Row N
                               │
                               └─── Pagination Footer
                                     ├─── Item Count Display
                                     └─── Navigation Controls
                                           ├─── Previous Button
                                           ├─── Page Indicator
                                           └─── Next Button
```

---

## 🔄 User Interaction Flow

### 1. Search Flow
```
User Types in Search Bar
         │
         ▼
onChanged(query) triggered
         │
         ▼
_filterItems(query) called
         │
         ▼
Update _searchQuery
         │
         ▼
_applyFiltersAndSort()
         │
         ├──► Filter _items using searchFilter
         │
         ├──► Update _filteredItems
         │
         ├──► Reset _currentPage to 0
         │
         └──► setState() ──► Re-render table
```

### 2. Sort Flow
```
User Clicks Column Header
         │
         ▼
_sortItems(columnKey) called
         │
         ▼
Check if same column
    │           │
    Yes         No
    │           │
    ▼           ▼
Toggle       Set as new
direction    sort column
    │           │
    └─────┬─────┘
          │
          ▼
Sort _filteredItems using sortComparator
          │
          ▼
setState() ──► Re-render table with sorted data
```

### 3. Pagination Flow
```
User Clicks Next/Previous
         │
         ▼
Update _currentPage
         │
         ▼
Calculate new startIndex and endIndex
         │
         ▼
Get _paginatedItems subset
         │
         ▼
setState() ──► Re-render table with new page
```

### 4. Action Flow
```
User Clicks Action Button
         │
         ▼
ActionConfig.onTap(item) triggered
         │
         ▼
Your custom callback
         │
         ├──► Open Dialog
         ├──► Navigate to Page
         ├──► Show Form
         └──► Delete/Edit/View
```

---

## 🎨 Rendering Pipeline

```
┌─────────────────────────────────────────────────────┐
│                 Build Method Called                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
              Check _isLoading?
                 │         │
                Yes        No
                 │         │
                 ▼         ▼
         Show Skeleton   Build Normal UI
           Loader            │
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            Build Header      Build Stats (if enabled)
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
                    Check _paginatedItems.isEmpty?
                         │           │
                        Yes          No
                         │           │
                         ▼           ▼
                 Show Empty     Build Table
                   State            │
                                    ├──► Build Header Row
                                    │     (for each column)
                                    │
                                    ├──► Build Data Rows
                                    │     (for each item)
                                    │     │
                                    │     ├──► Build Cells
                                    │     │     (column.builder)
                                    │     │
                                    │     └──► Build Actions
                                    │           (for each action)
                                    │
                                    └──► Build Pagination
                                          │
                                          ├──► Item count
                                          └──► Navigation
```

---

## 💾 Data Transformation

```
Raw API Data
     │
     ▼
Future<List<T>> fetchData()
     │
     ▼
List<T> _items (all items)
     │
     ├──────────────────────────────┐
     │                              │
     ▼                              ▼
Search Filter              Stats Calculator
     │                              │
     ▼                              │
List<T> _filteredItems             │
     │                              │
     ▼                              │
Sort (if column selected)           │
     │                              │
     ▼                              │
Paginate                            │
     │                              │
     ▼                              │
List<T> _paginatedItems             │
     │                              │
     ├──────────────────────────────┘
     │
     ▼
UI Rendering
```

---

## 🔧 Configuration Injection

```
Your Page (Stateless)
     │
     ├──► title: String
     ├──► subtitle: String
     ├──► titleIcon: IconData
     ├──► searchPlaceholder: String
     │
     ├──► fetchData: Future<List<T>> Function()
     │     OR
     ├──► initialData: List<T>
     │
     ├──► columns: List<TableColumnConfig<T>>
     │     ├──► key, label, flex, sortable
     │     ├──► builder: (T) → Widget
     │     └──► sortComparator: (T, T) → int
     │
     ├──► stats: List<StatConfig<T>>
     │     ├──► label, icon, color
     │     └──► calculator: (List<T>) → dynamic
     │
     ├──► actions: List<ActionConfig<T>>
     │     ├──► icon, color, tooltip
     │     └──► onTap: (T) → void
     │
     ├──► searchFilter: (T, String) → bool
     ├──► onRowTap: (T) → void
     ├──► onAdd: () → void
     │
     └──► Customization
           ├──► primaryColor
           ├──► itemsPerPage
           ├──► showRefresh
           ├──► showColumnSettings
           └──► showStats
                 │
                 ▼
      GenericEnterpriseTable<T>
         (Receives & Processes)
```

---

## 🚀 Performance Optimizations

```
1. Lazy Loading
   └─► Only render visible items (pagination)

2. Efficient Filtering
   └─► Filter only when search changes
       └─► Not on every rebuild

3. Smart Sorting
   └─► Sort only filtered items
       └─► Not all items

4. Minimal Rebuilds
   └─► setState() with minimal scope
       └─► Only affected widgets rebuild

5. Const Widgets
   └─► Use const where possible
       └─► Reduce widget creation

6. Skeleton Loading
   └─► Instant UI feedback
       └─► Perceived performance

7. Pagination
   └─► Limit DOM elements
       └─► Better scroll performance
```

---

## 🎯 Reusability Pattern

```
┌───────────────────────────────────────┐
│   GenericEnterpriseTable<T>           │
│   (Single Implementation)              │
└─────────────┬─────────────────────────┘
              │
              │ Used by multiple pages
              │
    ┏━━━━━━━━━┻━━━━━━━━━┓
    ┃                    ┃
    ▼                    ▼
┌─────────┐          ┌─────────┐
│Appoint- │          │Patients │
│ments    │          │  Page   │
└────┬────┘          └────┬────┘
     │                    │
     │ Pass config        │ Pass config
     │ & data type        │ & data type
     │                    │
     ▼                    ▼
<DashboardAppointments>  <PatientDetails>
```

```
    ┏━━━━━━━━━┻━━━━━━━━━┓
    ┃                    ┃
    ▼                    ▼
┌─────────┐          ┌─────────┐
│Schedule │          │Billing  │
│  Page   │          │  Page   │
└────┬────┘          └────┬────┘
     │                    │
     ▼                    ▼
<ScheduleItem>       <BillingRecord>
```

**Result**: One widget powers 10+ different pages!

---

## 📦 Package Structure

```
lib/
├── Widgets/
│   └── generic_enterprise_table.dart  ← Generic Widget
│       ├── GenericEnterpriseTable<T>
│       ├── TableColumnConfig<T>
│       ├── StatConfig<T>
│       └── ActionConfig<T>
│
└── Modules/
    └── Doctor/
        ├── AppointmentsPage.dart
        │   └── Uses: GenericEnterpriseTable<DashboardAppointments>
        │
        ├── PatientsPage.dart
        │   └── Uses: GenericEnterpriseTable<PatientDetails>
        │
        └── SchedulePage.dart
            └── Uses: GenericEnterpriseTable<ScheduleItem>
```

---

## 🎓 Key Design Principles

1. **Single Responsibility**
   - GenericEnterpriseTable handles UI & logic
   - Your page provides configuration

2. **DRY (Don't Repeat Yourself)**
   - Write table logic once
   - Reuse everywhere

3. **Open/Closed Principle**
   - Open for extension (customization)
   - Closed for modification (core logic)

4. **Composition Over Inheritance**
   - Use config objects, not subclassing

5. **Type Safety**
   - Generic types ensure compile-time safety

---

*One widget, infinite possibilities! 🚀*
