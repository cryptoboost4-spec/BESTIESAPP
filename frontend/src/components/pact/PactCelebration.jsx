import React from 'react';
import ConfettiCelebration from '../ConfettiCelebration';
import haptic from '../../utils/hapticFeedback';

const PactCelebration = ({ isOpen, onClose, bestieName }) => {
  React.useEffect(() => {
    if (isOpen) {
      haptic.heavy();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <ConfettiCelebration />
      
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full text-center">
          {/* Content */}
          <div className="px-6 py-8">
            {/* Hearts connecting animation */}
            <div className="text-6xl mb-4 animate-bounce">
              💜 → 💜
            </div>
            
            <h2 className="text-2xl font-display text-gray-900 dark:text-gray-100 mb-2">
              You've made your Safety Pact
            </h2>
            <p className="text-lg font-semibold text-primary mb-4">
              with {bestieName} 💜
            </p>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your promise is active. Look out for each other.
            </p>

            <button
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PactCelebration;

