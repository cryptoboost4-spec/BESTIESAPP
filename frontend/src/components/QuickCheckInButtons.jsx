import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../utils/hapticFeedback';
import RideshareModal from './checkin/RideshareModal';
import WalkingModal from './checkin/WalkingModal';
import QuickMeetModal from './checkin/QuickMeetModal';

const QuickCheckInButtons = () => {
  const navigate = useNavigate();
  const [showRideshareModal, setShowRideshareModal] = useState(false);
  const [showWalkingModal, setShowWalkingModal] = useState(false);
  const [showQuickMeetModal, setShowQuickMeetModal] = useState(false);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-display text-text-primary mb-4">Quick Check-In</h2>

        {/* Top row - 3 small buttons */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* Rideshare Button */}
          <button
            onClick={() => {
              haptic.light();
              setShowRideshareModal(true);
            }}
            className="card p-4 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-amber-400 to-orange-500 text-white"
          >
            <div className="text-3xl mb-1">🚗</div>
            <div className="font-display text-sm mb-0.5">Rideshare</div>
            <div className="text-xs opacity-90">Add rego</div>
          </button>

          {/* Walking Alone Button */}
          <button
            onClick={() => {
              haptic.light();
              setShowWalkingModal(true);
            }}
            className="card p-4 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-blue-400 to-cyan-500 text-white"
          >
            <div className="text-3xl mb-1">🚶‍♀️</div>
            <div className="font-display text-sm mb-0.5">Walking</div>
            <div className="text-xs opacity-90">Quick start</div>
          </button>

          {/* Quick Meet Button */}
          <button
            onClick={() => {
              haptic.light();
              setShowQuickMeetModal(true);
            }}
            className="card p-4 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-purple-400 to-indigo-500 text-white"
          >
            <div className="text-3xl mb-1">👤</div>
            <div className="font-display text-sm mb-0.5">Quick Meet</div>
            <div className="text-xs opacity-90">Add name</div>
          </button>
        </div>

        {/* Bottom row - Custom button full width */}
        <button
          onClick={() => {
            haptic.light();
            navigate('/create');
          }}
          className="w-full card p-4 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-rose-400 to-pink-500 text-white"
        >
          <div className="text-3xl mb-1">✨</div>
          <div className="font-display text-lg mb-0.5">Create Custom Check-In</div>
          <div className="text-sm opacity-90">Full options</div>
        </button>
      </div>

      {/* Modals */}
      {showRideshareModal && (
        <RideshareModal onClose={() => setShowRideshareModal(false)} />
      )}
      {showWalkingModal && (
        <WalkingModal onClose={() => setShowWalkingModal(false)} />
      )}
      {showQuickMeetModal && (
        <QuickMeetModal onClose={() => setShowQuickMeetModal(false)} />
      )}
    </>
  );
};

export default QuickCheckInButtons;
