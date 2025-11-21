import React, { useState, useEffect } from 'react';

/**
 * Cute girly loading skeleton with rotating supportive messages
 * Shows while data is loading to make app feel faster
 */

const SUPPORTIVE_MESSAGES = [
  "Your safety squad is loading... 💜",
  "Getting your besties ready... 👯‍♀️",
  "Almost there, queen! 👑",
  "Loading your safety net... 🛡️",
  "Besties incoming! ✨",
  "Setting up your protection... 💪",
  "Your crew is on the way... 🌟",
  "Making sure you're covered... 💕",
  "Safety first, always! 🎀",
  "We got you, babe! 🫶",
  "Your backup is loading... 🚀",
  "Preparing your safe space... 🌸",
  "Getting the squad together... 💝",
  "Your safety network loading... 🔐",
  "Besties are assembling... 🦋"
];

const LoadingSkeleton = ({ type = 'list', count = 3, message }) => {
  const [currentMessage, setCurrentMessage] = useState(
    message || SUPPORTIVE_MESSAGES[Math.floor(Math.random() * SUPPORTIVE_MESSAGES.length)]
  );

  // Rotate message every 3 seconds
  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage(SUPPORTIVE_MESSAGES[Math.floor(Math.random() * SUPPORTIVE_MESSAGES.length)]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [message]);

  // Different skeleton types
  if (type === 'profile') {
    return (
      <div className="animate-fade-in">
        {/* Message */}
        <div className="text-center mb-6 animate-pulse">
          <p className="text-primary font-semibold">{currentMessage}</p>
        </div>

        {/* Profile card skeleton */}
        <div className="card p-8 mb-6">
          <div className="flex flex-col items-center">
            {/* Profile photo */}
            <div className="w-32 h-32 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full mb-4 animate-shimmer"></div>

            {/* Name */}
            <div className="h-8 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full w-48 mb-2 animate-shimmer"></div>

            {/* Bio */}
            <div className="h-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full w-64 mb-4 animate-shimmer"></div>

            {/* Stats */}
            <div className="flex gap-4 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <div className="h-6 w-12 bg-gradient-to-r from-pink-200 to-purple-200 rounded mb-1 animate-shimmer"></div>
                  <div className="h-3 w-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="animate-fade-in">
        {/* Message */}
        <div className="text-center mb-6 animate-pulse">
          <p className="text-primary font-semibold">{currentMessage}</p>
        </div>

        {/* Single card skeleton */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex-shrink-0 animate-shimmer"></div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gradient-to-r from-pink-200 to-purple-200 rounded w-3/4 animate-shimmer"></div>
              <div className="h-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded w-full animate-shimmer"></div>
              <div className="h-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded w-5/6 animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: list of items
  return (
    <div className="animate-fade-in space-y-4">
      {/* Message */}
      <div className="text-center mb-6 animate-pulse">
        <p className="text-primary font-semibold">{currentMessage}</p>
      </div>

      {/* List items */}
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-4" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center gap-4">
            {/* Avatar/Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex-shrink-0 animate-shimmer"></div>

            {/* Text content */}
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gradient-to-r from-pink-200 to-purple-200 rounded w-3/4 animate-shimmer"></div>
              <div className="h-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded w-1/2 animate-shimmer"></div>
            </div>

            {/* Action area */}
            <div className="w-20 h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full animate-shimmer"></div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            #fce7f3 0%,
            #fbcfe8 20%,
            #f9a8d4 40%,
            #e9d5ff 60%,
            #fbcfe8 80%,
            #fce7f3 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-in;
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;
