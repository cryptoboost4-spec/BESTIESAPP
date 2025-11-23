import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Luxury loader for "I'm Safe" confirmation
const SafeLoader = () => {
  const navigate = useNavigate();
  const messages = [
    { text: "Welcome home, beautiful! 💖", subtext: "We're so relieved you're safe" },
    { text: "You made it safely! ✨", subtext: "Your besties can rest easy now" },
    { text: "Safe and sound! 🌸", subtext: "Taking care of yourself like a queen" },
    { text: "You're safe! 💕", subtext: "That's all that matters" },
  ];

  // Pick one random message
  const [message] = useState(() => messages[Math.floor(Math.random() * messages.length)]);

  // Redirect to home after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating celebration elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-celebration-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.4,
            }}
          >
            <span className="text-3xl">
              {['🎉', '✨', '💚', '🌟', '💫', '🎊', '🦋', '🌸'][Math.floor(Math.random() * 8)]}
            </span>
          </div>
        ))}
      </div>

      {/* Luxury celebration card */}
      <div className="w-full max-w-lg text-center relative z-10">
        <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] p-10 shadow-[0_20px_60px_rgba(16,185,129,0.3)] border border-emerald-200/50">
          {/* Decorative corner accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-300/50 rounded-tl-xl"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-300/50 rounded-tr-xl"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-300/50 rounded-bl-xl"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-300/50 rounded-br-xl"></div>

          {/* Success animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Pulsing glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-green-300 to-teal-300 rounded-full animate-pulse-slow opacity-40 blur-xl"></div>

            {/* Checkmark with heart */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-28 h-28">
                <defs>
                  <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#6ee7b7" />
                  </linearGradient>
                  <filter id="successGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Circle background */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="url(#successGradient)"
                  filter="url(#successGlow)"
                  className="animate-scale-bounce"
                />

                {/* Large checkmark */}
                <path
                  d="M30,50 L42,62 L70,34"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-success"
                />
              </svg>
            </div>
          </div>

          {/* Celebration message */}
          <h2 className="font-display text-3xl md:text-4xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent mb-3 leading-tight">
            {message.text}
          </h2>

        <p className="text-xl text-text-secondary font-semibold mb-8 animate-fade-in">
          {message.subtext}
        </p>

          {/* Celebrating animation */}
          <div className="flex justify-center items-center gap-3 mb-6">
            <span className="text-3xl animate-bounce-gentle">🎉</span>
            <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.2s'}}>💚</span>
            <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.4s'}}>✨</span>
          </div>

          {/* Gentle reminder */}
          <p className="text-xs text-gray-400 italic">
            Until next time, stay safe bestie! 💕
          </p>
        </div>
      </div>

      <style>{`
        @keyframes celebration-float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.2; }
        }
        @keyframes scale-bounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes draw-success {
          0% { stroke-dasharray: 0, 100; }
          100% { stroke-dasharray: 100, 0; }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-celebration-float {
          animation: celebration-float 5s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-scale-bounce {
          animation: scale-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-draw-success {
          animation: draw-success 0.8s ease-in-out 0.3s forwards;
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SafeLoader;
