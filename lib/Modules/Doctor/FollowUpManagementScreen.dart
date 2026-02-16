import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import '../../Services/Authservices.dart';
import '../../Utils/Colors.dart';

/// Enterprise Follow-Up Management Screen
/// Similar to Epic, Cerner, and Athenahealth follow-up trackers
class FollowUpManagementScreen extends StatefulWidget {
  final String? initialPatientFilter;
  
  const FollowUpManagementScreen({
    super.key,
    this.initialPatientFilter,
  });

  @override
  State<FollowUpManagementScreen> createState() => _FollowUpManagementScreenState();
}

class _FollowUpManagementScreenState extends State<FollowUpManagementScreen> {
  bool _isLoading = false;
  List<Map<String, dynamic>> _followUps = [];
  List<Map<String, dynamic>> _filteredFollowUps = [];
  
  String _filterStatus = 'All';
  String _filterPriority = 'All';
  String _searchQuery = '';
  
  final List<String> _statusFilters = ['All', 'Pending', 'Scheduled', 'Completed', 'Overdue'];
  final List<String> _priorityFilters = ['All', 'Routine', 'Important', 'Urgent', 'Critical'];

  @override
  void initState() {
    super.initState();
    // Set initial patient filter if provided
    if (widget.initialPatientFilter != null) {
      _searchQuery = widget.initialPatientFilter!;
    }
    _loadFollowUps();
  }

  Future<void> _loadFollowUps() async {
    setState(() => _isLoading = true);
    
    try {
      // Fetch all appointments with follow-up data
      final response = await AuthService.instance.get('/appointments?hasFollowUp=true');
      
      if (response != null && response['appointments'] != null) {
        setState(() {
          _followUps = List<Map<String, dynamic>>.from(response['appointments']);
          _applyFilters();
        });
      }
    } catch (e) {
      debugPrint('Error loading follow-ups: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load follow-ups: $e'),
            backgroundColor: AppColors.kDanger,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _applyFilters() {
    _filteredFollowUps = _followUps.where((followUp) {
      // Status filter
      if (_filterStatus != 'All') {
        final status = _getFollowUpStatus(followUp);
        if (status != _filterStatus) return false;
      }
      
      // Priority filter
      if (_filterPriority != 'All') {
        final priority = followUp['followUp']?['priority'] ?? 'Routine';
        if (priority != _filterPriority) return false;
      }
      
      // Search filter
      if (_searchQuery.isNotEmpty) {
        final patientName = followUp['patientId']?['firstName'] ?? '';
        final reason = followUp['followUp']?['reason'] ?? '';
        final diagnosis = followUp['followUp']?['diagnosis'] ?? '';
        
        final searchLower = _searchQuery.toLowerCase();
        if (!patientName.toLowerCase().contains(searchLower) &&
            !reason.toLowerCase().contains(searchLower) &&
            !diagnosis.toLowerCase().contains(searchLower)) {
          return false;
        }
      }
      
      return true;
    }).toList();
    
    // Sort by priority and date
    _filteredFollowUps.sort((a, b) {
      final priorityOrder = {'Critical': 0, 'Urgent': 1, 'Important': 2, 'Routine': 3};
      final aPriority = a['followUp']?['priority'] ?? 'Routine';
      final bPriority = b['followUp']?['priority'] ?? 'Routine';
      
      final priorityCompare = (priorityOrder[aPriority] ?? 3).compareTo(priorityOrder[bPriority] ?? 3);
      if (priorityCompare != 0) return priorityCompare;
      
      // Then by recommended date
      final aDate = a['followUp']?['recommendedDate'];
      final bDate = b['followUp']?['recommendedDate'];
      if (aDate != null && bDate != null) {
        return DateTime.parse(aDate).compareTo(DateTime.parse(bDate));
      }
      return 0;
    });
  }

  String _getFollowUpStatus(Map<String, dynamic> followUp) {
    final recommendedDate = followUp['followUp']?['recommendedDate'];
    final scheduledDate = followUp['followUp']?['scheduledDate'];
    final completedDate = followUp['followUp']?['completedDate'];
    
    if (completedDate != null) return 'Completed';
    if (scheduledDate != null) return 'Scheduled';
    if (recommendedDate != null) {
      final recDate = DateTime.parse(recommendedDate);
      if (recDate.isBefore(DateTime.now())) return 'Overdue';
    }
    return 'Pending';
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'Critical': return AppColors.kDanger;
      case 'Urgent': return AppColors.accentPink;
      case 'Important': return AppColors.kWarning;
      case 'Routine': return AppColors.kInfo;
      default: return AppColors.kInfo;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Completed': return AppColors.kSuccess;
      case 'Scheduled': return AppColors.kInfo;
      case 'Pending': return AppColors.kWarning;
      case 'Overdue': return AppColors.kDanger;
      default: return AppColors.kTextSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          _buildHeader(),
          _buildFilters(),
          _buildStats(),
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _filteredFollowUps.isEmpty
                    ? _buildEmptyState()
                    : _buildFollowUpList(),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Iconsax.calendar_tick, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Follow-Up Management',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Track patient follow-ups, tests, and appointments',
                  style: GoogleFonts.roboto(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _loadFollowUps,
            icon: Icon(Iconsax.refresh, color: Colors.white),
            tooltip: 'Refresh',
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          // Search bar
          TextField(
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
                _applyFilters();
              });
            },
            decoration: InputDecoration(
              hintText: 'Search by patient name, reason, or diagnosis...',
              prefixIcon: Icon(Iconsax.search_normal, color: AppColors.primary),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.grey200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.grey200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.primary, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Filter chips
          Row(
            children: [
              Text(
                'Status:',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Wrap(
                  spacing: 8,
                  children: _statusFilters.map((status) {
                    return FilterChip(
                      label: Text(status),
                      selected: _filterStatus == status,
                      onSelected: (selected) {
                        setState(() {
                          _filterStatus = status;
                          _applyFilters();
                        });
                      },
                      selectedColor: AppColors.primary.withOpacity(0.2),
                      checkmarkColor: AppColors.primary,
                      labelStyle: GoogleFonts.roboto(
                        fontSize: 12,
                        fontWeight: _filterStatus == status ? FontWeight.w600 : FontWeight.w400,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'Priority:',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Wrap(
                  spacing: 8,
                  children: _priorityFilters.map((priority) {
                    return FilterChip(
                      label: Text(priority),
                      selected: _filterPriority == priority,
                      onSelected: (selected) {
                        setState(() {
                          _filterPriority = priority;
                          _applyFilters();
                        });
                      },
                      selectedColor: priority == 'All' 
                          ? AppColors.primary.withOpacity(0.2)
                          : _getPriorityColor(priority).withOpacity(0.2),
                      checkmarkColor: priority == 'All' 
                          ? AppColors.primary
                          : _getPriorityColor(priority),
                      labelStyle: GoogleFonts.roboto(
                        fontSize: 12,
                        fontWeight: _filterPriority == priority ? FontWeight.w600 : FontWeight.w400,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    final total = _followUps.length;
    final pending = _followUps.where((f) => _getFollowUpStatus(f) == 'Pending').length;
    final overdue = _followUps.where((f) => _getFollowUpStatus(f) == 'Overdue').length;
    final scheduled = _followUps.where((f) => _getFollowUpStatus(f) == 'Scheduled').length;

    return Container(
      padding: const EdgeInsets.all(16),
      color: AppColors.grey50,
      child: Row(
        children: [
          Expanded(child: _buildStatCard('Total', total, AppColors.kInfo, Iconsax.calendar)),
          Expanded(child: _buildStatCard('Pending', pending, AppColors.kWarning, Iconsax.clock)),
          Expanded(child: _buildStatCard('Overdue', overdue, AppColors.kDanger, Iconsax.warning_2)),
          Expanded(child: _buildStatCard('Scheduled', scheduled, AppColors.kSuccess, Iconsax.tick_circle)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, int value, Color color, IconData icon) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value.toString(),
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.roboto(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFollowUpList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredFollowUps.length,
      itemBuilder: (context, index) {
        return _buildFollowUpCard(_filteredFollowUps[index]);
      },
    );
  }

  Widget _buildFollowUpCard(Map<String, dynamic> followUp) {
    final patient = followUp['patientId'] ?? {};
    final followUpData = followUp['followUp'] ?? {};
    final patientName = '${patient['firstName'] ?? ''} ${patient['lastName'] ?? ''}'.trim();
    final priority = followUpData['priority'] ?? 'Routine';
    final status = _getFollowUpStatus(followUp);
    final reason = followUpData['reason'] ?? 'No reason specified';
    final diagnosis = followUpData['diagnosis'] ?? '';
    final recommendedDate = followUpData['recommendedDate'];
    final labTests = List<Map<String, dynamic>>.from(followUpData['labTests'] ?? []);
    final imaging = List<Map<String, dynamic>>.from(followUpData['imaging'] ?? []);
    final procedures = List<Map<String, dynamic>>.from(followUpData['procedures'] ?? []);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: _getPriorityColor(priority).withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _getPriorityColor(priority).withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: _getPriorityColor(priority).withOpacity(0.2),
                  child: Text(
                    patientName.isNotEmpty ? patientName[0].toUpperCase() : 'P',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: _getPriorityColor(priority),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        patientName,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.kTextPrimary,
                        ),
                      ),
                      Text(
                        diagnosis.isNotEmpty ? diagnosis : 'No diagnosis specified',
                        style: GoogleFonts.roboto(
                          fontSize: 13,
                          color: AppColors.kTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildPriorityBadge(priority),
                const SizedBox(width: 8),
                _buildStatusBadge(status),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoRow(Iconsax.note_text, 'Reason', reason),
                if (recommendedDate != null) ...[
                  const SizedBox(height: 8),
                  _buildInfoRow(
                    Iconsax.calendar,
                    'Recommended Date',
                    DateFormat('MMM dd, yyyy').format(DateTime.parse(recommendedDate)),
                  ),
                ],
                
                if (labTests.isNotEmpty || imaging.isNotEmpty || procedures.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 12),
                  Text(
                    'Tests & Procedures',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.kTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  if (labTests.isNotEmpty)
                    _buildTestList('Lab Tests', Iconsax.health, labTests, 'testName'),
                  if (imaging.isNotEmpty)
                    _buildTestList('Imaging', Iconsax.scan, imaging, 'imagingType'),
                  if (procedures.isNotEmpty)
                    _buildTestList('Procedures', Iconsax.clipboard_tick, procedures, 'procedureName'),
                ],
              ],
            ),
          ),

          // Actions
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.grey50,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(12),
                bottomRight: Radius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () {
                    // Schedule appointment
                  },
                  icon: Icon(Iconsax.calendar_add, size: 18),
                  label: Text('Schedule'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: () {
                    // View details
                  },
                  icon: Icon(Iconsax.eye, size: 18),
                  label: Text('View Details'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getPriorityColor(priority),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        priority,
        style: GoogleFonts.roboto(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _getStatusColor(status), width: 1.5),
      ),
      child: Text(
        status,
        style: GoogleFonts.roboto(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: _getStatusColor(status),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 8),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: GoogleFonts.roboto(fontSize: 13, color: AppColors.kTextPrimary),
              children: [
                TextSpan(
                  text: '$label: ',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(text: value),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTestList(String title, IconData icon, List<Map<String, dynamic>> tests, String nameKey) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.kInfo),
              const SizedBox(width: 6),
              Text(
                '$title:',
                style: GoogleFonts.roboto(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          ...tests.map((test) {
            final name = test[nameKey] ?? 'Unnamed';
            final ordered = test['ordered'] ?? false;
            final completed = test['completed'] ?? false;
            return Padding(
              padding: const EdgeInsets.only(left: 22, top: 4),
              child: Row(
                children: [
                  Icon(
                    completed ? Iconsax.tick_circle : 
                    ordered ? Iconsax.clock : Iconsax.minus_cirlce,
                    size: 14,
                    color: completed ? AppColors.kSuccess : 
                           ordered ? AppColors.kWarning : AppColors.kTextSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    name,
                    style: GoogleFonts.roboto(
                      fontSize: 12,
                      color: AppColors.kTextSecondary,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 16),
          Text(
            'Loading follow-ups...',
            style: GoogleFonts.roboto(
              fontSize: 14,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.calendar_tick, size: 80, color: AppColors.kTextSecondary.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(
            'No follow-ups found',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.kTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Follow-ups will appear here when created',
            style: GoogleFonts.roboto(
              fontSize: 14,
              color: AppColors.kTextSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
