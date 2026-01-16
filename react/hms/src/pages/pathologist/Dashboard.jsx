import React from 'react';
import { useApp } from '../../provider';

const PathologistDashboard = () => {
  const { user } = useApp();

  return (
    <div style={{ height: '100%', padding: '0.5rem', background: '#f9fafb', overflow: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '0.9rem', marginBottom: '0.1rem', color: '#1f2937', fontWeight: '600' }}>
          Welcome, {user?.fullName}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '0.4rem', fontSize: '0.65rem' }}>Pathologist Dashboard</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem' }}>
          <div style={{ background: 'white', padding: '0.4rem', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.1rem' }}>🔬</div>
            <h3 style={{ fontSize: '0.7rem', marginBottom: '0.1rem', fontWeight: '600' }}>Lab Tests</h3>
            <p style={{ color: '#6b7280', fontSize: '0.6rem' }}>Manage tests</p>
          </div>
          
          <div style={{ background: 'white', padding: '0.4rem', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.1rem' }}>📄</div>
            <h3 style={{ fontSize: '0.7rem', marginBottom: '0.1rem', fontWeight: '600' }}>Reports</h3>
            <p style={{ color: '#6b7280', fontSize: '0.6rem' }}>Generate reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathologistDashboard;
