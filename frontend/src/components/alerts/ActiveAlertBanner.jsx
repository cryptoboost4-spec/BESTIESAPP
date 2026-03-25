import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, functions } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';

export default function ActiveAlertBanner() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Two separate queries matching security rules:
    // 1. Check-ins the user created that are alerted
    const ownAlertsQuery = query(
      collection(db, 'checkins'),
      where('userId', '==', currentUser.uid),
      where('status', '==', 'alerted')
    );

    // 2. Check-ins where user is a selected bestie that are alerted
    const bestieAlertsQuery = query(
      collection(db, 'checkins'),
      where('bestieIds', 'array-contains', currentUser.uid),
      where('status', '==', 'alerted')
    );

    const alertsMap = new Map();

    const handleSnapshot = (isUserAlert) => (snapshot) => {
      snapshot.forEach((doc) => {
        alertsMap.set(doc.id, { id: doc.id, ...doc.data(), isUserAlert });
      });
      // Remove docs no longer in this snapshot
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') alertsMap.delete(change.doc.id);
      });

      const alerts = Array.from(alertsMap.values());
      if (alerts.length > 0) {
        alerts.sort((a, b) => {
          const aTime = a.alertedAt?.toMillis() || a.alertTime?.toMillis() || 0;
          const bTime = b.alertedAt?.toMillis() || b.alertTime?.toMillis() || 0;
          return bTime - aTime;
        });
        setActiveAlert(alerts[0]);
        if (!alerts[0].isUserAlert) {
          markAsViewed(alerts[0].id);
        }
      } else {
        setActiveAlert(null);
      }
      setLoading(false);
    };

    const handleError = (error) => {
      console.error('Error loading active alerts:', error);
      setLoading(false);
    };

    const unsubscribeOwn = onSnapshot(ownAlertsQuery, handleSnapshot(true), handleError);
    const unsubscribeBestie = onSnapshot(bestieAlertsQuery, handleSnapshot(false), handleError);

    return () => {
      unsubscribeOwn();
      unsubscribeBestie();
    };
  }, [currentUser]);

  const markAsViewed = async (checkinId) => {
    try {
      const markAlertViewed = httpsCallable(functions, 'markAlertViewed');
      await markAlertViewed({ checkinId });
    } catch (error) {
      console.error('Error marking alert viewed:', error);
    }
  };

  const handleMarkSafe = async () => {
    try {
      const markSafe = httpsCallable(functions, 'markCheckInSafe');
      await markSafe({ checkinId: activeAlert.id });
      toast.success('Marked as safe! Your besties have been notified.');
    } catch (error) {
      console.error('Error marking safe:', error);
      toast.error('Failed to mark as safe. Please try again.');
    }
  };

  if (loading || !activeAlert) return null;

  const alertAge = activeAlert.alertedAt 
    ? Math.floor((Date.now() - activeAlert.alertedAt.toMillis()) / 1000 / 60)
    : activeAlert.alertTime
    ? Math.floor((Date.now() - activeAlert.alertTime.toMillis()) / 1000 / 60)
    : 0;

  const locationText = typeof activeAlert.location === 'object' 
    ? activeAlert.location.address 
    : activeAlert.location;

  return (
    <div className={`${
      activeAlert.isUserAlert 
        ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 dark:border-orange-600' 
        : 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
    } border-2 rounded-lg p-4 mb-6 shadow-lg`}>
      
      {activeAlert.isUserAlert ? (
        // User's own alert
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-orange-700 dark:text-orange-300">
              ⚠️ YOU HAVE AN ACTIVE ALERT
            </h3>
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {alertAge} min ago
            </span>
          </div>
          
          <p className="text-orange-700 dark:text-orange-300 mb-3">
            Your besties have been notified that you missed your check-in!
          </p>
          
          <div className="space-y-2 text-sm text-orange-800 dark:text-orange-200 mb-4">
            {locationText && locationText !== 'No location set' && (
              <div>📍 <strong>Location:</strong> {locationText}</div>
            )}
            {activeAlert.notes && (
              <div>📝 <strong>Notes:</strong> {activeAlert.notes}</div>
            )}
            {activeAlert.photoURLs?.length > 0 && (
              <div>📷 <strong>Photos:</strong> {activeAlert.photoURLs.length} attached</div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleMarkSafe}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex-1 transition-colors"
            >
              ✅ Mark as Safe
            </button>
            <button
              onClick={() => navigate(`/check-in/${activeAlert.id}`)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              View Details
            </button>
          </div>
        </>
      ) : (
        // Bestie's alert about someone else
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-red-700 dark:text-red-300">
              🚨 ACTIVE SAFETY ALERT
            </h3>
            <span className="text-sm text-red-600 dark:text-red-400">
              {alertAge} min ago
            </span>
          </div>
          
          <p className="text-red-700 dark:text-red-300 mb-3 text-lg font-semibold">
            {activeAlert.userName || 'Your friend'} needs help!
          </p>
          
          <div className="space-y-2 text-sm text-red-800 dark:text-red-200 mb-4">
            {locationText && locationText !== 'No location set' && (
              <div>📍 <strong>Location:</strong> {locationText}</div>
            )}
            {activeAlert.notes && (
              <div>📝 <strong>Notes:</strong> {activeAlert.notes}</div>
            )}
            {activeAlert.photoURLs?.length > 0 && (
              <div>📷 {activeAlert.photoURLs.length} photo(s) attached</div>
            )}
          </div>

          <button
            onClick={() => navigate(`/check-in/${activeAlert.id}`)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold w-full transition-colors"
          >
            View Full Details →
          </button>
        </>
      )}
    </div>
  );
}

