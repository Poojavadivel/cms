import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../Utils/Colors.dart'; // your AppColors

/// Enterprise-grade GenericDataTable
/// - Uses AppColors for consistent theming
/// - Polished header, search, filter panel
/// - Responsive sizing for search width
/// - Horizontal scroll fallback for narrow widths
/// - Refined action buttons with tooltips + confirm for destructive actions
class GenericDataTable extends StatelessWidget {
  final List<String> headers;
  final List<List<Widget>> rows;

  final String searchQuery;
  final ValueChanged<String> onSearchChanged;

  final List<Widget> filters;

  final int currentPage;
  final int totalItems;
  final int itemsPerPage;
  final VoidCallback onPreviousPage;
  final VoidCallback onNextPage;

  final String title;

  final void Function(int rowIndex)? onView;
  final void Function(int rowIndex)? onEdit;
  final void Function(int rowIndex)? onDelete;

  const GenericDataTable({
    super.key,
    required this.headers,
    required this.rows,
    required this.searchQuery,
    required this.onSearchChanged,
    required this.filters,
    required this.currentPage,
    required this.totalItems,
    required this.itemsPerPage,
    required this.onPreviousPage,
    required this.onNextPage,
    this.title = "TABLE",
    this.onView,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final displayHeaders = [
      ...headers,
      if (onView != null || onEdit != null || onDelete != null) "Actions",
    ];

    return LayoutBuilder(builder: (context, constraints) {
      return SizedBox(
        width: constraints.maxWidth,
        height: constraints.maxHeight,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Controls(
              title: title,
              searchQuery: searchQuery,
              onSearchChanged: onSearchChanged,
              filters: filters,
            ),
            const SizedBox(height: 12),
            Expanded(
              child: _DataTableView(
                headers: displayHeaders,
                rows: rows,
                onView: onView,
                onEdit: onEdit,
                onDelete: onDelete,
              ),
            ),
            const SizedBox(height: 8),
            _PaginationControls(
              currentPage: currentPage,
              itemsPerPage: itemsPerPage,
              totalItems: totalItems,
              onPrevious: onPreviousPage,
              onNext: onNextPage,
            ),
          ],
        ),
      );
    });
  }
}

/// Controls: title + filter + search
class _Controls extends StatefulWidget {
  final String title;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final List<Widget> filters;

  const _Controls({
    required this.title,
    required this.searchQuery,
    required this.onSearchChanged,
    required this.filters,
  });

  @override
  State<_Controls> createState() => _ControlsState();
}

class _ControlsState extends State<_Controls> {
  bool _showFilters = false;
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.searchQuery);
  }

  @override
  void didUpdateWidget(covariant _Controls oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery) {
      _searchController.text = widget.searchQuery;
      _searchController.selection = TextSelection.fromPosition(
        TextPosition(offset: _searchController.text.length),
      );
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      double searchWidth;
      if (c.maxWidth >= 1200) {
        searchWidth = 380;
      } else if (c.maxWidth >= 1000) {
        searchWidth = 320;
      } else if (c.maxWidth >= 800) {
        searchWidth = 280;
      } else {
        searchWidth = 200;
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  widget.title.toUpperCase(),
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.appointmentsHeader,
                  ),
                ),
              ),

              // filter button
              Row(
                children: [
                  SizedBox(
                    width: 44,
                    height: 44,
                    child: IconButton(
                      onPressed: widget.filters.isEmpty
                          ? null
                          : () => setState(() => _showFilters = !_showFilters),
                      style: ButtonStyle(
                        backgroundColor:
                        MaterialStateProperty.all(AppColors.rowAlternate),
                        overlayColor: MaterialStateProperty.all(AppColors.kCFBlue.withOpacity(0.06)),
                        shape: MaterialStateProperty.all(RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                      ),
                      icon: Icon(Icons.tune_rounded, color: widget.filters.isEmpty ? AppColors.kTextSecondary.withOpacity(0.5) : AppColors.primary700),
                      tooltip: widget.filters.isEmpty ? 'No filters' : 'Toggle filters',
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Search
                  SizedBox(
                    width: searchWidth,
                    height: 48,
                    child: TextField(
                      controller: _searchController,
                      onChanged: widget.onSearchChanged,
                      decoration: InputDecoration(
                        hintText: 'Search...',
                        hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary),
                        prefixIcon: Icon(Icons.search, color: AppColors.kTextSecondary),
                        suffixIcon: (widget.searchQuery.isEmpty)
                            ? null
                            : IconButton(
                          tooltip: 'Clear',
                          onPressed: () {
                            _searchController.clear();
                            widget.onSearchChanged('');
                          },
                          icon: Icon(Icons.close_rounded, size: 18, color: AppColors.kTextSecondary),
                        ),
                        isDense: true,
                        filled: true,
                        fillColor: AppColors.kCard,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.searchBorder)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.searchBorder)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.primary, width: 2)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // filters panel
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: (!_showFilters || widget.filters.isEmpty)
                ? const SizedBox.shrink()
                : Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.kCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.searchBorder),
                ),
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: widget.filters,
                ),
              ),
            ),
          ),
        ],
      );
    });
  }
}

/// Table View (enterprise)
class _DataTableView extends StatelessWidget {
  final List<String> headers;
  final List<List<Widget>> rows;

  final void Function(int rowIndex)? onView;
  final void Function(int rowIndex)? onEdit;
  final void Function(int rowIndex)? onDelete;

  const _DataTableView({
    required this.headers,
    required this.rows,
    this.onView,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final actionPresent = onView != null || onEdit != null || onDelete != null;

    return ScrollConfiguration(
      behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
      child: ClipRect(
        child: LayoutBuilder(builder: (context, constraints) {
          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: ConstrainedBox(
              constraints: BoxConstraints(minWidth: constraints.maxWidth),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.kCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.grey200),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 8)),
                  ],
                ),
                clipBehavior: Clip.hardEdge,
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: Table(
                    border: TableBorder(
                      horizontalInside: BorderSide(width: 0.6, color: AppColors.grey200),
                    ),
                    columnWidths: {
                      for (int i = 0; i < headers.length; i++) i: const FlexColumnWidth(1),
                    },
                    defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                    children: [
                      // Header
                      TableRow(
                        decoration: BoxDecoration(color: AppColors.rowAlternate),
                        children: [
                          for (var title in headers)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                              child: Align(
                                alignment: Alignment.center,
                                child: Text(
                                  title,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.tableHeader,
                                    fontSize: 14.5,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),

                      // Data rows
                      for (int i = 0; i < rows.length; i++)
                        TableRow(
                          decoration: BoxDecoration(
                            color: i.isEven ? AppColors.kCard : AppColors.rowAlternate.withOpacity(0.65),
                          ),
                          children: [
                            for (var cell in rows[i])
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 2),
                                child: Align(alignment: Alignment.center, child: cell),
                              ),

                            if (actionPresent)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 2),
                                child: LayoutBuilder(
                                  builder: (context, constraints) {
                                    return Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (onView != null)
                                          Flexible(
                                            child: _ActionGhostButton(
                                              icon: Icons.remove_red_eye_outlined,
                                              label: 'View',
                                              color: AppColors.primary700,
                                              onPressed: () => onView!(i),
                                            ),
                                          ),
                                        if (onEdit != null && onView != null)
                                          const SizedBox(width: 2),
                                        if (onEdit != null)
                                          Flexible(
                                            child: _ActionGhostButton(
                                              icon: Icons.edit_outlined,
                                              label: 'Edit',
                                              color: AppColors.kInfo,
                                              onPressed: () => onEdit!(i),
                                            ),
                                          ),
                                        if (onDelete != null && (onEdit != null || onView != null))
                                          const SizedBox(width: 2),
                                        if (onDelete != null)
                                          Flexible(
                                            child: _DestructiveActionButton(
                                              label: 'Delete',
                                              onConfirmed: () => onDelete!(i),
                                            ),
                                          ),
                                      ],
                                    );
                                  },
                                ),
                              ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

/// Small ghost action button (icon + label)
class _ActionGhostButton extends StatelessWidget {
  final IconData icon;
  final String label; // still used for tooltip
  final Color color;
  final VoidCallback onPressed;

  const _ActionGhostButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label, // 👈 keep tooltip for accessibility
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.transparent,
          side: BorderSide(color: color.withOpacity(0.2), width: 1),
          padding: const EdgeInsets.all(10),
          minimumSize: const Size(40, 40), // compact square look
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }
}


/// Destructive action: confirmation dialog then calls onConfirmed
class _DestructiveActionButton extends StatelessWidget {
  final String label;
  final VoidCallback onConfirmed;

  const _DestructiveActionButton({
    required this.label,
    required this.onConfirmed,
  });

  Future<void> _confirm(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Confirm', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to delete this item?', style: GoogleFonts.inter()),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(label, style: TextStyle(color: AppColors.kDanger)),
          ),
        ],
      ),
    );
    if (ok == true) onConfirmed();
  }

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: OutlinedButton(
        onPressed: () => _confirm(context),
        child: Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.kDanger)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: AppColors.kDanger.withOpacity(0.12)),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}

/// Pagination controls (enterprise)
class _PaginationControls extends StatelessWidget {
  final int currentPage;
  final int itemsPerPage;
  final int totalItems;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _PaginationControls({
    required this.currentPage,
    required this.itemsPerPage,
    required this.totalItems,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final totalPages = (totalItems / itemsPerPage).ceil().clamp(1, 9999);
    final isFirst = currentPage == 0;
    final isLast = currentPage >= totalPages - 1;

    return Align(
      alignment: Alignment.bottomRight,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Page ${currentPage + 1} of $totalPages', style: GoogleFonts.inter(color: AppColors.kTextSecondary)),
          const SizedBox(width: 12),
          OutlinedButton(
            onPressed: isFirst ? null : onPrevious,
            child: const Icon(Icons.chevron_left, size: 18),
            style: OutlinedButton.styleFrom(
              foregroundColor: isFirst ? AppColors.kTextSecondary.withOpacity(0.5) : AppColors.kTextPrimary,
              side: BorderSide(color: AppColors.grey200),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: isLast ? null : onNext,
            child: const Icon(Icons.chevron_right, size: 18),
            style: OutlinedButton.styleFrom(
              foregroundColor: isLast ? AppColors.kTextSecondary.withOpacity(0.5) : AppColors.kTextPrimary,
              side: BorderSide(color: AppColors.grey200),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ],
      ),
    );
  }
}
