import React from 'react';

const PreferencesAndQuickAccess = ({ isDark, toggleDarkMode, toggleHoldData, userData, navigate }) => {
  return (
    <>
      {/* Preferences */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-display text-text-primary mb-4">Preferences</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary">Dark Mode</div>
              <div className="text-sm text-text-secondary">
                {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors ${
                isDark ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary">Data Retention</div>
              <div className="text-sm text-text-secondary">
                {userData?.settings?.holdData
                  ? 'Keeping all check-in history'
                  : 'Auto-delete after 24h (default)'}
              </div>
            </div>
            <button
              onClick={toggleHoldData}
              className={`w-12 h-6 rounded-full transition-colors ${
                userData?.settings?.holdData
                  ? 'bg-primary'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform ${
                  userData?.settings?.holdData ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-display text-text-primary mb-4">Quick Access</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="btn btn-secondary text-left"
          >
            <span className="text-2xl mr-2">👤</span>
            <div>
              <div className="text-sm font-semibold">Profile</div>
              <div className="text-xs opacity-70">View your profile</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/besties')}
            className="btn btn-secondary text-left"
          >
            <span className="text-2xl mr-2">💜</span>
            <div>
              <div className="text-sm font-semibold">Besties</div>
              <div className="text-xs opacity-70">Manage besties</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="btn btn-secondary text-left"
          >
            <span className="text-2xl mr-2">📜</span>
            <div>
              <div className="text-sm font-semibold">History</div>
              <div className="text-xs opacity-70">Check-in history</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/badges')}
            className="btn btn-secondary text-left"
          >
            <span className="text-2xl mr-2">🏆</span>
            <div>
              <div className="text-sm font-semibold">Badges</div>
              <div className="text-xs opacity-70">Achievements</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default PreferencesAndQuickAccess;
