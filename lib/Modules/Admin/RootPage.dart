// AdminRootPage.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import 'AppoimentsScreen.dart';
import 'DashboardPage.dart';
import 'HelpPage.dart';
import 'InvoicePage.dart';
import 'PathalogyScreen.dart';
import 'PatientsPage.dart';
import 'PharmacyPage.dart';
import 'SettingsPage.dart';
import 'StaffPage.dart';

/// Theme tokens (shared with Doctor root page)
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

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

    // Use Iconsax where available; fallback to Material for specialized icons.
    _navItems = [
      {
        'icon': Iconsax.category,
        'label': 'Dashboard',
        'screen': const DashboardPage(),
      },
      {
        'icon': Iconsax.profile_2user,
        'label': 'Staff',
        'screen': const StaffScreen(),
      },
      {
        'icon': Iconsax.calendar,
        'label': 'Appointments',
        'screen': const AppointmentsScreen(),
      },
      {
        'icon': Iconsax.user,
        'label': 'Patients',
        'screen': const PatientsScreen(),
      },
      {
        // Material icon for invoice (safe)
        'icon': Icons.receipt_long_rounded,
        'label': 'Invoice',
        'screen': const InvoiceScreen(),
      },
      {
        // Material icon: Iconsax lacks 'biotech' — use Material
        'icon': Icons.biotech_rounded,
        'label': 'Pathology',
        'screen': const PathologyScreen(),
      },
      {
        // Material icon for pharmacy
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
        // help: use Material to be safe
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
      backgroundColor: backgroundColor,
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

          // Chatbot window (same sizes & animation as doctor page)
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

          // Chatbot launcher (closed state)
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
                        color: primaryColor,
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.4),
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
                        color: textPrimaryColor,
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

/// Collapsible Sidebar (stateful) — contains working hamburger open/close
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

class _AdminSidebarNavigationState extends State<AdminSidebarNavigation>
    with SingleTickerProviderStateMixin {
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
          color: cardBackgroundColor,
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
                            color: primaryColor,
                          ),
                        ),
                      ),
                      if (!_isCollapsed) ...[
                        const SizedBox(width: 12),
                        ConstrainedBox(
                          constraints: BoxConstraints(maxWidth: expandedWidth - 60),
                          child: Text(
                            'Glow Skin & Gro Hair',
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.lexend(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: primaryColor,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              Divider(height: 1, color: Colors.grey[200]),

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

              Divider(height: 1, color: Colors.grey[200]),

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
    final color = isSelected ? primaryColor : textSecondaryColor;

    return Material(
      color: isSelected ? primaryColorLight : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: isSelected ? const Border(left: BorderSide(color: primaryColor, width: 4)) : null,
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
    );
  }
}

/// Chatbot (same visuals as DoctorRootPage)
class ChatbotWidget extends StatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onToggleSize;
  final bool isMaximized;

  const ChatbotWidget({
    super.key,
    required this.onClose,
    required this.onToggleSize,
    required this.isMaximized,
  });

  @override
  State<ChatbotWidget> createState() => _ChatbotWidgetState();
}

class _ChatbotWidgetState extends State<ChatbotWidget> {
  final TextEditingController _controller = TextEditingController();
  final List<String> _messages = [];

  void _sendMessage() {
    if (_controller.text.isEmpty) return;
    setState(() {
      _messages.add(_controller.text);
      _messages.add('Bot: You said "${_controller.text}"');
      _controller.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 10,
      child: Column(
        children: [
          // header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Movi Assistant', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    IconButton(
                      icon: Icon(widget.isMaximized ? Icons.fullscreen_exit : Icons.fullscreen),
                      onPressed: widget.onToggleSize,
                      color: textSecondaryColor,
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: widget.onClose,
                      color: textSecondaryColor,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // messages
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: ListView.builder(
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final isUserMessage = !_messages[index].startsWith('Bot:');
                  return Align(
                    alignment: isUserMessage ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isUserMessage ? primaryColor : Colors.grey[200],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _messages[index],
                        style: GoogleFonts.poppins(color: isUserMessage ? Colors.white : textPrimaryColor),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // input
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      filled: true,
                      fillColor: Colors.grey[100],
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(icon: const Icon(Icons.send, color: primaryColor), onPressed: _sendMessage),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
