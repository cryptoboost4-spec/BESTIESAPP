import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  calculateCircleHealth,
  getLastInteraction,
} from '../services/connectionStrength';
import HealthScoreCard from '../components/health/HealthScoreCard';
import ProgressToNextLevel from '../components/health/ProgressToNextLevel';
import ConnectionBreakdown from '../components/health/ConnectionBreakdown';
import ConnectionsList from '../components/health/ConnectionsList';
import LevelUpTips from '../components/health/LevelUpTips';
import PerfectCircleDemo from '../components/health/PerfectCircleDemo';

const CircleHealthPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [circleHealth, setCircleHealth] = useState(null);
  const [circleBesties, setCircleBesties] = useState([]);
  const [showPerfectCircle, setShowPerfectCircle] = useState(false);

  useEffect(() => {
    loadCircleHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCircleHealth = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // Calculate circle health
      const health = await calculateCircleHealth(currentUser.uid);
      setCircleHealth(health);

      // Load bestie details
      if (health.circleSize > 0) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const featuredIds = userDoc.exists() ? (userDoc.data().featuredCircle || []) : [];

        const bestiesData = [];
        for (const bestieId of featuredIds) {
          const bestieDoc = await getDoc(doc(db, 'users', bestieId));
          if (!bestieDoc.exists()) continue;

          const bestieData = bestieDoc.data();
          const lastInteraction = await getLastInteraction(currentUser.uid, bestieId);

          bestiesData.push({
            id: bestieId,
            name: bestieData.displayName || 'Bestie',
            photoURL: bestieData.photoURL || null,
            lastInteraction,
          });
        }

        setCircleBesties(bestiesData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading circle health:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern">
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!circleHealth || circleHealth.circleSize === 0) {
    return (
      <div className="min-h-screen bg-pattern">
        <div className="max-w-4xl mx-auto p-4 py-8">
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h1 className="text-2xl font-display text-gradient mb-3">Build Your Circle First</h1>
            <p className="text-text-secondary mb-6">
              Add besties to your featured circle to see your Circle Health Dashboard
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="btn btn-primary"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const healthScore = circleHealth.score;
  const connections = circleHealth.connections || [];

  // Calculate averages
  const avgAlertResponse = connections.length > 0
    ? connections.reduce((sum, c) => sum + (c.breakdown?.alertResponse || 0), 0) / connections.length
    : 0;
  // Story engagement removed for now since feature isn't live yet
  const avgRecency = connections.length > 0
    ? connections.reduce((sum, c) => sum + (c.breakdown?.recency || 0), 0) / connections.length
    : 0;

  // Generate actionable tips
  const tips = [];

  if (circleHealth.circleSize < 5) {
    tips.push({
      icon: '✨',
      title: `Add ${5 - circleHealth.circleSize} More ${circleHealth.circleSize === 4 ? 'Bestie' : 'Besties'}`,
      description: circleHealth.circleSize === 0
        ? 'Your circle is waiting for you! Add the 5 people you trust most - the ones who always have your back.'
        : `You're ${circleHealth.circleSize}/5 of the way there! Complete your circle to unlock full connection power.`,
      action: 'Find Besties',
      link: '/besties',
      priority: 'high',
    });
  }

  if (avgRecency < 7) {
    // Find who you haven't talked to recently
    const needsAttention = connections.filter(c => (c.breakdown?.recency || 0) < 4);
    const names = needsAttention.map((c, idx) => {
      const bestie = circleBesties.find(b => b.id === c.id) || circleBesties[idx];
      return bestie?.name || 'someone';
    }).slice(0, 2).join(' and ');

    tips.push({
      icon: '💬',
      title: needsAttention.length > 0 ? `Reach out to ${names}` : 'Stay Connected',
      description: needsAttention.length > 0
        ? `You haven't connected in a while. Send them a quick message - they'll love hearing from you!`
        : 'Keep those regular check-ins going. Consistency is everything.',
      action: 'View Circle',
      link: '/profile',
      priority: 'high',
    });
  }

  // Story feature coming soon - don't show tip since users can't act on it yet
  // Removed to avoid confusion

  if (avgAlertResponse < 25) {
    tips.push({
      icon: '⚡',
      title: 'Show Up Faster',
      description: 'When your besties send an alert, try to respond within 15 minutes. That\'s what makes you irreplaceable.',
      action: null,
      priority: 'medium',
    });
  }

  if (healthScore >= 90) {
    tips.unshift({
      icon: '🔥',
      title: 'You Did It!',
      description: 'Your circle is unbreakable. This is the kind of friendship everyone wishes they had. Keep being amazing.',
      action: null,
      priority: 'success',
    });
  }

  return (
    <div className="min-h-screen bg-pattern">

      <div className="max-w-4xl mx-auto p-4 pb-20 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display text-gradient mb-2">Your Circle Stats ✨</h1>
          <p className="text-text-secondary">See how strong your connections really are</p>
        </div>

        <HealthScoreCard
          healthScore={healthScore}
          showPerfectCircle={showPerfectCircle}
          setShowPerfectCircle={setShowPerfectCircle}
        />

        {/* Perfect Circle Demo or User's Circle */}
        {showPerfectCircle ? (
          <PerfectCircleDemo />
        ) : (
          <>
            <ProgressToNextLevel
              healthScore={healthScore}
              circleBestiesLength={circleBesties.length}
            />

            <ConnectionBreakdown
              avgAlertResponse={avgAlertResponse}
              avgRecency={avgRecency}
              circleSize={circleHealth.circleSize}
            />

            <ConnectionsList
              connections={connections}
              circleBesties={circleBesties}
            />

            <LevelUpTips tips={tips} />
          </>
        )}
      </div>
    </div>
  );
};

export default CircleHealthPage;
