import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// --- Theme Colors (match your AppointmentTable) ---
const Color primaryColor = Color(0xFFEF4444);
const Color cardBackgroundColor = Color(0xFFFFFFFF); // (unused now)
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color _headerColor = Color(0xFF991B1B);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);

/// --- Reusable GenericDataTable (RAW, no outer container) ---
class GenericDataTable extends StatelessWidget {
  final List<String> headers;
  final List<List<Widget>> rows;

  final String searchQuery;
  final ValueChanged<String> onSearchChanged;

  /// Pass any filter controls from parent; they’ll render inside
  /// a collapsible panel toggled by the filter icon.
  final List<Widget> filters;

  final int currentPage;
  final int totalItems;
  final int itemsPerPage;
  final VoidCallback onPreviousPage;
  final VoidCallback onNextPage;

  final String title;

  // Optional actions
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
    // If actions are provided, append "Actions" header
    final displayHeaders = [
      ...headers,
      if (onView != null || onEdit != null || onDelete != null) "Actions",
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        // Fill all available space from parent
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
              // Table body fills the remaining space
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
      },
    );
  }
}

/// --- Controls: Title + Filter icon + Search (with collapsible filters) ---
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

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        // Responsive search width based on available space / zoom level
        double searchWidth;
        if (c.maxWidth >= 1100) {
          searchWidth = 340;
        } else if (c.maxWidth >= 900) {
          searchWidth = 300;
        } else if (c.maxWidth >= 700) {
          searchWidth = 260;
        } else {
          searchWidth = 200;
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: title + filter icon + search
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    widget.title.toUpperCase(),
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _headerColor,
                    ),
                  ),
                ),
                Row(
                  children: [
                    // Filter icon button (ghost style)
                    SizedBox(
                      width: 44,
                      height: 44,
                      child: Opacity(
                        opacity: widget.filters.isEmpty ? 0.5 : 1,
                        child: OutlinedButton(
                          onPressed: widget.filters.isEmpty
                              ? null
                              : () => setState(() => _showFilters = !_showFilters),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: _searchBorderColor),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            padding: EdgeInsets.zero,
                          ),
                          child: const Icon(Icons.tune_rounded, color: _buttonBgColor),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Search (filled, rounded, with clear button)
                    SizedBox(
                      width: searchWidth,
                      height: 48,
                      child: TextField(
                        onChanged: widget.onSearchChanged,
                        controller: TextEditingController(text: widget.searchQuery)
                          ..selection = TextSelection.fromPosition(
                            TextPosition(offset: widget.searchQuery.length),
                          ),
                        decoration: InputDecoration(
                          hintText: 'Search...',
                          hintStyle: GoogleFonts.inter(
                            fontSize: 14,
                            color: const Color(0xFF9CA3AF),
                          ),
                          prefixIcon: const Icon(Icons.search, size: 20),
                          suffixIcon: (widget.searchQuery.isEmpty)
                              ? null
                              : IconButton(
                            tooltip: 'Clear',
                            onPressed: () => widget.onSearchChanged(''),
                            icon: const Icon(Icons.close_rounded, size: 18),
                          ),
                          isDense: true,
                          filled: true,
                          fillColor: cardBackgroundColor,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 14,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: _searchBorderColor),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: _searchBorderColor),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: primaryColor, width: 2),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // Collapsible filters panel
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              child: (!_showFilters || widget.filters.isEmpty)
                  ? const SizedBox.shrink()
                  : Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Container(
                  decoration: BoxDecoration(
                    color: cardBackgroundColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _searchBorderColor),
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
      },
    );
  }
}

// --- Table View (raw, no card, hidden scrollbars, fits parent) ---
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
    return ScrollConfiguration(
      behavior: ScrollConfiguration.of(context).copyWith(
        scrollbars: false, // hide scrollbars (still scrollable)
      ),
      child: ClipRect(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: ConstrainedBox(
                constraints: BoxConstraints(minWidth: constraints.maxWidth),
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: Table(
                    border: const TableBorder(
                      horizontalInside:
                      BorderSide(width: 0.5, color: Color(0xFFE5E7EB)),
                    ),
                    columnWidths: {
                      for (int i = 0; i < headers.length; i++)
                        i: const FlexColumnWidth(1),
                    },
                    defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                    children: [
                      // --- Header Row ---
                      TableRow(
                        decoration: const BoxDecoration(
                          color: Color(0xFFF9FAFB),
                        ),
                        children: [
                          for (var title in headers)
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                  vertical: 14, horizontal: 8),
                              child: Align(
                                alignment: Alignment.center,
                                child: Text(
                                  title,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w800,
                                    color: _headerColor,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),

                      // --- Data Rows ---
                      for (int i = 0; i < rows.length; i++)
                        TableRow(
                          decoration: BoxDecoration(
                            color: i.isEven ? null : _rowAlternateColor,
                          ),
                          children: [
                            for (var cell in rows[i])
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                    vertical: 12, horizontal: 8),
                                child: Align(
                                  alignment: Alignment.center,
                                  child: cell,
                                ),
                              ),
                            if (onView != null ||
                                onEdit != null ||
                                onDelete != null)
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                    vertical: 8, horizontal: 2),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (onView != null)
                                      IconButton(
                                        tooltip: "View",
                                        padding: EdgeInsets.zero,
                                        icon: const Icon(
                                          Icons.remove_red_eye_outlined,
                                          size: 18,
                                          color: _buttonBgColor,
                                        ),
                                        onPressed: () => onView!(i),
                                      ),
                                    if (onEdit != null)
                                      IconButton(
                                        tooltip: "Edit",
                                        padding: EdgeInsets.zero,
                                        icon: const Icon(
                                          Icons.edit,
                                          size: 18,
                                          color: _buttonBgColor,
                                        ),
                                        onPressed: () => onEdit!(i),
                                      ),
                                    if (onDelete != null)
                                      IconButton(
                                        tooltip: "Delete",
                                        padding: EdgeInsets.zero,
                                        icon: const Icon(
                                          Icons.delete,
                                          size: 18,
                                          color: _buttonBgColor,
                                        ),
                                        onPressed: () => onDelete!(i),
                                      ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// --- Pagination Controls (raw) ---
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
    final isFirstPage = currentPage == 0;
    final isLastPage = currentPage >= totalPages - 1;

    return Align(
      alignment: Alignment.bottomRight,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            onPressed: isFirstPage ? null : onPrevious,
            icon: const Icon(Icons.arrow_back_ios),
            color: isFirstPage
                ? textSecondaryColor.withOpacity(0.5)
                : textSecondaryColor,
          ),
          Text(
            'Page ${currentPage + 1} of $totalPages',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: textSecondaryColor,
            ),
          ),
          IconButton(
            onPressed: isLastPage ? null : onNext,
            icon: const Icon(Icons.arrow_forward_ios),
            color: isLastPage
                ? textSecondaryColor.withOpacity(0.5)
                : textSecondaryColor,
          ),
        ],
      ),
    );
  }
}
