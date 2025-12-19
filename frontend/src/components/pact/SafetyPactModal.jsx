import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';

const PACT_TEXT = (bestieName) => `Our Safety Pact

Hey ${bestieName},

You mean a lot to me. And I know I mean a lot to you too.

So let's make a promise to each other:

Whenever either of us is in a situation where we don't feel 100% safe,
we'll use this app.

Not because we're scared, but because we're smart. Not because we have to,
but because we want to come home safe - for ourselves and for each other.

Whether it's a first date, a night out, walking alone, meeting someone new,
or just that weird feeling that something's off - we'll check in.

Because you matter to me. And I matter to you. And we both deserve to
make it home safe.

Let's look out for each other. Deal?`;

const SafetyPactModal = ({ isOpen, onClose, bestieId, bestieName, pactStatus = null, onPactCreated }) => {
  const { currentUser } = useAuth();
  const [promising, setPromising] = useState(false);

  // Check if this is an invitation (other user has already promised)
  const isInvitation = pactStatus === 'pending' && currentUser;

  const handlePromise = async () => {
    if (!currentUser || !bestieId) return;

    setPromising(true);
    haptic.heavy();

    try {
      if (isInvitation) {
        // User 2 accepting - activate pact
        const pactQuery = query(
          collection(db, 'safety_pacts'),
          where('user1Id', '==', bestieId),
          where('user2Id', '==', currentUser.uid),
          where('status', '==', 'pending'),
          limit(1)
        );
        const snapshot = await getDocs(pactQuery);
        
        if (!snapshot.empty) {
          const pactDoc = snapshot.docs[0];
          await updateDoc(doc(db, 'safety_pacts', pactDoc.id), {
            status: 'active',
            activatedAt: Timestamp.now(),
            user2AcceptedAt: Timestamp.now()
          });

          toast.success('Safety Pact activated! 💜');
          if (onPactCreated) {
            onPactCreated('active');
          }
        }
      } else {
        // User 1 initiating - create pending pact
        // Check if pact already exists
        const existingQuery1 = query(
          collection(db, 'safety_pacts'),
          where('user1Id', '==', currentUser.uid),
          where('user2Id', '==', bestieId),
          limit(1)
        );
        const existingQuery2 = query(
          collection(db, 'safety_pacts'),
          where('user1Id', '==', bestieId),
          where('user2Id', '==', currentUser.uid),
          limit(1)
        );

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(existingQuery1),
          getDocs(existingQuery2)
        ]);

        if (!snapshot1.empty || !snapshot2.empty) {
          toast.error('A Safety Pact already exists with this bestie');
          return;
        }

        await addDoc(collection(db, 'safety_pacts'), {
          user1Id: currentUser.uid,
          user2Id: bestieId,
          status: 'pending',
          createdAt: Timestamp.now(),
          activatedAt: null,
          user1AcceptedAt: Timestamp.now(),
          user2AcceptedAt: null,
          lastHonoredAt: null,
          lastHonoredBy: null,
          totalCheckInsUnderPact: 0
        });

        toast.success('Invitation sent! Waiting for them to promise...');
        if (onPactCreated) {
          onPactCreated('pending');
        }
      }

      onClose();
    } catch (error) {
      console.error('Error creating/accepting pact:', error);
      toast.error('Failed to create pact. Please try again.');
    } finally {
      setPromising(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Full-screen Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-display text-gray-900 dark:text-gray-100 text-center">
              {isInvitation ? `${bestieName} wants to make a Safety Pact` : 'Make Our Safety Pact'}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {isInvitation && (
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                <p className="text-center font-semibold text-purple-900 dark:text-purple-200">
                  {bestieName} has promised. Will you?
                </p>
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-gray-100 text-center leading-relaxed">
                {PACT_TEXT(bestieName)}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={onClose}
              disabled={promising}
              className="flex-1 btn btn-secondary"
            >
              {isInvitation ? 'Decline' : 'Not Now'}
            </button>
            <button
              onClick={handlePromise}
              disabled={promising}
              className="flex-1 btn btn-primary bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {promising ? 'Processing...' : 'I Promise'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SafetyPactModal;

