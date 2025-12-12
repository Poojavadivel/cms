/**
 * StatusChip.jsx
 * Status badge component for appointments
 * React equivalent of Flutter's _statusChip widget
 */

import React from 'react';
import './StatusChip.css';

const StatusChip = ({ status }) => {
  // Get status styling based on value
  const getStatusStyle = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    switch (statusLower) {
      case 'completed':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          fg: '#10b981',
          label: 'Completed'
        };
      case 'pending':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          fg: '#f59e0b',
          label: 'Pending'
        };
      case 'cancelled':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          fg: '#ef4444',
          label: 'Cancelled'
        };
      case 'scheduled':
        return {
          bg: 'rgba(100, 116, 139, 0.12)',
          fg: '#64748b',
          label: 'Scheduled'
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.12)',
          fg: '#64748b',
          label: status || 'Unknown'
        };
    }
  };

  const style = getStatusStyle(status);

  return (
    <span
      className="status-chip"
      style={{
        backgroundColor: style.bg,
        color: style.fg
      }}
    >
      {style.label}
    </span>
  );
};

export default StatusChip;
