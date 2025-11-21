import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { isDark } = useDarkMode();

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg z-[9999] transition-colors`}
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%'
      }}
    >
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
  );
};

export default MobileBottomNav;
