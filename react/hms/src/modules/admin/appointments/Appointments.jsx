import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Appointments.css';
import appointmentsService from '../../../services/appointmentsService';
import staffService from '../../../services/staffService';
import patientsService from '../../../services/patientsService';
import AppointmentViewModal from '../../../components/appointments/AppointmentViewModal';
import AppointmentEditModal from '../../../components/appointments/AppointmentEditModal';
import PatientView from '../../../components/patient/patientview';
import EditPatientModal from '../../../components/patient/EditPatientModal';

import NewAppointmentForm from './components/NewAppointmentForm';
import EditAppointmentForm from './components/EditAppointmentForm';
import StaffDetailEnterprise from '../staff/StaffDetailEnterprise';
import AddStaffDialog from '../staff/components/AddStaffDialog';

// Import doctor icons
import doctorFemaleIcon from '../../../assets/doctor-femaleicon.png';
import doctorMaleIcon from '../../../assets/doctor-male icon.png';

// --- MOCK DATA (KEPT FOR FALLBACK) ---
const MOCK_APPOINTMENTS = [
  {
    id: 1,
    patientName: 'Emma Wilson',
    patientId: 'PT-2049',
    doctor: 'Dr. Smith',
    doctorInitials: 'DS',
    doctorColor: '#DBEAFE',
    doctorTextColor: '#165a8a',
    date: 'Oct 24, 2023',
    time: '10:00 AM',
    service: 'General Checkup',
    status: 'Confirmed',
    gender: 'Female',
  },
  {
    id: 2,
    patientName: 'Michael Brown',
    patientId: 'PT-8832',
    doctor: 'Dr. Jones',
    doctorInitials: 'LJ',
    doctorColor: '#F3E8FF',
    doctorTextColor: '#6B21A8',
    date: 'Oct 24, 2023',
    time: '11:30 AM',
    service: 'Dental Cleaning',
    status: 'Pending',
    gender: 'Male',
  },
  {
    id: 3,
    patientName: 'Sarah Lee',
    patientId: 'PT-1290',
    doctor: 'Dr. Smith',
    doctorInitials: 'DS',
    doctorColor: '#DBEAFE',
    doctorTextColor: '#165a8a',
    date: 'Oct 24, 2023',
    time: '02:15 PM',
    service: 'Consultation',
    status: 'Cancelled',
    gender: 'Female',
  },
  {
    id: 4,
    patientName: 'James Chen',
    patientId: 'PT-5561',
    doctor: 'Dr. Roberts',
    doctorInitials: 'MR',
    doctorColor: '#D1FAE5',
    doctorTextColor: '#065F46',
    date: 'Oct 25, 2023',
    time: '09:00 AM',
    service: 'Follow-up',
    status: 'Confirmed',
    gender: 'Male',
  },
  {
    id: 5,
    patientName: 'Anna Davis',
    patientId: 'PT-3301',
    doctor: 'Dr. King',
    doctorInitials: 'WK',
    doctorColor: '#FFEDD5',
    doctorTextColor: '#9A3412',
    date: 'Oct 25, 2023',
    time: '10:45 AM',
    service: 'Therapy Session',
    status: 'Confirmed',
    gender: 'Female',
  },
  {
    id: 6,
    patientName: 'Robert Wilson',
    patientId: 'PT-9921',
    doctor: 'Dr. Smith',
    doctorInitials: 'DS',
    doctorColor: '#DBEAFE',
    doctorTextColor: '#165a8a',
    date: 'Oct 26, 2023',
    time: '11:00 AM',
    service: 'General Checkup',
    status: 'Pending',
    gender: 'Male',
  },
  {
    id: 7,
    patientName: 'Lucy Liu',
    patientId: 'PT-1123',
    doctor: 'Dr. Jones',
    doctorInitials: 'LJ',
    doctorColor: '#F3E8FF',
    doctorTextColor: '#6B21A8',
    date: 'Oct 26, 2023',
    time: '02:00 PM',
    service: 'Dental Cleaning',
    status: 'Confirmed',
    gender: 'Female',
  },
  {
    id: 8,
    patientName: 'David Kim',
    patientId: 'PT-8812',
    doctor: 'Dr. Roberts',
    doctorInitials: 'MR',
    doctorColor: '#D1FAE5',
    doctorTextColor: '#065F46',
    date: 'Oct 27, 2023',
    time: '09:30 AM',
    service: 'Follow-up',
    status: 'Cancelled',
    gender: 'Male',
  },
];

// --- ICONS ---
const Icons = {
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Clipboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Male: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#207DC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7"></circle>
      <line x1="21" y1="3" x2="15" y2="9"></line>
      <line x1="21" y1="3" x2="21" y2="8"></line>
      <line x1="21" y1="3" x2="16" y2="3"></line>
    </svg>
  ),
  Female: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="7"></circle>
      <line x1="12" y1="17" x2="12" y2="22"></line>
      <line x1="9" y1="19" x2="15" y2="19"></line>
    </svg>
  ),
  Doctor: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#165a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),

  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
};

// --- COMPONENTS ---
const Header = () => (
  <div className="dashboard-header">
    <div className="header-content">
      <h1 className="main-title">APPOINTMENTS</h1>
      <p className="main-subtitle">Manage bookings, schedules, and patient statuses</p>
    </div>
    <button
      className="btn-new-appointment"
      onClick={() => window.dispatchEvent(new CustomEvent('openNewAppointmentModal'))}
    >
      <Icons.Plus /> Add New
    </button>
  </div>
);

const FilterBar = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  showCalendar,
  setShowCalendar
}) => {
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowCalendar]);

  const handleDateSelect = (date) => {
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString().split('T')[0];

    // Toggle behavior: If clicking the already selected date, clear the filter
    if (localDate === selectedDate) {
      onDateChange(null);
    } else {
      onDateChange(localDate);
    }
    setShowCalendar(false);
  };
  return (
    <div className="filter-bar-container">
      <div className="filter-right-group">
        <div className="tabs-wrapper">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => onTabChange('all')}
          >
            All
          </button>
          <button
            className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => onTabChange('scheduled')}
          >
            Scheduled
          </button>
          <button
            className={`tab-btn ${activeTab === 'confirmed' ? 'active' : ''}`}
            onClick={() => onTabChange('confirmed')}
          >
            Confirmed
          </button>
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => onTabChange('pending')}
          >
            Pending
          </button>
          <button
            className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => onTabChange('cancelled')}
          >
            Cancelled
          </button>
        </div>

        <div className="calendar-filter-wrapper" ref={calendarRef}>
          <button
            className={`btn-filter-date ${selectedDate ? 'active' : ''}`}
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <Icons.Calendar />
            {selectedDate ? formatDate(selectedDate) : 'Filter by Date'}
            <span style={{ fontSize: '11px', marginLeft: '4px' }}>▼</span>
          </button>

          {showCalendar && (
            <div className="calendar-dropdown">
              <Calendar
                onChange={handleDateSelect}
                value={selectedDate ? new Date(selectedDate) : new Date()}
                className="custom-calendar"
              />
            </div>
          )}
        </div>
      </div>

      <div className="search-left-part">
        <div className="search-wrapper">
          <span className="search-icon-lg"><Icons.Search /></span>
          <input
            type="text"
<<<<<<< HEAD
            placeholder="Search by patient name, doctor, or status..."
=======
            placeholder="Search by patient name or doctor"
>>>>>>> 249291b432e7793c91288d90a324e7631e7735b4
            className="search-input-lg"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};


// --- HELPER FUNCTIONS ---

// Get doctor initials from name
const getDoctorInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Get doctor avatar color (cycle through predefined colors)
const getDoctorColor = (index) => {
  const colors = ['#DBEAFE', '#F3E8FF', '#D1FAE5', '#FFEDD5', '#FCE7F3'];
  return colors[index % colors.length];
};

// Get doctor text color (cycle through predefined colors)
const getDoctorTextColor = (index) => {
  const colors = ['#165a8a', '#6B21A8', '#065F46', '#9A3412', '#BE185D'];
  return colors[index % colors.length];
};

// Format date from API (YYYY-MM-DD) to display format (Oct 24, 2023)
const formatDate = (dateStr) => {
  if (!dateStr) return 'Not set';
  try {
    // Check for YYYY-MM-DD format
    const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (ymdRegex.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      // Create date object using local components (months are 0-indexed)
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Fallback for other formats
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Extract condition from patient data (Matched from Patients.jsx with enhancements for deeper nesting)
const extractCondition = (patient) => {
  if (!patient || typeof patient !== 'object') return 'N/A';

  // 1. Direct condition string
  if (patient.condition && patient.condition.trim()) {
    return patient.condition;
  }

  // Helper to format array of conditions
  const formatArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    if (arr.length === 1) return arr[0];
    return `${arr[0]} +${arr.length - 1}`;
  };

  // 2. medicalHistory (Array or Object with currentConditions)
  if (patient.medicalHistory) {
    if (Array.isArray(patient.medicalHistory)) {
      const res = formatArray(patient.medicalHistory);
      if (res) return res;
    } else if (typeof patient.medicalHistory === 'object' && patient.medicalHistory.currentConditions) {
      const res = formatArray(patient.medicalHistory.currentConditions);
      if (res) return res;
    }
  }

  // 3. metadata.medicalHistory (Array or Object with currentConditions)
  if (patient.metadata && patient.metadata.medicalHistory) {
    const metaHistory = patient.metadata.medicalHistory;
    if (Array.isArray(metaHistory)) {
      const res = formatArray(metaHistory);
      if (res) return res;
    } else if (typeof metaHistory === 'object' && metaHistory.currentConditions) {
      const res = formatArray(metaHistory.currentConditions);
      if (res) return res;
    }
  }

  // 4. metadata.condition
  if (patient.metadata?.condition && patient.metadata.condition.trim()) {
    return patient.metadata.condition;
  }

  // 5. Notes (as last resort)
  if (patient.notes && patient.notes.trim()) {
    const notes = patient.notes.trim();
    return notes.length > 30 ? `${notes.substring(0, 30)}...` : notes;
  }

  return 'N/A';
};

// Transform API appointment to component format (matching Flutter logic)
const transformAppointment = (apt, index) => {
  // Extract doctor field safely (may be String, Map, or null) - EXACTLY like Flutter
  let doctorName = '';
  let doctorGender = 'Male'; // Default
  if (apt.doctorId && typeof apt.doctorId === 'object') {
    const d = apt.doctorId;
    doctorName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
    doctorGender = d.gender || 'Male';
  } else if (typeof apt.doctorId === 'string') {
    doctorName = apt.doctorId;
  } else if (typeof apt.doctor === 'string') {
    doctorName = apt.doctor;
  }

  // Extract patient field safely - EXACTLY like Flutter
  let patientIdStr = '';
  let patientFullName = '';
  let gender = '';
  let patientCode = '';

  if (apt.patientId && typeof apt.patientId === 'object') {
    const p = apt.patientId;
    patientIdStr = p._id || '';
    patientFullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    gender = p.gender || '';

    // Extract patient code from root or metadata
    patientCode = p.patientCode || (p.metadata && typeof p.metadata === 'object' ? p.metadata.patientCode : '');
  } else if (typeof apt.patientId === 'string') {
    patientIdStr = apt.patientId;
    patientFullName = apt.clientName || '';
  }

  // CRITICAL: In your API, gender is stored in appointment metadata, not patient record
  // This overrides any patient gender (which is usually empty anyway)
  if (apt.metadata && apt.metadata.gender) {
    gender = apt.metadata.gender;
  }

  // Fallback: If still no gender, default to Male (matching Flutter behavior)
  if (!gender) {
    gender = 'Male';
  }

  // Debug: Log gender extraction for first few records
  if (index < 3) {
    console.log(`📝 Transform ${index}:`, {
      name: patientFullName,
      patientGender: apt.patientId?.gender,
      metadataGender: apt.metadata?.gender,
      finalGender: gender,
      aptId: apt._id
    });
  }

  // If patientFullName is still empty, try clientName
  if (!patientFullName && apt.clientName) {
    patientFullName = apt.clientName;
  }

  // Parse date/time - EXACTLY like Flutter
  let date = apt.date || '';
  let time = apt.time || '';

  // Normalize date to YYYY-MM-DD for consistent filtering
  if (date && date.includes('T')) {
    // If it's an ISO timestamp, parse it to local date to align with filter
    try {
      const dt = new Date(date);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;
    } catch (e) {
      date = date.split('T')[0];
    }
  }

  // If date/time not present, try startAt
  if (!date && apt.startAt) {
    try {
      const dt = new Date(apt.startAt);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`; // Local YYYY-MM-DD

      time = dt.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Extract reason/chiefComplaint
  let reason = '';
  if (apt.chiefComplaint) {
    reason = String(apt.chiefComplaint).trim();
  } else if (apt.reason) {
    reason = String(apt.reason).trim();
  } else if (apt.metadata && apt.metadata.chiefComplaint) {
    reason = String(apt.metadata.chiefComplaint).trim();
  } else if (apt.metadata && apt.metadata.reason) {
    reason = String(apt.metadata.reason).trim();
  } else if (apt.notes) {
    reason = String(apt.notes).trim();
  }

  // Store both display ID and actual patient object for lookup
  return {
    id: String(apt._id || apt.id || index),
    patientName: patientFullName || 'Unknown',
    patientId: patientCode || patientIdStr || `PT-${index}`, // Display code
    patientIdObj: apt.patientId, // CRITICAL: Store original patient object with _id
    doctor: doctorName || 'Not Assigned',
    doctorGender: doctorGender, // Add doctor gender for icon display
    doctorIdObj: apt.doctorId, // Store original doctor object with _id
    doctorInitials: getDoctorInitials(doctorName),
    doctorColor: getDoctorColor(index),
    doctorTextColor: getDoctorTextColor(index),
    date: formatDate(date),
    rawDate: date, // Keep raw YYYY-MM-DD for filtering
    time: time || 'Not set',
    service: apt.appointmentType || reason || 'Consultation',
    status: apt.status ? (apt.status.charAt(0).toUpperCase() + apt.status.slice(1).toLowerCase()) : 'Scheduled',
    gender: gender || 'Male',
    condition: reason || extractCondition(apt.patientId) // Prioritize appointment reason over general condition
  };
};

// --- MAIN PAGE ---

const Appointments = () => {
  // const navigate = useNavigate(); // Reserved for future navigation
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewApptModal, setShowNewApptModal] = useState(false);

  // Pre-selected patient for new appointment
  const [preSelectedPatient, setPreSelectedPatient] = useState(null);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Patient dialog states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);

  // Doctor/Staff dialog states
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
<<<<<<< HEAD
=======
  const [showDoctorEditForm, setShowDoctorEditForm] = useState(false);

  // Patient edit form state
  const [showPatientEditForm, setShowPatientEditForm] = useState(false);
>>>>>>> 249291b432e7793c91288d90a324e7631e7735b4

  // Handle new patient navigation for immediate booking
  useEffect(() => {
    if (location.state?.newPatient) {
      console.log('🎉 [Appointments] Detected new patient from navigation:', location.state.newPatient);
      const np = location.state.newPatient;

      // Transform to format expected by NewAppointmentForm
      const pData = {
        id: np.id || np._id || np.patientId,
        name: np.name || `${np.firstName || ''} ${np.lastName || ''}`.trim(),
        age: np.age,
        gender: np.gender,
        phone: np.phone || np.contact || ''
      };

      setPreSelectedPatient(pData);
      setShowNewApptModal(true);
    }
  }, [location.state]);

  // Fetch appointments from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await appointmentsService.fetchAppointments();
        console.log('✅ Fetched appointments from API:', data);

        // Log first appointment to see structure
        if (data && data.length > 0) {
          console.log('📊 First appointment structure:', JSON.stringify(data[0], null, 2));
        }

        // Transform API data to match component's expected format
        const transformed = data.map((apt, index) => transformAppointment(apt, index));

        // Log transformed data
        console.log('🔄 Transformed appointments:', transformed);

        setAllAppointments(transformed);
        setFilteredAppointments(transformed);
      } catch (error) {
        console.error('❌ Failed to fetch appointments:', error);
        showNotification('Failed to load appointments from server.', 'error');
        // Fallback to mock data if API fails
        setAllAppointments(MOCK_APPOINTMENTS);
        setFilteredAppointments(MOCK_APPOINTMENTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Listen for the custom event to open new appointment modal
    const handleOpenNewModal = () => setShowNewApptModal(true);
    window.addEventListener('openNewAppointmentModal', handleOpenNewModal);

    return () => {
      window.removeEventListener('openNewAppointmentModal', handleOpenNewModal);
    };
  }, []);

  // Filter appointments based on tab and search
  useEffect(() => {
    let result = allAppointments;
    if (activeTab !== 'all') {
      result = result.filter(a => a.status.toLowerCase() === activeTab.toLowerCase());
    }

    if (selectedDate) {
      result = result.filter(a => a.rawDate === selectedDate);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.patientName.toLowerCase().includes(q) ||
        a.patientId.toLowerCase().includes(q) ||
        a.doctor.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
      );
    }

    // Sort alphabetically by patient name
    result.sort((a, b) => a.patientName.localeCompare(b.patientName));

    setFilteredAppointments(result);
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedDate, allAppointments]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredAppointments.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredAppointments.length / rowsPerPage);

  // Refresh appointments after changes
  const refreshAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await appointmentsService.fetchAppointments();
      const transformed = data.map((apt, index) => transformAppointment(apt, index));
      setAllAppointments(transformed);
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view appointment
  const handleView = (appointment) => {
    setSelectedAppointmentId(appointment.id);
    setShowViewModal(true);
  };

  // Handle edit appointment
  const handleEdit = (appointment) => {
    setSelectedAppointmentId(appointment.id);
    setShowEditModal(true);
  };

  // Handle update from EditAppointmentForm
  const handleUpdateSuccess = async () => {
    await refreshAppointments();
  };

  const handleDeleteSuccess = async () => {
    await refreshAppointments();
  };



  // Handle patient name click - open patient details dialog
  const handlePatientNameClick = async (appointment) => {
    try {
      console.log('🔍 [handlePatientNameClick] Full appointment data:', appointment);

      // Extract patient object from appointment
      const originalApt = allAppointments.find(a => a.id === appointment.id);
      console.log('📦 [handlePatientNameClick] Original appointment:', originalApt);

      let patientId = appointment.patientIdObj?._id || appointment.patientIdObj || appointment.patientId;

      // Fallbacks if patientId is still not clear (e.g. string "PT-123")
      // But transforming logic puts original object in patientIdObj

      if (!patientId) {
        // Try to get from originalApt
        if (originalApt?.patientId?._id) patientId = originalApt.patientId._id;
        else if (originalApt?.patientId) patientId = originalApt.patientId;
      }

      // If patientId is a string like "PT-xxx" (display ID) vs ObjectId, PatientView might fail if it expects ObjectId
      // But existing logic seemed to rely on objects
      // Let's pass the object if possible to PatientView? No, PatientView expects ID.
      // So ensuring we have the ID.

      // Simplification: Just set the "patient" state with ID, let PatientView fetch.
      // We will reuse "selectedPatient" state but just store the ID (or minimal object with ID).

      // Let's store an object { _id: ... } compatible with what we pass to PatientView

      const patientData = {
        _id: patientId
      };

      setSelectedPatient(patientData); // We will pass selectedPatient._id to PatientView
      setShowPatientDialog(true);
    } catch (error) {
      console.error('❌ Error handling patient click:', error);
    }
  };

  const handleClosePatientDialog = () => {
    setShowPatientDialog(false);
    setSelectedPatient(null);
  };

  // Handle doctor name click - open staff details dialog
  const handleDoctorNameClick = async (appointment) => {
    try {
      console.log('🔍 [handleDoctorNameClick] Appointment data:', appointment);

      // Extract doctor object from appointment
      const originalApt = allAppointments.find(a => a.id === appointment.id);
      console.log('📦 [handleDoctorNameClick] Original appointment:', originalApt);

      let doctorData = null;

      // Try to get doctor data from original appointment (as object, not just ID)
      if (originalApt) {
        // Check if doctorIdObj exists and is an object with full data
        if (originalApt.doctorIdObj && typeof originalApt.doctorIdObj === 'object') {
          doctorData = originalApt.doctorIdObj;
          console.log('✅ Found doctor data from doctorIdObj:', doctorData);
        }
        // Fallback: check if doctorId is an object with full data
        else if (originalApt.doctorId && typeof originalApt.doctorId === 'object') {
          doctorData = originalApt.doctorId;
          console.log('✅ Found doctor data from doctorId:', doctorData);
        }
      }

      if (!doctorData || typeof doctorData !== 'object') {
        console.error('❌ Could not extract doctor data from appointment');
        console.error('Available appointment data:', appointment);
        return;
      }

      // Transform doctor data to match Staff model format expected by StaffDetailEnterprise
      const staffDetails = {
        id: doctorData._id,
        _id: doctorData._id,
        name: `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim(),
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        email: doctorData.email,
        contact: doctorData.phone || doctorData.contact,
        phone: doctorData.phone || doctorData.contact,
        gender: doctorData.gender,
        designation: doctorData.role || 'Doctor',
        department: doctorData.department || 'Medical',
        status: doctorData.status || 'Active',
        joinDate: doctorData.joinDate || doctorData.createdAt,
        address: doctorData.address,
        salary: doctorData.salary,
        notes: doctorData.notes,
        tags: doctorData.tags,
        metadata: doctorData.metadata,
        ...doctorData // Spread any additional fields
      };

      console.log('✅ Transformed staff details:', staffDetails);

      setSelectedDoctor(staffDetails);
      setShowDoctorDialog(true);
    } catch (error) {
      console.error('❌ Error loading doctor details:', error);
    }
  };

  const handleCloseDoctorDialog = () => {
    setShowDoctorDialog(false);
<<<<<<< HEAD
    setSelectedDoctor(null);
  };

=======
    setShowDoctorEditForm(false);
    setSelectedDoctor(null);
  };

  const handleEditDoctor = (doctorData) => {
    // Close detail dialog and open edit form
    setShowDoctorDialog(false);
    setShowDoctorEditForm(true);
  };

  const handleDoctorFormSubmit = async (formData) => {
    try {
      // Update staff via API
      await staffService.updateStaff(formData);
      
      // Close edit form and refresh appointments
      setShowDoctorEditForm(false);
      setSelectedDoctor(null);
      await refreshAppointments();
      showNotification('Doctor profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update doctor profile:', error);
      showNotification('Failed to update doctor profile: ' + error.message, 'error');
    }
  };

  const handleDoctorFormCancel = () => {
    setShowDoctorEditForm(false);
    setSelectedDoctor(null);
  };

  // Patient edit handlers
  const handleEditPatient = (patientData) => {
    // Close patient view dialog and open edit form
    setShowPatientDialog(false);
    setShowPatientEditForm(true);
  };

  const handlePatientFormSubmit = async () => {
    try {
      // Close edit form and refresh appointments
      setShowPatientEditForm(false);
      setSelectedPatient(null);
      await refreshAppointments();
      showNotification('Patient profile updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update patient profile:', error);
      showNotification('Failed to update patient profile: ' + error.message, 'error');
    }
  };

  const handlePatientFormCancel = () => {
    setShowPatientEditForm(false);
    setSelectedPatient(null);
  };

>>>>>>> 249291b432e7793c91288d90a324e7631e7735b4
  // Handle quick status toggle from table
  const handleStatusToggle = async (appointment) => {
    // Only cycle through statuses that match the main page tabs and form options
    const statuses = ['Scheduled', 'Confirmed', 'Pending', 'Cancelled'];

    console.log('🎯 [handleStatusToggle] Starting status toggle for appointment:', {
      appointmentId: appointment.id,
      currentStatus: appointment.status,
      availableStatuses: statuses
    });

    const currentIndex = statuses.indexOf(appointment.status);

    if (currentIndex === -1) {
      console.warn('⚠️ Current status not in cycle list, defaulting to Scheduled');
      const nextStatus = 'Scheduled';

      try {
        console.log(`🔄 Setting status to: ${nextStatus}`);
        await appointmentsService.updateAppointmentStatus(appointment.id, nextStatus);
        showNotification(`Appointment status updated to ${nextStatus}`, 'success');
        await refreshAppointments();
      } catch (error) {
        console.error('❌ Failed to update status:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        showNotification(`Failed to update status: ${error.response?.data?.message || error.message}`, 'error');
      }
      return;
    }

    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    try {
      console.log(`🔄 Toggling status: ${appointment.status} -> ${nextStatus}`);
      console.log(`📡 Calling API: updateAppointmentStatus(${appointment.id}, ${nextStatus})`);

      const result = await appointmentsService.updateAppointmentStatus(appointment.id, nextStatus);

      console.log('✅ Status update successful:', result);
      showNotification(`Appointment status updated to ${nextStatus}`, 'success');
      await refreshAppointments();
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        appointmentId: appointment.id,
        attemptedStatus: nextStatus
      });
      showNotification(`Failed to update status: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Handle delete appointment
  const handleDelete = async (appointment) => {
    if (!window.confirm(`Are you sure you want to delete the appointment for ${appointment.patientName}?`)) {
      return;
    }
    try {
      setIsLoading(true);
      await appointmentsService.deleteAppointment(appointment.id);
      console.log('✅ Deleted appointment:', appointment.id);
      showNotification('Appointment deleted successfully', 'success');

      // Refresh appointments list
      await refreshAppointments();
    } catch (error) {
      console.error('❌ Failed to delete appointment:', error);
      showNotification('Failed to delete appointment', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="appointments-page dashboard-container">
      <Header />
      {notification && (
        <div className={`modern-notification ${notification.type}`}>
          <div className="notif-content">
            <span className="notif-icon">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="notif-msg">{notification.message}</span>
          </div>
          <button className="notif-close" onClick={() => setNotification(null)}>×</button>
        </div>
      )}
      <FilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
      />
      <div className="table-card">
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Patient</th>
                <th style={{ width: '18%' }}>Doctor</th>
                <th style={{ width: '18%' }}>Date & Time</th>
                <th style={{ width: '15%' }}>Condition</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((apt, idx) => {
                // Determine avatar based on gender (matching Flutter logic)
                const genderStr = (apt.gender || '').toLowerCase().trim();
                let avatarSrc;
                if (genderStr.includes('female') || genderStr.startsWith('f')) {
                  avatarSrc = '/girlicon.png';
                } else {
                  avatarSrc = '/boyicon.png';
                }

                // Debug EVERY row
                if (idx < 5) { // Only log first 5 to avoid console spam
                  console.log(`🎨 Row ${idx}:`, {
                    name: apt.patientName,
                    gender: apt.gender,
                    genderStr: genderStr,
                    avatarSrc: avatarSrc,
                    fullObject: apt
                  });
                }

                return (
                  <tr key={apt.id}>
                    {/* PATIENT COLUMN - Clickable */}
                    <td>
                      <div
                        className="cell-patient clickable"
                        onClick={() => handlePatientNameClick(apt)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={avatarSrc}
                          alt={apt.gender}
                          className="patient-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="gender-icon-box" style={{ display: 'none' }}>
                          {apt.gender === 'Female' ? <Icons.Female /> : <Icons.Male />}
                        </div>
                        <div className="info-group">
                          <span className="primary font-semibold">{apt.patientName}</span>
                          <span className="secondary opacity-60 text-xs">{apt.patientId}</span>
                        </div>
                      </div>
                    </td>

                    {/* DOCTOR COLUMN - Match Patient List Style */}
                    <td>
                      <div className="cell-doctor" onClick={() => handleDoctorNameClick(apt)}>
                        <img
                          src={apt.doctorGender === 'Female' ? doctorFemaleIcon : doctorMaleIcon}
                          alt={apt.doctor}
                          className="patient-avatar"
                        />
                        <div className="info-group">
                          <span className="primary font-semibold">{apt.doctor}</span>
<<<<<<< HEAD
                          <span className="secondary opacity-60 text-xs text-blue-primary">(MD)</span>
=======
                          <span 
                            className="secondary opacity-60 text-xs text-blue-primary" 
                            title="Medical Doctor"
                            style={{ cursor: 'help' }}
                          >
                            (MD)
                          </span>
>>>>>>> 249291b432e7793c91288d90a324e7631e7735b4
                        </div>
                      </div>
                    </td>

                    {/* DATE & TIME - Split View */}
                    <td>
                      <div className="info-group">
                        <span className="primary font-semibold">{apt.date}</span>
                        <span className="secondary opacity-60 text-xs">@{apt.time}</span>
                      </div>
                    </td>

                    {/* CONDITION */}
                    <td className="cell-condition">{apt.condition}</td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`status-pill ${apt.status.toLowerCase()} status-editable clickable`}
                        onClick={() => handleStatusToggle(apt)}
                        title="Click to change status"
                      >
                        {apt.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-buttons-group">
                        <button className="btn-action edit" title="Edit" onClick={() => handleEdit(apt)}>
                          <Icons.Edit />
                        </button>
                        <button className="btn-action view" title="View" onClick={() => handleView(apt)}>
                          <Icons.Eye />
                        </button>
                        <button className="btn-action delete" title="Delete" onClick={() => handleDelete(apt)}>
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#207DC0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <span>Loading appointments...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && currentRows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    No appointments found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination-footer">
          <button
            className="page-arrow-circle leading"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <Icons.ChevronLeft />
          </button>

          <div className="page-indicator-box">
            Page {currentPage} of {totalPages || 1}
          </div>

          <button
            className="page-arrow-circle trailing"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            <Icons.ChevronRight />
          </button>
        </div>
      </div>

      {/* VIEW MODAL */}
      <AppointmentViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        appointmentId={selectedAppointmentId}
        appointmentData={allAppointments.find(a => a.id === selectedAppointmentId)}
        onEdit={() => {
          setShowViewModal(false);
          setShowEditModal(true);
        }}
        onPatientClick={handlePatientNameClick}
      />

      {/* NEW APPOINTMENT MODAL */}
      {showNewApptModal && (
        <NewAppointmentForm
          onClose={() => setShowNewApptModal(false)}
          onSave={async () => {
            setShowNewApptModal(false);
            await refreshAppointments();
          }}
          initialPatient={preSelectedPatient}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedAppointmentId && (
        <EditAppointmentForm
          appointmentId={selectedAppointmentId}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateSuccess}
          onDelete={handleDeleteSuccess}
        />
      )}



      {/* Patient View - Replaces AppointmentPreviewDialog */}
      <PatientView
        patientId={selectedPatient?._id || selectedPatient?.id}
        isOpen={showPatientDialog}
        onClose={handleClosePatientDialog}
<<<<<<< HEAD
=======
        onEdit={handleEditPatient}
>>>>>>> 249291b432e7793c91288d90a324e7631e7735b4
      />

      {/* Staff Detail Dialog - Show doctor/staff details */}
      {showDoctorDialog && selectedDoctor && (
        <StaffDetailEnterprise
          staffId={selectedDoctor.id || selectedDoctor._id}
          initial={selectedDoctor}
          onClose={handleCloseDoctorDialog}
<<<<<<< HEAD
          onUpdate={(updatedStaff) => {
            console.log('Staff updated:', updatedStaff);
            // Optionally refresh appointments if needed
          }}
=======
          onUpdate={handleEditDoctor}
        />
      )}

      {/* Staff Edit Form - Edit doctor/staff profile */}
      {showDoctorEditForm && selectedDoctor && (
        <AddStaffDialog
          initial={selectedDoctor}
          onSubmit={handleDoctorFormSubmit}
          onCancel={handleDoctorFormCancel}
        />
      )}

      {/* Patient Edit Form - Edit patient profile */}
      {showPatientEditForm && selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          isOpen={showPatientEditForm}
          onClose={handlePatientFormCancel}
          onSuccess={handlePatientFormSubmit}
>>>>>>> 249291b432e7793c91288d90a324e7631e7735b4
        />
      )}
    </div>
  );
};

export default Appointments;