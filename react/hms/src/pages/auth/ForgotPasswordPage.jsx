import React from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ maxWidth: '400px', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1rem' }}>Forgot Password</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <input
          type="email"
          placeholder="Enter your email"
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <button
          style={{ width: '100%', padding: '0.75rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Send Reset Link
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'transparent', color: '#667eea', border: 'none', cursor: 'pointer' }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
