import 'dart:async';

import 'package:flutter/material.dart';
import 'package:glowhair/Modules/Doctor/widgets/Appoimentstable.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import '../Common/ChatbotWidget.dart'; // Import the common chatbot widget
import '../Common/LoginPage.dart';
import 'DashboardPageNew.dart'; // NEW ENTERPRISE DASHBOARD
import 'PatientsPage.dart';
import 'SchedulePageNew.dart'; // NEW ENTERPRISE SCHEDULE
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
        'screen': const EnterpriseDoctorDashboard(), // NEW DASHBOARD
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
        'screen': const EnterpriseScheduleScreen(), // NEW ENTERPRISE SCHEDULE
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

  final double expandedWidth = 280;
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
    return AnimatedBuilder(
      animation: _widthAnimation,
      builder: (context, child) {
        return Container(
          width: _widthAnimation.value,
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            border: Border(right: BorderSide(color: AppColors.kMuted, width: 1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hamburger & Logo
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Tooltip(
                      message: _isCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
                      child: InkWell(
                        onTap: _toggleSidebar,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: 40,
                          height: 40,
                          alignment: Alignment.center,
                          child: Icon(
                            _isCollapsed ? Icons.menu_open : Icons.menu,
                            size: 24,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    if (!_isCollapsed) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Karur Gastro Foundation',
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.lexend(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: widget.navItems.length,
                  itemBuilder: (context, index) {
                    final item = widget.navItems[index];
                    final isSelected = widget.selectedIndex == index;
                    return Tooltip(
                      message: item['label'],
                      waitDuration: const Duration(milliseconds: 500),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        child: Material(
                          color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            onTap: () => widget.onItemTapped(index),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    item['icon'],
                                    color: isSelected ? AppColors.primary : AppColors.kTextSecondary,
                                    size: 22,
                                  ),
                                  if (!_isCollapsed) ...[
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Text(
                                        item['label'],
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                          color: isSelected ? AppColors.primary : AppColors.kTextPrimary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              _buildUserProfile(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildUserProfile() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(border: Border(top: BorderSide(color: AppColors.kMuted, width: 1))),
      child: _isCollapsed ? _buildCollapsedProfile() : _buildExpandedProfile(),
    );
  }

  Widget _buildCollapsedProfile() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Tooltip(
          message: 'User Profile',
          child: CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Icon(Iconsax.user, color: AppColors.primary, size: 20),
          ),
        ),
        const SizedBox(height: 8),
        Tooltip(
          message: 'Logout',
          child: InkWell(
            onTap: () async {
              await AuthService.instance.signOut();
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginPage()),
                );
              }
            },
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.all(8),
              child: Icon(
                Iconsax.logout,
                color: AppColors.kDanger,
                size: 20,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildExpandedProfile() {
    return Row(
      children: [
        Tooltip(
          message: 'User Profile',
          child: CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Icon(Iconsax.user, color: AppColors.primary, size: 20),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Doctor',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                'doctor@hms.com',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppColors.kTextSecondary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 4),
        Tooltip(
          message: 'Logout',
          child: IconButton(
            icon: Icon(Iconsax.logout, color: AppColors.kDanger),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginPage()),
                );
              }
            },
            iconSize: 20,
          ),
        ),
      ],
    );
  }
}


// ChatbotWidget is now imported from Common folder