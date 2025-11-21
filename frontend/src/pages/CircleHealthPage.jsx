import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import {
  calculateCircleHealth,
  calculateConnectionStrength,
  getConnectionColor,
  getConnectionEmoji,
  formatTimeAgo,
  getLastInteraction,
} from '../services/connectionStrength';

const CircleHealthPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [circleHealth, setCircleHealth] = useState(null);
  const [circleBesties, setCircleBesties] = useState([]);
  const [showPerfectCircle, setShowPerfectCircle] = useState(false);

  useEffect(() => {
    loadCircleHealth();
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
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!circleHealth || circleHealth.circleSize === 0) {
    return (
      <div className="min-h-screen bg-pattern">
        <Header />
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
  const avgStoryEngagement = connections.length > 0
    ? connections.reduce((sum, c) => sum + (c.breakdown?.storyEngagement || 0), 0) / connections.length
    : 0;
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

  if (avgStoryEngagement < 15) {
    tips.push({
      icon: '📸',
      title: 'Post a Circle Story',
      description: 'Share what you\'re up to! Your besties want to see your life, not just hear from you when something\'s wrong.',
      action: 'Coming Soon',
      priority: 'medium',
    });
  }

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
      <Header />

      <div className="max-w-4xl mx-auto p-4 pb-20 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display text-gradient mb-2">Your Circle Stats ✨</h1>
          <p className="text-text-secondary">See how strong your connections really are</p>
        </div>

        {/* Overall Health Score */}
        <div className="card p-6 md:p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center">
            <div className="text-sm font-semibold text-gray-600 mb-2">Your Overall Vibe</div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-6xl md:text-7xl font-display text-gradient">{healthScore}</span>
              <span className="text-3xl text-gray-400">/100</span>
            </div>

            {/* Visual Health Bar */}
            <div className="w-full max-w-md mx-auto h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-primary transition-all duration-1000 rounded-full"
                style={{ width: `${healthScore}%` }}
              ></div>
            </div>

            <div className="text-lg font-semibold text-gray-700">
              {healthScore >= 90 && '🔥 Unbreakable! Your circle is goals fr'}
              {healthScore >= 70 && healthScore < 90 && '⚡ Super solid! Keep it up'}
              {healthScore >= 50 && healthScore < 70 && '💪 Pretty strong! You got this'}
              {healthScore >= 30 && healthScore < 50 && '🔆 Getting there! Keep building'}
              {healthScore < 30 && '🌱 Just starting! Lots of potential'}
            </div>

            <button
              onClick={() => setShowPerfectCircle(!showPerfectCircle)}
              className="mt-4 px-6 py-2 bg-white text-primary font-semibold rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto border-2 border-purple-200"
            >
              {showPerfectCircle ? '← Back to my stats' : <>See the dream circle ✨</>}
            </button>
          </div>
        </div>

        {/* Perfect Circle Demo or User's Circle */}
        {showPerfectCircle ? (
          <PerfectCircleDemo />
        ) : (
          <>
            {/* Progress to Next Level */}
            {healthScore < 90 && circleBesties.length > 0 && (
              <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200">
                <h2 className="text-xl font-display text-gradient mb-4 flex items-center gap-2">
                  Next Level
                  <span className="text-2xl">🎯</span>
                </h2>
                {healthScore < 30 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Growing 🔆</span>
                      <span className="text-sm text-gray-600">{30 - healthScore} points to go</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-400 to-orange-400 transition-all duration-500"
                        style={{ width: `${(healthScore / 30) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Keep building! Every interaction counts.</p>
                  </div>
                )}
                {healthScore >= 30 && healthScore < 50 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Strong 💪</span>
                      <span className="text-sm text-gray-600">{50 - healthScore} points to go</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-purple-400 transition-all duration-500"
                        style={{ width: `${((healthScore - 30) / 20) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">You're doing great! Keep the momentum going.</p>
                  </div>
                )}
                {healthScore >= 50 && healthScore < 70 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Powerful ⚡</span>
                      <span className="text-sm text-gray-600">{70 - healthScore} points to go</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-500"
                        style={{ width: `${((healthScore - 50) / 20) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">So close to powerful! You're crushing it.</p>
                  </div>
                )}
                {healthScore >= 70 && healthScore < 90 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Unbreakable 🔥</span>
                      <span className="text-sm text-gray-600">{90 - healthScore} points to go</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-500"
                        style={{ width: `${((healthScore - 70) / 20) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Almost there! Unbreakable status is within reach.</p>
                  </div>
                )}
              </div>
            )}
            {/* What Makes Your Circle Special */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-display text-gradient mb-4">What Makes You Close</h2>

              <div className="space-y-4">
                {/* Alert Response */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚨</span>
                      <span className="font-semibold text-text-primary">Show Up Factor</span>
                    </div>
                    <span className="font-bold text-gradient">{Math.round(avgAlertResponse)}/50</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-500"
                      style={{ width: `${(avgAlertResponse / 50) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">They drop everything when you need them</p>
                </div>

                {/* Story Engagement */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📸</span>
                      <span className="font-semibold text-text-primary">Story Vibes</span>
                    </div>
                    <span className="font-bold text-gradient">{Math.round(avgStoryEngagement)}/25</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
                      style={{ width: `${(avgStoryEngagement / 25) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Staying in the loop with each other's lives</p>
                </div>

                {/* Featured Circle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <span className="font-semibold text-text-primary">Top 5 Status</span>
                    </div>
                    <span className="font-bold text-gradient">{circleHealth.circleSize}/5 members</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${(circleHealth.circleSize / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Being in each other's top 5 matters</p>
                </div>

                {/* Recency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      <span className="font-semibold text-text-primary">Staying Current</span>
                    </div>
                    <span className="font-bold text-gradient">{Math.round(avgRecency)}/10</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${(avgRecency / 10) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Keeping the connection alive with regular check-ins</p>
                </div>
              </div>
            </div>

            {/* Individual Connections */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-display text-gradient mb-4">Your Connections</h2>

              <div className="space-y-3">
                {connections.map((connection, idx) => {
                  const bestie = circleBesties.find(b => b.id === connection.id) || circleBesties[idx];
                  if (!bestie) return null;

                  return (
                    <button
                      key={bestie.id}
                      onClick={() => navigate(`/user/${bestie.id}`)}
                      className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-200"
                    >
                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        {bestie.photoURL ? (
                          <img
                            src={bestie.photoURL}
                            alt={bestie.name}
                            className="w-14 h-14 rounded-full object-cover ring-4 ring-purple-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display text-xl ring-4 ring-purple-200">
                            {bestie.name[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-text-primary text-lg">{bestie.name}</div>
                        <div className="text-sm text-gray-600">
                          Last interaction: {formatTimeAgo(bestie.lastInteraction)}
                        </div>
                      </div>

                      {/* Connection Score */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getConnectionEmoji(connection.total)}</span>
                          <span className="font-bold text-2xl text-gradient">{connection.total}</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-500 capitalize">{connection.level}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Up Your Circle */}
            <div className="card p-6">
              <h2 className="text-xl font-display text-gradient mb-4">Level Up Your Circle 🚀</h2>

              <div className="space-y-3">
                {tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      tip.priority === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                        : tip.priority === 'high'
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
                        : tip.priority === 'medium'
                        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300'
                        : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{tip.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-1">{tip.title}</h3>
                        <p className="text-sm text-gray-700 mb-2">{tip.description}</p>
                        {tip.action && tip.link && (
                          <button
                            onClick={() => navigate(tip.link)}
                            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            {tip.action} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Perfect Circle Demo Component
const PerfectCircleDemo = () => {
  const perfectBesties = [
    { name: 'Alex', score: 100 },
    { name: 'Sam', score: 100 },
    { name: 'Jordan', score: 100 },
    { name: 'Taylor', score: 100 },
    { name: 'Morgan', score: 100 },
  ];

  return (
    <div className="card p-8 mb-6 bg-gradient-to-br from-green-50 via-emerald-50 via-teal-50 via-pink-50 to-purple-50 border-4 border-green-300 relative overflow-hidden">
      {/* INSANE Animated particles background - Pink AND Green mixing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Green particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`green-${i}`}
            className="absolute w-3 h-3 rounded-full opacity-50 animate-float"
            style={{
              background: `radial-gradient(circle, #10b981, #34d399)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        {/* Pink particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`pink-${i}`}
            className="absolute w-3 h-3 rounded-full opacity-50 animate-float"
            style={{
              background: `radial-gradient(circle, #ec4899, #f472b6)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-display bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            The Dream Circle ✨
          </h2>
          <p className="text-gray-700 text-sm md:text-base font-semibold">This is what an unbreakable circle looks like - pure magic</p>
        </div>

        {/* Perfect Circle Visualization */}
        <div className="relative w-full max-w-sm mx-auto aspect-square mb-8">
          <div className="absolute inset-0">
            {/* Perfect Connection Lines - all glowing strongly */}
            {perfectBesties.map((bestie, index) => {
              const angle = (index * 72 - 90) * (Math.PI / 180);
              const radius = 45;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);

              return (
                <svg
                  key={`line-${index}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 0 }}
                >
                  <defs>
                    <linearGradient id={`perfect-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                      <stop offset="25%" stopColor="#14b8a6" stopOpacity="1" />
                      <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
                      <stop offset="75%" stopColor="#a855f7" stopOpacity="1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id={`perfect-glow-${index}`}>
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="coloredBlur"/>
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
                    stroke={`url(#perfect-gradient-${index})`}
                    strokeWidth="5"
                    filter={`url(#perfect-glow-${index})`}
                    className="animate-pulse-fast"
                  />

                  {/* INSANE amount of particles - green and pink flowing */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="5"
                    fill="#10b981"
                    opacity="0.9"
                    className="animate-particle-fast"
                    style={{
                      '--target-x': `${x}%`,
                      '--target-y': `${y}%`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="4"
                    fill="#ec4899"
                    opacity="0.85"
                    className="animate-particle-fast"
                    style={{
                      '--target-x': `${x}%`,
                      '--target-y': `${y}%`,
                      animationDelay: `${index * 0.2 + 0.5}s`,
                    }}
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="3"
                    fill="#14b8a6"
                    opacity="0.8"
                    className="animate-particle-fast"
                    style={{
                      '--target-x': `${x}%`,
                      '--target-y': `${y}%`,
                      animationDelay: `${index * 0.2 + 1}s`,
                    }}
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="4"
                    fill="#f472b6"
                    opacity="0.8"
                    className="animate-particle-fast"
                    style={{
                      '--target-x': `${x}%`,
                      '--target-y': `${y}%`,
                      animationDelay: `${index * 0.2 + 1.5}s`,
                    }}
                  />
                </svg>
              );
            })}

            {/* Center - Perfect Health */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-lg font-display shadow-2xl border-4 border-white ring-4 ring-green-300 animate-breathe-perfect">
                100
              </div>
            </div>

            {/* Perfect Besties */}
            {perfectBesties.map((bestie, index) => {
              const angle = (index * 72 - 90) * (Math.PI / 180);
              const radius = 45;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);

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
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full shadow-xl border-4 border-white ring-6 ring-green-300 overflow-hidden flex items-center justify-center animate-breathe-perfect"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <span className="text-white font-display text-2xl">
                        {bestie.name[0]}
                      </span>
                      {/* Perfect Status Badge */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-lg animate-pulse-fast">
                        🔥
                      </div>
                    </div>

                    {/* Score Indicator */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-green-700">
                      100/100
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Perfect Circle Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
            <div className="text-3xl mb-2">🚨</div>
            <div className="font-bold text-green-700">Instant Response</div>
            <div className="text-sm text-gray-600">&lt; 5 minutes to every alert</div>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
            <div className="text-3xl mb-2">📸</div>
            <div className="font-bold text-green-700">Active Stories</div>
            <div className="text-sm text-gray-600">View & react to all stories</div>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
            <div className="text-3xl mb-2">💚</div>
            <div className="font-bold text-green-700">Daily Connection</div>
            <div className="text-sm text-gray-600">Interact every single day</div>
          </div>
        </div>

        {/* How to Get There */}
        <div className="mt-8 p-6 bg-white rounded-xl border-2 border-green-300 shadow-lg">
          <h3 className="font-display text-xl text-green-700 mb-2 flex items-center gap-2">
            How to Get There 🎯
          </h3>
          <p className="text-sm text-gray-600 mb-4">It's honestly simpler than you think</p>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-lg">1.</span>
              <span><strong>Drop everything when they need you.</strong> Seriously - respond to their alerts within minutes. That's what besties do.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-lg">2.</span>
              <span><strong>Keep each other in the loop.</strong> Share your circle stories so they know what's up. React to theirs. Stay connected.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-lg">3.</span>
              <span><strong>Make it mutual.</strong> Put them in your top 5 AND make sure you're in theirs. It goes both ways.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-lg">4.</span>
              <span><strong>Talk regularly, not just in emergencies.</strong> Little check-ins keep the vibe strong.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-lg">5.</span>
              <span><strong>Be there in the hard times.</strong> Anyone can show up when things are good. Real ones show up when it's tough.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Perfect Circle Animations */}
      <style>{`
        @keyframes breathe-perfect {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 15px 60px rgba(16, 185, 129, 0.6);
          }
        }
        .animate-breathe-perfect {
          animation: breathe-perfect 2s ease-in-out infinite;
        }
        @keyframes pulse-fast {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s ease-in-out infinite;
        }
        @keyframes particle-fast {
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
        .animate-particle-fast {
          animation: particle-fast 2s linear infinite;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CircleHealthPage;
