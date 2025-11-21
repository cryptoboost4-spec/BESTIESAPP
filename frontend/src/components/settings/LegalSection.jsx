import React from 'react';

const LegalSection = ({ navigate }) => {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-text-primary mb-4">Legal & Privacy</h2>

      <div className="space-y-3">
        <button
          onClick={() => navigate('/terms')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="text-left">
            <div className="font-semibold text-text-primary">Terms of Service</div>
            <div className="text-sm text-text-secondary">Read our terms and conditions</div>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={() => navigate('/privacy')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="text-left">
            <div className="font-semibold text-text-primary">Privacy Policy</div>
            <div className="text-sm text-text-secondary">How we protect your data</div>
          </div>
          <span className="text-gray-400">→</span>
        </button>

        <button
          onClick={() => navigate('/data')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="text-left">
            <div className="font-semibold text-text-primary">Your Data</div>
            <div className="text-sm text-text-secondary">Download or delete your data</div>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>
    </div>
  );
};

export default LegalSection;
