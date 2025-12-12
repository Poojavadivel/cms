import React, { useState, useEffect, useCallback } from 'react';
import AuthService from '../../../../services/authService';
import { AppointmentDraft } from '../../../../models/AppointmentDraft';

const NewAppointmentForm = ({ onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await AuthService.get('/patients');
      const patientsData = response.data || response;
      const patientsList = Array.isArray(patientsData) ? patientsData : [];
      
      const mappedPatients = patientsList.map(p => ({
        id: p._id || p.id,
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        age: p.age || calculateAge(p.dateOfBirth),
        gender: p.gender || '',
        phone: p.phone || ''
      }));
      
      setPatients(mappedPatients);
      setFilteredPatients(mappedPatients);
    } catch (error) {
      console.error('Failed to load patients:', error);
      alert('Failed to load patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    // Filter patients by search (prefix match)
    const q = searchQuery.toLowerCase().trim();
    if (q === '') {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(
        patients.filter(p => p.name.toLowerCase().startsWith(q))
      );
    }
  }, [searchQuery, patients]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  };

  const showError = (message) => {
    alert(message);
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedPatient) {
      showError('Please select a patient');
      return;
    }
    if (!selectedDate) {
      showError('Please select a date');
      return;
    }
    if (!selectedTime) {
      showError('Please select a time');
      return;
    }
    if (!reason.trim()) {
      showError('Please enter reason/complaint');
      return;
    }

    setIsSaving(true);
    try {
      // Create appointment draft
      const draft = new AppointmentDraft({
        clientName: selectedPatient.name,
        appointmentType: 'Consultation',
        date: new Date(selectedDate),
        time: selectedTime,
        location: 'Clinic',
        notes: notes.trim(),
        patientId: selectedPatient.id,
        gender: selectedPatient.gender,
        mode: 'In-clinic',
        priority: 'Normal',
        durationMinutes: 20,
        reminder: true,
        chiefComplaint: reason.trim(),
        status: 'Scheduled',
      });

      // Convert to JSON for API
      const payload = draft.toJSON();

      // Create appointment via API
      const response = await AuthService.post('/appointments', payload);
      
      if (response) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
      showError('Failed to create appointment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarIcon = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g.includes('female') || g.startsWith('f')) {
      return '👧';
    }
    return '👦';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="flex h-[88vh] max-w-6xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
        {/* LEFT: Patient List */}
        <div className="w-2/5 bg-gradient-to-br from-indigo-600 to-purple-600 flex flex-col">
          {/* Header */}
          <div className="p-6 bg-white/10 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-white text-xl font-bold">Select Patient</h2>
              </div>
              <button
                onClick={loadPatients}
                className="p-2 bg-white/15 hover:bg-white/25 rounded-lg transition-all"
                title="Refresh patients"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name..."
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
              />
            </div>
          </div>

          {/* Patient count */}
          <div className="px-6 py-2">
            <p className="text-white/80 text-sm font-medium">
              {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Patient List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                <p>Loading patients...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <svg className="w-16 h-16 text-white/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="font-semibold">No patients found</p>
                <p className="text-sm text-white/70 mt-1">
                  {searchQuery ? 'Try a different search' : 'Add patients to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-4 rounded-xl cursor-pointer transition-all transform hover:scale-102 ${
                      selectedPatient?.id === patient.id
                        ? 'bg-white/30 border-2 border-white shadow-lg'
                        : 'bg-white/10 hover:bg-white/20 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl ${selectedPatient?.id === patient.id ? 'scale-110' : ''} transition-transform`}>
                        {getAvatarIcon(patient.gender)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-white font-semibold ${selectedPatient?.id === patient.id ? 'font-bold' : ''}`}>
                          {patient.name}
                        </p>
                        {patient.age && (
                          <p className="text-white/70 text-sm">{patient.age} years</p>
                        )}
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Appointment Form */}
        <div className="w-3/5 flex flex-col bg-white">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPatient ? `Creating for ${selectedPatient.name}` : 'Select a patient to continue'}
                  </p>
                </div>
              </div>
              {selectedPatient && (
                <div className="text-4xl">{getAvatarIcon(selectedPatient.gender)}</div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Schedule Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Schedule
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Appointment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason / Chief Complaint *</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Fever, Headache, Check-up"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Clinical Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Additional notes or observations..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentForm;
