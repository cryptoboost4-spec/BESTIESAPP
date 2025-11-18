import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);
// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Helper function to parse Firebase auth errors into user-friendly messages
const getAuthErrorMessage = (error) => {
  const errorCode = error.code;

  switch (errorCode) {
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    default:
      // Return original message if no specific handling
      return error.message.replace('Firebase: ', '').replace(/\(auth\/[\w-]+\)\.?/, '').trim();
  }
};

// Auth functions
export const authService = {
  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: getAuthErrorMessage(error) };
    }
  },

  // Sign in with email/password
  signInWithEmail: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign in error:', error);
      return { success: false, error: getAuthErrorMessage(error) };
    }
  },

  // Sign up with email/password
  signUpWithEmail: async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update the Firebase Auth user profile with displayName
      // This ensures AuthContext will see the correct displayName when it creates the Firestore doc
      await updateProfile(result.user, {
        displayName: displayName || 'New User'
      });

      // The AuthContext listener will create the Firestore document with the correct displayName
      // from result.user.displayName, so we don't need to create it here

      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign up error:', error);
      return { success: false, error: getAuthErrorMessage(error) };
    }
  },

  // Set up reCAPTCHA verifier for phone auth
  setupRecaptcha: (containerId) => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          'size': 'normal', // Show visible checkbox so users can see progress
          'callback': () => {
            // reCAPTCHA solved - allow signInWithPhoneNumber
          }
        });
      }
      return { success: true, verifier: window.recaptchaVerifier };
    } catch (error) {
      console.error('reCAPTCHA setup error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send verification code to phone
  sendPhoneVerification: async (phoneNumber, recaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return { success: true, confirmationResult };
    } catch (error) {
      console.error('Phone verification error:', error);
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      return { success: false, error: error.message };
    }
  },

  // Verify code and sign in
  verifyPhoneCode: async (confirmationResult, code) => {
    try {
      const result = await confirmationResult.confirm(code);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Code verification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Get auth token
  getToken: async () => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
};

// Firestore helpers
export const firestoreService = {
  // Get document
  getDocument: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      }
      return { success: false, error: 'Document not found' };
    } catch (error) {
      console.error('Get document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Set document
  setDocument: async (collectionName, docId, data) => {
    try {
      await setDoc(doc(db, collectionName, docId), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Set document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Add document
  addDocument: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Add document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update document
  updateDocument: async (collectionName, docId, data) => {
    try {
      await updateDoc(doc(db, collectionName, docId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete document
  deleteDocument: async (collectionName, docId) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Query documents
  queryDocuments: async (collectionName, conditions) => {
    try {
      let q = collection(db, collectionName);
      
      if (conditions && conditions.length > 0) {
        const constraints = conditions.map(({ field, operator, value }) => 
          where(field, operator, value)
        );
        q = query(q, ...constraints);
      }
      
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: docs };
    } catch (error) {
      console.error('Query documents error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Storage helpers
export const storageService = {
  // Upload file
  uploadFile: async (path, file) => {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error) {
      console.error('Upload file error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete file
  deleteFile: async (path) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Timestamp utilities
export const timestampUtils = {
  now: () => Timestamp.now(),
  fromDate: (date) => Timestamp.fromDate(date),
  toDate: (timestamp) => timestamp?.toDate(),
  serverTimestamp: () => serverTimestamp()
};

// Export messaging functions for notifications service
export { getToken, onMessage };

export default app;
