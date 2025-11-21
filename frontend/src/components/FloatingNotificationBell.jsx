import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';

const FloatingNotificationBell = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useDarkMode();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'bestie_request':
        navigate('/besties');
        break;
      case 'check_in_alert':
        navigate('/history');
        break;
      case 'missed_check_in':
        navigate('/besties');
        break;
      case 'request_attention':
        navigate('/besties');
        break;
      case 'badge_earned':
        navigate('/profile');
        break;
      default:
        break;
    }

    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bestie_request':
        return '💜';
      case 'check_in_alert':
        return '⏰';
      case 'missed_check_in':
        return '⚠️';
      case 'request_attention':
        return '👋';
      case 'badge_earned':
        return '🏆';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`fixed top-4 right-0 z-50 transition-transform duration-300 ease-in-out ${
        unreadCount > 0 ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'
      }`}
      ref={dropdownRef}
    >
      {/* Floating Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          relative flex items-center justify-center
          ${unreadCount > 0 ? 'w-20 h-16 px-4' : 'w-16 h-16'}
          ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}
          rounded-l-full shadow-lg
          transition-all duration-300 ease-in-out
          border-2 border-r-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}
        `}
      >
        {/* Bell Icon SVG */}
        <svg
          viewBox="0 0 24 24"
          className={`${unreadCount > 0 ? 'w-6 h-6' : 'w-6 h-6'} transition-all duration-300`}
        >
          <defs>
            <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            fill="none"
            stroke="url(#bellGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Unread Count Badge - appears inside the button when expanded */}
        {unreadCount > 0 && (
          <span className="ml-2 text-sm font-bold bg-gradient-to-br from-rose-500 to-pink-600 text-white px-2 py-0.5 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div className={`absolute top-full right-0 mt-2 w-80 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-2xl border-2 z-50 max-h-96 overflow-hidden flex flex-col transition-colors`}>
          {/* Header */}
          <div className={`p-4 border-b-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50'}`}>
            <h3 className={`font-display text-lg ${isDark ? 'text-gray-100' : 'text-text-primary'} flex items-center justify-between`}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-text-secondary'}`}>No notifications yet</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-text-secondary'}`}>
                  We'll notify you about check-ins, bestie requests, and more
                </p>
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left transition-colors ${
                      isDark
                        ? `hover:bg-gray-700 ${!notification.read ? 'bg-gray-900/50' : ''}`
                        : `hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 ${!notification.read ? 'bg-purple-50/30' : ''}`
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? (isDark ? 'font-semibold text-gray-100' : 'font-semibold text-gray-900') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Mark All as Read */}
          {unreadCount > 0 && (
            <div className={`p-3 border-t-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
              <button
                onClick={async () => {
                  const unreadNotifs = notifications.filter(n => !n.read);
                  for (const notif of unreadNotifs) {
                    await handleMarkAsRead(notif.id);
                  }
                }}
                className="w-full text-center text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingNotificationBell;
