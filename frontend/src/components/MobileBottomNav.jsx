import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTutorialSystem } from '../hooks/useTutorialSystem';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const { userData } = useAuth();

  // NEW: Use unified tutorial system hook
  const tutorial = useTutorialSystem();

  // Extract tutorial states for easier reference
  const {
    home,
    checkIn,
    bestieCircle,
    besties,
    profile,
    markComplete,
    setPostTutorialStep,
  } = tutorial;

  const isActive = (path) => location.pathname === path;

  // Check if user is in onboarding
  const isOnboarding = location.pathname === '/onboarding' || userData?.onboardingCompleted === false;

  // SIMPLIFIED: Use tutorial system state directly
  const postTutorialStep = bestieCircle.postTutorialStep;
  const bestieCircleTutorialComplete = bestieCircle.complete;
  const bestieCircleTutorialActive = bestieCircle.tutorialActive;
  const currentTutorialStep = home.currentStep;
  const currentCheckInTutorialStep = checkIn.currentStep;
  const tutorialComplete = home.complete;
  const bestiesTutorialComplete = besties.complete;
  const profileShowTutorial = !profile.complete;
  const bestiesShowTutorial = !besties.complete;

  // Besties tab should be visible when:
  // 1. Tutorial is actively running (bestieCircle_tutorialActive)
  // 2. Post-tutorial step is 'add-bestie' (just finished tutorial)
  // 3. Post-tutorial step is 'click-besties-tab' (ready to go to Besties page)
  // 4. Tutorial is completed and no post-tutorial step active (normal state)
  const isBestieCircleTutorialComplete = bestieCircleTutorialComplete &&
    (postTutorialStep === 'add-bestie' || postTutorialStep === 'click-besties-tab' || !postTutorialStep);

  // Show besties tab during active tutorial OR when complete
  const shouldShowBestiesTab = bestieCircleTutorialActive || isBestieCircleTutorialComplete;

  // Besties button should flash during post-tutorial flow when user needs to click it
  const shouldFlashBesties = (postTutorialStep === 'click-besties-tab') && !isActive('/besties');

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
                markComplete('checkIn'); // NEW: Use unified hook
                navigate('/besties', { state: { startTutorial: true } });
              }
              // Clear postTutorialStep to stop any flashing
              if (postTutorialStep) {
                setPostTutorialStep(null); // NEW: Use unified hook
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
                markComplete('besties'); // NEW: Use unified hook
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
