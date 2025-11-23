import React from 'react';
import StatsCard from './StatsCard';

const CostTracking = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">💸 Cost Tracking (Estimates)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          value={`$${analytics.costs.estimatedSMS}`}
          label="SMS Costs"
          colorClass="text-danger"
          bgClass="bg-danger/10"
        />
        <StatsCard
          value={`$${analytics.costs.estimatedWhatsApp}`}
          label="WhatsApp Costs"
          colorClass="text-success"
          bgClass="bg-success/10"
        />
        <StatsCard
          value={`$${analytics.costs.estimatedEmail}`}
          label="Email Costs"
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <StatsCard value={analytics.costs.totalAlertsSent} label="Total Alerts" colorClass="text-accent" />
      </div>
    </div>
  );
};

export default CostTracking;
