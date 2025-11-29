import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BestieCard from '../BestieCard';
import toast from 'react-hot-toast';
import { db } from '../../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const BestiesGrid = ({ besties, activityFeed, featuredCircle = [] }) => {
  const navigate = useNavigate();
  const [selectedBestie, setSelectedBestie] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bestieToDelete, setBestieToDelete] = useState(null);
  const [deleteChallenge, setDeleteChallenge] = useState('');
  const [showLegend, setShowLegend] = useState(false);

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

  // Memoize indicators map to avoid recalculating on every render
  const indicatorsMap = useMemo(() => {
    const map = new Map();
    if (!activityFeed || activityFeed.length === 0) return map;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    besties.forEach(bestie => {
      const indicators = [];
      const bestieActivities = activityFeed.filter(a => a.userId === bestie.userId);

      // Fast responder - responded to an alert in last hour
      const hasRecentResponse = bestieActivities.some(a => 
        a.type === 'checkin' && a.timestamp > oneHourAgo
      );
      if (hasRecentResponse) {
        indicators.push({ icon: '⚡', tooltip: 'Active recently' });
      }

      // Reliable - has completed 5+ check-ins visible in feed
      const completedCount = bestieActivities.filter(a => 
        a.type === 'checkin' && a.status === 'completed'
      ).length;
      if (completedCount >= 5) {
        indicators.push({ icon: '🛡️', tooltip: 'Very reliable' });
      }

      // Night owl - has 3+ night check-ins (9pm-6am)
      const nightCheckIns = bestieActivities.filter(a => {
        if (a.type !== 'checkin' || !a.timestamp) return false;
        const hour = a.timestamp.getHours?.() ?? new Date(a.timestamp).getHours();
        return hour >= 21 || hour <= 6;
      });
      if (nightCheckIns.length >= 3) {
        indicators.push({ icon: '🌙', tooltip: 'Night owl' });
      }

      map.set(bestie.id, indicators.slice(0, 3));
    });

    return map;
  }, [besties, activityFeed]);

  // Get visual indicators for a bestie (now just a lookup)
  const getBestieIndicators = (bestie) => {
    return indicatorsMap.get(bestie.id) || [];
  };

  return (
    <div id="all-besties-section">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-display text-text-primary">
          All Besties
        </h2>
        
        {/* Legend Button */}
        <div className="relative">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-semibold hover:bg-pink-200 dark:hover:bg-pink-800/40 transition-colors"
          >
            <span>ℹ️</span>
            <span>Symbols</span>
          </button>
          
          {/* Legend Tooltip */}
          {showLegend && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLegend(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 rounded-xl p-4 shadow-xl border border-pink-200 dark:border-pink-800 min-w-[200px]">
                <h4 className="font-semibold text-sm text-pink-600 dark:text-pink-400 mb-3">Symbol Guide 💕</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-gray-700 dark:text-gray-300">Fast responder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <span className="text-gray-700 dark:text-gray-300">Very reliable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span className="text-gray-700 dark:text-gray-300">On a streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌙</span>
                    <span className="text-gray-700 dark:text-gray-300">Night owl</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💕</span>
                    <span className="text-gray-700 dark:text-gray-300">Mutual bestie</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
                  <BestieCard
                featuredCircle={featuredCircle} bestie={bestie} />
                  
                  {/* Visual Indicators - Bottom Center */}
                  {indicators.length > 0 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
                      {indicators.map((indicator, idx) => (
                        <span
                          key={idx}
                          className="text-sm bg-white/90 dark:bg-gray-800/90 rounded-full px-2 py-1 shadow-md border border-purple-200 dark:border-purple-600"
                          title={indicator.tooltip}
                        >
                          {indicator.icon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

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
