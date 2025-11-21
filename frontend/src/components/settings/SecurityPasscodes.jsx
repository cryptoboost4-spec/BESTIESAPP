import React from 'react';
import InfoButton from '../InfoButton';

const SecurityPasscodes = ({
  userData,
  showPasscodeInfo,
  setShowPasscodeInfo,
  setPasscodeType,
  setShowPasscodeModal,
  handleRemovePasscode,
  loading
}) => {
  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-display text-text-primary">Security Passcodes</h2>
        <button
          onClick={() => setShowPasscodeInfo(!showPasscodeInfo)}
          className="text-primary text-sm font-semibold hover:underline"
        >
          {showPasscodeInfo ? 'Hide Info' : 'Learn More'}
        </button>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Protect your check-ins with passcodes
      </p>

      {showPasscodeInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">How Passcodes Work:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc ml-4">
            <li><strong>Safety Passcode:</strong> Required to end check-ins or cancel SOS alerts. This ensures only you can mark yourself safe.</li>
            <li><strong>Duress Code:</strong> A special code that <em>appears</em> to cancel the alert, but secretly triggers an emergency alert to all besties in your circle. Use this if you're in danger and being forced to cancel.</li>
            <li>Both codes must be different and at least 4 digits.</li>
            <li>Your codes are encrypted and stored securely.</li>
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {/* Safety Passcode */}
        <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="font-semibold text-text-primary flex items-center">
                🔒 Safety Passcode
                <InfoButton message="Required to cancel check-ins or SOS alerts. This ensures only you can mark yourself safe, protecting you from coercion." />
              </div>
              {userData?.security?.safetyPasscode && (
                <div className="text-green-600 text-xl">✓</div>
              )}
            </div>
            {userData?.security?.safetyPasscode ? (
              <button
                onClick={() => {
                  setPasscodeType('safety');
                  setShowPasscodeModal(true);
                }}
                className="text-primary text-sm font-semibold hover:underline"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => {
                  setPasscodeType('safety');
                  setShowPasscodeModal(true);
                }}
                className="btn btn-primary btn-sm"
              >
                Set Passcode
              </button>
            )}
          </div>
          <div className="text-sm text-text-secondary mb-1">
            {userData?.security?.safetyPasscode ? 'Passcode is set' : 'Not set'}
          </div>
          {userData?.security?.safetyPasscode && (
            <button
              onClick={() => handleRemovePasscode('safety')}
              disabled={loading}
              className="text-red-600 text-sm font-semibold hover:underline mt-2"
            >
              Remove Passcode
            </button>
          )}
        </div>

        {/* Duress Code */}
        <div className="border-2 border-red-200 dark:border-red-600 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="font-semibold text-text-primary flex items-center">
                🚨 Duress Code
                <InfoButton message="A special code that appears to cancel alerts but secretly sends an emergency signal to all besties. Use if you're in danger and being forced to cancel." />
              </div>
              {userData?.security?.duressCode && (
                <div className="text-green-600 text-xl">✓</div>
              )}
            </div>
            {userData?.security?.duressCode ? (
              <button
                onClick={() => {
                  setPasscodeType('duress');
                  setShowPasscodeModal(true);
                }}
                className="text-primary text-sm font-semibold hover:underline"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => {
                  setPasscodeType('duress');
                  setShowPasscodeModal(true);
                }}
                className="btn btn-primary btn-sm"
              >
                Set Code
              </button>
            )}
          </div>
          <div className="text-sm text-text-secondary mb-1">
            {userData?.security?.duressCode ? 'Duress code is set' : 'Not set'}
          </div>
          {userData?.security?.duressCode && (
            <button
              onClick={() => handleRemovePasscode('duress')}
              disabled={loading}
              className="text-red-600 text-sm font-semibold hover:underline mt-2"
            >
              Remove Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityPasscodes;
