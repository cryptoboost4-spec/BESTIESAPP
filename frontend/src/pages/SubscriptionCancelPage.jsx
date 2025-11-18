import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionCancelPage = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="text-8xl mb-6">😔</div>

        <h1 className="text-4xl font-display text-text-primary mb-4">
          Subscription Cancelled
        </h1>

        <div className="card p-8 mb-6">
          <p className="text-xl text-text-secondary mb-6">
            Your subscription wasn't completed. Don't worry - you haven't been charged!
          </p>

          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 mb-6">
            <p className="text-text-primary mb-3">
              <strong>Why subscribe to SMS alerts?</strong>
            </p>
            <ul className="text-left text-sm text-text-secondary space-y-2">
              <li>✅ Get instant SMS alerts when check-ins expire</li>
              <li>✅ Your besties receive SMS notifications</li>
              <li>✅ More reliable than email for emergencies</li>
              <li>✅ Support keeps Besties free for everyone</li>
            </ul>
          </div>

          <p className="text-sm text-text-secondary mb-6">
            Only $1/month - Less than a coffee! ☕
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary px-6"
            >
              Go Home
            </button>
            <button
              onClick={handleTryAgain}
              className="btn btn-primary px-6"
            >
              Try Again →
            </button>
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Having trouble? Email us at support@bestiesapp.web.app
        </p>
      </div>
    </div>
  );
};

export default SubscriptionCancelPage;
