import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import InfoButton from './InfoButton';
import BestieCircleShareModal from './BestieCircleShareModal';
import CircleVisualization from './circle/CircleVisualization';
import CircleCenterScore from './circle/CircleCenterScore';
import BestieSlot from './circle/BestieSlot';
import EmptySlot from './circle/EmptySlot';
import CircleStats from './circle/CircleStats';
import ReplaceModal from './circle/ReplaceModal';
import CircleAnimations from './circle/CircleAnimations';
import {
  calculateConnectionStrength,
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
  const [overallHealth, setOverallHealth] = useState(0);
  const [showVibeTooltip, setShowVibeTooltip] = useState(false);

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

      // Collect all bestie IDs first
      const bestieIds = [];
      requesterQuery.docs.forEach(doc => bestieIds.push(doc.data().recipientId));
      recipientQuery.docs.forEach(doc => bestieIds.push(doc.data().requesterId));

      // Batch load all user documents in parallel
      const userDocsPromises = bestieIds.map(id => getDoc(doc(db, 'users', id)));
      const userDocs = await Promise.all(userDocsPromises);
      const userDataMap = {};
      userDocs.forEach((userDoc, index) => {
        if (userDoc.exists()) {
          userDataMap[bestieIds[index]] = userDoc.data();
        }
      });

      // Batch load active check-ins for all besties at once (only for 'all_besties' visibility)
      const allBestieIdsForCheckIns = bestieIds.filter(id => {
        const userData = userDataMap[id];
        return (userData?.privacySettings?.checkInVisibility || 'all_besties') === 'all_besties';
      });

      let activeCheckInsMap = {};
      if (allBestieIdsForCheckIns.length > 0) {
        // Use Promise.all to check check-ins in parallel (limit to 10 concurrent)
        const checkInPromises = allBestieIdsForCheckIns.map(bestieId => 
          getDocs(
            query(
              collection(db, 'checkins'),
              where('userId', '==', bestieId),
              where('status', 'in', ['active', 'alerted'])
            )
          ).then(snap => ({ bestieId, hasActive: !snap.empty }))
        );
        const checkInResults = await Promise.all(checkInPromises);
        checkInResults.forEach(({ bestieId, hasActive }) => {
          activeCheckInsMap[bestieId] = hasActive;
        });
      }

      const bestiesList = [];

      // Process requester besties
      for (const docSnap of requesterQuery.docs) {
        const data = docSnap.data();
        const userData = userDataMap[data.recipientId] || {};

        // Check for active check-ins (optimized)
        let hasActiveCheckIn = false;
        const checkInVisibility = userData.privacySettings?.checkInVisibility || 'all_besties';
        
        if (checkInVisibility === 'all_besties') {
          hasActiveCheckIn = activeCheckInsMap[data.recipientId] || false;
        } else if (checkInVisibility === 'circle') {
          const theirFeaturedCircle = userData.featuredCircle || [];
          if (theirFeaturedCircle.includes(userId)) {
            hasActiveCheckIn = activeCheckInsMap[data.recipientId] || false;
          }
        }

        // Check if current user is in their featured circle (mutual)
        const theirFeaturedCircle = userData.featuredCircle || [];
        const isMutual = theirFeaturedCircle.includes(userId);

        bestiesList.push({
          id: data.recipientId,
          name: userData.displayName || 'Bestie',
          photoURL: userData.photoURL || null,
          requestAttention: userData.requestAttention || null,
          hasActiveCheckIn: hasActiveCheckIn,
          isMutual: isMutual,
        });
      }

      // Process recipient besties
      for (const docSnap of recipientQuery.docs) {
        const data = docSnap.data();
        const userData = userDataMap[data.requesterId] || {};

        // Check for active check-ins (optimized)
        let hasActiveCheckIn = false;
        const checkInVisibility = userData.privacySettings?.checkInVisibility || 'all_besties';
        
        if (checkInVisibility === 'all_besties') {
          hasActiveCheckIn = activeCheckInsMap[data.requesterId] || false;
        } else if (checkInVisibility === 'circle') {
          const theirFeaturedCircle = userData.featuredCircle || [];
          if (theirFeaturedCircle.includes(userId)) {
            hasActiveCheckIn = activeCheckInsMap[data.requesterId] || false;
          }
        }

        // Check if current user is in their featured circle (mutual)
        const theirFeaturedCircle = userData.featuredCircle || [];
        const isMutual = theirFeaturedCircle.includes(userId);

        bestiesList.push({
          id: data.requesterId,
          name: userData.displayName || 'Bestie',
          photoURL: userData.photoURL || null,
          requestAttention: userData.requestAttention || null,
          hasActiveCheckIn: hasActiveCheckIn,
          isMutual: isMutual,
        });
      }

      setAllBesties(bestiesList);

      // Get user's featured circle (already loaded above, reuse)
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

      // Show circle immediately (don't wait for connection data)
      setLoading(false);

      // CRITICAL: Save auto-filled circle to Firestore (don't await - do in background)
      if (needsAutoFill && finalCircle.length > 0) {
        saveFeaturedCircle(finalCircle).catch(err => console.error('Error saving featured circle:', err));
      }

      // Load connection strengths and last seen (in background, don't block UI)
      // This loads progressively so the circle appears faster
      loadConnectionData(finalCircle);
    } catch (error) {
      console.error('Error loading besties:', error);
      // If it's a permission error, it might be a race condition - bestieUserIds not synced yet
      // Show empty circle instead of crashing
      if (error.code === 'permission-denied') {
        console.warn('Permission denied loading besties - may be race condition. Showing empty circle.');
        setCircleBesties([]);
        setAllBesties([]);
      }
      setLoading(false);
    }
  };

  const loadConnectionData = async (besties) => {
    setLoadingConnections(true);
    
    // Load all connection data in parallel for better performance
    const connectionPromises = besties.map(async (bestie) => {
      try {
        const [strength, lastInteraction] = await Promise.all([
          calculateConnectionStrength(userId, bestie.id),
          getLastInteraction(userId, bestie.id)
        ]);
        return {
          bestieId: bestie.id,
          strength,
          lastInteraction
        };
      } catch (error) {
        console.error(`Error loading connection data for ${bestie.id}:`, error);
        return {
          bestieId: bestie.id,
          strength: null,
          lastInteraction: null
        };
      }
    });

    const results = await Promise.all(connectionPromises);
    
    const strengths = {};
    const lastSeenData = {};
    
    results.forEach(({ bestieId, strength, lastInteraction }) => {
      if (strength) strengths[bestieId] = strength;
      if (lastInteraction) lastSeenData[bestieId] = lastInteraction;
    });

    setConnectionStrengths(strengths);
    setLastSeen(lastSeenData);

    // Calculate overall health
    const scores = Object.values(strengths).map(s => s.total);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const healthWithPenalty = besties.length < 5 ? avgScore * (besties.length / 5) : avgScore;
    setOverallHealth(Math.round(healthWithPenalty));

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

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div
      className="card p-6 md:p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-100 relative overflow-hidden"
      onClick={() => {
        if (showVibeTooltip) setShowVibeTooltip(false);
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30 animate-gradient-shift pointer-events-none"></div>

      <div className="relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center">
            <h3 className="text-2xl md:text-3xl font-display mb-1 text-black dark:text-white">💜 Your Bestie Circle</h3>
            <InfoButton message="Your inner circle of 5 closest people - the ones you can call at 3am! Connection strength grows based on your interactions. Click besties to view profiles or manage your circle. 💜" />
          </div>
        </div>

        {/* Circle Container - Responsive sizing */}
        <div className="relative w-full max-w-md mx-auto aspect-square mb-6">
          <div className="absolute inset-0">
            <CircleVisualization
              slots={slots}
              connectionStrengths={connectionStrengths}
              loadingConnections={loadingConnections}
            />

            <CircleCenterScore
              loadingConnections={loadingConnections}
              circleBestiesLength={circleBesties.length}
              overallHealth={overallHealth}
              showVibeTooltip={showVibeTooltip}
              setShowVibeTooltip={setShowVibeTooltip}
            />

            {/* Bestie Slots - all equidistant from center */}
            {slots.map((bestie, index) => {
              const connectionStrength = bestie ? connectionStrengths[bestie.id] : null;
              const lastSeenTime = bestie ? lastSeen[bestie.id] : null;

              return bestie ? (
                <BestieSlot
                  key={index}
                  bestie={bestie}
                  index={index}
                  selectedSlot={selectedSlot}
                  setSelectedSlot={setSelectedSlot}
                  connectionStrength={connectionStrength}
                  loadingConnections={loadingConnections}
                  lastSeenTime={lastSeenTime}
                  getStatusInfo={getStatusInfo}
                  handleViewProfile={handleViewProfile}
                  setShowReplaceModal={setShowReplaceModal}
                  handleRemoveFromCircle={handleRemoveFromCircle}
                />
              ) : (
                <EmptySlot
                  key={index}
                  index={index}
                  circleBestiesLength={circleBesties.length}
                  setShowShareModal={setShowShareModal}
                />
              );
            })}
          </div>
        </div>

        <CircleStats
          circleBestiesLength={circleBesties.length}
          overallHealth={overallHealth}
          loadingConnections={loadingConnections}
        />
      </div>

      <CircleAnimations />

      <ReplaceModal
        show={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        allBesties={allBesties}
        circleBesties={circleBesties}
        onReplace={handleReplaceBestie}
      />

      {/* Bestie Circle Share Modal */}
      {showShareModal && (
        <BestieCircleShareModal
          onClose={() => setShowShareModal(false)}
          circleCount={circleBesties.length}
        />
      )}
    </div>
  );
};

export default LivingCircle;
