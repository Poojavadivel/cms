import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ maxWidth: '500px', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: '6rem', marginBottom: '1rem', fontWeight: 700, color: '#667eea' }}>404</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937' }}>Page Not Found</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: '1.6' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
