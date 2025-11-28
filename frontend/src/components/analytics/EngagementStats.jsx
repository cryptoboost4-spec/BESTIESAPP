import React from 'react';
import StatsCard from './StatsCard';

const EngagementStats = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">📈 Engagement</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard value={analytics.engagement.avgCheckInsPerUser} label="Check-ins/User" colorClass="text-primary" />
        <StatsCard value={analytics.engagement.avgBestiesPerUser} label="Besties/User" colorClass="text-secondary" />
        <StatsCard value={analytics.engagement.templatesCreated} label="Templates" colorClass="text-accent" />
        <StatsCard value={analytics.engagement.badgesEarned} label="Badges Earned" colorClass="text-warning" />
      </div>
    </div>
  );
};

export default EngagementStats;
