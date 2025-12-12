import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../provider';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { signOut } = useApp();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ maxWidth: '500px', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937' }}>Access Denied</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: '1.6' }}>
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Go Back
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
