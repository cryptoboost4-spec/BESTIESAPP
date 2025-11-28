import React from 'react';

const SubscriptionTiers = ({ userData, handleSMSSubscription, loading }) => {
  const tiers = [
    {
      name: 'Free Forever',
      price: '$0',
      period: 'forever',
      description: 'Everything you need to stay safe',
      features: [
        'Unlimited check-ins',
        'Up to 5 besties in your circle',
        'Unlimited Messenger contacts',
        'Email alerts (unlimited)',
        'Telegram alerts (unlimited)',
        'Push notifications',
        'Privacy controls',
        'Safety & duress passcodes',
        'Activity feed & reactions',
      ],
      buttonText: 'Current Plan',
      buttonDisabled: true,
      highlighted: false,
      available: true,
    },
    {
      name: 'Premium',
      price: '$1.99',
      period: 'per month',
      description: 'SMS alerts + extended features',
      features: [
        'Everything in Free',
        '20 SMS alerts per month',
        'Priority SMS delivery',
        'Configure alerts for non-app users',
        'No weekly SMS limits',
        'Priority support',
      ],
      buttonText: userData?.smsSubscription?.active ? 'Manage Subscription' : 'Upgrade to Premium',
      buttonDisabled: loading,
      highlighted: true,
      available: true,
    },
    {
      name: 'Pro (Coming Soon)',
      price: '$7.99',
      period: 'per month',
      description: 'Advanced safety features',
      features: [
        'Everything in Premium',
        'Auto-escalation on no answer',
        'Audio/video recording to cloud during alert',
        '"Get me out of here" emergency call',
        'Live location tracking',
        'Unlimited SMS alerts',
        'AI-powered threat detection',
        'Emergency contact broadcasting',
      ],
      buttonText: 'Coming Soon',
      buttonDisabled: true,
      highlighted: false,
      available: false,
    },
  ];

  const handleTierAction = (tier) => {
    if (tier.name === 'Premium' && !userData?.smsSubscription?.active) {
      handleSMSSubscription();
    } else if (tier.name === 'Premium' && userData?.smsSubscription?.active) {
      // Handle manage subscription
      // This is already handled in PremiumSMSSection
    }
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-2xl font-display text-text-primary mb-2 text-center">Choose Your Plan</h2>
      <p className="text-text-secondary mb-6 text-center">
        Start free, upgrade anytime. All plans include core safety features.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border-2 transition-all ${
              tier.highlighted
                ? 'border-primary bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg scale-105'
                : tier.available
                ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 opacity-75'
            } p-6 flex flex-col`}
          >
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
            )}

            {!tier.available && (
              <div className="absolute -top-3 right-3 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Coming Soon
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className="text-xl font-display text-text-primary mb-1">{tier.name}</h3>
              <div className="text-3xl font-bold text-primary mb-1">
                {tier.price}
                {tier.price !== '$0' && <span className="text-lg text-text-secondary font-normal">/{tier.period.split(' ')[1]}</span>}
              </div>
              <p className="text-sm text-text-secondary">{tier.description}</p>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <svg
                    className={`w-5 h-5 flex-shrink-0 mr-2 mt-0.5 ${
                      tier.available ? 'text-green-500' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleTierAction(tier)}
              disabled={tier.buttonDisabled}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                tier.highlighted && tier.available
                  ? 'btn btn-primary'
                  : tier.available
                  ? 'btn btn-secondary'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-secondary text-center mt-6">
        All plans include unlimited besties connections via Messenger (free forever). Premium features can be cancelled anytime.
      </p>
    </div>
  );
};

export default SubscriptionTiers;
