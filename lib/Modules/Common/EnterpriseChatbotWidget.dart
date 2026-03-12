import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';

/// Enterprise-Grade Medical Chatbot Widget
/// 
/// Features:
/// - Professional UI with glassmorphism effects
/// - Rich message formatting (markdown support)
/// - Quick action suggestions
/// - Message reactions & feedback
/// - Export conversation functionality
/// - Advanced typing indicators
/// - Context-aware suggestions
/// - Professional animations
class EnterpriseChatbotWidget extends StatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onToggleSize;
  final bool isMaximized;
  final String userRole; // doctor, admin, pharmacist, pathologist

  const EnterpriseChatbotWidget({
    super.key,
    required this.onClose,
    required this.onToggleSize,
    required this.isMaximized,
    this.userRole = 'doctor',
  });

  @override
  State<EnterpriseChatbotWidget> createState() => _EnterpriseChatbotWidgetState();
}

class _EnterpriseChatbotWidgetState extends State<EnterpriseChatbotWidget>
    with TickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  final List<ChatMessage> _messages = [];
  String? _conversationId;
  String _conversationTitle = 'New Conversation';
  bool _isLoading = true;
  bool _isSending = false;
  bool _disposed = false;

  List<Map<String, dynamic>> _conversations = [];
  bool _isLoadingConversations = false;
  bool _isSidebarOpen = false;
  bool _showSuggestions = true;

  // Typing animation
  final Map<int, Timer> _typingTimers = {};
  final Map<int, String> _fullTextBuffer = {};
  
  // Animation controllers
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // Quick suggestions based on role
  List<String> get _quickSuggestions {
    switch (widget.userRole.toLowerCase()) {
      case 'doctor':
        return [
          'Show patient appointments for today',
          'Find patient by name',
          'Recent lab reports',
          'Pending prescriptions',
          'Patient medical history',
        ];
      case 'admin':
        return [
          'Staff attendance summary',
          'Today\'s revenue report',
          'Bed occupancy status',
          'Department-wise patient count',
          'Appointment statistics',
        ];
      case 'pharmacist':
        return [
          'Low stock medicines',
          'Pending prescriptions',
          'Medicine expiry alerts',
          'Today\'s dispensed medicines',
          'Stock inventory summary',
        ];
      case 'pathologist':
        return [
          'Pending test reports',
          'Today\'s sample collection',
          'Critical test results',
          'Test turnaround time',
          'Equipment maintenance schedule',
        ];
      default:
        return [
          'Show patient information',
          'Search staff directory',
          'View appointments',
          'Check reports',
        ];
    }
  }

  @override
  void initState() {
    super.initState();
    _initConversationAndMessages();
    
    // Initialize pulse animation for typing indicator
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _stopAllTypingAnimations();
    _controller.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  // ==================== Initialization ====================
  
  Future<void> _initConversationAndMessages() async {
    setState(() => _isLoading = true);
    try {
      _isLoadingConversations = true;
      final convos = await AuthService.instance.getConversations();
      _isLoadingConversations = false;
      _conversations = convos;

      if (convos.isNotEmpty) {
        final convo = convos.first;
        _conversationId = (convo['id'] ?? convo['_id'] ?? convo['chatId'])?.toString();
        _conversationTitle = convo['title']?.toString() ?? 'Conversation';
      }

      _messages.clear();
      if (_conversationId != null) {
        final msgs = await AuthService.instance.getConversationMessages(_conversationId!);
        _messages.addAll(msgs.map((m) => ChatMessage.fromMap(m)).toList());
      } else {
        // Add welcome message for new conversation
        _messages.add(ChatMessage(
          id: 'welcome',
          sender: 'bot',
          text: _getWelcomeMessage(),
          time: DateTime.now(),
          isWelcome: true,
        ));
      }
    } catch (e) {
      if (!_disposed) {
        _messages.add(ChatMessage(
          id: 'error',
          sender: 'system',
          text: 'Failed to load conversation. Please try again.',
          time: DateTime.now(),
        ));
      }
    }

    if (!_disposed) {
      setState(() => _isLoading = false);
      _scrollToBottomDelayed();
    }
  }

  String _getWelcomeMessage() {
    switch (widget.userRole.toLowerCase()) {
      case 'doctor':
        return 'Hello Doctor! I\'m your AI assistant. I can help you with patient information, appointments, medical records, and more. How can I assist you today?';
      case 'admin':
        return 'Hello Admin! I can provide insights on hospital operations, staff management, analytics, and reports. What would you like to know?';
      case 'pharmacist':
        return 'Hello! I can help you with medicine inventory, prescriptions, stock alerts, and dispensing records. How may I assist you?';
      case 'pathologist':
        return 'Hello! I can help with test reports, sample tracking, equipment status, and lab analytics. What do you need?';
      default:
        return 'Hello! I\'m your AI assistant. How can I help you today?';
    }
  }

  // ==================== Send Message ====================
  
  Future<void> _sendMessage([String? customText]) async {
    final text = customText ?? _controller.text.trim();
    if (text.isEmpty || _isSending) return;

    final isNewConversation = _conversationId == null;

    setState(() {
      _messages.add(ChatMessage(
        id: 'user_${DateTime.now().millisecondsSinceEpoch}',
        sender: 'user',
        text: text,
        time: DateTime.now(),
      ));
      _messages.add(ChatMessage(
        id: 'bot_${DateTime.now().millisecondsSinceEpoch}',
        sender: 'bot',
        text: '',
        time: DateTime.now(),
        isLoading: true,
      ));
      _isSending = true;
      _showSuggestions = false;
    });

    if (customText == null) _controller.clear();
    _scrollToBottomDelayed();
    final botIndex = _messages.length - 1;

    try {
      final reply = await AuthService.instance.sendChatMessage(
        text,
        conversationId: _conversationId,
        metadata: {
          'source': 'enterprise_chat',
          'userRole': widget.userRole,
          'ts': DateTime.now().toIso8601String(),
        },
      );

      if (_disposed) return;

      // If first message, refresh conversation list
      if (isNewConversation) {
        await _refreshConversationsSilently();
        if (_conversations.isNotEmpty) {
          final newConvo = _conversations.first;
          _conversationId = (newConvo['id'] ?? newConvo['chatId'])?.toString();
          _conversationTitle = newConvo['title'] ?? '${text.substring(0, text.length.clamp(0, 40))}...';
        }
        if (mounted) setState(() {});
      }

      _startTypingAnimation(botIndex, reply ?? 'No response from server.');
      _refreshConversationsSilently();
      _scrollToBottomDelayed();
    } catch (e) {
      if (_disposed) return;
      setState(() {
        _messages[botIndex] = ChatMessage(
          id: 'error_${DateTime.now().millisecondsSinceEpoch}',
          sender: 'system',
          text: 'Failed to send message. Please try again.',
          time: DateTime.now(),
        );
        _isSending = false;
      });
      _scrollToBottomDelayed();
    }
  }

  // ==================== Typing Animation ====================
  
  void _startTypingAnimation(int botIndex, String fullText, {Duration charDelay = const Duration(milliseconds: 20)}) {
    _stopTypingAnimation(botIndex);

    _fullTextBuffer[botIndex] = fullText;
    int pos = 0;

    if (botIndex >= 0 && botIndex < _messages.length) {
      _messages[botIndex].text = '';
      _messages[botIndex].isLoading = true;
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
        if (_messages[botIndex].text != current) {
          _messages[botIndex].text = current;
          if (mounted) setState(() {});
        }
      }

      if (pos >= buffer.length) {
        _stopTypingAnimation(botIndex);
        if (botIndex >= 0 && botIndex < _messages.length) {
          _messages[botIndex].isLoading = false;
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

  // ==================== Conversations Management ====================
  
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
      // Ignore silently
    } finally {
      _isLoadingConversations = false;
      if (mounted) setState(() {});
    }
  }

  Future<void> _switchConversation(String id, String title) async {
    _stopAllTypingAnimations();
    setState(() {
      _isLoading = true;
      _isSidebarOpen = false;
    });
    
    try {
      _conversationId = id;
      _conversationTitle = title;
      final msgs = await AuthService.instance.getConversationMessages(_conversationId!);
      _messages.clear();
      _messages.addAll(msgs.map((m) => ChatMessage.fromMap(m)).toList());
    } catch (e) {
      _messages.add(ChatMessage(
        id: 'error',
        sender: 'system',
        text: 'Failed to load conversation.',
        time: DateTime.now(),
      ));
    } finally {
      if (!_disposed) {
        setState(() => _isLoading = false);
        _scrollToBottomDelayed();
      }
    }
  }

  Future<void> _createNewConversation() async {
    _stopAllTypingAnimations();
    setState(() {
      _isLoading = true;
      _isSidebarOpen = false;
    });
    
    try {
      _conversationId = null;
      _conversationTitle = 'New Conversation';
      _messages.clear();
      _messages.add(ChatMessage(
        id: 'welcome',
        sender: 'bot',
        text: _getWelcomeMessage(),
        time: DateTime.now(),
        isWelcome: true,
      ));
      _showSuggestions = true;
      await _refreshConversationsSilently();
    } catch (e) {
      _messages.add(ChatMessage(
        id: 'error',
        sender: 'system',
        text: 'Failed to create conversation.',
        time: DateTime.now(),
      ));
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
        _conversations.removeWhere((c) => ((c['id'] ?? c['_id'] ?? c['chatId'])?.toString() ?? '') == id);

        if (wasActiveChat) {
          await _createNewConversation();
        } else {
          await _refreshConversationsSilently();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _exportConversation() async {
    if (_messages.isEmpty) return;
    
    final buffer = StringBuffer();
    buffer.writeln('Conversation Export - Karur HMS');
    buffer.writeln('Title: $_conversationTitle');
    buffer.writeln('Date: ${DateTime.now().toString()}');
    buffer.writeln('=' * 50);
    buffer.writeln();
    
    for (final msg in _messages) {
      if (msg.sender == 'system') continue;
      buffer.writeln('[${msg.sender.toUpperCase()}] ${msg.time.toString().substring(11, 16)}');
      buffer.writeln(msg.text);
      buffer.writeln();
    }
    
    await Clipboard.setData(ClipboardData(text: buffer.toString()));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Text('Conversation exported to clipboard', style: GoogleFonts.poppins()),
            ],
          ),
          backgroundColor: AppColors.kSuccess,
        ),
      );
    }
  }

  // ==================== UI Helpers ====================
  
  void _scrollToBottomDelayed() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget _buildMessageBubble(ChatMessage msg, int index) {
    final isUser = msg.sender == 'user';
    final isSystem = msg.sender == 'system';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primary600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(76),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Iconsax.message, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  decoration: BoxDecoration(
                    gradient: isUser
                        ? LinearGradient(
                            colors: [AppColors.primary, AppColors.primary600],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    color: isUser
                        ? null
                        : (isSystem ? AppColors.grey200 : AppColors.white),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(20),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                    border: !isUser && !isSystem
                        ? Border.all(color: AppColors.grey200, width: 1)
                        : null,
                  ),
                  child: msg.isLoading
                      ? _buildTypingIndicator()
                      : SelectableText(
                          msg.text,
                          style: GoogleFonts.inter(
                            color: isUser ? Colors.white : AppColors.kTextPrimary,
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
                ),
                if (!isUser && !isSystem && !msg.isLoading) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildActionButton(
                        icon: Iconsax.copy,
                        label: 'Copy',
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: msg.text));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Copied to clipboard')),
                          );
                        },
                      ),
                      const SizedBox(width: 8),
                      _buildActionButton(
                        icon: Iconsax.like_1,
                        label: 'Helpful',
                        onTap: () => _sendFeedback(msg.id, 'positive'),
                      ),
                      const SizedBox(width: 8),
                      _buildActionButton(
                        icon: Iconsax.dislike,
                        label: 'Not helpful',
                        onTap: () => _sendFeedback(msg.id, 'negative'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 12),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(26),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(Iconsax.user, color: AppColors.primary, size: 18),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(3, (index) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: FadeTransition(
              opacity: _pulseAnimation,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          );
        }),
        const SizedBox(width: 8),
        Text(
          'Analyzing...',
          style: GoogleFonts.inter(
            color: AppColors.kTextSecondary,
            fontSize: 12,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.grey100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: AppColors.kTextSecondary),
            const SizedBox(width: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: AppColors.kTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _sendFeedback(String messageId, String type) async {
    try {
      // Map 'positive' to 'helpful' and 'negative' to 'not_helpful'
      final feedbackType = type == 'positive' ? 'helpful' : 'not_helpful';
      
      final success = await AuthService.instance.sendChatbotFeedback(
        messageId: messageId,
        type: feedbackType,
        conversationId: _conversationId ?? '',
      );
      
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Thank you for your feedback!'),
            duration: const Duration(seconds: 2),
            backgroundColor: AppColors.kSuccess,
          ),
        );
      }
    } catch (e) {
      debugPrint('Error sending feedback: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send feedback'),
            duration: const Duration(seconds: 2),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    }
  }

  Widget _buildQuickSuggestions() {
    if (!_showSuggestions || _messages.length > 1) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _quickSuggestions.map((suggestion) {
              return InkWell(
                onTap: () => _sendMessage(suggestion),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary.withAlpha(20),
                        AppColors.primary.withAlpha(31),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.primary.withAlpha(51),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Iconsax.message_text,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        suggestion,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationsSidebar() {
    return Container(
      width: 320,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          bottomLeft: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(38),
            blurRadius: 24,
            offset: const Offset(-8, 0),
          ),
        ],
      ),
      child: Column(
        children: [
          // Sidebar Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primary600],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20)),
            ),
            child: Row(
              children: [
                const Icon(Iconsax.message, color: Colors.white, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Conversations',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle, color: Colors.white),
                  tooltip: 'New conversation',
                  onPressed: _createNewConversation,
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => setState(() => _isSidebarOpen = false),
                ),
              ],
            ),
          ),
          
          // Conversations List
          Expanded(
            child: _isLoadingConversations
                ? const Center(child: CircularProgressIndicator())
                : _conversations.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Iconsax.message_text,
                              size: 48,
                              color: AppColors.grey300,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No conversations yet',
                              style: GoogleFonts.poppins(
                                color: AppColors.kTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _conversations.length,
                        itemBuilder: (context, idx) {
                          final c = _conversations[idx];
                          final id = (c['id'] ?? c['_id'] ?? c['chatId'])?.toString() ?? '';
                          final title = c['title'] ?? (c['snippet'] ?? 'Conversation');
                          final snippet = c['snippet'] ?? '';
                          final isSelected = id == _conversationId;

                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primary.withAlpha(26) : null,
                              borderRadius: BorderRadius.circular(12),
                              border: isSelected
                                  ? Border.all(color: AppColors.primary, width: 2)
                                  : null,
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              leading: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  gradient: isSelected
                                      ? LinearGradient(
                                          colors: [AppColors.primary, AppColors.primary600],
                                        )
                                      : null,
                                  color: isSelected ? null : AppColors.grey100,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  Iconsax.message_text,
                                  color: isSelected ? Colors.white : AppColors.kTextSecondary,
                                  size: 20,
                                ),
                              ),
                              title: Text(
                                title.toString(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 14,
                                  color: AppColors.kTextPrimary,
                                ),
                              ),
                              subtitle: snippet.toString().isNotEmpty
                                  ? Text(
                                      snippet.toString(),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: AppColors.kTextSecondary,
                                      ),
                                    )
                                  : null,
                              trailing: IconButton(
                                icon: const Icon(Iconsax.trash, size: 18),
                                color: Colors.redAccent,
                                onPressed: () async {
                                  final ok = await showDialog<bool>(
                                    context: context,
                                    builder: (dctx) => AlertDialog(
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      title: Text(
                                        'Delete Conversation',
                                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                                      ),
                                      content: Text(
                                        'Are you sure you want to delete this conversation?',
                                        style: GoogleFonts.inter(),
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.of(dctx).pop(false),
                                          child: Text('Cancel', style: GoogleFonts.inter()),
                                        ),
                                        ElevatedButton(
                                          onPressed: () => Navigator.of(dctx).pop(true),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.red,
                                          ),
                                          child: Text('Delete', style: GoogleFonts.inter(color: Colors.white)),
                                        ),
                                      ],
                                    ),
                                  );
                                  if (ok == true) await _deleteConversation(id);
                                },
                              ),
                              onTap: () {
                                if (!isSelected) _switchConversation(id, title.toString());
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

  // ==================== Main Build ====================
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(38),
            blurRadius: 32,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: SizedBox(
          height: widget.isMaximized ? MediaQuery.of(context).size.height * 0.88 : 600,
          width: widget.isMaximized ? MediaQuery.of(context).size.width * 0.6 : 480,
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primary600],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withAlpha(76),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(51),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Iconsax.message, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'MedGPT Assistant',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            _conversationTitle,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white.withAlpha(230),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Iconsax.document_download, color: Colors.white),
                      tooltip: 'Export conversation',
                      onPressed: _exportConversation,
                    ),
                    IconButton(
                      icon: Icon(
                        _isSidebarOpen ? Iconsax.menu_board : Iconsax.message_text,
                        color: Colors.white,
                      ),
                      tooltip: 'Conversation history',
                      onPressed: _toggleConversationsSidebar,
                    ),
                    IconButton(
                      icon: Icon(
                        widget.isMaximized ? Icons.fullscreen_exit : Icons.fullscreen,
                        color: Colors.white,
                      ),
                      tooltip: widget.isMaximized ? 'Minimize' : 'Maximize',
                      onPressed: widget.onToggleSize,
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      tooltip: 'Close',
                      onPressed: widget.onClose,
                    ),
                  ],
                ),
              ),

              // Messages Area
              Expanded(
                child: Stack(
                  children: [
                    // Messages List
                    Container(
                      color: AppColors.grey50,
                      child: _isLoading
                          ? const Center(child: CircularProgressIndicator())
                          : Column(
                              children: [
                                Expanded(
                                  child: ListView.builder(
                                    controller: _scrollController,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    itemCount: _messages.length,
                                    itemBuilder: (context, index) {
                                      return _buildMessageBubble(_messages[index], index);
                                    },
                                  ),
                                ),
                                _buildQuickSuggestions(),
                              ],
                            ),
                    ),

                    // Sidebar Overlay
                    if (_isSidebarOpen)
                      Positioned(
                        top: 0,
                        bottom: 0,
                        right: 0,
                        child: _buildConversationsSidebar(),
                      ),

                    // Dimmer (behind sidebar)
                    if (_isSidebarOpen)
                      Positioned(
                        left: 0,
                        right: 320,
                        top: 0,
                        bottom: 0,
                        child: GestureDetector(
                          onTap: () => setState(() => _isSidebarOpen = false),
                          child: Container(
                            color: Colors.black.withAlpha(102),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // Input Area
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(13),
                      blurRadius: 12,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.grey100,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: _focusNode.hasFocus
                                ? AppColors.primary
                                : Colors.transparent,
                            width: 2,
                          ),
                        ),
                        child: TextField(
                          controller: _controller,
                          focusNode: _focusNode,
                          enabled: !_isSending,
                          maxLines: null,
                          textInputAction: TextInputAction.send,
                          style: GoogleFonts.inter(
                            color: AppColors.kTextPrimary,
                            fontSize: 14,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Ask anything about patients, staff, reports...',
                            hintStyle: GoogleFonts.inter(
                              color: AppColors.kTextSecondary,
                              fontSize: 14,
                            ),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 14,
                            ),
                            prefixIcon: Icon(
                              Iconsax.search_normal,
                              color: AppColors.kTextSecondary,
                              size: 20,
                            ),
                          ),
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppColors.primary, AppColors.primary600],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withAlpha(102),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: _isSending ? null : () => _sendMessage(),
                          borderRadius: BorderRadius.circular(24),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            child: _isSending
                                ? SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Icon(
                                    Iconsax.send_1,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ==================== Models ====================

class ChatMessage {
  String id;
  String sender; // user, bot, system
  String text;
  DateTime time;
  bool isLoading;
  bool isWelcome;

  ChatMessage({
    required this.id,
    required this.sender,
    required this.text,
    required this.time,
    this.isLoading = false,
    this.isWelcome = false,
  });

  factory ChatMessage.fromMap(Map<String, dynamic> m) {
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

    return ChatMessage(
      id: m['id'] ?? m['_id'] ?? m['messageId'] ?? UniqueKey().toString(),
      sender: sender,
      text: text,
      time: time,
    );
  }
}
