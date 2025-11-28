import React from 'react';
import StatsCard from './StatsCard';

const UserBehavior = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">🕐 User Behavior</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatsCard value={`${analytics.behavior.peakHour}:00`} label="Peak Hour (24h)" colorClass="text-primary" />
        <StatsCard value={analytics.behavior.peakDay} label="Peak Day" colorClass="text-secondary" />
        <StatsCard value={`${analytics.behavior.mostCommonDuration}m`} label="Common Duration" colorClass="text-accent" />
      </div>
    </div>
  );
};

export default UserBehavior;
