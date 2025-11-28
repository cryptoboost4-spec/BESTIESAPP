import React from 'react';
import { useDarkMode } from '../../contexts/DarkModeContext';
import haptic from '../../utils/hapticFeedback';

const CheckInNotes = ({
  notes,
  setNotes,
  editingNotes,
  setEditingNotes,
  onSaveNotes,
  isAlerted,
  checkInNotes
}) => {
  const { isDark } = useDarkMode();

  return (
    <div className="mb-4">
      {editingNotes ? (
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`w-full p-3 border-2 ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-xl focus:border-primary focus:outline-none resize-none`}
            rows="3"
            placeholder="Add notes about your check-in..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={onSaveNotes}
              className="btn btn-primary text-sm flex-1"
            >
              💾 Save Notes
            </button>
            <button
              onClick={() => {
                setEditingNotes(false);
                setNotes(checkInNotes || '');
              }}
              className="btn btn-secondary text-sm flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {notes ? (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-xl`}>
              <div className="flex items-start justify-between mb-1">
                <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>NOTES:</div>
                {!isAlerted && (
                  <button
                    onClick={() => {
                      haptic.light();
                      setEditingNotes(true);
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              <p className="text-sm text-text-secondary">{notes}</p>
            </div>
          ) : !isAlerted && (
            <button
              onClick={() => {
                haptic.light();
                setEditingNotes(true);
              }}
              className={`w-full border-2 border-dashed ${isDark ? 'border-gray-600 text-gray-300 hover:bg-primary/10' : 'border-gray-300 text-gray-600 hover:bg-primary/5'} rounded-xl p-3 text-sm font-semibold hover:border-primary transition-all`}
            >
              📝 Add Notes
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckInNotes;
