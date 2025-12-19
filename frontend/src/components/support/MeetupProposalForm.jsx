import React, { useState } from 'react';
import haptic from '../../utils/hapticFeedback';

const WHEN_OPTIONS = ['This week', 'Next week', 'Just checking in'];
const WHAT_OPTIONS = ['Coffee', 'Meal', 'Activity', 'Just talk'];

const MeetupProposalForm = ({ isOpen, onClose, onComplete, recipientName }) => {
  const [when, setWhen] = useState('');
  const [what, setWhat] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!when || !what) {
      return;
    }

    setSubmitting(true);
    haptic.medium();

    try {
      await onComplete({
        when,
        what,
        note: note.trim() || null
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-display text-gray-900 dark:text-gray-100">
              Propose Meetup with {recipientName}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                When can you meet?
              </label>
              <select
                value={when}
                onChange={(e) => {
                  haptic.light();
                  setWhen(e.target.value);
                }}
                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none"
              >
                <option value="">Select...</option>
                {WHEN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                What for?
              </label>
              <select
                value={what}
                onChange={(e) => {
                  haptic.light();
                  setWhat(e.target.value);
                }}
                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none"
              >
                <option value="">Select...</option>
                {WHAT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Add note (optional):
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="downtown starbucks?"
                maxLength={50}
                rows={2}
                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {note.length}/50 characters
              </p>
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
              disabled={submitting || !when || !what}
              className="flex-1 btn btn-primary"
            >
              {submitting ? 'Sending...' : 'Send Proposal'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetupProposalForm;

