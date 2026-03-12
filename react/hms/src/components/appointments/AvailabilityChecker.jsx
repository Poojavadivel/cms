/**
 * AvailabilityChecker Component
 * Real-time availability checking for doctor and patient scheduling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiAlertTriangle, FiClock, FiCalendar } from 'react-icons/fi';
import availabilityService from '../../services/availabilityService';
import './AvailabilityChecker.css';

const AvailabilityChecker = ({ 
  doctorId, 
  patientId, 
  startAt, 
  endAt, 
  duration = 30,
  excludeAppointmentId,
  onAvailabilityChange,
  autoCheck = true,
  showSuggestions = true 
}) => {
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Check availability
   */
  const checkAvailability = useCallback(async () => {
    if (!startAt) {
      setAvailability(null);
      setError(null);
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const result = await availabilityService.checkAvailability({
        doctorId,
        patientId,
        startAt,
        endAt,
        duration,
        excludeAppointmentId
      });

      if (result.success) {
        setAvailability(result.availability);
        
        // Notify parent component
        if (onAvailabilityChange) {
          onAvailabilityChange(result.availability);
        }
      } else {
        setError('Failed to check availability');
      }
    } catch (err) {
      console.error('Availability check error:', err);
      setError(err.response?.data?.message || 'Failed to check availability');
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  }, [doctorId, patientId, startAt, endAt, duration, excludeAppointmentId, onAvailabilityChange]);

  /**
   * Auto-check when inputs change
   */
  useEffect(() => {
    if (autoCheck && startAt) {
      const timer = setTimeout(() => {
        checkAvailability();
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [autoCheck, startAt, checkAvailability]);

  /**
   * Format date/time for display
   */
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  /**
   * Render loading state
   */
  if (checking) {
    return (
      <div className="availability-checker checking">
        <div className="availability-header">
          <div className="spinner-small"></div>
          <span>Checking availability...</span>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="availability-checker error">
        <div className="availability-header">
          <FiX className="icon error-icon" />
          <span>{error}</span>
        </div>
        <button className="btn-retry" onClick={checkAvailability}>
          Retry
        </button>
      </div>
    );
  }

  /**
   * No data yet
   */
  if (!availability) {
    return null;
  }

  /**
   * Render availability result
   */
  return (
    <div className={`availability-checker ${availability.isAvailable ? 'available' : 'unavailable'}`}>
      {/* Main Status */}
      <div className="availability-header">
        {availability.isAvailable ? (
          <>
            <FiCheck className="icon success-icon" />
            <span className="status-text success">Available</span>
          </>
        ) : (
          <>
            <FiAlertTriangle className="icon warning-icon" />
            <span className="status-text warning">Conflicts Detected</span>
          </>
        )}
      </div>

      {/* Availability Details */}
      <div className="availability-details">
        {/* Doctor Status */}
        {doctorId && (
          <div className="availability-item">
            <div className="item-icon">
              {availability.doctorAvailable ? (
                <FiCheck className="icon-small success" />
              ) : (
                <FiX className="icon-small error" />
              )}
            </div>
            <div className="item-content">
              <span className="item-label">Doctor</span>
              <span className={`item-value ${availability.doctorAvailable ? 'success' : 'error'}`}>
                {availability.doctorAvailable ? 'Available' : 'Busy'}
              </span>
            </div>
          </div>
        )}

        {/* Patient Status */}
        {patientId && (
          <div className="availability-item">
            <div className="item-icon">
              {availability.patientAvailable ? (
                <FiCheck className="icon-small success" />
              ) : (
                <FiX className="icon-small error" />
              )}
            </div>
            <div className="item-content">
              <span className="item-label">Patient</span>
              <span className={`item-value ${availability.patientAvailable ? 'success' : 'error'}`}>
                {availability.patientAvailable ? 'Available' : 'Has Appointment'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Conflicts */}
      {availability.conflicts && availability.conflicts.length > 0 && (
        <div className="conflicts-section">
          <h4 className="conflicts-title">Conflicts</h4>
          {availability.conflicts.map((conflict, idx) => (
            <div key={idx} className="conflict-item">
              <div className="conflict-header">
                <FiAlertTriangle className="conflict-icon" />
                <span className="conflict-message">{conflict.message}</span>
              </div>
              {conflict.appointments && conflict.appointments.length > 0 && (
                <div className="conflict-appointments">
                  {conflict.appointments.map((apt, aptIdx) => (
                    <div key={aptIdx} className="conflict-appointment">
                      <FiClock className="apt-icon" />
                      <div className="apt-details">
                        <span className="apt-name">
                          {conflict.type === 'doctor' ? apt.patientName : apt.doctorName}
                        </span>
                        <span className="apt-time">
                          {formatDateTime(apt.startAt)}
                          {apt.endAt && ` - ${formatDateTime(apt.endAt)}`}
                        </span>
                        <span className="apt-status">{apt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Available Slots Suggestions */}
      {showSuggestions && availability.availableSlots && availability.availableSlots.length > 0 && (
        <div className="suggestions-section">
          <h4 className="suggestions-title">
            <FiCalendar className="title-icon" />
            Available Time Slots
          </h4>
          <div className="slots-list">
            {availability.availableSlots.map((slot, idx) => (
              <div key={idx} className="slot-item">
                <FiClock className="slot-icon" />
                <div className="slot-details">
                  <span className="slot-time">
                    {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt)}
                  </span>
                  <span className="slot-duration">({slot.durationMinutes} minutes)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {availability.recommendations && availability.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h4 className="recommendations-title">Recommendations</h4>
          <ul className="recommendations-list">
            {availability.recommendations.map((rec, idx) => (
              <li key={idx} className="recommendation-item">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AvailabilityChecker;
