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
        <div className="grid grid-cols-2 gap-4">
          {/* Rideshare Button */}
          <button
            onClick={() => {
              haptic.light();
              setShowRideshareModal(true);
            }}
            className="card p-6 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-amber-400 to-orange-500 text-white"
          >
            <div className="text-4xl mb-2">🚗</div>
            <div className="font-display text-lg mb-1">Rideshare</div>
            <div className="text-sm opacity-90">Add rego</div>
          </button>

          {/* Walking Alone Button */}
          <button
            onClick={() => {
              haptic.light();
              setShowWalkingModal(true);
            }}
            className="card p-6 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-blue-400 to-cyan-500 text-white"
          >
            <div className="text-4xl mb-2">🚶‍♀️</div>
            <div className="font-display text-lg mb-1">Walking</div>
            <div className="text-sm opacity-90">Quick start</div>
          </button>

          {/* Quick Meet Button */}
          <button
            onClick={() => {
              haptic.light();
              setShowQuickMeetModal(true);
            }}
            className="card p-6 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-purple-400 to-indigo-500 text-white"
          >
            <div className="text-4xl mb-2">👤</div>
            <div className="font-display text-lg mb-1">Quick Meet</div>
            <div className="text-sm opacity-90">Add name</div>
          </button>

          {/* Custom Check-In Button - Spans 2 columns */}
          <button
            onClick={() => {
              haptic.light();
              navigate('/create');
            }}
            className="col-span-2 card p-6 hover:shadow-card-hover transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-rose-400 to-pink-500 text-white"
          >
            <div className="text-4xl mb-2">✨</div>
            <div className="font-display text-xl mb-1">Create Custom Check-In</div>
            <div className="text-sm opacity-90">Full options</div>
          </button>
        </div>
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
