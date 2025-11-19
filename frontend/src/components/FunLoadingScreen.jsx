import React, { useState, useEffect } from 'react';
import '../styles/FunLoadingScreen.css';

const SAFETY_TIPS = [
  {
    icon: '💜',
    title: 'Stay Safe, Queen!',
    message: 'Your besties are here to protect you',
  },
  {
    icon: '✨',
    title: 'You Got This!',
    message: 'Every check-in keeps you safer',
  },
  {
    icon: '🛡️',
    title: 'Safety First!',
    message: 'Always tell your besties where you\'re going',
  },
  {
    icon: '👯‍♀️',
    title: 'Squad Goals!',
    message: 'The more besties, the safer you are',
  },
  {
    icon: '🌟',
    title: 'You\'re Amazing!',
    message: 'Taking care of your safety is so smart',
  },
  {
    icon: '💪',
    title: 'Strong Together!',
    message: 'Your safety network has your back',
  },
  {
    icon: '🎯',
    title: 'Pro Tip!',
    message: 'Set check-ins before dates or nights out',
  },
  {
    icon: '💖',
    title: 'You\'re Protected!',
    message: 'Your besties will get alerted if needed',
  },
  {
    icon: '🌸',
    title: 'Live Your Best Life!',
    message: 'Be bold, be safe, be you',
  },
  {
    icon: '⭐',
    title: 'Safety Superstar!',
    message: 'You\'re setting a great example',
  },
];

const FunLoadingScreen = ({ message }) => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % SAFETY_TIPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const tip = SAFETY_TIPS[currentTip];

  return (
    <div className="fun-loading-screen">
      <div className="fun-loading-content">
        {/* Animated Icon */}
        <div className="fun-loading-icon">{tip.icon}</div>

        {/* Animated Dots */}
        <div className="fun-loading-dots">
          <div className="fun-loading-dot"></div>
          <div className="fun-loading-dot"></div>
          <div className="fun-loading-dot"></div>
        </div>

        {/* Tip Content */}
        <div className="fun-loading-tip">
          <h3 className="fun-loading-title">{tip.title}</h3>
          <p className="fun-loading-message">{tip.message}</p>
        </div>

        {/* Custom Message */}
        {message && (
          <p className="fun-loading-custom-message">{message}</p>
        )}

        {/* Progress Bar */}
        <div className="fun-loading-progress">
          <div className="fun-loading-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default FunLoadingScreen;
