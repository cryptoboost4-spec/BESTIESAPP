import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import { logAnalyticsEvent } from '../services/firebase';

export function useCheckInCompletion(checkInId, currentUser) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSafeLoader, setShowSafeLoader] = useState(false);

  const completeCheckIn = async () => {
    setShowSafeLoader(true);

    try {
      setLoading(true);
      const result = await apiService.completeCheckIn({ checkInId: checkInId });

      if (!result.data?.success) {
        throw new Error(result.error?.message || 'Failed to complete check-in');
      }

      // Verify the status changed by checking Firestore
      const checkInRef = doc(db, 'checkins', checkInId);
      const checkInSnap = await getDoc(checkInRef);

      if (!checkInSnap.exists() || checkInSnap.data().status !== 'completed') {
        throw new Error('Check-in status verification failed');
      }

      // Delete check-in related notifications (reminder and urgent)
      try {
        const notificationsRef = collection(db, 'notifications');
        const notificationsQuery = query(
          notificationsRef,
          where('userId', '==', currentUser.uid),
          where('type', 'in', ['checkin_reminder', 'checkin_urgent'])
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const deletePromises = notificationsSnapshot.docs.map(notifDoc => 
          deleteDoc(notifDoc.ref)
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting check-in notifications:', error);
      }

      // Track analytics
      const checkInData = checkInSnap.data();
      const actualDuration = checkInData.duration || 0;
      logAnalyticsEvent('checkin_completed', {
        duration: actualDuration,
        was_extended: checkInData.extended || false
      });

      setTimeout(() => {
        navigate('/');
        toast.success('You\'re safe! Welcome home 💜', {
          duration: 4000,
          icon: '✅',
        });
      }, 2000);
    } catch (error) {
      console.error('Error completing check-in:', error);
      setShowSafeLoader(false);
      toast.error('Failed to complete check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { completeCheckIn, loading, showSafeLoader, setShowSafeLoader };
}

