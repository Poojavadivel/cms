import React from 'react';
import { useApp } from '../../provider';

const ProfilePage = () => {
  const { user } = useApp();

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#f9fafb' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1f2937' }}>My Profile</h1>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <strong>Name:</strong> {user?.fullName || 'N/A'}
          </div>
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <strong>Email:</strong> {user?.email || 'N/A'}
          </div>
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <strong>Role:</strong> {user?.role || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
