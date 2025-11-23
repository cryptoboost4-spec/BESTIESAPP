import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileWithBubble from '../ProfileWithBubble';
import SharePromptButtons from './SharePromptButtons';

const BestieSelector = ({ besties, selectedBesties, setSelectedBesties }) => {
  const navigate = useNavigate();
  const [expandedBestieShare, setExpandedBestieShare] = useState(null);

  const toggleBestie = (bestieId) => {
    if (selectedBesties.includes(bestieId)) {
      setSelectedBesties(selectedBesties.filter(id => id !== bestieId));
    } else {
      if (selectedBesties.length >= 5) {
        toast.error('Maximum 5 besties per check-in');
        return;
      }
      setSelectedBesties([...selectedBesties, bestieId]);
    }
  };

  return (
    <div className="card p-6">
      <label className="block text-lg font-display text-text-primary mb-3">
        Who should we alert? 💜
      </label>

      {besties.length === 0 ? (
        <div className="text-center py-8 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
          <p className="font-semibold text-text-primary mb-2">⚠️ No besties in your circle</p>
          <p className="text-text-secondary text-sm mb-4">Add besties to your bestie circle on the home page to create check-ins</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go to Home Page
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {besties.map((bestie) => {
            const selectionIndex = selectedBesties.indexOf(bestie.id);
            const isSelected = selectionIndex !== -1;
            const selectionNumber = isSelected ? selectionIndex + 1 : null;
            const isShareExpanded = expandedBestieShare === bestie.id;

            return (
              <div key={bestie.id} className="w-full">
                <button
                  type="button"
                  onClick={() => (bestie.phone && bestie.smsEnabled) && toggleBestie(bestie.id)}
                  disabled={!bestie.phone || !bestie.smsEnabled}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    !bestie.phone || !bestie.smsEnabled
                      ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 opacity-60'
                      : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <ProfileWithBubble
                        photoURL={bestie.photoURL}
                        name={bestie.name || bestie.email || 'Unknown'}
                        requestAttention={bestie.requestAttention}
                        size="md"
                        showBubble={true}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-text-primary">{bestie.name || bestie.email || 'Unknown'}</div>
                        <div className="text-sm text-text-secondary">
                          {!bestie.phone
                            ? '⚠️ No phone number'
                            : !bestie.smsEnabled
                            ? '⚠️ SMS alerts not enabled'
                            : bestie.email || bestie.phone}
                        </div>
                      </div>
                    </div>
                    {bestie.phone ? (
                      isSelected && (
                        <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                          {selectionNumber}/5
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedBestieShare(isShareExpanded ? null : bestie.id);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        Ask to Add
                      </button>
                    )}
                  </div>
                </button>

                {/* Social Share Menu for No Phone */}
                {!bestie.phone && isShareExpanded && (
                  <SharePromptButtons
                    bestieName={bestie.name}
                    onClose={() => setExpandedBestieShare(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-sm text-primary font-semibold">
        Selected: {selectedBesties.length}/5
      </div>
    </div>
  );
};

export default BestieSelector;
