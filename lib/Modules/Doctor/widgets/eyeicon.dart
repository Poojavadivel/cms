import 'package:flutter/material.dart';
import '../../../Models/dashboardmodels.dart';

// --- Theme ---
const Color primaryColor = Color(0xFFEF4444);
const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);

class AppointmentDetailPage extends StatelessWidget {
  final DashboardAppointments appt;

  const AppointmentDetailPage({super.key, required this.appt});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text("Appointment Details"),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Patient Info Card
            _infoCard(
              title: "Patient Info",
              children: [
                _row("Patient Name", appt.patientName),
                _row("Age", appt.patientAge.toString()),
                _row("Gender", appt.gender),
                _row("Reason", appt.reason),
              ],
            ),

            const SizedBox(height: 16),

            // Appointment Info
            _infoCard(
              title: "Appointment Info",
              children: [
                _row("Date", appt.date),
                _row("Time", appt.time),
                _row("Status", appt.status),
                _row("Service", appt.service),
              ],
            ),

            const SizedBox(height: 16),

            // Notes
            _infoCard(
              title: "Notes",
              children: [
                Text(
                  appt.notes ?? "No additional notes",
                  style: const TextStyle(color: textSecondaryColor),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // --- Helper widgets ---
  Widget _infoCard({required String title, required List<Widget> children}) {
    return Card(
      color: cardBackgroundColor,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: textPrimaryColor)),
            const Divider(),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 14,
                  color: textSecondaryColor,
                  fontWeight: FontWeight.w500)),
          Text(value,
              style: const TextStyle(
                  fontSize: 14,
                  color: textPrimaryColor,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
