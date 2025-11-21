import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import BestieCircleShareModal from './BestieCircleShareModal';
import ProfileWithBubble from './ProfileWithBubble';
import {
  calculateConnectionStrength,
  getConnectionColor,
  getConnectionEmoji,
  formatTimeAgo,
  getLastInteraction,
} from '../services/connectionStrength';

const LivingCircle = ({ userId, onAddClick }) => {
  const navigate = useNavigate();
  const [allBesties, setAllBesties] = useState([]);
  const [circleBesties, setCircleBesties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [connectionStrengths, setConnectionStrengths] = useState({});
  const [lastSeen, setLastSeen] = useState({});
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showCircleCheck, setShowCircleCheck] = useState(false);

  const loadBesties = async () => {
    if (!userId) return;

    try {
      // Get all accepted besties
      const [requesterQuery, recipientQuery] = await Promise.all([
        getDocs(
          query(
            collection(db, 'besties'),
            where('requesterId', '==', userId),
            where('status', '==', 'accepted')
          )
        ),
        getDocs(
          query(
            collection(db, 'besties'),
            where('recipientId', '==', userId),
            where('status', '==', 'accepted')
          )
        ),
      ]);

      const bestiesList = [];

      for (const docSnap of requesterQuery.docs) {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', data.recipientId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Check for active check-ins
        const checkInVisibility = userData.privacySettings?.checkInVisibility || 'all_besties';
        let hasActiveCheckIn = false;

        if (checkInVisibility === 'all_besties') {
          const activeCheckInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', data.recipientId),
            where('status', 'in', ['active', 'alerted'])
          );
          const activeCheckIns = await getDocs(activeCheckInsQuery);
          hasActiveCheckIn = !activeCheckIns.empty;
        } else if (checkInVisibility === 'circle') {
          const theirFeaturedCircle = userData.featuredCircle || [];
          if (theirFeaturedCircle.includes(userId)) {
            const activeCheckInsQuery = query(
              collection(db, 'checkins'),
              where('userId', '==', data.recipientId),
              where('status', 'in', ['active', 'alerted'])
            );
            const activeCheckIns = await getDocs(activeCheckInsQuery);
            hasActiveCheckIn = !activeCheckIns.empty;
          }
        }

        bestiesList.push({
          id: data.recipientId,
          name: userData.displayName || 'Bestie',
          photoURL: userData.photoURL || null,
          requestAttention: userData.requestAttention || null,
          hasActiveCheckIn: hasActiveCheckIn,
        });
      }

      for (const docSnap of recipientQuery.docs) {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', data.requesterId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Check for active check-ins
        const checkInVisibility = userData.privacySettings?.checkInVisibility || 'all_besties';
        let hasActiveCheckIn = false;

        if (checkInVisibility === 'all_besties') {
          const activeCheckInsQuery = query(
            collection(db, 'checkins'),
            where('userId', '==', data.requesterId),
            where('status', 'in', ['active', 'alerted'])
          );
          const activeCheckIns = await getDocs(activeCheckInsQuery);
          hasActiveCheckIn = !activeCheckIns.empty;
        } else if (checkInVisibility === 'circle') {
          const theirFeaturedCircle = userData.featuredCircle || [];
          if (theirFeaturedCircle.includes(userId)) {
            const activeCheckInsQuery = query(
              collection(db, 'checkins'),
              where('userId', '==', data.requesterId),
              where('status', 'in', ['active', 'alerted'])
            );
            const activeCheckIns = await getDocs(activeCheckInsQuery);
            hasActiveCheckIn = !activeCheckIns.empty;
          }
        }

        bestiesList.push({
          id: data.requesterId,
          name: userData.displayName || 'Bestie',
          photoURL: userData.photoURL || null,
          requestAttention: userData.requestAttention || null,
          hasActiveCheckIn: hasActiveCheckIn,
        });
      }

      setAllBesties(bestiesList);

      // Get user's featured circle
      const userDoc = await getDoc(doc(db, 'users', userId));
      const featuredIds = userDoc.exists() ? (userDoc.data().featuredCircle || []) : [];

      // Map featured IDs to bestie objects
      const featured = featuredIds
        .map(id => bestiesList.find(b => b.id === id))
        .filter(Boolean);

      // If less than what user has, auto-fill with first few besties
      const needsAutoFill = featured.length < bestiesList.length && featured.length < 5;
      if (needsAutoFill) {
        const remaining = bestiesList.filter(b => !featuredIds.includes(b.id));
        featured.push(...remaining.slice(0, 5 - featured.length));
      }

      const finalCircle = featured.slice(0, 5);
      setCircleBesties(finalCircle);

      // CRITICAL: Save auto-filled circle to Firestore
      if (needsAutoFill && finalCircle.length > 0) {
        await saveFeaturedCircle(finalCircle);
      }

      setLoading(false);

      // Load connection strengths and last seen
      loadConnectionData(finalCircle);
    } catch (error) {
      console.error('Error loading besties:', error);
      setLoading(false);
    }
  };

  const loadConnectionData = async (besties) => {
    setLoadingConnections(true);
    const strengths = {};
    const lastSeenData = {};

    for (const bestie of besties) {
      try {
        // Calculate connection strength
        const strength = await calculateConnectionStrength(userId, bestie.id);
        strengths[bestie.id] = strength;

        // Get last interaction
        const lastInteraction = await getLastInteraction(userId, bestie.id);
        lastSeenData[bestie.id] = lastInteraction;
      } catch (error) {
        console.error(`Error loading connection data for ${bestie.id}:`, error);
      }
    }

    setConnectionStrengths(strengths);
    setLastSeen(lastSeenData);
    setLoadingConnections(false);
  };

  useEffect(() => {
    loadBesties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveFeaturedCircle = async (newCircle) => {
    const featuredIds = newCircle.map(b => b.id);
    await updateDoc(doc(db, 'users', userId), {
      featuredCircle: featuredIds,
    });
  };

  const handleRemoveFromCircle = async (index) => {
    // Only allow removal if circle is full (5 members)
    if (circleBesties.length < 5) {
      toast.error('Circle must be full to remove members. Use Replace instead.');
      setSelectedSlot(null);
      return;
    }

    const newCircle = circleBesties.filter((_, i) => i !== index);
    setCircleBesties(newCircle);
    await saveFeaturedCircle(newCircle);
    setSelectedSlot(null);
    toast.success('Removed from circle');
  };

  const handleReplaceBestie = async (newBestie) => {
    const newCircle = [...circleBesties];
    newCircle[selectedSlot] = newBestie;
    setCircleBesties(newCircle);
    await saveFeaturedCircle(newCircle);
    setShowReplaceModal(false);
    setSelectedSlot(null);
    toast.success('Bestie replaced');

    // Reload connection data for new bestie
    loadConnectionData(newCircle);
  };

  const handleViewProfile = (bestieId) => {
    navigate(`/user/${bestieId}`);
    setSelectedSlot(null);
  };

  const handleCircleCheck = async () => {
    // Track interaction
    try {
      const now = Timestamp.now();
      for (const bestie of circleBesties) {
        await addDoc(collection(db, 'interactions'), {
          userId: userId,
          bestieId: bestie.id,
          type: 'circle_check',
          checkInId: null,
          alertId: null,
          metadata: {},
          createdAt: now,
        });
      }

      toast.success('Circle checked! 💚');
      setShowCircleCheck(false);

      // Reload to show updated data
      loadConnectionData(circleBesties);
    } catch (error) {
      console.error('Error tracking circle check:', error);
    }
  };

  const getStatusInfo = (bestie) => {
    // Priority: Request Attention > Active Check-in > Safe
    if (bestie.requestAttention?.active) {
      return {
        color: 'bg-purple-500',
        ringColor: 'ring-purple-400',
        glowColor: '#a855f7',
        label: 'Needs support',
        emoji: '💜',
      };
    } else if (bestie.hasActiveCheckIn) {
      return {
        color: 'bg-yellow-500',
        ringColor: 'ring-yellow-400',
        glowColor: '#f59e0b',
        label: 'Active check-in',
        emoji: '⏰',
      };
    } else {
      return {
        color: 'bg-green-500',
        ringColor: 'ring-green-400',
        glowColor: '#10b981',
        label: 'Safe',
        emoji: '✓',
      };
    }
  };

  const slots = Array.from({ length: 5 }, (_, i) => circleBesties[i] || null);

  // Different colors for each bestie slot
  const slotColors = [
    'bg-pink-500',      // Slot 0 - Pink
    'bg-purple-500',    // Slot 1 - Purple
    'bg-blue-500',      // Slot 2 - Blue
    'bg-green-500',     // Slot 3 - Green
    'bg-orange-500',    // Slot 4 - Orange
  ];

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="card p-6 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-100 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30 animate-gradient-shift pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl md:text-2xl font-display text-gradient">Your Living Circle</h3>
          {circleBesties.length > 0 && (
            <button
              onClick={() => setShowCircleCheck(true)}
              className="btn btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              <span>Check Circle</span>
              <span className="text-lg">🌅</span>
            </button>
          )}
        </div>

        {/* Circle Container - Responsive sizing */}
        <div className="relative w-full max-w-md mx-auto aspect-square mb-6">
          <div className="absolute inset-0">
            {/* Connection Lines with Dynamic Strength */}
            {slots.map((bestie, index) => {
              if (!bestie) return null;
              const angle = (index * 72 - 90) * (Math.PI / 180);
              const radius = 45; // Percentage-based radius
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);

              const connectionStrength = connectionStrengths[bestie.id];
              const strengthScore = connectionStrength?.total || 0;
              const connectionColor = getConnectionColor(strengthScore);

              // Line opacity and animation based on strength
              const opacity = 0.2 + (strengthScore / 100) * 0.6;
              const strokeWidth = 1 + (strengthScore / 100) * 2;

              return (
                <svg
                  key={`line-${index}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 0 }}
                >
                  <defs>
                    <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={connectionColor} stopOpacity={opacity} />
                      <stop offset="50%" stopColor={connectionColor} stopOpacity={opacity * 1.5} />
                      <stop offset="100%" stopColor={connectionColor} stopOpacity={opacity} />
                    </linearGradient>
                    <filter id={`glow-${index}`}>
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`${x}%`}
                    y2={`${y}%`}
                    stroke={`url(#gradient-${index})`}
                    strokeWidth={strokeWidth}
                    strokeDasharray="4 2"
                    filter={`url(#glow-${index})`}
                    className="animate-pulse-connection"
                  />

                  {/* Particle effect for strong connections */}
                  {strengthScore >= 70 && (
                    <circle
                      cx="50%"
                      cy="50%"
                      r="3"
                      fill={connectionColor}
                      opacity={opacity * 2}
                      className="animate-particle"
                      style={{
                        '--target-x': `${x}%`,
                        '--target-y': `${y}%`,
                        animationDelay: `${index * 0.5}s`,
                      }}
                    />
                  )}
                </svg>
              );
            })}

            {/* Center Circle (YOU) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm md:text-base font-display shadow-2xl border-4 border-white ring-4 ring-purple-200 animate-breathe">
                YOU
              </div>
            </div>

            {/* Bestie Slots - all equidistant from center */}
            {slots.map((bestie, index) => {
              const angle = (index * 72 - 90) * (Math.PI / 180);
              const radius = 45; // Percentage-based for better responsiveness
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);

              const status = bestie ? getStatusInfo(bestie) : null;
              const connectionStrength = bestie ? connectionStrengths[bestie.id] : null;
              const lastSeenTime = bestie ? lastSeen[bestie.id] : null;

              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {bestie ? (
                    <div className="relative group">
                      {/* Bestie Circle - clickable with status ring */}
                      <button
                        onClick={() => setSelectedSlot(selectedSlot === index ? null : index)}
                        className="relative hover:scale-110 transition-all duration-300"
                      >
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl border-4 border-white hover:shadow-2xl ${status.ringColor} ring-4 hover:ring-6 overflow-hidden flex items-center justify-center relative animate-breathe-subtle`}
                          style={{ animationDelay: `${index * 0.3}s` }}
                        >
                          <ProfileWithBubble
                            photoURL={bestie.photoURL}
                            name={bestie.name || 'Bestie'}
                            requestAttention={bestie.requestAttention}
                            size="xl"
                            showBubble={true}
                            className="w-full h-full"
                          />

                          {/* Status Badge */}
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${status.color} rounded-full border-2 border-white flex items-center justify-center text-xs shadow-lg animate-pulse-gentle`}>
                            {status.emoji}
                          </div>
                        </div>
                      </button>

                      {/* Enhanced Tooltip with Connection Strength */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 transform group-hover:-translate-y-1">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xl">
                          <div className="font-bold mb-1">{bestie.name || 'Unknown'}</div>
                          {connectionStrength && !loadingConnections && (
                            <div className="flex items-center gap-2 text-white/90">
                              <span>{getConnectionEmoji(connectionStrength.total)}</span>
                              <span>{connectionStrength.total}/100</span>
                              <span className="text-white/70">•</span>
                              <span className="capitalize">{connectionStrength.level}</span>
                            </div>
                          )}
                          {lastSeenTime && (
                            <div className="text-white/70 text-xs mt-1">
                              Last: {formatTimeAgo(lastSeenTime)}
                            </div>
                          )}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-pink-600"></div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      {selectedSlot === index && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 z-[200] w-40">
                          <button
                            onClick={() => handleViewProfile(bestie.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
                          >
                            👤 View Profile
                          </button>
                          <button
                            onClick={() => setShowReplaceModal(true)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm font-semibold text-gray-700"
                          >
                            🔄 Replace
                          </button>
                          <button
                            onClick={() => handleRemoveFromCircle(index)}
                            className="w-full text-left px-3 py-2 hover:bg-red-50 rounded text-sm font-semibold text-red-600"
                          >
                            ❌ Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className={`w-14 h-14 md:w-16 md:h-16 border-4 border-dashed ${slotColors[index].replace('bg-', 'border-')} rounded-full flex items-center justify-center ${slotColors[index].replace('bg-', 'text-')} text-2xl md:text-3xl font-bold hover:scale-110 hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl animate-pulse-slow`}
                      title="Invite a bestie to your circle"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info - Enhanced */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border-2 border-purple-200 mb-2">
            <span className="text-2xl">⭐</span>
            <span className="font-display text-base md:text-lg text-gradient font-bold">
              {circleBesties.length}/5 Circle Members
            </span>
          </div>
          <div className="text-xs md:text-sm text-gray-600 mt-2">
            {circleBesties.length === 5
              ? "Your circle is complete! 🎉"
              : circleBesties.length === 0
              ? "Start building your safety network"
              : `Add ${5 - circleBesties.length} more to complete your circle`}
          </div>

          {circleBesties.length > 0 && !loadingConnections && (
            <button
              onClick={() => navigate('/circle-health')}
              className="mt-3 text-primary font-semibold text-sm hover:underline flex items-center gap-2 mx-auto"
            >
              View Circle Health Dashboard →
            </button>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        .animate-breathe-subtle {
          animation: breathe 5s ease-in-out infinite;
        }
        @keyframes pulse-gentle {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        @keyframes pulse-connection {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-pulse-connection {
          animation: pulse-connection 3s ease-in-out infinite;
        }
        @keyframes particle {
          0% {
            cx: 50%;
            cy: 50%;
            opacity: 1;
          }
          100% {
            cx: var(--target-x);
            cy: var(--target-y);
            opacity: 0;
          }
        }
        .animate-particle {
          animation: particle 3s linear infinite;
        }
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-shift {
          background: linear-gradient(120deg, #fdf2f8, #fce7f3, #fff7ed, #fef3c7);
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
      `}</style>

      {/* Replace Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReplaceModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-display mb-4">Replace with:</h3>
            <div className="space-y-2">
              {allBesties
                .filter(b => !circleBesties.find(cb => cb.id === b.id))
                .map(bestie => (
                  <button
                    key={bestie.id}
                    onClick={() => handleReplaceBestie(bestie)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ProfileWithBubble
                      photoURL={bestie.photoURL}
                      name={bestie.name || 'Unknown'}
                      requestAttention={bestie.requestAttention}
                      size="md"
                      showBubble={true}
                    />
                    <div className="text-left">
                      <div className="font-semibold">{bestie.name || 'Unknown'}</div>
                    </div>
                  </button>
                ))}
              {allBesties.filter(b => !circleBesties.find(cb => cb.id === b.id)).length === 0 && (
                <p className="text-center text-gray-500 py-4">All besties are in your circle!</p>
              )}
            </div>
            <button
              onClick={() => setShowReplaceModal(false)}
              className="mt-4 w-full btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bestie Circle Share Modal */}
      {showShareModal && (
        <BestieCircleShareModal
          onClose={() => setShowShareModal(false)}
          circleCount={circleBesties.length}
        />
      )}

      {/* Circle Check Modal */}
      {showCircleCheck && (
        <CircleCheckModal
          besties={circleBesties}
          connectionStrengths={connectionStrengths}
          getStatusInfo={getStatusInfo}
          onClose={() => setShowCircleCheck(false)}
          onComplete={handleCircleCheck}
        />
      )}
    </div>
  );
};

// Daily Circle Check Modal Component
const CircleCheckModal = ({ besties, connectionStrengths, getStatusInfo, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checking, setChecking] = useState(false);

  const currentBestie = besties[currentIndex];
  const status = currentBestie ? getStatusInfo(currentBestie) : null;
  const connectionStrength = currentBestie ? connectionStrengths[currentBestie.id] : null;

  const handleNext = () => {
    if (currentIndex < besties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setChecking(true);
      onComplete();
    }
  };

  if (!currentBestie) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Progress Indicator */}
        <div className="flex gap-2 mb-6">
          {besties.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                idx <= currentIndex ? 'bg-gradient-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Bestie Display */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className={`w-32 h-32 rounded-full ${status.ringColor} ring-8 overflow-hidden shadow-2xl animate-breathe`}>
              {currentBestie.photoURL ? (
                <img
                  src={currentBestie.photoURL}
                  alt={currentBestie.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-display text-4xl">
                  {currentBestie.name[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${status.color} rounded-full border-4 border-white flex items-center justify-center text-xl shadow-lg`}>
                {status.emoji}
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-display text-gradient mb-2">{currentBestie.name}</h3>

          {/* Status */}
          <div className="text-sm font-semibold text-gray-700 mb-4">
            {status.label}
          </div>

          {/* Connection Strength */}
          {connectionStrength && (
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-purple-200 mb-4">
              <span className="text-2xl">{getConnectionEmoji(connectionStrength.total)}</span>
              <div className="text-left">
                <div className="text-xs text-gray-500">Connection</div>
                <div className="font-bold text-lg text-gradient">{connectionStrength.total}/100</div>
              </div>
              <span className="text-sm capitalize font-semibold text-gray-600">{connectionStrength.level}</span>
            </div>
          )}

          {/* Action based on status */}
          {currentBestie.requestAttention?.active && (
            <div className="bg-purple-100 border-2 border-purple-300 rounded-xl p-4 mb-4">
              <div className="font-semibold text-purple-900 mb-2">💜 Needs your support</div>
              <div className="text-sm text-purple-700">{currentBestie.requestAttention.note || 'Could use a friend right now'}</div>
            </div>
          )}

          {currentBestie.hasActiveCheckIn && (
            <div className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 mb-4">
              <div className="font-semibold text-yellow-900 mb-1">⏰ Active check-in</div>
              <div className="text-sm text-yellow-700">They're checking in somewhere</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Close
          </button>
          <button
            onClick={handleNext}
            disabled={checking}
            className="flex-1 btn btn-primary flex items-center justify-center gap-2"
          >
            {checking ? (
              'Completing...'
            ) : currentIndex < besties.length - 1 ? (
              <>Next <span>→</span></>
            ) : (
              <>Complete ✓</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LivingCircle;
