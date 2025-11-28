import React from 'react';
import toast from 'react-hot-toast';
import apiService from '../../services/api';

const PremiumSMSSection = ({ userData, handleSMSSubscription, loading, setLoading, navigate, smsEnabled }) => {
  // Only show if SMS is enabled
  if (!smsEnabled) {
    return null;
  }

  return (
    <>
      {!userData?.smsSubscription?.active ? (
        <div className="card p-6 mb-6 bg-gradient-secondary dark:from-purple-900/30 dark:to-pink-900/30">
          <h2 className="text-xl font-display text-text-primary mb-2">Premium SMS Alerts</h2>
          <p className="text-text-secondary mb-4">
            Get up to 20 SMS alerts per month for just $1.99/month
          </p>
          <ul className="text-sm text-text-secondary mb-4 space-y-1">
            <li>✓ 20 SMS alerts per month</li>
            <li>✓ Priority delivery</li>
            <li>✓ No weekly limits</li>
          </ul>
          <div className="flex gap-3">
            <button
              onClick={handleSMSSubscription}
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              Subscribe for $1.99/month
            </button>
            <button
              onClick={() => navigate('/about')}
              className="btn btn-secondary"
            >
              Learn More
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-6 bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600">
          <h2 className="text-xl font-display text-text-primary mb-2">✅ Premium SMS Active</h2>
          <p className="text-text-secondary mb-4">
            You're subscribed to premium SMS alerts - up to 20 SMS per month
          </p>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const result = await apiService.createPortalSession();
                if (result.data && result.data.url) {
                  window.location.href = result.data.url;
                } else {
                  toast.error('Failed to open subscription portal');
                }
              } catch (error) {
                console.error('Portal session error:', error);
                toast.error('Failed to open subscription portal');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </button>
        </div>
      )}
    </>
  );
};

export default PremiumSMSSection;
