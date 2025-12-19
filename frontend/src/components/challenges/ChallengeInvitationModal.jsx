import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import haptic from '../../utils/hapticFeedback';

const ChallengeInvitationModal = ({ isOpen, onClose, challenge, onAccept, onDecline, currentUserId }) => {
  const [template, setTemplate] = useState(null);
  const [inviterName, setInviterName] = useState('A bestie');
  const [loading, setLoading] = useState(true);

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

        // Load inviter name
        const inviterId = challenge.user1Id;
        if (inviterId) {
          const inviterDoc = await getDoc(doc(db, 'users', inviterId));
          if (inviterDoc.exists()) {
            setInviterName(inviterDoc.data().displayName || 'A bestie');
          }
        }
      } catch (error) {
        console.error('Error loading challenge data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, challenge]);

  if (!isOpen) return null;

  const challengeName = template?.name || challenge.name || 'Challenge';
  const challengeDescription = template?.description || challenge.description || '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-display text-gray-900 dark:text-gray-100">
              Challenge Invitation 🏆
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {inviterName} wants to do a challenge with you!
                </p>

                <div className="card p-4 mb-4 bg-purple-50 dark:bg-purple-900/30">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                    {challengeName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {challengeDescription}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Time limit: {template?.duration || challenge.duration || 7} days</p>
                    <p>What you both earn:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>{template?.points || challenge.points || 0} points each</li>
                      {template?.badge && <li>{template.badge} badge</li>}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={() => {
                haptic.light();
                onDecline();
              }}
              className="flex-1 btn btn-secondary"
            >
              Decline
            </button>
            <button
              onClick={() => {
                haptic.medium();
                onAccept();
              }}
              className="flex-1 btn btn-primary"
            >
              Accept Challenge
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChallengeInvitationModal;

