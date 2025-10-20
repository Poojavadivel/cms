// AdminRootPage.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../Utils/Colors.dart';
import '../Common/ChatbotWidget.dart'; // Import the common chatbot widget
import 'AppoimentsScreen.dart';
import 'DashboardPage.dart';
import 'HelpPage.dart';
import 'InvoicePage.dart';
import 'PathalogyScreen.dart';
import 'PatientsPage.dart';
import 'PharmacyPage.dart';
import 'SettingsPage.dart';
import 'StaffPage.dart';

class AdminRootPage extends StatefulWidget {
  const AdminRootPage({super.key});

  @override
  State<AdminRootPage> createState() => _AdminRootPageState();
}

class _AdminRootPageState extends State<AdminRootPage> {
  int _selectedIndex = 0;
  bool _isChatbotOpen = false;
  bool _isChatbotMaximized = false;

  late final List<Map<String, dynamic>> _navItems;

  @override
  void initState() {
    super.initState();

    _navItems = [
      {
        'icon': Iconsax.category,
        'label': 'Dashboard',
        'screen': const DashboardPage(),
      },
      {
        'icon': Iconsax.calendar,
        'label': 'Appointments',
        'screen': const AdminAppointmentsScreen(),
      },
      {
        'icon': Iconsax.user,
        'label': 'Patients',
        'screen': const PatientsScreen(),
      },
      {
        'icon': Iconsax.profile_2user,
        'label': 'Staff',
        'screen': const StaffScreen(),
      },


      {
        'icon': Icons.receipt_long_rounded,
        'label': 'Payroll',
        'screen': const PayrollScreen(),
      },
      {
        'icon': Icons.biotech_rounded,
        'label': 'Pathology',
        'screen': const PathologyScreen(),
      },
      {
        'icon': Icons.local_pharmacy_rounded,
        'label': 'Pharmacy',
        'screen': const PharmacyScreen(),
      },
      {
        'icon': Iconsax.setting_2,
        'label': 'Settings',
        'screen': const SettingsScreen(),
      },
      {
        'icon': Icons.help_outline_rounded,
        'label': 'Help & feedback',
        'screen': const HelpScreen(),
      },
    ];
  }

  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
  }

  void _toggleChatbot() {
    setState(() {
      _isChatbotOpen = !_isChatbotOpen;
      if (!_isChatbotOpen) _isChatbotMaximized = false;
    });
  }

  void _toggleChatbotSize() => setState(() => _isChatbotMaximized = !_isChatbotMaximized);

  @override
  Widget build(BuildContext context) {
    final Widget selectedScreen = _navItems[_selectedIndex]['screen'] as Widget;
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Row(
            children: <Widget>[
              AdminSidebarNavigation(
                selectedIndex: _selectedIndex,
                onItemTapped: _onItemTapped,
                navItems: _navItems,
              ),
              Expanded(child: selectedScreen),
            ],
          ),

          // Chatbot window
          if (_isChatbotOpen)
            Positioned(
              bottom: 32,
              right: 32,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                width: _isChatbotMaximized ? 800 : 350,
                height: _isChatbotMaximized ? screenSize.height * 0.79 : 500,
                child: ChatbotWidget(
                  onClose: _toggleChatbot,
                  onToggleSize: _toggleChatbotSize,
                  isMaximized: _isChatbotMaximized,
                ),
              ),
            ),

          // Chatbot launcher (closed)
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

/// Collapsible Sidebar (stateful)
class AdminSidebarNavigation extends StatefulWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;
  final List<Map<String, dynamic>> navItems;

  const AdminSidebarNavigation({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
    required this.navItems,
  });

  @override
  State<AdminSidebarNavigation> createState() => _AdminSidebarNavigationState();
}

class _AdminSidebarNavigationState extends State<AdminSidebarNavigation> with SingleTickerProviderStateMixin {
  bool _isCollapsed = false;
  late final AnimationController _animationController;
  late final Animation<double> _widthAnimation;

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
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeInOut));
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
    final mainNavItems = widget.navItems.take(7).toList();
    final bottomNavItems = widget.navItems.skip(7).toList();

    return AnimatedBuilder(
      animation: _widthAnimation,
      builder: (context, child) {
        return Container(
          width: _widthAnimation.value,
          color: AppColors.cardBackground,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // hamburger + title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
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
                          constraints: BoxConstraints(maxWidth: expandedWidth - 60),
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

              // main nav list
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

              // bottom nav items
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
              border: isSelected ? Border(left: BorderSide(color: AppColors.primary, width: 4)) : null,
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
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
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
