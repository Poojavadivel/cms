import { useEffect, useState } from 'react';
import NotificationCard from './NotificationCard';
import NotificationSenderModal from './NotificationSenderModal';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { getUserSession } from '../auth/sessionController';
import './NotificationCenter.css';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Administrative', label: 'Administrative' },
  { value: 'System', label: 'System' },
  { value: 'Alerts', label: 'Alerts' }
];

const PRIORITIES = [
  { value: '', label: 'All' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

export default function NotificationCenter({ role = 'student' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const session = getUserSession();
  const userId = session?.userId;
  
  // Real-time WebSocket notifications
  const { notifications: wsNotifications, isConnected } = useRealtimeNotifications(userId);

  useEffect(() => {
    fetchNotifications();
  }, [role, selectedCategory, selectedPriority, selectedStatus, searchQuery]);

  // Listen for real-time notifications from WebSocket
  useEffect(() => {
    if (wsNotifications.length > 0) {
      // Add new WebSocket notifications to the list
      const lastNotif = wsNotifications[0];
      setNotifications((prev) => {
        const alreadyExists = prev.some((n) => (n.id || n._id) === (lastNotif.id || lastNotif._id));
        if (alreadyExists) return prev;
        return [lastNotif, ...prev];
      });
    }
  }, [wsNotifications]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = `/api/notifications/${role}`;
      const params = new URLSearchParams();

      if (userId) params.append('userId', userId);

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setNotifications(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n =>
        (n.id || n._id) === notificationId ? { ...n, status: 'read' } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/${role}/read-all`, { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(notifications.filter(n => (n.id || n._id) !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await fetch(`/api/notifications/${role}/clear-all`, { method: 'POST' });
        setNotifications([]);
      } catch (error) {
        console.error('Error clearing notifications:', error);
      }
    }
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetails(true);
  };

  const handleNotificationCreated = (newNotification) => {
    if (newNotification) {
      setNotifications((prev) => {
        const alreadyExists = prev.some((n) => (n.id || n._id) === (newNotification.id || newNotification._id));
        if (alreadyExists) return prev;
        return [newNotification, ...prev];
      });
    }
    setShowSenderModal(false);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <h1>Notifications</h1>
        <div className="notification-center-stats">
          <span className="stat">
            Total: <strong>{notifications.length}</strong>
          </span>
          <span className="stat">
            Unread: <strong>{unreadCount}</strong>
          </span>
        </div>
      </div>

      <div className="notification-center-toolbar">
        <div className="notification-center-search">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notification-search-input"
          />
        </div>

        <div className="notification-center-filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="notification-filter-select"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="notification-filter-select"
          >
            {PRIORITIES.map(pri => (
              <option key={pri.value} value={pri.value}>{pri.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="notification-filter-select"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <div className="notification-center-actions">
          {isConnected && (
            <span
              style={{
                fontSize: 11,
                color: '#10b981',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              Live
            </span>
          )}
          {unreadCount > 0 && (
            <button
              className="notification-center-btn secondary"
              onClick={handleMarkAllAsRead}
              title="Mark all notifications as read"
            >
              Mark All Read
            </button>
          )}
          <button
            className="notification-center-btn secondary"
            onClick={handleClearAll}
            title="Clear all notifications"
            disabled={notifications.length === 0}
          >
            Clear All
          </button>
          {(role === 'admin' || role === 'faculty') && (
            <button
              className="notification-center-btn primary"
              onClick={() => setShowSenderModal(true)}
            >
              ✉ Send Notification
            </button>
          )}
        </div>
      </div>

      {showSenderModal && (
        <NotificationSenderModal
          isOpen={showSenderModal}
          onClose={() => setShowSenderModal(false)}
          role={role}
          onSent={handleNotificationCreated}
        />
      )}

      <div className="notification-center-content">
        {loading ? (
          <div className="notification-center-loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-center-empty">
            <p>No notifications found</p>
            {searchQuery && <small>Try adjusting your search filters</small>}
          </div>
        ) : (
          <div className="notification-list-container">
            {notifications.map(notification => (
              <NotificationCard
                key={notification.id || notification._id}
                notification={notification}
                onMarkRead={handleMarkAsRead}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {showDetails && selectedNotification && (
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}

function NotificationDetailsModal({ notification, onClose }) {
  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <h2>{notification.title}</h2>
          <button className="notification-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="notification-modal-body">
          <div className="notification-modal-section">
            <h3>Message</h3>
            <p>{notification.message}</p>
          </div>

          <div className="notification-modal-grid">
            <div className="notification-modal-item">
              <strong>Category</strong>
              <p>{notification.module}</p>
            </div>
            <div className="notification-modal-item">
              <strong>Priority</strong>
              <p>{notification.priority}</p>
            </div>
            <div className="notification-modal-item">
              <strong>From</strong>
              <p className="capitalize">{notification.senderRole}</p>
            </div>
            <div className="notification-modal-item">
              <strong>Status</strong>
              <p className="capitalize">{notification.status}</p>
            </div>
          </div>

          {notification.relatedData && Object.keys(notification.relatedData).length > 0 && (
            <div className="notification-modal-section">
              <h3>Additional Information</h3>
              <div className="notification-modal-details">
                {Object.entries(notification.relatedData).map(([key, value]) => (
                  <div key={key} className="notification-modal-detail-item">
                    <dt className="capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="notification-modal-section">
            <strong>Date & Time</strong>
            <p>{new Date(notification.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="notification-modal-footer">
          <button className="notification-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
