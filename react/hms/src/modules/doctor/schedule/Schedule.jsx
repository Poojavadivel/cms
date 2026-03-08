import React, { useState, useEffect } from 'react';
import {
  MdCalendarToday,
  MdRemoveRedEye,
  MdChevronLeft,
  MdChevronRight,
  MdDelete,
  MdCheck,
} from 'react-icons/md';
import appointmentsService from '../../../services/appointmentsService';
import patientsService from '../../../services/patientsService';
import { PatientProfileView } from '../../../components/doctor';
import AppointmentIntakeModal from '../../../components/appointments/AppointmentIntakeModal';
import StatusBadge from '../../../components/common/StatusBadge';
import PatientVitalsBadgeList from '../../../components/common/PatientVitalsBadgeList';
import './Schedule.css';

const DoctorSchedule = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Dialog states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showIntakeDialog, setShowIntakeDialog] = useState(false);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentsService.fetchAppointments();
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date) => {
    if (!date || !appointments) return [];

    // Local normalized components
    const target = new Date(date);
    const ty = target.getFullYear();
    const tm = target.getMonth();
    const td = target.getDate();

    const filtered = appointments.filter(a => {
      // 1. Exclude Cancelled
      if (typeof a.status === 'string' && a.status.toUpperCase() === 'CANCELLED') {
        return false;
      }

      try {
        // Search through all possible date markers in the data
        const dates = [a.startAt, a.date, a.appointmentDate].filter(Boolean);
        return dates.some(d => {
          const dObj = new Date(d);
          if (isNaN(dObj.getTime())) return false;

          // Match by local day/month/year to avoid timezone slippage
          return dObj.getFullYear() === ty &&
            dObj.getMonth() === tm &&
            dObj.getDate() === td;
        });
      } catch {
        return false;
      }
    });

    // 2. Deduplicate / Merge by patientId
    const merged = {};
    filtered.forEach(a => {
      // Extract patient ID robustly
      const pIdObj = a.patientId;
      const pId = (pIdObj && typeof pIdObj === 'object') ? (pIdObj._id || pIdObj.id) : pIdObj;
      // Fallback to name if ID is missing (better than nothing)
      const key = pId || a.patientName || a.clientName || ('unknown_patient_' + Math.random());

      if (!merged[key]) {
        merged[key] = { ...a, _consultCount: 1 };
      } else {
        // Duplicate patient for the same day
        merged[key]._consultCount += 1;

        // Merge reasons for clarity if different
        const currentReason = merged[key].reason || merged[key].appointmentType || 'Consultation';
        const newReason = a.reason || a.appointmentType || 'Follow-up';
        if (typeof currentReason === 'string' && typeof newReason === 'string' && !currentReason.includes(newReason)) {
          merged[key].reason = `${currentReason} + ${newReason}`;
        }
      }
    });

    return Object.values(merged).sort((a, b) => {
      const timeA = a.startAt || a.time || '00:00';
      const timeB = b.startAt || b.time || '00:00';
      return String(timeA).localeCompare(String(timeB));
    });
  };

  const getAppointmentCountForDate = (date) => {
    return getAppointmentsForDate(date).length;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const selectedDayAppointments = getAppointmentsForDate(selectedDate);

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const getAppointmentsForCurrentMonth = () => {
    if (!appointments) return 0;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return appointments.filter(a => {
      if (typeof a.status === 'string' && a.status.toUpperCase() === 'CANCELLED') return false;
      const dates = [a.startAt, a.date, a.appointmentDate].filter(Boolean);
      return dates.some(d => {
        const dObj = new Date(d);
        return !isNaN(dObj.getTime()) && dObj.getFullYear() === year && dObj.getMonth() === month;
      });
    }).length;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleViewIntake = async (appointment) => {
    setIsLoadingPatient(true);
    setSelectedAppointment(appointment);
    setShowIntakeDialog(true);
    setIsLoadingPatient(false);
  };

  const handleViewPatient = async (appointment) => {
    setIsLoadingPatient(true);
    setSelectedAppointment(appointment);
    try {
      const patientId = appointment.patientId?._id || appointment.patientId;
      const patientData = await patientsService.fetchPatientById(patientId);
      setSelectedPatient(patientData);
      setShowProfileDialog(true);
    } catch (error) {
      console.error('Error loading patient:', error);
      alert('Failed to load patient details');
    } finally {
      setIsLoadingPatient(false);
    }
  };

  const handleEditPatient = () => {
    setShowProfileDialog(false);
    alert('Edit patient functionality will open the edit form');
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    try {
      await appointmentsService.deleteAppointment(appointmentId);
      await loadAppointments();
      setShowProfileDialog(false);
      alert('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentsService.updateAppointmentStatus(appointmentId, 'Confirmed');
      await loadAppointments();
      alert('Appointment confirmed successfully');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Failed to confirm appointment');
    }
  };

  if (loading) {
    return (
      <div className="doctor-schedule loading">
        <div className="loading-spinner"></div>
        <p>Loading Schedule...</p>
      </div>
    );
  }

  return (
    <div className="doctor-schedule">
      <div className="schedule-content">
        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="calendar-card">
            <div className="calendar-header">
              <div className="header-left">
                <h2>Schedule Calendar</h2>
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 shadow-sm">
                {getAppointmentsForCurrentMonth()} Appointments This Month
              </div>
            </div>

            <div className="calendar-controls">
              <button onClick={() => changeMonth(-1)} title="Previous month">
                <MdChevronLeft />
              </button>
              <div className="current-month">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={() => changeMonth(1)} title="Next month">
                <MdChevronRight />
              </button>
            </div>

            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-label">{day}</div>
              ))}
              {getDaysInMonth(currentMonth).map((day, index) => {
                const count = getAppointmentCountForDate(day.date);
                return (
                  <div
                    key={index}
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''
                      } ${isSelected(day.date) ? 'selected' : ''}`}
                    onClick={() => {
                      if (!day.isCurrentMonth) {
                        setCurrentMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                      }
                      setSelectedDate(day.date);
                    }}
                  >
                    <span className="day-number">{day.date.getDate()}</span>
                    {count > 0 && (
                      <span className="appointment-count">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Appointments List Section */}
        <div className="appointments-section">
          <div className="appointments-card">
            <div className="appointments-header">
              <div>
                <h2>Appointments</h2>
                <p className="selected-date">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="count-badge">{selectedDayAppointments.length}</div>
            </div>

            <div className="appointments-list">
              {selectedDayAppointments.length === 0 ? (
                <div className="empty-state">
                  <MdCalendarToday />
                  <p>No Appointments</p>
                  <span>No appointments scheduled for this day</span>
                </div>
              ) : (
                selectedDayAppointments.map(appointment => (
                  <AppointmentCard
                    key={appointment._id || appointment.id}
                    appointment={appointment}
                    onViewIntake={() => handleViewIntake(appointment)}
                    onViewPatient={() => handleViewPatient(appointment)}
                    onDelete={() => handleDeleteAppointment(appointment._id || appointment.id)}
                    onConfirm={() => handleConfirm(appointment._id || appointment.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PatientProfileView
        patient={selectedPatient}
        isOpen={showProfileDialog}
        onClose={() => {
          setShowProfileDialog(false);
          setSelectedPatient(null);
        }}
        onEdit={handleEditPatient}
      />

      <AppointmentIntakeModal
        isOpen={showIntakeDialog}
        onClose={() => {
          setShowIntakeDialog(false);
          setSelectedPatient(null);
          setSelectedAppointment(null);
        }}
        appointmentId={selectedAppointment?._id || selectedAppointment?.id}
        onSuccess={() => {
          loadAppointments();
        }}
      />

      {isLoadingPatient && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading patient details...</p>
        </div>
      )}
    </div>
  );
};

// ─── Visit Type Utilities ─────────────────────────────────────────────────────
const getVisitType = (appointment) => {
  const type = (appointment.visitType || appointment.appointmentType || appointment.type || '').toLowerCase();
  if (type.includes('follow') || type.includes('review')) return 'Follow-Up';
  if (type.includes('tele') || type.includes('video') || type.includes('remote')) return 'Telemedicine';
  if (type.includes('emergency') || type.includes('urgent')) return 'Emergency';
  if (type.includes('initial') || type.includes('new')) return 'New Patient';
  return 'Consultation';
};

const visitTypeBadgeStyles = {
  'Follow-Up': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Telemedicine': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Emergency': 'bg-rose-50 text-rose-700 border-rose-200',
  'New Patient': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Consultation': 'bg-slate-100 text-slate-600 border-slate-200',
};

// ─── Redesigned Appointment "Smart Card" ──────────────────────────────────────
const AppointmentCard = ({ appointment, onViewIntake, onViewPatient, onDelete, onConfirm }) => {
  // --- ROBUST DATA EXTRACTION ---
  const pId = appointment.patientId;
  const isPopulated = pId && typeof pId === 'object';

  // 1. Patient Name
  let patientName = appointment.patientName ||
    appointment.clientName ||
    (isPopulated ? (pId.fullName || `${pId.firstName || ''} ${pId.lastName || ''}`.trim()) : 'Unknown Patient');

  if (appointment._consultCount > 1) {
    patientName = `${patientName} (${appointment._consultCount} Consults)`;
  }

  // 2. Gender
  const gender = appointment.gender ||
    appointment.metadata?.gender ||
    (isPopulated ? pId.gender : 'Other');

  // 3. Age
  const age = appointment.patientAge ||
    (isPopulated ? pId.age : 0);

  // 4. Time Display
  let timeStr = appointment.time || appointment.appointmentTime || '--:--';
  if (appointment.startAt) {
    try {
      const d = new Date(appointment.startAt);
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Time Parse Error:', e);
    }
  }

  // 5. Reason / Chief Complaint
  const reason = appointment.reason ||
    appointment.chiefComplaint ||
    (isPopulated ? pId.chiefComplaint : null);

  // 6. Visit Type
  const visitType = getVisitType(appointment);
  const visitBadgeCls = visitTypeBadgeStyles[visitType] || visitTypeBadgeStyles['Consultation'];

  // 7. Status
  const status = appointment.status || 'Scheduled';
  const isActionable = status.toLowerCase() === 'scheduled' || status.toLowerCase() === 'pending';

  // 8. Avatar
  const genderStr = (gender || '').toLowerCase().trim();
  const avatarSrc = genderStr.includes('female') || genderStr.startsWith('f')
    ? '/girlicon.png'
    : '/boyicon.png';

  // 9. Compact age/gender label
  const genderLetter = genderStr.startsWith('f') ? 'F' : genderStr.startsWith('m') ? 'M' : '—';
  const ageGender = age > 0 ? `${age}${genderLetter}` : genderLetter;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* ── Row 1: Time Ribbon + Patient + Status ── */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center p-4 pb-2">
        {/* Time Block — Most prominent */}
        <div className="flex flex-col items-center justify-center bg-primary-50 rounded-xl px-3.5 py-2 min-w-[72px] border border-primary-100">
          <span className="text-lg font-extrabold text-primary-700 leading-tight tracking-tight">{timeStr}</span>
        </div>

        {/* Patient Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 shadow-sm">
            <img
              src={avatarSrc}
              alt={gender}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/boyicon.png'; }}
            />
          </div>
          <div className="min-w-0">
            <h4
              className="text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-primary-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); onViewPatient(); }}
              title="View Patient Profile"
            >
              {patientName}
            </h4>
            <span className="text-xs font-medium text-slate-400">{ageGender}</span>
          </div>
        </div>

        {/* Status Badge */}
        <StatusBadge status={status} />
      </div>

      {/* ── Row 2: Context Row (Reason + Visit Type + Vitals) ── */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Visit Type Badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${visitBadgeCls}`}>
            {visitType}
          </span>

          {/* Reason / Chief Complaint */}
          {reason ? (
            <span className="text-xs text-slate-500 italic truncate max-w-[200px]" title={reason}>
              — {reason}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">No reason specified</span>
          )}
        </div>

        {/* Vitals Badge List - Extracts universally from patientId object or appointment root */}
        <PatientVitalsBadgeList data={isPopulated ? pId : appointment} />
      </div>

      {/* ── Row 3: Action Bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80 border-t border-slate-100">
        {isActionable && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
            onClick={onConfirm}
            title="Confirm Appointment"
          >
            <MdCheck size={14} />
            Confirm
          </button>
        )}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition-colors shadow-sm"
          onClick={onViewPatient}
          title="Start Consult / View Profile"
        >
          <MdRemoveRedEye size={14} />
          Start Consult
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
          onClick={onViewIntake}
          title="Open Intake Form"
        >
          <MdRemoveRedEye size={14} />
          Intake
        </button>
        <div className="flex-1" />
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          onClick={onDelete}
          title="Archive / Delete"
        >
          <MdDelete size={16} />
        </button>
      </div>
    </div>
  );
};

export default DoctorSchedule;
