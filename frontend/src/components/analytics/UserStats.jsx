import React from 'react';
import StatsCard from './StatsCard';

const UserStats = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">👥 Users</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard value={analytics.users.total} label="Total Users" colorClass="text-primary" />
        <StatsCard value={analytics.users.new7days} label="New (7d)" colorClass="text-success" />
        <StatsCard value={analytics.users.new30days} label="New (30d)" colorClass="text-success" />
        <StatsCard value={analytics.users.active7days} label="Active (7d)" colorClass="text-secondary" />
        <StatsCard value={analytics.users.active30days} label="Active (30d)" colorClass="text-secondary" />
      </div>
    </div>
  );
};

export default UserStats;
