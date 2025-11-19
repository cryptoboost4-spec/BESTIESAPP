import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const SocialShareCardsModal = ({ onClose }) => {
  const { userData, currentUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareMode, setShareMode] = useState('choose'); // 'choose', 'image', 'text'
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadBadges = async () => {
    if (!currentUser) return;

    try {
      const badgesDoc = await getDoc(doc(db, 'badges', currentUser.uid));
      if (badgesDoc.exists()) {
        const allBadges = badgesDoc.data().badges || [];
        // Get featured badges if set, otherwise first 3
        const featuredIds = userData?.featuredBadges || [];
        const featured = featuredIds
          .map(id => allBadges.find(b => b.id === id))
          .filter(Boolean)
          .slice(0, 3);

        if (featured.length < 3) {
          const remaining = allBadges.filter(b => !featuredIds.includes(b.id));
          featured.push(...remaining.slice(0, 3 - featured.length));
        }

        setBadges(featured);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading badges:', error);
      setLoading(false);
    }
  };

  const currentGradient = userData?.profile?.backgroundGradient || 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)';
  const shareUrl = `${window.location.origin}/?invite=${currentUser?.uid}`;
  const shareText = "Come be my safety Bestie! 💜";

  const generateShareImage = async () => {
    if (!cardRef.current) return;

    setGeneratingImage(true);
    try {
      // Wait a bit for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imageUrl = canvas.toDataURL('image/png');
      setGeneratedImageUrl(imageUrl);
      toast.success('Image generated! Ready to share 🎉');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImageUrl) return;

    const link = document.createElement('a');
    link.download = 'besties-profile-share.png';
    link.href = generatedImageUrl;
    link.click();
    toast.success('Image downloaded! Share it anywhere 💜');
  };

  const handleCopyText = async () => {
    const cardText = `${shareText}\n\nView my profile: ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(cardText);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `${shareText}\n\nView my profile: ${shareUrl}`;
    const encoded = encodeURIComponent(message);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `whatsapp://send?text=${encoded}`;
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const handleShareFacebook = () => {
    const encoded = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareText);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `fb://profile/${currentUser.uid}`;
      setTimeout(() => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}&quote=${text}`, '_blank');
      }, 1500);
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}&quote=${text}`, '_blank', 'width=600,height=400');
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `twitter://post?message=${text} ${url}`;
      setTimeout(() => {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      }, 1500);
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    }
  };

  const handleShareSMS = () => {
    const message = `${shareText}\n\nView my profile: ${shareUrl}`;
    const encoded = encodeURIComponent(message);
    window.location.href = `sms:?body=${encoded}`;
  };

  const handleShareMessenger = () => {
    const encoded = encodeURIComponent(shareUrl);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `fb-messenger://share?link=${encoded}`;
      setTimeout(() => {
        window.open(`https://www.facebook.com/dialog/send?link=${encoded}&app_id=&redirect_uri=${encoded}`, '_blank');
      }, 1500);
    } else {
      window.open(`https://www.facebook.com/dialog/send?link=${encoded}&app_id=&redirect_uri=${encoded}`, '_blank', 'width=600,height=400');
    }
  };

  const handleShareInstagram = async () => {
    const message = `${shareText}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Link copied! Opening Instagram...');

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Try to open Instagram app
        window.location.href = 'instagram://';
        setTimeout(() => {
          // Fallback to Instagram web if app not installed
          window.open('https://www.instagram.com/', '_blank');
        }, 1500);
      } else {
        window.open('https://www.instagram.com/direct/inbox/', '_blank');
      }
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="card p-8">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card max-w-2xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display text-text-primary">Share Your Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Share Mode Selection */}
        {shareMode === 'choose' && (
          <div className="space-y-4 mb-6">
            <p className="text-text-secondary mb-4">How would you like to share?</p>

            {/* Custom Image Option */}
            <button
              onClick={() => {
                setShareMode('image');
                generateShareImage();
              }}
              className="w-full p-6 border-2 border-primary rounded-xl hover:bg-purple-50 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">🖼️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-display text-text-primary mb-1 group-hover:text-primary transition-colors">
                    Generate Custom Share Image
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Create a beautiful image with your profile picture, background color, and a personalized message
                  </p>
                </div>
              </div>
            </button>

            {/* Normal Text Post Option */}
            <button
              onClick={() => setShareMode('text')}
              className="w-full p-6 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">📝</div>
                <div className="flex-1">
                  <h3 className="text-lg font-display text-text-primary mb-1 group-hover:text-gray-700 transition-colors">
                    Share as Text Post
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Share a simple text message with your profile link
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Custom Image Mode */}
        {shareMode === 'image' && (
          <>
            <button
              onClick={() => setShareMode('choose')}
              className="mb-4 text-primary hover:underline text-sm flex items-center gap-1"
            >
              ← Back to options
            </button>

            {generatingImage ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="spinner mb-4"></div>
                <p className="text-text-secondary">Generating your share image...</p>
              </div>
            ) : (
              <>
                {/* Profile Card Preview for Image Generation */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">Your custom share image:</p>
                  <div
                    ref={cardRef}
                    className="w-full rounded-2xl p-8 text-center shadow-xl relative overflow-hidden"
                    style={{ background: currentGradient }}
                  >
                    {/* Profile Photo */}
                    <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center text-white text-5xl font-display overflow-hidden mx-auto mb-4 border-4 border-white shadow-xl">
                      {userData?.photoURL ? (
                        <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        userData?.displayName?.[0] || currentUser?.email?.[0] || 'U'
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-display text-4xl text-gray-800 mb-3">
                      {userData?.displayName || 'User'}
                    </h3>

                    {/* Bio */}
                    {userData?.profile?.bio && (
                      <p className="text-gray-700 italic max-w-md mx-auto mb-4 text-base">
                        "{userData.profile.bio}"
                      </p>
                    )}

                    {/* Main Message */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-2xl">
                      <p className="text-2xl font-display text-primary mb-2">
                        💜 Come be my safety Bestie!
                      </p>
                      <p className="text-sm text-gray-600">
                        Join me on the Besties safety app
                      </p>
                    </div>

                    {/* Top 3 Badges */}
                    {badges.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Top Badges</p>
                        <div className="flex gap-4 justify-center">
                          {badges.map((badge) => (
                            <div key={badge.id} className="flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-md">
                              <div className="text-4xl mb-1">{badge.icon}</div>
                              <div className="text-xs font-semibold text-gray-700">{badge.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* App branding */}
                    <div className="mt-6 pt-4 border-t-2 border-white/40">
                      <div className="text-sm font-semibold text-gray-700">Download</div>
                      <div className="font-display text-2xl text-gray-800">Besties</div>
                      <div className="text-xs text-gray-600 mt-1">Your Safety Network</div>
                    </div>
                  </div>
                </div>

                {/* Generated Image Preview and Actions */}
                {generatedImageUrl && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">✅</span>
                      <p className="text-green-800 font-semibold">Image ready to share!</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={downloadImage}
                        className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                      >
                        📥 Download Image
                      </button>
                      <button
                        onClick={generateShareImage}
                        className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                      >
                        🔄 Regenerate
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 text-center mt-3">
                      Download the image and share it on Instagram, TikTok, or anywhere!
                    </p>
                  </div>
                )}

                {/* Quick Share with Image Buttons */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">Or share directly:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleShareWhatsApp}
                      className="btn bg-[#25D366] text-white hover:bg-[#20BA5A] flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </button>

                    <button
                      onClick={handleShareMessenger}
                      className="btn bg-[#0084FF] text-white hover:bg-[#0073E6] flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                      </svg>
                      Messenger
                    </button>

                    <button
                      onClick={handleShareInstagram}
                      className="btn bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </button>

                    <button
                      onClick={handleShareFacebook}
                      className="btn bg-[#1877F2] text-white hover:bg-[#166FE5] flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>

                    <button
                      onClick={handleShareTwitter}
                      className="btn bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X (Twitter)
                    </button>

                    <button
                      onClick={handleShareSMS}
                      className="btn bg-success text-white hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      SMS
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Text Mode */}
        {shareMode === 'text' && (
          <>
            <button
              onClick={() => setShareMode('choose')}
              className="mb-4 text-primary hover:underline text-sm flex items-center gap-1"
            >
              ← Back to options
            </button>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Your share message:</p>
              <p className="text-gray-800">{shareText}</p>
              <p className="text-sm text-primary mt-2">{shareUrl}</p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleShareWhatsApp}
                className="btn bg-[#25D366] text-white hover:bg-[#20BA5A] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>

              <button
                onClick={handleShareMessenger}
                className="btn bg-[#0084FF] text-white hover:bg-[#0073E6] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                </svg>
                Messenger
              </button>

              <button
                onClick={handleShareInstagram}
                className="btn bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </button>

              <button
                onClick={handleShareFacebook}
                className="btn bg-[#1877F2] text-white hover:bg-[#166FE5] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>

              <button
                onClick={handleShareTwitter}
                className="btn bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X (Twitter)
              </button>

              <button
                onClick={handleShareSMS}
                className="btn bg-success text-white hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                SMS
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              className="w-full btn btn-primary"
            >
              📋 Copy Link to Share
            </button>
          </>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          Share your profile with friends so they can join your safety network!
        </p>
      </div>
    </div>
  );
};

export default SocialShareCardsModal;
