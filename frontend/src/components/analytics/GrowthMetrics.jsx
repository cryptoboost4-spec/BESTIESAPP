import React from 'react';

const GrowthMetrics = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">📊 Growth Metrics</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className={`text-3xl font-display ${parseFloat(analytics.growth.userGrowthRate) >= 0 ? 'text-success' : 'text-danger'}`}>
            {analytics.growth.userGrowthRate > 0 ? '+' : ''}{analytics.growth.userGrowthRate}%
          </div>
          <div className="text-sm text-text-secondary">User Growth (WoW)</div>
        </div>
        <div className="card p-4 text-center">
          <div className={`text-3xl font-display ${parseFloat(analytics.growth.checkInGrowthRate) >= 0 ? 'text-success' : 'text-danger'}`}>
            {analytics.growth.checkInGrowthRate > 0 ? '+' : ''}{analytics.growth.checkInGrowthRate}%
          </div>
          <div className="text-sm text-text-secondary">Check-in Growth (WoW)</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-display text-primary">{analytics.growth.retentionRate}%</div>
          <div className="text-sm text-text-secondary">Retention Rate</div>
        </div>
      </div>
    </div>
  );
};

export default GrowthMetrics;
