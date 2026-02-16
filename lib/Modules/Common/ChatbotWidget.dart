import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';

/// Reusable Chatbot Widget for Doctor and Admin modules
/// 
/// Features:
/// - Real-time chat with backend bot service
/// - Conversation history management
/// - Typing animation for bot responses
/// - Maximize/minimize functionality
/// - Auto-scroll to latest messages
/// - Voice input support
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

class _ChatbotWidgetState extends State<ChatbotWidget> with SingleTickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<Map<String, dynamic>> _messages = [];
  String? _conversationId;
  String _conversationTitle = 'New Chat';
  bool _isLoading = true;
  bool _isSending = false;
  bool _disposed = false;

  List<Map<String, dynamic>> _conversations = [];
  bool _isLoadingConversations = false;
  bool _isSidebarOpen = false;

  // Typing animation helpers
  final Map<int, Timer> _typingTimers = {};
  final Map<int, String> _fullTextBuffer = {};
  
  // Voice recording state
  bool _isRecording = false;
  bool _isListening = false;
  late AnimationController _voiceAnimationController;
  late Animation<double> _voiceAnimation;

  @override
  void initState() {
    super.initState();
    _initConversationAndMessages();
    
    // Initialize voice animation controller
    _voiceAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    
    _voiceAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _voiceAnimationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _stopAllTypingAnimations();
    _controller.dispose();
    _scrollController.dispose();
    _voiceAnimationController.dispose();
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

      Map<String, dynamic>? convo;
      if (convos.isNotEmpty) {
        convo = convos.first;
        _conversationId = (convo?['id'] ?? convo?['_id'] ?? convo?['chatId'])?.toString();
        _conversationTitle = convo?['title']?.toString() ?? (convo?['data']?['title']?.toString() ?? 'Chat');
      } else {
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

  // ==================== Message Normalization ====================
  
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

  // ==================== Send Message ====================
  
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

      // If first message, refresh conversation list to get new ID
      if (isNewConversation) {
        await _refreshConversationsSilently();
        if (_conversations.isNotEmpty) {
          final newConvo = _conversations.first;
          _conversationId = (newConvo['id'] ?? newConvo['chatId'])?.toString();
          _conversationTitle = newConvo['title'] ?? text.substring(0, text.length.clamp(0, 30)) + '...';
        }
        if (mounted) setState(() {});
      }

      _startTypingAnimation(botIndex, reply ?? 'No response from server.');
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

  // ==================== Voice Recording ====================
  
  void _toggleVoiceRecording() {
    if (_isRecording) {
      _stopVoiceRecording();
    } else {
      _startVoiceRecording();
    }
  }

  void _startVoiceRecording() {
    if (_isSending) return;
    
    setState(() {
      _isRecording = true;
      _isListening = true;
    });
    
    // TODO: Implement actual speech-to-text
    // For now, simulate voice recording
    Future.delayed(const Duration(milliseconds: 500), () {
      if (!_disposed && mounted) {
        setState(() {
          _isListening = true;
        });
      }
    });
    
    // Show recording feedback to user
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.mic, color: AppColors.white),
              const SizedBox(width: 12),
              Text('Listening... Tap to stop', style: GoogleFonts.poppins()),
            ],
          ),
          backgroundColor: AppColors.primary,
          duration: const Duration(days: 1), // Will be dismissed manually
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _stopVoiceRecording() {
    if (!_isRecording) return;
    
    setState(() {
      _isRecording = false;
      _isListening = false;
    });
    
    // Dismiss the recording snackbar
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    
    // TODO: Implement actual speech-to-text processing
    // For now, simulate with a placeholder message
    Future.delayed(const Duration(milliseconds: 300), () {
      if (!_disposed && mounted) {
        // Simulate transcribed text
        _controller.text = "Voice message recorded (Speech-to-text integration pending)";
        
        // Show a message to user
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Voice recorded! Add speech_to_text package to enable transcription.',
                    style: GoogleFonts.poppins(fontSize: 12),
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.kSuccess,
            duration: const Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });
  }

  // ==================== Typing Animation ====================
  
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
    _stopAllTypingAnimations();
    setState(() => _isLoading = true);
    try {
      _conversationId = null;
      _conversationTitle = 'New Chat';
      _messages.clear();
      await _refreshConversationsSilently();
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
        _conversations.removeWhere((c) => ((c['id'] ?? c['_id'] ?? c['chatId'])?.toString() ?? '') == id);

        if (wasActiveChat) {
          await _createAndOpenNewConversation();
        } else {
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

  // ==================== UI Helpers ====================
  
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
            ]),
        child: loading
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(width: 4),
                  SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2.5, valueColor: AlwaysStoppedAnimation<Color>(txtColor))),
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
            'Hello!',
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
                Text('Conversation History',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.kTextPrimary)),
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
                            title: Text(title.toString(),
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.poppins(
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: AppColors.kTextPrimary)),
                            subtitle: snippet.toString().isNotEmpty
                                ? Text(snippet.toString(),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.poppins(fontSize: 12, color: AppColors.kTextSecondary))
                                : null,
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
                                      TextButton(
                                          onPressed: () => Navigator.of(dctx).pop(true),
                                          child: const Text('Delete', style: TextStyle(color: Colors.red))),
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

  // ==================== Main Build ====================
  
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
                      _conversationTitle,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.kTextPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Conversation History',
                    icon: Icon(Icons.list_alt_outlined, color: _isSidebarOpen ? AppColors.primary : AppColors.kTextSecondary),
                    onPressed: _toggleConversationsSidebar,
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

            // Messages area & Sidebar
            Expanded(
              child: Stack(
                children: [
                  // Main Chat Content
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

                  // Sidebar Overlay
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                    top: 0,
                    bottom: 0,
                    right: _isSidebarOpen ? 0 : -sidebarWidth,
                    width: sidebarWidth,
                    child: _buildConversationsSidebar(),
                  ),

                  // Dimmer overlay
                  if (_isSidebarOpen)
                    Positioned.fill(
                      child: GestureDetector(
                        onTap: _toggleConversationsSidebar,
                        child: Container(
                          color: Colors.black.withOpacity(0.35),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Input Field with Voice Icon
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  // Voice input button
                  AnimatedBuilder(
                    animation: _voiceAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _isRecording ? _voiceAnimation.value : 1.0,
                        child: SizedBox(
                          width: 48,
                          height: 48,
                          child: Material(
                            color: _isRecording ? Colors.red : AppColors.grey200,
                            shape: const CircleBorder(),
                            elevation: _isRecording ? 6 : 2,
                            child: InkWell(
                              onTap: _isSending || _isSidebarOpen ? null : _toggleVoiceRecording,
                              customBorder: const CircleBorder(),
                              child: Icon(
                                _isRecording ? Icons.mic : Icons.mic_none,
                                color: _isRecording ? AppColors.white : AppColors.kTextSecondary,
                                size: 22,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                  
                  // Text input field
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      enabled: !_isSending && !_isSidebarOpen && !_isRecording,
                      textInputAction: TextInputAction.send,
                      style: GoogleFonts.poppins(color: AppColors.kTextPrimary),
                      decoration: InputDecoration(
                        hintText: _isRecording ? 'Listening...' : 'Type a medical inquiry...',
                        hintStyle: GoogleFonts.poppins(
                          color: _isRecording ? Colors.red.shade300 : AppColors.kTextSecondary,
                          fontStyle: _isRecording ? FontStyle.italic : FontStyle.normal,
                        ),
                        filled: true,
                        fillColor: _isRecording ? Colors.red.shade50 : AppColors.grey100,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12), 
                            borderSide: BorderSide(color: AppColors.primary, width: 2)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        prefixIcon: _isRecording 
                          ? Icon(Icons.graphic_eq, color: Colors.red, size: 20)
                          : null,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Send button
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
                        onPressed: (_isSending || _isSidebarOpen || _isRecording) ? null : _sendMessage,
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
