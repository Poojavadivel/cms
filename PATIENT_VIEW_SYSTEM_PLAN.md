# Patient View System - Full Page Implementation

## Flutter vs React Approach

### Flutter Structure (Current):
```
PatientsPage (List)
  └── Click "View" 
      └── DoctorAppointmentPreview (Full Dialog)
          ├── PatientProfileHeaderCard (with Edit button)
          └── TabController (5 tabs)
              ├── Profile Tab
              ├── Medical History Tab
              ├── Prescription Tab
              ├── Lab Result Tab
              └── Billings Tab
```

### React Structure (To Implement):
```
Option 1: Full Page with React Router
/doctor/patients              → List page
/doctor/patients/:id/view     → Full view page with tabs
/doctor/patients/:id/edit     → Edit page (reuse form)

Option 2: Full-Screen Modal (Closer to Flutter)
/doctor/patients
  └── PatientViewModal (Full-screen dialog)
      ├── Patient Header Card
      └── Tabs Component
          ├── Profile Tab
          ├── Medical History Tab
          ├── Prescription Tab  
          ├── Lab Results Tab
          └── Billings Tab
```

---

## Recommended Approach: Full-Screen Modal (Option 2)

**Why?**
- ✅ Matches Flutter behavior exactly
- ✅ No URL changes needed
- ✅ Keeps user context in list page
- ✅ Easier back navigation
- ✅ Can overlay without losing list state

---

## Implementation Plan

### Files to Create:

```
/src/pages/doctor/
  ├── PatientViewPage.jsx          ← Full-screen modal with tabs
  ├── PatientViewPage.css          ← Styling
  └── DoctorPatients.jsx           ← Update with view handler

/src/components/patient/
  ├── PatientProfileHeader.jsx     ← Header card with avatar & edit
  ├── PatientProfileHeader.css     
  ├── tabs/
  │   ├── ProfileTab.jsx           ← Personal info, vitals, etc.
  │   ├── MedicalHistoryTab.jsx    ← Medical history
  │   ├── PrescriptionTab.jsx      ← Prescriptions list
  │   ├── LabResultsTab.jsx        ← Lab results
  │   └── BillingsTab.jsx          ← Billing information
  └── index.js
```

---

## Component Structure

### 1. PatientViewPage.jsx (Main Container)

```jsx
/**
 * PatientViewPage.jsx
 * Full-screen patient view modal with tabs
 * Matches Flutter's DoctorAppointmentPreview
 */

import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import PatientProfileHeader from '../../components/patient/PatientProfileHeader';
import {
  ProfileTab,
  MedicalHistoryTab,
  PrescriptionTab,
  LabResultsTab,
  BillingsTab
} from '../../components/patient/tabs';
import './PatientViewPage.css';

const PatientViewPage = ({ isOpen, onClose, patientId, showBillingTab = true }) => {
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'medical-history', label: 'Medical History' },
    { id: 'prescription', label: 'Prescription' },
    { id: 'lab-results', label: 'Lab Results' },
    ...(showBillingTab ? [{ id: 'billings', label: 'Billings' }] : [])
  ];

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientData();
    }
  }, [isOpen, patientId]);

  const fetchPatientData = async () => {
    setIsLoading(true);
    try {
      const data = await patientsService.fetchPatientById(patientId);
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPatientData();
    setIsRefreshing(false);
  };

  const handleEdit = () => {
    // Open edit modal or navigate to edit page
    // Will be implemented
  };

  if (!isOpen) return null;

  return (
    <div className="patient-view-overlay">
      <div className="patient-view-container">
        {/* Close Button */}
        <button className="patient-view-close" onClick={onClose}>
          <MdClose size={28} />
        </button>

        {/* Content */}
        <div className="patient-view-content">
          {/* Patient Header */}
          <PatientProfileHeader
            patient={patient}
            onEdit={handleEdit}
            isRefreshing={isRefreshing}
          />

          {/* Tabs Section */}
          <div className="patient-view-tabs-container">
            {/* Tab Navigation */}
            <div className="patient-tabs-header">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`patient-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="patient-tabs-body">
              {activeTab === 'profile' && <ProfileTab patient={patient} />}
              {activeTab === 'medical-history' && <MedicalHistoryTab patient={patient} />}
              {activeTab === 'prescription' && <PrescriptionTab patient={patient} />}
              {activeTab === 'lab-results' && <LabResultsTab patient={patient} />}
              {activeTab === 'billings' && showBillingTab && <BillingsTab patient={patient} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientViewPage;
```

---

### 2. PatientProfileHeader.jsx

```jsx
/**
 * PatientProfileHeader.jsx
 * Patient header card with avatar, basic info, and edit button
 * Matches Flutter's PatientProfileHeaderCard
 */

import React from 'react';
import { MdEdit, MdPerson, MdCake, MdPhone, MdEmail } from 'react-icons/md';
import './PatientProfileHeader.css';

const PatientProfileHeader = ({ patient, onEdit, isRefreshing }) => {
  if (!patient) return <div>Loading...</div>;

  const getAvatarUrl = (gender) => {
    return gender?.toLowerCase() === 'male' 
      ? '/assets/boyicon.png' 
      : '/assets/girlicon.png';
  };

  return (
    <div className="patient-profile-header">
      <div className="patient-header-content">
        {/* Avatar */}
        <div className="patient-avatar">
          <img 
            src={getAvatarUrl(patient.gender)} 
            alt={patient.name}
            onError={(e) => e.target.src = '/assets/boyicon.png'}
          />
        </div>

        {/* Info */}
        <div className="patient-info">
          <div className="patient-name-section">
            <h2>{patient.name || `${patient.firstName} ${patient.lastName}`}</h2>
            <span className="patient-id">#{patient.patientId || patient.patientCode}</span>
          </div>

          <div className="patient-quick-info">
            <div className="info-item">
              <MdPerson />
              <span>{patient.age} years • {patient.gender}</span>
            </div>
            {patient.phone && (
              <div className="info-item">
                <MdPhone />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.bloodGroup && (
              <div className="info-item">
                <span className="blood-group-badge">{patient.bloodGroup}</span>
              </div>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <button 
          className="patient-edit-btn" 
          onClick={onEdit}
          disabled={isRefreshing}
        >
          <MdEdit size={20} />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};

export default PatientProfileHeader;
```

---

### 3. ProfileTab.jsx

```jsx
/**
 * ProfileTab.jsx
 * Patient profile information tab
 */

import React from 'react';

const ProfileTab = ({ patient }) => {
  if (!patient) return <div>Loading...</div>;

  const InfoSection = ({ title, items }) => (
    <div className="info-section">
      <h3 className="section-title">{title}</h3>
      <div className="info-grid">
        {items.map((item, idx) => (
          <div key={idx} className="info-item">
            <label>{item.label}</label>
            <p>{item.value || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="profile-tab">
      {/* Personal Information */}
      <InfoSection
        title="Personal Information"
        items={[
          { label: 'Full Name', value: patient.name },
          { label: 'Age', value: patient.age },
          { label: 'Gender', value: patient.gender },
          { label: 'Date of Birth', value: patient.dateOfBirth },
          { label: 'Blood Group', value: patient.bloodGroup },
        ]}
      />

      {/* Contact Information */}
      <InfoSection
        title="Contact Information"
        items={[
          { label: 'Phone', value: patient.phone },
          { label: 'Email', value: patient.email },
          { label: 'Address', value: patient.address },
          { label: 'City', value: patient.city },
          { label: 'State', value: patient.state },
          { label: 'Pincode', value: patient.pincode },
        ]}
      />

      {/* Vitals */}
      <InfoSection
        title="Vitals"
        items={[
          { label: 'Height', value: patient.height ? `${patient.height} cm` : '—' },
          { label: 'Weight', value: patient.weight ? `${patient.weight} kg` : '—' },
          { label: 'BMI', value: patient.bmi },
          { label: 'Blood Pressure', value: patient.bp },
          { label: 'Pulse', value: patient.pulse },
          { label: 'Temperature', value: patient.temp },
          { label: 'Oxygen', value: patient.oxygen ? `${patient.oxygen}%` : '—' },
        ]}
      />

      {/* Emergency Contact */}
      <InfoSection
        title="Emergency Contact"
        items={[
          { label: 'Contact Name', value: patient.emergencyContactName },
          { label: 'Contact Phone', value: patient.emergencyContactPhone },
        ]}
      />

      {/* Insurance */}
      <InfoSection
        title="Insurance Information"
        items={[
          { label: 'Insurance Number', value: patient.insuranceNumber },
          { label: 'Expiry Date', value: patient.expiryDate },
        ]}
      />
    </div>
  );
};

export default ProfileTab;
```

---

### 4. MedicalHistoryTab.jsx

```jsx
/**
 * MedicalHistoryTab.jsx
 * Medical history and conditions
 */

import React from 'react';

const MedicalHistoryTab = ({ patient }) => {
  if (!patient) return <div>Loading...</div>;

  const medicalHistory = Array.isArray(patient.medicalHistory) 
    ? patient.medicalHistory 
    : [];
  const allergies = Array.isArray(patient.allergies) 
    ? patient.allergies 
    : [];

  return (
    <div className="medical-history-tab">
      {/* Medical Conditions */}
      <div className="info-section">
        <h3 className="section-title">Medical Conditions</h3>
        {medicalHistory.length > 0 ? (
          <div className="conditions-list">
            {medicalHistory.map((condition, idx) => (
              <div key={idx} className="condition-item">
                <span className="condition-badge">●</span>
                <span>{condition}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No medical conditions recorded</p>
        )}
      </div>

      {/* Allergies */}
      <div className="info-section">
        <h3 className="section-title">Allergies</h3>
        {allergies.length > 0 ? (
          <div className="allergies-list">
            {allergies.map((allergy, idx) => (
              <span key={idx} className="allergy-badge">
                {allergy}
              </span>
            ))}
          </div>
        ) : (
          <p className="empty-state">No known allergies</p>
        )}
      </div>

      {/* Notes */}
      {patient.notes && (
        <div className="info-section">
          <h3 className="section-title">Notes</h3>
          <div className="notes-content">
            <p>{patient.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryTab;
```

---

## CSS Structure

### PatientViewPage.css

```css
/* Full-screen overlay */
.patient-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Container (95% of screen) */
.patient-view-container {
  position: relative;
  width: 95%;
  height: 95vh;
  background: #F9FAFB;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Close button */
.patient-view-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.patient-view-close:hover {
  background: #EF4444;
  color: white;
  transform: scale(1.1);
}

/* Content */
.patient-view-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

/* Tabs Container */
.patient-view-tabs-container {
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  overflow: hidden;
}

/* Tab Header */
.patient-tabs-header {
  display: flex;
  border-bottom: 1px solid #E5E7EB;
  padding: 0 8px;
  background: white;
}

.patient-tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #6B7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.patient-tab:hover {
  color: #EF4444;
}

.patient-tab.active {
  color: #EF4444;
  border-bottom-color: #EF4444;
}

/* Tab Body */
.patient-tabs-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Info Sections */
.info-section {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #F3F4F6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item p {
  font-size: 14px;
  color: #111827;
  margin: 0;
  font-weight: 500;
}
```

---

## Integration

### Update DoctorPatients.jsx

```jsx
import PatientViewPage from './PatientViewPage';

const DoctorPatients = () => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const handleView = (patient) => {
    setSelectedPatientId(patient.id);
    setShowViewModal(true);
  };

  return (
    <>
      {/* List content */}
      
      {/* View Modal */}
      <PatientViewPage
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPatientId(null);
        }}
        patientId={selectedPatientId}
        showBillingTab={true}
      />
    </>
  );
};
```

---

## Summary

**What You Get:**
1. ✅ Full-screen modal (like Flutter dialog)
2. ✅ Patient header with avatar & edit button
3. ✅ 5 tabs (Profile, Medical History, Prescription, Lab Results, Billings)
4. ✅ Clean, organized information display
5. ✅ Smooth animations
6. ✅ Matches Flutter design

**Next Steps:**
1. Create PatientViewPage.jsx
2. Create PatientProfileHeader.jsx
3. Create tab components (ProfileTab, MedicalHistoryTab, etc.)
4. Create CSS files
5. Wire up in DoctorPatients.jsx
6. Test with real data

**Time Estimate:** 2-3 hours for complete implementation

