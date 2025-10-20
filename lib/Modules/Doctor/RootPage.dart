import 'dart:async';

import 'package:flutter/material.dart';
import 'package:glowhair/Modules/Doctor/widgets/Appoimentstable.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import '../Common/ChatbotWidget.dart'; // Import the common chatbot widget
import 'AppoimentsPage.dart';
import 'DashboardPage.dart';
import 'PatientsPage.dart';
import 'SchedulePage.dart';
import 'SettingsPAge.dart';

// --- Main Doctor Root Page Widget ---
class DoctorRootPage extends StatefulWidget {
  const DoctorRootPage({super.key});

  @override
  State<DoctorRootPage> createState() => _DoctorRootPageState();
}

class _DoctorRootPageState extends State<DoctorRootPage> {
  int _selectedIndex = 0;
  bool _isChatbotOpen = false;
  bool _isChatbotMaximized = false;

  String _searchQuery = '';
  int _currentPage = 0;

  bool _loading = false;
  List<DashboardAppointments> _appointments = [];

  late List<Map<String, dynamic>> _navItems;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
    _buildNavItems();
  }

  Future<void> _loadAppointments() async {
    setState(() => _loading = true);
    try {
      final data = await AuthService.instance.fetchAppointments();
      setState(() {
        _appointments = data;
      });
    } catch (e) {
      debugPrint("❌ Error fetching appointments: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed to load appointments: $e")),
      );
    } finally {
      setState(() => _loading = false);
      _buildNavItems();
    }
  }

  void _buildNavItems() {
    _navItems = [
      {
        'icon': Iconsax.category,
        'label': 'Dashboard',
        'screen': const DoctorDashboardScreen(),
      },
      {
        'icon': Iconsax.calendar,
        'label': 'Appointments',
        'screen': AppointmentTable(
          appointments: _appointments,
          onShowAppointmentDetails: _showAppointmentDetails,
          onNewAppointmentPressed: _onNewAppointmentPressed,
          searchQuery: _searchQuery,
          onSearchChanged: _updateSearchQuery,
          currentPage: _currentPage,
          onNextPage: _goToNextPage,
          onPreviousPage: _goToPreviousPage,
          onDeleteAppointment: _deleteAppointment,
          onRefreshRequested: _loadAppointments,
          isLoading: _loading,
        ),
      },
      {
        'icon': Iconsax.profile_2user,
        'label': 'Patients',
        'screen': const PatientsScreen(),
      },
      {
        'icon': Iconsax.task,
        'label': 'My Schedule',
        'screen': const DoctorScheduleScreen(),
      },
      {
        'icon': Iconsax.setting_2,
        'label': 'Settings',
        'screen': const DoctorSettingsScreen(),
      },
    ];
  }

  // ========== Appointment Handlers ==========
  void _showAppointmentDetails(DashboardAppointments appt) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('Details for ${appt.patientName}'),
        ),
      ),
    );
  }

  void _onNewAppointmentPressed() async {
    debugPrint("➕ New Appointment Pressed");
    await _loadAppointments();
  }

  void _deleteAppointment(DashboardAppointments appt) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Appointment"),
        content: Text("Are you sure you want to delete ${appt.patientName}?"),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text("Cancel")),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text("Delete",
                  style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final success = await AuthService.instance.deleteAppointment(appt.id);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content:
          Text("🗑️ Appointment for ${appt.patientName} deleted successfully"),
          backgroundColor: AppColors.kSuccess,
        ));
        await _loadAppointments();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text("💥 Error while deleting ${appt.patientName}: $e"),
        backgroundColor: AppColors.kDanger,
      ));
    }
  }

  void _updateSearchQuery(String value) {
    setState(() {
      _searchQuery = value;
      _currentPage = 0;
      _buildNavItems();
    });
  }

  void _goToNextPage() {
    setState(() {
      _currentPage++;
      _buildNavItems();
    });
  }

  void _goToPreviousPage() {
    setState(() {
      if (_currentPage > 0) _currentPage--;
      _buildNavItems();
    });
  }

  // ========== Navigation ==========
  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
  }

  // ========== Chatbot ==========
  void _toggleChatbot() {
    setState(() {
      _isChatbotOpen = !_isChatbotOpen;
      if (!_isChatbotOpen) _isChatbotMaximized = false;
    });
  }

  void _toggleChatbotSize() {
    setState(() => _isChatbotMaximized = !_isChatbotMaximized);
  }

  @override
  Widget build(BuildContext context) {
    final Widget selectedScreen = _navItems[_selectedIndex]['screen'];
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Row(
            children: <Widget>[
              DoctorSidebarNavigation(
                selectedIndex: _selectedIndex,
                onItemTapped: _onItemTapped,
                navItems: _navItems,
              ),
              Expanded(child: selectedScreen),
            ],
          ),
          if (_isChatbotOpen)
            Positioned(
              bottom: 32,
              right: 32,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: _isChatbotMaximized ? 800 : 350,
                height: _isChatbotMaximized ? screenSize.height * 0.79 : 500,
                child: ChatbotWidget(
                  onClose: _toggleChatbot,
                  onToggleSize: _toggleChatbotSize,
                  isMaximized: _isChatbotMaximized,
                ),
              ),
            ),
          if (!_isChatbotOpen)
            Positioned(
              bottom: 32,
              right: 32,
              child: GestureDetector(
                onTap: _toggleChatbot,
                child: Column(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/chatbotimg.png',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Ask Movi',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        color: AppColors.kTextPrimary,
                      ),
                    )
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// --- Sidebar Navigation for Doctor ---
class DoctorSidebarNavigation extends StatefulWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;
  final List<Map<String, dynamic>> navItems;

  const DoctorSidebarNavigation({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
    required this.navItems,
  });

  @override
  State<DoctorSidebarNavigation> createState() =>
      _DoctorSidebarNavigationState();
}

class _DoctorSidebarNavigationState extends State<DoctorSidebarNavigation>
    with SingleTickerProviderStateMixin {
  bool _isCollapsed = false;
  late AnimationController _animationController;
  late Animation<double> _widthAnimation;

  final double expandedWidth = 256;
  final double collapsedWidth = 72;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _widthAnimation = Tween<double>(
      begin: expandedWidth,
      end: collapsedWidth,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  void _toggleSidebar() {
    setState(() {
      _isCollapsed = !_isCollapsed;
      if (_isCollapsed) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mainNavItems = widget.navItems.take(4).toList();
    final bottomNavItems = widget.navItems.skip(4).toList();

    return AnimatedBuilder(
      animation: _widthAnimation,
      builder: (context, child) {
        return Container(
          width: _widthAnimation.value,
          color: AppColors.cardBackground,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hamburger & Logo
              Padding(
                padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: _toggleSidebar,
                        child: Container(
                          width: 30,
                          alignment: Alignment.center,
                          child: Icon(
                            _isCollapsed ? Icons.menu_open : Icons.menu,
                            size: 30,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      if (!_isCollapsed) ...[
                        const SizedBox(width: 12),
                        ConstrainedBox(
                          constraints:
                          BoxConstraints(maxWidth: expandedWidth - 60),
                          child: Text(
                            'Karur Gastro Foundation',
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.lexend(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              Divider(height: 1, color: AppColors.grey200),
              // Main Nav Items
              Expanded(
                child: ListView.builder(
                  itemCount: mainNavItems.length,
                  itemBuilder: (context, index) {
                    final item = mainNavItems[index];
                    return _buildNavItem(
                      icon: item['icon'] as IconData,
                      label: item['label'] as String,
                      isSelected: widget.selectedIndex == index,
                      onTap: () => widget.onItemTapped(index),
                    );
                  },
                ),
              ),
              Divider(height: 1, color: AppColors.grey200),
              // Bottom Nav Items
              ...List.generate(bottomNavItems.length, (index) {
                final item = bottomNavItems[index];
                final actualIndex = index + mainNavItems.length;
                return _buildNavItem(
                  icon: item['icon'] as IconData,
                  label: item['label'] as String,
                  isSelected: widget.selectedIndex == actualIndex,
                  onTap: () => widget.onItemTapped(actualIndex),
                );
              }),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final color = isSelected ? AppColors.primary : AppColors.kTextSecondary;

    return Tooltip(
      message: label,
      waitDuration: const Duration(milliseconds: 500),
      child: Material(
        color: isSelected ? AppColors.primary600.withOpacity(0.08) : Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              border: isSelected
                  ? Border(
                left: BorderSide(color: AppColors.primary, width: 4),
              )
                  : null,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: color, size: 22),
                if (!_isCollapsed) ...[
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      label,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.lexend(
                        color: color,
                        fontSize: 15,
                        fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.w500,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ],
                if (_isCollapsed) const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


// ChatbotWidget is now imported from Common folder