import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const UrgentAlertBanner = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [urgentAlerts, setUrgentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Listen for active check-ins that are in 'alerted' status
    // where the current user is in the selectedBesties array
    const alertsQuery = query(
      collection(db, 'checkins'),
      where('status', '==', 'alerted'),
      where('selectedBesties', 'array-contains', currentUser.uid),
      orderBy('alertedAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      alertsQuery,
      async (snapshot) => {
        const alerts = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();

          // Get user info for the person who needs help
          const userDoc = await db.collection('users').doc(data.userId).get();
          const userName = userDoc.exists ? userDoc.data().displayName : 'Someone';

          alerts.push({
            id: doc.id,
            ...data,
            userName,
          });
        }

        setUrgentAlerts(alerts);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading urgent alerts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Don't show if no alerts or loading
  if (loading || urgentAlerts.length === 0) {
    return null;
  }

  const handleAlertClick = (alertId) => {
    navigate(`/alert/${alertId}`);
  };

  return (
    <div className="mb-6 space-y-3 animate-fade-in">
      {urgentAlerts.map((alert) => {
        const timeAgo = getTimeAgo(alert.alertedAt?.toDate());

        return (
          <div
            key={alert.id}
            className="relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
            onClick={() => handleAlertClick(alert.id)}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-gradient-x"></div>

            {/* Pulsing overlay */}
            <div className="absolute inset-0 bg-red-600 opacity-20 animate-pulse"></div>

            {/* Content */}
            <div className="relative card p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-4 border-red-500 dark:border-red-600 shadow-2xl">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl animate-bounce shadow-lg">
                    🚨
                  </div>
                </div>

                {/* Alert Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-lg font-bold text-red-900 dark:text-red-100">
                      URGENT ALERT
                    </h3>
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      LIVE
                    </span>
                  </div>

                  <p className="text-red-800 dark:text-red-200 font-semibold mb-1">
                    {alert.userName} hasn't checked in!
                  </p>

                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {alert.location && `📍 ${alert.location}`}
                    {alert.notes && ` • ${alert.notes}`}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <span className="font-semibold">⏰ {timeAgo}</span>
                    <span className="text-red-500">•</span>
                    <span className="font-semibold">Tap to view details and respond</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    →
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* CSS for animated gradient */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

// Helper function to get time ago
const getTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
};

export default UrgentAlertBanner;
