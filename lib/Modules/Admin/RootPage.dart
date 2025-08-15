import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:ui';
import 'AppoimentsScreen.dart';
import 'DashboardPage.dart';
import 'HelpPage.dart';
import 'InvoicePage.dart';
import 'PathalogyScreen.dart';
import 'PatientsPage.dart';
import 'PharmacyPage.dart';
import 'SettingsPage.dart';
import 'StaffPage.dart';

// --- App Theme Colors ---
const Color primaryColor = Color(0xFFEF4444);
const Color primaryColorLight = Color(0xFFFEE2E2);
const Color backgroundColor = Color(0xFFF8FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// --- Main Root Page Widget ---
class AdminRootPage extends StatefulWidget {
  const AdminRootPage({super.key});

  @override
  State<AdminRootPage> createState() => _AdminRootPageState();
}

class _AdminRootPageState extends State<AdminRootPage> {
  int _selectedIndex = 0;
  bool _isChatbotOpen = false;
  bool _isChatbotMaximized = false;

  final List<Map<String, dynamic>> _navItems = [
    {'icon': Icons.dashboard_rounded, 'label': 'Dashboard', 'screen': const DashboardScreen()},
    {'icon': Icons.groups_rounded, 'label': 'Staff', 'screen': const StaffScreen()},
    {'icon': Icons.calendar_today_rounded, 'label': 'Appointments', 'screen': const AppointmentsScreen()},
    {'icon': Icons.personal_injury_rounded, 'label': 'Patients', 'screen': const PatientsScreen()},
    {'icon': Icons.receipt_long_rounded, 'label': 'Invoice', 'screen': const InvoiceScreen()},
    {'icon': Icons.biotech_rounded, 'label': 'Pathology', 'screen': const PathologyScreen()},
    {'icon': Icons.local_pharmacy_rounded, 'label': 'Pharmacy', 'screen': const PharmacyScreen()},
    {'icon': Icons.settings_rounded, 'label': 'Settings', 'screen': const SettingsScreen()},
    {'icon': Icons.help_outline_rounded, 'label': 'Help & feedback', 'screen': const HelpScreen()},
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  void _toggleChatbot() {
    setState(() {
      _isChatbotOpen = !_isChatbotOpen;
      if (!_isChatbotOpen) {
        _isChatbotMaximized = false; // Reset size when closing
      }
    });
  }

  void _toggleChatbotSize() {
    setState(() {
      _isChatbotMaximized = !_isChatbotMaximized;
    });
  }

  @override
  Widget build(BuildContext context) {
    final Widget selectedScreen = _navItems[_selectedIndex]['screen'];
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Stack(
        children: [
          Row(
            children: <Widget>[
              SidebarNavigation(
                selectedIndex: _selectedIndex,
                onItemTapped: _onItemTapped,
                navItems: _navItems,
              ),
              Expanded(
                child: selectedScreen,
              ),
            ],
          ),
          // Chatbot Window
          if (_isChatbotOpen)
            Positioned(
              bottom: 32,
              right: 32,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                width: _isChatbotMaximized ? 800 : 350,
                height: _isChatbotMaximized ? screenSize.height * 0.88 : 500,
                child: ChatbotWidget(
                  onClose: _toggleChatbot,
                  onToggleSize: _toggleChatbotSize,
                  isMaximized: _isChatbotMaximized,
                ),
              ),
            ),
          // Chatbot Launcher Icon
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
    child: ClipOval( // Ensures no overflow outside circle
    child: Image.asset(
    'assets/chatbotimg.png',
    fit: BoxFit.cover, // Zooms in and fills circle
    alignment: Alignment.center,
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

// --- Sidebar Navigation ---
class SidebarNavigation extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;
  final List<Map<String, dynamic>> navItems;

  const SidebarNavigation({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
    required this.navItems,
  });

  @override
  Widget build(BuildContext context) {
    final mainNavItems = navItems.take(7).toList();
    final bottomNavItems = navItems.skip(7).toList();

    return Container(
      width: 256,
      color: cardBackgroundColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
            child: Text(
              'Glow Skin & Gro Hair',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          Divider(height: 1, color: Colors.grey[200]),
          Expanded(
            child: ListView.builder(
              itemCount: mainNavItems.length,
              itemBuilder: (context, index) {
                final item = mainNavItems[index];
                return _buildNavItem(
                  context,
                  icon: item['icon'] as IconData,
                  label: item['label'] as String,
                  isSelected: selectedIndex == index,
                  onTap: () => onItemTapped(index),
                );
              },
            ),
          ),
          Divider(height: 1, color: Colors.grey[200]),
          ...List.generate(bottomNavItems.length, (index) {
            final item = bottomNavItems[index];
            final actualIndex = index + mainNavItems.length;
            return _buildNavItem(
              context,
              icon: item['icon'] as IconData,
              label: item['label'] as String,
              isSelected: selectedIndex == actualIndex,
              onTap: () => onItemTapped(actualIndex),
            );
          }),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, {required IconData icon, required String label, required bool isSelected, required VoidCallback onTap}) {
    final color = isSelected ? Theme.of(context).colorScheme.primary : textSecondaryColor;

    return Material(
      color: isSelected ? Theme.of(context).colorScheme.primary.withOpacity(0.1) : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: isSelected ? Border(left: BorderSide(color: Theme.of(context).colorScheme.primary, width: 4)) : null,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Row(
            children: [
              Icon(icon, color: color),
              const SizedBox(width: 16),
              Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w500, fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }
}

// --- Chatbot Widget ---
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
    if (_controller.text.isNotEmpty) {
      setState(() {
        _messages.add(_controller.text);
        _messages.add('Bot: You said "${_controller.text}"');
        _controller.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 10,
      child: Column(
        children: [
          // Chatbot Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('MOVI Assistant', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
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
          // Messages
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
                        style: GoogleFonts.poppins(
                          color: isUserMessage ? Colors.white : textPrimaryColor,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          // Input Field
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
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: primaryColor),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
