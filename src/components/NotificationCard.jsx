import PriorityBadge from './PriorityBadge';
import './NotificationCard.css';

export default function NotificationCard({ notification, onMarkRead, onDelete, onViewDetails }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`notification-card ${notification.status === 'unread' ? 'unread' : 'read'}`}>
      <div className="notification-card-header">
        <div className="notification-card-title-section">
          <h3 className="notification-card-title">{notification.title}</h3>
          <span className="notification-card-status">{notification.module}</span>
        </div>
        <PriorityBadge priority={notification.priority} />
      </div>

      <p className="notification-card-message">{notification.message}</p>

      <div className="notification-card-meta">
        {notification.relatedData && Object.keys(notification.relatedData).length > 0 && (
          <div className="notification-card-details">
            <ul>
              {Object.entries(notification.relatedData).slice(0, 3).map(([key, value]) => (
                <li key={key}>
                  <strong>{key.replace(/_/g, ' ')}:</strong> {String(value).substring(0, 40)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="notification-card-footer">
        <time className="notification-card-time">{formatDate(notification.createdAt)}</time>
        <div className="notification-card-actions">
          {notification.status === 'unread' && (
            <button
              className="notification-card-action-btn primary"
              onClick={() => onMarkRead(notification.id)}
              title="Mark as read"
            >
              Mark as Read
            </button>
          )}
          <button
            className="notification-card-action-btn secondary"
            onClick={() => onViewDetails(notification)}
            title="View details"
          >
            Details
          </button>
          <button
            className="notification-card-action-btn danger"
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
