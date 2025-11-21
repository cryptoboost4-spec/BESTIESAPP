import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import haptic from '../utils/hapticFeedback';

const InviteFriendsModal = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);

  // Generate invite link with user's unique referral code
  const inviteLink = `https://besties.app/invite/${currentUser?.uid}`;
  const inviteMessage = `Hey! Join me on Besties - the app that keeps us safe when we're out. Check-in when you're heading somewhere and your friends will have your back. ${inviteLink}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    haptic.light();
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
    haptic.light();
  };

  const shareViaTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, '_blank', 'width=600,height=400');
    haptic.light();
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, '_blank');
    haptic.light();
  };

  const shareViaMessenger = () => {
    const url = `fb-messenger://share?link=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank');
    haptic.light();
  };

  const shareViaEmail = () => {
    const subject = 'Join me on Besties!';
    const body = inviteMessage;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    haptic.light();
  };

  const shareViaSMS = () => {
    window.location.href = `sms:?&body=${encodeURIComponent(inviteMessage)}`;
    haptic.light();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display text-gradient">
            🎉 Invite Friends
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p className="text-text-secondary mb-6">
          Share Besties with your friends and help build a stronger safety network together! 💜
        </p>

        {/* Your Invite Link */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Your Invite Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-primary mb-3">
            Share via
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Facebook */}
            <button
              onClick={shareViaFacebook}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                f
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600">
                Facebook
              </span>
            </button>

            {/* Messenger */}
            <button
              onClick={shareViaMessenger}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                💬
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600">
                Messenger
              </span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
            >
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">
                💬
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 group-hover:text-green-600">
                WhatsApp
              </span>
            </button>

            {/* Twitter */}
            <button
              onClick={shareViaTwitter}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all group"
            >
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white text-xl">
                𝕏
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 group-hover:text-sky-600">
                Twitter
              </span>
            </button>

            {/* SMS */}
            <button
              onClick={shareViaSMS}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                💬
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600">
                SMS
              </span>
            </button>

            {/* Email */}
            <button
              onClick={shareViaEmail}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xl">
                ✉️
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600">
                Email
              </span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full btn btn-secondary mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default InviteFriendsModal;
