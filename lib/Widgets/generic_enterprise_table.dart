import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:shimmer/shimmer.dart';
import '../Utils/Colors.dart';

/// Generic Enterprise Table Widget
/// Reusable across all modules - just pass configuration and data!
class GenericEnterpriseTable<T> extends StatefulWidget {
  // Header Configuration
  final String title;
  final String subtitle;
  final IconData titleIcon;
  final String searchPlaceholder;
  final VoidCallback? onAdd;
  final String? addButtonLabel;
  
  // Data
  final Future<List<T>> Function()? fetchData;
  final List<T>? initialData;
  
  // Column Configuration
  final List<TableColumnConfig<T>> columns;
  
  // Search Configuration
  final bool Function(T item, String query)? searchFilter;
  
  // Stats Configuration
  final List<StatConfig<T>>? stats;
  
  // Actions
  final List<ActionConfig<T>>? actions;
  
  // Row Click
  final void Function(T item)? onRowTap;
  
  // Pagination
  final int itemsPerPage;
  
  // Customization
  final Color? primaryColor;
  final bool showRefresh;
  final bool showColumnSettings;
  final bool showStats;
  
  const GenericEnterpriseTable({
    super.key,
    required this.title,
    required this.subtitle,
    required this.columns,
    this.titleIcon = Iconsax.document,
    this.searchPlaceholder = 'Search...',
    this.onAdd,
    this.addButtonLabel,
    this.fetchData,
    this.initialData,
    this.searchFilter,
    this.stats,
    this.actions,
    this.onRowTap,
    this.itemsPerPage = 10,
    this.primaryColor,
    this.showRefresh = true,
    this.showColumnSettings = true,
    this.showStats = true,
  }) : assert(fetchData != null || initialData != null, 
             'Either fetchData or initialData must be provided');

  @override
  State<GenericEnterpriseTable<T>> createState() => _GenericEnterpriseTableState<T>();
}

class _GenericEnterpriseTableState<T> extends State<GenericEnterpriseTable<T>> {
  bool _isLoading = false;
  bool _isRefreshing = false;
  List<T> _items = [];
  List<T> _filteredItems = [];
  
  String _searchQuery = '';
  int _currentPage = 0;
  
  String? _sortColumn;
  bool _sortAscending = true;
  
  Map<String, bool> _columnVisibility = {};

  @override
  void initState() {
    super.initState();
    // Initialize column visibility
    for (var col in widget.columns) {
      _columnVisibility[col.key] = col.visible;
    }
    _loadData();
  }

  Color get _primaryColor => widget.primaryColor ?? AppColors.primary;

  Future<void> _loadData({bool showLoading = true}) async {
    if (showLoading) {
      setState(() => _isLoading = true);
    }
    
    try {
      List<T> data;
      if (widget.fetchData != null) {
        data = await widget.fetchData!();
      } else {
        data = widget.initialData!;
      }
      
      if (mounted) {
        setState(() {
          _items = data;
          _applyFiltersAndSort();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load data: $e'),
            backgroundColor: AppColors.kDanger,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
        });
      }
    }
  }

  Future<void> _refreshData() async {
    setState(() => _isRefreshing = true);
    await _loadData(showLoading: false);
  }

  void _applyFiltersAndSort() {
    if (_searchQuery.isEmpty) {
      _filteredItems = List.from(_items);
    } else {
      if (widget.searchFilter != null) {
        _filteredItems = _items
            .where((item) => widget.searchFilter!(item, _searchQuery))
            .toList();
      } else {
        _filteredItems = List.from(_items);
      }
    }
    
    if (_sortColumn != null) {
      _sortItems(_sortColumn!);
    }
    _currentPage = 0;
  }

  void _filterItems(String query) {
    setState(() {
      _searchQuery = query;
      _applyFiltersAndSort();
    });
  }

  void _sortItems(String columnKey) {
    setState(() {
      if (_sortColumn == columnKey) {
        _sortAscending = !_sortAscending;
      } else {
        _sortColumn = columnKey;
        _sortAscending = true;
      }

      final column = widget.columns.firstWhere((col) => col.key == columnKey);
      if (column.sortComparator != null) {
        _filteredItems.sort((a, b) {
          final comparison = column.sortComparator!(a, b);
          return _sortAscending ? comparison : -comparison;
        });
      }
    });
  }

  List<T> get _paginatedItems {
    final startIndex = _currentPage * widget.itemsPerPage;
    final endIndex = startIndex + widget.itemsPerPage;
    if (startIndex >= _filteredItems.length) return [];
    return _filteredItems.sublist(
      startIndex,
      endIndex.clamp(0, _filteredItems.length),
    );
  }

  int get _totalPages => (_filteredItems.length / widget.itemsPerPage).ceil();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgGray,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            if (widget.showStats && widget.stats != null) ...[
              _buildStats(),
              const SizedBox(height: 24),
            ],
            Expanded(
              child: _isLoading
                  ? _buildSkeletonLoader()
                  : _buildTable(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
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
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _primaryColor,
                      _primaryColor.withOpacity(0.7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: _primaryColor.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  widget.titleIcon,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: GoogleFonts.poppins(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                        letterSpacing: -0.5,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: AppColors.textLight,
                        letterSpacing: 0.1,
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.showRefresh) ...[
                IconButton(
                  onPressed: _isRefreshing ? null : _refreshData,
                  tooltip: 'Refresh',
                  icon: Icon(
                    Iconsax.refresh,
                    color: _isRefreshing ? AppColors.textLight : _primaryColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (widget.showColumnSettings) ...[
                IconButton(
                  onPressed: _showColumnSettings,
                  tooltip: 'Column settings',
                  icon: Icon(
                    Iconsax.setting_4,
                    color: _primaryColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (widget.onAdd != null)
                ElevatedButton.icon(
                  onPressed: widget.onAdd,
                  icon: const Icon(Iconsax.add, size: 20),
                  label: Text(
                    widget.addButtonLabel ?? 'Add New',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.bgGray,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _searchQuery.isNotEmpty
                    ? _primaryColor.withOpacity(0.3)
                    : AppColors.grey200,
                width: 1.5,
              ),
            ),
            child: TextField(
              onChanged: _filterItems,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: AppColors.textDark,
                letterSpacing: 0.2,
              ),
              decoration: InputDecoration(
                hintText: widget.searchPlaceholder,
                hintStyle: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w400,
                  color: AppColors.textLight,
                  letterSpacing: 0.2,
                ),
                prefixIcon: Container(
                  padding: const EdgeInsets.all(12),
                  child: Icon(
                    Iconsax.search_normal_1,
                    color: _searchQuery.isNotEmpty
                        ? _primaryColor
                        : AppColors.textLight,
                    size: 22,
                  ),
                ),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Iconsax.close_circle, size: 20),
                        color: AppColors.textLight,
                        onPressed: () => _filterItems(''),
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.white, AppColors.bgGray],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.grey200, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            for (int i = 0; i < widget.stats!.length; i++) ...[
              if (i > 0) _buildDivider(),
              Expanded(child: _buildStatItem(widget.stats![i])),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(StatConfig<T> stat) {
    final value = stat.calculator(_items);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: stat.color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(stat.icon, color: stat.color, size: 24),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value.toString(),
              style: GoogleFonts.poppins(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: stat.color,
                letterSpacing: -0.5,
                height: 1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              stat.label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppColors.textLight,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 50,
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.grey200.withOpacity(0),
            AppColors.grey200,
            AppColors.grey200.withOpacity(0),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
    );
  }

  Widget _buildSkeletonLoader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.bgGray,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: List.generate(
                  widget.columns.length,
                  (index) => Expanded(
                    flex: widget.columns[index].flex,
                    child: Shimmer.fromColors(
                      baseColor: Colors.grey[300]!,
                      highlightColor: Colors.grey[100]!,
                      child: Container(
                        height: 16,
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: 10,
                itemBuilder: (context, index) {
                  return Shimmer.fromColors(
                    baseColor: Colors.grey[300]!,
                    highlightColor: Colors.grey[100]!,
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: AppColors.grey200,
                            width: 1,
                          ),
                        ),
                      ),
                      child: Row(
                        children: List.generate(
                          widget.columns.length,
                          (i) => Expanded(
                            flex: widget.columns[i].flex,
                            child: Container(
                              height: 14,
                              margin: const EdgeInsets.symmetric(horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTable() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            _buildTableHeader(),
            Expanded(
              child: _paginatedItems.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      itemCount: _paginatedItems.length,
                      itemBuilder: (context, index) {
                        final item = _paginatedItems[index];
                        return _buildTableRow(item, index);
                      },
                    ),
            ),
            _buildPagination(),
          ],
        ),
      ),
    );
  }

  Widget _buildTableHeader() {
    final visibleColumns = widget.columns
        .where((col) => _columnVisibility[col.key] == true)
        .toList();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _primaryColor.withOpacity(0.05),
            AppColors.accentPink.withOpacity(0.05),
          ],
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
        border: Border(
          bottom: BorderSide(
            color: AppColors.grey200,
            width: 1.5,
          ),
        ),
      ),
      child: Row(
        children: [
          for (var column in visibleColumns)
            _buildHeaderCell(column),
          if (widget.actions != null && widget.actions!.isNotEmpty)
            Expanded(
              flex: 1,
              child: Text(
                'Actions',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                  letterSpacing: 0.5,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeaderCell(TableColumnConfig<T> column) {
    final isSorted = _sortColumn == column.key;
    
    return Expanded(
      flex: column.flex,
      child: column.sortable
          ? InkWell(
              onTap: () => _sortItems(column.key),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    column.label,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isSorted ? _primaryColor : AppColors.textDark,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    isSorted
                        ? (_sortAscending ? Iconsax.arrow_up_3 : Iconsax.arrow_down_1)
                        : Iconsax.arrow_3,
                    size: 16,
                    color: isSorted ? _primaryColor : AppColors.textLight,
                  ),
                ],
              ),
            )
          : Text(
              column.label,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
                letterSpacing: 0.5,
              ),
            ),
    );
  }

  Widget _buildTableRow(T item, int index) {
    final isEven = index % 2 == 0;
    final visibleColumns = widget.columns
        .where((col) => _columnVisibility[col.key] == true)
        .toList();
    
    return InkWell(
      onTap: widget.onRowTap != null ? () => widget.onRowTap!(item) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: isEven ? Colors.white : AppColors.bgGray.withOpacity(0.3),
          border: Border(
            bottom: BorderSide(
              color: AppColors.grey200.withOpacity(0.5),
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            for (var column in visibleColumns)
              Expanded(
                flex: column.flex,
                child: column.builder(item),
              ),
            if (widget.actions != null && widget.actions!.isNotEmpty)
              Expanded(
                flex: 1,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (var action in widget.actions!) ...[
                      _buildActionButton(
                        icon: action.icon,
                        color: action.color,
                        onTap: () => action.onTap(item),
                        tooltip: action.tooltip,
                      ),
                      const SizedBox(width: 8),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    required String tooltip,
  }) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: color.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.bgGray,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Iconsax.search_normal_1,
              size: 64,
              color: AppColors.textLight,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No items found',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isNotEmpty
                ? 'Try adjusting your search'
                : 'No items available',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgGray.withOpacity(0.3),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
        border: Border(
          top: BorderSide(
            color: AppColors.grey200,
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Showing ${_currentPage * widget.itemsPerPage + 1} - '
            '${((_currentPage + 1) * widget.itemsPerPage).clamp(0, _filteredItems.length)} '
            'of ${_filteredItems.length} items',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textLight,
              letterSpacing: 0.2,
            ),
          ),
          Row(
            children: [
              _buildPaginationButton(
                icon: Iconsax.arrow_left_2,
                onTap: _currentPage > 0
                    ? () => setState(() => _currentPage--)
                    : null,
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: _primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _primaryColor.withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Text(
                  '${_currentPage + 1} / $_totalPages',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _primaryColor,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              _buildPaginationButton(
                icon: Iconsax.arrow_right_3,
                onTap: _currentPage < _totalPages - 1
                    ? () => setState(() => _currentPage++)
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaginationButton({
    required IconData icon,
    required VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: onTap != null ? Colors.white : AppColors.grey200,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: onTap != null
                ? AppColors.grey200
                : AppColors.grey200.withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          size: 16,
          color: onTap != null ? AppColors.textDark : AppColors.textLight,
        ),
      ),
    );
  }

  void _showColumnSettings() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _primaryColor.withOpacity(0.1),
                      AppColors.accentPink.withOpacity(0.1),
                    ],
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                  border: Border(
                    bottom: BorderSide(
                      color: AppColors.grey200,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Iconsax.setting_4,
                            size: 20,
                            color: _primaryColor,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Column Settings',
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Customize table columns visibility',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppColors.textLight,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Iconsax.close_circle),
                      color: AppColors.textLight,
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: widget.columns.map((column) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: AppColors.grey200,
                            width: 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: CheckboxListTile(
                          title: Text(
                            column.label,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textDark,
                            ),
                          ),
                          value: _columnVisibility[column.key],
                          onChanged: (value) {
                            setState(() {
                              _columnVisibility[column.key] = value ?? true;
                            });
                            Navigator.pop(context);
                          },
                          activeColor: _primaryColor,
                          checkColor: Colors.white,
                          controlAffinity: ListTileControlAffinity.leading,
                          dense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 4,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Column Configuration
class TableColumnConfig<T> {
  final String key;
  final String label;
  final int flex;
  final Widget Function(T item) builder;
  final bool sortable;
  final int Function(T a, T b)? sortComparator;
  final bool visible;

  const TableColumnConfig({
    required this.key,
    required this.label,
    required this.builder,
    this.flex = 1,
    this.sortable = false,
    this.sortComparator,
    this.visible = true,
  });
}

/// Stat Configuration
class StatConfig<T> {
  final String label;
  final IconData icon;
  final Color color;
  final dynamic Function(List<T> items) calculator;

  const StatConfig({
    required this.label,
    required this.icon,
    required this.color,
    required this.calculator,
  });
}

/// Action Configuration
class ActionConfig<T> {
  final IconData icon;
  final Color color;
  final String tooltip;
  final void Function(T item) onTap;

  const ActionConfig({
    required this.icon,
    required this.color,
    required this.tooltip,
    required this.onTap,
  });
}
