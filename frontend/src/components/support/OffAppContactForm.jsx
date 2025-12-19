import React, { useState } from 'react';
import haptic from '../../utils/hapticFeedback';

const METHOD_OPTIONS = ['Texted', 'Called', 'Instagram', 'Other'];
const OUTCOME_OPTIONS = [
  { emoji: '😊', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'No response' }
];

const OffAppContactForm = ({ isOpen, onClose, onComplete, recipientName }) => {
  const [method, setMethod] = useState('');
  const [outcome, setOutcome] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!method || !outcome) {
      return;
    }

    setSubmitting(true);
    haptic.medium();

    try {
      await onComplete({
        method,
        outcome
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-display text-gray-900 dark:text-gray-100">
              Log Your Outreach
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                How did you reach out?
              </label>
              <select
                value={method}
                onChange={(e) => {
                  haptic.light();
                  setMethod(e.target.value);
                }}
                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none"
              >
                <option value="">Select...</option>
                {METHOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                How did it go?
              </label>
              <div className="space-y-2">
                {OUTCOME_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      haptic.light();
                      setOutcome(option.label);
                    }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      outcome === option.label
                        ? 'border-primary bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                    }`}
                  >
                    <span className="text-lg mr-2">{option.emoji}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !method || !outcome}
              className="flex-1 btn btn-primary"
            >
              {submitting ? 'Logging...' : 'Log It'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OffAppContactForm;

