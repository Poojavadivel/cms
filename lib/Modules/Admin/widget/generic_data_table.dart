import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);

// This is a generic, reusable table widget that can display any data
// by taking a list of headers and a list of rows (where each row is a list of widgets).
class GenericDataTable extends StatelessWidget {
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
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cardBackgroundColor,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Controls
              _TableControls(
                title: title,
                searchQuery: searchQuery,
                onSearchChanged: onSearchChanged,
                onAddPressed: onAddPressed,
                filters: filters,
              ),
              const SizedBox(height: 8),

              // Data View
              Expanded(
                child: _TableDataView(
                  headers: headers,
                  rows: rows,
                  onView: onView,
                  onEdit: onEdit,
                  onDelete: onDelete,
                  hideHorizontalScrollbar: hideHorizontalScrollbar,
                ),
              ),
              const SizedBox(height: 1),

              // Pagination
              _PaginationControls(
                currentPage: currentPage,
                itemsPerPage: itemsPerPage,
                totalItems: totalItems,
                onPrevious: onPreviousPage,
                onNext: onNextPage,
              ),
            ],
          ),
        ),

        // Loader overlay
        if (isLoading)
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }
}

// --- Top controls ---
class _TableControls extends StatelessWidget {
  final String title;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback? onAddPressed;
  final List<Widget> filters;

  const _TableControls({
    required this.title,
    required this.searchQuery,
    required this.onSearchChanged,
    this.onAddPressed,
    this.filters = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title.toUpperCase(),
          style: GoogleFonts.lexend(
            fontSize: 24, // Bigger font size for the title
            fontWeight: FontWeight.bold,
            color: _appointmentsHeaderColor,
          ),
        ),
        Row(
          children: [
            ...filters,
            if (filters.isNotEmpty) const SizedBox(width: 16),
            SizedBox(
              width: 220,
              height: 48,
              child: TextField(
                onChanged: onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search...',
                  hintStyle: GoogleFonts.inter(
                    fontSize: 14,
                    color: const Color(0xFF9CA3AF),
                  ),
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 17),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: _searchBorderColor),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: _searchBorderColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide:
                    const BorderSide(color: primaryColor, width: 2),
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
                    'New $title',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _buttonBgColor,
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

// --- Table view ---
class _TableDataView extends StatelessWidget {
  final List<String> headers;
  final List<List<Widget>> rows;
  final bool hideHorizontalScrollbar;

  final void Function(int index)? onView;
  final void Function(int index)? onEdit;
  final void Function(int index)? onDelete;

  const _TableDataView({
    required this.headers,
    required this.rows,
    this.onView,
    this.onEdit,
    this.onDelete,
    this.hideHorizontalScrollbar = false,
  });

  bool get _hasActions => onView != null || onEdit != null || onDelete != null;

  @override
  Widget build(BuildContext context) {
    // Add 'Actions' to headers if any action callback is provided
    final allHeaders = [...headers];
    if (_hasActions) {
      allHeaders.add('Actions');
    }

    return LayoutBuilder(builder: (context, constraints) {
      return Scrollbar(
        thumbVisibility: !hideHorizontalScrollbar,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: constraints.maxWidth),
            child: SingleChildScrollView(
              scrollDirection: Axis.vertical,
              child: Table(
                border: const TableBorder(
                  horizontalInside: BorderSide(width: 0.5, color: Color(0xFFE5E7EB)),
                ),
                columnWidths: {
                  for (var i = 0; i < allHeaders.length; i++)
                    i: const FlexColumnWidth(1)
                },
                defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                children: [
                  // Header
                  TableRow(
                    decoration: const BoxDecoration(color: Color(0xFFF9FAFB)),
                    children: [
                      for (final h in allHeaders)
                        _header(h, Alignment.center),
                    ],
                  ),

                  // Rows
                  for (int i = 0; i < rows.length; i++)
                    _row(context, rows[i], i),
                ],
              ),
            ),
          ),
        ),
      );
    });
  }

  // Header cell
  Widget _header(String title, Alignment align) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      child: Align(
        alignment: align,
        child: Text(
          title,
          style: GoogleFonts.lexend(
            fontWeight: FontWeight.w800,
            color: _tableHeaderColor,
            fontSize: 15,
          ),
        ),
      ),
    );
  }

  // Data row
  TableRow _row(BuildContext context, List<Widget> rowCells, int rowIndex) {
    final List<Widget> children = [...rowCells];

    // Add action buttons if callbacks are provided
    if (_hasActions) {
      children.add(
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (onView != null)
                SizedBox(
                  width: 28,
                  height: 28,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: const Icon(
                      Icons.remove_red_eye_outlined,
                      size: 16,
                      color: _buttonBgColor,
                    ),
                    onPressed: () => onView!(rowIndex),
                  ),
                ),
              if (onEdit != null)
                SizedBox(
                  width: 28,
                  height: 28,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: const Icon(Icons.edit, size: 16, color: _buttonBgColor),
                    onPressed: () => onEdit!(rowIndex),
                  ),
                ),
              if (onDelete != null)
                SizedBox(
                  width: 28,
                  height: 28,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: const Icon(Icons.delete, size: 16, color: _buttonBgColor),
                    onPressed: () => onDelete!(rowIndex),
                  ),
                ),
            ],
          ),
        ),
      );
    }

    return TableRow(
      decoration: BoxDecoration(color: rowIndex.isEven ? null : _rowAlternateColor),
      children: children.map((cell) => Center(child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        child: cell,
      ))).toList(),
    );
  }
}


// --- Pagination ---
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
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
      ),
    );
  }
}
