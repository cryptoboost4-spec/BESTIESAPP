import React from 'react';

const CircleAnimations = () => {
  return (
    <style>{`
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translate(-50%, -10px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      .animate-fade-in {
        animation: fade-in 0.2s ease-out forwards;
      }
      @keyframes breathe {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }
      .animate-breathe {
        animation: breathe 4s ease-in-out infinite;
      }
      .animate-breathe-subtle {
        animation: breathe 5s ease-in-out infinite;
      }
      @keyframes breathe-glow {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 10px 40px rgba(251, 191, 36, 0.4), 0 0 20px rgba(251, 191, 36, 0.6);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 15px 60px rgba(251, 191, 36, 0.6), 0 0 30px rgba(251, 191, 36, 0.8);
        }
      }
      .animate-breathe-glow {
        animation: breathe-glow 3s ease-in-out infinite;
      }
      @keyframes pulse-glow {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.05);
        }
      }
      .animate-pulse-glow {
        animation: pulse-glow 2s ease-in-out infinite;
      }
      @keyframes pulse-gentle {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.9;
        }
      }
      .animate-pulse-gentle {
        animation: pulse-gentle 2s ease-in-out infinite;
      }
      @keyframes pulse-slow {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }
      .animate-pulse-slow {
        animation: pulse-slow 2s ease-in-out infinite;
      }
      @keyframes pulse-connection {
        0%, 100% {
          opacity: 0.8;
        }
        50% {
          opacity: 1;
        }
      }
      .animate-pulse-connection {
        animation: pulse-connection 3s ease-in-out infinite;
      }
      @keyframes particle {
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
      .animate-particle {
        animation: particle 3s linear infinite;
      }
      @keyframes gradient-shift {
        0%, 100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }
      .animate-gradient-shift {
        background: linear-gradient(120deg, #fdf2f8, #fce7f3, #fff7ed, #fef3c7);
        background-size: 200% 200%;
        animation: gradient-shift 8s ease infinite;
      }
    `}</style>
  );
};

export default CircleAnimations;
