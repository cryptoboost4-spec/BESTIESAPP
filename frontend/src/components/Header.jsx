import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { userData } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl text-gradient">Besties</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`font-semibold transition-colors ${
                isActive('/') ? 'text-primary' : 'text-text-secondary hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link
              to="/besties"
              className={`font-semibold transition-colors ${
                isActive('/besties') ? 'text-primary' : 'text-text-secondary hover:text-primary'
              }`}
            >
              Besties
            </Link>
            <Link
              to="/profile"
              className={`font-semibold transition-colors ${
                isActive('/profile') ? 'text-primary' : 'text-text-secondary hover:text-primary'
              }`}
            >
              Profile
            </Link>
          </nav>

          {/* Profile Button */}
          <Link
            to="/profile"
            className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display"
          >
            {userData?.displayName?.[0] || 'U'}
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around pb-2">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 ${
              isActive('/') ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-semibold">Home</span>
          </Link>

          <Link
            to="/besties"
            className={`flex flex-col items-center gap-1 ${
              isActive('/besties') ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-semibold">Besties</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 ${
              isActive('/profile') ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-semibold">Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
