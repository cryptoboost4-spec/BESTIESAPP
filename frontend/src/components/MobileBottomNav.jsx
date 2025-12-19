import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCheckInTutorialState } from '../hooks/useCheckInTutorialState';
import { useSimpleTutorial } from '../hooks/useSimpleTutorial';
import { useTutorialState } from '../hooks/useTutorialState';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const { userData } = useAuth();
  const { currentCheckInTutorialStep, markCheckInTutorialComplete } = useCheckInTutorialState();
  const { currentTutorialStep, tutorialComplete } = useTutorialState();
  const { showTutorial: bestiesShowTutorial, isComplete: bestiesTutorialComplete, completeTutorial: completeBestiesTutorial } = useSimpleTutorial('besties');
  const { showTutorial: profileShowTutorial } = useSimpleTutorial('profile');

  const isActive = (path) => location.pathname === path;
  
  // Check if user is in onboarding
  const isOnboarding = location.pathname === '/onboarding' || userData?.onboardingCompleted === false;

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
    
    // Listen for custom event (immediate updates)
    const handleCustomEvent = (e) => {
      setPostTutorialStep(e.detail.step);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bestieCircle_postTutorialStep_changed', handleCustomEvent);
    
    // Also check periodically (for same-tab updates and fallback)
    const interval = setInterval(() => {
      const newStep = localStorage.getItem('bestieCircle_postTutorialStep');
      if (newStep !== postTutorialStep) {
        setPostTutorialStep(newStep);
      }
    }, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bestieCircle_postTutorialStep_changed', handleCustomEvent);
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
    
    // Listen for custom event (immediate updates)
    const handleCustomEvent = (e) => {
      setBestieCircleTutorialComplete(e.detail.complete);
    };

    // Check on mount and periodically (for same-tab updates)
    checkTutorialComplete();
    const interval = setInterval(checkTutorialComplete, 100);

    // Also listen for storage events (cross-tab) and custom events (same-tab)
    window.addEventListener('storage', checkTutorialComplete);
    window.addEventListener('bestieCircle_tutorialComplete_changed', handleCustomEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkTutorialComplete);
      window.removeEventListener('bestieCircle_tutorialComplete_changed', handleCustomEvent);
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

  // Besties button should flash during post-tutorial flow when user needs to click it
  const shouldFlashBesties = (postTutorialStep === 'click-besties-tab') && !isActive('/besties');
  // Track if Besties tooltip is dismissed (so Profile button only shows when tooltip is visible)
  const [, setBestiesTooltipDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('besties_tooltip_dismissed') === 'true';
    }
    return false;
  });

  // Listen for tooltip dismissed state changes
  useEffect(() => {
    const checkTooltipDismissed = () => {
      const dismissed = localStorage.getItem('besties_tooltip_dismissed') === 'true';
      setBestiesTooltipDismissed(dismissed);
    };
    
    // Listen for custom event (immediate updates)
    const handleCustomEvent = (e) => {
      setBestiesTooltipDismissed(e.detail.dismissed);
    };
    
    checkTooltipDismissed();
    const interval = setInterval(checkTooltipDismissed, 100);
    window.addEventListener('besties_tooltip_dismissed_changed', handleCustomEvent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('besties_tooltip_dismissed_changed', handleCustomEvent);
    };
  }, []);

  // Profile button should flash on Besties page AFTER the besties tooltip is completed, 
  // until user visits Profile (completes profile tutorial)
  const shouldFlashProfile = isActive('/besties') && bestiesTutorialComplete && profileShowTutorial;

  // Determine if we're in post-tutorial flow on home page (where Profile should be hidden)
  const isInPostTutorialFlowOnHome = (postTutorialStep === 'add-bestie' || postTutorialStep === 'click-besties-tab') && 
    !isActive('/besties') && !isActive('/profile');

  // Profile button visibility logic:
  // - Always show on /profile page
  // - Show on /besties page (with flash when tutorial tooltip visible)  
  // - Hide during post-tutorial flow on home page
  // - Otherwise show when besties tab is available and tutorials are done
  const shouldShowProfileButton = !isOnboarding && (
    isActive('/profile') ||
    isActive('/besties') ||
    (!isInPostTutorialFlowOnHome && shouldShowBestiesTab && (tutorialComplete || !currentTutorialStep) && !currentCheckInTutorialStep)
  );

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
        {/* Home button - show on besties/profile pages, or when besties tab is available */}
        {!isOnboarding && (isActive('/besties') || isActive('/profile') || shouldShowBestiesTab) && (
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
        )}

        {/* Besties button - show on besties/profile pages, or when available */}
        {!isOnboarding && (isActive('/besties') || isActive('/profile') || (shouldShowBestiesTab && (tutorialComplete || !currentTutorialStep) && !currentCheckInTutorialStep)) && (
          <Link
            to="/besties"
            onClick={(e) => {
              // If in afterSafe tutorial step, handle navigation and complete tutorial
              if (currentCheckInTutorialStep === 'afterSafe') {
                e.preventDefault();
                markCheckInTutorialComplete();
                navigate('/besties', { state: { startTutorial: true } });
              }
              // Clear postTutorialStep to stop any flashing
              if (postTutorialStep) {
                localStorage.removeItem('bestieCircle_postTutorialStep');
                setPostTutorialStep(null);
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

        {/* Profile button - show on Besties/Profile pages, hide during post-tutorial flow on home page */}
        {shouldShowProfileButton ? (
          <Link
            to="/profile"
            onClick={() => {
              // Complete besties tutorial when Profile button is clicked from besties page during tutorial
              if (isActive('/besties') && bestiesShowTutorial) {
                completeBestiesTutorial();
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
