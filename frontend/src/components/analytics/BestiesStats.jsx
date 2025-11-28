import React from 'react';
import StatsCard from './StatsCard';

const BestiesStats = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">💜 Besties Network</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard value={analytics.besties.totalConnections} label="Total Connections" colorClass="text-primary" />
        <StatsCard value={analytics.besties.accepted} label="Accepted" colorClass="text-success" />
        <StatsCard value={analytics.besties.pending} label="Pending" colorClass="text-warning" />
        <StatsCard value={analytics.besties.avgPerUser} label="Avg Per User" colorClass="text-secondary" />
      </div>
    </div>
  );
};

export default BestiesStats;
