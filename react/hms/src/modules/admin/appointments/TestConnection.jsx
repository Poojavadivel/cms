import React, { useState } from 'react';
import AuthService from '../../../services/authService';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAppointments = async () => {
    setLoading(true);
    setResult('Testing...');
    try {
      const response = await AuthService.get('/appointments');
      console.log('Appointments Response:', response);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPatients = async () => {
    setLoading(true);
    setResult('Testing...');
    try {
      const response = await AuthService.get('/patients');
      console.log('Patients Response:', response);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestAppointment = async () => {
    setLoading(true);
    setResult('Creating test appointment...');
    try {
      // First get a patient
      const patientsResponse = await AuthService.get('/patients');
      const patients = patientsResponse.data || patientsResponse;
      
      if (!patients || patients.length === 0) {
        setResult('ERROR: No patients found. Please create a patient first.');
        setLoading(false);
        return;
      }

      const patient = patients[0];
      
      // Create appointment
      const appointmentData = {
        patientId: patient._id || patient.id,
        appointmentType: 'Consultation',
        startAt: new Date().toISOString(),
        location: 'Clinic',
        status: 'Scheduled',
        notes: 'Test appointment from React',
        vitals: {},
        metadata: {
          mode: 'In-clinic',
          priority: 'Normal',
          durationMinutes: 20,
          reminder: true,
          chiefComplaint: 'Test complaint',
        },
      };

      const response = await AuthService.post('/appointments', appointmentData);
      console.log('Create Response:', response);
      setResult(`SUCCESS! Created appointment:\n${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      border: '2px solid #6366f1',
      maxWidth: '400px',
      zIndex: 9999
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#6366f1'
      }}>
        🔧 API Test Panel
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={testAppointments}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {loading ? 'Loading...' : 'Test GET Appointments'}
        </button>
        <button
          onClick={testPatients}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: loading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {loading ? 'Loading...' : 'Test GET Patients'}
        </button>
        <button
          onClick={createTestAppointment}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {loading ? 'Loading...' : 'Create Test Appointment'}
        </button>
      </div>
      {result && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          fontSize: '11px',
          maxHeight: '240px',
          overflowY: 'auto',
          fontFamily: 'monospace'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestConnection;
