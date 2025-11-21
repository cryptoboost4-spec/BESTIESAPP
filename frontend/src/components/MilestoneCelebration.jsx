import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Milestone Celebration Component
 *
 * Automatically checks for and displays milestone celebrations
 * for circle anniversaries, check-in streaks, and alert responses
 */
const MilestoneCelebration = () => {
  const [milestone, setMilestone] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    checkForMilestones();
  }, []);

  const checkForMilestones = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Check for uncelebrated milestones
      const milestonesQuery = query(
        collection(db, 'circle_milestones'),
        where('userId', '==', currentUser.uid),
        where('celebrated', '==', false)
      );

      const milestonesSnap = await getDocs(milestonesQuery);

      if (!milestonesSnap.empty) {
        // Show the first uncelebrated milestone
        const firstMilestone = milestonesSnap.docs[0];
        const milestoneData = {
          id: firstMilestone.id,
          ...firstMilestone.data(),
        };

        setMilestone(milestoneData);
        setShow(true);

        // Mark as celebrated after a delay
        setTimeout(async () => {
          await updateDoc(doc(db, 'circle_milestones', firstMilestone.id), {
            celebrated: true,
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Error checking for milestones:', error);
    }
  };

  const handleClose = () => {
    setShow(false);
    setTimeout(() => setMilestone(null), 300);
  };

  if (!milestone || !show) return null;

  const getMilestoneContent = () => {
    switch (milestone.type) {
      case 'days_in_circle':
        return {
          icon: '🎉',
          title: `${milestone.value} Days Together!`,
          message: `You and ${milestone.bestie || 'your bestie'} have been in each other's circles for ${milestone.value} days. That's real commitment!`,
          color: 'from-purple-500 to-pink-500',
        };
      case 'check_ins_together':
        return {
          icon: '✅',
          title: `${milestone.value} Check-Ins Together!`,
          message: `You've done ${milestone.value} check-ins with ${milestone.bestie || 'your bestie'}. You're building serious trust!`,
          color: 'from-blue-500 to-cyan-500',
        };
      case 'alerts_responded':
        return {
          icon: '🚨',
          title: `${milestone.value} Alerts Answered!`,
          message: `You've responded to ${milestone.value} alerts. You're a real hero to your circle!`,
          color: 'from-orange-500 to-red-500',
        };
      case 'streak':
        return {
          icon: '🔥',
          title: `${milestone.value} Day Streak!`,
          message: `You've checked your circle for ${milestone.value} days in a row. Keep that energy going!`,
          color: 'from-green-500 to-emerald-500',
        };
      default:
        return {
          icon: '⭐',
          title: 'Milestone Achieved!',
          message: 'You hit an important milestone in your circle!',
          color: 'from-purple-500 to-pink-500',
        };
    }
  };

  const content = getMilestoneContent();

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div className={`bg-gradient-to-br ${content.color} p-8 rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 ${show ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti animation */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center text-white">
          {/* Icon */}
          <div className="text-7xl mb-4 animate-bounce">{content.icon}</div>

          {/* Title */}
          <h2 className="text-3xl font-display font-bold mb-3 drop-shadow-lg">
            {content.title}
          </h2>

          {/* Message */}
          <p className="text-lg mb-6 drop-shadow opacity-95">
            {content.message}
          </p>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="bg-white text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"
          >
            Awesome! 🎉
          </button>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes confetti {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(500px) rotate(720deg);
              opacity: 0;
            }
          }
          .animate-confetti {
            animation: confetti linear forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default MilestoneCelebration;
