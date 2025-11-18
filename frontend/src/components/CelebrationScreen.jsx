import React, { useMemo } from 'react';

const messages = [
  { title: "You're Safe!", subtitle: "Your besties have been notified 💜", emoji: "✅" },
  { title: "Way to Go!", subtitle: "You're taking care of yourself!", emoji: "🎉" },
  { title: "Safety First!", subtitle: "Your besties are proud of you!", emoji: "⭐" },
  { title: "Great Job!", subtitle: "Staying safe makes everyone happy!", emoji: "💜" },
  { title: "You Did It!", subtitle: "Another successful check-in!", emoji: "🎊" },
  { title: "Well Done!", subtitle: "Keep up the great safety habits!", emoji: "✨" },
  { title: "Amazing!", subtitle: "You're making safety a priority!", emoji: "🌟" },
  { title: "Perfect!", subtitle: "Your besties can rest easy now!", emoji: "💯" },
];

const CelebrationScreen = () => {
  // Pick a random message once when component loads
  const currentMessage = useMemo(() => {
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  return (
    <div className="card p-8 bg-gradient-primary text-white text-center overflow-hidden relative">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-bounce-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {['🎉', '✨', '💜', '🎊', '⭐'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="text-6xl mb-4 animate-bounce">
          {currentMessage.emoji}
        </div>
        <h2 className="font-display text-3xl mb-2">
          {currentMessage.title}
        </h2>
        <p className="text-lg opacity-90 mb-4">
          {currentMessage.subtitle}
        </p>
        <div className="text-sm opacity-75">
          Check-in completed successfully
        </div>
      </div>
    </div>
  );
};

export default CelebrationScreen;
