/**
 * DoctorSchedule.jsx  
 * Doctor's schedule calendar matching Flutter's EnterpriseScheduleScreen
 * Shows appointments in calendar view with list
 */

import React, { useState, useEffect } from 'react';
import {
  MdCalendarToday,
  MdRemoveRedEye,
  MdMan,
  MdWoman,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';
import appointmentsService from '../../services/appointmentsService';
import './DoctorSchedule.css';

const DoctorSchedule = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentsService.fetchAppointments({ limit: 100 });
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(a => {
      try {
        const apptDate = new Date(a.date || a.appointmentDate);
        return apptDate.toDateString() === date.toDateString();
      } catch {
        return false;
      }
    }).sort((a, b) => {
      const timeA = a.time || a.appointmentTime || '';
      const timeB = b.time || b.appointmentTime || '';
      return timeA.localeCompare(timeB);
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
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
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
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
                      isToday(day.date) ? 'today' : ''
                    } ${isSelected(day.date) ? 'selected' : ''}`}
                    onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                  >
                    <span className="day-number">{day.date.getDate()}</span>
                    {day.isCurrentMonth && count > 0 && (
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
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const AppointmentCard = ({ appointment }) => {
  const patientName = appointment.patientName || appointment.patientId?.fullName || 'Unknown Patient';
  const gender = appointment.gender || appointment.patientId?.gender || 'other';
  const age = appointment.patientAge || appointment.patientId?.age || 0;
  const time = appointment.time || appointment.appointmentTime || '--:--';
  const reason = appointment.reason || 'General Consultation';
  const status = appointment.status || 'scheduled';

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '#0EA5E9';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#94A3B8';
    }
  };

  return (
    <div className="appointment-card">
      <div className="card-header">
        <div className="patient-avatar" data-gender={gender.toLowerCase()}>
          {gender.toLowerCase() === 'male' ? <MdMan /> : <MdWoman />}
        </div>
        <div className="patient-info">
          <div className="patient-name">{patientName}</div>
          <div className="patient-meta">{age} years • {gender}</div>
        </div>
        <div className="status-badge" style={{ borderColor: getStatusColor(status), color: getStatusColor(status) }}>
          {status}
        </div>
      </div>

      <div className="card-details">
        <div className="detail-row">
          <div className="detail-label">
            <MdCalendarToday />
            <span>Time:</span>
          </div>
          <div className="detail-value">{time}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">
            <span>Reason:</span>
          </div>
          <div className="detail-value">{reason}</div>
        </div>
      </div>

      <button className="view-details-btn">
        <MdRemoveRedEye />
        <span>View Patient Details</span>
      </button>
    </div>
  );
};

export default DoctorSchedule;
