import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import haptic from '../utils/hapticFeedback';
import InfoButton from './InfoButton';
import RideshareModal from './checkin/RideshareModal';
import WalkingModal from './checkin/WalkingModal';
import QuickMeetModal from './checkin/QuickMeetModal';

const QuickCheckInButtons = forwardRef(({ isTutorialMode = false, onTutorialAction, currentTutorialStep, allowQuickCheckInClick = false, onTutorialModalComplete, onModalStateChange }, ref) => {
  const navigate = useNavigate();
  const [showRideshareModal, setShowRideshareModal] = useState(false);
  const [showWalkingModal, setShowWalkingModal] = useState(false);
  const [showQuickMeetModal, setShowQuickMeetModal] = useState(false);
  
  // Refs for tutorial highlighting
  const containerRef = useRef(null);
  const threeButtonsContainerRef = useRef(null);
  const rideshareButtonRef = useRef(null);
  const walkingButtonRef = useRef(null);
  const quickMeetButtonRef = useRef(null);
  const customButtonRef = useRef(null);

  // Expose refs to parent component
  useImperativeHandle(ref, () => ({
    containerRef: containerRef.current,
    threeButtonsContainer: threeButtonsContainerRef.current,
    rideshareButton: rideshareButtonRef.current,
    walkingButton: walkingButtonRef.current,
    quickMeetButton: quickMeetButtonRef.current,
    customButton: customButtonRef.current,
  }));

  // Determine if buttons should be greyed out (welcome step) or disabled (allButtons step)
  const isGreyedOut = isTutorialMode && currentTutorialStep === 'welcome';
  const isDisabled = isTutorialMode && currentTutorialStep === 'allButtons';

  // Track modal state and notify parent when any modal opens/closes
  useEffect(() => {
    const isAnyModalOpen = showRideshareModal || showWalkingModal || showQuickMeetModal;
    onModalStateChange?.(isAnyModalOpen);
  }, [showRideshareModal, showWalkingModal, showQuickMeetModal, onModalStateChange]);

  return (
    <>
      <div ref={containerRef} className="mb-6 sticky top-0 z-[50] bg-white dark:bg-gray-900 py-2 -mx-4 px-4">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-display text-text-primary">Quick Check-In</h2>
          <InfoButton message="Start a quick safety check-in! Choose a preset (rideshare, walking, or meeting someone) or create a custom check-in. Your selected besties will be notified if you don't check back in. ✨" />
        </div>

        {/* Top row - 3 small buttons */}
        <div ref={threeButtonsContainerRef} className="grid grid-cols-3 gap-3 mb-3">
          {/* Rideshare Button */}
          <button
            ref={rideshareButtonRef}
            onClick={() => {
              if (isDisabled || (isTutorialMode && !allowQuickCheckInClick)) {
                return; // Disable during tutorial unless allowed
              }
              haptic.light();
              setShowRideshareModal(true);
            }}
            onKeyDown={(e) => {
              if (isDisabled || (isTutorialMode && !allowQuickCheckInClick)) {
                return;
              }
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                haptic.light();
                setShowRideshareModal(true);
              }
            }}
            disabled={isDisabled}
            className={`card p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white ${
              isDisabled 
                ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                : isGreyedOut 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-card-hover hover:scale-105 active:scale-95'
            } ${currentTutorialStep === 'quickCheckIns' ? 'animate-pulse ring-4 ring-primary ring-opacity-50' : ''}`}
            aria-label="Create rideshare check-in"
            tabIndex={isDisabled ? -1 : 0}
          >
            <div className="text-3xl mb-2">🚗</div>
            <div className="font-display text-sm">Rideshare</div>
          </button>

          {/* Walking Alone Button */}
          <button
            ref={walkingButtonRef}
            onClick={() => {
              if (isDisabled || (isTutorialMode && !allowQuickCheckInClick)) {
                return; // Disable during tutorial unless allowed
              }
              haptic.light();
              setShowWalkingModal(true);
            }}
            onKeyDown={(e) => {
              if (isDisabled || (isTutorialMode && !allowQuickCheckInClick)) {
                return;
              }
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                haptic.light();
                setShowWalkingModal(true);
              }
            }}
            disabled={isDisabled}
            className={`card p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-gradient-to-br from-blue-400 to-cyan-500 text-white ${
              isDisabled 
                ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                : isGreyedOut 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-card-hover hover:scale-105 active:scale-95'
            } ${currentTutorialStep === 'quickCheckIns' ? 'animate-pulse ring-4 ring-primary ring-opacity-50' : ''}`}
            aria-label="Create walking check-in"
            tabIndex={isDisabled ? -1 : 0}
          >
            <div className="text-3xl mb-2">🚶‍♀️</div>
            <div className="font-display text-sm">Walking</div>
          </button>

          {/* Quick Meet Button */}
          <button
            ref={quickMeetButtonRef}
            onClick={() => {
              if (isDisabled || (isTutorialMode && !allowQuickCheckInClick)) {
                return; // Disable during tutorial unless allowed
              }
              haptic.light();
              setShowQuickMeetModal(true);
            }}
            onKeyDown={(e) => {
              if (isDisabled || (isTutorialMode && !allowQuickCheckInClick)) {
                return;
              }
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                haptic.light();
                setShowQuickMeetModal(true);
              }
            }}
            disabled={isDisabled}
            className={`card p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-gradient-to-br from-purple-400 to-indigo-500 text-white ${
              isDisabled 
                ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                : isGreyedOut 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-card-hover hover:scale-105 active:scale-95'
            } ${currentTutorialStep === 'quickCheckIns' ? 'animate-pulse ring-4 ring-primary ring-opacity-50' : ''}`}
            aria-label="Create quick meet check-in"
            tabIndex={isDisabled ? -1 : 0}
          >
            <div className="text-3xl mb-2">👤</div>
            <div className="font-display text-sm">Quick Meet</div>
          </button>
        </div>

        {/* Bottom row - Custom button full width */}
        <button
          ref={customButtonRef}
          onClick={() => {
            if (isDisabled || (isTutorialMode && currentTutorialStep === 'quickCheckIns')) {
              return; // Disable during allButtons or quickCheckIns step
            }
            haptic.light();
            navigate('/create');
          }}
          onKeyDown={(e) => {
            if (isDisabled || (isTutorialMode && currentTutorialStep === 'quickCheckIns')) {
              return;
            }
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              haptic.light();
              navigate('/create');
            }
          }}
          disabled={isDisabled || (isTutorialMode && currentTutorialStep === 'quickCheckIns')}
          className={`w-full card p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-gradient-to-br from-rose-400 to-pink-500 text-white ${
            isDisabled || (isTutorialMode && currentTutorialStep === 'quickCheckIns')
              ? 'opacity-50 cursor-not-allowed pointer-events-none' 
              : isGreyedOut 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-card-hover hover:scale-105 active:scale-95'
          } ${currentTutorialStep === 'custom' ? 'animate-pulse ring-4 ring-primary ring-opacity-50' : ''}`}
          aria-label="Create custom check-in"
          tabIndex={isDisabled || (isTutorialMode && currentTutorialStep === 'quickCheckIns') ? -1 : 0}
        >
          <div className="text-3xl mb-2">✨</div>
          <div className="font-display text-lg">Create Custom Check-In</div>
        </button>
      </div>

      {/* Modals */}
      {showRideshareModal && (
        <RideshareModal 
          onClose={() => setShowRideshareModal(false)} 
          isTutorialMode={isTutorialMode}
          onTutorialComplete={onTutorialModalComplete}
        />
      )}
      {showWalkingModal && (
        <WalkingModal 
          onClose={() => setShowWalkingModal(false)} 
          isTutorialMode={isTutorialMode}
          onTutorialComplete={onTutorialModalComplete}
        />
      )}
      {showQuickMeetModal && (
        <QuickMeetModal 
          onClose={() => setShowQuickMeetModal(false)} 
          isTutorialMode={isTutorialMode}
          onTutorialComplete={onTutorialModalComplete}
        />
      )}
    </>
  );
});

QuickCheckInButtons.displayName = 'QuickCheckInButtons';

export default QuickCheckInButtons;
