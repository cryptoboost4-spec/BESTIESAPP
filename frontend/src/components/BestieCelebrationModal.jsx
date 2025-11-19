import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const BestieCelebrationModal = () => {
  const { currentUser, userData } = useAuth();
  const [celebration, setCelebration] = useState(null);
  const [celebrationId, setCelebrationId] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!currentUser || !userData?.onboardingCompleted) return;

    const checkForCelebrations = async () => {
      try {
        const q = query(
          collection(db, 'bestie_celebrations'),
          where('userId', '==', currentUser.uid),
          where('seen', '==', false)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Get the first unseen celebration
          const celebDoc = snapshot.docs[0];
          setCelebrationId(celebDoc.id);
          setCelebration(celebDoc.data());
          setShow(true);
          console.log('🎉 Showing bestie celebration:', celebDoc.data());
        }
      } catch (error) {
        console.error('Error checking for celebrations:', error);
      }
    };

    checkForCelebrations();
  }, [currentUser, userData]);

  const handleContinue = async () => {
    // Mark celebration as seen
    if (celebrationId) {
      try {
        await updateDoc(doc(db, 'bestie_celebrations', celebrationId), {
          seen: true,
        });
        console.log('✅ Celebration marked as seen');
      } catch (error) {
        console.error('Error marking celebration as seen:', error);
      }
    }

    setShow(false);
    setCelebration(null);
  };

  if (!show || !celebration) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center z-[9999] p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-4xl font-display text-white mb-4">
          You and {celebration.bestieName || 'your friend'} are besties!
        </h1>
        <p className="text-xl text-white/90 mb-2">
          You're now connected in the Besties safety network
        </p>
        <div className="flex justify-center items-center gap-4 my-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
            {celebration.bestiePhotoURL ? (
              <img
                src={celebration.bestiePhotoURL}
                alt={celebration.bestieName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-3xl text-purple-600">
                {celebration.bestieName?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="text-4xl animate-pulse">💜</div>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt="You"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-2xl font-bold text-purple-600">YOU</div>
            )}
          </div>
        </div>
        <p className="text-white/80 mb-8">
          {celebration.bestieName} will be notified if you don't check in on time
        </p>
        <button
          onClick={handleContinue}
          className="btn bg-white text-purple-600 hover:bg-white/90 text-lg px-8 py-4 font-bold"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default BestieCelebrationModal;
