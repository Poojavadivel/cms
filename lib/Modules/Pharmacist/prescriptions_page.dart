// lib/Modules/Pharmacist/prescriptions_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../Utils/Colors.dart';
import '../../Services/Authservices.dart';
import '../../Services/api_constants.dart';
import '../../Services/ReportService.dart';

enum PrescriptionFilter { all, today, week, month }
enum PrescriptionSort { newest, oldest, patientName }
enum ViewMode { list, grid }

class PharmacistPrescriptionsPage extends StatefulWidget {
  const PharmacistPrescriptionsPage({super.key});

  @override
  State<PharmacistPrescriptionsPage> createState() => _PharmacistPrescriptionsPageState();
}

class _PharmacistPrescriptionsPageState extends State<PharmacistPrescriptionsPage> with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _allPrescriptions = [];
  List<Map<String, dynamic>> _filteredPrescriptions = [];
  bool _loading = true;
  String? _error;
  
  // Search & Filter
  final TextEditingController _searchController = TextEditingController();
  PrescriptionFilter _currentFilter = PrescriptionFilter.all;
  PrescriptionSort _currentSort = PrescriptionSort.newest;
  ViewMode _viewMode = ViewMode.list;
  
  // Statistics
  int _todayCount = 0;
  int _weekCount = 0;
  int _totalCount = 0;
  
  // Animation
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _searchController.addListener(_onSearchChanged);
    _loadPrescriptions();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _filterAndSortPrescriptions();
  }

  Future<void> _loadPrescriptions() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await AuthService.instance.get(PharmacyEndpoints.getPendingPrescriptions());
      
      if (response != null && response is Map) {
        final prescriptions = response['prescriptions'] as List? ?? [];
        print('📦 [DEBUG] Loaded ${prescriptions.length} prescriptions');
        // Debug: Print dispensed status
        for (var p in prescriptions) {
          print('  - ${p['patientName']}: dispensed=${p['dispensed']}, pharmacyId=${p['pharmacyId']}');
        }
        setState(() {
          _allPrescriptions = prescriptions.cast<Map<String, dynamic>>();
          _calculateStatistics();
          _filterAndSortPrescriptions();
          _loading = false;
        });
        _animationController.forward();
      } else {
        setState(() {
          _error = 'Invalid response format';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _calculateStatistics() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final weekAgo = today.subtract(const Duration(days: 7));
    
    _todayCount = 0;
    _weekCount = 0;
    _totalCount = _allPrescriptions.length;
    
    for (var prescription in _allPrescriptions) {
      final createdAt = prescription['createdAt'] != null
          ? DateTime.tryParse(prescription['createdAt'])
          : null;
      if (createdAt != null) {
        if (createdAt.isAfter(today)) _todayCount++;
        if (createdAt.isAfter(weekAgo)) _weekCount++;
      }
    }
  }

  void _filterAndSortPrescriptions() {
    List<Map<String, dynamic>> filtered = List.from(_allPrescriptions);
    
    // Apply date filter
    final now = DateTime.now();
    switch (_currentFilter) {
      case PrescriptionFilter.today:
        final today = DateTime(now.year, now.month, now.day);
        filtered = filtered.where((p) {
          final createdAt = p['createdAt'] != null ? DateTime.tryParse(p['createdAt']) : null;
          return createdAt != null && createdAt.isAfter(today);
        }).toList();
        break;
      case PrescriptionFilter.week:
        final weekAgo = now.subtract(const Duration(days: 7));
        filtered = filtered.where((p) {
          final createdAt = p['createdAt'] != null ? DateTime.tryParse(p['createdAt']) : null;
          return createdAt != null && createdAt.isAfter(weekAgo);
        }).toList();
        break;
      case PrescriptionFilter.month:
        final monthAgo = now.subtract(const Duration(days: 30));
        filtered = filtered.where((p) {
          final createdAt = p['createdAt'] != null ? DateTime.tryParse(p['createdAt']) : null;
          return createdAt != null && createdAt.isAfter(monthAgo);
        }).toList();
        break;
      case PrescriptionFilter.all:
        break;
    }
    
    // Apply search filter
    final query = _searchController.text.toLowerCase();
    if (query.isNotEmpty) {
      filtered = filtered.where((p) {
        final patientName = (p['patientName'] ?? '').toString().toLowerCase();
        final patientPhone = (p['patientPhone'] ?? '').toString().toLowerCase();
        final notes = (p['notes'] ?? '').toString().toLowerCase();
        return patientName.contains(query) || 
               patientPhone.contains(query) || 
               notes.contains(query);
      }).toList();
    }
    
    // Apply sorting
    switch (_currentSort) {
      case PrescriptionSort.newest:
        filtered.sort((a, b) {
          final aDate = a['createdAt'] != null ? DateTime.tryParse(a['createdAt']) : null;
          final bDate = b['createdAt'] != null ? DateTime.tryParse(b['createdAt']) : null;
          if (aDate == null && bDate == null) return 0;
          if (aDate == null) return 1;
          if (bDate == null) return -1;
          return bDate.compareTo(aDate);
        });
        break;
      case PrescriptionSort.oldest:
        filtered.sort((a, b) {
          final aDate = a['createdAt'] != null ? DateTime.tryParse(a['createdAt']) : null;
          final bDate = b['createdAt'] != null ? DateTime.tryParse(b['createdAt']) : null;
          if (aDate == null && bDate == null) return 0;
          if (aDate == null) return 1;
          if (bDate == null) return -1;
          return aDate.compareTo(bDate);
        });
        break;
      case PrescriptionSort.patientName:
        filtered.sort((a, b) {
          final aName = (a['patientName'] ?? '').toString().toLowerCase();
          final bName = (b['patientName'] ?? '').toString().toLowerCase();
          return aName.compareTo(bName);
        });
        break;
    }
    
    setState(() {
      _filteredPrescriptions = filtered;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Search, Filter & Sort Bar
          _buildSearchAndFilterBar(),

          // Body
          Expanded(
            child: _loading
                ? _buildLoadingState()
                : _error != null
                    ? _buildErrorState()
                    : _filteredPrescriptions.isEmpty
                        ? _buildEmptyState()
                        : FadeTransition(
                            opacity: _fadeAnimation,
                            child: _viewMode == ViewMode.list
                                ? _buildListView()
                                : _buildGridView(),
                          ),
          ),
        ],
      ),
      floatingActionButton: _buildFloatingActions(),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primary600],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.medical_services_rounded, size: 32, color: AppColors.white),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Prescription Management',
                    style: GoogleFonts.lexend(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Enterprise Pharmacy System',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: Icon(Icons.refresh_rounded, color: AppColors.white),
              onPressed: _loading ? null : _loadPrescriptions,
              tooltip: 'Refresh',
              style: IconButton.styleFrom(
                backgroundColor: AppColors.white.withOpacity(0.2),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: Icon(Icons.settings_rounded, color: AppColors.white),
              onPressed: () => _showSettingsDialog(context),
              tooltip: 'Settings',
              style: IconButton.styleFrom(
                backgroundColor: AppColors.white.withOpacity(0.2),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticsDashboard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Today',
              _todayCount.toString(),
              Icons.today_rounded,
              AppColors.kSuccess,
            ),
          ),
          Container(width: 1, height: 50, color: AppColors.grey200),
          Expanded(
            child: _buildStatCard(
              'This Week',
              _weekCount.toString(),
              Icons.date_range_rounded,
              AppColors.kInfo,
            ),
          ),
          Container(width: 1, height: 50, color: AppColors.grey200),
          Expanded(
            child: _buildStatCard(
              'Total',
              _totalCount.toString(),
              Icons.inventory_rounded,
              AppColors.primary,
            ),
          ),
          Container(width: 1, height: 50, color: AppColors.grey200),
          Expanded(
            child: _buildStatCard(
              'Filtered',
              _filteredPrescriptions.length.toString(),
              Icons.filter_alt_rounded,
              AppColors.kWarning,
            ),
          ),
          Container(width: 1, height: 50, color: AppColors.grey200),
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _loading ? null : _loadPrescriptions,
            tooltip: 'Refresh',
            style: IconButton.styleFrom(
              backgroundColor: AppColors.primary.withOpacity(0.1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 8),
            Text(
              value,
              style: GoogleFonts.lexend(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.kTextSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildSearchAndFilterBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Search Bar
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by patient name, phone, or notes...',
                    hintStyle: GoogleFonts.inter(fontSize: 14),
                    prefixIcon: Icon(Icons.search_rounded, color: AppColors.primary),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded),
                            onPressed: () {
                              _searchController.clear();
                              _filterAndSortPrescriptions();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppColors.grey50,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Refresh Button
              IconButton(
                icon: Icon(Icons.refresh_rounded, color: AppColors.primary),
                onPressed: _loading ? null : _loadPrescriptions,
                tooltip: 'Refresh',
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.grey50,
                ),
              ),
              const SizedBox(width: 8),
              // View Mode Toggle
              Container(
                decoration: BoxDecoration(
                  color: AppColors.grey50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.view_list_rounded,
                        color: _viewMode == ViewMode.list ? AppColors.primary : AppColors.kTextSecondary,
                      ),
                      onPressed: () => setState(() => _viewMode = ViewMode.list),
                      tooltip: 'List View',
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.grid_view_rounded,
                        color: _viewMode == ViewMode.grid ? AppColors.primary : AppColors.kTextSecondary,
                      ),
                      onPressed: () => setState(() => _viewMode = ViewMode.grid),
                      tooltip: 'Grid View',
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              // Date Filter
              Expanded(
                child: _buildFilterChip(
                  'All',
                  _currentFilter == PrescriptionFilter.all,
                  () => _setFilter(PrescriptionFilter.all),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildFilterChip(
                  'Today',
                  _currentFilter == PrescriptionFilter.today,
                  () => _setFilter(PrescriptionFilter.today),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildFilterChip(
                  'Week',
                  _currentFilter == PrescriptionFilter.week,
                  () => _setFilter(PrescriptionFilter.week),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildFilterChip(
                  'Month',
                  _currentFilter == PrescriptionFilter.month,
                  () => _setFilter(PrescriptionFilter.month),
                ),
              ),
              const SizedBox(width: 16),
              // Sort Dropdown
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.grey50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<PrescriptionSort>(
                    value: _currentSort,
                    icon: Icon(Icons.sort_rounded, color: AppColors.primary),
                    onChanged: (value) {
                      if (value != null) _setSort(value);
                    },
                    items: const [
                      DropdownMenuItem(
                        value: PrescriptionSort.newest,
                        child: Text('Newest First'),
                      ),
                      DropdownMenuItem(
                        value: PrescriptionSort.oldest,
                        child: Text('Oldest First'),
                      ),
                      DropdownMenuItem(
                        value: PrescriptionSort.patientName,
                        child: Text('Patient Name'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool selected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.grey50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.primary : Colors.transparent,
            width: 2,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: selected ? AppColors.white : AppColors.kTextSecondary,
            ),
          ),
        ),
      ),
    );
  }

  void _setFilter(PrescriptionFilter filter) {
    setState(() {
      _currentFilter = filter;
      _filterAndSortPrescriptions();
    });
  }

  void _setSort(PrescriptionSort sort) {
    setState(() {
      _currentSort = sort;
      _filterAndSortPrescriptions();
    });
  }

  Widget _buildListView() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredPrescriptions.length,
      itemBuilder: (context, index) {
        final prescription = _filteredPrescriptions[index];
        return _EnhancedPrescriptionCard(
          key: ValueKey('${prescription['_id']}_${prescription['dispensed']}_$index'),
          prescription: prescription,
          onDispensed: _loadPrescriptions,
          viewMode: _viewMode,
        );
      },
    );
  }

  Widget _buildGridView() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: _filteredPrescriptions.length,
      itemBuilder: (context, index) {
        final prescription = _filteredPrescriptions[index];
        return _EnhancedPrescriptionCard(
          key: ValueKey('${prescription['_id']}_${prescription['dispensed']}_$index'),
          prescription: prescription,
          onDispensed: _loadPrescriptions,
          viewMode: _viewMode,
        );
      },
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 16),
          Text(
            'Loading prescriptions...',
            style: GoogleFonts.inter(color: AppColors.kTextSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline_rounded, size: 80, color: AppColors.kDanger),
          const SizedBox(height: 24),
          Text(
            'Oops! Something went wrong',
            style: GoogleFonts.lexend(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              _error ?? 'Unknown error occurred',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: AppColors.kTextSecondary),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadPrescriptions,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppColors.kSuccess.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle_outline_rounded,
              size: 80,
              color: AppColors.kSuccess,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            _searchController.text.isEmpty ? 'All Clear!' : 'No Results Found',
            style: GoogleFonts.lexend(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchController.text.isEmpty
                ? 'No pending prescriptions at the moment'
                : 'Try adjusting your search or filters',
            style: GoogleFonts.inter(
              fontSize: 16,
              color: AppColors.kTextSecondary,
            ),
          ),
          if (_searchController.text.isNotEmpty) ...[
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () {
                _searchController.clear();
                _setFilter(PrescriptionFilter.all);
              },
              icon: const Icon(Icons.clear_all_rounded),
              label: const Text('Clear All Filters'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFloatingActions() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        FloatingActionButton.small(
          heroTag: 'export',
          onPressed: () => _exportPrescriptions(),
          tooltip: 'Export Data',
          backgroundColor: AppColors.white,
          child: Icon(Icons.file_download_rounded, color: AppColors.primary),
        ),
        const SizedBox(height: 12),
        FloatingActionButton(
          heroTag: 'refresh',
          onPressed: _loadPrescriptions,
          tooltip: 'Refresh',
          backgroundColor: AppColors.primary,
          child: const Icon(Icons.refresh_rounded, color: Colors.white),
        ),
      ],
    );
  }

  void _showSettingsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.settings_rounded, color: AppColors.primary),
            const SizedBox(width: 12),
            Text('Settings', style: GoogleFonts.lexend()),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.print_rounded, color: AppColors.primary),
              title: const Text('Print Configuration'),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Print settings - Coming soon')),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.notifications_rounded, color: AppColors.primary),
              title: const Text('Notification Preferences'),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Notification settings - Coming soon')),
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _exportPrescriptions() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.download_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Text(
              'Exporting ${_filteredPrescriptions.length} prescriptions...',
              style: GoogleFonts.inter(color: Colors.white),
            ),
          ],
        ),
        backgroundColor: AppColors.kSuccess,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

class _EnhancedPrescriptionCard extends StatefulWidget {
  final Map<String, dynamic> prescription;
  final VoidCallback onDispensed;
  final ViewMode viewMode;

  const _EnhancedPrescriptionCard({
    super.key,
    required this.prescription,
    required this.onDispensed,
    required this.viewMode,
  });

  @override
  State<_EnhancedPrescriptionCard> createState() => _EnhancedPrescriptionCardState();
}

class _EnhancedPrescriptionCardState extends State<_EnhancedPrescriptionCard> with SingleTickerProviderStateMixin {
  bool _isExpanded = false;
  bool _isProcessing = false;
  late AnimationController _expandController;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _expandController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _expandAnimation = CurvedAnimation(
      parent: _expandController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _expandController.dispose();
    super.dispose();
  }

  void _toggleExpand() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _expandController.forward();
      } else {
        _expandController.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final prescription = widget.prescription;
    final patientName = prescription['patientName'] ?? 'Unknown Patient';
    final patientPhone = prescription['patientPhone'] ?? '';
    final createdAt = prescription['createdAt'] != null
        ? DateTime.tryParse(prescription['createdAt'])
        : null;
    final notes = prescription['notes'] ?? '';
    final pharmacyItems = prescription['pharmacyItems'] as List? ?? [];
    final total = prescription['total'] ?? 0;
    final paid = prescription['paid'] ?? false;

    if (widget.viewMode == ViewMode.grid) {
      return _buildGridCard(
        patientName,
        patientPhone,
        createdAt,
        pharmacyItems,
        total,
        paid,
      );
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.grey200, width: 1),
      ),
      child: Column(
        children: [
          // Main Card Content
          InkWell(
            onTap: _toggleExpand,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Header Row
                  Row(
                    children: [
                      // Patient Avatar with Status
                      Stack(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [AppColors.primary, AppColors.primary600],
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Icon(Icons.person_rounded, color: AppColors.white, size: 28),
                          ),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: paid ? AppColors.kSuccess : AppColors.kWarning,
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.white, width: 2),
                              ),
                              child: Icon(
                                paid ? Icons.check_rounded : Icons.access_time_rounded,
                                size: 12,
                                color: AppColors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),
                      // Patient Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              patientName,
                              style: GoogleFonts.lexend(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.kTextPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (patientPhone.isNotEmpty)
                              Row(
                                children: [
                                  Icon(Icons.phone_rounded, size: 14, color: AppColors.kTextSecondary),
                                  const SizedBox(width: 4),
                                  Text(
                                    patientPhone,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: AppColors.kTextSecondary,
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),
                      // Time & Status Badge
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (createdAt != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: _getTimeBadgeColor(createdAt).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.access_time_rounded,
                                    size: 14,
                                    color: _getTimeBadgeColor(createdAt),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _formatDate(createdAt),
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: _getTimeBadgeColor(createdAt),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (widget.prescription['dispensed'] == true)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.kSuccess,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.check_circle, size: 12, color: AppColors.white),
                                      const SizedBox(width: 4),
                                      Text(
                                        'DISPENSED',
                                        style: GoogleFonts.inter(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.white,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              if (widget.prescription['dispensed'] == true)
                                const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: paid ? AppColors.kSuccess : AppColors.kWarning,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  paid ? 'PAID' : 'PENDING',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Quick Info Row
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.grey50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        _buildQuickInfoItem(
                          Icons.medication_rounded,
                          '${pharmacyItems.length}',
                          'Medicines',
                          AppColors.primary,
                        ),
                        Container(width: 1, height: 30, color: AppColors.grey200, margin: const EdgeInsets.symmetric(horizontal: 16)),
                        _buildQuickInfoItem(
                          Icons.currency_rupee_rounded,
                          '${total.toStringAsFixed(0)}',
                          'Total',
                          AppColors.kSuccess,
                        ),
                        const Spacer(),
                        Icon(
                          _isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                          color: AppColors.primary,
                        ),
                      ],
                    ),
                  ),

                  if (notes.isNotEmpty && !_isExpanded) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.kInfo.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.kInfo.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.notes_rounded, size: 16, color: AppColors.kInfo),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              notes.length > 50 ? '${notes.substring(0, 50)}...' : notes,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: AppColors.kTextPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Expandable Details
          SizeTransition(
            sizeFactor: _expandAnimation,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(height: 1),
                  const SizedBox(height: 16),

                  // Full Notes
                  if (notes.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(Icons.description_rounded, size: 18, color: AppColors.kInfo),
                        const SizedBox(width: 8),
                        Text(
                          'Clinical Notes',
                          style: GoogleFonts.lexend(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.grey50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        notes,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.kTextPrimary,
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Medicines List
                  Row(
                    children: [
                      Icon(Icons.local_pharmacy_rounded, size: 18, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        'Prescribed Medicines',
                        style: GoogleFonts.lexend(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kTextPrimary,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${pharmacyItems.length} items',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...pharmacyItems.asMap().entries.map((entry) {
                    return _EnhancedMedicineRow(
                      item: entry.value,
                      index: entry.key,
                    );
                  }).toList(),
                ],
              ),
            ),
          ),

          // Action Buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.grey50,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showPrescriptionDetails(context),
                    icon: const Icon(Icons.visibility_rounded),
                    label: const Text('View Details'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: widget.prescription['dispensed'] == true
                      ? ElevatedButton.icon(
                          onPressed: null,
                          icon: const Icon(Icons.check_circle_rounded),
                          label: const Text('Already Dispensed'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.kSuccess,
                            foregroundColor: AppColors.white,
                            disabledBackgroundColor: AppColors.kSuccess.withOpacity(0.7),
                            disabledForegroundColor: AppColors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        )
                      : ElevatedButton.icon(
                          onPressed: _isProcessing ? null : () => _showDispenseDialog(context),
                          icon: _isProcessing
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.check_circle_rounded),
                          label: Text(_isProcessing ? 'Processing...' : 'Dispense Now'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: AppColors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGridCard(
    String patientName,
    String patientPhone,
    DateTime? createdAt,
    List pharmacyItems,
    dynamic total,
    bool paid,
  ) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.grey200, width: 1),
      ),
      child: InkWell(
        onTap: () => _showPrescriptionDetails(context),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary, AppColors.primary600],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.person_rounded, color: AppColors.white, size: 20),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: paid ? AppColors.kSuccess : AppColors.kWarning,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      paid ? 'PAID' : 'PENDING',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppColors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                patientName,
                style: GoogleFonts.lexend(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (patientPhone.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  patientPhone,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.kTextSecondary,
                  ),
                ),
              ],
              const Spacer(),
              const Divider(),
              Row(
                children: [
                  Icon(Icons.medication_rounded, size: 16, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    '${pharmacyItems.length}',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'items',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.kTextSecondary,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '₹${total.toString()}',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.kSuccess,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: widget.prescription['dispensed'] == true
                    ? ElevatedButton(
                        onPressed: null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.kSuccess,
                          disabledBackgroundColor: AppColors.kSuccess.withOpacity(0.7),
                          disabledForegroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Dispensed'),
                      )
                    : ElevatedButton(
                        onPressed: () => _showDispenseDialog(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Dispense'),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickInfoItem(IconData icon, String value, String label, Color color) {
    return Row(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: GoogleFonts.lexend(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: AppColors.kTextSecondary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Color _getTimeBadgeColor(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inHours < 1) return AppColors.kDanger;
    if (diff.inHours < 6) return AppColors.kWarning;
    return AppColors.primary;
  }

  void _showPrescriptionDetails(BuildContext context) {
    // Show full prescription details in dialog
    showDialog(
      context: context,
      builder: (ctx) => _PrescriptionDetailsDialog(prescription: widget.prescription),
    );
  }

  void _showDispenseDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.local_pharmacy_rounded, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Text('Dispense Prescription', style: GoogleFonts.lexend(fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Confirm dispensing this prescription?',
              style: GoogleFonts.inter(fontSize: 14),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.kWarning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.kWarning.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: AppColors.kWarning, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'This action cannot be undone',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.kTextPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await _dispensePrescription(context);
            },
            icon: const Icon(Icons.check_circle_rounded),
            label: const Text('Confirm Dispense'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _dispensePrescription(BuildContext context) async {
    setState(() => _isProcessing = true);
    
    try {
      final prescription = widget.prescription;
      final intakeId = prescription['_id'];
      if (intakeId == null) {
        throw Exception('Invalid prescription ID');
      }

      final pharmacyItems = prescription['pharmacyItems'] as List? ?? [];
      
      await AuthService.instance.post(
        PharmacyEndpoints.dispensePrescription(intakeId),
        {
          'items': pharmacyItems,
          'paid': false,
          'notes': prescription['notes'] ?? '',
        },
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: AppColors.white),
                const SizedBox(width: 12),
                const Text('Prescription dispensed successfully'),
              ],
            ),
            backgroundColor: AppColors.kSuccess,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }

      // Wait a moment for backend to process, then reload
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Reload the list and close any open dialogs
      widget.onDispensed();
      
      // Close the card/dialog after successful dispense
      if (context.mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.error_rounded, color: AppColors.white),
                const SizedBox(width: 12),
                Expanded(child: Text('Error: $e')),
              ],
            ),
            backgroundColor: AppColors.kDanger,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

class _EnhancedMedicineRow extends StatelessWidget {
  final Map<String, dynamic> item;
  final int index;

  const _EnhancedMedicineRow({
    required this.item,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final name = item['Medicine'] ?? item['name'] ?? '';
    final dosage = item['Dosage'] ?? item['dosage'] ?? '';
    final frequency = item['Frequency'] ?? item['frequency'] ?? '';
    final notes = item['Notes'] ?? item['notes'] ?? '';
    final quantity = item['quantity'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.white,
            AppColors.grey50,
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 4,
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
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${index + 1}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.lexend(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.kTextPrimary,
                      ),
                    ),
                    if (quantity > 0) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Qty: $quantity',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppColors.kTextSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (dosage.isNotEmpty || frequency.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (dosage.isNotEmpty)
                  _buildInfoChip(
                    Icons.medication_liquid_rounded,
                    'Dosage',
                    dosage,
                    AppColors.kInfo,
                  ),
                if (frequency.isNotEmpty)
                  _buildInfoChip(
                    Icons.access_time_rounded,
                    'Frequency',
                    frequency,
                    AppColors.kSuccess,
                  ),
              ],
            ),
          ],
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.kWarning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.kWarning.withOpacity(0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.note_rounded, size: 14, color: AppColors.kWarning),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      notes,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.kTextPrimary,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            '$label: ',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.kTextPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// Prescription Details Dialog
class _PrescriptionDetailsDialog extends StatefulWidget {
  final Map<String, dynamic> prescription;

  const _PrescriptionDetailsDialog({required this.prescription});

  @override
  State<_PrescriptionDetailsDialog> createState() => _PrescriptionDetailsDialogState();
}

class _PrescriptionDetailsDialogState extends State<_PrescriptionDetailsDialog> {
  bool _isDownloading = false;
  final ReportService _reportService = ReportService();

  Future<void> _downloadPrescription() async {
    setState(() => _isDownloading = true);
    
    try {
      final prescriptionId = widget.prescription['_id'];
      final patientName = widget.prescription['patientName'] ?? 'Unknown';
      
      if (prescriptionId == null) {
        throw Exception('Prescription ID not found');
      }

      final result = await _reportService.downloadPrescription(
        prescriptionId,
        patientName,
      );

      if (mounted) {
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: AppColors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(result['message'] ?? 'Prescription downloaded successfully'),
                  ),
                ],
              ),
              backgroundColor: AppColors.kSuccess,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Icons.error_rounded, color: AppColors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(result['message'] ?? 'Failed to download prescription'),
                  ),
                ],
              ),
              backgroundColor: AppColors.kDanger,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.error_rounded, color: AppColors.white),
                const SizedBox(width: 12),
                Expanded(child: Text('Error: $e')),
              ],
            ),
            backgroundColor: AppColors.kDanger,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final patientName = widget.prescription['patientName'] ?? 'Unknown Patient';
    final patientPhone = widget.prescription['patientPhone'] ?? '';
    final patientId = widget.prescription['patientId'] ?? '';
    final createdAt = widget.prescription['createdAt'] != null
        ? DateTime.tryParse(widget.prescription['createdAt'])
        : null;
    final notes = widget.prescription['notes'] ?? '';
    final pharmacyItems = widget.prescription['pharmacyItems'] as List? ?? [];
    final total = widget.prescription['total'] ?? 0;
    final paid = widget.prescription['paid'] ?? false;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 700),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primary600],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.receipt_long_rounded, color: AppColors.white),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Prescription Details',
                          style: GoogleFonts.lexend(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppColors.white,
                          ),
                        ),
                        if (createdAt != null)
                          Text(
                            DateFormat('MMM dd, yyyy - hh:mm a').format(createdAt),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: AppColors.white.withOpacity(0.9),
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: AppColors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  // Patient Info Card
                  _buildInfoCard(
                    'Patient Information',
                    Icons.person_rounded,
                    [
                      _buildInfoRow('Name', patientName),
                      if (patientPhone.isNotEmpty) _buildInfoRow('Phone', patientPhone),
                      if (patientId.isNotEmpty) _buildInfoRow('Patient ID', patientId),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Medicines
                  _buildInfoCard(
                    'Prescribed Medicines',
                    Icons.local_pharmacy_rounded,
                    [
                      ...pharmacyItems.asMap().entries.map((entry) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _EnhancedMedicineRow(
                            item: entry.value,
                            index: entry.key,
                          ),
                        );
                      }).toList(),
                    ],
                  ),

                  if (notes.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _buildInfoCard(
                      'Clinical Notes',
                      Icons.description_rounded,
                      [
                        Text(
                          notes,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppColors.kTextPrimary,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Financial Summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.kSuccess.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.kSuccess.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Total Amount',
                          style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                        Text(
                          '₹${total.toStringAsFixed(2)}',
                          style: GoogleFonts.lexend(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppColors.kSuccess,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Payment Status
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: (paid ? AppColors.kSuccess : AppColors.kWarning).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: (paid ? AppColors.kSuccess : AppColors.kWarning).withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          paid ? Icons.check_circle_rounded : Icons.pending_rounded,
                          color: paid ? AppColors.kSuccess : AppColors.kWarning,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          paid ? 'Payment Completed' : 'Payment Pending',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.kTextPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Actions
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.grey50,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isDownloading ? null : _downloadPrescription,
                      icon: _isDownloading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.download_rounded),
                      label: Text(_isDownloading ? 'Downloading...' : 'Download'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.check_rounded),
                      label: const Text('Close'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
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

  Widget _buildInfoCard(String title, IconData icon, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: GoogleFonts.lexend(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.kTextSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.kTextPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
