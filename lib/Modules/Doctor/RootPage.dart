import 'dart:async';

import 'package:flutter/material.dart';
import 'package:glowhair/Modules/Doctor/widgets/Appoimentstable.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';

import '../../Models/dashboardmodels.dart';
import '../../Services/Authservices.dart';
import 'AppoimentsPage.dart';
import 'DashboardPage.dart';
import 'PatientsPage.dart';
import 'SchedulePage.dart';
import 'SettingsPAge.dart';
import '../../Utils/Colors.dart'; // <-- Your new AppColors file

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


// End placeholder

// -----------------------------------------------------------------------------


// NOTE: AppColors and AuthService are external dependencies assumed to be defined elsewhere.

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
  String? _conversationId;
  String _conversationTitle = 'New Chat'; // Default title for new chats
  bool _isLoading = true;
  bool _isSending = false;
  bool _disposed = false;

  List<Map<String, dynamic>> _conversations = [];
  bool _isLoadingConversations = false;
  bool _isSidebarOpen = false; // Controls whether the sidebar overlay is visible

  // typing animation helpers
  final Map<int, Timer> _typingTimers = {};
  final Map<int, String> _fullTextBuffer = {};

  @override
  void initState() {
    super.initState();
    _initConversationAndMessages();
  }

  @override
  void dispose() {
    _disposed = true;
    _stopAllTypingAnimations();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ------------------ Initialization ------------------
  Future<void> _initConversationAndMessages() async {
    setState(() => _isLoading = true);
    try {
      _isLoadingConversations = true;
      final convos = await AuthService.instance.getConversations();
      _isLoadingConversations = false;
      _conversations = convos;

      Map<String, dynamic>? convo;
      if (convos.isNotEmpty) {
        // Load the latest conversation if history exists
        convo = convos.first;
        _conversationId = (convo?['id'] ?? convo?['_id'] ?? convo?['chatId'])?.toString();
        _conversationTitle = convo?['title']?.toString() ?? (convo?['data']?['title']?.toString() ?? 'Chat');
      } else {
        // If no history, _conversationId remains null, showing the welcome screen.
        _conversationTitle = 'New Chat';
      }

      _messages.clear();
      if (_conversationId != null) {
        final msgs = await AuthService.instance.getConversationMessages(_conversationId!);
        _messages.addAll(msgs.map((m) => _normalizeServerMessage(m)).toList());
      }
    } catch (e) {
      if (!_disposed) {
        _messages.add({
          'sender': 'system',
          'text': 'Failed to load conversation: ${e.toString()}',
          'time': DateTime.now(),
        });
      }
    }

    if (!_disposed) {
      setState(() => _isLoading = false);
      _scrollToBottomDelayed();
    }
  }

  // ------------------ Normalize server messages ------------------
  Map<String, dynamic> _normalizeServerMessage(Map<String, dynamic> m) {
    final senderRaw = (m['sender'] ?? m['from'] ?? m['role'] ?? '').toString().toLowerCase();
    final text = (m['text'] ?? m['message'] ?? m['reply'] ?? m['body'] ?? '').toString();
    DateTime time;
    try {
      final rawTs = m['time'] ?? m['timestamp'] ?? m['createdAt'] ?? m['ts'] ?? m['created_at'];
      if (rawTs is String) {
        time = DateTime.tryParse(rawTs) ?? DateTime.now();
      } else if (rawTs is int) {
        time = DateTime.fromMillisecondsSinceEpoch(rawTs);
      } else {
        time = DateTime.now();
      }
    } catch (_) {
      time = DateTime.now();
    }

    final sender = (senderRaw.contains('bot') || senderRaw.contains('assistant'))
        ? 'bot'
        : (senderRaw.contains('user') ? 'user' : (senderRaw.isEmpty ? 'bot' : senderRaw));

    return {
      'id': m['id'] ?? m['_id'] ?? m['messageId'] ?? UniqueKey().toString(),
      'sender': sender,
      'text': text,
      'time': time,
    };
  }

  // ------------------ Sending messages ------------------
  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isSending) return;

    final isNewConversation = _conversationId == null;

    setState(() {
      _messages.add({'sender': 'user', 'text': text, 'time': DateTime.now()});
      _messages.add({'sender': 'bot', 'text': '', 'time': DateTime.now(), 'loading': true});
      _isSending = true;
    });

    _controller.clear();
    _scrollToBottomDelayed();
    final botIndex = _messages.length - 1;

    try {
      final reply = await AuthService.instance.sendChatMessage(
        text,
        conversationId: _conversationId,
        metadata: {'source': 'app', 'ts': DateTime.now().toIso8601String()},
      );

      if (_disposed) return;

      // FIX: If this was the first message, refresh the list to grab the new ID/Title.
      if (isNewConversation) {
        await _refreshConversationsSilently();
        if (_conversations.isNotEmpty) {
          final newConvo = _conversations.first; // Grab the newest chat
          _conversationId = (newConvo['id'] ?? newConvo['chatId'])?.toString();
          // Use the snippet of the first user message as the temporary title
          _conversationTitle = newConvo['title'] ?? text.substring(0, text.length.clamp(0, 30)) + '...';
        }
        if(mounted) setState(() {});
      }

      _startTypingAnimation(botIndex, reply ?? 'No response from server.');

      // Refresh to update snippet/updatedAt time in the sidebar list
      _refreshConversationsSilently();
      _scrollToBottomDelayed();
    } catch (e) {
      if (_disposed) return;
      setState(() {
        _messages[botIndex] = {
          'sender': 'system',
          'text': 'Failed to send: ${e.toString()}',
          'time': DateTime.now(),
        };
        _isSending = false;
      });
      _scrollToBottomDelayed();
    }
  }

  // ------------------ Typing animation (Simplified) ------------------
  void _startTypingAnimation(int botIndex, String fullText, {Duration charDelay = const Duration(milliseconds: 24)}) {
    _stopTypingAnimation(botIndex);

    _fullTextBuffer[botIndex] = fullText;
    int pos = 0;

    if (botIndex >= 0 && botIndex < _messages.length) {
      _messages[botIndex]['text'] = '';
      _messages[botIndex]['loading'] = true;
      if (mounted) setState(() {});
    }

    _typingTimers[botIndex] = Timer.periodic(charDelay, (t) {
      if (_disposed) {
        _stopTypingAnimation(botIndex);
        return;
      }
      final buffer = _fullTextBuffer[botIndex] ?? '';
      pos = pos + 1;
      final current = buffer.substring(0, pos.clamp(0, buffer.length));

      if (botIndex >= 0 && botIndex < _messages.length) {
        // Only update UI if the text actually changed to avoid unnecessary rebuilds
        if (_messages[botIndex]['text'] != current) {
          _messages[botIndex]['text'] = current;
          if (mounted) setState(() {});
        }
      }

      if (pos >= buffer.length) {
        _stopTypingAnimation(botIndex);
        if (botIndex >= 0 && botIndex < _messages.length) {
          _messages[botIndex]['loading'] = false;
          if (mounted) setState(() {});
        }
        _isSending = false;
      }
    });
  }

  void _stopTypingAnimation(int botIndex) {
    final timer = _typingTimers.remove(botIndex);
    if (timer != null && timer.isActive) timer.cancel();
    _fullTextBuffer.remove(botIndex);
  }

  void _stopAllTypingAnimations() {
    final keys = _typingTimers.keys.toList();
    for (final k in keys) {
      _stopTypingAnimation(k);
    }
  }

  // ------------------ Conversations UI & actions ------------------
  Future<void> _toggleConversationsSidebar() async {
    if (!_isSidebarOpen) {
      await _refreshConversationsSilently();
    }
    if (mounted) {
      setState(() {
        _isSidebarOpen = !_isSidebarOpen;
      });
    }
  }

  Widget _buildConversationsSidebar() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(-4, 0),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Text('Conversation History', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.kTextPrimary)),
                const Spacer(),
                IconButton(
                  tooltip: 'Start new conversation',
                  icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
                  onPressed: () async {
                    if (mounted) setState(() => _isSidebarOpen = false);
                    await _createAndOpenNewConversation();
                  },
                ),
                IconButton(
                  tooltip: 'Close',
                  icon: const Icon(Icons.close, color: AppColors.kTextSecondary),
                  onPressed: () {
                    if (mounted) setState(() => _isSidebarOpen = false);
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _isLoadingConversations
                ? const Center(child: CircularProgressIndicator())
                : _conversations.isEmpty
                ? Center(
              child: Text(
                'No previous chat',
                style: GoogleFonts.poppins(color: AppColors.kTextSecondary),
              ),
            )
                : ListView.separated(
              itemCount: _conversations.length,
              separatorBuilder: (_, __) => const Divider(height: 1, indent: 16, endIndent: 16),
              itemBuilder: (context, idx) {
                final c = _conversations[idx];
                final id = (c['id'] ?? c['_id'] ?? c['chatId'])?.toString() ?? '';
                final title = c['title'] ?? (c['snippet'] ?? 'Chat');
                final snippet = c['snippet'] ?? '';
                final isSelected = id == _conversationId;

                return ListTile(
                  tileColor: isSelected ? AppColors.grey100 : AppColors.white,
                  title: Text(title.toString(), overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: AppColors.kTextPrimary)),
                  subtitle: snippet.toString().isNotEmpty ? Text(snippet.toString(), maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 12, color: AppColors.kTextSecondary)) : null,
                  onTap: () async {
                    if (mounted) setState(() => _isSidebarOpen = false);
                    if (!isSelected) {
                      await _switchConversation(id, title.toString());
                    }
                  },
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                    tooltip: 'Delete conversation',
                    onPressed: () async {
                      final ok = await showDialog<bool>(
                        context: context,
                        builder: (dctx) => AlertDialog(
                          title: const Text('Confirm Deletion'),
                          content: Text('Are you sure you want to archive the conversation: "${title.toString()}"?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.of(dctx).pop(false), child: const Text('Cancel')),
                            TextButton(onPressed: () => Navigator.of(dctx).pop(true), child: Text('Delete', style: TextStyle(color: Colors.red))),
                          ],
                        ),
                      );
                      if (ok == true) {
                        await _deleteConversation(id);
                      }
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _refreshConversationsSilently() async {
    try {
      _isLoadingConversations = true;
      final convos = await AuthService.instance.getConversations();
      if (!_disposed) {
        setState(() {
          _conversations = convos;
        });
      }
    } catch (_) {
      // ignore silently
    } finally {
      _isLoadingConversations = false;
      if (mounted) setState(() {});
    }
  }

  Future<void> _switchConversation(String id, String title) async {
    _stopAllTypingAnimations();
    setState(() => _isLoading = true);
    try {
      _conversationId = id;
      _conversationTitle = title;
      final msgs = await AuthService.instance.getConversationMessages(_conversationId!);
      _messages.clear();
      _messages.addAll(msgs.map((m) => _normalizeServerMessage(m)).toList());
    } catch (e) {
      _messages.add({'sender': 'system', 'text': 'Failed to switch conversation: ${e.toString()}', 'time': DateTime.now()});
    } finally {
      if (!_disposed) {
        setState(() => _isLoading = false);
        _scrollToBottomDelayed();
      }
    }
  }

  Future<void> _createAndOpenNewConversation() async {
    // FIX: Properly resets the current conversation to null state
    _stopAllTypingAnimations();
    setState(() => _isLoading = true);
    try {
      _conversationId = null;
      _conversationTitle = 'New Chat';
      _messages.clear(); // Shows the welcome screen
      await _refreshConversationsSilently(); // Update sidebar list
    } catch (e) {
      _messages.add({'sender': 'system', 'text': 'Failed to reset conversation: ${e.toString()}', 'time': DateTime.now()});
    } finally {
      if (!_disposed) {
        setState(() => _isLoading = false);
        _scrollToBottomDelayed();
      }
    }
  }

  Future<void> _deleteConversation(String id) async {
    try {
      final ok = await AuthService.instance.deleteConversation(id);
      if (ok) {
        final wasActiveChat = _conversationId == id;

        // Remove locally from the list
        _conversations.removeWhere((c) => ((c['id'] ?? c['_id'] ?? c['chatId'])?.toString() ?? '') == id);

        if (wasActiveChat) {
          // FIX: If the active chat was deleted, immediately reset to a new chat state
          await _createAndOpenNewConversation();
        } else {
          // If a non-active chat was deleted, just refresh the list
          await _refreshConversationsSilently();
        }
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete conversation')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: ${e.toString()}')));
      }
    }
  }

  // ------------------ Scrolling ------------------
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

  // ------------------ Message tile ------------------
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
            ]
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

  // ------------------ Welcome screen ------------------
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
            'Hello Doctor',
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
              'Enter a query about a patient, staff member, or procedure to start a new chat.',
              style: GoogleFonts.poppins(color: AppColors.kTextSecondary, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  // ------------------ Build ------------------
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
            // Header (Enhanced Styling)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
                border: Border(bottom: BorderSide(color: AppColors.grey200, width: 1)),
              ),
              child: Row(
                children: [
                  // Title
                  Expanded(
                    child: Text(
                      _conversationTitle,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.kTextPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),

                  // Conversation Sidebar Toggle
                  IconButton(
                    tooltip: 'Conversation History',
                    icon: Icon(Icons.list_alt_outlined, color: _isSidebarOpen ? AppColors.primary : AppColors.kTextSecondary),
                    onPressed: _toggleConversationsSidebar,
                  ),

                  // Maximize/Restore Button
                  IconButton(
                    tooltip: widget.isMaximized ? "Restore Size" : "Maximize",
                    icon: Icon(widget.isMaximized ? Icons.fullscreen_exit : Icons.fullscreen, color: AppColors.kTextSecondary),
                    onPressed: widget.onToggleSize,
                  ),

                  // Close Button
                  IconButton(
                    tooltip: "Close",
                    icon: const Icon(Icons.close, color: Colors.redAccent),
                    onPressed: widget.onClose,
                  ),
                ],
              ),
            ),

            // Messages area & Sidebar (using Stack for layering/overlay)
            Expanded(
              child: Stack(
                children: [
                  // 1. Main Chat Content
                  Positioned.fill(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: _isLoading
                          ? const Center(child: CircularProgressIndicator())
                          : _messages.isEmpty && !_isLoading
                          ? _buildWelcomeScreen()
                          : ListView.builder(
                        controller: _scrollController,
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          return _buildMessageTile(_messages[index]);
                        },
                      ),
                    ),
                  ),

                  // 2. Sidebar Overlay (Animates position inside the Expanded area)
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut, // Smoother curve
                    top: 0,
                    bottom: 0,
                    right: _isSidebarOpen ? 0 : -sidebarWidth,
                    width: sidebarWidth,
                    child: _buildConversationsSidebar(),
                  ),

                  // 3. Dimmer overlay when sidebar is open
                  if (_isSidebarOpen)
                    Positioned.fill(
                      child: GestureDetector(
                        onTap: _toggleConversationsSidebar, // Close sidebar when tapping outside
                        child: Container(
                          color: Colors.black.withOpacity(0.35), // Darker dimming effect
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Input Field (Enhanced Styling)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      enabled: !_isSending && !_isSidebarOpen, // Disable input when sending or sidebar is open
                      textInputAction: TextInputAction.send,
                      style: GoogleFonts.poppins(color: AppColors.kTextPrimary),
                      decoration: InputDecoration(
                        hintText: 'Type a medical inquiry...',
                        hintStyle: GoogleFonts.poppins(color: AppColors.kTextSecondary),
                        filled: true,
                        fillColor: AppColors.grey100,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.primary, width: 2)), // Enterprise-level focus border
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
                      elevation: 4, // Added elevation for a professional button look
                      child: IconButton(
                        tooltip: "Send Message",
                        icon: Icon(Icons.send, color: AppColors.white, size: 22),
                        onPressed: _isSending || _isSidebarOpen ? null : _sendMessage,
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