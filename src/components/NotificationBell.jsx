import { useEffect, useState } from 'react';
import './NotificationBell.css';

export default function NotificationBell({ role = 'student', onBellClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/notifications/${role}/unread`);
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [role]);

  return (
    <button
      className="notification-bell"
      onClick={onBellClick}
      title={`${unreadCount} unread notifications`}
      aria-label="Notifications"
    >
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="bell-icon"
        fill="currentColor"
      >
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );
}
