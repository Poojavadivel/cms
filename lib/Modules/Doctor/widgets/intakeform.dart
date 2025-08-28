import 'package:flutter/material.dart';
import '../../../Models/dashboardmodels.dart';

// --- Theme (match table) ---
const Color primaryColor = Color(0xFFEF4444);
const Color backgroundColor = Color(0xFFF7FAFC);
const Color cardBackgroundColor = Color(0xFFFFFFFF);
const Color textPrimaryColor = Color(0xFF1F2937);
const Color textSecondaryColor = Color(0xFF6B7280);
const Color badgeColor = Color(0xFFD97706);
const Color badgeBgColor = Color(0xFFFEF3C7);
const Color borderColor = Color(0xFFE5E7EB);

class IntakeFormPage extends StatelessWidget {
  final DashboardAppointments appt;
  const IntakeFormPage({super.key, required this.appt});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text('Patient Intake'),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // LEFT: patient details
          Expanded(
            flex: 1,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Card(
                color: cardBackgroundColor,
                elevation: 3,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: ListView(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: const Color(0xFFF1F5F9),
                        child: Icon(
                          appt.gender.toLowerCase() == 'female'
                              ? Icons.person_2
                              : Icons.person,
                          size: 48,
                          color: textSecondaryColor,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(appt.patientName,
                          style: const TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w700, color: textPrimaryColor)),
                      const SizedBox(height: 6),
                      Text('Age ${appt.patientAge} • ${appt.gender}',
                          style: const TextStyle(color: textSecondaryColor)),
                      const Divider(height: 24),
                      _row('Date', appt.date),
                      _row('Time', appt.time),
                      _row('Reason', appt.reason),
                      _row('Status', appt.status),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // RIGHT: intake sections
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 16, 16, 16),
              child: ListView(
                children: [
                  _IntakeSectionCard(
                    icon: Icons.history_edu,
                    title: 'Patient History',
                    description: 'Add medical history, surgeries, chronic conditions.',
                    needUpdate: true,
                    onTap: () => _openBottomSheet(context, 'Patient History', const [
                      _TextField(label: 'Chronic Conditions'),
                      _TextField(label: 'Past Surgeries'),
                      _ChipsField(label: 'Lifestyle', suggestions: ['Smoker', 'Alcohol', 'Sedentary']),
                    ]),
                  ),
                  _IntakeSectionCard(
                    icon: Icons.sick,
                    title: 'Current Symptoms',
                    description: 'Chief complaint, onset date, pain scale.',
                    needUpdate: true,
                    onTap: () => _openBottomSheet(context, 'Current Symptoms', const [
                      _TextField(label: 'Primary Complaint'),
                      _DateField(label: 'Onset Date'),
                      _SliderField(label: 'Pain (0-10)'),
                    ]),
                  ),
                  _IntakeSectionCard(
                    icon: Icons.medication_liquid,
                    title: 'Allergies & Medications',
                    description: 'List allergies and current meds.',
                    needUpdate: false,
                    onTap: () => _openBottomSheet(context, 'Allergies & Medications', const [
                      _ChipsField(label: 'Allergies', suggestions: ['Penicillin', 'Peanuts', 'Dust']),
                      _RepeaterField(label: 'Medications', fields: ['Name', 'Dosage', 'Frequency']),
                    ]),
                  ),
                  _IntakeSectionCard(
                    icon: Icons.credit_card,
                    title: 'Insurance & Billing',
                    description: 'Insurance details or mark self-pay.',
                    needUpdate: true,
                    onTap: () => _openBottomSheet(context, 'Insurance & Billing', const [
                      _DropdownField(label: 'Payer', items: ['Aetna', 'Cigna', 'Star Health', 'Self-pay']),
                      _TextField(label: 'Policy Number'),
                      _MonthYearField(label: 'Valid Thru'),
                    ]),
                  ),
                  _IntakeSectionCard(
                    icon: Icons.verified_user,
                    title: 'Consent',
                    description: 'Required before treatment.',
                    needUpdate: true,
                    onTap: () => _openBottomSheet(context, 'Consent', const [
                      _CheckboxField(text: 'I consent to treatment and data processing.'),
                      _CheckboxField(text: 'I agree to receive appointment notifications.'),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      onPressed: () {
                        // TODO: submit intake
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Intake saved')),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Save & Continue'),
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

  Widget _row(String k, String v) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(k, style: const TextStyle(color: textSecondaryColor)),
        Text(v, style: const TextStyle(color: textPrimaryColor, fontWeight: FontWeight.w600)),
      ],
    ),
  );

  void _openBottomSheet(BuildContext context, String title, List<Widget> fields) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 16, right: 16, top: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(children: [
              Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const Spacer(),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
            ]),
            const SizedBox(height: 8),
            ...fields,
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Save'),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

// ---- small input widgets ----
class _IntakeSectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool needUpdate;
  final VoidCallback onTap;
  const _IntakeSectionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.needUpdate,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: borderColor),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: primaryColor, size: 26),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(title,
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700, color: textPrimaryColor)),
                      const SizedBox(width: 8),
                      if (needUpdate)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                              color: badgeBgColor, borderRadius: BorderRadius.circular(6)),
                          child: const Text('NEED UPDATE',
                              style: TextStyle(fontSize: 11, color: badgeColor, fontWeight: FontWeight.w700)),
                        ),
                    ]),
                    const SizedBox(height: 4),
                    Text(description, style: const TextStyle(color: textSecondaryColor, fontSize: 13)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: onTap,
                style: OutlinedButton.styleFrom(
                  foregroundColor: primaryColor,
                  side: const BorderSide(color: primaryColor),
                ),
                child: const Text('Add / Edit'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TextField extends StatelessWidget {
  final String label;
  const _TextField({required this.label});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: TextField(
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  final String label;
  const _DateField({required this.label});
  @override
  Widget build(BuildContext context) {
    return _TextField(label: label);
  }
}

class _MonthYearField extends StatelessWidget {
  final String label;
  const _MonthYearField({required this.label});
  @override
  Widget build(BuildContext context) {
    return _TextField(label: label);
  }
}

class _SliderField extends StatefulWidget {
  final String label;
  const _SliderField({required this.label});
  @override
  State<_SliderField> createState() => _SliderFieldState();
}
class _SliderFieldState extends State<_SliderField> {
  double v = 5;
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('${widget.label}: ${v.toStringAsFixed(0)}'),
        Slider(min: 0, max: 10, divisions: 10, value: v, onChanged: (x){ setState(()=>v=x); }),
      ],
    );
  }
}

class _ChipsField extends StatelessWidget {
  final String label;
  final List<String> suggestions;
  const _ChipsField({required this.label, required this.suggestions});
  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 6,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        for (final s in suggestions)
          Chip(
            label: Text(s),
            backgroundColor: const Color(0xFFFFE2E2),
            labelStyle: const TextStyle(color: Color(0xFFB42318)),
          ),
      ],
    );
  }
}

class _RepeaterField extends StatelessWidget {
  final String label;
  final List<String> fields;
  const _RepeaterField({required this.label, required this.fields});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Card(
          elevation: 0,
          color: const Color(0xFFF7FAFC),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: fields.map((f) => _TextField(label: f)).toList(),
            ),
          ),
        ),
      ],
    );
  }
}

class _DropdownField extends StatelessWidget {
  final String label;
  final List<String> items;
  const _DropdownField({required this.label, required this.items});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: DropdownButtonFormField<String>(
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        ),
        items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
        onChanged: (_) {},
      ),
    );
  }
}

class _CheckboxField extends StatefulWidget {
  final String text;
  const _CheckboxField({required this.text});
  @override
  State<_CheckboxField> createState() => _CheckboxFieldState();
}
class _CheckboxFieldState extends State<_CheckboxField> {
  bool v = false;
  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      value: v,
      onChanged: (x) => setState(()=> v = x ?? false),
      title: Text(widget.text),
      controlAffinity: ListTileControlAffinity.leading,
      contentPadding: EdgeInsets.zero,
    );
  }
}
