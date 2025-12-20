import { useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

/**
 * Demo Bestie Filter Hook
 *
 * Ensures the tutorial demo bestie NEVER persists in production.
 * Filters it from all bestie arrays and removes it from Firestore.
 *
 * @returns {Object} Filter and cleanup functions
 */
export const useDemoBestieFilter = () => {
  const { currentUser } = useAuth();

  /**
   * Check if a bestie is the mock/demo bestie
   */
  const isMockBestie = useCallback((bestie) => {
    if (!bestie) return false;

    return (
      bestie.id === 'tutorial-mock-bestie' ||
      bestie.isMock === true ||
      bestie.isTutorial === true ||
      bestie.name === 'Demo Bestie' ||
      bestie.userId === 'tutorial-mock-user'
    );
  }, []);

  /**
   * Filter mock besties from an array
   */
  const filterBesties = useCallback((besties) => {
    if (!Array.isArray(besties)) return besties;

    const filtered = besties.filter(b => !isMockBestie(b));

    if (filtered.length !== besties.length) {
      console.log('[DemoBestieFilter] Filtered out mock besties:', {
        original: besties.length,
        filtered: filtered.length,
        removed: besties.length - filtered.length,
      });
    }

    return filtered;
  }, [isMockBestie]);

  /**
   * Remove demo bestie from Firestore if it exists
   * This runs once on hook mount to clean up any persisted demo besties
   */
  const cleanupDemoFromFirestore = useCallback(async () => {
    if (!currentUser) {
      console.log('[DemoBestieFilter] No user, skipping Firestore cleanup');
      return;
    }

    try {
      console.log('[DemoBestieFilter] Checking Firestore for demo besties...');

      // Check besties collection
      const bestiesRef = collection(db, 'besties');
      const q = query(
        bestiesRef,
        where('requesterId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(q);
      let removedCount = 0;

      for (const docSnap of snapshot.docs) {
        const bestie = { id: docSnap.id, ...docSnap.data() };

        if (isMockBestie(bestie)) {
          console.log('[DemoBestieFilter] Found demo bestie in Firestore, removing:', docSnap.id);
          await deleteDoc(docSnap.ref);
          removedCount++;
        }
      }

      // Also check as recipient
      const q2 = query(
        bestiesRef,
        where('recipientId', '==', currentUser.uid)
      );

      const snapshot2 = await getDocs(q2);

      for (const docSnap of snapshot2.docs) {
        const bestie = { id: docSnap.id, ...docSnap.data() };

        if (isMockBestie(bestie)) {
          console.log('[DemoBestieFilter] Found demo bestie in Firestore (as recipient), removing:', docSnap.id);
          await deleteDoc(docSnap.ref);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        console.log(`[DemoBestieFilter] ✅ Removed ${removedCount} demo bestie(s) from Firestore`);
      } else {
        console.log('[DemoBestieFilter] ✅ No demo besties found in Firestore');
      }
    } catch (error) {
      console.error('[DemoBestieFilter] Error cleaning up demo from Firestore:', error);
    }
  }, [currentUser, isMockBestie]);

  /**
   * Prevent demo bestie from being saved to Firestore
   * Call this before any Firestore write operation
   */
  const preventDemoSave = useCallback((bestie) => {
    if (isMockBestie(bestie)) {
      console.warn('[DemoBestieFilter] ⚠️ Blocked attempt to save demo bestie to Firestore');
      return false; // Block save
    }
    return true; // Allow save
  }, [isMockBestie]);

  /**
   * Auto-cleanup on mount (runs once)
   */
  useEffect(() => {
    if (!currentUser) return;

    // Clean up after a short delay to let the app stabilize
    const timeoutId = setTimeout(() => {
      cleanupDemoFromFirestore();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [currentUser, cleanupDemoFromFirestore]);

  return {
    isMockBestie,
    filterBesties,
    cleanupDemoFromFirestore,
    preventDemoSave,
  };
};

export default useDemoBestieFilter;
