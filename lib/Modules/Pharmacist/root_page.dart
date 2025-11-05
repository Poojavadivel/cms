import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';
import '../Common/LoginPage.dart';
import 'dashboard_page.dart';
import 'medicines_page_enterprise.dart'; // Changed to enterprise version
import 'prescriptions_page.dart';
import 'settings_page.dart';

/// Main Pharmacist Root Page with navigation
class PharmacistRootPage extends StatefulWidget {
  const PharmacistRootPage({super.key});

  @override
  State<PharmacistRootPage> createState() => _PharmacistRootPageState();
}

class _PharmacistRootPageState extends State<PharmacistRootPage>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  bool _isCollapsed = false;

  late List<Map<String, dynamic>> _navItems;
  late AnimationController _animationController;
  late Animation<double> _widthAnimation;

  final double expandedWidth = 280;
  final double collapsedWidth = 72;

  @override
  void initState() {
    super.initState();
    _buildNavItems();
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

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _buildNavItems() {
    _navItems = [
      {'icon': Iconsax.chart_square, 'label': 'Dashboard'},
      {'icon': Iconsax.health, 'label': 'Medicines'},
      {'icon': Iconsax.note_text, 'label': 'Prescriptions'},
      {'icon': Iconsax.setting_2, 'label': 'Settings'},
    ];
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

  List<Widget> get _pages => [
    const PharmacistDashboardPage(),
    const PharmacistMedicinesPageEnterprise(), // Changed to enterprise version
    const PharmacistPrescriptionsPage(),
    const PharmacistSettingsPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.kBg,
      body: Row(
        children: [
          _buildSidebar(),
          Expanded(
            child: Column(
              children: [
                _buildTopBar(),
                Expanded(child: _pages[_selectedIndex]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar() {
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
                  itemCount: _navItems.length,
                  itemBuilder: (context, index) {
                    final item = _navItems[index];
                    final isSelected = _selectedIndex == index;
                    return Tooltip(
                      message: item['label'],
                      waitDuration: const Duration(milliseconds: 500),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        child: Material(
                          color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            onTap: () => setState(() => _selectedIndex = index),
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

  Widget _buildTopBar() {
    return Container(
      height: 70,
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        border: Border(bottom: BorderSide(color: AppColors.kMuted, width: 1)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: [
          Text(_navItems[_selectedIndex]['label'], style: GoogleFonts.lexend(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.kTextPrimary)),
          const Spacer(),
          IconButton(icon: const Icon(Iconsax.notification), onPressed: () {}, tooltip: 'Notifications'),
        ],
      ),
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
                'Pharmacist',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                'pharmacist@hms.com',
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
