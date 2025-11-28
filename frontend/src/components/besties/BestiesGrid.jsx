import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import BestieCard from '../BestieCard';
import toast from 'react-hot-toast';

const BestiesGrid = ({ besties, activityFeed }) => {
  const navigate = useNavigate();

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
    <div>
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
            return (
              <div key={bestie.id} className="relative group">
                {/* Main card with improved styling */}
                <div className="h-full transform transition-all duration-300 hover:scale-[1.02]">
                  <BestieCard bestie={bestie} />
                </div>

                {/* Visual Indicators - Top Left */}
                {indicators.length > 0 && (
                  <div className="absolute top-3 left-3 flex gap-1 z-10">
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

                {/* Quick Action Overlay - Shows on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/95 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4 pointer-events-none group-hover:pointer-events-auto">
                  <div className="w-full space-y-2">
                    <button
                      onClick={() => navigate(`/user/${bestie.userId}`)}
                      className="w-full bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-200 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>👤</span>
                      <span>View Profile</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const bestieDoc = await getDoc(doc(db, 'besties', bestie.id));
                            if (bestieDoc.exists()) {
                              await updateDoc(doc(db, 'besties', bestie.id), {
                                isFavorite: !bestieDoc.data().isFavorite
                              });
                              toast.success(bestieDoc.data().isFavorite ? 'Removed from circle' : 'Added to circle! 💜');
                            }
                          } catch (error) {
                            console.error('Error toggling circle:', error);
                            toast.error('Failed to update');
                          }
                        }}
                        className={`flex-1 ${bestie.isFavorite ? 'bg-pink-500 hover:bg-pink-600' : 'bg-purple-500 hover:bg-purple-600'} text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg`}
                      >
                        <span>{bestie.isFavorite ? '💔' : '💜'}</span>
                        <span className="text-sm">{bestie.isFavorite ? 'Remove' : 'Add to Circle'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (bestie.phone) {
                            window.location.href = `sms:${bestie.phone}`;
                          } else {
                            toast.error('No phone number available');
                          }
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>💬</span>
                        <span className="text-sm">Message</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BestiesGrid;
