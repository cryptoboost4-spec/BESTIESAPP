import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DesktopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  const navItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/besties', label: 'Besties', icon: '💜' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
            <span className="text-3xl">💜</span>
            <span className="text-2xl font-display text-gradient">Besties</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt={userData.displayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-display">
                {userData?.displayName?.[0] || '?'}
              </div>
            )}
            <div className="text-sm">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {userData?.displayName || 'Bestie'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNav;
