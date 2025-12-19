import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ConfettiCelebration from '../ConfettiCelebration';
import haptic from '../../utils/hapticFeedback';

const ChallengeCelebration = ({ isOpen, onClose, challenge }) => {
  const [template, setTemplate] = useState(null);
  const [partnerName, setPartnerName] = useState('Your bestie');
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isOpen || !challenge) return;

    const loadData = async () => {
      try {
        // Load challenge template
        if (challenge.challengeId) {
          const templateDoc = await getDoc(doc(db, 'challenge_templates', challenge.challengeId));
          if (templateDoc.exists()) {
            setTemplate(templateDoc.data());
          }
        }

        // Load partner name
        const partnerId = challenge.user1Id === challenge.currentUserId
          ? challenge.user2Id
          : challenge.user1Id;
        if (partnerId) {
          const partnerDoc = await getDoc(doc(db, 'users', partnerId));
          if (partnerDoc.exists()) {
            setPartnerName(partnerDoc.data().displayName || 'Your bestie');
          }
        }
      } catch (error) {
        console.error('Error loading celebration data:', error);
      } finally {
        setLoading(false);
        setShowConfetti(true);
        haptic.heavy();
      }
    };

    loadData();
  }, [isOpen, challenge]);

  if (!isOpen) return null;

  const challengeName = template?.name || challenge.name || 'Challenge';

  return (
    <>
      {showConfetti && <ConfettiCelebration />}
      
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full text-center">
          {/* Content */}
          <div className="px-6 py-8">
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : (
              <>
                <div className="text-6xl mb-4">🎊🎊🎊</div>
                <h2 className="text-2xl font-display text-gray-900 dark:text-gray-100 mb-2">
                  You did it together! 🎉
                </h2>
                <h3 className="text-xl font-semibold text-primary mb-4">
                  {challengeName}
                </h3>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-6">
                  ✓ COMPLETED
                </p>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    You both earned:
                  </p>
                  <ul className="text-left space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• {template?.points || challenge.points || 0} points</li>
                    {template?.badge && (
                      <li>• {template.badge} badge 🛡️</li>
                    )}
                  </ul>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Great teamwork! 💜
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      haptic.light();
                      onClose();
                    }}
                    className="flex-1 btn btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      haptic.medium();
                      onClose();
                      // Navigate to challenges page to start new one
                      window.location.href = '/challenges';
                    }}
                    className="flex-1 btn btn-primary"
                  >
                    Start New Challenge
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChallengeCelebration;

