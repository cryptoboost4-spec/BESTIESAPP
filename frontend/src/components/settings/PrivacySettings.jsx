import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const PrivacySettings = ({ userData, currentUser }) => {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-display text-text-primary mb-2">Privacy</h2>
      <p className="text-sm text-text-secondary mb-4">Control what your besties can see on your profile</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-text-primary">Show Stats to Besties</div>
            <div className="text-sm text-text-secondary">
              {userData?.privacySettings?.showStatsToBesties !== false
                ? 'Besties can see your stats'
                : 'Stats are private'}
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const newValue = !(userData?.privacySettings?.showStatsToBesties !== false);
                await updateDoc(doc(db, 'users', currentUser.uid), {
                  'privacySettings.showStatsToBesties': newValue,
                });
                toast.success(newValue ? 'Stats now visible to besties' : 'Stats are now private');
              } catch (error) {
                console.error('Error updating privacy:', error);
                toast.error('Failed to update privacy setting');
              }
            }}
            className={`w-12 h-6 rounded-full transition-colors ${
              userData?.privacySettings?.showStatsToBesties !== false
                ? 'bg-primary'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white dark:bg-gray-300 rounded-full transition-transform ${
                userData?.privacySettings?.showStatsToBesties !== false
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="font-semibold text-text-primary mb-2">Check-in Visibility</div>
            <div className="text-sm text-text-secondary mb-3">
              Control who can see your check-ins (last 7 days)
            </div>
          </div>

          <div className="space-y-2">
            {/* Option 1: All Besties */}
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              style={{
                borderColor: (userData?.privacySettings?.checkInVisibility || 'all_besties') === 'all_besties' ? '#FF6B9D' : '#e5e7eb'
              }}>
              <input
                type="radio"
                name="checkInVisibility"
                value="all_besties"
                checked={(userData?.privacySettings?.checkInVisibility || 'all_besties') === 'all_besties'}
                onChange={async (e) => {
                  try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      'privacySettings.checkInVisibility': 'all_besties',
                    });
                    toast.success('All besties can now see your check-ins');
                  } catch (error) {
                    console.error('Error updating privacy:', error);
                    toast.error('Failed to update privacy setting');
                  }
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-text-primary">All Besties</div>
                <div className="text-sm text-text-secondary">
                  All your besties can see your check-ins.
                </div>
              </div>
            </label>

            {/* Option 2: Circle Only */}
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              style={{
                borderColor: (userData?.privacySettings?.checkInVisibility || 'all_besties') === 'circle' ? '#FF6B9D' : '#e5e7eb'
              }}>
              <input
                type="radio"
                name="checkInVisibility"
                value="circle"
                checked={(userData?.privacySettings?.checkInVisibility || 'all_besties') === 'circle'}
                onChange={async (e) => {
                  try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      'privacySettings.checkInVisibility': 'circle',
                    });
                    toast.success('Only circle besties can see your check-ins');
                  } catch (error) {
                    console.error('Error updating privacy:', error);
                    toast.error('Failed to update privacy setting');
                  }
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-text-primary">Bestie Circle Only</div>
                <div className="text-sm text-text-secondary">
                  Only your top 5 circle besties can see your check-ins.
                </div>
              </div>
            </label>

            {/* Option 3: Alerts Only */}
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              style={{
                borderColor: (userData?.privacySettings?.checkInVisibility || 'all_besties') === 'alerts_only' ? '#FF6B9D' : '#e5e7eb'
              }}>
              <input
                type="radio"
                name="checkInVisibility"
                value="alerts_only"
                checked={(userData?.privacySettings?.checkInVisibility || 'all_besties') === 'alerts_only'}
                onChange={async (e) => {
                  try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                      'privacySettings.checkInVisibility': 'alerts_only',
                    });
                    toast.success('Check-ins only visible when alerts trigger');
                  } catch (error) {
                    console.error('Error updating privacy:', error);
                    toast.error('Failed to update privacy setting');
                  }
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-text-primary">Alerts Only (Most Private)</div>
                <div className="text-sm text-text-secondary">
                  Check-ins are hidden until an alert goes off.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
