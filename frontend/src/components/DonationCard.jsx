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
    <div className="card p-8 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-100 dark:border-purple-700">
      <h2 className="text-2xl font-display text-text-primary mb-4 text-center">
        Keep Besties Free 💜
      </h2>
      <p className="text-text-secondary text-center mb-6">
        Choose an amount that works for you - every bit helps keep Besties free for everyone
      </p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleDonation(1)}
          disabled={loading}
          className="btn btn-secondary p-6 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
        >
          <span className="text-2xl">☕</span>
          <span className="font-display text-xl">$1</span>
          <span className="text-xs text-text-secondary">Coffee</span>
        </button>
        <button
          onClick={() => handleDonation(5)}
          disabled={loading}
          className="btn btn-primary p-6 flex flex-col items-center gap-2 transform scale-105 shadow-lg hover:scale-110 transition-transform"
        >
          <span className="text-2xl">🍕</span>
          <span className="font-display text-xl">$5</span>
          <span className="text-xs">Pizza Slice</span>
        </button>
        <button
          onClick={() => handleDonation(10)}
          disabled={loading}
          className="btn btn-secondary p-6 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
        >
          <span className="text-2xl">🎬</span>
          <span className="font-display text-xl">$10</span>
          <span className="text-xs text-text-secondary">Movie Night</span>
        </button>
      </div>
      <p className="text-xs text-center text-text-secondary italic mb-4">
        Monthly contribution - cancel anytime, no questions asked
      </p>
      <button
        onClick={() => navigate('/about')}
        className="w-full font-semibold text-sm underline transition-colors text-primary hover:text-primary-dark dark:hover:text-primary-light"
      >
        Learn more about Besties →
      </button>
    </div>
  );
};

export default DonationCard;
