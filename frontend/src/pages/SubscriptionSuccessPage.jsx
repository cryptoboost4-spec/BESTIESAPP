import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/settings');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>

        <h1 className="text-4xl font-display text-white mb-4">
          Thank You for Subscribing!
        </h1>

        <div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
          <p className="text-xl text-text-primary mb-4">
            Your subscription is being activated...
          </p>

          <div className="bg-primary/10 rounded-xl p-6 mb-6">
            <p className="text-text-primary mb-4">
              <strong>You're helping keep Besties free for everyone!</strong> 💜
            </p>
            <p className="text-sm text-text-secondary">
              Your {userData?.smsSubscription?.active ? 'SMS alerts' : 'support'} subscription
              helps us keep Besties accessible to everyone who needs it.
              Together, we're making the world a safer place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">🔒</div>
              <div className="font-semibold">Secure</div>
              <div className="text-text-secondary">Protected by Stripe</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">📱</div>
              <div className="font-semibold">Active</div>
              <div className="text-text-secondary">SMS alerts enabled</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="font-semibold">Anytime</div>
              <div className="text-text-secondary">Cancel anytime</div>
            </div>
          </div>
        </div>

        <p className="text-white/80 text-sm mb-4">
          Redirecting to settings in 5 seconds...
        </p>

        <button
          onClick={() => navigate('/settings')}
          className="btn bg-white text-primary hover:bg-white/90 px-8 py-3"
        >
          Go to Settings Now →
        </button>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
