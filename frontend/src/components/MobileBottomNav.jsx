import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useCheckInTutorialState } from '../hooks/useCheckInTutorialState';
import { useBestiesTutorialState } from '../hooks/useBestiesTutorialState';
import { useTutorialState } from '../hooks/useTutorialState';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const { currentCheckInTutorialStep, markCheckInTutorialComplete } = useCheckInTutorialState();
  const { currentTutorialStep, tutorialComplete } = useTutorialState();
  const tutorial = useBestiesTutorialState();

  const isActive = (path) => location.pathname === path;

  // Check if we're in post-tutorial flow (hide profile menu)
  const [postTutorialStep, setPostTutorialStep] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bestieCircle_postTutorialStep');
    }
    return null;
  });

  useEffect(() => {
    // Listen for changes
    const handleStorageChange = () => {
      const newStep = localStorage.getItem('bestieCircle_postTutorialStep');
      setPostTutorialStep(newStep);
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically (for same-tab updates)
    const interval = setInterval(() => {
      const newStep = localStorage.getItem('bestieCircle_postTutorialStep');
      if (newStep !== postTutorialStep) {
        setPostTutorialStep(newStep);
      }
    }, 100);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [postTutorialStep]);

  // Check if Bestie Circle tutorial is completed
  // Besties menu should be visible once tutorial completes
  // Use state to react to localStorage changes
  const [bestieCircleTutorialComplete, setBestieCircleTutorialComplete] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bestieCircle_tutorialComplete') === 'true';
    }
    return false;
  });

  // Listen for localStorage changes to show Besties tab when tooltip appears
  useEffect(() => {
    const checkTutorialComplete = () => {
      const isComplete = localStorage.getItem('bestieCircle_tutorialComplete') === 'true';
      setBestieCircleTutorialComplete(isComplete);
    };

    // Check on mount and periodically (for same-tab updates)
    checkTutorialComplete();
    const interval = setInterval(checkTutorialComplete, 100);

    // Also listen for storage events (cross-tab)
    window.addEventListener('storage', checkTutorialComplete);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkTutorialComplete);
    };
  }, []);

  // Track if Bestie Circle tutorial is actively running
  const [bestieCircleTutorialActive, setBestieCircleTutorialActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bestieCircle_tutorialActive') === 'true';
    }
    return false;
  });

  // Listen for tutorial active state changes
  useEffect(() => {
    const checkTutorialActive = () => {
      const isActive = localStorage.getItem('bestieCircle_tutorialActive') === 'true';
      setBestieCircleTutorialActive(isActive);
    };

    checkTutorialActive();
    const interval = setInterval(checkTutorialActive, 100);
    window.addEventListener('storage', checkTutorialActive);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkTutorialActive);
    };
  }, []);

  // Besties tab should only be visible when:
  // 1. Tutorial is actively running (bestieCircle_tutorialActive)
  // 2. Post-tutorial step is 'click-besties-tab'
  // 3. Tutorial is completed and no post-tutorial step active (normal state)
  const isBestieCircleTutorialComplete = bestieCircleTutorialComplete &&
    (postTutorialStep === 'click-besties-tab' || !postTutorialStep);

  // Show besties tab during active tutorial OR when complete
  const shouldShowBestiesTab = bestieCircleTutorialActive || isBestieCircleTutorialComplete;

  // Check if buttons should flash
  // Flash during: tutorial active, afterSafe step, add-bestie step, click-besties-tab step
  // Stops when: skip is clicked OR besties button itself is clicked (handled by clearing postTutorialStep/tutorialActive)
  const shouldFlashBesties = bestieCircleTutorialActive ||
    currentCheckInTutorialStep === 'afterSafe' ||
    postTutorialStep === 'add-bestie' ||
    postTutorialStep === 'click-besties-tab';
  // Profile button should flash when Besties tutorial is active (on Besties page)
  const shouldFlashProfile = tutorial.tutorialActive && tutorial.currentStep === 1;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg z-[9999] transition-colors`}
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%'
      }}
    >
      <div
        className="flex items-center justify-around py-3"
        style={{
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingTop: '12px'
        }}
      >
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-primary' : (isDark ? 'text-gray-300' : 'text-text-secondary')
            }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-semibold">Home</span>
        </Link>

        {/* Only show Besties button during active tutorial OR after completed */}
        {shouldShowBestiesTab && (tutorialComplete || !currentTutorialStep) && !currentCheckInTutorialStep && !tutorial.tutorialActive && (
          <Link
            to="/besties"
            onClick={(e) => {
              // If in afterSafe tutorial step, handle navigation and complete tutorial
              if (currentCheckInTutorialStep === 'afterSafe') {
                e.preventDefault();
                markCheckInTutorialComplete();
                navigate('/besties', { state: { startTutorial: true } });
              }
            }}
            className={`flex flex-col items-center gap-1 transition-colors relative ${isActive('/besties') ? 'text-primary' : (isDark ? 'text-gray-300' : 'text-text-secondary')
              } ${shouldFlashBesties ? 'animate-pulse' : ''}`}
            style={shouldFlashBesties ? {
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
              borderRadius: '12px',
              padding: '8px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite alternate'
            } : {}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-semibold">Besties</span>
          </Link>
        )}

        {/* Profile button - hidden during any tutorial, visible on Besties page during tutorial step 1 */}
        {((!postTutorialStep || postTutorialStep === 'null') && (tutorialComplete || !currentTutorialStep) && !currentCheckInTutorialStep) || (isActive('/besties') && tutorial.tutorialActive && tutorial.currentStep === 1) ? (
          <Link
            to="/profile"
            onClick={() => {
              // If besties tutorial is active, complete it so profile tutorial can start
              if (tutorial.tutorialActive && tutorial.currentStep === 1) {
                tutorial.completeTutorial();
              }
            }}
            className={`flex flex-col items-center gap-1 transition-colors relative ${isActive('/profile') ? 'text-primary' : (isDark ? 'text-gray-300' : 'text-text-secondary')
              } ${shouldFlashProfile ? 'animate-pulse' : ''}`}
            style={shouldFlashProfile ? {
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
              borderRadius: '12px',
              padding: '8px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite alternate'
            } : {}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-semibold">Profile</span>
          </Link>
        ) : null}
      </div>
      <style>{`
        @keyframes glow {
          from {
            box-shadow: 0 0 10px rgba(236, 72, 153, 0.4);
          }
          to {
            box-shadow: 0 0 30px rgba(236, 72, 153, 0.8);
          }
        }
      `}</style>
    </nav>
  );
};

export default MobileBottomNav;
