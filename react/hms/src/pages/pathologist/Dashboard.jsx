import React from 'react';
import { useApp } from '../../provider';

const PathologistDashboard = () => {
  const { user } = useApp();

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#1f2937' }}>
          Welcome, {user?.fullName}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Pathologist Dashboard</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔬</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Lab Tests</h3>
            <p style={{ color: '#6b7280' }}>Manage tests</p>
          </div>
          
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Reports</h3>
            <p style={{ color: '#6b7280' }}>Generate reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathologistDashboard;
