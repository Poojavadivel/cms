import React from 'react';

const RecentActivity = ({ activities = [] }) => {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
        Recent Activity
      </h3>
      <div>
        {activities.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No recent activity</p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} style={{
              padding: '0.75rem 0',
              borderBottom: index < activities.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                {activity.message}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                {activity.time}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
