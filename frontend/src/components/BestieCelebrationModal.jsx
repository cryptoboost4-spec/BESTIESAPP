import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import html2canvas from 'html2canvas';

const BestieCelebrationModal = () => {
  const { currentUser, userData } = useAuth();
  const [celebrationQueue, setCelebrationQueue] = useState([]);
  const [currentCelebration, setCurrentCelebration] = useState(null);
  const [currentCelebrationId, setCurrentCelebrationId] = useState(null);
  const [show, setShow] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const celebrationCardRef = useRef(null);

  // Confetti effect
  useEffect(() => {
    if (!show) return;

    const createConfetti = () => {
      const colors = ['#9333ea', '#ec4899', '#8b5cf6', '#d946ef', '#a855f7'];
      const confettiCount = 100;
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '10000';
      document.body.appendChild(container);

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.opacity = Math.random();
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 0.5;
        confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;

        container.appendChild(confetti);
      }

      // Add CSS animation
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);

      // Cleanup after animation
      setTimeout(() => {
        container.remove();
        style.remove();
      }, 5000);
    };

    createConfetti();
  }, [show]);

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
          // Get all unseen celebrations and queue them
          const celebrations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setCelebrationQueue(celebrations);
          setCurrentCelebration(celebrations[0]);
          setCurrentCelebrationId(celebrations[0].id);
          setShow(true);
          console.log(`🎉 Found ${celebrations.length} celebration(s) to show`);
        }
      } catch (error) {
        console.error('Error checking for celebrations:', error);
      }
    };

    checkForCelebrations();
  }, [currentUser, userData]);

  const handleContinue = async () => {
    // Mark current celebration as seen
    if (currentCelebrationId) {
      try {
        await updateDoc(doc(db, 'bestie_celebrations', currentCelebrationId), {
          seen: true,
        });
        console.log('✅ Celebration marked as seen');
      } catch (error) {
        console.error('Error marking celebration as seen:', error);
      }
    }

    // Check if there are more celebrations in the queue
    const remainingQueue = celebrationQueue.slice(1);
    if (remainingQueue.length > 0) {
      // Show next celebration
      setCelebrationQueue(remainingQueue);
      setCurrentCelebration(remainingQueue[0]);
      setCurrentCelebrationId(remainingQueue[0].id);
      console.log(`📋 Showing next celebration (${remainingQueue.length} remaining)`);
    } else {
      // No more celebrations, hide modal
      setShow(false);
      setCurrentCelebration(null);
      setCurrentCelebrationId(null);
    }
  };

  const handleShare = async (platform) => {
    try {
      // Capture the celebration card as an image
      const cardElement = celebrationCardRef.current;
      if (!cardElement) return;

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
      });

      const imageUrl = canvas.toDataURL('image/png');
      const shareText = `${currentCelebration.bestieName} and I are now besties on Besties App! 💜`;
      const shareUrl = 'https://bestiesapp.web.app';

      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'download':
          // Download the image
          const link = document.createElement('a');
          link.download = 'besties-celebration.png';
          link.href = imageUrl;
          link.click();
          break;
        default:
          break;
      }

      setShowShareMenu(false);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!show || !currentCelebration) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center z-[9999] p-4">
      <div className="max-w-md w-full">
        {/* Celebration Card (for screenshot) */}
        <div ref={celebrationCardRef} className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 sm:p-6 md:p-8 rounded-3xl">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl md:text-8xl mb-4 sm:mb-6 animate-bounce">🎉</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-white mb-3 sm:mb-4 px-2">
              You and {currentCelebration.bestieName || 'your friend'} are besties!
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-2 px-2">
              You can now add each other as emergency contacts
            </p>
            <div className="flex justify-center items-center gap-3 sm:gap-4 my-6 sm:my-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden flex-shrink-0">
                {currentCelebration.bestiePhotoURL ? (
                  <img
                    src={currentCelebration.bestiePhotoURL}
                    alt={currentCelebration.bestieName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl sm:text-3xl text-purple-600">
                    {currentCelebration.bestieName?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="text-3xl sm:text-4xl animate-pulse flex-shrink-0">💜</div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden flex-shrink-0">
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">YOU</div>
                )}
              </div>
            </div>
            <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-6 px-2">
              {currentCelebration.bestieName} will be notified if you don't check in on time
            </p>
          </div>
        </div>

        {/* Queue indicator */}
        {celebrationQueue.length > 1 && (
          <div className="text-center mt-4">
            <p className="text-white text-sm">
              {celebrationQueue.length - 1} more celebration{celebrationQueue.length > 2 ? 's' : ''} remaining
            </p>
          </div>
        )}

        {/* Social Share Buttons */}
        <div className="mt-4 sm:mt-6 flex justify-center gap-3 sm:gap-4">
          <button
            onClick={() => handleShare('twitter')}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3 transition-all"
            title="Share on Twitter"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
            </svg>
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3 transition-all"
            title="Share on Facebook"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
            </svg>
          </button>
          <button
            onClick={() => handleShare('download')}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3 transition-all"
            title="Download image"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        {/* Continue Button (centered) */}
        <div className="flex justify-center mt-4 sm:mt-6">
          <button
            onClick={handleContinue}
            className="btn bg-white text-purple-600 hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-bold"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BestieCelebrationModal;
