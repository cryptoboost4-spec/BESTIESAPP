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
import notificationService from '../services/notifications';

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
    if (!user || !inviterUID) {
      console.log('⚠️ Invalid invite parameters - missing user or inviterUID');
      // Clean up invalid invite
      sessionStorage.removeItem('pending_invite');
      localStorage.removeItem('pending_invite');
      sessionStorage.removeItem('inviter_info');
      localStorage.removeItem('inviter_info');
      return;
    }

    // Prevent self-invitation
    if (inviterUID === user.uid) {
      console.log('⚠️ Self-invitation detected! Clearing stored invite.');
      // Clean up self-invite immediately
      sessionStorage.removeItem('pending_invite');
      localStorage.removeItem('pending_invite');
      sessionStorage.removeItem('inviter_info');
      localStorage.removeItem('inviter_info');
      toast.error("You can't add yourself as a bestie! 😅");
      return;
    }

    console.log('🔄 Processing invite for user:', user.uid, 'from inviter:', inviterUID);

    try {
      // Get current user's data for name fields
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Get inviter info from sessionStorage/localStorage
      const cachedInviterInfo = sessionStorage.getItem('inviter_info') || localStorage.getItem('inviter_info');
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
          const existingData = docRef.data();

          // Check if this connection is already fully accepted
          if (existingData.status === 'accepted' && existingData.recipientId === user.uid) {
            console.log('✅ Bestie connection already exists and is accepted - skipping duplicate');
            found = true;
            // Clean up the invite to prevent reprocessing
            sessionStorage.removeItem('pending_invite');
            localStorage.removeItem('pending_invite');
            sessionStorage.removeItem('inviter_info');
            localStorage.removeItem('inviter_info');
            return; // Exit early - connection already complete
          }

          // Only update if status is pending or recipientId needs updating
          console.log('🔄 Updating existing bestie connection to accepted');
          await updateDoc(doc(db, 'besties', docRef.id), {
            status: 'accepted',
            acceptedAt: Timestamp.now(),
            recipientId: user.uid,
            recipientName: userData.displayName || user.displayName || 'Unknown',
            recipientPhone: user.phoneNumber || userData.phoneNumber || user.email,
            recipientPhotoURL: userData.photoURL || user.photoURL || null,
          });
          found = true;

          // Note: Notifications are handled by Cloud Functions
          break;
        }
      }

      if (!found) {
        console.log('✨ Creating new bestie connection');
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
          recipientPhone: user.phoneNumber || userData.phoneNumber || user.email,
          recipientPhotoURL: userData.photoURL || user.photoURL || null,
        });
        console.log('✅ Bestie connection created');

        // Note: Notifications are handled by Cloud Functions
      } else {
        console.log('✅ Updated existing bestie connection');
      }

      // Update both users' featuredCircle and bestieUserIds immediately (don't wait for Cloud Functions)
      // Do this BEFORE creating celebrations so we have permission to read inviter's real name
      try {
        console.log('🔄 Updating featured circles and bestie lists');

        // Update current user's document (we have permission to update our own)
        const currentUserCircle = userData.featuredCircle || [];
        const currentUserBesties = userData.bestieUserIds || [];
        const updates = {};

        if (!currentUserBesties.includes(inviterUID)) {
          updates.bestieUserIds = [...currentUserBesties, inviterUID];
        }

        if (!currentUserCircle.includes(inviterUID) && currentUserCircle.length < 5) {
          updates.featuredCircle = [...currentUserCircle, inviterUID];
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates);
          console.log('✅ Updated current user document');
        }

        // Now read inviter's profile (we have permission now that they're in our bestieUserIds)
        const inviterRef = doc(db, 'users', inviterUID);
        const inviterSnap = await getDoc(inviterRef);
        if (inviterSnap.exists()) {
          const inviterData = inviterSnap.data();

          // Get real inviter name now that we have permission!
          if (inviterData.displayName && inviterData.displayName !== inviterDisplayName) {
            inviterDisplayName = inviterData.displayName;
            inviterPhotoURL = inviterData.photoURL || inviterPhotoURL;
            console.log('✅ Got real inviter name:', inviterDisplayName);
          }
        }

        // Note: Cloud Functions will update the inviter's bestieUserIds and featuredCircle
        // We don't have permission to update other users' documents from the client
      } catch (error) {
        console.error('Failed to update user documents:', error);
        // Non-critical error, continue anyway
      }

      // Create celebration documents AFTER updating user docs (so we have real names)
      try {
        console.log('🎉 Creating celebration documents with real names');
        // Celebration for the invitee (current user) - now with real inviter name!
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
        console.log('✅ Celebrations created with names:', inviterDisplayName, 'and', userData.displayName || user.displayName);
      } catch (error) {
        console.error('Failed to create celebration documents:', error);
      }

      // Clean up storage after successful processing
      sessionStorage.removeItem('pending_invite');
      localStorage.removeItem('pending_invite');
    } catch (error) {
      console.error('Auto-add bestie failed:', error);
      // Clean up even on error to prevent stuck state
      sessionStorage.removeItem('pending_invite');
      localStorage.removeItem('pending_invite');
    }
  };

  // Save invite to sessionStorage if present in URL (BEFORE login/signup)
  // sessionStorage persists across OAuth redirects, unlike localStorage in incognito
  // Auth listener will process it after auth initializes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviterUID = urlParams.get('invite');
    if (inviterUID) {
      // Use sessionStorage for better persistence across OAuth redirects
      sessionStorage.setItem('pending_invite', inviterUID);
      localStorage.setItem('pending_invite', inviterUID); // Fallback for old code

      // Fetch inviter info early so it's ready for welcome screen
      // Note: This may fail with permission-denied if inviter's profile is private
      // That's okay - we'll show a generic invite message instead
      const fetchInviterInfo = async () => {
        try {
          const inviterRef = doc(db, 'users', inviterUID);
          const inviterSnap = await getDoc(inviterRef);
          if (inviterSnap.exists()) {
            const inviterData = inviterSnap.data();
            const inviterInfo = JSON.stringify({
              uid: inviterUID,
              displayName: inviterData.displayName,
              photoURL: inviterData.photoURL,
            });
            sessionStorage.setItem('inviter_info', inviterInfo);
            localStorage.setItem('inviter_info', inviterInfo); // Fallback
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
        // Check sessionStorage first (better for OAuth redirects), then localStorage
        const inviterUID = sessionStorage.getItem('pending_invite') || localStorage.getItem('pending_invite');
        if (inviterUID) {
          console.log('📨 Found pending invite');
          console.log('📊 Invite Details:', {
            inviterUID,
            currentUserUID: user.uid,
            isSelfInvite: inviterUID === user.uid,
            sessionStorage: sessionStorage.getItem('pending_invite'),
            localStorage: localStorage.getItem('pending_invite'),
            inviterInfo: sessionStorage.getItem('inviter_info') || localStorage.getItem('inviter_info')
          });
          await processInvite(user, inviterUID);
          console.log('✅ Invite processing complete');

          // For returning users, show toast and clean up inviter info
          // For new users, keep inviter_info for welcome screen during onboarding
          if (!isNewUser) {
            const inviterInfo = sessionStorage.getItem('inviter_info') || localStorage.getItem('inviter_info');
            if (inviterInfo) {
              try {
                const { displayName } = JSON.parse(inviterInfo);
                toast.success(`You're now besties with ${displayName}! 💜`, { duration: 5000 });
              } catch (e) {
                console.error('Failed to parse inviter info:', e);
              }
              // Clean up inviter info for returning users
              sessionStorage.removeItem('inviter_info');
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

            // Initialize push notifications if enabled
            if (data.notificationsEnabled && data.fcmToken && !notificationService.initialized) {
              notificationService.setupForegroundListener();
              notificationService.initialized = true;
              console.log('✅ Push notification foreground listener initialized');
            }
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
