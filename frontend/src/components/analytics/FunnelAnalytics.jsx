import React from 'react';

const FunnelAnalytics = ({ analytics }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-4">🎯 User Funnel</h2>
      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary">1. Sign Ups</div>
              <div className="text-sm text-text-secondary">{analytics.funnel.signups} users</div>
            </div>
            <div className="text-2xl font-display text-primary">100%</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary">2. Completed Onboarding</div>
              <div className="text-sm text-text-secondary">{analytics.funnel.completedOnboarding} users</div>
            </div>
            <div className="text-2xl font-display text-success">{analytics.funnel.onboardingRate}%</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary">3. Added First Bestie</div>
              <div className="text-sm text-text-secondary">{analytics.funnel.addedBestie} users</div>
            </div>
            <div className="text-2xl font-display text-warning">{analytics.funnel.bestieRate}%</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary">4. Created First Check-in</div>
              <div className="text-sm text-text-secondary">{analytics.funnel.firstCheckIn} users</div>
            </div>
            <div className="text-2xl font-display text-accent">{analytics.funnel.checkInRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunnelAnalytics;
