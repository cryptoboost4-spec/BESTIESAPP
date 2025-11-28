import React from 'react';
import StatsCard from './StatsCard';

const RevenueStats = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">💰 Revenue</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          value={`$${analytics.revenue.mrr}`}
          label="MRR"
          colorClass="text-white"
          bgClass="bg-gradient-primary text-white"
        />
        <StatsCard value={analytics.revenue.smsSubscribers} label="SMS Subscribers" colorClass="text-primary" />
        <StatsCard value={analytics.revenue.donorsActive} label="Active Donors" colorClass="text-secondary" />
        <StatsCard value={`$${analytics.revenue.totalDonations}`} label="Total Donated" colorClass="text-success" />
      </div>
    </div>
  );
};

export default RevenueStats;
