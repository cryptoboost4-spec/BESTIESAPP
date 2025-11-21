import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

const BestieCircleStatus = ({ userId }) => {
  const navigate = useNavigate();
  const [circleBesties, setCircleBesties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircleBesties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadCircleBesties = async () => {
    if (!userId) return;

    try {
      // Get user's featured circle
      const userDoc = await getDoc(doc(db, 'users', userId));
      const featuredIds = userDoc.exists() ? (userDoc.data().featuredCircle || []) : [];

      if (featuredIds.length === 0) {
        setCircleBesties([]);
        setLoading(false);
        return;
      }

      // Load each bestie's data and status
      const bestiesData = [];
      for (const bestieId of featuredIds) {
        const bestieDoc = await getDoc(doc(db, 'users', bestieId));
        if (!bestieDoc.exists()) continue;

        const bestieData = bestieDoc.data();

        // Check if this bestie has an active check-in
        let hasActiveCheckIn = false;
        const checkInVisibility = bestieData.privacySettings?.checkInVisibility || 'all_besties';

        // Determine if we can see their active check-in
        if (checkInVisibility === 'all_besties') {
          // Can see if they have any active check-ins
          const activeCheckInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', bestieId),
            where('status', 'in', ['active', 'alerted'])
          );
          const activeCheckIns = await getDocs(activeCheckInsQuery);
          hasActiveCheckIn = !activeCheckIns.empty;
        } else if (checkInVisibility === 'circle') {
          // Can see only if we're in their featured circle
          const theirFeaturedCircle = bestieData.featuredCircle || [];
          if (theirFeaturedCircle.includes(userId)) {
            const activeCheckInsQuery = query(
              collection(db, 'checkins'),
              where('userId', '==', bestieId),
              where('status', 'in', ['active', 'alerted'])
            );
            const activeCheckIns = await getDocs(activeCheckInsQuery);
            hasActiveCheckIn = !activeCheckIns.empty;
          }
        }
        // If checkInVisibility is 'alerts_only', we don't show active status

        bestiesData.push({
          id: bestieId,
          name: bestieData.displayName || 'Bestie',
          photoURL: bestieData.photoURL || null,
          requestAttention: bestieData.requestAttention || null,
          hasActiveCheckIn: hasActiveCheckIn,
        });
      }

      setCircleBesties(bestiesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading bestie circle:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-center py-4">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (circleBesties.length === 0) {
    return (
      <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-100 dark:border-purple-700">
        <div className="text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="font-display text-xl text-gradient mb-2">
            Build Your Safety Circle
          </h3>
          <p className="text-text-secondary mb-4">
            Add up to 5 besties to your featured circle to see their status at a glance
          </p>
          <button
            onClick={() => navigate('/besties')}
            className="btn btn-primary"
          >
            Add Besties
          </button>
        </div>
      </div>
    );
  }

  const getStatusIndicator = (bestie) => {
    // Priority: Request Attention > Active Check-in > Safe
    if (bestie.requestAttention?.active) {
      return {
        color: 'bg-purple-500',
        icon: '💜',
        label: 'Needs support',
        ringColor: 'ring-purple-400'
      };
    } else if (bestie.hasActiveCheckIn) {
      return {
        color: 'bg-yellow-500',
        icon: '🟡',
        label: 'Active check-in',
        ringColor: 'ring-yellow-400'
      };
    } else {
      return {
        color: 'bg-green-500',
        icon: '🟢',
        label: 'Safe',
        ringColor: 'ring-green-400'
      };
    }
  };

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 border-2 border-purple-100 dark:border-purple-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-gradient">Your Bestie Circle</h3>
        <button
          onClick={() => navigate('/besties')}
          className="text-primary font-semibold hover:underline text-sm"
        >
          Manage →
        </button>
      </div>

      {/* Bestie Grid */}
      <div className="grid grid-cols-5 gap-3">
        {circleBesties.map((bestie, index) => {
          const status = getStatusIndicator(bestie);
          return (
            <button
              key={bestie.id}
              onClick={() => navigate(`/user/${bestie.id}`)}
              className="flex flex-col items-center gap-2 group"
            >
              {/* Profile Picture with Status Ring */}
              <div className={`relative w-14 h-14 rounded-full ${status.ringColor} ring-4 ring-opacity-50 transition-all group-hover:ring-opacity-100 group-hover:scale-105`}>
                {bestie.photoURL ? (
                  <img
                    src={bestie.photoURL}
                    alt={bestie.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-lg">
                    {bestie.name[0]?.toUpperCase() || '?'}
                  </div>
                )}

                {/* Status Indicator Badge */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${status.color} rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs`}>
                  {status.icon === '💜' && <span className="text-xs">💜</span>}
                  {status.icon === '🟡' && <span className="text-xs">⚠</span>}
                </div>
              </div>

              {/* Name - truncated */}
              <div className="text-xs font-semibold text-text-primary text-center truncate w-full">
                {bestie.name.split(' ')[0]}
              </div>
            </button>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 5 - circleBesties.length) }).map((_, index) => (
          <button
            key={`empty-${index}`}
            onClick={() => navigate('/besties')}
            className="flex flex-col items-center gap-2 opacity-40 hover:opacity-60 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-2xl text-gray-400">
              +
            </div>
            <div className="text-xs font-semibold text-gray-400">
              Add
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Safe</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Active</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Support</span>
        </div>
      </div>
    </div>
  );
};

export default BestieCircleStatus;
