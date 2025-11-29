import React from 'react';
import StatsCard from './StatsCard';

const EngagementStats = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">📈 Engagement</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatsCard value={analytics.engagement.avgCheckInsPerUser} label="Check-ins/User" colorClass="text-primary" />
        <StatsCard value={analytics.engagement.avgBestiesPerUser} label="Besties/User" colorClass="text-secondary" />
        <StatsCard value={analytics.engagement.templatesCreated} label="Templates" colorClass="text-accent" />
        <StatsCard value={analytics.engagement.badgesEarned} label="Badges Earned" colorClass="text-warning" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard value={analytics.engagement.timesSelectedAsEmergency} label="Times Selected as Emergency Contact" colorClass="text-red-500" />
        <StatsCard value={analytics.engagement.daysActive} label="Avg Days Active" colorClass="text-green-500" />
        <StatsCard value={analytics.engagement.weekendCheckIns} label="Weekend Check-ins" colorClass="text-purple-500" />
        <StatsCard value={analytics.engagement.nightCheckIns} label="Night Check-ins (9pm-6am)" colorClass="text-indigo-500" />
      </div>
    </div>
  );
};

export default EngagementStats;
