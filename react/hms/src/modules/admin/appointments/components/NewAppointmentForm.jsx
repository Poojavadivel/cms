import React, { useState, useEffect, useCallback, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import appointmentsService from '../../../../services/appointmentsService';
import './NewAppointmentForm.css'; // We'll create this for custom overrides
// --- ICONS ---
const Icons = {
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Note: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  Keyboard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
      <line x1="6" y1="8" x2="6" y2="8"></line>
      <line x1="10" y1="8" x2="10" y2="8"></line>
      <line x1="14" y1="8" x2="14" y2="8"></line>
      <line x1="18" y1="8" x2="18" y2="8"></line>
      <line x1="6" y1="12" x2="6" y2="12"></line>
      <line x1="10" y1="12" x2="10" y2="12"></line>
      <line x1="14" y1="12" x2="14" y2="12"></line>
      <line x1="18" y1="12" x2="18" y2="12"></line>
      <line x1="6" y1="16" x2="10" y2="16"></line>
      <line x1="14" y1="16" x2="14" y2="16"></line>
    </svg>
  )
};
// --- CUSTOM TIME PICKER COMPONENT ---
const TimePicker = ({ value, onChange, onClose }) => {
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const [meridiem, setMeridiem] = useState('AM');
  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMinute, setSelectedMinute] = useState(0);
  useEffect(() => {
    if (value) {
      // Parse HH:mm
      const [h, m] = value.split(':');
      let hr = parseInt(h);
      const mn = parseInt(m);
      if (hr >= 12) {
        setMeridiem('PM');
        if (hr > 12) hr -= 12;
      } else {
        setMeridiem('AM');
        if (hr === 0) hr = 12;
      }
      setSelectedHour(hr);
      setSelectedMinute(mn);
    }
  }, [value]);
  const handleHourClick = (hour) => {
    setSelectedHour(hour);
    setMode('minute'); // Auto switch to minute
  };
  const handleMinuteClick = (minute) => {
    setSelectedMinute(minute);
  };
  const handleOK = () => {
    let hr = selectedHour;
    if (meridiem === 'PM' && hr !== 12) hr += 12;
    if (meridiem === 'AM' && hr === 12) hr = 0;
    const timeStr = `${hr.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeStr);
    onClose();
  };
  // Render clock face numbers
  const renderClockFace = () => {
    const numbers = [];
    const isHour = mode === 'hour';
    const count = 12;
    const radius = 100; // px
    const center = 128; // center of 256x256 box
    for (let i = 1; i <= count; i++) {
      const val = isHour ? i : (i === 12 ? 0 : i * 5); // 1-12 or 0, 5, 10
      // Correct angle: 12 is at -90deg (top), but in sin/cos logic 0 is typically right.
      // We want 12 at top (270 deg or -90 deg), 3 at right (0 deg).
      // Angle per step = 30 deg.
      // 12 -> -90, 1 -> -60, 2 -> -30, 3 -> 0.
      // Formula: angle = (i * 30) - 90
      const angleDeg = (i * 30) - 90;
      const angleRad = angleDeg * (Math.PI / 180);
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      const isSelected = isHour ? val === selectedHour : val === selectedMinute;
      numbers.push(
        <div
          key={i}
          className={`clock-number ${isSelected ? 'selected' : ''}`}
          style={{ left: x, top: y }}
          onClick={() => isHour ? handleHourClick(val) : handleMinuteClick(val)}
        >
          {isHour ? val : val.toString().padStart(2, '0')}
        </div>
      );
    }
    // Hand
    const currentVal = isHour ? selectedHour : selectedMinute;
    // Calculate angle for hand
    // For hour: 1->30deg, 12->360(0). Normalized 12 to 0 for calc?
    // Actually mapped 1..12 to i..12 in loop.
    // Logic: (val / 12) * 360 for hours? but 12 is top.
    // Minute: (val / 60) * 360.
    let degrees = 0;
    if (isHour) {
      degrees = (selectedHour % 12) * 30; // 12 -> 0, 3 -> 90
    } else {
      degrees = selectedMinute * 6; // 0 -> 0, 15 -> 90
    }
    return (
      <div className="clock-face">
        <div className="center-dot"></div>
        <div
          className="clock-hand"
          style={{
            transform: `rotate(${degrees}deg)`,
            height: radius
          }}
        >
          <div className="hand-tip"></div>
        </div>
        {numbers}
      </div>
    );
  };
  return (
    <div className="time-picker-overlay" onClick={onClose}>
      <div className="time-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="time-picker-header">
          <span className="picker-title">Select time</span>
        </div>
        <div className="time-display">
          <div
            className={`time-unit ${mode === 'hour' ? 'active' : ''}`}
            onClick={() => setMode('hour')}
          >
            {selectedHour}
          </div>
          <span className="colon">:</span>
          <div
            className={`time-unit ${mode === 'minute' ? 'active' : ''}`}
            onClick={() => setMode('minute')}
          >
            {selectedMinute.toString().padStart(2, '0')}
          </div>
          <div className="meridiem-toggle">
            <button
              className={meridiem === 'AM' ? 'active' : ''}
              onClick={() => setMeridiem('AM')}
            >AM</button>
            <button
              className={meridiem === 'PM' ? 'active' : ''}
              onClick={() => setMeridiem('PM')}
            >PM</button>
          </div>
        </div>
        <div className="clock-container">
          {renderClockFace()}
        </div>
        <div className="time-picker-footer">
          <Icons.Keyboard />
          <div className="footer-actions">
            <button className="btn-text" onClick={onClose}>Cancel</button>
            <button className="btn-text" onClick={handleOK}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- MAIN FORM COMPONENT ---
const NewAppointmentForm = ({ onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  // Date/Time State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00'); // Default 9 AM
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use appointmentsService to fetch patients
      const patientsList = await appointmentsService.fetchPatients();
      const mappedPatients = patientsList.map(p => ({
        id: p._id || p.id,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || 'Unknown',
        age: p.age || calculateAge(p.dateOfBirth) || '',
        gender: p.gender || 'Male',
        avatar: p.avatarUrl || null,
        phone: p.phone?.number || p.phone || ''
      }));
      setPatients(mappedPatients);
      setFilteredPatients(mappedPatients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q === '') {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(
        patients.filter(p => p.name.toLowerCase().includes(q))
      );
    }
  }, [searchQuery, patients]);
  const calculateAge = (dob) => {
    if (!dob) return null;
    try {
      const diff = Date.now() - new Date(dob).getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch { return null; }
  };
  const handleSubmit = async () => {
    if (!selectedPatient) return alert('Please select a patient');
    if (!reason.trim()) return alert('Please enter a reason');
    setIsSaving(true);
    try {
      // Format DateTime
      const dateStr = selectedDate.toISOString().split('T')[0];
      const payload = {
        patientId: selectedPatient.id,
        clientName: selectedPatient.name,
        date: new Date(dateStr + 'T' + selectedTime), // local time construction
        time: selectedTime,
        appointmentType: 'Consultation',
        mode: 'In-clinic', // default
        chiefComplaint: reason,
        notes: notes,
        status: 'Scheduled',
        // Backend compatibility fields
        reason: reason,
        startAt: new Date(dateStr + 'T' + selectedTime).toISOString(),
      };
      await appointmentsService.createAppointment(payload);
      onSave();
    } catch (error) {
      console.error(error);
      alert('Failed to create appointment');
    } finally {
      setIsSaving(false);
    }
  };
  // UI Helpers
  const getAvatar = (p) => {
    if (p.avatar) return p.avatar;
    return (p.gender?.toLowerCase() === 'female') ? '/girlicon.png' : '/boyicon.png';
  };
  // Format Date for Display
  const formatDateDisplay = (date) => {
    // e.g. "Sat, Dec 20"
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  // Format Time for Display
  const formatTimeDisplay = (timeStr) => {
    // timeStr is HH:mm (24h)
    // Convert to 12h AM/PM
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    if (hr > 12) hr -= 12;
    if (hr === 0) hr = 12;
    return `${hr}:${m} ${ampm}`;
  };
  return (
    <div className="new-appt-overlay">
      {/* Floating Close Button - Matches AppointmentViewModal */}
      <button className="appointment-close-floating" onClick={onClose}>
        <Icons.Close />
      </button>

      <div className="new-appt-modal">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="panel-header">
            <div className="header-icon-box"><Icons.User /></div>
            <h2>Select Patient</h2>
            <button className="refresh-btn" onClick={loadPatients}>↻</button>
          </div>
          <div className="search-container">
            <Icons.Search />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="patient-count">{filteredPatients.length} patients</div>
          <div className="patient-list">
            {filteredPatients.map(p => (
              <div
                key={p.id}
                className={`patient-item ${selectedPatient?.id === p.id ? 'active' : ''}`}
                onClick={() => setSelectedPatient(p)}
              >
                <img src={getAvatar(p)} alt="avatar" className="p-avatar" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="p-info">
                  <div className="p-name">{p.name}</div>
                  <div className="p-details">{p.age ? `${p.age} years` : ''}</div>
                </div>
                <Icons.ChevronRight />
              </div>
            ))}
          </div>
        </div>
        {/* RIGHT PANEL */}
        <div className={`right-panel ${!selectedPatient ? 'disabled' : ''}`}>
          <div className="panel-content">
            <div className="rp-header">
              <div className="icon-badge">📅</div>
              <div>
                <h2>New Appointment</h2>
                <p className="subtitle">Select a patient to continue</p>
              </div>
            </div>
            {/* Schedule */}
            <h3 className="section-title">Schedule</h3>
            <div className="form-row">
              <div className="form-group half">
                <label>Date *</label>
                <div className="custom-input-trigger" onClick={() => selectedPatient && setShowDatePicker(true)}>
                  <Icons.Calendar />
                  <span>{formatDateDisplay(selectedDate)}</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
              </div>
              <div className="form-group half">
                <label>Time *</label>
                <div className="custom-input-trigger" onClick={() => selectedPatient && setShowTimePicker(true)}>
                  <Icons.Clock />
                  <span>{formatTimeDisplay(selectedTime)}</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
              </div>
            </div>
            {/* Details */}
            <h3 className="section-title">Appointment Details</h3>
            <div className="form-group">
              <label>Reason / Chief Complaint *</label>
              <div className="input-with-icon">
                <Icons.Note />
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Clinical Notes (Optional)</label>
              <div className="input-with-icon top-align">
                <Icons.Note />
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="rp-footer">
            <button className="btn-cancel" onClick={onClose}>
              <Icons.Close /> Cancel
            </button>
            <button className="btn-save" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Appointment'}
            </button>
          </div>
        </div>
      </div>
      {/* DATE PICKER POPUP */}
      {showDatePicker && (
        <div className="date-picker-overlay" onClick={() => setShowDatePicker(false)}>
          <div className="date-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-header">Select date</div>
            <div className="dp-display">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <Calendar
              onChange={(d) => { setSelectedDate(d); setShowDatePicker(false); }}
              value={selectedDate}
              minDate={new Date()}
              next2Label={null}
              prev2Label={null}
            />
            <div className="dp-actions">
              <button onClick={() => setShowDatePicker(false)}>Cancel</button>
              <button onClick={() => setShowDatePicker(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
      {/* TIME PICKER POPUP */}
      {showTimePicker && (
        <TimePicker
          value={selectedTime}
          onChange={setSelectedTime}
          onClose={() => setShowTimePicker(false)}
        />
      )}
    </div>
  );
};
export default NewAppointmentForm;
