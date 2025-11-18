import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../services/firebase';
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  Timestamp,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import errorTracker from '../services/errorTracking';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const userUnsubscribeRef = useRef(null);

  // Process invite by connecting user with inviter
  const processInvite = async (user, inviterUID) => {
    if (!user || !inviterUID || inviterUID === user.uid) {
      return;
    }

    try {
      const inviterRef = doc(db, 'users', inviterUID);
      const inviterSnap = await getDoc(inviterRef);

      if (!inviterSnap.exists()) {
        console.log('Invalid invite - user does not exist');
        localStorage.removeItem('pending_invite');
        localStorage.removeItem('inviter_info');
        return;
      }

      const inviterData = inviterSnap.data();

      // Store inviter info for welcome screen (only for new users during onboarding)
      localStorage.setItem('inviter_info', JSON.stringify({
        uid: inviterUID,
        displayName: inviterData.displayName,
        photoURL: inviterData.photoURL,
      }));

      // Check if bestie already exists (any direction or by phone)
      const queries = [
        query(collection(db, 'besties'), where('requesterId', '==', inviterUID), where('recipientId', '==', user.uid)),
        query(collection(db, 'besties'), where('requesterId', '==', user.uid), where('recipientId', '==', inviterUID)),
        query(collection(db, 'besties'), where('requesterId', '==', inviterUID), where('recipientPhone', '==', user.phoneNumber || user.email)),
      ];

      let found = false;
      for (let q of queries) {
        const result = await getDocs(q);
        if (!result.empty) {
          const docRef = result.docs[0];
          await updateDoc(doc(db, 'besties', docRef.id), {
            status: 'accepted',
            acceptedAt: Timestamp.now(),
            recipientId: user.uid,
          });
          found = true;
          break;
        }
      }

      if (!found) {
        // No existing connection - create a new bestie
        await addDoc(collection(db, 'besties'), {
          requesterId: inviterUID,
          recipientId: user.uid,
          status: 'accepted',
          acceptedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
        });
      }

      // Clean up localStorage after successful processing
      localStorage.removeItem('pending_invite');
      console.log('Invite processed successfully for:', inviterData.displayName);
    } catch (error) {
      console.error('Auto-add bestie failed:', error);
    }
  };

  // Save invite to localStorage if present in URL
  // Auth listener will process it after auth initializes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviterUID = urlParams.get('invite');
    if (inviterUID) {
      localStorage.setItem('pending_invite', inviterUID);
      // Clear URL immediately for cleanliness
      window.history.replaceState({}, '', '/');
      // Don't process here - let auth listener handle it reliably after auth initializes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);

      if (user) {
        errorTracker.setUser(user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        const isNewUser = !userSnap.exists();

        if (isNewUser) {
          // New user - create their document with stats tracking
          await setDoc(userRef, {
            displayName: user.displayName || 'New User',
            email: user.email,
            phoneNumber: user.phoneNumber || null,
            photoURL: user.photoURL || null,
            stats: {
              joinedAt: Timestamp.now(),
              totalCheckIns: 0,
              completedCheckIns: 0,
              alertedCheckIns: 0,
              totalBesties: 0
            },
            notificationPreferences: { whatsapp: false, email: true },
            notificationsEnabled: false, // Push notifications disabled by default
            smsSubscription: { active: false },
            lastActive: Timestamp.now(),
            onboardingCompleted: false, // New users need onboarding
          });
        } else {
          // Returning user - update last active timestamp
          const updates = { lastActive: Timestamp.now() };

          // If existing user doesn't have onboardingCompleted field, set it to true
          // (they're an existing user, so they don't need onboarding)
          if (userSnap.data().onboardingCompleted === undefined) {
            updates.onboardingCompleted = true;
          }

          // Migrate old 'notifications' field to 'notificationPreferences'
          if (userSnap.data().notifications && !userSnap.data().notificationPreferences) {
            updates.notificationPreferences = userSnap.data().notifications;
          }

          // Ensure notificationsEnabled exists (for push notifications)
          if (userSnap.data().notificationsEnabled === undefined) {
            updates.notificationsEnabled = userSnap.data().fcmToken ? true : false;
          }

          await updateDoc(userRef, updates);
        }

        // Process pending invite (works for all users - new and returning)
        const inviterUID = localStorage.getItem('pending_invite');
        if (inviterUID) {
          await processInvite(user, inviterUID);

          // For returning users, show toast and clean up inviter info
          // For new users, keep inviter_info for welcome screen during onboarding
          if (!isNewUser) {
            const inviterInfo = localStorage.getItem('inviter_info');
            if (inviterInfo) {
              try {
                const { displayName } = JSON.parse(inviterInfo);
                toast.success(`You're now besties with ${displayName}! 💜`, { duration: 5000 });
              } catch (e) {
                console.error('Failed to parse inviter info:', e);
              }
              // Clean up inviter info for returning users
              localStorage.removeItem('inviter_info');
            }
          }
          // For new users, inviter_info will be cleaned up in onboarding welcome screen
        }

        // Clean up previous listener if it exists
        if (userUnsubscribeRef.current) {
          userUnsubscribeRef.current();
        }

        // Listen for real-time updates to user document
        userUnsubscribeRef.current = onSnapshot(userRef, (doc) => {
          if (doc.exists()) setUserData({ id: doc.id, ...doc.data() });
          setLoading(false);
        });
      } else {
        // No user logged in - clean up listener
        if (userUnsubscribeRef.current) {
          userUnsubscribeRef.current();
          userUnsubscribeRef.current = null;
        }
        errorTracker.setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      // Clean up user listener on unmount
      if (userUnsubscribeRef.current) {
        userUnsubscribeRef.current();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
