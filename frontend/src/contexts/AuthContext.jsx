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
      // Get current user's data for name fields
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Get inviter info from localStorage (set during URL param capture)
      const cachedInviterInfo = localStorage.getItem('inviter_info');
      let inviterDisplayName = 'Your Bestie';
      let inviterPhotoURL = null;

      if (cachedInviterInfo) {
        try {
          const inviterInfo = JSON.parse(cachedInviterInfo);
          inviterDisplayName = inviterInfo.displayName || 'Your Bestie';
          inviterPhotoURL = inviterInfo.photoURL;
        } catch (e) {
          console.log('Could not parse cached inviter info');
        }
      }

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
            recipientName: userData.displayName || user.displayName || 'Unknown',
            recipientPhone: user.phoneNumber || user.email,
            recipientPhotoURL: userData.photoURL || user.photoURL || null,
          });
          found = true;

          // Note: Notifications are handled by Cloud Functions
          break;
        }
      }

      if (!found) {
        // No existing connection - create a new bestie
        // Using cached inviter info to avoid permission errors
        await addDoc(collection(db, 'besties'), {
          requesterId: inviterUID,
          recipientId: user.uid,
          status: 'accepted',
          acceptedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          requesterName: inviterDisplayName,
          requesterPhotoURL: inviterPhotoURL,
          recipientName: userData.displayName || user.displayName || 'Unknown',
          recipientPhone: user.phoneNumber || user.email,
          recipientPhotoURL: userData.photoURL || user.photoURL || null,
        });

        // Note: Notifications are handled by Cloud Functions
      }

      // Create celebration documents for BOTH users
      try {
        // Celebration for the invitee (current user)
        await addDoc(collection(db, 'bestie_celebrations'), {
          userId: user.uid,
          bestieId: inviterUID,
          bestieName: inviterDisplayName,
          bestiePhotoURL: inviterPhotoURL,
          seen: false,
          createdAt: Timestamp.now(),
        });

        // Celebration for the inviter (they'll see the new user's name)
        await addDoc(collection(db, 'bestie_celebrations'), {
          userId: inviterUID,
          bestieId: user.uid,
          bestieName: userData.displayName || user.displayName || 'Someone',
          bestiePhotoURL: userData.photoURL || user.photoURL || null,
          seen: false,
          createdAt: Timestamp.now(),
        });
      } catch (error) {
        console.error('Failed to create celebration documents:', error);
      }

      // Clean up localStorage after successful processing
      localStorage.removeItem('pending_invite');
    } catch (error) {
      console.error('Auto-add bestie failed:', error);
    }
  };

  // Save invite to localStorage if present in URL (BEFORE login/signup)
  // Auth listener will process it after auth initializes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviterUID = urlParams.get('invite');
    if (inviterUID) {
      localStorage.setItem('pending_invite', inviterUID);

      // Fetch inviter info early so it's ready for welcome screen
      // Note: This may fail with permission-denied if inviter's profile is private
      // That's okay - we'll show a generic invite message instead
      const fetchInviterInfo = async () => {
        try {
          const inviterRef = doc(db, 'users', inviterUID);
          const inviterSnap = await getDoc(inviterRef);
          if (inviterSnap.exists()) {
            const inviterData = inviterSnap.data();
            localStorage.setItem('inviter_info', JSON.stringify({
              uid: inviterUID,
              displayName: inviterData.displayName,
              photoURL: inviterData.photoURL,
            }));
          }
        } catch (error) {
          // Permission denied is expected - user isn't a bestie yet
          // Just show generic invite message during onboarding
          console.log('Could not fetch inviter info (this is normal):', error.code);
        }
      };
      fetchInviterInfo();

      // Clear URL query params for cleanliness (keep the pathname)
      const currentPath = window.location.pathname;
      window.history.replaceState({}, '', currentPath);
      // Don't process bestie connection here - let auth listener handle it reliably
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

          // Note: Welcome notification is handled by Cloud Functions
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
          if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };
            setUserData(data);
          } else {
            console.error('❌ User document does not exist at path:', `users/${user.uid}`);
          }
          setLoading(false);
        }, (error) => {
          console.error('❌ Firestore listener error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
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
