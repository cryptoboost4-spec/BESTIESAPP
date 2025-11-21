import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import {
  calculateCircleHealth,
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
  const avgCheckInFrequency = connections.length > 0
    ? connections.reduce((sum, c) => sum + (c.breakdown?.checkInFrequency || 0), 0) / connections.length
    : 0;
  const avgRecency = connections.length > 0
    ? connections.reduce((sum, c) => sum + (c.breakdown?.recency || 0), 0) / connections.length
    : 0;

  // Generate actionable tips
  const tips = [];

  if (circleHealth.circleSize < 5) {
    tips.push({
      icon: '👥',
      title: 'Complete Your Circle',
      description: `Add ${5 - circleHealth.circleSize} more ${circleHealth.circleSize === 4 ? 'bestie' : 'besties'} to reach full strength`,
      action: 'Add Besties',
      link: '/besties',
      priority: 'high',
    });
  }

  if (avgRecency < 9) {
    tips.push({
      icon: '📅',
      title: 'Stay Connected',
      description: 'Some connections haven\'t been active recently. Regular check-ins strengthen bonds.',
      action: 'Do Circle Check',
      link: '/profile',
      priority: 'medium',
    });
  }

  if (avgCheckInFrequency < 15) {
    tips.push({
      icon: '✅',
      title: 'More Check-Ins Together',
      description: 'Include your circle members as guardians when creating check-ins.',
      action: 'Create Check-In',
      link: '/checkin',
      priority: 'medium',
    });
  }

  if (avgAlertResponse < 20) {
    tips.push({
      icon: '🚨',
      title: 'Build Response Trust',
      description: 'Respond quickly when your circle members need help. This builds real connection strength.',
      action: 'View Tips',
      priority: 'low',
    });
  }

  if (healthScore >= 90) {
    tips.unshift({
      icon: '🎉',
      title: 'Incredible Circle!',
      description: 'Your circle is thriving with strong connections. Keep up the amazing support!',
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
          <h1 className="text-3xl md:text-4xl font-display text-gradient mb-2">Circle Health Dashboard</h1>
          <p className="text-text-secondary">Understand and strengthen your safety network</p>
        </div>

        {/* Overall Health Score */}
        <div className="card p-6 md:p-8 mb-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center">
            <div className="text-sm font-semibold text-gray-600 mb-2">Overall Circle Health</div>
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
              {healthScore >= 90 && '🔥 Incredible - Your circle is thriving!'}
              {healthScore >= 70 && healthScore < 90 && '💪 Strong - Keep nurturing these connections'}
              {healthScore >= 50 && healthScore < 70 && '👍 Good - Room to grow stronger'}
              {healthScore >= 30 && healthScore < 50 && '🌱 Developing - Focus on consistency'}
              {healthScore < 30 && '💤 Needs Attention - Time to reconnect'}
            </div>

            <button
              onClick={() => setShowPerfectCircle(!showPerfectCircle)}
              className="mt-4 text-primary font-semibold hover:underline flex items-center gap-2 mx-auto"
            >
              {showPerfectCircle ? '← Back to My Circle' : 'See What Perfect Looks Like →'}
            </button>
          </div>
        </div>

        {/* Perfect Circle Demo or User's Circle */}
        {showPerfectCircle ? (
          <PerfectCircleDemo />
        ) : (
          <>
            {/* Connection Breakdown */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-display text-gradient mb-4">Connection Breakdown</h2>

              <div className="space-y-4">
                {/* Alert Response */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚨</span>
                      <span className="font-semibold text-text-primary">Alert Response</span>
                    </div>
                    <span className="font-bold text-gradient">{Math.round(avgAlertResponse)}/35</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-500"
                      style={{ width: `${(avgAlertResponse / 35) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">How quickly you respond when they need help</p>
                </div>

                {/* Check-In Frequency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-semibold text-text-primary">Check-In Frequency</span>
                    </div>
                    <span className="font-bold text-gradient">{Math.round(avgCheckInFrequency)}/25</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${(avgCheckInFrequency / 25) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">How often you include each other in check-ins</p>
                </div>

                {/* Featured Circle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <span className="font-semibold text-text-primary">Featured Circle</span>
                    </div>
                    <span className="font-bold text-gradient">{circleHealth.circleSize}/5</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${(circleHealth.circleSize / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Top 5 most important connections</p>
                </div>

                {/* Recency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      <span className="font-semibold text-text-primary">Recent Activity</span>
                    </div>
                    <span className="font-bold text-gradient">{Math.round(avgRecency)}/15</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${(avgRecency / 15) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">How recently you've interacted</p>
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

            {/* Tips & Recommendations */}
            <div className="card p-6">
              <h2 className="text-xl font-display text-gradient mb-4">How to Improve</h2>

              <div className="space-y-3">
                {tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      tip.priority === 'success'
                        ? 'bg-green-50 border-green-300'
                        : tip.priority === 'high'
                        ? 'bg-red-50 border-red-300'
                        : tip.priority === 'medium'
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-blue-50 border-blue-300'
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
                            className="text-sm font-semibold text-primary hover:underline"
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
    <div className="card p-8 mb-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-4 border-green-300 relative overflow-hidden">
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-green-400 rounded-full opacity-40 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-display bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            The Perfect Circle
          </h2>
          <p className="text-gray-700 text-sm md:text-base">This is what incredible connection looks like</p>
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
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id={`perfect-glow-${index}`}>
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
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
                    strokeWidth="4"
                    filter={`url(#perfect-glow-${index})`}
                    className="animate-pulse-fast"
                  />

                  {/* Multiple particles flowing */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="4"
                    fill="#10b981"
                    opacity="0.9"
                    className="animate-particle-fast"
                    style={{
                      '--target-x': `${x}%`,
                      '--target-y': `${y}%`,
                      animationDelay: `${index * 0.3}s`,
                    }}
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="3"
                    fill="#34d399"
                    opacity="0.8"
                    className="animate-particle-fast"
                    style={{
                      '--target-x': `${x}%`,
                      '--target-y': `${y}%`,
                      animationDelay: `${index * 0.3 + 1}s`,
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
            <div className="text-3xl mb-2">✅</div>
            <div className="font-bold text-green-700">Always Together</div>
            <div className="text-sm text-gray-600">Regular check-ins & support</div>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-green-300 text-center">
            <div className="text-3xl mb-2">💚</div>
            <div className="font-bold text-green-700">Daily Connection</div>
            <div className="text-sm text-gray-600">Interact every single day</div>
          </div>
        </div>

        {/* How to Get There */}
        <div className="mt-8 p-6 bg-white rounded-xl border-2 border-green-300">
          <h3 className="font-display text-xl text-green-700 mb-4">How to Build This</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">1.</span>
              <span><strong>Respond fast:</strong> When they need help, drop everything and be there within minutes.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">2.</span>
              <span><strong>Check in together:</strong> Include them in your check-ins regularly, not just emergencies.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">3.</span>
              <span><strong>Stay consistent:</strong> Daily circle checks keep connections strong and alive.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">4.</span>
              <span><strong>Be mutual:</strong> Make sure they're in your circle AND you're in theirs.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">5.</span>
              <span><strong>Show up:</strong> Real connections are built when you're there during tough times.</span>
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
