import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const BadgesPage = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const { isDark } = useDarkMode();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const allBadges = [
    { id: 'safety_starter', name: 'Safety Starter', description: 'Complete 5 check-ins', icon: '🛡️', color: '#4CAF50', requirement: 5, stat: 'completedCheckIns' },
    { id: 'safety_pro', name: 'Safety Pro', description: 'Complete 25 check-ins', icon: '⭐', color: '#2196F3', requirement: 25, stat: 'completedCheckIns' },
    { id: 'safety_master', name: 'Safety Master', description: 'Complete 50 check-ins', icon: '👑', color: '#9C27B0', requirement: 50, stat: 'completedCheckIns' },
    { id: 'friend_squad', name: 'Friend Squad', description: 'Add 3 besties', icon: '👥', color: '#FF9800', requirement: 3, stat: 'totalBesties' },
    { id: 'safety_circle', name: 'Safety Circle', description: 'Add 5 besties', icon: '🤝', color: '#E91E63', requirement: 5, stat: 'totalBesties' },
    { id: 'safety_network', name: 'Safety Network', description: 'Add 10 besties', icon: '🌐', color: '#00BCD4', requirement: 10, stat: 'totalBesties' },
    { id: 'night_owl', name: 'Night Owl', description: 'Check-in after midnight', icon: '🦉', color: '#673AB7', requirement: 1, stat: 'nightOwl' },
    { id: 'early_bird', name: 'Early Bird', description: 'Check-in before 6 AM', icon: '🐦', color: '#FFC107', requirement: 1, stat: 'earlyBird' },
    { id: 'streak_master', name: 'Streak Master', description: '7 days in a row', icon: '🔥', color: '#FF5722', requirement: 7, stat: 'streak' },
    { id: 'active_donor', name: 'Active Donor', description: 'SMS subscription', icon: '💜', color: '#E91E63', requirement: 1, stat: 'donation' },
    { id: 'location_lover', name: 'Location Lover', description: '5 favorite locations', icon: '📍', color: '#8BC34A', requirement: 5, stat: 'locations' },
    { id: 'template_master', name: 'Template Master', description: '3 templates created', icon: '📋', color: '#FF9800', requirement: 3, stat: 'templates' },
  ];

  useEffect(() => {
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadBadges = async () => {
    if (!currentUser) return;
    
    try {
      const badgeDoc = await getDoc(doc(db, 'badges', currentUser.uid));
      if (badgeDoc.exists()) {
        setEarnedBadges(badgeDoc.data().badges || []);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (badge) => {
    if (!userData || !userData.stats) return 0;

    let current = 0;
    switch (badge.stat) {
      case 'completedCheckIns':
        current = userData.stats.completedCheckIns || 0;
        break;
      case 'totalBesties':
        current = userData.stats.totalBesties || 0;
        break;
      case 'streak':
        current = userData.stats.currentStreak || 0;
        break;
      case 'donation':
        current = userData.donationStats?.isActive ? 1 : 0;
        break;
      case 'locations':
        current = userData.favoriteLocations?.length || 0;
        break;
      case 'templates':
        current = userData.templateCount || 0;
        break;
      case 'nightOwl':
      case 'earlyBird':
        current = userData.stats?.[badge.stat] ? 1 : 0;
        break;
      default:
        current = 0;
    }

    return Math.min(100, (current / badge.requirement) * 100);
  };

  const getProgressText = (badge) => {
    if (!userData || !userData.stats) return '0 / ' + badge.requirement;

    let current = 0;
    switch (badge.stat) {
      case 'completedCheckIns':
        current = userData.stats.completedCheckIns || 0;
        break;
      case 'totalBesties':
        current = userData.stats.totalBesties || 0;
        break;
      case 'streak':
        current = userData.stats.currentStreak || 0;
        break;
      case 'donation':
        return userData.donationStats?.isActive ? 'Active' : 'Subscribe';
      case 'locations':
        current = userData.favoriteLocations?.length || 0;
        break;
      case 'templates':
        current = userData.templateCount || 0;
        break;
      case 'nightOwl':
      case 'earlyBird':
        return userData.stats?.[badge.stat] ? 'Unlocked!' : 'Not yet';
      default:
        current = 0;
    }

    return `${current} / ${badge.requirement}`;
  };

  if (loading) {
    return (
      <div className="p-5 max-w-7xl mx-auto">
        <div className="text-center py-15 px-5 text-xl text-gray-600 dark:text-gray-400">Loading your badges...</div>
      </div>
    );
  }

  const earned = allBadges.filter(b => earnedBadges.includes(b.id));
  const locked = allBadges.filter(b => !earnedBadges.includes(b.id));

  return (
    <div className="p-5 max-w-7xl mx-auto">
      {/* Back Button - Top */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-pink-500 dark:text-pink-400 hover:underline mb-6 font-semibold"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="text-center mb-10">
        <h1 className="text-4xl mb-2.5 text-gray-800 dark:text-gray-200">🏆 Your Badges</h1>
        <div className="text-2xl text-gray-600 dark:text-gray-400">
          <span className="text-pink-500 dark:text-pink-400 font-bold text-3xl">{earned.length}</span>
          <span className="text-gray-600 dark:text-gray-400">/ {allBadges.length}</span>
        </div>
      </div>

      {earned.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl mb-5 pl-2.5 text-gray-800 dark:text-gray-200">✨ Earned ({earned.length})</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {earned.map(badge => (
              <div
                key={badge.id}
                className="bg-white dark:bg-gray-800 border-[3px] rounded-2xl p-6 flex gap-5 items-center transition-all duration-300 shadow-lg hover:shadow-xl transform -translate-y-0.5"
                style={{
                  borderColor: badge.color,
                  background: isDark
                    ? `linear-gradient(135deg, ${badge.color}20, ${badge.color}10), rgb(31 41 55)`
                    : `linear-gradient(135deg, ${badge.color}15, ${badge.color}05)`
                }}
              >
                <div className="text-[3.5rem] flex-shrink-0 leading-none" style={{ color: badge.color }}>
                  {badge.icon}
                </div>
                <div className="flex-1">
                  <h3 className="m-0 mb-2 text-xl" style={{ color: badge.color }}>{badge.name}</h3>
                  <p className="m-0 text-gray-600 dark:text-gray-400 text-[0.95rem]">{badge.description}</p>
                  <span className="inline-block py-1.5 px-3.5 rounded-full text-white text-[0.85rem] mt-2.5 font-semibold" style={{ background: badge.color }}>
                    ✓ Earned
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl mb-5 pl-2.5 text-gray-800 dark:text-gray-200">🔒 Locked ({locked.length})</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {locked.map(badge => {
              const progress = getProgress(badge);
              const progressText = getProgressText(badge);

              return (
                <div key={badge.id} className="bg-white dark:bg-gray-800 border-[3px] border-gray-200 dark:border-gray-600 rounded-2xl p-6 flex gap-5 items-center transition-all duration-300 opacity-40 grayscale-[0.8]">
                  <div className="text-[3.5rem] flex-shrink-0 leading-none text-gray-600 dark:text-gray-400">{badge.icon}</div>
                  <div className="flex-1">
                    <h3 className="m-0 mb-2 text-xl text-gray-800 dark:text-gray-200">{badge.name}</h3>
                    <p className="m-0 text-gray-600 dark:text-gray-400 text-[0.95rem]">{badge.description}</p>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden mb-1.5">
                        <div
                          className="h-full transition-all duration-300 rounded-xl"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: badge.color
                          }}
                        />
                      </div>
                      <span className="text-[0.85rem] text-gray-600 dark:text-gray-400 font-semibold">{progressText}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Back Button - Bottom */}
      <div className="mt-12 text-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-pink-500 dark:text-pink-400 hover:underline font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>
    </div>
  );
};

export default BadgesPage;