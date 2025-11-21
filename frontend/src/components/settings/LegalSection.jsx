import React from 'react';

const LegalSection = ({ navigate }) => {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-text-primary mb-4">Legal & Privacy</h2>

      <div className="space-y-3">
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="font-semibold text-text-primary">Privacy Policy</div>
              <div className="text-xs text-text-secondary">How we protect your data</div>
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-500">→</span>
        </a>

        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <div className="font-semibold text-text-primary">Terms of Service</div>
              <div className="text-xs text-text-secondary">Terms and conditions</div>
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-500">→</span>
        </a>

        <a
          href="/about"
          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💕</span>
            <div>
              <div className="font-semibold text-text-primary">About Besties</div>
              <div className="text-xs text-text-secondary">Our story and mission</div>
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-500">→</span>
        </a>
      </div>
    </div>
  );
};

export default LegalSection;
