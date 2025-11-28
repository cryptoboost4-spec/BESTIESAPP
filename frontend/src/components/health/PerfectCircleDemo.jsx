import React from 'react';

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

export default PerfectCircleDemo;
