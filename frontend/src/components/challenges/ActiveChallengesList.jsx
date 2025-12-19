import React from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import ChallengeProgressCard from './ChallengeProgressCard';
import toast from 'react-hot-toast';

const ActiveChallengesList = ({ challenges, currentUserId, onInvitationClick }) => {
  const navigate = useNavigate();

  const handleCancelChallenge = async (challengeId, otherUserName) => {
    if (!window.confirm(`Are you sure? ${otherUserName} will be notified.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'bestie_challenges', challengeId), {
        status: 'cancelled'
      });

      toast.success('Challenge cancelled');
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      toast.error('Failed to cancel challenge');
    }
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const invitations = challenges.filter(c => c.status === 'invited');

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h2 className="text-xl font-display text-gray-900 dark:text-gray-100 mb-4">
            Active Challenges ({activeChallenges.length})
          </h2>
          <div className="space-y-4">
            {activeChallenges.map((challenge) => (
              <ChallengeProgressCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={currentUserId}
                onCancel={() => {
                  const otherUserName = challenge.user1Id === currentUserId
                    ? challenge.user2Name || 'Your bestie'
                    : challenge.user1Name || 'Your bestie';
                  handleCancelChallenge(challenge.id, otherUserName);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="text-xl font-display text-gray-900 dark:text-gray-100 mb-4">
            Pending Invitations ({invitations.length})
          </h2>
          <div className="space-y-4">
            {invitations.map((challenge) => {
              const isInvited = challenge.user2Id === currentUserId;
              const inviterName = challenge.user1Name || 'A bestie';

              return (
                <div
                  key={challenge.id}
                  className="card p-4 border-2 border-purple-300 dark:border-purple-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {isInvited ? `${inviterName} invited you!` : 'Waiting for response...'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {challenge.name || 'Challenge'}
                      </p>
                    </div>
                    <button
                      onClick={() => onInvitationClick(challenge)}
                      className="btn btn-primary btn-sm"
                    >
                      {isInvited ? 'View Invitation' : 'View'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeChallenges.length === 0 && invitations.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-text-secondary">No active challenges yet</p>
          <p className="text-sm text-text-secondary mt-2">
            Start a challenge with a bestie to build safety habits together!
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveChallengesList;

