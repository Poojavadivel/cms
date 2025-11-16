import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:shimmer/shimmer.dart';

import '../../../Utils/Colors.dart';

// --- GenericDataTable (ENTERPRISE-GRADE UI) ---
class GenericDataTable extends StatefulWidget {
  final String title;
  final List<String> headers;
  final List<List<Widget>> rows;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final int currentPage;
  final int totalItems;
  final int itemsPerPage;
  final VoidCallback onPreviousPage;
  final VoidCallback onNextPage;
  final bool isLoading;
  final List<Widget> filters;
  final VoidCallback? onAddPressed;
  final bool hideHorizontalScrollbar;

  // Callbacks for action buttons in each row (index is the row number)
  final void Function(int index)? onView;
  final void Function(int index)? onEdit;
  final void Function(int index)? onDelete;

  // Optional: callback for refresh button
  final VoidCallback? onRefresh;

  const GenericDataTable({
    super.key,
    required this.title,
    required this.headers,
    required this.rows,
    required this.searchQuery,
    required this.onSearchChanged,
    required this.currentPage,
    required this.totalItems,
    required this.itemsPerPage,
    required this.onPreviousPage,
    required this.onNextPage,
    this.isLoading = false,
    this.filters = const [],
    this.onAddPressed,
    this.onView,
    this.onEdit,
    this.onDelete,
    this.hideHorizontalScrollbar = false,
    this.onRefresh,
  });

  @override
  State<GenericDataTable> createState() => _GenericDataTableState();
}

class _GenericDataTableState extends State<GenericDataTable> {
  int _hoveredRowIndex = -1;
  int _localItemsPerPage = 10;
  final List<int> _pageSizeOptions = [10, 25, 50, 100];

  @override
  void initState() {
    super.initState();
    _localItemsPerPage = widget.itemsPerPage;
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 20,
                offset: const Offset(0, 8),
                spreadRadius: 0,
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Controls
              _EnterpriseTableControls(
                title: widget.title,
                searchQuery: widget.searchQuery,
                onSearchChanged: widget.onSearchChanged,
                onAddPressed: widget.onAddPressed,
                onRefresh: widget.onRefresh,
                filters: widget.filters,
              ),
              const SizedBox(height: 16),

              // Data View
              Expanded(
                child: _EnterpriseTableDataView(
                  headers: widget.headers,
                  rows: widget.rows,
                  onView: widget.onView,
                  onEdit: widget.onEdit,
                  onDelete: widget.onDelete,
                  hideHorizontalScrollbar: widget.hideHorizontalScrollbar,
                  hoveredRowIndex: _hoveredRowIndex,
                  onRowHover: (index) => setState(() => _hoveredRowIndex = index),
                ),
              ),
              const SizedBox(height: 16),

              // Enhanced Pagination
              _EnhancedPaginationControls(
                currentPage: widget.currentPage,
                itemsPerPage: _localItemsPerPage,
                totalItems: widget.totalItems,
                onPrevious: widget.onPreviousPage,
                onNext: widget.onNextPage,
                pageSizeOptions: _pageSizeOptions,
                onPageSizeChanged: (size) {
                  setState(() => _localItemsPerPage = size);
                },
                onJumpToPage: (page) {
                  // Implement page jumping logic if needed
                },
              ),
            ],
          ),
        ),

        // Premium Loading Overlay
        if (widget.isLoading)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.98),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.only(left: 24, right: 24, top: 24, bottom: 12),
                      itemCount: 7,
                      itemBuilder: (context, index) => _buildSkeletonRow(),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          height: 48,
                          width: 48,
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Loading ${widget.title}',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.kTextPrimary,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Please wait while we fetch your data...',
                          style: GoogleFonts.roboto(
                            fontSize: 13,
                            fontWeight: FontWeight.w400,
                            color: AppColors.kTextSecondary,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildStatsBar() {
    final totalPages = (widget.totalItems / _localItemsPerPage).ceil();
    final startIndex = widget.currentPage * _localItemsPerPage;
    final endIndex = (startIndex + _localItemsPerPage).clamp(0, widget.totalItems);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.08),
            AppColors.accentPink.withOpacity(0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _StatItem(
            icon: Iconsax.document_text,
            label: 'Total',
            value: widget.totalItems.toString(),
            color: const Color(0xFF667EEA),
          ),
          _StatItem(
            icon: Iconsax.book,
            label: 'Pages',
            value: totalPages.toString(),
            color: const Color(0xFF4FACFE),
          ),
          _StatItem(
            icon: Iconsax.eye,
            label: 'Viewing',
            value: '${startIndex + 1}–$endIndex',
            color: const Color(0xFFF093FB),
          ),
          if (widget.searchQuery.isNotEmpty)
            _StatItem(
              icon: Iconsax.search_normal_1,
              label: 'Filtered',
              value: widget.rows.length.toString(),
              color: const Color(0xFF00CEC9),
            ),
        ],
      ),
    );
  }

  Widget _buildSkeletonRow() {
    return Container(
      height: 72,
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.grey200,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.grey200.withOpacity(0.6), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Shimmer.fromColors(
        baseColor: AppColors.grey200,
        highlightColor: Colors.grey.shade50,
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.all(14),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.grey300,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    height: 14,
                    width: 140,
                    decoration: BoxDecoration(
                      color: AppColors.grey300,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 11,
                    width: 100,
                    decoration: BoxDecoration(
                      color: AppColors.grey300,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.kTextPrimary,
                height: 1,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppColors.kTextSecondary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// --- Top controls ---
class _EnterpriseTableControls extends StatelessWidget {
  final String title;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback? onAddPressed;
  final VoidCallback? onRefresh;
  final List<Widget> filters;

  const _EnterpriseTableControls({
    required this.title,
    required this.searchQuery,
    required this.onSearchChanged,
    this.onAddPressed,
    this.onRefresh,
    this.filters = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Iconsax.document_text, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Text(
              title.toUpperCase(),
              style: GoogleFonts.lexend(
                fontSize: 21,
                fontWeight: FontWeight.w700,
                color: AppColors.appointmentsHeader,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
        Row(
          children: [
            if (onRefresh != null)
              Container(
                height: 48,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  onPressed: onRefresh,
                  icon: Icon(Iconsax.refresh, color: AppColors.primary, size: 20),
                  tooltip: 'Refresh',
                ),
              ),
            if (onRefresh != null) const SizedBox(width: 12),
            ...filters,
            if (filters.isNotEmpty) const SizedBox(width: 16),
            SizedBox(
              width: 240,
              height: 48,
              child: TextField(
                onChanged: onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search $title...',
                  hintStyle: GoogleFonts.inter(
                    fontSize: 14,
                    color: const Color(0xFF9CA3AF),
                  ),
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 17),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.searchBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.searchBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.primary, width: 2),
                  ),
                ),
              ),
            ),
            if (onAddPressed != null) const SizedBox(width: 16),
            if (onAddPressed != null)
              SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: onAddPressed,
                  icon: const Icon(Icons.add_rounded, size: 18, color: Colors.white),
                  label: Text(
                    'Add New',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.buttonBg,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

// --- Enterprise Table view ---
class _EnterpriseTableDataView extends StatelessWidget {
  final List<String> headers;
  final List<List<Widget>> rows;
  final bool hideHorizontalScrollbar;
  final int hoveredRowIndex;
  final Function(int) onRowHover;

  final void Function(int index)? onView;
  final void Function(int index)? onEdit;
  final void Function(int index)? onDelete;

  const _EnterpriseTableDataView({
    required this.headers,
    required this.rows,
    this.onView,
    this.onEdit,
    this.onDelete,
    this.hideHorizontalScrollbar = false,
    required this.hoveredRowIndex,
    required this.onRowHover,
  });

  bool get _hasActions => onView != null || onEdit != null || onDelete != null;

  @override
  Widget build(BuildContext context) {
    final allHeaders = [...headers];
    if (_hasActions) {
      allHeaders.add('Actions');
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.searchBorder),
      ),
      child: Column(
        children: [
          // Header Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFF9FAFB),
                  const Color(0xFFF3F4F6),
                ],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(14),
                topRight: Radius.circular(14),
              ),
            ),
            child: Row(
              children: [
                for (int i = 0; i < allHeaders.length; i++)
                  Expanded(
                    child: Text(
                      allHeaders[i].toUpperCase(),
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        color: AppColors.tableHeader,
                        fontSize: 12,
                        letterSpacing: 0.8,
                      ),
                      textAlign: i == allHeaders.length - 1 && _hasActions
                          ? TextAlign.center
                          : TextAlign.left,
                    ),
                  ),
              ],
            ),
          ),

          // Table Body
          Expanded(
            child: rows.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Iconsax.document_text, size: 64, color: AppColors.grey300),
                        const SizedBox(height: 16),
                        Text(
                          'No data available',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: rows.length,
                    itemBuilder: (context, index) {
                      return MouseRegion(
                        onEnter: (_) => onRowHover(index),
                        onExit: (_) => onRowHover(-1),
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          decoration: BoxDecoration(
                            color: hoveredRowIndex == index
                                ? AppColors.primary.withOpacity(0.05)
                                : (index.isEven ? Colors.white : const Color(0xFFFAFAFA)),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: hoveredRowIndex == index
                                  ? AppColors.primary.withOpacity(0.2)
                                  : Colors.transparent,
                            ),
                          ),
                          child: Row(
                            children: [
                              for (int i = 0; i < rows[index].length; i++)
                                Expanded(child: rows[index][i]),
                              if (_hasActions)
                                Expanded(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (onView != null)
                                        _ActionButton(
                                          icon: Iconsax.eye,
                                          color: const Color(0xFF4FACFE),
                                          tooltip: 'View',
                                          onPressed: () => onView!(index),
                                        ),
                                      if (onEdit != null) const SizedBox(width: 8),
                                      if (onEdit != null)
                                        _ActionButton(
                                          icon: Iconsax.edit,
                                          color: const Color(0xFF667EEA),
                                          tooltip: 'Edit',
                                          onPressed: () => onEdit!(index),
                                        ),
                                      if (onDelete != null) const SizedBox(width: 8),
                                      if (onDelete != null)
                                        _ActionButton(
                                          icon: Iconsax.trash,
                                          color: const Color(0xFFFF7675),
                                          tooltip: 'Delete',
                                          onPressed: () => onDelete!(index),
                                        ),
                                    ],
                                  ),
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
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String tooltip;
  final VoidCallback onPressed;

  const _ActionButton({
    required this.icon,
    required this.color,
    required this.tooltip,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
      ),
    );
  }
}

// --- Enhanced Pagination (Compact Design) ---
class _EnhancedPaginationControls extends StatelessWidget {
  final int currentPage;
  final int itemsPerPage;
  final int totalItems;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final List<int> pageSizeOptions;
  final Function(int) onPageSizeChanged;
  final Function(int) onJumpToPage;

  const _EnhancedPaginationControls({
    required this.currentPage,
    required this.itemsPerPage,
    required this.totalItems,
    required this.onPrevious,
    required this.onNext,
    required this.pageSizeOptions,
    required this.onPageSizeChanged,
    required this.onJumpToPage,
  });

  @override
  Widget build(BuildContext context) {
    final totalPages = (totalItems / itemsPerPage).ceil().clamp(1, 9999);
    final isFirstPage = currentPage == 0;
    final isLastPage = currentPage >= totalPages - 1;
    final startItem = (currentPage * itemsPerPage) + 1;
    final endItem = ((currentPage + 1) * itemsPerPage).clamp(0, totalItems);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Items per page
          Row(
            children: [
              Text(
                'Show:',
                style: GoogleFonts.roboto(
                  fontSize: 12.5,
                  color: AppColors.kTextSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                  height: 1.4,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.grey200,
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: itemsPerPage,
                    isDense: true,
                    items: pageSizeOptions.map((size) {
                      return DropdownMenuItem<int>(
                        value: size,
                        child: Text(
                          size.toString(),
                          style: GoogleFonts.roboto(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) onPageSizeChanged(value);
                    },
                  ),
                ),
              ),
              const SizedBox(width: 24),
              Text(
                'Showing $startItem-$endItem of $totalItems',
                style: GoogleFonts.roboto(
                  fontSize: 12.5,
                  color: AppColors.kTextSecondary,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                  height: 1.4,
                ),
              ),
            ],
          ),

          // Page navigation
          Row(
            children: [
              // First page
              IconButton(
                onPressed: isFirstPage ? null : () => onJumpToPage(0),
                icon: const Icon(Iconsax.arrow_left_3),
                iconSize: 18,
                color: isFirstPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'First page',
              ),

              // Previous
              IconButton(
                onPressed: isFirstPage ? null : onPrevious,
                icon: const Icon(Iconsax.arrow_left_2),
                iconSize: 18,
                color: isFirstPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Previous page',
              ),

              // Page indicator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.2),
                    width: 1.5,
                  ),
                ),
                child: Text(
                  'Page ${currentPage + 1} of $totalPages',
                  style: GoogleFonts.roboto(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                    letterSpacing: 0.3,
                  ),
                ),
              ),

              // Next
              IconButton(
                onPressed: isLastPage ? null : onNext,
                icon: const Icon(Iconsax.arrow_right_2),
                iconSize: 18,
                color: isLastPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Next page',
              ),

              // Last page
              IconButton(
                onPressed: isLastPage ? null : () => onJumpToPage(totalPages - 1),
                icon: const Icon(Iconsax.arrow_right_3),
                iconSize: 18,
                color: isLastPage ? AppColors.kTextSecondary.withOpacity(0.3) : AppColors.kTextSecondary,
                tooltip: 'Last page',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
