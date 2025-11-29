import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const EditTimeModal = ({ isOpen, onClose, checkInId, currentAlertTime, onTimeUpdated, isDark }) => {
  const [newAlertTime, setNewAlertTime] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!newAlertTime) {
      toast.error('Please select a time');
      return;
    }
    
    const selectedTime = new Date(newAlertTime);
    if (selectedTime <= new Date()) {
      toast.error('Please select a future time');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'checkins', checkInId), {
        alertTime: Timestamp.fromDate(selectedTime),
      });
      onTimeUpdated(selectedTime);
      toast.success('Alert time updated!');
      onClose();
      setNewAlertTime('');
    } catch (error) {
      console.error('Error updating alert time:', error);
      toast.error('Failed to update alert time');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full shadow-xl`} onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-display text-text-primary mb-4 text-center">
          ⏰ Set Alert Time
        </h3>
        <p className="text-sm text-text-secondary mb-4 text-center">
          Choose when you want to be reminded to check in
        </p>
        
        <input
          type="datetime-local"
          value={newAlertTime}
          onChange={(e) => setNewAlertTime(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className={`w-full p-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} text-text-primary mb-4`}
        />
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTimeModal;

