import React, { useState } from 'react';
import { sendBestieInvite } from '../services/api';
import '../styles/AddBestieModal.css';

const AddBestieModal = ({ onClose, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendBestieInvite({ recipientPhone: phoneNumber });
      alert('Invite sent via SMS! ✓');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>📱 Invite Bestie</h2>
        <p>They'll get an SMS invite to download the app</p>
        <form onSubmit={onSubmit}>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending SMS...' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBestieModal;