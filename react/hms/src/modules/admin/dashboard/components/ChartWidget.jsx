import React from 'react';

const ChartWidget = ({ title, data = [] }) => {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
        {title}
      </h3>
      <div style={{
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#9ca3af' }}>Chart visualization will go here</p>
      </div>
    </div>
  );
};

export default ChartWidget;
