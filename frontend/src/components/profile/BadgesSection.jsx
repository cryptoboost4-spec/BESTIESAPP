import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

// Badge definitions - maps IDs to full badge info
const BADGE_DEFINITIONS = {
  // Guardian badges
  guardian_1: { id: 'guardian_1', name: 'Helper', icon: '🛡️' },
  guardian_5: { id: 'guardian_5', name: 'Protector', icon: '🛡️✨' },
  guardian_10: { id: 'guardian_10', name: 'Guardian', icon: '🛡️⭐' },
  guardian_25: { id: 'guardian_25', name: 'Guardian Angel', icon: '👼' },
  guardian_50: { id: 'guardian_50', name: 'Safety Queen', icon: '👑' },
  // Bestie badges
  besties_5: { id: 'besties_5', name: 'Friend Circle', icon: '💜' },
  besties_10: { id: 'besties_10', name: 'Squad Goals', icon: '💜✨' },
  besties_20: { id: 'besties_20', name: 'Community Leader', icon: '💜⭐' },
  friend_squad: { id: 'friend_squad', name: 'Friend Squad', icon: '👥' },
  safety_circle: { id: 'safety_circle', name: 'Safety Circle', icon: '🤝' },
  safety_network: { id: 'safety_network', name: 'Safety Network', icon: '🌐' },
  // Subscriber badge
  subscriber_active: { id: 'subscriber_active', name: 'SMS Supporter', icon: '⭐💝' },
  // Donor badges
  donor_10: { id: 'donor_10', name: 'Donor', icon: '💝' },
  donor_25: { id: 'donor_25', name: 'Champion', icon: '💝✨' },
  donor_50: { id: 'donor_50', name: 'Hero', icon: '💝⭐' },
  donor_100: { id: 'donor_100', name: 'Legend', icon: '👑💝' },
  // Check-in badges
  checkin_10: { id: 'checkin_10', name: 'Safety First', icon: '✅' },
  checkin_50: { id: 'checkin_50', name: 'Safety Pro', icon: '✅⭐' },
  checkin_100: { id: 'checkin_100', name: 'Safety Master', icon: '👑✅' },
  // Additional badges from BadgesPage
  safety_starter: { id: 'safety_starter', name: 'Safety Starter', icon: '🛡️' },
  safety_pro: { id: 'safety_pro', name: 'Safety Pro', icon: '⭐' },
  safety_master: { id: 'safety_master', name: 'Safety Master', icon: '👑' },
  night_owl: { id: 'night_owl', name: 'Night Owl', icon: '🦉' },
  early_bird: { id: 'early_bird', name: 'Early Bird', icon: '🐦' },
  streak_master: { id: 'streak_master', name: 'Streak Master', icon: '🔥' },
  active_donor: { id: 'active_donor', name: 'Active Donor', icon: '💜' },
  location_lover: { id: 'location_lover', name: 'Location Lover', icon: '📍' },
  template_master: { id: 'template_master', name: 'Template Master', icon: '📋' },
};

const BadgesSection = ({
  currentUser,
  badges,
  featuredBadgeIds,
  setFeaturedBadgeIds,
  setConfettiTrigger
}) => {
  const navigate = useNavigate();
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);

  // Convert badge IDs (strings) to full badge objects
  const badgeObjects = (badges || []).map(badge => {
    // If it's already an object with id, use it directly
    if (typeof badge === 'object' && badge.id) {
      return badge;
    }
    // If it's a string ID, look up the full badge info
    const badgeId = typeof badge === 'string' ? badge : badge?.id;
    return BADGE_DEFINITIONS[badgeId] || { id: badgeId, name: badgeId, icon: '🏆' };
  });

  const featuredBadges = badgeObjects.filter(b => featuredBadgeIds.includes(b.id));
  const otherBadges = badgeObjects.filter(b => !featuredBadgeIds.includes(b.id));
  const allBadgesToShow = [...featuredBadges, ...otherBadges];

  const handleToggleFeaturedBadge = async (badgeId) => {
    let newFeaturedBadges = [...featuredBadgeIds];

    if (newFeaturedBadges.includes(badgeId)) {
      newFeaturedBadges = newFeaturedBadges.filter(id => id !== badgeId);
    } else {
      if (newFeaturedBadges.length >= 3) {
        toast.error('You can only feature up to 3 badges');
        return;
      }
      newFeaturedBadges.push(badgeId);
      setConfettiTrigger(true);
      setTimeout(() => setConfettiTrigger(false), 100);
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        featuredBadges: newFeaturedBadges,
      });
      setFeaturedBadgeIds(newFeaturedBadges);
      toast.success('Featured badges updated!');
    } catch (error) {
      console.error('Error updating featured badges:', error);
      toast.error('Failed to update badges');
    }
  };

  return (
    <>
      <div className="mb-6 relative">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-display text-gray-800 dark:text-gray-200">Your Badges</h2>
          <button
            onClick={() => navigate('/badges')}
            className="text-primary font-semibold hover:underline text-sm"
          >
            View All →
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          {featuredBadgeIds.length > 0
            ? `⭐ ${featuredBadgeIds.length} featured badge${featuredBadgeIds.length > 1 ? 's' : ''} shown first • `
            : ''}
          <button
            onClick={() => setShowBadgeSelector(true)}
            className="text-primary hover:underline"
          >
            Choose your top 3 to feature
          </button>
        </p>

        {allBadgesToShow.length > 0 ? (
          <>
            {/* Featured Badges - Single full-width card with up to 3 badges */}
            {featuredBadges.length > 0 && (
              <div className="mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-lg">
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-3 text-center font-semibold">⭐ Featured Badges</div>
                  <div className="flex justify-center items-center gap-6">
                    {featuredBadges.slice(0, 3).map((badge) => (
                      <div
                        key={badge.id}
                        className="text-center flex-shrink-0"
                      >
                        <div className="text-4xl mb-1">{badge.icon}</div>
                        <div className="font-semibold text-xs text-gray-800 dark:text-gray-200">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Badges - Scrollable horizontal list if many */}
            {otherBadges.length > 0 && (
              <div>
                {otherBadges.length > 6 ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Scroll to see all badges →</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {otherBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className="p-4 rounded-2xl text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700 flex-shrink-0 w-32 shadow-md pointer-events-none select-none"
                        >
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{badge.name}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {otherBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="p-4 rounded-2xl text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700 shadow-md pointer-events-none select-none"
                      >
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-md text-center">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-gray-800 dark:text-gray-200 font-semibold mb-2">
              Start earning badges!
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Complete check-ins, invite friends, and stay safe to unlock achievements
            </p>
            <button
              onClick={() => navigate('/badges')}
              className="btn btn-primary text-sm"
            >
              See All Available Badges
            </button>
          </div>
        )}
      </div>

      {/* Badge Selector Modal */}
      {showBadgeSelector && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display text-gray-800 dark:text-gray-200">Choose Featured Badges</h2>
              <button
                onClick={() => setShowBadgeSelector(false)}
                className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-xl font-bold transition-colors"
                title="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select up to 3 badges to showcase on your profile ({featuredBadgeIds.length}/3 selected)
            </p>

            {badgeObjects.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {badgeObjects.map((badge) => {
                  const isSelected = featuredBadgeIds.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => handleToggleFeaturedBadge(badge.id)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-primary shadow-lg scale-105'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                      }`}
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <div className="font-semibold text-xs text-gray-800 dark:text-gray-200">{badge.name}</div>
                      {isSelected && <div className="text-xs text-primary mt-1">✓ Featured</div>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🏆</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">No badges yet! Complete tasks to earn them.</p>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/badges')}
                className="btn btn-primary"
              >
                See How to Earn Badges →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Hide scrollbar for horizontal badge scroll */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari, Opera */
        }
      `}</style>
    </>
  );
};

export default BadgesSection;
