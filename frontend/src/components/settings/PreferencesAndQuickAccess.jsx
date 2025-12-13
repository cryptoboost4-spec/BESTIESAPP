import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import InfoButton from '../InfoButton';

const PreferencesAndQuickAccess = forwardRef(({ isDark, toggleDarkMode, toggleHoldData, userData, navigate, highlightedElement = null }, ref) => {
  const darkModeToggleRef = useRef(null);
  const dataRetentionToggleRef = useRef(null);

  // Expose refs to parent
  useImperativeHandle(ref, () => ({
    darkModeToggle: darkModeToggleRef.current,
    dataRetentionToggle: dataRetentionToggleRef.current
  }));

  // Animate highlighted toggles
  useEffect(() => {
    const toggleRefs = {
      darkModeToggle: darkModeToggleRef.current,
      dataRetentionToggle: dataRetentionToggleRef.current
    };

    const targetToggle = toggleRefs[highlightedElement];
    if (targetToggle && highlightedElement) {
      const knob = targetToggle.querySelector('div');
      if (knob) {
        let isOn = false;
        let animationCount = 0;
        const maxAnimations = 4; // 2 times

        const animationInterval = setInterval(() => {
          if (animationCount >= maxAnimations) {
            clearInterval(animationInterval);
            knob.style.transform = '';
            targetToggle.style.backgroundColor = '';
            return;
          }

          isOn = !isOn;
          animationCount++;

          if (isOn) {
            knob.style.transition = 'transform 0.4s ease';
            knob.style.transform = 'translateX(1.5rem)';
            targetToggle.style.transition = 'background-color 0.4s ease';
            targetToggle.style.backgroundColor = '#a855f7';
          } else {
            knob.style.transition = 'transform 0.4s ease';
            knob.style.transform = 'translateX(0.25rem)';
            targetToggle.style.transition = 'background-color 0.4s ease';
            targetToggle.style.backgroundColor = '#d1d5db';
          }
        }, 800);

        return () => {
          clearInterval(animationInterval);
          targetToggle.style.transform = '';
          targetToggle.style.backgroundColor = '';
          if (knob) {
            knob.style.transform = '';
            knob.style.transition = '';
          }
        };
      }
    }
  }, [highlightedElement]);

  return (
    <>
      {/* Preferences */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-display text-text-primary mb-4">Preferences</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary flex items-center">
                Dark Mode
                <InfoButton message="Toggle between light and dark color themes. Dark mode is easier on your eyes at night and can save battery on OLED screens." />
              </div>
              <div className="text-sm text-text-secondary">
                {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
              </div>
            </div>
            <button
              ref={darkModeToggleRef}
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
              <div className="font-semibold text-text-primary flex items-center">
                Data Retention
                <InfoButton message={`Choose whether to keep your check-in history indefinitely or auto-delete after 7 days. We keep running totals (like badge progress) but delete actual location/check-in data for privacy.`} />
              </div>
              <div className="text-sm text-text-secondary">
                {userData?.settings?.holdData
                  ? 'Keeping all check-in history'
                  : 'Auto-delete after 7 days (default)'}
              </div>
              <button
                onClick={() => navigate('/data-policy')}
                className="text-xs text-primary hover:underline mt-1"
              >
                Learn how we handle your data →
              </button>
            </div>
            <button
              ref={dataRetentionToggleRef}
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
            onClick={() => navigate('/history')}
            className="btn btn-secondary text-left px-4 py-3"
          >
            <div className="text-sm">📊 History</div>
          </button>
          <button
            onClick={() => navigate('/export-data')}
            className="btn btn-secondary text-left px-4 py-3"
          >
            <div className="text-sm">📥 Export Data</div>
          </button>
          {userData?.isAdmin && (
            <>
              <button
                onClick={() => navigate('/dev-analytics')}
                className="btn btn-secondary text-left px-4 py-3"
              >
                <div className="text-sm">📈 Analytics</div>
              </button>
              <button
                onClick={() => navigate('/monitoring')}
                className="btn bg-gradient-primary text-white text-left px-4 py-3"
              >
                <div className="text-sm">🔍 Monitoring</div>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
});

PreferencesAndQuickAccess.displayName = 'PreferencesAndQuickAccess';

export default PreferencesAndQuickAccess;
