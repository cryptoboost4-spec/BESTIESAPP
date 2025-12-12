import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AddBestieModal from './AddBestieModal';
import MessengerContactSelector from './checkin/MessengerContactSelector';
import haptic from '../utils/hapticFeedback';
import toast from 'react-hot-toast';

const AddBestieCard = ({ onBestieAdded }) => {
  const { currentUser, userData } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInAppModal, setShowInAppModal] = useState(false);
  const [showMessengerModal, setShowMessengerModal] = useState(false);
  const [messengerContacts, setMessengerContacts] = useState([]);
  const [selectedMessengerContacts, setSelectedMessengerContacts] = useState([]);

  // Auto-collapse and hide when user gets a bestie (userData updates via real-time listener)
  useEffect(() => {
    if (userData?.stats?.totalBesties > 0) {
      setIsExpanded(false);
      // Card will be hidden by parent component based on hasAnyBestie
    }
  }, [userData?.stats?.totalBesties]);

  // Load Messenger contacts
  useEffect(() => {
    if (!currentUser || !showMessengerModal) return;

    const messengerContactsRef = collection(db, 'messengerContacts');
    const q = query(messengerContactsRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const now = Date.now();
      const activeContacts = contactsData.filter(
        contact => {
          const isActive = contact.expiresAt?.toMillis() > now;
          const isConfirmed = !contact.awaitingConfirmation;
          const notDeclined = !contact.declined;
          const hasName = contact.name && contact.name.trim() !== '';
          return isActive && isConfirmed && notDeclined && hasName;
        }
      );

      setMessengerContacts(activeContacts);
    }, (error) => {
      console.error('Error loading messenger contacts:', error);
      setMessengerContacts([]);
    });

    return () => unsubscribe();
  }, [currentUser, showMessengerModal]);

  const handleExpand = () => {
    haptic.light();
    setIsExpanded(true);
  };

  const handleInAppBestie = () => {
    haptic.light();
    setShowInAppModal(true);
  };

  const handleMessengerBestie = () => {
    haptic.light();
    setShowMessengerModal(true);
  };

  const handleInAppSuccess = () => {
    setShowInAppModal(false);
    onBestieAdded?.();
  };

  const handleMessengerSuccess = () => {
    setShowMessengerModal(false);
    // Messenger besties are added automatically when they message, so we can close
    toast.success('Share your Messenger link to connect! 💜');
  };

  return (
    <>
      <div className="card p-6 mb-6 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800 ring-opacity-50 transition-all duration-300">
        {!isExpanded ? (
          // Initial state
          <div className="text-center">
            <div className="text-5xl mb-4">💜</div>
            <h3 className="font-display text-2xl text-text-primary mb-3">
              You're Taking an Important Step
            </h3>
            <p className="text-text-secondary mb-4 leading-relaxed">
              Adding your first bestie means you'll always have someone looking out for you. It's a smart, protective choice that gives you peace of mind.
            </p>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Your bestie will only see your location when you're on a check-in - your privacy is always protected. This is completely free and gives you confidence every time you're out.
            </p>
            <button
              onClick={handleExpand}
              className="btn btn-primary text-lg py-3 px-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Add Your First Bestie
            </button>
          </div>
        ) : (
          // Expanded state
          <div className="space-y-4">
            <h3 className="font-display text-lg text-text-primary mb-2 text-center">
              Choose How to Connect:
            </h3>
            <p className="text-sm text-text-secondary mb-4 text-center">
              Both options are secure and give you the same protection. Pick what works best for you!
            </p>
            
            {/* Messenger Bestie Card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">💬</div>
                <div className="flex-1">
                  <h4 className="font-display text-lg text-text-primary">Messenger Bestie</h4>
                  <p className="text-sm text-text-secondary">Free & unlimited alerts • Connect when they message you for 20 hours</p>
                </div>
              </div>
              <button
                onClick={handleMessengerBestie}
                className="w-full btn btn-primary"
              >
                Connect with Facebook
              </button>
            </div>

            {/* In-App Bestie Card */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-200 dark:border-pink-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">📱</div>
                <div className="flex-1">
                  <h4 className="font-display text-lg text-text-primary">In-App Bestie</h4>
                  <p className="text-sm text-text-secondary">Telegram (free) • SMS (paid) • Always connected</p>
                </div>
              </div>
              <button
                onClick={handleInAppBestie}
                className="w-full btn btn-secondary"
              >
                Add Bestie
              </button>
            </div>
          </div>
        )}
      </div>

      {/* In-App Bestie Modal */}
      {showInAppModal && (
        <AddBestieModal
          onClose={() => setShowInAppModal(false)}
          onSuccess={handleInAppSuccess}
        />
      )}

      {/* Messenger Bestie Modal */}
      {showMessengerModal && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowMessengerModal(false)}
          style={{ paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom) + 80px))' }}
        >
          <div 
            className="card max-w-lg w-full p-0 animate-scale-up overflow-hidden relative bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-pink-200 dark:border-pink-600 shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowMessengerModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors z-10"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Header */}
            <div className="p-6 pb-4">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <h2 className="text-2xl font-display text-text-primary mb-2">
                  Add Messenger Bestie
                </h2>
                <p className="text-sm text-text-secondary">
                  Share your link and they'll be connected for 20 hours when they message you
                </p>
              </div>
            </div>

            {/* Messenger Contact Selector */}
            <div className="px-6 pb-6">
              <MessengerContactSelector
                messengerContacts={messengerContacts}
                selectedContacts={selectedMessengerContacts}
                setSelectedContacts={setSelectedMessengerContacts}
                userId={currentUser?.uid}
              />
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={handleMessengerSuccess}
                className="w-full btn btn-primary"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddBestieCard;

