import React from 'react';

const BadgeSystem = ({ badges = [] }) => {
  const allBadges = [
    { id: 'guardian_1', name: 'Helper', icon: '🛡️', category: 'guardian', requirement: 1 },
    { id: 'guardian_5', name: 'Protector', icon: '🛡️✨', category: 'guardian', requirement: 5 },
    { id: 'guardian_10', name: 'Guardian', icon: '🛡️⭐', category: 'guardian', requirement: 10 },
    { id: 'besties_5', name: 'Friend Circle', icon: '💜', category: 'besties', requirement: 5 },
    { id: 'besties_10', name: 'Squad Goals', icon: '💜✨', category: 'besties', requirement: 10 },
    { id: 'donor_10', name: 'Supporter', icon: '💝', category: 'donor', requirement: 10 },
    { id: 'donor_25', name: 'Champion', icon: '💝✨', category: 'donor', requirement: 25 },
    { id: 'checkin_10', name: 'Safety First', icon: '✅', category: 'checkins', requirement: 10 },
    { id: 'checkin_50', name: 'Safety Pro', icon: '✅⭐', category: 'checkins', requirement: 50 },
  ];

  const earnedBadgeIds = badges.map(b => b.id);

  return (
    <div className="grid grid-cols-3 gap-4">
      {allBadges.map((badge) => {
        const isEarned = earnedBadgeIds.includes(badge.id);
        
        return (
          <div
            key={badge.id}
            className={`card p-4 text-center transition-all ${
              isEarned
                ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20'
                : 'opacity-50 grayscale'
            }`}
          >
            <div className="text-4xl mb-2">{badge.icon}</div>
            <div className="font-semibold text-sm text-text-primary mb-1">
              {badge.name}
            </div>
            <div className="text-xs text-text-secondary">
              {isEarned ? 'Earned!' : `Need ${badge.requirement}`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeSystem;
