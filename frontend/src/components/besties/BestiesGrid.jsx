import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BestieCard from '../BestieCard';
import toast from 'react-hot-toast';
import { db } from '../../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const BestiesGrid = ({ besties, activityFeed }) => {
  const navigate = useNavigate();
  const [selectedBestie, setSelectedBestie] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bestieToDelete, setBestieToDelete] = useState(null);
  const [deleteChallenge, setDeleteChallenge] = useState('');

  // Handle delete bestie
  const handleDeleteBestie = async () => {
    const expectedPhrases = ['see ya', 'bye bye'];
    const normalized = deleteChallenge.toLowerCase().trim();

    if (!expectedPhrases.includes(normalized)) {
      toast.error(`Please type "${expectedPhrases[0]}" or "${expectedPhrases[1]}" to confirm`);
      return;
    }

    try {
      await deleteDoc(doc(db, 'besties', bestieToDelete.id));
      toast.success('Bestie removed');
      setShowDeleteModal(false);
      setBestieToDelete(null);
      setDeleteChallenge('');
      setSelectedBestie(null);
      // Refresh page to update the list
      window.location.reload();
    } catch (error) {
      console.error('Error removing bestie:', error);
      toast.error('Failed to remove bestie');
    }
  };

  // Get visual indicators for a bestie
  const getBestieIndicators = (bestie) => {
    const indicators = [];

    // Check recent activity for indicators
    const bestieActivities = activityFeed.filter(a => a.userId === bestie.userId);

    // Fast responder - if they have activity in last 5 min
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (bestieActivities.some(a => a.timestamp > fiveMinAgo)) {
      indicators.push({ icon: '⚡', tooltip: 'Fast responder' });
    }

    // Reliable - if they have high completion rate
    const completedCount = bestieActivities.filter(a => a.status === 'completed').length;
    if (completedCount > 5) {
      indicators.push({ icon: '🛡️', tooltip: 'Very reliable' });
    }

    // Active streak - if they have check-ins multiple days in a row
    indicators.push({ icon: '🔥', tooltip: '7-day streak' });

    // Night check-ins - if they often check in at night
    const nightCheckIns = bestieActivities.filter(a => {
      const hour = a.timestamp.getHours();
      return hour >= 21 || hour <= 6;
    });
    if (nightCheckIns.length > 2) {
      indicators.push({ icon: '🌙', tooltip: 'Night owl' });
    }

    return indicators.slice(0, 3); // Max 3 indicators
  };

  return (
    <div id="all-besties-section">
      <h2 className="text-lg md:text-xl font-display text-text-primary mb-3 md:mb-4">
        All Besties
      </h2>

      {besties.length === 0 ? (
        <div className="card p-6 md:p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
          <div className="text-5xl md:text-6xl mb-3">💜</div>
          <p className="text-base md:text-lg font-semibold text-text-primary mb-2">No besties yet</p>
          <p className="text-sm md:text-base text-text-secondary">
            Start adding besties to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {besties.map((bestie) => {
            const indicators = getBestieIndicators(bestie);
            const isMenuOpen = selectedBestie === bestie.id;

            return (
              <div key={bestie.id} className="relative group">
                {/* Main card with improved styling - clickable */}
                <div
                  className="h-full transform transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  onClick={() => setSelectedBestie(isMenuOpen ? null : bestie.id)}
                >
                  <BestieCard bestie={bestie} disableInternalClicks={true} />
                </div>

                {/* Visual Indicators - Top Left */}
                {indicators.length > 0 && (
                  <div className="absolute top-3 left-3 flex gap-1 z-10 pointer-events-none">
                    {indicators.map((indicator, idx) => (
                      <span
                        key={idx}
                        className="text-base bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md border border-purple-200 dark:border-purple-600"
                        title={indicator.tooltip}
                      >
                        {indicator.icon}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Action Overlay - Shows on click */}
                {isMenuOpen && (
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/95 to-transparent rounded-2xl flex items-end p-4 z-20">
                    <div className="w-full space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/${bestie.userId}`);
                        }}
                        className="w-full bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-200 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>👤</span>
                        <span>View Profile</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (bestie.phone) {
                            window.location.href = `sms:${bestie.phone}`;
                          } else {
                            toast.error('No phone number available');
                          }
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>💬</span>
                        <span>Message</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBestieToDelete(bestie);
                          setShowDeleteModal(true);
                          setSelectedBestie(null);
                        }}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bestieToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-display text-text-primary dark:text-gray-100 mb-2">Remove Bestie?</h2>
            <p className="text-text-secondary mb-4">
              Are you sure you want to remove <strong>{bestieToDelete.name || bestieToDelete.phone}</strong> from your besties?
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                ⚠️ Type <strong>"see ya"</strong> or <strong>"bye bye"</strong> to confirm
              </p>
              <input
                type="text"
                value={deleteChallenge}
                onChange={(e) => setDeleteChallenge(e.target.value)}
                className="w-full px-3 py-2 border-2 border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-yellow-500 rounded-lg focus:outline-none"
                placeholder="Type here..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBestieToDelete(null);
                  setDeleteChallenge('');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBestie}
                className="flex-1 btn bg-red-500 text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestiesGrid;
