import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import ChallengeLibrary from '../components/challenges/ChallengeLibrary';
import ActiveChallengesList from '../components/challenges/ActiveChallengesList';
import ChallengeInvitationModal from '../components/challenges/ChallengeInvitationModal';
import ChallengeCelebration from '../components/challenges/ChallengeCelebration';
import toast from 'react-hot-toast';

const ChallengesPage = () => {
  const { currentUser, userData } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load active challenges and invitations
  useEffect(() => {
    if (!currentUser) return;

    // Load active challenges where user is user1 or user2
    const activeQuery1 = query(
      collection(db, 'bestie_challenges'),
      where('user1Id', '==', currentUser.uid),
      where('status', 'in', ['invited', 'active'])
    );
    const activeQuery2 = query(
      collection(db, 'bestie_challenges'),
      where('user2Id', '==', currentUser.uid),
      where('status', 'in', ['invited', 'active'])
    );

    const unsubscribe1 = onSnapshot(activeQuery1, (snapshot) => {
      const challenges = [];
      snapshot.forEach((doc) => {
        challenges.push({ id: doc.id, ...doc.data() });
      });
      setActiveChallenges(prev => {
        const combined = [...prev.filter(c => c.user1Id !== currentUser.uid), ...challenges];
        return combined;
      });
      setLoading(false);
    });

    const unsubscribe2 = onSnapshot(activeQuery2, (snapshot) => {
      const challenges = [];
      snapshot.forEach((doc) => {
        challenges.push({ id: doc.id, ...doc.data() });
      });
      setActiveChallenges(prev => {
        const combined = [...prev.filter(c => c.user2Id !== currentUser.uid), ...challenges];
        return combined;
      });
      setLoading(false);
    });

    // Check for celebration (completed challenges)
    const completedQuery1 = query(
      collection(db, 'bestie_challenges'),
      where('user1Id', '==', currentUser.uid),
      where('status', '==', 'completed'),
      where('completedAt', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))) // Last 24 hours
    );
    const completedQuery2 = query(
      collection(db, 'bestie_challenges'),
      where('user2Id', '==', currentUser.uid),
      where('status', '==', 'completed'),
      where('completedAt', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
    );

    const unsubscribe3 = onSnapshot(completedQuery1, (snapshot) => {
      snapshot.forEach((doc) => {
        const challenge = { id: doc.id, ...doc.data() };
        // Show celebration if not already shown
        if (!showCelebration || showCelebration.id !== challenge.id) {
          setShowCelebration(challenge);
        }
      });
    });

    const unsubscribe4 = onSnapshot(completedQuery2, (snapshot) => {
      snapshot.forEach((doc) => {
        const challenge = { id: doc.id, ...doc.data() };
        if (!showCelebration || showCelebration.id !== challenge.id) {
          setShowCelebration(challenge);
        }
      });
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
    };
  }, [currentUser, showCelebration]);

  const handleStartChallenge = (template) => {
    setSelectedChallenge(template);
    setShowLibrary(false);
  };

  const handleInviteBestie = async (template, bestieId) => {
    try {
      // Create challenge invitation
      const now = Timestamp.now();
      const expiresAt = new Date(now.toMillis());
      expiresAt.setDate(expiresAt.getDate() + template.duration);
      const expiresAtTimestamp = Timestamp.fromDate(expiresAt);

      await addDoc(collection(db, 'bestie_challenges'), {
        challengeId: template.id,
        user1Id: currentUser.uid,
        user2Id: bestieId,
        status: 'invited',
        startedAt: null,
        expiresAt: expiresAtTimestamp,
        user1Progress: 0,
        user2Progress: 0,
        completedAt: null,
        target: template.target
      });

      toast.success('Challenge invitation sent!');
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    }
  };

  const handleAcceptInvitation = async (challengeId) => {
    try {
      await updateDoc(doc(db, 'bestie_challenges', challengeId), {
        status: 'active',
        startedAt: Timestamp.now()
      });

      toast.success('Challenge accepted! Good luck! 💜');
      setShowInvitationModal(false);
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast.error('Failed to accept challenge');
    }
  };

  const handleDeclineInvitation = async (challengeId) => {
    try {
      await updateDoc(doc(db, 'bestie_challenges', challengeId), {
        status: 'cancelled'
      });

      toast.success('Challenge declined');
      setShowInvitationModal(false);
    } catch (error) {
      console.error('Error declining challenge:', error);
      toast.error('Failed to decline challenge');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-400">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-display text-gradient mb-6 text-center">
        Bestie Challenges 🏆
      </h1>

      <p className="text-center text-text-secondary mb-6">
        Do challenges with your besties to build safety habits together!
      </p>

      {/* Active Challenges */}
      <ActiveChallengesList
        challenges={activeChallenges}
        currentUserId={currentUser?.uid}
        onInvitationClick={(challenge) => {
          setSelectedChallenge(challenge);
          setShowInvitationModal(true);
        }}
      />

      {/* Start Challenge Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowLibrary(true)}
          className="btn btn-primary btn-lg"
        >
          + Start a Challenge
        </button>
      </div>

      {/* Challenge Library */}
      {showLibrary && (
        <ChallengeLibrary
          isOpen={showLibrary}
          onClose={() => {
            setShowLibrary(false);
            setSelectedChallenge(null);
          }}
          onSelect={handleStartChallenge}
          currentUserId={currentUser?.uid}
          userData={userData}
        />
      )}

      {/* Invitation Modal */}
      {showInvitationModal && selectedChallenge && (
        <ChallengeInvitationModal
          isOpen={showInvitationModal}
          onClose={() => {
            setShowInvitationModal(false);
            setSelectedChallenge(null);
          }}
          challenge={selectedChallenge}
          onAccept={() => handleAcceptInvitation(selectedChallenge.id)}
          onDecline={() => handleDeclineInvitation(selectedChallenge.id)}
          currentUserId={currentUser?.uid}
        />
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <ChallengeCelebration
          isOpen={!!showCelebration}
          onClose={() => setShowCelebration(null)}
          challenge={showCelebration}
        />
      )}
    </div>
  );
};

export default ChallengesPage;

