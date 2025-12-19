import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, query, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../../utils/hapticFeedback';

const ChallengeLibrary = ({ isOpen, onClose, onSelect, currentUserId, userData }) => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [besties, setBesties] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadTemplates = async () => {
      try {
        const templatesQuery = query(collection(db, 'challenge_templates'));
        const snapshot = await getDocs(templatesQuery);
        const templatesData = [];
        snapshot.forEach((doc) => {
          templatesData.push({ id: doc.id, ...doc.data() });
        });
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading challenge templates:', error);
        toast.error('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    const loadBesties = async () => {
      try {
        // Get user's besties
        const bestieIds = userData?.bestieUserIds || [];
        if (bestieIds.length === 0) {
          setBesties([]);
          return;
        }

        // Load bestie user data
        const bestiePromises = bestieIds.slice(0, 20).map(async (bestieId) => {
          const bestieDoc = await getDoc(doc(db, 'users', bestieId));
          if (bestieDoc.exists()) {
            const data = bestieDoc.data();
            return {
              userId: bestieId,
              name: data.displayName || 'Bestie',
              photoURL: data.photoURL || null
            };
          }
          return null;
        });

        const bestiesData = (await Promise.all(bestiePromises)).filter(Boolean);
        setBesties(bestiesData);
      } catch (error) {
        console.error('Error loading besties:', error);
      }
    };

    loadTemplates();
    loadBesties();
  }, [isOpen, userData]);

  const handleTemplateSelect = (template) => {
    haptic.medium();
    setSelectedTemplate(template);
  };

  const handleBestieSelect = async (bestieId) => {
    if (!selectedTemplate || !currentUser) return;

    haptic.medium();

    try {
      // Create challenge invitation
      const now = Timestamp.now();
      const expiresAt = new Date(now.toMillis());
      expiresAt.setDate(expiresAt.getDate() + selectedTemplate.duration);
      const expiresAtTimestamp = Timestamp.fromDate(expiresAt);

      await addDoc(collection(db, 'bestie_challenges'), {
        challengeId: selectedTemplate.id,
        user1Id: currentUser.uid,
        user2Id: bestieId,
        status: 'invited',
        startedAt: null,
        expiresAt: expiresAtTimestamp,
        user1Progress: 0,
        user2Progress: 0,
        completedAt: null,
        target: selectedTemplate.target,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        metric: selectedTemplate.metric,
        points: selectedTemplate.points,
        badge: selectedTemplate.badge
      });

      toast.success('Challenge invitation sent!');
      onClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
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

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display text-gray-900 dark:text-gray-100">
                {selectedTemplate ? 'Choose a Bestie' : 'Choose a Challenge'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {!selectedTemplate ? (
              // Challenge Templates
              loading ? (
                <div className="text-center py-8 text-gray-400">Loading challenges...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No challenges available yet</p>
                  <p className="text-sm text-gray-500 mt-2">Check back soon for new challenges!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left card p-4 hover:border-primary transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>⏱️ {template.duration} days</span>
                            <span>🎯 {template.target} {template.metric === 'safety_checkins' ? 'check-ins' : template.metric === 'circle_checkins' ? 'check-ins' : 'messages'}</span>
                            <span>⭐ {template.points} points</span>
                            {template.badge && <span>🏆 Badge</span>}
                          </div>
                        </div>
                        <span className="text-2xl ml-4">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              // Bestie Selection
              <div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-primary hover:underline mb-4 flex items-center gap-2"
                >
                  ← Back to challenges
                </button>

                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </p>
                </div>

                {besties.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">You need besties to start a challenge!</p>
                    <p className="text-sm text-gray-500 mt-2">Add besties first to challenge them.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {besties.map((bestie) => (
                      <button
                        key={bestie.userId}
                        onClick={() => handleBestieSelect(bestie.userId)}
                        className="w-full text-left card p-3 hover:border-primary transition-all flex items-center gap-3"
                      >
                        {bestie.photoURL ? (
                          <img
                            src={bestie.photoURL}
                            alt={bestie.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                            {bestie.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {bestie.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChallengeLibrary;

