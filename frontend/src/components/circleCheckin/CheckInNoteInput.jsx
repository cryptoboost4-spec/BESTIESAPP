import React from 'react';

const CheckInNoteInput = ({ value, onChange, maxLength = 50 }) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Want to share more? (optional)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rough week..."
        maxLength={maxLength}
        rows={2}
        className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
        {value.length}/{maxLength} characters
      </p>
    </div>
  );
};

export default CheckInNoteInput;

