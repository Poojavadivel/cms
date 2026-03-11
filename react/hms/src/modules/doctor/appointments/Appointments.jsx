import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// import { useNavigate } from 'react-router-dom'; // Reserved for future navigation
import './Appointments.css';
import appointmentsService from '../../../services/appointmentsService';
import patientsService from '../../../services/patientsService';
import AppointmentViewModal from '../../../components/appointments/AppointmentViewModal';
import AppointmentEditModal from '../../../components/appointments/AppointmentEditModal';
import AppointmentIntakeModal from '../../../components/appointments/AppointmentIntakeModal';
import PatientView from '../../../components/patient/patientview';

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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#207DC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Intake: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
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
  <div className="appointments-header">
    <div className="header-content">
      <h1 className="main-title">APPOINTMENTS</h1>
      <p className="main-subtitle">Manage bookings, schedules, and patient statuses</p>
    </div>
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
      <div className="search-wrapper">
        <span className="search-icon-lg"><Icons.Search /></span>
        <input
          type="text"
          placeholder="Search by patient name, doctor, or status..."
          className="search-input-lg"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

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

          {selectedDate && (
            <button className="btn-clear-date-mini" onClick={() => onDateChange(null)} title="Clear date filter">
              <Icons.Close />
            </button>
          )}

          {showCalendar && (
            <div className="calendar-dropdown">
              <Calendar
                onChange={handleDateSelect}
                value={selectedDate ? new Date(selectedDate) : new Date()}
                className="premium-calendar"
              />
            </div>
          )}
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Transform API appointment to component format (matching Flutter logic)
const transformAppointment = (apt, index) => {
  // Extract doctor field safely (may be String, Map, or null) - EXACTLY like Flutter
  let doctorName = '';
  if (apt.doctorId && typeof apt.doctorId === 'object') {
    const d = apt.doctorId;
    doctorName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
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

    // Extract patient code from metadata
    if (p.metadata && typeof p.metadata === 'object') {
      patientCode = p.metadata.patientCode || '';
    }
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
  // FIX: Ensure rawDate is always local YYYY-MM-DD for accurate filtering
  let rawDate = '';
  let displayTime = apt.time || '';

  if (apt.date && typeof apt.date === 'string' && apt.date.length === 10 && !apt.date.includes('T')) {
    // It's likely already YYYY-MM-DD
    rawDate = apt.date;
  } else if (apt.startAt || apt.date) {
    const source = apt.startAt || apt.date;
    const dt = new Date(source);
    if (!isNaN(dt.getTime())) {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      rawDate = `${year}-${month}-${day}`;

      if (!displayTime) {
        displayTime = dt.toTimeString().substring(0, 5);
      }
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
    doctorInitials: getDoctorInitials(doctorName),
    doctorColor: getDoctorColor(index),
    doctorTextColor: getDoctorTextColor(index),
    date: formatDate(rawDate),
    rawDate: rawDate, // Keep raw YYYY-MM-DD for filtering
    time: displayTime || 'Not set',
    service: apt.appointmentType || reason || 'Consultation',
    reason: reason || 'Not specified', // Add reason field
    status: apt.status ? (apt.status.charAt(0).toUpperCase() + apt.status.slice(1).toLowerCase()) : 'Scheduled',
    gender: gender || 'Male'
  };
};

// --- MAIN PAGE ---

const Appointments = () => {
  // const navigate = useNavigate(); // Reserved for future navigation
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
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Patient dialog states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);

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

  // CHECK FOR NEW PENDING APPOINTMENTS (Simulated Notification)
  useEffect(() => {
    const pendingCount = allAppointments.filter(a => a.status === 'Pending').length;
    if (pendingCount > 0) {
      // You could show a toast here if desired, e.g.:
      // showNotification(`You have ${pendingCount} pending appointments to approve.`, 'info');
    }
  }, [allAppointments]);

  // Handle APPROVE Specific Action
  const handleApprove = async (appointment) => {
    try {
      console.log(`✅ Approving appointment ${appointment.id}`);
      await appointmentsService.updateAppointmentStatus(appointment.id, 'Confirmed');
      showNotification(`Appointment for ${appointment.patientName} APPROVED`, 'success');
      await refreshAppointments();
    } catch (error) {
      console.error('❌ Failed to approve:', error);
      showNotification('Failed to approve appointment', 'error');
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

  // Handle intake form
  const handleIntake = (appointment) => {
    setSelectedAppointmentId(appointment.id);
    setShowIntakeModal(true);
  };

  // Handle patient name click - open patient details dialog
  const handlePatientNameClick = async (appointment) => {
    try {
      console.log('🔍 [handlePatientNameClick] Full appointment data:', appointment);

      // Extract patient UUID (_id) from appointment - NOT patientCode!
      let patientUUID = null;

      // Try to get from the original appointment data stored in the transform
      const originalApt = allAppointments.find(a => a.id === appointment.id);
      console.log('📦 [handlePatientNameClick] Original appointment:', originalApt);

      if (originalApt && originalApt.patientIdObj) {
        patientUUID = originalApt.patientIdObj._id;
        console.log('✅ Found patient UUID from patientIdObj:', patientUUID);
      }

      if (!patientUUID) {
        console.error('❌ Could not extract patient UUID from appointment');
        console.error('Available appointment data:', appointment);
        return;
      }

      console.log('🔄 Fetching patient by UUID:', patientUUID);

      // Fetch full patient details using UUID
      const fullPatient = await patientsService.fetchPatientById(patientUUID);
      console.log('✅ Fetched full patient:', fullPatient);

      // Enrich patient data with info from appointment if available
      if (originalApt && originalApt.patientIdObj && originalApt.patientIdObj.metadata) {
        const appointmentMetadata = originalApt.patientIdObj.metadata;
        console.log('📦 Enriching with appointment metadata:', appointmentMetadata);

        // Add emergency contacts from appointment metadata if not in patient record
        if (!fullPatient.emergencyContactName && appointmentMetadata.emergencyContactName) {
          fullPatient.emergencyContactName = appointmentMetadata.emergencyContactName;
          fullPatient.emergencyContactPhone = appointmentMetadata.emergencyContactPhone;
          console.log('✅ Added emergency contact:', fullPatient.emergencyContactName);
        }

        // Add insurance from appointment metadata if not in patient record
        if (!fullPatient.insuranceNumber && appointmentMetadata.insurance) {
          fullPatient.insuranceNumber = appointmentMetadata.insurance.policyNumber;
          fullPatient.expiryDate = appointmentMetadata.insurance.validUntil;
          console.log('✅ Added insurance:', fullPatient.insuranceNumber);
        }

        // Add medical history from appointment metadata - ENSURE it's always an array
        if (appointmentMetadata.medicalHistory) {
          if (Array.isArray(appointmentMetadata.medicalHistory)) {
            // Already an array
            fullPatient.medicalHistory = appointmentMetadata.medicalHistory;
            console.log('✅ Added medical history (array):', fullPatient.medicalHistory);
          } else if (typeof appointmentMetadata.medicalHistory === 'object' && appointmentMetadata.medicalHistory.currentConditions) {
            // Extract currentConditions array from object
            fullPatient.medicalHistory = Array.isArray(appointmentMetadata.medicalHistory.currentConditions)
              ? appointmentMetadata.medicalHistory.currentConditions
              : [];
            console.log('✅ Added medical history (from currentConditions):', fullPatient.medicalHistory);
          }
        }

        // Ensure medicalHistory is always an array
        if (!Array.isArray(fullPatient.medicalHistory)) {
          console.warn('⚠️ medicalHistory is not an array, converting:', fullPatient.medicalHistory);
          fullPatient.medicalHistory = [];
        }
      }

      setSelectedPatient(fullPatient);
      setShowPatientDialog(true);
    } catch (error) {
      console.error('❌ Error fetching patient details:', error);
    }
  };

  const handleClosePatientDialog = () => {
    setShowPatientDialog(false);
    setSelectedPatient(null);
  };

  // Handle quick status toggle from table
  const handleStatusToggle = async (appointment) => {
    const statuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Pending'];
    const currentIndex = statuses.indexOf(appointment.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    try {
      console.log(`🔄 Toggling status for ${appointment.id}: ${appointment.status} -> ${nextStatus}`);
      await appointmentsService.updateAppointmentStatus(appointment.id, nextStatus);
      showNotification(`Appointment status updated to ${nextStatus}`, 'success');
      await refreshAppointments();
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      showNotification('Failed to update status', 'error');
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
    <div className="dashboard-container">
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
                <th style={{ width: '18%' }}>Date & Time</th>
                <th style={{ width: '15%' }}>Service</th>
                <th style={{ width: '18%' }}>Reason</th>
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
                    <td
                      className="cell-patient clickable"
                      onClick={() => handlePatientNameClick(apt)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={avatarSrc}
                        alt={apt.gender}
                        className="patient-avatar"
                        onError={(e) => {
                          // Fallback if image doesn't load
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="gender-icon-box" style={{ display: 'none' }}>
                        {apt.gender === 'Female' ? <Icons.Female /> : <Icons.Male />}
                      </div>
                      <div className="info-group">
                        <span className="primary patient-name-clickable">
                          {apt.patientName}
                        </span>
                        <span className="secondary">{apt.patientId}</span>
                      </div>
                    </td>

                    {/* DATE COLUMN */}
                    <td>
                      <div className="info-group">
                        <span className="primary">{apt.date}</span>
                        <span className="secondary">{apt.time}</span>
                      </div>
                    </td>

                    {/* SERVICE */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{apt.service}</td>

                    {/* REASON */}
                    <td style={{ fontWeight: 500, color: '#64748b', fontStyle: apt.reason === 'Not specified' ? 'italic' : 'normal' }}>
                      {apt.reason}
                    </td>

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
                        <button className="btn-action intake" title="Intake" onClick={() => handleIntake(apt)}>
                          <Icons.Intake />
                        </button>
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

      {/* Modals */}
      <AppointmentViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        appointmentId={selectedAppointmentId}
        onEdit={(appointment) => {
          setShowViewModal(false);
          setSelectedAppointmentId(appointment._id || appointment.id);
          setShowEditModal(true);
        }}
      />

      <AppointmentEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        appointmentId={selectedAppointmentId}
        onSuccess={refreshAppointments}
      />

      <AppointmentIntakeModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        appointmentId={selectedAppointmentId}
        onSuccess={refreshAppointments}
      />

      {/* Patient View Dialog - Same as Admin Module */}
      <PatientView
        patient={selectedPatient}
        isOpen={showPatientDialog}
        onClose={handleClosePatientDialog}
        showBillingTab={false}
      />
    </div>
  );
};

export default Appointments;
