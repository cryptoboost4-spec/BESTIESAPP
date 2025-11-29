import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';

const DataPolicyPage = () => {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();

  return (
    <div className="min-h-screen bg-pattern">
      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-display text-text-primary">How We Handle Your Data</h1>
        </div>

        {/* Introduction */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">💜</div>
            <h2 className="text-xl font-display text-text-primary">Your Privacy Matters</h2>
          </div>
          <p className="text-text-secondary">
            We built Besties with privacy at its core. Here's exactly how we handle your data 
            so you can stay safe without sacrificing your privacy.
          </p>
        </div>

        {/* What We Keep */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-display text-text-primary mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            What We Keep (Running Totals)
          </h2>
          <p className="text-text-secondary mb-4">
            We keep aggregate statistics to track your progress and badges. These include:
          </p>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>Check-in count</strong> - Total number of check-ins completed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>Safety streak</strong> - Consecutive days with safe check-ins</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>Badge progress</strong> - Which badges you've earned</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>Bestie count</strong> - How many besties you've added</span>
            </li>
          </ul>
          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>💡 Note:</strong> These are just numbers - no location data, no details about where you went or who you met.
            </p>
          </div>
        </div>

        {/* What Gets Deleted */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-display text-text-primary mb-4 flex items-center gap-2">
            <span className="text-xl">🗑️</span>
            What Gets Auto-Deleted (After 7 Days)
          </h2>
          <p className="text-text-secondary mb-4">
            By default, we automatically delete detailed check-in data after 7 days:
          </p>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">×</span>
              <span><strong>Location data</strong> - Where you checked in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">×</span>
              <span><strong>Meeting details</strong> - Who you were meeting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">×</span>
              <span><strong>Photos & notes</strong> - Any media you attached</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">×</span>
              <span><strong>GPS coordinates</strong> - Precise location data</span>
            </li>
          </ul>
          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>⚠️ Why 7 days?</strong> This gives you time to review your history, but ensures old data doesn't stick around forever.
            </p>
          </div>
        </div>

        {/* Your Choice */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-display text-text-primary mb-4 flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            Your Choice
          </h2>
          <p className="text-text-secondary mb-4">
            You're in control. In Settings → Preferences, you can choose to:
          </p>
          <div className="grid gap-3">
            <div className={`p-4 rounded-xl border-2 ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <div className="font-semibold text-text-primary mb-1">🔄 Auto-Delete (Default)</div>
              <p className="text-sm text-text-secondary">
                Check-in details are automatically deleted after 7 days. Only running totals are kept.
              </p>
            </div>
            <div className={`p-4 rounded-xl border-2 ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <div className="font-semibold text-text-primary mb-1">💾 Keep History</div>
              <p className="text-sm text-text-secondary">
                Keep all check-in history indefinitely. Useful if you want to track patterns over time.
              </p>
            </div>
          </div>
        </div>

        {/* Other Data */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-display text-text-primary mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Other Data We Store
          </h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span><strong>Profile info</strong> - Name, photo, bio (what you choose to share)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span><strong>Bestie connections</strong> - Who your besties are</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span><strong>Settings</strong> - Your preferences and notification settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span><strong>Posts & reactions</strong> - Community activity (can be deleted by you)</span>
            </li>
          </ul>
        </div>

        {/* Delete Everything */}
        <div className="card p-6 mb-6 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-lg font-display text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <span className="text-xl">🗑️</span>
            Delete Everything
          </h2>
          <p className="text-text-secondary mb-4">
            You can delete your entire account and all associated data at any time from Settings → Export Data → Delete Account.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            This is permanent and cannot be undone.
          </p>
        </div>

        {/* Questions */}
        <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
          <div className="text-center">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-display text-lg text-text-primary mb-2">Questions?</h3>
            <p className="text-sm text-text-secondary mb-4">
              We're always happy to chat about privacy and data handling.
            </p>
            <a
              href="mailto:besitesapp.xyz@gmail.com"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPolicyPage;

