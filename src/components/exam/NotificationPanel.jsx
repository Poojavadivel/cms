import React, { useState, useEffect } from 'react';
import { 
  getNotificationsByStudent, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '../../data/examData';

export default function NotificationPanel({ studentId, isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, studentId]);

  const loadNotifications = () => {
    const notifs = getNotificationsByStudent(studentId);
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  };

  const handleMarkRead = (notificationId) => {
    markNotificationRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(studentId);
    loadNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return { icon: 'check_circle', color: 'text-emerald-600' };
      case 'warning': return { icon: 'warning', color: 'text-yellow-600' };
      case 'error': return { icon: 'error', color: 'text-red-600' };
      default: return { icon: 'info', color: 'text-[#1162d4]' };
    }
  };

  const getNotificationBg = (type, read) => {
    if (read) return 'bg-slate-50 border-slate-200';
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center sm:justify-end z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:w-96 sm:mr-6 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#1162d4] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">notifications</span>
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-white text-[#1162d4] text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-b">
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-[#1162d4] hover:text-[#1162d4]/80 font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300">notifications_off</span>
              <p className="text-slate-600 mt-4">No notifications</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const { icon, color } = getNotificationIcon(notif.type);
              
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border-2 transition-all ${getNotificationBg(notif.type, notif.read)} ${
                    !notif.read ? 'shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined ${color} text-xl`}>
                      {icon}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm ${notif.read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="text-xs text-[#1162d4] hover:text-[#1162d4]/80 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
