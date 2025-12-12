import React, { useState, useEffect, useCallback } from 'react';
import AuthService from '../../../../services/authService';

const AppointmentPreview = ({ appointmentId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AuthService.get(`/appointments/${appointmentId}`);
      const data = response.data || response;
      setAppointment(data);
    } catch (error) {
      console.error('Failed to load appointment:', error);
      alert('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'bg-green-100 text-green-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Cancelled': 'bg-red-100 text-red-700',
      'Scheduled': 'bg-blue-100 text-blue-700',
      'In Progress': 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Emergency': 'bg-red-100 text-red-700',
      'Urgent': 'bg-orange-100 text-orange-700',
      'Normal': 'bg-blue-100 text-blue-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return timeStr;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <p className="text-center text-gray-700">Appointment not found</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const patientName = appointment.patientId && typeof appointment.patientId === 'object'
    ? `${appointment.patientId.firstName || ''} ${appointment.patientId.lastName || ''}`.trim()
    : appointment.clientName || 'Unknown';

  const patientAge = appointment.patientId && typeof appointment.patientId === 'object'
    ? appointment.patientId.age || appointment.patientAge || null
    : appointment.patientAge || null;

  const patientGender = appointment.patientId && typeof appointment.patientId === 'object'
    ? appointment.patientId.gender || ''
    : appointment.gender || '';

  const doctorName = appointment.doctorId && typeof appointment.doctorId === 'object'
    ? `${appointment.doctorId.firstName || ''} ${appointment.doctorId.lastName || ''}`.trim()
    : appointment.doctorName || 'Not Assigned';

  const metadata = appointment.metadata || {};
  const vitals = appointment.vitals || {};

  let appointmentDate = '';
  let appointmentTime = '';
  if (appointment.startAt) {
    const startAt = new Date(appointment.startAt);
    appointmentDate = formatDate(startAt);
    appointmentTime = `${String(startAt.getHours()).padStart(2, '0')}:${String(startAt.getMinutes()).padStart(2, '0')}`;
  } else {
    appointmentDate = formatDate(appointment.date);
    appointmentTime = formatTime(appointment.time);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                <p className="text-sm text-gray-600 mt-1">Complete appointment information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Patient Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Name</p>
                <p className="text-gray-900 font-semibold">{patientName}</p>
              </div>
              {patientAge && (
                <div>
                  <p className="text-sm text-gray-600 font-medium">Age</p>
                  <p className="text-gray-900 font-semibold">{patientAge} years</p>
                </div>
              )}
              {patientGender && (
                <div>
                  <p className="text-sm text-gray-600 font-medium">Gender</p>
                  <p className="text-gray-900 font-semibold">{patientGender}</p>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Appointment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Doctor</p>
                <p className="text-gray-900 font-semibold">{doctorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Type</p>
                <p className="text-gray-900 font-semibold">{appointment.appointmentType || 'Consultation'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Date</p>
                <p className="text-gray-900 font-semibold">{appointmentDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Time</p>
                <p className="text-gray-900 font-semibold">{appointmentTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Mode</p>
                <p className="text-gray-900 font-semibold">{metadata.mode || 'In-clinic'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Duration</p>
                <p className="text-gray-900 font-semibold">{metadata.durationMinutes || 20} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Priority</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(metadata.priority || 'Normal')}`}>
                  {metadata.priority || 'Normal'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>
            </div>
          </div>

          {/* Chief Complaint & Notes */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Clinical Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">Chief Complaint</p>
                <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                  {metadata.chiefComplaint || appointment.chiefComplaint || appointment.reason || 'Not specified'}
                </p>
              </div>
              {appointment.notes && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">Clinical Notes</p>
                  <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vitals (if present) */}
          {(vitals.heightCm || vitals.weightKg || vitals.bp || vitals.heartRate || vitals.spo2) && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
              <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Vitals
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {vitals.heightCm && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600 font-medium mb-1">Height</p>
                    <p className="text-lg font-bold text-gray-900">{vitals.heightCm}</p>
                    <p className="text-xs text-gray-500">cm</p>
                  </div>
                )}
                {vitals.weightKg && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600 font-medium mb-1">Weight</p>
                    <p className="text-lg font-bold text-gray-900">{vitals.weightKg}</p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                )}
                {vitals.bp && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600 font-medium mb-1">BP</p>
                    <p className="text-lg font-bold text-gray-900">{vitals.bp}</p>
                    <p className="text-xs text-gray-500">mmHg</p>
                  </div>
                )}
                {vitals.heartRate && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600 font-medium mb-1">Heart Rate</p>
                    <p className="text-lg font-bold text-gray-900">{vitals.heartRate}</p>
                    <p className="text-xs text-gray-500">bpm</p>
                  </div>
                )}
                {vitals.spo2 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600 font-medium mb-1">SpO2</p>
                    <p className="text-lg font-bold text-gray-900">{vitals.spo2}</p>
                    <p className="text-xs text-gray-500">%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {appointment.location && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Location</p>
                  <p className="text-gray-900 font-semibold">{appointment.location}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentPreview;
