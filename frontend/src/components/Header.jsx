import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { authService } from '../services/firebase';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';

const Header = () => {
  const { userData } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

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
      {/* Desktop Header */}
      <header className={`${isDark ? 'bg-gray-900' : 'bg-white'} shadow-sm sticky top-0 z-40 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-2xl text-gradient">Besties</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`font-semibold transition-colors ${
                  isActive('/') ? 'text-primary' : (isDark ? 'text-gray-300 hover:text-primary' : 'text-text-secondary hover:text-primary')
                }`}
              >
                Home
              </Link>
              <Link
                to="/besties"
                className={`font-semibold transition-colors ${
                  isActive('/besties') ? 'text-primary' : (isDark ? 'text-gray-300 hover:text-primary' : 'text-text-secondary hover:text-primary')
                }`}
              >
                Besties
              </Link>
              <Link
                to="/profile"
                className={`font-semibold transition-colors ${
                  isActive('/profile') ? 'text-primary' : (isDark ? 'text-gray-300 hover:text-primary' : 'text-text-secondary hover:text-primary')
                }`}
              >
                Profile
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Menu */}
              <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display overflow-hidden hover:opacity-90 transition-opacity"
              >
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userData?.displayName?.[0] || 'U'}</span>
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
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Fixed Bottom Bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg z-[100] transition-colors`}>
        <div className="flex items-center justify-around py-3 safe-area-inset-bottom">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/') ? 'text-primary' : (isDark ? 'text-gray-300' : 'text-text-secondary')
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-semibold">Home</span>
          </Link>

          <Link
            to="/besties"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/besties') ? 'text-primary' : (isDark ? 'text-gray-300' : 'text-text-secondary')
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-semibold">Besties</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/profile') ? 'text-primary' : (isDark ? 'text-gray-300' : 'text-text-secondary')
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-semibold">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Header;
