import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const PremiumSMSSection = ({ userData, currentUser, loading, setLoading, navigate }) => {
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Load credit balance on mount
  useEffect(() => {
    const loadCredits = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const smsCredits = data.smsCredits || {};

          // Calculate total balance (frontend display only)
          const balance = (smsCredits.freeCredits || 0) +
                         (smsCredits.subscriptionCredits || 0) +
                         (smsCredits.extraCredits || 0);

          setCredits({
            balance,
            free: smsCredits.freeCredits || 0,
            subscription: smsCredits.subscriptionCredits || 0,
            extra: smsCredits.extraCredits || 0,
            freeExpiresAt: smsCredits.freeCreditsExpireAt,
            renewsAt: smsCredits.subscriptionRenewsAt
          });
        }
      } catch (error) {
        console.error('Error loading SMS credits:', error);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadCredits();

    // Refresh credits every 30 seconds
    const interval = setInterval(loadCredits, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({
        amount: 2,
        type: 'subscription'
      });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to start subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyExtra = async () => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({
        amount: 1.50,
        type: 'sms_extra'
      });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to purchase extra credits');
      }
    } catch (error) {
      console.error('Extra credits error:', error);

      // Show helpful error message
      if (error.message?.includes('active SMS subscription')) {
        toast.error('You need an active $2/month subscription first');
      } else {
        toast.error(error.message || 'Failed to purchase extra credits');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
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
  };

  // Helper to format expiration date
  const formatExpiration = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate();
    const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'expired';
  };

  // No subscription - show subscribe option
  if (!userData?.smsSubscription?.active) {
    return (
      <div className="card p-6 mb-6 bg-gradient-secondary dark:from-purple-900/30 dark:to-pink-900/30">
        <h2 className="text-xl font-display text-text-primary mb-2">SMS Credit System</h2>
        <p className="text-text-secondary mb-4">
          Get 15 SMS credits per month for just $2/month
        </p>

        {/* Show free credits if user has any */}
        {!loadingCredits && credits && credits.free > 0 && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-600">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              🎁 You have {credits.free} free SMS credits!
            </p>
            {credits.freeExpiresAt && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Expires in {formatExpiration(credits.freeExpiresAt)}
              </p>
            )}
          </div>
        )}

        <ul className="text-sm text-text-secondary mb-4 space-y-1">
          <li>✓ 15 SMS credits per month</li>
          <li>✓ Credits refresh on your subscription anniversary</li>
          <li>✓ Buy extra credits for $1.50 (15 more credits)</li>
          <li>✓ 1 credit = 1 SMS alert to 1 bestie</li>
        </ul>

        <div className="flex gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Loading...' : 'Subscribe for $2/month'}
          </button>
          <button
            onClick={() => navigate('/about')}
            className="btn btn-secondary"
          >
            Learn More
          </button>
        </div>
      </div>
    );
  }

  // Has subscription - show credit balance and management
  return (
    <div className="card p-6 mb-6 bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-display text-text-primary mb-1">
            ✅ SMS Credits Active
          </h2>
          <p className="text-sm text-text-secondary">
            $2/month subscription
          </p>
        </div>

        {/* Credit Balance Display */}
        {!loadingCredits && credits && (
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {credits.balance}
            </div>
            <div className="text-xs text-text-secondary">
              credits remaining
            </div>
          </div>
        )}
      </div>

      {/* Credit Breakdown (optional tooltip) */}
      {!loadingCredits && credits && (credits.free > 0 || credits.extra > 0) && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-text-secondary mb-2">Credit Breakdown:</p>
          <div className="space-y-1 text-xs">
            {credits.subscription > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Subscription credits:</span>
                <span className="font-medium text-text-primary">{credits.subscription}</span>
              </div>
            )}
            {credits.extra > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Extra purchased:</span>
                <span className="font-medium text-text-primary">{credits.extra}</span>
              </div>
            )}
            {credits.free > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Free promotional:</span>
                <span className="font-medium text-text-primary">{credits.free}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expiration warning */}
      {credits && credits.renewsAt && (
        <p className="text-xs text-text-secondary mb-4">
          Credits refresh in {formatExpiration(credits.renewsAt)}
        </p>
      )}

      {/* Low balance warning */}
      {credits && credits.balance < 5 && credits.balance > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-600">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            ⚠️ Low on credits! Consider buying more.
          </p>
        </div>
      )}

      {/* Zero balance warning */}
      {credits && credits.balance === 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-600">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            🚫 No credits remaining! Buy extra credits to send SMS alerts.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleBuyExtra}
          disabled={loading}
          className="btn btn-primary flex-1"
        >
          {loading ? 'Loading...' : 'Buy 15 More Credits ($1.50)'}
        </button>
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className="btn btn-secondary"
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );
};

export default PremiumSMSSection;
