import React from 'react';
import ProfileWithBubble from '../ProfileWithBubble';

const ReplaceModal = ({
  show,
  onClose,
  allBesties,
  circleBesties,
  onReplace
}) => {
  if (!show) return null;

  const availableBesties = allBesties.filter(
    b => !circleBesties.find(cb => cb.id === b.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-display mb-4">Replace with:</h3>
        <div className="space-y-2">
          {availableBesties.map(bestie => (
            <button
              key={bestie.id}
              onClick={() => onReplace(bestie)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ProfileWithBubble
                photoURL={bestie.photoURL}
                name={bestie.name || 'Unknown'}
                requestAttention={bestie.requestAttention}
                size="md"
                showBubble={true}
              />
              <div className="text-left">
                <div className="font-semibold">{bestie.name || 'Unknown'}</div>
              </div>
            </button>
          ))}
          {availableBesties.length === 0 && (
            <p className="text-center text-gray-500 py-4">All besties are in your circle!</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ReplaceModal;
