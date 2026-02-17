import React, { useState, useEffect } from 'react';
import {
  MdCalendarToday,
  MdRemoveRedEye,
  MdMan,
  MdWoman,
  MdChevronLeft,
  MdChevronRight,
  MdDelete,
  MdCheck,
  MdLocalHospital,
} from 'react-icons/md';
import appointmentsService from '../../../services/appointmentsService';
import patientsService from '../../../services/patientsService';
import { PatientProfileView, IntakeFormDialog } from '../../../components/doctor';
import { useApp } from '../../../provider';
import './Schedule.css';

const DoctorSchedule = () => {
  const { user } = useApp();
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

    return appointments.filter(a => {
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
    }).sort((a, b) => {
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
    try {
      const patientId = appointment.patientId?._id || appointment.patientId;
      const patientData = await patientsService.fetchPatientById(patientId);
      setSelectedPatient(patientData);
      setShowIntakeDialog(true);
    } catch (error) {
      console.error('Error loading patient:', error);
      alert('Failed to load patient details');
    } finally {
      setIsLoadingPatient(false);
    }
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

  const handleSaveIntake = async (formData) => {
    try {
      const patientId = selectedPatient?._id || selectedPatient?.id;
      if (!patientId) {
        alert('Internal Error: No patient selected');
        return;
      }

      // Structure data for backend: pharmacyRows -> pharmacy, pathologyRows -> pathology
      const payload = {
        ...formData,
        appointmentId: selectedAppointment?._id || selectedAppointment?.id,
        pharmacy: formData.pharmacyRows?.map(row => ({
          medicineId: row.medicineId,
          name: row.medicine,
          sku: row.sku,
          dosage: row.dosage,
          frequency: row.frequency,
          duration: row.duration,
          notes: row.notes,
          quantity: row.quantity,
          unitPrice: row.price
        })),
        pathology: formData.pathologyRows?.map(row => ({
          testName: row.testName,
          category: row.category,
          priority: row.priority,
          notes: row.notes
        })),
        vitals: {
          heightCm: formData.height,
          weightKg: formData.weight,
          bmi: formData.bmi,
          spo2: formData.spo2
        }
      };

      await patientsService.saveIntake(patientId, payload);
      alert('Intake form saved successfully');
      await loadAppointments();
      setShowIntakeDialog(false);
    } catch (error) {
      console.error('Error saving intake form:', error);
      alert(error.message || 'Failed to save intake form');
      throw error;
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
      {/* Header */}
      <div className="schedule-header">
        <div className="header-content">
          <h1>My Schedule</h1>
          <p>Manage your appointments and calendar</p>
        </div>
        <div className="header-controls">
          <div className="current-date">
            <MdCalendarToday />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="schedule-content">
        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="calendar-card">
            <div className="calendar-header">
              <div className="header-left">
                <div className="header-icon">
                  <MdCalendarToday />
                </div>
                <h2>Schedule Calendar</h2>
              </div>
              <div className="appointments-badge">
                {appointments.length} Total
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

      <IntakeFormDialog
        appointment={selectedAppointment}
        patient={selectedPatient}
        isOpen={showIntakeDialog}
        onClose={() => {
          setShowIntakeDialog(false);
          setSelectedPatient(null);
          setSelectedAppointment(null);
        }}
        onSave={handleSaveIntake}
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

// Helper Components
const AppointmentCard = ({ appointment, onViewIntake, onViewPatient, onDelete, onConfirm }) => {
  // --- ROBUST DATA EXTRACTION ---
  const pId = appointment.patientId;
  const isPopulated = pId && typeof pId === 'object';

  // 1. Patient Name
  const patientName = appointment.patientName ||
    appointment.clientName ||
    (isPopulated ? (pId.fullName || `${pId.firstName || ''} ${pId.lastName || ''}`.trim()) : 'Unknown Patient');

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

  // 5. Reasons & Vitals
  const reason = appointment.reason ||
    appointment.appointmentType ||
    appointment.chiefComplaint ||
    (isPopulated ? pId.chiefComplaint : 'Consultation');

  const status = appointment.status || 'Scheduled';

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('confirm')) return '#207DC0'; // Green
    if (s.includes('sched')) return '#0EA5E9';   // Blue
    if (s.includes('pend')) return '#F59E0B';    // Amber
    if (s.includes('cancel')) return '#EF4444';   // Red
    if (s.includes('complete')) return '#8B5CF6'; // Purple
    return '#94A3B8';
  };

  const isActionable = status.toLowerCase() === 'scheduled' || status.toLowerCase() === 'pending';

  return (
    <div className={`appointment-card modern-shadow status-border-${status.toLowerCase()}`}>
      <div className="card-header">
        <div className="patient-avatar-box" data-gender={gender?.toLowerCase()}>
          {gender?.toLowerCase() === 'female' ? <MdWoman /> : <MdMan />}
        </div>
        <div className="patient-info">
          <div
            className="patient-name clickable-title"
            onClick={(e) => {
              e.stopPropagation();
              onViewPatient();
            }}
          >
            {patientName}
          </div>
          <div className="patient-meta-row">
            <span className="age-pill">{age > 0 ? `${age} yrs` : 'N/A'}</span>
            <span className="dot">•</span>
            <span className="gender-text">{gender}</span>
          </div>
        </div>
        <div className="status-chip" style={{ backgroundColor: `${getStatusColor(status)}15`, color: getStatusColor(status), borderColor: getStatusColor(status) }}>
          {status}
        </div>
      </div>

      <div className="card-body-details">
        <div className="schedule-row">
          <MdCalendarToday className="icon-tiny" />
          <span className="time-label">Scheduled for:</span>
          <span className="time-value">{timeStr}</span>
        </div>
        <div className="reason-box">
          <p className="reason-text">"{reason}"</p>
        </div>
      </div>

      <div className="card-actions-row">
        {isActionable && (
          <button className="btn-modern btn-confirm flex-2" onClick={onConfirm} title="Confirm Appointment">
            <MdCheck />
            <span>Confirm</span>
          </button>
        )}
        <button className="btn-modern btn-intake flex-2" onClick={onViewIntake} title="Open Intake Form">
          <MdRemoveRedEye />
          <span>Intake</span>
        </button>
        <button className="btn-modern btn-delete-icon" onClick={onDelete} title="Archive / Delete">
          <MdDelete />
        </button>
      </div>
    </div>
  );
};

export default DoctorSchedule;
