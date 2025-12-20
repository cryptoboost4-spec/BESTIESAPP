import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { authService } from '../services/firebase';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';
import ProfileWithBubble from './ProfileWithBubble';
import AnimatedProfilePicture from './AnimatedProfilePicture';
import { useTutorialSystem } from '../hooks/useTutorialSystem';

const Header = () => {
  const { userData } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // NEW: Use unified tutorial system hook
  const tutorial = useTutorialSystem();

  // Extract tutorial states for easier reference
  const {
    home,
    checkIn,
    bestieCircle,
    besties,
    markComplete,
    setPostTutorialStep,
  } = tutorial;

  const isActive = (path) => location.pathname === path;

  // SIMPLIFIED: Use tutorial system state directly
  const postTutorialStep = bestieCircle.postTutorialStep;
  const bestieCircleTutorialComplete = bestieCircle.complete;
  const bestieCircleTutorialActive = bestieCircle.tutorialActive;
  const currentTutorialStep = home.currentStep;
  const currentCheckInTutorialStep = checkIn.currentStep;

  // Besties tab should be visible when:
  // 1. Tutorial is actively running (bestieCircle_tutorialActive)
  // 2. Post-tutorial step is 'add-bestie' (just finished tutorial)
  // 3. Post-tutorial step is 'click-besties-tab' (ready to go to Besties page)
  // 4. Tutorial is completed and no post-tutorial step active (normal state)
  const isBestieCircleTutorialComplete = bestieCircleTutorialComplete &&
    (postTutorialStep === 'add-bestie' || postTutorialStep === 'click-besties-tab' || !postTutorialStep);

  // Show besties tab during active tutorial OR when complete
  const shouldShowBestiesTab = bestieCircleTutorialActive || isBestieCircleTutorialComplete;

  // Check if buttons should flash
  // Flash during: afterSafe step, add-bestie step, click-besties-tab step
  // NOT during bestieCircleTutorialActive (that's the Besties page tutorial, we don't want flashing there)
  // Stops when: skip is clicked OR besties button itself is clicked
  const shouldFlashBesties =
    currentCheckInTutorialStep === 'afterSafe' ||
    postTutorialStep === 'add-bestie' ||
    postTutorialStep === 'click-besties-tab';
  // Profile button should flash when Besties tutorial is active (on Besties page)
  const shouldFlashProfile = besties.complete === false && isActive('/besties');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  const handleSignOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      toast.success('Signed out successfully');
      navigate('/login');
    } else {
      toast.error('Sign out failed');
    }
  };

  return (
    <>
      {/* Desktop Header - hidden on mobile, visible on desktop */}
      <header className={`hidden md:block ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm sticky top-0 z-40 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="font-display text-2xl text-gradient">Besties</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {/* Only show Home button after Bestie Circle tutorial is complete AND when home tutorial is not active */}
              {isBestieCircleTutorialComplete && !currentTutorialStep && (
                <Link
                  to="/"
                  className={`font-semibold transition-colors ${isActive('/') ? 'text-primary' : (isDark ? 'text-gray-300 hover:text-primary' : 'text-text-secondary hover:text-primary')
                    }`}
                >
                  Home
                </Link>
              )}
              {/* Only show Besties button during active tutorial OR after completed */}
              {shouldShowBestiesTab && (
                <Link
                  to="/besties"
                  onClick={(e) => {
                    // If in afterSafe tutorial step, handle navigation and complete tutorial
                    if (currentCheckInTutorialStep === 'afterSafe') {
                      e.preventDefault();
                      markComplete('checkIn'); // NEW: Use unified hook
                      navigate('/besties', { state: { startTutorial: true } });
                    }
                    // If flashing from click-besties-tab step, clear it to stop flashing
                    if (postTutorialStep === 'click-besties-tab') {
                      setPostTutorialStep(null); // NEW: Use unified hook
                    }
                  }}
                  className={`font-semibold transition-colors relative px-3 py-1 rounded ${isActive('/besties') ? 'text-primary' : (isDark ? 'text-gray-300 hover:text-primary' : 'text-text-secondary hover:text-primary')
                    } ${shouldFlashBesties ? 'animate-pulse' : ''}`}
                  style={shouldFlashBesties ? {
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite alternate'
                  } : {}}
                >
                  Besties
                </Link>
              )}
              {/* Profile button - hidden during post-tutorial flow on HomePage, visible on Besties page during tutorial */}
              {((!postTutorialStep || postTutorialStep === 'null') || (isActive('/besties') && !besties.complete)) && (
                <Link
                  to="/profile"
                  onClick={() => {
                    // If besties tutorial is active, complete it and mark that we're going to profile tutorial
                    if (isActive('/besties') && !besties.complete) {
                      markComplete('besties'); // NEW: Use unified hook
                      // Mark that we're coming from Besties tutorial so Profile tutorial auto-starts
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('fromBestiesTutorial', 'true');
                      }
                    }
                  }}
                  className={`font-semibold transition-colors relative px-3 py-1 rounded ${isActive('/profile') ? 'text-primary' : (isDark ? 'text-gray-300 hover:text-primary' : 'text-text-secondary hover:text-primary')
                    } ${shouldFlashProfile ? 'animate-pulse' : ''}`}
                  style={shouldFlashProfile ? {
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s ease-in-out infinite alternate'
                  } : {}}
                >
                  Profile
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Menu - hidden during tutorials, shown after bestie circle tutorial is complete and user has interacted with post-tutorial tooltip */}
              {(!postTutorialStep || postTutorialStep === 'null') && bestieCircleTutorialComplete && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="hover:opacity-90 transition-opacity relative"
                  >
                    {/* Use animated profile picture if no attention request, otherwise show regular with bubble */}
                    {userData?.requestAttention?.active ? (
                      <ProfileWithBubble
                        photoURL={userData?.photoURL}
                        name={userData?.displayName || 'User'}
                        requestAttention={userData?.requestAttention}
                        size="md"
                        showBubble={true}
                      />
                    ) : (
                      <AnimatedProfilePicture
                        photoURL={userData?.photoURL}
                        name={userData?.displayName || 'User'}
                        size="md"
                      />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className={`absolute right-0 mt-2 w-48 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border overflow-hidden animate-scale-up transition-colors`}>
                      <div className={`px-4 py-3 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                        <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-text-primary'} truncate`}>
                          {userData?.displayName || 'User'}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-text-secondary'} truncate`}>
                          {userData?.email}
                        </div>
                      </div>

                      {(!postTutorialStep || postTutorialStep === 'null') && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/profile');
                          }}
                          className={`w-full px-4 py-2 text-left ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-50 text-text-primary'} transition-colors flex items-center gap-2`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/settings');
                        }}
                        className={`w-full px-4 py-2 text-left ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-50 text-text-primary'} transition-colors flex items-center gap-2`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/history');
                        }}
                        className={`w-full px-4 py-2 text-left ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-50 text-text-primary'} transition-colors flex items-center gap-2`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        History
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/about');
                        }}
                        className={`w-full px-4 py-2 text-left ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-50 text-text-primary'} transition-colors flex items-center gap-2`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        About Besties
                      </button>

                      <div className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                        <button
                          onClick={() => {
                            toggleDarkMode();
                            toast.success(`${isDark ? 'Light' : 'Dark'} mode enabled`);
                          }}
                          className={`w-full px-4 py-2 text-left ${isDark ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-50 text-text-primary'} transition-colors flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-2">
                            {isDark ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                              </svg>
                            )}
                            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-text-secondary'}`}>{isDark ? '☀️' : '🌙'}</span>
                        </button>
                      </div>

                      <div className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                        <button
                          onClick={handleSignOut}
                          className={`w-full px-4 py-2 text-left ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'} transition-colors flex items-center gap-2 text-red-600`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
