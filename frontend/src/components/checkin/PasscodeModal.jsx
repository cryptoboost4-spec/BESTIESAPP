import React from 'react';

const PasscodeModal = ({
  enteredPasscode,
  setEnteredPasscode,
  onSubmit,
  onClose,
  isDark
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full p-6`}>
        <h2 className={`text-2xl font-display ${isDark ? 'text-gray-100' : 'text-text-primary'} mb-2`}>🔒 Enter Passcode</h2>
        <p className="text-text-secondary mb-4">
          Enter your safety passcode to mark yourself safe
        </p>

        <div className="mb-6">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={enteredPasscode}
            onChange={(e) => setEnteredPasscode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSubmit();
              }
            }}
            className={`w-full px-3 py-3 border-2 ${isDark ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:border-primary focus:outline-none text-center text-3xl tracking-widest`}
            placeholder="••••"
            maxLength={6}
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!enteredPasscode}
            className="flex-1 btn btn-success"
          >
            Confirm
          </button>
        </div>

        <p className="text-xs text-text-secondary text-center mt-4">
          Forgot your passcode? Update it in Settings
        </p>
      </div>
    </div>
  );
};

export default PasscodeModal;
