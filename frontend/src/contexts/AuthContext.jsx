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
import { notificationService } from '../services/notificationService';

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

      // Get current user's data for name fields
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

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
            recipientName: userData.displayName || user.displayName || 'Unknown',
            recipientPhone: user.phoneNumber || user.email,
            requesterName: inviterData.displayName || 'Unknown',
            requesterPhone: inviterData.phoneNumber || inviterData.email,
          });
          found = true;

          // Notify both users that they're now connected
          try {
            await notificationService.notifyBestieAccepted(
              inviterUID,
              userData.displayName || user.displayName || 'Someone'
            );
            // Note: Don't notify the new user (they just signed up via invite)
          } catch (err) {
            console.error('Failed to send bestie notification:', err);
          }
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
          requesterName: inviterData.displayName || 'Unknown',
          requesterPhone: inviterData.phoneNumber || inviterData.email,
          recipientName: userData.displayName || user.displayName || 'Unknown',
          recipientPhone: user.phoneNumber || user.email,
        });

        // Notify inviter that new bestie added them
        try {
          await notificationService.createNotification(
            inviterUID,
            'bestie_request',
            'New Bestie!',
            `${userData.displayName || user.displayName || 'Someone'} added you as a bestie!`,
            { bestieName: userData.displayName || user.displayName || 'Someone', bestieId: user.uid }
          );
        } catch (err) {
          console.error('Failed to send bestie notification:', err);
        }
      }

      // Create celebration documents for BOTH users
      try {
        // Celebration for the invitee (current user)
        await addDoc(collection(db, 'bestie_celebrations'), {
          userId: user.uid,
          bestieId: inviterUID,
          bestieName: inviterData.displayName || 'Unknown',
          bestiePhotoURL: inviterData.photoURL || null,
          seen: false,
          createdAt: Timestamp.now(),
        });

        // Celebration for the inviter
        await addDoc(collection(db, 'bestie_celebrations'), {
          userId: inviterUID,
          bestieId: user.uid,
          bestieName: userData.displayName || user.displayName || 'Unknown',
          bestiePhotoURL: userData.photoURL || user.photoURL || null,
          seen: false,
          createdAt: Timestamp.now(),
        });

        console.log('✅ Celebration documents created for both users');
      } catch (error) {
        console.error('Failed to create celebration documents:', error);
      }

      // Clean up localStorage after successful processing
      localStorage.removeItem('pending_invite');
      console.log('Invite processed successfully for:', inviterData.displayName);
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
      console.log('💾 Saving invite code to localStorage:', inviterUID);
      localStorage.setItem('pending_invite', inviterUID);

      // Fetch inviter info early so it's ready for welcome screen
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
            console.log('✅ Inviter info saved:', inviterData.displayName);
          }
        } catch (error) {
          console.error('Failed to fetch inviter info:', error);
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
      console.group('🔐 Auth State Changed');
      console.log('User:', user);
      console.log('User UID:', user?.uid);
      console.groupEnd();

      setCurrentUser(user);

      if (user) {
        errorTracker.setUser(user.uid);
        const userRef = doc(db, 'users', user.uid);
        console.log('📄 Fetching user document at path:', `users/${user.uid}`);
        const userSnap = await getDoc(userRef);
        console.log('📄 User document exists:', userSnap.exists());

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

          // Send welcome notification
          try {
            await notificationService.notifyWelcome(
              user.uid,
              user.displayName || 'New User'
            );
          } catch (err) {
            console.error('Failed to send welcome notification:', err);
          }
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
        console.log('📡 AuthContext: Setting up Firestore listener for user:', user.uid);
        userUnsubscribeRef.current = onSnapshot(userRef, (doc) => {
          console.group('📡 Firestore Listener Callback');
          console.log('Document exists:', doc.exists());
          if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };
            console.log('User data loaded:', data);
            console.log('isAdmin field:', data.isAdmin);
            setUserData(data);
          } else {
            console.error('❌ User document does not exist at path:', `users/${user.uid}`);
          }
          console.groupEnd();
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
