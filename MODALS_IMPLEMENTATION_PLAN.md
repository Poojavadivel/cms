# Modals Implementation Plan - Complete System

## Overview
Implement all modals/dialogs from Flutter app to React for complete CRUD functionality.

---

## ✅ What Needs to be Built

### 1. **Patient Modals** (Admin & Doctor)
- ✅ `PatientFormModal` - Add/Edit patient (CREATED)
- ⏳ `PatientViewModal` - View patient details
- ⏳ `PatientDeleteModal` - Delete confirmation

### 2. **Appointment Modals**
- ⏳ `AppointmentFormModal` - Add/Edit appointment
- ⏳ `AppointmentViewModal` - View appointment details
- ⏳ `AppointmentDeleteModal` - Delete confirmation
- ⏳ `AppointmentRescheduleModal` - Reschedule appointment

### 3. **Doctor-Specific Modals**
- ⏳ `FollowUpModal` - Schedule follow-up (from flutter)
- ⏳ `PrescriptionModal` - Write prescription
- ⏳ `MedicalNotesModal` - Add medical notes

### 4. **Common Modals**
- ⏳ `ConfirmDialog` - Generic confirmation
- ⏳ `AlertDialog` - Generic alert/info
- ⏳ `LoadingModal` - Loading indicator

---

## 📁 File Structure

```
src/
├── components/
│   ├── modals/
│   │   ├── PatientFormModal.jsx        ✅ CREATED
│   │   ├── PatientFormModal.css        ⏳ TODO
│   │   ├── PatientViewModal.jsx        ⏳ TODO
│   │   ├── PatientDeleteModal.jsx      ⏳ TODO
│   │   ├── AppointmentFormModal.jsx    ⏳ TODO
│   │   ├── AppointmentViewModal.jsx    ⏳ TODO
│   │   ├── FollowUpModal.jsx           ⏳ TODO
│   │   ├── PrescriptionModal.jsx       ⏳ TODO
│   │   ├── ConfirmDialog.jsx           ⏳ TODO
│   │   └── index.js                    ⏳ TODO
│   └── ...
├── services/
│   ├── patientsService.js              ✅ EXISTS (needs update methods)
│   ├── appointmentsService.js          ✅ EXISTS
│   └── ...
└── ...
```

---

## 🎯 Implementation Steps

### Step 1: Complete Patient Modals ⏳

#### A. PatientFormModal.css
```css
/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E2E8F0;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.modal-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #F1F5F9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #E2E8F0;
  color: #1E293B;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #2663FF;
  box-shadow: 0 0 0 3px rgba(38, 99, 255, 0.1);
}

.form-field small {
  font-size: 12px;
  color: #94A3B8;
}

.error-message {
  padding: 12px;
  background: #FEE2E2;
  border: 1px solid #FCA5A5;
  border-radius: 8px;
  color: #DC2626;
  font-size: 14px;
  margin-bottom: 16px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #E2E8F0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #2663FF;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1e54e4;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #F1F5F9;
  color: #64748B;
}

.btn-secondary:hover:not(:disabled) {
  background: #E2E8F0;
}
```

#### B. PatientViewModal.jsx
```jsx
/**
 * PatientViewModal.jsx
 * View patient details in read-only mode
 */

import React from 'react';
import { MdClose, MdPerson, MdPhone, MdEmail, MdLocalHospital } from 'react-icons/md';
import './PatientFormModal.css';

const PatientViewModal = ({ isOpen, onClose, patient }) => {
  if (!isOpen || !patient) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container patient-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <MdPerson size={24} />
            <h2>Patient Details</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Personal Information */}
          <div className="view-section">
            <h3><MdPerson /> Personal Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>Name</label>
                <p>{patient.name || `${patient.firstName} ${patient.lastName}`}</p>
              </div>
              <div className="view-item">
                <label>Age</label>
                <p>{patient.age}</p>
              </div>
              <div className="view-item">
                <label>Gender</label>
                <p>{patient.gender}</p>
              </div>
              <div className="view-item">
                <label>Blood Group</label>
                <p>{patient.bloodGroup || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="view-section">
            <h3><MdPhone /> Contact Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <label>Phone</label>
                <p>{patient.phone || patient.contactNumber || 'N/A'}</p>
              </div>
              <div className="view-item">
                <label>Email</label>
                <p>{patient.email || 'N/A'}</p>
              </div>
              <div className="view-item full-width">
                <label>Address</label>
                <p>{patient.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="view-section">
            <h3><MdLocalHospital /> Medical Information</h3>
            <div className="view-grid">
              <div className="view-item full-width">
                <label>Medical History</label>
                <p>{Array.isArray(patient.medicalHistory) 
                  ? patient.medicalHistory.join(', ') 
                  : patient.medicalHistory || 'N/A'}</p>
              </div>
              <div className="view-item full-width">
                <label>Allergies</label>
                <p>{Array.isArray(patient.allergies)
                  ? patient.allergies.join(', ')
                  : patient.allergies || 'None'}</p>
              </div>
              <div className="view-item">
                <label>Last Visit</label>
                <p>{formatDate(patient.lastVisit)}</p>
              </div>
              <div className="view-item">
                <label>Doctor</label>
                <p>{patient.doctor || patient.doctorName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(patient.emergencyContact || patient.emergencyPhone) && (
            <div className="view-section">
              <h3><MdLocalHospital /> Emergency Contact</h3>
              <div className="view-grid">
                <div className="view-item">
                  <label>Contact Name</label>
                  <p>{patient.emergencyContact || 'N/A'}</p>
                </div>
                <div className="view-item">
                  <label>Contact Phone</label>
                  <p>{patient.emergencyPhone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientViewModal;
```

---

### Step 2: Update Services ⏳

#### patientsService.js - Add missing methods
```javascript
// Add to existing patientsService.js

/**
 * Create new patient
 */
async createPatient(patientData) {
  try {
    const response = await axiosInstance.post('/patients', patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}

/**
 * Update patient
 */
async updatePatient(patientId, patientData) {
  try {
    const response = await axiosInstance.put(`/patients/${patientId}`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
}

/**
 * Delete patient
 */
async deletePatient(patientId) {
  try {
    const response = await axiosInstance.delete(`/patients/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
}
```

---

### Step 3: Integrate Modals into Pages ⏳

#### Update DoctorPatients.jsx
```jsx
import React, { useState } from 'react';
import PatientFormModal from '../../components/modals/PatientFormModal';
import PatientViewModal from '../../components/modals/PatientViewModal';

const DoctorPatients = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleView = async (patient) => {
    // Fetch full patient details if needed
    const fullPatient = await patientsService.fetchPatientById(patient.id);
    setSelectedPatient(fullPatient);
    setShowViewModal(true);
  };

  const handleEdit = async (patient) => {
    const fullPatient = await patientsService.fetchPatientById(patient.id);
    setSelectedPatient(fullPatient);
    setShowEditModal(true);
  };

  const handleDelete = async (patient) => {
    if (window.confirm(`Delete ${patient.name}?`)) {
      await patientsService.deletePatient(patient.id);
      fetchPatients(); // Refresh list
    }
  };

  const handleSuccess = () => {
    fetchPatients(); // Refresh list
  };

  return (
    <>
      {/* Page content */}
      
      {/* Modals */}
      <PatientFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
      
      <PatientFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        patient={selectedPatient}
        onSuccess={handleSuccess}
      />
      
      <PatientViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        patient={selectedPatient}
      />
    </>
  );
};
```

---

## 🎨 Design Guidelines

### Modal Styles (Matching Admin)
- **Overlay**: `rgba(0, 0, 0, 0.5)` with `backdrop-filter: blur(4px)`
- **Container**: White background, `border-radius: 12px`
- **Max Width**: 800px for forms, 600px for view/confirm
- **Max Height**: 90vh
- **Padding**: 20-24px
- **Colors**: Same as admin (`#2663FF`, `#28C76F`, etc.)

### Animation
```css
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-container {
  animation: modalSlideIn 0.2s ease-out;
}
```

---

## 📋 Checklist

### Immediate Tasks:
- [x] Create modals directory
- [x] Create PatientFormModal.jsx
- [ ] Create PatientFormModal.css
- [ ] Create PatientViewModal.jsx
- [ ] Add createPatient to patientsService
- [ ] Add updatePatient to patientsService
- [ ] Add deletePatient to patientsService
- [ ] Integrate modals into DoctorPatients
- [ ] Integrate modals into AdminPatients
- [ ] Test add patient
- [ ] Test edit patient
- [ ] Test view patient
- [ ] Test delete patient

### Future Tasks:
- [ ] Appointment modals
- [ ] Follow-up modal
- [ ] Prescription modal
- [ ] Generic dialogs
- [ ] File upload in forms
- [ ] Image picker integration

---

## 🚀 Next Steps

1. **Complete CSS file** for PatientFormModal
2. **Create PatientViewModal** component
3. **Update patientsService** with CRUD methods
4. **Integrate into pages** (both admin and doctor)
5. **Test thoroughly** with real API
6. **Create appointment modals** following same pattern
7. **Add doctor-specific modals**

---

**Status**: 🟡 IN PROGRESS (PatientFormModal created, needs integration)
**Priority**: 🔥 HIGH (Core CRUD functionality)
**Estimate**: 2-4 hours for patient modals complete system
