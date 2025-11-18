import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage, authService } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword, updateEmail } from 'firebase/auth';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const EditProfilePage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [bio, setBio] = useState(userData?.profile?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userData?.photoURL || null);
  const [loading, setLoading] = useState(false);

  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState(null);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return userData?.photoURL || null;

    try {
      const storageRef = ref(storage, `profiles/${currentUser.uid}/${Date.now()}_${profilePicture.name}`);
      await uploadBytes(storageRef, profilePicture);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
      return userData?.photoURL || null;
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!phoneNumber || phoneNumber === userData?.phoneNumber) {
      toast.error('Please enter a new phone number');
      return;
    }

    setLoading(true);

    // Format phone number - ensure it starts with +
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      // If it doesn't start with +, assume Australia +61 and remove leading 0
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+61' + formattedPhone.slice(1);
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }

    // Setup reCAPTCHA
    const recaptchaResult = authService.setupRecaptcha('phone-recaptcha-container');
    if (!recaptchaResult.success) {
      toast.error('Failed to set up verification. Please refresh the page.');
      setLoading(false);
      return;
    }

    // Send verification code
    const result = await authService.sendPhoneVerification(formattedPhone, recaptchaResult.verifier);
    setLoading(false);

    if (result.success) {
      setPhoneConfirmationResult(result.confirmationResult);
      setPendingPhoneNumber(formattedPhone);
      setShowPhoneVerification(true);
      toast.success('Verification code sent to your phone!');
    } else {
      toast.error(result.error || 'Failed to send verification code');
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!verificationCode || !phoneConfirmationResult) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);

    const result = await authService.verifyPhoneCode(phoneConfirmationResult, verificationCode);

    if (result.success) {
      toast.success('Phone number verified!');
      setShowPhoneVerification(false);
      setPhoneNumber(pendingPhoneNumber);
      // Now save the profile with the verified phone number
      saveProfileChanges(pendingPhoneNumber);
    } else {
      setLoading(false);
      toast.error(result.error || 'Invalid verification code');
    }
  };

  const saveProfileChanges = async (verifiedPhoneNumber = null) => {
    try {
      // Upload profile picture if changed
      const photoURL = await uploadProfilePicture();

      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        phoneNumber: verifiedPhoneNumber || phoneNumber,
        photoURL,
        'profile.bio': bio,
        updatedAt: new Date(),
      });

      // Update email if changed
      if (email !== currentUser.email) {
        await updateEmail(currentUser, email);
        toast.success('Email updated - please verify your new email');
      }

      // Update password if provided
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        toast.success('Password updated');
      }

      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign out and sign in again to update email/password');
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Check if phone number has changed
    const phoneChanged = phoneNumber && phoneNumber !== userData?.phoneNumber;

    if (phoneChanged) {
      // Phone number changed, require verification
      handleSendPhoneVerification();
      return; // Don't save yet, wait for verification
    }

    // If phone number hasn't changed, save normally
    setLoading(true);
    await saveProfileChanges();
  };

  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-2xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-display text-text-primary mb-2">Edit Profile</h1>
          <p className="text-text-secondary">Update your personal information</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Picture */}
          <div className="card p-6">
            <label className="block text-lg font-display text-text-primary mb-4">
              Profile Picture
            </label>
            
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-display overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  displayName?.[0] || 'U'
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profile-picture"
                />
                <label
                  htmlFor="profile-picture"
                  className="btn btn-secondary cursor-pointer inline-block"
                >
                  Choose Photo
                </label>
                <div className="text-sm text-text-secondary mt-2">
                  JPG, PNG or GIF. Max size 5MB
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="card p-6">
            <h3 className="text-lg font-display text-text-primary mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="Tell people about yourself..."
                  maxLength={150}
                />
                <div className="text-xs text-text-secondary mt-1">
                  {bio.length}/150 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input"
                  placeholder="+61 400 000 000 or 0400 000 000"
                />
                {phoneNumber !== userData?.phoneNumber && phoneNumber && (
                  <div className="text-xs text-orange-600 mt-1">
                    ⚠️ You'll need to verify this number via SMS before saving
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="card p-6">
            <h3 className="text-lg font-display text-text-primary mb-4">Account Security</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="your@email.com"
                  required
                />
                <div className="text-xs text-text-secondary mt-1">
                  Changing email requires re-verification
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {newPassword && (
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Phone Verification Modal */}
        {showPhoneVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full animate-scale-up">
              <h2 className="text-2xl font-display text-text-primary mb-2">Verify Phone Number</h2>
              <p className="text-text-secondary mb-4">
                We sent a 6-digit code to <strong>{pendingPhoneNumber}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="input"
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhoneVerification(false);
                    setVerificationCode('');
                    setPhoneConfirmationResult(null);
                  }}
                  className="flex-1 btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPhoneCode}
                  className="flex-1 btn btn-primary"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Save'}
                </button>
              </div>

              <p className="text-xs text-text-secondary mt-4 text-center">
                Didn't receive the code?{' '}
                <button
                  onClick={handleSendPhoneVerification}
                  className="text-primary underline"
                  disabled={loading}
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Invisible reCAPTCHA container */}
        <div id="phone-recaptcha-container"></div>
      </div>
    </div>
  );
};

export default EditProfilePage;
