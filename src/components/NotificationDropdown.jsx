import { useEffect, useState } from 'react';
import PriorityBadge from './PriorityBadge';
import './NotificationDropdown.css';

export default function NotificationDropdown({ role = 'student', isOpen = false, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/notifications/${role}?limit=5`);
        const data = await response.json();
        setNotifications(data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, role]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n =>
        n._id === notificationId ? { ...n, status: 'read' } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <>
      {isOpen && <div className="notification-dropdown-overlay" onClick={onClose} />}
      <div className={`notification-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="notification-dropdown-header">
          <h3>Notifications</h3>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </div>

        <div className="notification-dropdown-content">
          {loading ? (
            <div className="notification-loading">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">No notifications</div>
          ) : (
            <ul className="notification-list">
              {notifications.slice(0, 5).map(notif => (
                <li
                  key={notif._id}
                  className={`notification-item ${notif.status === 'unread' ? 'unread' : ''}`}
                >
                  <div className="notification-item-header">
                    <h4>{notif.title}</h4>
                    <PriorityBadge priority={notif.priority} />
                  </div>
                  <p className="notification-item-message">{notif.message}</p>
                  <div className="notification-item-actions">
                    {notif.status === 'unread' && (
                      <button
                        className="notification-action-btn"
                        onClick={() => handleMarkAsRead(notif._id)}
                        title="Mark as read"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      className="notification-action-btn danger"
                      onClick={() => handleDelete(notif._id)}
                      title="Delete notification"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="notification-item-footer">
                    <small>{new Date(notif.createdAt).toLocaleString()}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="notification-dropdown-footer">
          <a href="#" className="view-all-link" onClick={(e) => {
            e.preventDefault();
            window.location.href = `/notifications?role=${encodeURIComponent(role)}`;
          }}>
            View All Notifications →
          </a>
        </div>
      </div>
    </>
  );
}
