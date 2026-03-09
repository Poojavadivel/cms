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
  <div className="bg-slate-50 border-l-[6px] border-teal-500 rounded-xl px-6 py-8 mb-6 flex flex-col shadow-sm relative overflow-hidden h-32 justify-center">
    {/* Clean subtle pattern or gradient in background if needed, but keeping it minimalist */}
    <div className="relative z-10">
      <h1 className="text-slate-900 text-3xl font-bold uppercase tracking-tight m-0">
        APPOINTMENTS
      </h1>
      <p className="text-slate-500 mt-2 font-medium text-sm m-0">
        Manage bookings, schedules, and patient statuses
      </p>
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
    if (localDate === selectedDate) {
      onDateChange(null);
    } else {
      onDateChange(localDate);
    }
    setShowCalendar(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-lg">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icons.Search />
        </span>
        <input
          type="text"
          placeholder="Search by patient name, doctor, or status..."
          className="w-full bg-slate-50 border-transparent rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all outline-none"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Segmented Control Tabs */}
        <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1 overflow-x-auto">
          {['upcoming', 'all', 'completed', 'cancelled'].map((tabId) => (
            <button
              key={tabId}
              onClick={() => onTabChange(tabId)}
              className={`capitalize px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === tabId
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              {tabId}
            </button>
          ))}
        </div>

        {/* Date Filter Button */}
        <div className="relative" ref={calendarRef}>
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-2 border text-sm font-medium rounded-lg px-4 py-2 transition-colors ${selectedDate ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <Icons.Calendar />
              {selectedDate ? formatDate(selectedDate) : 'Filter by Date'}
              <span className="text-[10px] ml-1 opacity-70">▼</span>
            </button>

            {selectedDate && (
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                onClick={() => onDateChange(null)}
                title="Clear date filter"
              >
                <Icons.Close />
              </button>
            )}
          </div>

          {showCalendar && (
            <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-200 p-4 min-w-[320px]">
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

// --- SEMANTIC STATUS BADGE ---
const StatusBadge = ({ status, onClick }) => {
  const s = status ? status.toLowerCase() : '';

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  if (onHoverClickStyles(styles, s)) {
    // Handled inside
  }

  // Custom semantic matching
  if (['scheduled', 'pending'].includes(s)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-100';
  } else if (['confirmed', 'completed'].includes(s)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  } else if (['cancelled', 'no-show', 'noshow'].includes(s)) {
    styles = 'bg-red-50 text-red-700 border-red-100';
  } else if (['rescheduled'].includes(s)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-100';
  }

  return (
    <span
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${onClick ? 'cursor-pointer hover:shadow-sm hover:scale-105 active:scale-95' : ''} ${styles}`}
      title={onClick ? "Click to change status" : ""}
    >
      {status}
    </span>
  );
};

// Dummy helper used above.
function onHoverClickStyles(base, status) {
  return false;
}

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

  // Extract reason/chiefComplaint/followUpReason
  let reason = '';
  if (apt.followUpReason) {
    reason = String(apt.followUpReason).trim();
  } else if (apt.chiefComplaint) {
    reason = String(apt.chiefComplaint).trim();
  } else if (apt.reason) {
    reason = String(apt.reason).trim();
  } else if (apt.metadata && apt.metadata.followUpReason) {
    reason = String(apt.metadata.followUpReason).trim();
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
  const [activeTab, setActiveTab] = useState('upcoming'); // Changed from 'all' to show only upcoming appointments
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

  // Fetch appointments from API on mount or when tab changes to deleted
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch deleted appointments if on deleted tab, otherwise fetch regular appointments
        const data = activeTab === 'deleted'
          ? await appointmentsService.fetchDeletedAppointments()
          : await appointmentsService.fetchAppointments();

        console.log(`✅ Fetched ${activeTab === 'deleted' ? 'deleted ' : ''}appointments from API:`, data);

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
        // Fallback to mock data if API fails (only for non-deleted tabs)
        if (activeTab !== 'deleted') {
          setAllAppointments(MOCK_APPOINTMENTS);
          setFilteredAppointments(MOCK_APPOINTMENTS);
        } else {
          setAllAppointments([]);
          setFilteredAppointments([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]); // Re-fetch when tab changes

  // Reset state on component mount to ensure fresh start
  useEffect(() => {
    setActiveTab('upcoming'); // Changed from 'all' to 'upcoming'
    setSearchQuery('');
    setSelectedDate(null);
    setCurrentPage(1);
    setShowCalendar(false);

    return () => {
      // Cleanup: reset state when component unmounts
      setAllAppointments([]);
      setFilteredAppointments([]);
    };
  }, []); // Empty dependency array = runs only on mount/unmount

  // Filter appointments based on tab and search
  useEffect(() => {
    let result = allAppointments;

    // Get today's date and current time (LOCAL timezone)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`; // Local YYYY-MM-DD

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    console.log('📅 Today (local):', todayStr, '| Current time:', currentTimeStr); // Debug log

    // Filter by tab
    if (activeTab === 'upcoming') {
      // Show appointments for today and future dates, exclude completed/cancelled
      result = result.filter(a => {
        const aptDate = a.rawDate; // YYYY-MM-DD format
        const aptTime = a.time || ''; // HH:MM format or empty

        const isNotCompleted = a.status.toLowerCase() !== 'completed';
        const isNotCancelled = a.status.toLowerCase() !== 'cancelled';

        let isUpcoming = false;

        // Future dates are always upcoming
        if (aptDate > todayStr) {
          isUpcoming = true;
        }
        // Today's date - check time
        else if (aptDate === todayStr) {
          // If no time specified, show it (assume future)
          if (!aptTime || aptTime === 'Not set') {
            isUpcoming = true;
          } else {
            // Compare time (HH:MM format)
            isUpcoming = aptTime > currentTimeStr;
          }
        }
        // Past dates are not upcoming
        else {
          isUpcoming = false;
        }

        // Debug log for first few appointments
        if (result.indexOf(a) < 5) {
          console.log(`🔍 ${a.patientName} | Date: ${aptDate} Time: ${aptTime} | Now: ${todayStr} ${currentTimeStr} | Upcoming: ${isUpcoming} | Status: ${a.status}`);
        }

        return isUpcoming && isNotCompleted && isNotCancelled;
      });
    } else if (activeTab !== 'all' && activeTab !== 'deleted') {
      // Status-based filtering (completed, cancelled, etc.)
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
  }, [searchQuery, selectedDate, allAppointments, activeTab]);

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

  // Handle intake save success - mark appointment as completed
  const handleIntakeSaveSuccess = async () => {
    try {
      // Mark appointment as completed
      if (selectedAppointmentId) {
        console.log('✅ Marking appointment as completed:', selectedAppointmentId);
        await appointmentsService.updateAppointmentStatus(selectedAppointmentId, 'Completed');
        showNotification('Intake saved and appointment marked as completed', 'success');
      }
      // Refresh appointments to show updated status
      await refreshAppointments();
    } catch (error) {
      console.error('Failed to mark appointment as completed:', error);
      showNotification('Intake saved but failed to update appointment status', 'error');
      await refreshAppointments(); // Still refresh to show intake data
    }
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
    const statuses = ['Scheduled', 'Completed', 'Cancelled'];
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0 relative z-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[25%]">Patient</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[15%] hidden md:table-cell">Service</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%] hidden lg:table-cell">Reason</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[12%]">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[12%] text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentRows.map((apt, idx) => {
                const genderStr = (apt.gender || '').toLowerCase().trim();
                let avatarSrc = (genderStr.includes('female') || genderStr.startsWith('f')) ? '/girlicon.png' : '/boyicon.png';

                return (
                  <tr key={apt.id} className="hover:bg-slate-50 transition-colors group">
                    {/* PATIENT COLUMN */}
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => handlePatientNameClick(apt)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarSrc}
                          alt={apt.gender}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-50"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                        />
                        <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 hidden items-center justify-center text-slate-400">
                          {apt.gender === 'Female' ? <Icons.Female /> : <Icons.Male />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                            {apt.patientName}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{apt.patientId}</span>
                        </div>
                      </div>
                    </td>

                    {/* DATE COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{apt.date}</span>
                        <span className="text-xs text-slate-500">{apt.time}</span>
                      </div>
                    </td>

                    {/* SERVICE */}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="text-sm font-medium text-slate-700">{apt.service}</span>
                    </td>

                    {/* REASON */}
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className={`text-sm ${apt.reason === 'Not specified' ? 'text-slate-400 italic' : 'text-slate-600 font-medium'}`}>
                        {apt.reason}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={apt.status} onClick={() => handleStatusToggle(apt)} />
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 whitespace-nowrap text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Intake Form" onClick={() => handleIntake(apt)}>
                          <Icons.Intake />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors" title="Edit" onClick={() => handleEdit(apt)}>
                          <Icons.Edit />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Details" onClick={() => handleView(apt)}>
                          <Icons.Eye />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete" onClick={() => handleDelete(apt)}>
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin"></div>
                      <span className="text-sm font-medium">Loading appointments...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && currentRows.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
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
        onSuccess={handleIntakeSaveSuccess}
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