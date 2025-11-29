import React from 'react';

const PricingTiers = () => {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-text-primary mb-4">Pricing Plans</h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {/* Free Tier */}
        <div className="border-2 border-purple-200 dark:border-purple-700 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-display text-text-primary">Free</h3>
            <span className="text-2xl font-display text-primary">$0</span>
          </div>
          <ul className="text-sm text-text-secondary space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Facebook & Telegram notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Unlimited besties</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Check-in timers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>I'm Safe button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Meeting details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Photo upload</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Location share</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Check-in history</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Walk me home</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Rideshare</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Marketplace meet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Quick check-ins</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>SOS button</span>
            </li>
          </ul>
        </div>

        {/* $1.99 Tier */}
        <div className="border-2 border-blue-300 dark:border-blue-600 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-display text-text-primary">Essential</h3>
            <span className="text-2xl font-display text-blue-600">$1.99<span className="text-sm">/mo</span></span>
          </div>
          <p className="text-xs text-text-secondary mb-3">Everything in Free, plus:</p>
          <ul className="text-sm text-text-secondary space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span>SMS alerts - up to 15 per month</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span>No respond fallback system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">✓</span>
              <span>Higher reliability for non-app users</span>
            </li>
          </ul>
        </div>

        {/* $7.99 Tier */}
        <div className="border-2 border-amber-300 dark:border-amber-600 rounded-xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 opacity-75">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-display text-text-primary">Premium</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display text-amber-600">$7.99<span className="text-sm">/mo</span></span>
              <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full font-semibold">Coming Soon</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mb-3">Everything in Essential, plus:</p>
          <ul className="text-sm text-text-secondary space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✓</span>
              <span>Get Me Out of Here button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✓</span>
              <span>Live audio & video recording during alerts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✓</span>
              <span>Live location during alerts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✓</span>
              <span>Premium cloud backup</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">✓</span>
              <span>Premium badge</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingTiers;

