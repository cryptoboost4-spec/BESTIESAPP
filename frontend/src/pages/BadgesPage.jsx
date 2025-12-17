import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const BadgesPage = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const allBadges = [
    { id: 'checkin_5', name: 'Safety Starter', description: 'Complete 5 check-ins', icon: '🛡️', image: '/badges/safety_starter.png', color: '#4CAF50', requirement: 5, stat: 'completedCheckIns' },
    { id: 'checkin_25', name: 'Safety Pro', description: 'Complete 25 check-ins', icon: '⭐', image: '/badges/safety_pro.png', color: '#2196F3', requirement: 25, stat: 'completedCheckIns' },
    { id: 'checkin_100', name: 'Safety Master', description: 'Complete 100 check-ins', icon: '👑✅', image: '/badges/safety_master.png', color: '#673AB7', requirement: 100, stat: 'completedCheckIns' },
    { id: 'besties_3', name: 'Friend Squad', description: 'Add 3 besties', icon: '💜', image: '/badges/friend_squad.png', color: '#FF9800', requirement: 3, stat: 'totalBesties' },
    { id: 'besties_5', name: 'Safety Circle', description: 'Add 5 besties', icon: '💜', image: '/badges/safety_circle.png', color: '#E91E63', requirement: 5, stat: 'totalBesties' },
    { id: 'besties_10', name: 'Safety Network', description: 'Add 10 besties', icon: '💜✨', image: '/badges/safety_network.png', color: '#9C27B0', requirement: 10, stat: 'totalBesties' },
    { id: 'streak_7', name: 'Streak Master', description: '7 days in a row', icon: '🔥', image: '/badges/streak_master.png', color: '#FF5722', requirement: 7, stat: 'streak' },
    { id: 'early_bird', name: 'Early Bird', description: 'Check-in before 6 AM', icon: '🐦', image: '/badges/early_bird.png', color: '#FFC107', requirement: 1, stat: 'earlyBird' },
    { id: 'night_owl', name: 'Night Owl', description: 'Check-in after 10 PM', icon: '🦉', image: '/badges/night_owl.png', color: '#673AB7', requirement: 1, stat: 'nightOwl' },
    { id: 'active_donor', name: 'Active Donor', description: 'Active monthly donor', icon: '💜', image: '/badges/active_donor.png', color: '#E91E63', requirement: 1, stat: 'donation' },
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

  // Check if badge is earned - handle both string format (legacy) and object format (new)
  const isBadgeEarned = (badgeId) => {
    return earnedBadges.some(b =>
      (typeof b === 'string' && b === badgeId) ||
      (typeof b === 'object' && b.id === badgeId)
    );
  };

  const earned = allBadges.filter(b => isBadgeEarned(b.id));
  const locked = allBadges.filter(b => !isBadgeEarned(b.id));

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
        <div className="mb-20">
          <h2 className="text-3xl mb-12 text-center font-display text-gray-800 dark:text-gray-200">✨ Earned Badges</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {earned.map(badge => (
              <div
                key={badge.id}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-6 transition-transform duration-300 transform group-hover:scale-105">
                  {badge.image ? (
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-xl filter"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-[6rem] shadow-inner">
                      {badge.icon}
                    </div>
                  )}

                </div>

                <div className="max-w-[240px]">
                  {/* Name hidden as requested since it's in the image, but kept for accessibility if image fails or for screen readers */}
                  <span className="sr-only">{badge.name}</span>
                  {!badge.image && <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{badge.name}</h3>}

                  <p className="text-lg text-gray-700 dark:text-gray-300 font-medium leading-normal mt-2">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div className="mb-16">
          <h2 className="text-3xl mb-12 text-center font-display text-gray-600 dark:text-gray-400 opacity-90">🔒 Locked Badges</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {locked.map(badge => {
              const progress = getProgress(badge);
              const progressText = getProgressText(badge);

              return (
                <div key={badge.id} className="flex flex-col items-center text-center opacity-50 hover:opacity-100 transition-all duration-300 group">
                  <div className="relative mb-6 grayscale group-hover:grayscale-0 transition-all duration-300">
                    {badge.image ? (
                      <img
                        src={badge.image}
                        alt={badge.name}
                        className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-[5rem]">
                        {badge.icon}
                      </div>
                    )}
                  </div>

                  <div className="max-w-[240px]">
                    <span className="sr-only">{badge.name}</span>
                    {!badge.image && <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{badge.name}</h3>}

                    <p className="text-base text-gray-600 dark:text-gray-400 mb-4">{badge.description}</p>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner mb-2">
                      <div
                        className="h-full transition-all duration-500 ease-out rounded-full"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: badge.color
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 block">{progressText}</span>
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