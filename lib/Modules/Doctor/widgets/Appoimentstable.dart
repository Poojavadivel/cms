import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../Models/dashboardmodels.dart';

// Import the centralized DashboardAppointments model
// Adjust this path based on your exact file structure

// --- App Theme Colors (Re-defined for self-containment, or could be imported) ---
const Color primaryColor = Color(0xFFEF4444);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

// Specific colors used in this table (can be consolidated into theme later)
const Color _appointmentsHeaderColor = Color(0xFFB91C1C);
const Color _tableHeaderColor = Color(0xFF991B1B);
const Color _searchBorderColor = Color(0xFFFCA5A5);
const Color _buttonBgColor = Color(0xFFDC2626);
const Color _statusIncompleteColor = Color(0xFFDC2626);
const Color _rowAlternateColor = Color(0xFFFEF2F2);
const Color _intakeButtonColor = Color(0xFFF87171);

// --- DashboardAppointment Model Class ---
// REMOVED the local DashboardAppointment definition from here.
// It is now imported from '../../../../models/dashboard_models.dart';


// --- AppointmentTable Widget ---
class AppointmentTable extends StatefulWidget {
  // Changed the type from DashboardAppointment to DashboardAppointments
  final List<DashboardAppointments> appointments;
  // Changed the type in the callback signature
  final void Function(DashboardAppointments) onShowAppointmentDetails;
  final VoidCallback onNewAppointmentPressed; // Callback for new appointment button

  const AppointmentTable({
    super.key,
    required this.appointments,
    required this.onShowAppointmentDetails,
    required this.onNewAppointmentPressed,
  });

  @override
  State<AppointmentTable> createState() => _AppointmentTableState();
}

class _AppointmentTableState extends State<AppointmentTable> {
  String _searchQuery = ''; // State for the search query

  // Helper method to filter appointments based on search query
  // Changed the return type and the type used in the where clause
  List<DashboardAppointments> get _filteredAppointments {
    if (_searchQuery.isEmpty) {
      return widget.appointments;
    }
    return widget.appointments.where((appt) {
      return appt.patientName.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'APPOINTMENTS',
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: _appointmentsHeaderColor),
              ),
              // Search field and New Appointment button row
              Row(
                children: [
                  SizedBox(
                    width: 220,
                    height: 48, // Fixed height for consistency
                    child: TextField(
                      onChanged: (value) {
                        setState(() {
                          _searchQuery = value;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search patient name...',
                        hintStyle: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF9CA3AF)),
                        prefixIcon: const Icon(Icons.search, size: 20),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 17), // Balanced padding
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: _searchBorderColor),
                        ),
                        enabledBorder: OutlineInputBorder( // Ensure border is visible when enabled
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: _searchBorderColor),
                        ),
                        focusedBorder: OutlineInputBorder( // Focus border
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: primaryColor, width: 2),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  SizedBox(
                    height: 48, // Same height as TextField for alignment
                    child: ElevatedButton.icon(
                      onPressed: widget.onNewAppointmentPressed, // Use the callback
                      icon: const Icon(Icons.add, size: 18, color: Colors.white),
                      label: Text(
                        'New Appointment',
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _buttonBgColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded( // Ensure the table takes available space
            child: SingleChildScrollView( // Allow scrolling if table content overflows
              scrollDirection: Axis.vertical,
              child: SizedBox(
                width: double.infinity, // Ensures DataTable takes full width available from parent
                child: DataTable(
                  horizontalMargin: 0,
                  columnSpacing: 16,
                  dataRowMinHeight: 50, // Minimum height for data rows
                  dataRowMaxHeight: 60, // Maximum height for data rows
                  columns: [
                    DataColumn(label: Text('Patient Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: _tableHeaderColor, fontSize: 16))),
                    DataColumn(label: Padding(padding: const EdgeInsets.only(left: 26), child: Text('Age', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: _tableHeaderColor, fontSize: 16)),),),
                    DataColumn(label: Padding(padding: const EdgeInsets.only(left: 36),child: Text('Date', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: _tableHeaderColor, fontSize: 16)))),
                    DataColumn(label: Padding(padding: const EdgeInsets.only(left: 36),child: Text('Time', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: _tableHeaderColor, fontSize: 16)))),
                    DataColumn(label: Padding(padding: const EdgeInsets.only(left: 36),child: Text('Reason', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: _tableHeaderColor, fontSize: 16)))),
                    DataColumn(label: Padding(padding: const EdgeInsets.only(left: 36),child: Text('Status', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: _tableHeaderColor, fontSize: 16)))),
                    DataColumn(label: Padding(padding: const EdgeInsets.only(left: 76),child: Text('Actions', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, color: _tableHeaderColor, fontSize: 16)))),
                  ],
                  rows: _filteredAppointments.map((appt) => DataRow(
                      color: MaterialStateProperty.resolveWith<Color?>((Set<MaterialState> states) {
                        return _filteredAppointments.indexOf(appt) % 2 == 0 ? null : _rowAlternateColor;
                      }),
                      cells: [
                        DataCell(
                            Row(
                              children: [
                                CircleAvatar(
                                  // Use patientAvatarUrl if available, otherwise fallback to local assets
                                  backgroundImage: appt.patientAvatarUrl.isNotEmpty
                                      ?  AssetImage(
                  appt.gender == 'Male' ? 'assets/boyicon.png' : 'assets/girlicon.png'
                  )
                                  :NetworkImage(appt.patientAvatarUrl) as ImageProvider,

                                  radius: 16,
                                ),
                                const SizedBox(width: 8),
                                Text(appt.patientName, style: const TextStyle(fontSize: 14)),
                              ],
                            )
                        ),
                        DataCell(Center(child: Text(appt.patientAge.toString(), style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.date, style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.time, style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.reason, style: const TextStyle(fontSize: 14)))),
                        DataCell(Center(child: Text(appt.status, style: GoogleFonts.poppins(color: appt.status == 'Incomplete' ? _statusIncompleteColor : textSecondaryColor, fontWeight: FontWeight.w600, fontSize: 14)))),
                        DataCell(
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                ElevatedButton(
                                  onPressed: () {
                                    // Handle Intake action
                                    print('Intake for ${appt.patientName}');
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _intakeButtonColor,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    minimumSize: const Size(0, 24),
                                  ),
                                  child: const Text('Intake', style: TextStyle(fontSize: 12)),
                                ),
                                IconButton(icon: const Icon(Icons.edit, size: 18, color: _buttonBgColor), onPressed: () {
                                  // Handle Edit action
                                  print('Edit ${appt.patientName}');
                                }),
                                IconButton(icon: const Icon(Icons.delete, size: 18, color: _buttonBgColor), onPressed: () {
                                  // Handle Delete action
                                  print('Delete ${appt.patientName}');
                                }),
                                IconButton(icon: const Icon(Icons.remove_red_eye_outlined, size: 18, color: _buttonBgColor), onPressed: () => widget.onShowAppointmentDetails(appt)),
                              ],
                            )
                        ),
                      ])).toList(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
