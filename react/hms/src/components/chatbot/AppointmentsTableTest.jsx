import React from 'react';
import AppointmentsTable from './AppointmentsTable';

/**
 * Test component to verify AppointmentsTable renders correctly
 * This isolates the component to test if it works independently
 */
const AppointmentsTableTest = () => {
  // Sample test data
  const sampleAppointments = [
    {
      appointmentId: '1',
      patient: 'John Doe',
      patientAge: 45,
      patientGender: 'Male',
      patientPhone: '+1234567890',
      doctor: 'Dr. Smith',
      time: new Date().toISOString(),
      type: 'Consultation',
      status: 'scheduled',
      location: 'Room 101',
      notes: 'Regular checkup'
    },
    {
      appointmentId: '2',
      patient: 'Jane Smith',
      patientAge: 32,
      patientGender: 'Female',
      patientPhone: '+0987654321',
      doctor: 'Dr. Johnson',
      time: new Date(Date.now() + 3600000).toISOString(),
      type: 'Follow-up',
      status: 'confirmed',
      location: 'Room 202',
      notes: 'Post-surgery follow-up'
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>AppointmentsTable Component Test</h2>
      <p>If you see a table below, the component works correctly.</p>
      
      <div style={{ marginTop: '20px', border: '2px solid #ccc', padding: '10px' }}>
        <AppointmentsTable
          appointments={sampleAppointments}
          date={new Date().toISOString()}
        />
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0' }}>
        <h3>Test Data:</h3>
        <pre>{JSON.stringify(sampleAppointments, null, 2)}</pre>
      </div>
    </div>
  );
};

export default AppointmentsTableTest;
