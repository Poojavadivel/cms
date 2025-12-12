import React from 'react';

const StatsCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: `${color}20`,
          padding: '12px',
          borderRadius: '12px',
          color: color
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#1f2937' }}>{value}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>{title}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
