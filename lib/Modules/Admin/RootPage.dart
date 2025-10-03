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

import '../../Utils/Colors.dart'; // Use centralized AppColors

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

/// Chatbot widget adapted to AppColors (same style as DoctorRootPage)
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
  final ScrollController _scrollController = ScrollController();

  final List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  bool _isSending = false;
  bool _disposed = false;

  @override
  void initState() {
    super.initState();
    // Optionally seed welcome message
    _messages.add({'sender': 'system', 'text': 'Welcome to Movi Assistant', 'time': DateTime.now()});
  }

  @override
  void dispose() {
    _disposed = true;
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_controller.text.trim().isEmpty || _isSending) return;
    final text = _controller.text.trim();
    setState(() {
      _messages.add({'sender': 'user', 'text': text, 'time': DateTime.now()});
      _messages.add({'sender': 'bot', 'text': 'Thinking...', 'time': DateTime.now(), 'loading': true});
      _isSending = true;
    });
    _controller.clear();
    _scrollToBottomDelayed();

    // Simulate bot response (replace with AuthService call if needed)
    Future.delayed(const Duration(milliseconds: 600), () {
      if (_disposed) return;
      setState(() {
        _messages.removeWhere((m) => m['loading'] == true);
        _messages.add({'sender': 'bot', 'text': 'This is a simulated bot reply to "$text"', 'time': DateTime.now()});
        _isSending = false;
      });
      _scrollToBottomDelayed();
    });
  }

  void _scrollToBottomDelayed() {
    Future.delayed(const Duration(milliseconds: 120), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget _buildMessageTile(Map<String, dynamic> msg) {
    final sender = (msg['sender'] ?? 'system').toString();
    final text = (msg['text'] ?? '').toString();
    final isUser = sender == 'user';
    final isSystem = sender == 'system';
    final loading = msg['loading'] == true;

    final bgColor = isUser ? AppColors.primary : (isSystem ? AppColors.grey200 : AppColors.grey100);
    final txtColor = isUser ? AppColors.white : AppColors.kTextPrimary;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 2,
              offset: const Offset(0, 1),
            )
          ],
        ),
        child: loading
            ? Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(width: 4),
            SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2.5, valueColor: AlwaysStoppedAnimation<Color>(txtColor))),
            const SizedBox(width: 12),
            Text('Thinking...', style: GoogleFonts.poppins(color: txtColor, fontWeight: FontWeight.w500)),
          ],
        )
            : Text(text, style: GoogleFonts.poppins(color: txtColor)),
      ),
    );
  }

  Widget _buildWelcomeScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.handshake_outlined,
            size: 80,
            color: AppColors.primary,
          ),
          const SizedBox(height: 24),
          Text(
            'Hello Admin',
            style: GoogleFonts.poppins(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40.0),
            child: Text(
              'Ask Movi about staff, payroll, inventory or patients.',
              style: GoogleFonts.poppins(color: AppColors.kTextSecondary, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const double sidebarWidth = 320.0;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 10,
      child: SizedBox(
        height: widget.isMaximized ? MediaQuery.of(context).size.height * 0.86 : 520,
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
                border: Border(bottom: BorderSide(color: AppColors.grey200, width: 1)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Movi Assistant',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.kTextPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Conversation History',
                    icon: Icon(Icons.list_alt_outlined, color: AppColors.kTextSecondary),
                    onPressed: () {}, // optional hook
                  ),
                  IconButton(
                    tooltip: widget.isMaximized ? "Restore Size" : "Maximize",
                    icon: Icon(widget.isMaximized ? Icons.fullscreen_exit : Icons.fullscreen, color: AppColors.kTextSecondary),
                    onPressed: widget.onToggleSize,
                  ),
                  IconButton(
                    tooltip: "Close",
                    icon: const Icon(Icons.close, color: Colors.redAccent),
                    onPressed: widget.onClose,
                  ),
                ],
              ),
            ),

            // Messages & Sidebar
            Expanded(
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: _messages.isEmpty ? _buildWelcomeScreen() : ListView.builder(
                        controller: _scrollController,
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          return _buildMessageTile(_messages[index]);
                        },
                      ),
                    ),
                  ),

                  // (Optional) sidebar placeholder - left out for brevity; can be added same way as Doctor page
                ],
              ),
            ),

            // Input
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      enabled: !_isSending,
                      textInputAction: TextInputAction.send,
                      style: GoogleFonts.poppins(color: AppColors.kTextPrimary),
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: GoogleFonts.poppins(color: AppColors.kTextSecondary),
                        filled: true,
                        fillColor: AppColors.grey100,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.primary, width: 2)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 48,
                    height: 48,
                    child: Material(
                      color: AppColors.primary,
                      shape: const CircleBorder(),
                      elevation: 4,
                      child: IconButton(
                        tooltip: "Send Message",
                        icon: Icon(Icons.send, color: AppColors.white, size: 22),
                        onPressed: _isSending ? null : _sendMessage,
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
}
