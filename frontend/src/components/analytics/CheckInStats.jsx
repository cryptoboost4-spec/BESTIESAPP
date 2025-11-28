import React from 'react';
import StatsCard from './StatsCard';

const CheckInStats = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">✅ Check-ins</h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatsCard value={analytics.checkIns.total} label="Total" colorClass="text-primary" />
        <StatsCard value={analytics.checkIns.active} label="Active Now" colorClass="text-warning" />
        <StatsCard value={analytics.checkIns.completed} label="Completed" colorClass="text-success" />
        <StatsCard value={analytics.checkIns.alerted} label="Alerted" colorClass="text-danger" />
        <StatsCard value={analytics.checkIns.avgDuration} label="Avg Minutes" colorClass="text-accent" />
        <StatsCard value={`${analytics.checkIns.completionRate}%`} label="Completion" colorClass="text-success" />
      </div>
    </div>
  );
};

export default CheckInStats;
