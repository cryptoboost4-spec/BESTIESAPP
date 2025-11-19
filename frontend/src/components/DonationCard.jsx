import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const DonationCard = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDonation = async (amount) => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({ amount, type: 'donation' });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to start donation');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to start donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">💜</div>
        <h3 className="font-display text-xl text-text-primary mb-2">
          Keep Besties Free
        </h3>
        <p className="text-text-secondary text-sm">
          Your donation helps us keep safety accessible to everyone
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleDonation(1)}
            disabled={loading}
            className="btn btn-secondary text-sm"
          >
            $1/mo
          </button>
          <button
            onClick={() => handleDonation(5)}
            disabled={loading}
            className="btn btn-primary text-sm"
          >
            $5/mo
          </button>
          <button
            onClick={() => handleDonation(10)}
            disabled={loading}
            className="btn btn-secondary text-sm"
          >
            $10/mo
          </button>
        </div>

        <button
          onClick={() => navigate('/about')}
          className="w-full text-primary hover:text-primary-dark font-semibold text-sm underline transition-colors"
        >
          Learn more about Besties →
        </button>

        <div className="text-xs text-text-secondary text-center">
          100% goes to keeping the app free 💜
        </div>
      </div>
    </div>
  );
};

export default DonationCard;
