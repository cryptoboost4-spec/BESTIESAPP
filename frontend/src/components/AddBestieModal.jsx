import React, { useState } from 'react';
import { sendBestieInvite } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/AddBestieModal.css';

const AddBestieModal = ({ onClose, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validates phone number in E.164 format (+1234567890)
  const validatePhoneNumber = (phone) => {
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (!phone) {
      return 'Phone number is required';
    }

    if (!phone.startsWith('+')) {
      return 'Phone number must start with + (e.g., +1234567890)';
    }

    if (!e164Regex.test(phone)) {
      return 'Invalid phone number format. Use international format: +1234567890';
    }

    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    const validationError = validatePhoneNumber(phoneNumber);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      await sendBestieInvite({ recipientPhone: phoneNumber });
      toast.success('Invite sent via SMS! ✓');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error.message || 'Failed to send invite';
      setError(errorMsg);
      toast.error(errorMsg);
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
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              setError(''); // Clear error on input change
            }}
            required
            className={error ? 'input-error' : ''}
          />
          {error && <p className="error-message" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Use international format: +[country code][number]
          </p>
          <button type="submit" disabled={loading}>
            {loading ? 'Sending SMS...' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBestieModal;