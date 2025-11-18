import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendBestieInvite } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/AddBestieModal.css';

// Common country codes with their formats
const COUNTRY_CODES = {
  AU: { code: '+61', pattern: /^0[2-9]\d{8}$/, format: (n) => n.replace(/^0/, '+61'), name: 'Australia' },
  US: { code: '+1', pattern: /^[2-9]\d{9}$/, format: (n) => '+1' + n, name: 'United States' },
  CA: { code: '+1', pattern: /^[2-9]\d{9}$/, format: (n) => '+1' + n, name: 'Canada' },
  GB: { code: '+44', pattern: /^0[1-9]\d{9}$/, format: (n) => n.replace(/^0/, '+44'), name: 'United Kingdom' },
  NZ: { code: '+64', pattern: /^0[2-9]\d{7,9}$/, format: (n) => n.replace(/^0/, '+64'), name: 'New Zealand' },
  IN: { code: '+91', pattern: /^[6-9]\d{9}$/, format: (n) => '+91' + n, name: 'India' },
  DE: { code: '+49', pattern: /^0[1-9]\d{9,10}$/, format: (n) => n.replace(/^0/, '+49'), name: 'Germany' },
  FR: { code: '+33', pattern: /^0[1-9]\d{8}$/, format: (n) => n.replace(/^0/, '+33'), name: 'France' },
  IT: { code: '+39', pattern: /^3\d{8,9}$/, format: (n) => '+39' + n, name: 'Italy' },
  ES: { code: '+34', pattern: /^[6-9]\d{8}$/, format: (n) => '+34' + n, name: 'Spain' },
  JP: { code: '+81', pattern: /^0[7-9]0\d{8}$/, format: (n) => n.replace(/^0/, '+81'), name: 'Japan' },
  CN: { code: '+86', pattern: /^1[3-9]\d{9}$/, format: (n) => '+86' + n, name: 'China' },
  BR: { code: '+55', pattern: /^[1-9]{2}9\d{8}$/, format: (n) => '+55' + n, name: 'Brazil' },
  MX: { code: '+52', pattern: /^[1-9]\d{9}$/, format: (n) => '+52' + n, name: 'Mexico' },
  ZA: { code: '+27', pattern: /^0[1-9]\d{8}$/, format: (n) => n.replace(/^0/, '+27'), name: 'South Africa' },
  SG: { code: '+65', pattern: /^[89]\d{7}$/, format: (n) => '+65' + n, name: 'Singapore' },
};

const AddBestieModal = ({ onClose, onSuccess }) => {
  const { userData } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('AU');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);

  const shareUrl = `https://bestiesapp.web.app/?invite=${userData?.uid}`;
  const shareMessage = `Hey! I'm using Besties to stay safe. Join me and be my safety bestie! ${shareUrl}`;

  // Auto-format phone number
  const formatPhoneNumber = (input) => {
    // Remove spaces and dashes
    const cleaned = input.replace(/[\s-]/g, '');

    // If already has +, return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Try to match with selected country pattern
    const country = COUNTRY_CODES[selectedCountry];
    if (country && country.pattern.test(cleaned)) {
      return country.format(cleaned);
    }

    // Return cleaned input
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
  };

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (!phone) {
      return 'Phone number is required';
    }

    if (!phone.startsWith('+')) {
      return 'Phone number must include country code';
    }

    if (!e164Regex.test(phone)) {
      return 'Invalid phone number format';
    }

    return null;
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    setPhoneNumber(input);
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Format the phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Validate
    const validationError = validatePhoneNumber(formattedPhone);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      await sendBestieInvite({ recipientPhone: formattedPhone });
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareMessage);
    toast.success('Link copied to clipboard!');
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleFacebookShare = () => {
    const encoded = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank');
  };

  const handleSMSShare = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.location.href = `sms:?body=${encoded}`;
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent('Join me on Besties - your safety network!');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>📱 Invite Bestie</h2>
        <p>They'll get an SMS invite to join the app</p>

        {!showShareOptions ? (
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.875rem' }}>
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                }}
              >
                {Object.entries(COUNTRY_CODES).map(([code, data]) => (
                  <option key={code} value={code}>
                    {data.name} ({data.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.875rem' }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder={selectedCountry === 'AU' ? '0412 345 678' : 'Enter phone number'}
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                className={error ? 'input-error' : ''}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  fontSize: '1rem',
                }}
              />
              {error && (
                <p className="error-message" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {error}
                </p>
              )}
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {selectedCountry === 'AU' ? 'e.g., 0412 345 678 (auto-converts to +61)' :
                 selectedCountry === 'US' || selectedCountry === 'CA' ? 'e.g., 555 123 4567 (auto-converts to +1)' :
                 'Enter local format or international format (+...)'}
              </p>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '0.75rem' }}>
              {loading ? 'Sending SMS...' : '📤 Send SMS Invite'}
            </button>

            <button
              type="button"
              onClick={() => setShowShareOptions(true)}
              style={{
                width: '100%',
                background: '#f3f4f6',
                color: '#1f2937',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              📤 Or Share Your Link
            </button>
          </form>
        ) : (
          <div>
            <button
              onClick={() => setShowShareOptions(false)}
              style={{
                marginBottom: '1rem',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ← Back to SMS Invite
            </button>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                YOUR INVITE LINK:
              </div>
              <div style={{ fontSize: '0.875rem', wordBreak: 'break-all', color: '#1f2937' }}>
                {shareUrl}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <button
                onClick={handleWhatsAppShare}
                style={{
                  padding: '0.75rem',
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                WhatsApp
              </button>

              <button
                onClick={handleFacebookShare}
                style={{
                  padding: '0.75rem',
                  background: '#1877F2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                Facebook
              </button>

              <button
                onClick={handleTwitterShare}
                style={{
                  padding: '0.75rem',
                  background: '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                X (Twitter)
              </button>

              <button
                onClick={handleSMSShare}
                style={{
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                SMS
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              📋 Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddBestieModal;
