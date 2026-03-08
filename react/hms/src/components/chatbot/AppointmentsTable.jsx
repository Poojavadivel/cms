import React from 'react';
import './AppointmentsTable.css';

const AppointmentsTable = ({ appointments, date }) => {
  console.log('🎯 AppointmentsTable RENDERED with:', appointments?.length, 'appointments');

  if (!appointments || appointments.length === 0) {
    return <p>No appointments found.</p>;
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getStatusClass = (status) => {
    if (!status) return 'chatbot-status-pending';
    const statusLower = status.toLowerCase();
    if (statusLower === 'scheduled' || statusLower === 'confirmed') return `chatbot-status-${statusLower}`;
    if (statusLower === 'completed') return 'chatbot-status-completed';
    if (statusLower === 'cancelled' || statusLower === 'canceled') return 'chatbot-status-cancelled';
    return 'chatbot-status-pending';
  };

  return (
    <div className="chatbot-appointments-table-container">
      <p className="chatbot-appointments-table-title">
        <strong>Today's Appointments ({appointments.length} total)</strong>
      </p>

      <div className="chatbot-appointments-table-wrapper">
        <table className="chatbot-appointments-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient</th>
              <th>Age/Gender</th>
              <th>Phone</th>
              <th>Doctor</th>
              <th>Type</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt, index) => (
              <tr key={apt.appointmentId || `chatbot_appt_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}>
                <td>{formatTime(apt.time)}</td>
                <td><strong>{apt.patient || 'Unknown'}</strong></td>
                <td>{`${apt.patientAge || 'N/A'}/${apt.patientGender || 'N/A'}`}</td>
                <td>{apt.patientPhone || 'N/A'}</td>
                <td>{apt.doctor || 'Unknown'}</td>
                <td>{apt.type || 'N/A'}</td>
                <td>
                  <span className={`chatbot-appt-status-badge ${getStatusClass(apt.status)}`}>
                    {apt.status || 'Pending'}
                  </span>
                </td>
                <td>{apt.location || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="chatbot-appointments-response-footer">
        📅 All appointments for {formatDate(date)}
      </p>
    </div>
  );
};

export default AppointmentsTable;
