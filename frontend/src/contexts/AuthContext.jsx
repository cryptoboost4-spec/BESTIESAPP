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
        return;
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
    } catch (error) {
      console.error('Auto-add bestie failed:', error);
    }
  };

  // Save invite to localStorage if present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviterUID = urlParams.get('invite');
    if (inviterUID) {
      localStorage.setItem('pending_invite', inviterUID);
      // Clear URL immediately for cleanliness
      window.history.replaceState({}, '', '/');

      // If user is already logged in, process invite immediately
      if (auth.currentUser) {
        processInvite(auth.currentUser, inviterUID);
      }
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

        if (!userSnap.exists()) {
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
            notifications: { whatsapp: false, email: true },
            smsSubscription: { active: false },
            lastActive: Timestamp.now(),
          });
        } else {
          // Returning user - update last active timestamp
          await updateDoc(userRef, { lastActive: Timestamp.now() });
        }

        // Process pending invite (works for multiple users)
        const inviterUID = localStorage.getItem('pending_invite');
        if (inviterUID) {
          await processInvite(user, inviterUID);
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
