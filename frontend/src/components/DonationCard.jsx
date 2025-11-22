import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const DonationCard = () => {
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
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
      <div className="flex items-center justify-center gap-2 mb-4">
        <h2 className="text-2xl font-display text-text-primary text-center">
          Keep Besties Free 💜
        </h2>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-purple-600 transition-colors cursor-help"
          >
            ?
          </button>
          {showTooltip && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-purple-500 text-white text-xs p-3 rounded-lg shadow-xl z-50">
              <div className="font-semibold mb-1">Your Support Matters 💜</div>
              <p className="leading-relaxed">
                Every donation helps us keep Besties completely free for everyone. No ads, no premium tiers, just safety for all. Your kindness keeps girls safe! 🌟
              </p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-500"></div>
            </div>
          )}
        </div>
      </div>
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
