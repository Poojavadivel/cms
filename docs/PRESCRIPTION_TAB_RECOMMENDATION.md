# 💊 Prescription Tab - Past vs Current Implementation Recommendation

## 📊 Current State Analysis

### **What Exists Now:**
```
┌─────────────────────────────────────────────┐
│ Prescription Tab (Current Implementation)   │
├─────────────────────────────────────────────┤
│ • Shows ALL prescriptions (mixed past/curr) │
│ • Displays scanned prescription documents   │
│ • OCR-extracted medicine data               │
│ • From: PrescriptionDocument collection     │
│ • Source: /api/scanner-enterprise endpoint  │
└─────────────────────────────────────────────┘
```

### **Data Sources Available:**

#### 1. **Scanned Prescriptions** (PrescriptionDocument model)
- **Location:** `Server/Models/PrescriptionDocument.js`
- **API:** `/api/scanner-enterprise/prescriptions/:patientId`
- **Contains:** Historical prescriptions uploaded via scanner
- **Type:** **PAST PRESCRIPTIONS** ✅

#### 2. **Current Appointment Prescriptions** (Patient.prescriptions)
- **Location:** `Server/Models/Patient.js` (lines 40-56)
- **Contains:** Medicines prescribed during intake/consultation
- **Type:** **CURRENT PRESCRIPTIONS** ✅

---

## 🎯 **RECOMMENDATION: Split Into Two Sections**

### **Design Pattern: Tabbed or Segmented View**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESCRIPTION TAB                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  📋 CURRENT (TODAY)  │  │  📚 PAST HISTORY     │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ CURRENT PRESCRIPTION (For this appointment)          │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │                                                       │ │
│  │  Medicine        Dosage    Frequency   Duration      │ │
│  │  ────────────────────────────────────────────────    │ │
│  │  Metformin       500mg     2x daily    30 days       │ │
│  │  Aspirin         75mg      1x daily    30 days       │ │
│  │  Vitamin D3      1000IU    1x daily    90 days       │ │
│  │                                                       │ │
│  │  Doctor: Dr. Kumar                                    │ │
│  │  Date: 20 Nov 2024                                    │ │
│  │  Notes: Take after meals                              │ │
│  │                                                       │ │
│  │  [➕ Add Medicine]  [💾 Save]  [🖨️ Print]             │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **Implementation Options**

### **Option 1: Side-by-Side Layout (Recommended)** ⭐

```dart
Row(
  children: [
    // LEFT: Current Prescription
    Expanded(
      flex: 3,
      child: _CurrentPrescriptionCard(
        appointmentId: widget.appointment.id,
        patientId: widget.patientId,
        onSave: _savePrescription,
      ),
    ),
    SizedBox(width: 16),
    // RIGHT: Past Prescriptions
    Expanded(
      flex: 2,
      child: _PastPrescriptionsCard(
        patientId: widget.patientId,
      ),
    ),
  ],
)
```

**Pros:**
- ✅ See both at once
- ✅ Easy to reference past prescriptions while writing new
- ✅ Good for desktop/tablet
- ✅ Clear separation

**Cons:**
- ❌ May be cramped on small screens

---

### **Option 2: Segmented Toggle (Mobile-Friendly)**

```dart
Column(
  children: [
    // Toggle buttons
    SegmentedButton<String>(
      segments: [
        ButtonSegment(value: 'current', label: Text('Current'), icon: Icon(Icons.edit)),
        ButtonSegment(value: 'past', label: Text('Past History'), icon: Icon(Icons.history)),
      ],
      selected: {_selectedView},
      onSelectionChanged: (Set<String> selection) {
        setState(() => _selectedView = selection.first);
      },
    ),
    
    // Content area
    Expanded(
      child: _selectedView == 'current' 
        ? _CurrentPrescriptionForm()
        : _PastPrescriptionsList(),
    ),
  ],
)
```

**Pros:**
- ✅ Works great on mobile
- ✅ Full screen for each view
- ✅ Simple and clean

**Cons:**
- ❌ Can't see both simultaneously

---

### **Option 3: Expandable Sections**

```dart
Column(
  children: [
    // Current prescription (always visible, prominent)
    _ExpandableCard(
      title: 'Current Prescription',
      initiallyExpanded: true,
      child: _CurrentPrescriptionForm(),
    ),
    
    SizedBox(height: 16),
    
    // Past prescriptions (collapsible)
    _ExpandableCard(
      title: 'Past Prescriptions (${_pastCount})',
      initiallyExpanded: false,
      child: _PastPrescriptionsList(),
    ),
  ],
)
```

**Pros:**
- ✅ Flexible space usage
- ✅ Focus on current prescription by default
- ✅ Past history available when needed

**Cons:**
- ❌ Requires scrolling to see both

---

## 📋 **Data Structure Mapping**

### **Current Prescription (To be saved to Patient.prescriptions[])**

```javascript
// Data structure for current appointment prescription
{
  prescriptionId: "uuid",
  appointmentId: "appointment_123",  // Link to current appointment
  doctorId: "doctor_456",
  medicines: [
    {
      medicineId: "med_789",
      name: "Metformin",
      dosage: "500mg",
      frequency: "2x daily",
      duration: "30 days",
      quantity: 60
    }
  ],
  notes: "Take after meals",
  issuedAt: "2024-11-20T10:30:00Z"
}
```

**Source:** Doctor creates during appointment  
**Saved to:** `Patient.prescriptions` array  
**API:** POST `/api/intake` or `/api/appointments/:id/prescription`

---

### **Past Prescriptions (From PrescriptionDocument)**

```javascript
// Historical scanned prescriptions
{
  _id: "uuid",
  patientId: "patient_123",
  pdfId: "pdf_uuid",
  doctorName: "Dr. Kumar",
  hospitalName: "Apollo Hospital",
  prescriptionDate: "2024-10-15T00:00:00Z",
  medicines: [
    {
      name: "Aspirin",
      dosage: "75mg",
      frequency: "1x daily",
      duration: "30 days",
      instructions: "After breakfast"
    }
  ],
  diagnosis: "Hypertension",
  status: "completed",
  uploadDate: "2024-10-16T14:20:00Z"
}
```

**Source:** Uploaded via scanner-enterprise  
**Collection:** `PrescriptionDocument`  
**API:** GET `/api/scanner-enterprise/prescriptions/:patientId`

---

## 🎨 **UI Component Breakdown**

### **Component 1: Current Prescription Form**

```dart
class _CurrentPrescriptionCard extends StatefulWidget {
  final String appointmentId;
  final String patientId;
  final Function(Map<String, dynamic>) onSave;
  
  @override
  State<_CurrentPrescriptionCard> createState() => _CurrentPrescriptionCardState();
}

class _CurrentPrescriptionCardState extends State<_CurrentPrescriptionCard> {
  List<Map<String, dynamic>> _medicines = [];
  final _notesController = TextEditingController();
  
  void _addMedicine() {
    setState(() {
      _medicines.add({
        'medicineId': null,
        'name': '',
        'dosage': '',
        'frequency': '',
        'duration': '',
        'quantity': 0,
      });
    });
  }
  
  void _removeMedicine(int index) {
    setState(() => _medicines.removeAt(index));
  }
  
  Future<void> _savePrescription() async {
    final prescription = {
      'appointmentId': widget.appointmentId,
      'medicines': _medicines.where((m) => m['name'].isNotEmpty).toList(),
      'notes': _notesController.text,
    };
    
    // Save to backend
    await AuthService.instance.savePrescription(
      patientId: widget.patientId,
      prescription: prescription,
    );
    
    widget.onSave(prescription);
  }
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(Icons.medical_services, color: primaryColor),
                SizedBox(width: 8),
                Text('Current Prescription', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                Spacer(),
                TextButton.icon(
                  onPressed: _addMedicine,
                  icon: Icon(Icons.add),
                  label: Text('Add Medicine'),
                ),
              ],
            ),
            
            Divider(),
            
            // Medicine list
            Expanded(
              child: ListView.builder(
                itemCount: _medicines.length,
                itemBuilder: (context, index) {
                  return _MedicineRow(
                    medicine: _medicines[index],
                    onUpdate: (updated) {
                      setState(() => _medicines[index] = updated);
                    },
                    onRemove: () => _removeMedicine(index),
                  );
                },
              ),
            ),
            
            // Notes
            SizedBox(height: 16),
            TextField(
              controller: _notesController,
              decoration: InputDecoration(
                labelText: 'Notes / Instructions',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            
            // Actions
            SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton.icon(
                  onPressed: () {/* Preview */},
                  icon: Icon(Icons.preview),
                  label: Text('Preview'),
                ),
                SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: () {/* Print */},
                  icon: Icon(Icons.print),
                  label: Text('Print'),
                ),
                SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _savePrescription,
                  icon: Icon(Icons.save),
                  label: Text('Save Prescription'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### **Component 2: Medicine Row (Editable)**

```dart
class _MedicineRow extends StatelessWidget {
  final Map<String, dynamic> medicine;
  final Function(Map<String, dynamic>) onUpdate;
  final VoidCallback onRemove;
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Row(
          children: [
            // Medicine Name (searchable dropdown)
            Expanded(
              flex: 2,
              child: _MedicineSearchField(
                initialValue: medicine['name'],
                onSelected: (selected) {
                  onUpdate({...medicine, 'name': selected['name'], 'medicineId': selected['id']});
                },
              ),
            ),
            SizedBox(width: 8),
            
            // Dosage
            Expanded(
              child: TextField(
                decoration: InputDecoration(labelText: 'Dosage', hintText: '500mg'),
                onChanged: (val) => onUpdate({...medicine, 'dosage': val}),
              ),
            ),
            SizedBox(width: 8),
            
            // Frequency
            Expanded(
              child: DropdownButtonFormField<String>(
                decoration: InputDecoration(labelText: 'Frequency'),
                value: medicine['frequency'].isEmpty ? null : medicine['frequency'],
                items: [
                  DropdownMenuItem(value: '1x daily', child: Text('Once daily')),
                  DropdownMenuItem(value: '2x daily', child: Text('Twice daily')),
                  DropdownMenuItem(value: '3x daily', child: Text('Thrice daily')),
                  DropdownMenuItem(value: 'As needed', child: Text('As needed')),
                ],
                onChanged: (val) => onUpdate({...medicine, 'frequency': val}),
              ),
            ),
            SizedBox(width: 8),
            
            // Duration
            Expanded(
              child: TextField(
                decoration: InputDecoration(labelText: 'Duration', hintText: '30 days'),
                onChanged: (val) => onUpdate({...medicine, 'duration': val}),
              ),
            ),
            SizedBox(width: 8),
            
            // Quantity
            Expanded(
              child: TextField(
                decoration: InputDecoration(labelText: 'Qty'),
                keyboardType: TextInputType.number,
                onChanged: (val) => onUpdate({...medicine, 'quantity': int.tryParse(val) ?? 0}),
              ),
            ),
            
            // Remove button
            IconButton(
              icon: Icon(Icons.delete, color: Colors.red),
              onPressed: onRemove,
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### **Component 3: Past Prescriptions List**

```dart
class _PastPrescriptionsCard extends StatefulWidget {
  final String patientId;
  
  @override
  State<_PastPrescriptionsCard> createState() => _PastPrescriptionsCardState();
}

class _PastPrescriptionsCardState extends State<_PastPrescriptionsCard> {
  List<Map<String, dynamic>> _pastPrescriptions = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadPastPrescriptions();
  }
  
  Future<void> _loadPastPrescriptions() async {
    try {
      final prescriptions = await AuthService.instance.getPrescriptions(
        patientId: widget.patientId,
        limit: 50,
      );
      
      setState(() {
        _pastPrescriptions = prescriptions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(Icons.history, color: Colors.blue),
                SizedBox(width: 8),
                Text('Past Prescriptions', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                Spacer(),
                Text('${_pastPrescriptions.length} records', style: TextStyle(color: Colors.grey)),
              ],
            ),
            
            Divider(),
            
            // List
            Expanded(
              child: _isLoading
                ? Center(child: CircularProgressIndicator())
                : _pastPrescriptions.isEmpty
                  ? Center(child: Text('No past prescriptions found'))
                  : ListView.builder(
                      itemCount: _pastPrescriptions.length,
                      itemBuilder: (context, index) {
                        final prescription = _pastPrescriptions[index];
                        return _PastPrescriptionCard(
                          prescription: prescription,
                          onViewPdf: () => _viewPdf(prescription['pdfId']),
                          onCopyToCurrentClick: () => _copyToCurrent(prescription),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _viewPdf(String? pdfId) {
    if (pdfId == null) return;
    // Open PDF viewer
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PdfViewerPage(pdfId: pdfId),
      ),
    );
  }
  
  void _copyToCurrent(Map<String, dynamic> prescription) {
    // Copy medicines from past prescription to current form
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Copy to Current Prescription?'),
        content: Text('This will copy the medicines from this past prescription to the current prescription form.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              // TODO: Emit event or callback to parent to add medicines
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Medicines copied to current prescription')),
              );
            },
            child: Text('Copy'),
          ),
        ],
      ),
    );
  }
}
```

---

### **Component 4: Past Prescription Item**

```dart
class _PastPrescriptionCard extends StatelessWidget {
  final Map<String, dynamic> prescription;
  final VoidCallback onViewPdf;
  final VoidCallback onCopyToCurrentClick;
  
  @override
  Widget build(BuildContext context) {
    final results = prescription['results'] as List? ?? [];
    final date = _formatDate(prescription['prescriptionDate'] ?? prescription['uploadDate']);
    final doctor = prescription['doctorName'] ?? 'Unknown Doctor';
    final hospital = prescription['hospitalName'] ?? '';
    
    return Card(
      margin: EdgeInsets.only(bottom: 8),
      elevation: 1,
      child: ExpansionTile(
        leading: Icon(Icons.medical_information, color: Colors.blue),
        title: Text(
          doctor,
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hospital.isNotEmpty) Text(hospital, style: TextStyle(fontSize: 12)),
            Text(date, style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(Icons.copy, size: 18),
              onPressed: onCopyToCurrentClick,
              tooltip: 'Copy to current',
            ),
            IconButton(
              icon: Icon(Icons.picture_as_pdf, size: 18, color: Colors.red),
              onPressed: onViewPdf,
              tooltip: 'View PDF',
            ),
          ],
        ),
        children: [
          Padding(
            padding: EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Medicines:', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                SizedBox(height: 8),
                ...results.map((medicine) {
                  return Padding(
                    padding: EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Icon(Icons.medication, size: 14, color: Colors.grey),
                        SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '${medicine['testName'] ?? medicine['name']} - ${medicine['value'] ?? ''} - ${medicine['normalRange'] ?? ''}',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  String _formatDate(dynamic date) {
    if (date == null) return 'Unknown date';
    try {
      final dt = DateTime.parse(date.toString());
      return DateFormat('dd MMM yyyy').format(dt);
    } catch (e) {
      return 'Unknown date';
    }
  }
}
```

---

## 🔄 **Backend Integration**

### **API Endpoints Needed:**

#### 1. **Save Current Prescription**
```javascript
POST /api/appointments/:appointmentId/prescription
or
POST /api/patients/:patientId/prescriptions

Body:
{
  "appointmentId": "appt_123",
  "medicines": [
    {
      "medicineId": "med_456",
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "2x daily",
      "duration": "30 days",
      "quantity": 60
    }
  ],
  "notes": "Take after meals"
}

Response:
{
  "success": true,
  "prescriptionId": "presc_789",
  "message": "Prescription saved successfully"
}
```

#### 2. **Get Current Appointment Prescription**
```javascript
GET /api/appointments/:appointmentId/prescription

Response:
{
  "success": true,
  "prescription": {
    "prescriptionId": "presc_789",
    "appointmentId": "appt_123",
    "medicines": [...],
    "notes": "...",
    "issuedAt": "2024-11-20T10:30:00Z"
  }
}
```

#### 3. **Get Past Prescriptions (Already exists)**
```javascript
GET /api/scanner-enterprise/prescriptions/:patientId?limit=50

Response:
{
  "success": true,
  "prescriptions": [...]
}
```

---

## 📝 **Implementation Steps**

### **Phase 1: Basic Layout (Day 1)**
1. ✅ Create two-section layout (Side-by-side or Segmented)
2. ✅ Add "Current Prescription" card with form
3. ✅ Add "Past Prescriptions" card with list
4. ✅ Add medicine add/remove functionality

### **Phase 2: Integration (Day 2)**
1. ✅ Connect to backend API for saving current prescription
2. ✅ Load past prescriptions from scanner-enterprise API
3. ✅ Add PDF viewer for past prescriptions
4. ✅ Implement copy-to-current functionality

### **Phase 3: Polish (Day 3)**
1. ✅ Add medicine search/autocomplete
2. ✅ Add print preview functionality
3. ✅ Add validation for required fields
4. ✅ Add success/error notifications
5. ✅ Add loading states

---

## 🎯 **Final Recommendation**

### **For Desktop/Tablet: Use Option 1 (Side-by-Side)** ⭐
- Current prescription takes 60% width (left)
- Past prescriptions takes 40% width (right)
- Easy to reference past while writing new

### **For Mobile: Use Option 2 (Segmented Toggle)**
- Default view: Current Prescription
- Easy toggle to view past
- Full screen for each view

### **Responsive Implementation:**
```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 900) {
      // Desktop: Side-by-side
      return Row(children: [_Current(), _Past()]);
    } else {
      // Mobile: Segmented
      return Column(children: [_Toggle(), _CurrentOrPast()]);
    }
  },
)
```

---

## ✅ **Summary**

| Feature | Current | Past |
|---------|---------|------|
| **Data Source** | Patient.prescriptions | PrescriptionDocument |
| **User Action** | Create/Edit | View Only |
| **API** | POST /api/appointments/prescription | GET /api/scanner-enterprise |
| **Content** | Medicines being prescribed today | Historical scanned documents |
| **Layout** | Form with inputs | Read-only list |
| **Actions** | Add, Edit, Save, Print | View PDF, Copy to Current |

---

**Estimated Effort:** 2-3 days  
**Priority:** High  
**Impact:** Streamlines doctor workflow significantly

Would you like me to implement any specific option?
