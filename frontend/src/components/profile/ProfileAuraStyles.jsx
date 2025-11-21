import React from 'react';

const ProfileAuraStyles = () => {
  return (
    <style>{`
      /* Aura Animations */
      @keyframes aura-shimmer {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes aura-glow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(219, 39, 119, 0.3), 0 0 40px rgba(139, 92, 246, 0.2);
        }
        50% {
          box-shadow: 0 0 40px rgba(219, 39, 119, 0.5), 0 0 80px rgba(139, 92, 246, 0.4);
        }
      }
      @keyframes aura-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      @keyframes rainbow-border {
        0% { border-color: #ff0000; }
        16% { border-color: #ff7f00; }
        33% { border-color: #ffff00; }
        50% { border-color: #00ff00; }
        66% { border-color: #0000ff; }
        83% { border-color: #8b00ff; }
        100% { border-color: #ff0000; }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1) rotate(180deg); }
      }

      /* Aura Classes */
      .profile-card-aura-shimmer::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 3s infinite;
        pointer-events: none;
      }

      .profile-card-aura-glow {
        animation: aura-glow 3s ease-in-out infinite;
      }

      .profile-card-aura-pulse {
        animation: aura-pulse 2s ease-in-out infinite;
      }

      .profile-card-aura-rainbow {
        border: 4px solid;
        animation: rainbow-border 6s linear infinite;
      }

      .profile-card-aura-sparkle::after {
        content: '✨';
        position: absolute;
        top: 10%;
        right: 10%;
        font-size: 2rem;
        animation: sparkle 2s ease-in-out infinite;
        pointer-events: none;
      }
    `}</style>
  );
};

export default ProfileAuraStyles;
