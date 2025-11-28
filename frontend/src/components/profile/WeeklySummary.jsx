import React from 'react';
import InfoButton from '../InfoButton';

const WeeklySummary = ({ weeklySummary, hasWeekOfActivity, userData, bestiesCount }) => {
  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-display text-gray-800 dark:text-gray-200">Weekly Summary</h2>
        <InfoButton message="Your personalized weekly activity summary! Track your check-ins and bestie connections. You'll get detailed insights after your first week. 📊" />
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{weeklySummary.emoji}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-1">
              {weeklySummary.message}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              💡 {weeklySummary.tip}
            </p>
            {hasWeekOfActivity && (
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold text-primary">{userData?.stats?.totalCheckIns || 0}</span>
                  <span className="text-gray-600 dark:text-gray-400"> check-ins</span>
                </div>
                <div>
                  <span className="font-semibold text-secondary">{bestiesCount}</span>
                  <span className="text-gray-600 dark:text-gray-400"> besties</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummary;
